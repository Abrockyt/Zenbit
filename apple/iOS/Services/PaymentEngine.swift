import Foundation

// MARK: - Simulation (so every edge case can be demoed without a bank)

enum SimulationMode: String, CaseIterable, Identifiable, Codable {
    /// Realistic: magic amounts trigger edge cases (₹404 → bank down, ₹504 → timeout/pending).
    case auto
    case alwaysSucceed
    case pending
    case bankDown
    case slowNetwork

    var id: String { rawValue }
    var title: String {
        switch self {
        case .auto: "Realistic (magic amounts)"
        case .alwaysSucceed: "Always succeed"
        case .pending: "Bank pending / timeout"
        case .bankDown: "Recipient bank down"
        case .slowNetwork: "Slow network (4 s)"
        }
    }
}

enum FlowMode: String { case pay, request }

struct PaymentRequest {
    var payee: Contact
    var amount: Decimal
    var note: String
    var account: BankAccount
    var viaLite: Bool
}

enum PaymentOutcome {
    case success(Transaction)
    case pending(Transaction)
    case failure(Transaction)

    var transaction: Transaction {
        switch self {
        case .success(let t), .pending(let t), .failure(let t): t
        }
    }
}

// MARK: - Limits (NPCI defaults for P2P UPI)

enum Limits {
    static let perTransaction: Decimal = 1_00_000
    static let perDay: Decimal = 1_00_000
    static let liteMaxPerTxn: Decimal = 500
    static let firstTimeLargeAmount: Decimal = 10_000
    static let duplicateWindow: TimeInterval = 10 * 60
    static let pinLength = 4
    static let maxPinAttempts = 3
    static let lockout: TimeInterval = 30 // demo value; real banks lock for 24 h
}

// MARK: - Validation (Tesler's law: the system absorbs the complexity, not the user)

enum AmountIssue: Equatable {
    case exceedsBalance(Decimal)
    case exceedsPerTransaction
    case exceedsDaily(remaining: Decimal)
    case notOnUPI

    var message: String {
        switch self {
        case .exceedsBalance(let b): "More than your balance of \(Money.format(b))"
        case .exceedsPerTransaction: "UPI allows up to \(Money.format(Limits.perTransaction)) per payment"
        case .exceedsDaily(let r): r > 0 ? "You can send \(Money.format(r)) more today" : "You've reached today's UPI limit"
        case .notOnUPI: "This contact isn't on UPI yet"
        }
    }
}

enum PaymentWarning: Equatable, Identifiable {
    case duplicate(Transaction)
    case firstTimeLarge
    var id: String {
        switch self {
        case .duplicate: "dup"
        case .firstTimeLarge: "large"
        }
    }
}

struct PaymentValidator {
    let account: BankAccount
    let history: [Transaction]

    func issue(for amount: Decimal, payee: Contact, mode: FlowMode) -> AmountIssue? {
        if !payee.isOnUPI { return .notOnUPI }
        guard mode == .pay, amount > 0 else { return nil }
        if amount > Limits.perTransaction { return .exceedsPerTransaction }
        let remaining = Limits.perDay - sentToday
        if amount > remaining { return .exceedsDaily(remaining: max(0, remaining)) }
        return nil
    }

    /// Soft warnings – shown before PIN, never block (people stay in control).
    func warnings(for amount: Decimal, payee: Contact) -> [PaymentWarning] {
        var out: [PaymentWarning] = []
        let now = Date()
        if let dup = history.first(where: {
            $0.counterparty.upiID == payee.upiID && $0.amount == amount && $0.direction == .sent
                && $0.status != .failed && now.timeIntervalSince($0.date) < Limits.duplicateWindow
        }) { out.append(.duplicate(dup)) }
        let paidBefore = history.contains { $0.counterparty.upiID == payee.upiID && $0.direction == .sent && $0.status == .success }
        if !paidBefore && amount >= Limits.firstTimeLargeAmount { out.append(.firstTimeLarge) }
        return out
    }

