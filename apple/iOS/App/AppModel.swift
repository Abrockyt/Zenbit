import SwiftUI
import Observation

enum Appearance: String, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var scheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

enum AppTab: Hashable { case home, history, rewards, ai, profile, pay }

/// Everything needed to start the pay/request flow.
struct PayFlowConfig: Identifiable, Equatable {
    let id = UUID()
    var payee: Contact
    var mode: FlowMode = .pay
    var presetAmount: Decimal? = nil
    var note: String = ""
    /// Merchant QR codes with a fixed amount can't be edited.
    var amountLocked = false
    var source = "unknown"
    /// Debug-only: jump straight to a stage for screenshots.
    var debugStage: String? = nil

    static func == (l: Self, r: Self) -> Bool { l.id == r.id }
}

/// Single source of truth for the app (Observation framework).
@Observable
final class AppModel {
    // Session
    var hasOnboarded: Bool { didSet { defaults.set(hasOnboarded, forKey: "onboarded") } }
    var isLocked = false

    // Data
    var profile = SampleData.profile
    var accounts = SampleData.accounts
    var contacts = SampleData.contacts
    var transactions = SampleData.transactions
    /// Empty until the first payment (then a request arrives). Persisted so it survives relaunch.
    var requests: [MoneyRequest] = []
    let flaggedRequests = SampleData.flaggedRequests
    let watchLink = WatchLink.shared
    private var firstPaymentDone = false
    var rewards = SampleData.rewards
    var scratchCards = SampleData.scratchCards
    var vouchers = SampleData.vouchers
    /// super.money-style flat cashback on every successful payment.
    let cashbackRate: Decimal = 0.005

    // Preferences
    var appearance: Appearance { didSet { defaults.set(appearance.rawValue, forKey: "appearance") } }
    var appLockEnabled: Bool { didSet { defaults.set(appLockEnabled, forKey: "appLock") } }
    /// NPCI on-device biometric authentication for UPI (up to ₹5,000) – falls back to PIN.
    var faceIDPayEnabled = true
    var upiLiteEnabled = true
    var liteBalance: Decimal = 1_850
    var notificationsEnabled = true
    var simulation: SimulationMode = .auto
    var pinVault = PinVault()

    // Balance privacy: hidden by default, revealed for 30 s after PIN.
    var balanceRevealedUntil: Date?
    var isBalanceVisible: Bool { (balanceRevealedUntil ?? .distantPast) > Date() }

    // Navigation
    var selectedTab: AppTab = .home
    var previousTab: AppTab = .home
    var tabBarMinimized = false
    /// Cashback already paid out to the bank (or expired).
    var redeemedRewards: Decimal = 104.20
    var activeFlow: PayFlowConfig?
    var showScanner = false
    var showAI = false
    var debugGetPaid = false
    var debugWatch = false
    var toast: Toast?

    private let defaults = UserDefaults.standard

    init() {
        hasOnboarded = defaults.bool(forKey: "onboarded")
        appearance = .light
        appLockEnabled = defaults.object(forKey: "appLock") as? Bool ?? false
        firstPaymentDone = defaults.bool(forKey: "firstPaymentDone")
        requests = firstPaymentDone ? SampleData.requests : []
    }

    // MARK: Derived
    var primaryAccount: BankAccount { accounts.first(where: \.isPrimary) ?? accounts[0] }
    var totalBalance: Decimal { accounts.reduce(0) { $0 + $1.balance } }
    var favorites: [Contact] { contacts.filter { $0.isFavorite && !$0.isMerchant } }

    /// People ordered by recency (serial-position effect: most recent first).
    var recentPeople: [Contact] {
        var seen = Set<String>()
        var out: [Contact] = []
        for t in transactions where !t.counterparty.isMerchant {
            if seen.insert(t.counterparty.name).inserted { out.append(t.counterparty) }
        }
        for c in contacts where !c.isMerchant && seen.insert(c.name).inserted { out.append(c) }
        return out
    }

    func lastPayment(to c: Contact) -> Transaction? {
        transactions.first { $0.counterparty.upiID == c.upiID && $0.direction == .sent && $0.status == .success }
    }

    func validator(for account: BankAccount) -> PaymentValidator {
        PaymentValidator(account: account, history: transactions)
    }

    // MARK: Actions
    func startPay(_ c: Contact, amount: Decimal? = nil, note: String = "", locked: Bool = false,
                  mode: FlowMode = .pay, source: String) {
        Analytics.track("pay_flow_start", ["source": source, "mode": mode.rawValue])
        activeFlow = PayFlowConfig(payee: c, mode: mode, presetAmount: amount, note: note,
                                   amountLocked: locked, source: source)
    }

    /// Widget / Control Center deep links: zenbit://scan | receive | rewards | history | pay/<firstname>
    func handleWidgetLink(_ url: URL) {
        activeFlow = nil
        switch url.host() ?? "" {
        case "scan": showScanner = true
        case "receive": selectedTab = .home; debugGetPaid = true
        case "rewards": selectedTab = .rewards
        case "history": selectedTab = .history
        case "pay":
            let name = url.pathComponents.dropFirst().first?.lowercased() ?? ""
            if let c = contacts.first(where: { $0.firstName.lowercased() == name }) { startPay(c, source: "widget") }
            else { selectedTab = .pay }
        default: break
        }
        // Only the kind of link: the rest of a pay or upi:// link can hold a name, UPI ID or amount.
        Analytics.track("widget_open", ["link": url.host() ?? "unknown"])
    }