    var sentToday: Decimal {
        let cal = Calendar.current
        return history
            .filter { $0.direction == .sent && $0.status != .failed && cal.isDateInToday($0.date) }
            .reduce(0) { $0 + $1.amount }
    }
}

// MARK: - UPI PIN vault (demo PIN 1234)

struct PinVault {
    var demoPIN = "1234"
    var attemptsLeft = Limits.maxPinAttempts
    var lockedUntil: Date?

    var isLocked: Bool { (lockedUntil ?? .distantPast) > Date() }

    enum Result { case ok, wrong(left: Int), locked(until: Date) }

    mutating func verify(_ pin: String) -> Result {
        if let until = lockedUntil, until > Date() { return .locked(until: until) }
        if pin == demoPIN {
            attemptsLeft = Limits.maxPinAttempts
            lockedUntil = nil
            return .ok
        }
        attemptsLeft -= 1
        if attemptsLeft <= 0 {
            let until = Date().addingTimeInterval(Limits.lockout)
            lockedUntil = until
            attemptsLeft = Limits.maxPinAttempts
            return .locked(until: until)
        }
        return .wrong(left: attemptsLeft)
    }
}

// MARK: - Simulated switch

struct SimulatedPaymentNetwork {
    var mode: SimulationMode

    func execute(_ req: PaymentRequest) async -> PaymentOutcome {
        let latencyMS: Int = switch mode {
        case .slowNetwork: 4_000
        case .pending: 2_400
        default: Int.random(in: 1_100...1_600) // ≥ 1 s on purpose: a payment that "lands" too fast feels unsafe.
        }
        try? await Task.sleep(for: .milliseconds(latencyMS))

        var tx = Transaction(counterparty: req.payee, amount: req.amount, direction: .sent, status: .success,
                             date: Date(), note: req.note, category: Self.guessCategory(req),
                             upiRef: Ref.upi(), txnID: Ref.txn(),
                             accountMasked: req.viaLite ? "UPI Lite" : req.account.masked)

        // Like every UPI app: the balance is never shown up front. The bank checks it after the PIN and declines.
        if !req.viaLite && req.amount > req.account.balance {
            tx.status = .failed
            tx.failureCode = "insufficient_funds"
            tx.failureReason = "Your bank declined this payment because of insufficient funds. No money was debited."
            return .failure(tx)
        }

        let effective: SimulationMode = {
            guard mode == .auto else { return mode }
            if req.amount == 404 { return .bankDown }
            if req.amount == 504 { return .pending }
            return .alwaysSucceed
        }()

        switch effective {
        case .bankDown:
            tx.status = .failed
            tx.failureReason = "\(req.payee.bankName) isn't responding right now. No money left your account."
            return .failure(tx)
        case .pending:
            tx.status = .pending
            tx.failureReason = "The bank is taking longer than usual. Don't pay again – we'll update you within 2 hours, and any debit is auto-reversed in 48 hours."
            return .pending(tx)
        default:
            return .success(tx)
        }
    }

    static func guessCategory(_ req: PaymentRequest) -> TxCategory {
        let text = (req.note + " " + req.payee.name).lowercased()
        let map: [(TxCategory, [String])] = [
            (.food, ["lunch", "dinner", "coffee", "food", "cafe", "tea", "pizza", "snack", "brew"]),
            (.groceries, ["grocer", "mart", "basket", "milk", "vegetable"]),
            (.transport, ["cab", "auto", "uber", "ola", "metro", "fuel", "petrol"]),
            (.rent, ["rent", "flat", "pg"]),
            (.bills, ["bill", "electric", "recharge", "wifi", "bescom", "gas"]),
            (.entertainment, ["movie", "concert", "ticket", "netflix"]),
            (.shopping, ["shop", "order", "amazon", "clothes"]),
            (.health, ["doctor", "medicine", "pharma", "gym"]),
        ]
        return map.first { $0.1.contains(where: text.contains) }?.0 ?? .transfer
    }
}