    /// Push a small snapshot to a connected watch (name, balance, recent payments – nothing that can move money).
    func syncWatch() {
        guard watchLink.state == .paired else { return }
        let txs = transactions.prefix(8).map {
            WatchSnapshot.Tx(id: $0.id.uuidString, name: $0.counterparty.name, amount: $0.amount.doubleValue,
                             received: $0.direction == .received, status: $0.status == .success ? "success" : ($0.status == .failed ? "failed" : "pending"),
                             date: $0.date, ref: $0.upiRef)
        }
        watchLink.push(WatchSnapshot(name: profile.name, upiID: profile.upiID, balance: totalBalance.doubleValue,
                                     txs: Array(txs), updated: .now))
    }

    func record(_ outcome: PaymentOutcome, from accountID: BankAccount.ID, viaLite: Bool) {
        let tx = outcome.transaction
        transactions.insert(tx, at: 0)
        guard tx.status != .failed else { return }
        if tx.status == .success {
            _ = earnCashback(for: tx)
            if !firstPaymentDone {
                firstPaymentDone = true
                defaults.set(true, forKey: "firstPaymentDone")
                Task { @MainActor in
                    try? await Task.sleep(for: .seconds(2.5))
                    withAnimation(ZB.Motion.standard) { requests = SampleData.requests }
                }
            }
        }
        if viaLite {
            liteBalance -= tx.amount
        } else if let i = accounts.firstIndex(where: { $0.id == accountID }) {
            accounts[i].balance -= tx.amount
        }
        syncWatch()
    }

    var rewardsTotal: Decimal { rewards.reduce(0) { $0 + $1.amount } }

    /// 0.5% back, rounded to paise, minimum ₹0.10. Returns what was credited.
    @discardableResult
    func earnCashback(for tx: Transaction) -> Decimal {
        var raw = tx.amount * cashbackRate
        var rounded = Decimal()
        NSDecimalRound(&rounded, &raw, 2, .plain)
        let amount = max(rounded, 0.10)
        rewards.insert(Reward(kind: .cashback, title: "0.5% cashback",
                              source: "Paid \(Money.format(tx.amount)) to \(tx.counterparty.name)",
                              amount: amount, date: Date()), at: 0)
        if tx.amount >= 500 {
            // Surprise: ~55% cash, ~20% coupon, ~25% better luck next time.
            let roll = Int.random(in: 0..<100)
            var card = ScratchCard(amount: 0, from: "Payment to \(tx.counterparty.firstName)")
            if roll < 55 { card.amount = Decimal(Int.random(in: 5...60)) }
            else if roll < 75 {
                card.coupon = Voucher(brand: "CineMax", offer: "Buy 1 get 1 on movie tickets", code: "ZENB1G1", symbol: "film.fill",
                                      hue: 0.75, expires: Date().addingTimeInterval(86_400 * 12))
            }
            scratchCards.insert(card, at: 0)
        }
        return amount
    }

    func recordRequest(to c: Contact, amount: Decimal, note: String) {
        Analytics.track("request_sent")
        showToast("Requested \(Money.format(amount)) from \(c.firstName)", symbol: "arrow.down.left.circle.fill")
    }

    func revealBalance() {
        withAnimation(ZB.Motion.standard) { balanceRevealedUntil = Date().addingTimeInterval(30) }
    }

    func hideBalance() {
        withAnimation(ZB.Motion.standard) { balanceRevealedUntil = nil }
    }

    func showToast(_ message: String, symbol: String = "checkmark.circle.fill") {
        withAnimation(ZB.Motion.standard) { toast = Toast(message: message, symbol: symbol) }
        let id = toast?.id
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(2.2))
            if toast?.id == id { withAnimation(ZB.Motion.standard) { toast = nil } }
        }
    }

    func resolve(link: UPILink) -> Contact {
        if let known = contacts.first(where: { $0.upiID.lowercased() == link.payeeVPA }) { return known }
        return Contact(name: link.payeeName, upiID: link.payeeVPA, phone: "",
                       hue: Double(abs(link.payeeVPA.hashValue % 100)) / 100,
                       isMerchant: link.amount != nil)
    }

    func signOut() {
        hasOnboarded = false
        selectedTab = .home
        balanceRevealedUntil = nil
    }

    // MARK: Debug launch routing (for screenshots/UI review): -ZBScreen <name> -ZBAppearance dark
    func applyLaunchArguments() {
        #if DEBUG
        let args = UserDefaults.standard

        guard let screen = args.string(forKey: "ZBScreen") else { return }
        hasOnboarded = !["onboarding", "notify", "signin", "bank", "o-phone", "o-otp", "o-pin", "o-done"].contains(screen)
        let riya = SampleData.contact("Riya")
        switch screen {
        case "history": selectedTab = .history
        case "rewards", "redeem", "redeembank", "reveal", "coupons": selectedTab = .rewards
        case "ai": showAI = true
        case "profile": selectedTab = .profile
        case "pay": selectedTab = .pay
        case "balance": revealBalance()
        case "getpaid": debugGetPaid = true
        case "watch", "watchrequest":
            selectedTab = .profile; debugWatch = true
            if screen == "watchrequest" {
                watchLink.incoming = WatchPairRequest(code: "482913", watchName: "Aarav's Apple Watch", at: .now)
            }
        case "lowfunds":
            var f = PayFlowConfig(payee: riya, presetAmount: 60_000, note: "Rent", source: "debug")
            f.debugStage = "pin"
            activeFlow = f
        case "amount", "pin", "success", "failure", "pending", "review":
            var f = PayFlowConfig(payee: riya, presetAmount: screen == "amount" ? nil : 250, note: "Lunch 🍜", source: "debug")
            f.debugStage = screen
            activeFlow = f
        default: break
        }
        #endif
    }
}
