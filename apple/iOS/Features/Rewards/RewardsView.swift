import SwiftUI

/// Rewards: a balance header with one dark action, stacked credit cards, wide reward bars, brand scratch cards
/// you really scratch, ticket-style coupons, and a history that names every source.
/// Ethics (Laws of UX ch. 12): rules and expiry are stated plainly; no "spend more to unlock".
struct RewardsView: View {
    @Environment(AppModel.self) private var model
    @State private var scratching: ScratchCard?
    @State private var showVouchers = false
    @State private var choosingBank = false
    @State private var destination: BankAccount.ID?
    @State private var shownBalance: Decimal = 0
    @State private var celebrating: Redemption?
    @State private var walletExpanded = false

    private struct Redemption: Identifiable { let id = UUID(); let amount: Decimal; let account: BankAccount }
    private var redeemable: Decimal { max(0, model.rewardsTotal - model.redeemedRewards) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ZB.Space.xl) {
                header
                creditsSection
                moreRewards
                scratchCards
                couponsRow
                history
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, 120)
            .frame(maxWidth: 680)
            .frame(maxWidth: .infinity)
        }
            .tracksTabBarScroll()
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Rewards")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Coupons") { showVouchers = true }.font(.subheadline.weight(.semibold))
            }
        }
        .fullScreenCover(item: $celebrating) { r in
            Celebration(amount: r.amount, account: r.account) {
                withAnimation(ZB.Motion.hero) {
                    model.redeemedRewards += r.amount
                    if let i = model.accounts.firstIndex(where: { $0.id == r.account.id }) { model.accounts[i].balance += r.amount }
                }
                choosingBank = false
                celebrating = nil
            }
            .environment(model)
        }
        .task {
            #if DEBUG
            try? await Task.sleep(for: .milliseconds(600))
            switch UserDefaults.standard.string(forKey: "ZBScreen") {
            case "reveal": scratching = model.scratchCards.first { !$0.revealed }
            case "redeem": celebrating = Redemption(amount: redeemable, account: model.primaryAccount)
            case "redeembank": choosingBank = true
            case "coupons": showVouchers = true
            default: break
            }
            #endif
        }
        .sheet(isPresented: $showVouchers) { CouponsSheet().presentationDetents([.large]).presentationCornerRadius(34) }
        .sheet(item: $scratching) { card in
            ScratchSheet(card: card) { revealed in
                guard let i = model.scratchCards.firstIndex(where: { $0.id == revealed.id }) else { return }
                model.scratchCards[i].revealed = true
                if revealed.isCash {
                    model.rewards.insert(Reward(kind: .scratch, title: "Surprise reward", source: revealed.from,
                                                amount: revealed.amount, date: Date()), at: 0)
                } else if let c = revealed.coupon {
                    model.vouchers.insert(c, at: 0)
                }
            }
            .presentationDetents([.height(620)])
            .presentationCornerRadius(36)
        }
    }

    // MARK: Balance header (MY BALANCE + one dark action)

    private var header: some View {
        VStack(alignment: .leading, spacing: ZB.Space.md) {
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("MY BALANCE").font(.system(size: 12, weight: .semibold, design: .rounded)).tracking(1.4).foregroundStyle(ZB.Palette.inkSecondary)
                    Text(Money.format(shownBalance, decimals: true))
                        .font(.system(size: 44, weight: .semibold, design: .rounded)).monospacedDigit()
                        .foregroundStyle(ZB.Palette.ink).minimumScaleFactor(0.6).lineLimit(1)
                        .contentTransition(.numericText(value: shownBalance.doubleValue))
                }
                Spacer(minLength: 8)
                if !choosingBank {
                    Button { destination = model.primaryAccount.id; withAnimation(ZB.Motion.standard) { choosingBank = true }; Haptics.tap() } label: {
                        Text(redeemable > 0 ? "Redeem" : "Nothing yet")
                            .font(.system(.subheadline, design: .rounded).weight(.semibold)).foregroundStyle(.white)
                            .padding(.horizontal, 22).frame(height: 46)
                            .background(redeemable > 0 ? Color(hex: 0x1A1B20) : Color(hex: 0x1A1B20).opacity(0.35), in: .capsule)
                    }
                    .buttonStyle(.plain).disabled(redeemable <= 0)
                    .transition(.scale(scale: 0.9).combined(with: .opacity))
                }
            }
            Text("Lifetime \(Money.format(model.rewardsTotal, decimals: true)) · Redeemed \(Money.format(model.redeemedRewards, decimals: true))")
                .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
            if choosingBank { redeemPanel.transition(.opacity.combined(with: .scale(scale: 0.97, anchor: .top))) }
        }
        .padding(.top, ZB.Space.sm)
        .animation(.spring(response: 0.5, dampingFraction: 0.85), value: choosingBank)
        .task {
            guard shownBalance == 0 else { return }
            let steps = 28
            for k in 1...steps {
                try? await Task.sleep(for: .milliseconds(28))
                let e = 1 - pow(1 - Double(k) / Double(steps), 3)
                withAnimation(.snappy(duration: 0.1)) { shownBalance = (redeemable * Decimal(e)).rounded(2) }
            }
            shownBalance = redeemable
        }
    }

    /// "Redeem to" sits right under the balance, not in a system sheet at the bottom.
    private var redeemPanel: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Redeem to").font(.footnote.weight(.semibold)).foregroundStyle(ZB.Palette.inkSecondary)
            ForEach(model.accounts) { a in
                let on = (destination ?? model.primaryAccount.id) == a.id
                Button { destination = a.id; Haptics.tap() } label: {
                    HStack(spacing: 12) {
                        BankLogo(bankName: a.bankName, height: 34)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(a.bankName).font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.ink)
                            Text("\(a.kind) •• \(a.last4)").font(.caption).foregroundStyle(ZB.Palette.inkSecondary)
                        }
                        Spacer()
                        Image(systemName: on ? "checkmark.circle.fill" : "circle").font(.title3)
                            .foregroundStyle(on ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                    }
                    .padding(10)
                    .background(ZB.Palette.surface, in: .rect(cornerRadius: 16, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(on ? ZB.Palette.ink : .clear, lineWidth: 1.5))
                }
                .buttonStyle(.plain)
            }
            HStack(spacing: 10) {
                Button { withAnimation(ZB.Motion.standard) { choosingBank = false } } label: {
                    Text("Cancel").font(.headline).foregroundStyle(ZB.Palette.ink)
                        .frame(width: 104, height: 52).background(ZB.Palette.surface, in: .capsule)
                }
                Button {
                    let acct = model.accounts.first { $0.id == (destination ?? model.primaryAccount.id) } ?? model.primaryAccount
                    celebrating = Redemption(amount: redeemable, account: acct)
                } label: {
                    Text("Send \(Money.format(redeemable, decimals: true))").font(.headline).foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 52).background(Color(hex: 0x1A1B20), in: .capsule)
                }
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: Reward wallet (stacked cards; tap to expand)

    private var creditsSection: some View {
        let cashItems = model.rewards.filter { $0.kind == .cashback }
        let referItems = model.rewards.filter { $0.kind == .referral || $0.kind == .milestone }
        let winItems = model.rewards.filter { $0.kind == .scratch }
        func total(_ r: [Reward]) -> Decimal { r.reduce(Decimal(0)) { $0 + $1.amount } }
        return VStack(alignment: .leading, spacing: ZB.Space.sm) {
            HStack {
                Label("Reward wallet", systemImage: "wallet.bifold").font(.title3.weight(.semibold))
                Spacer()
                Text(walletExpanded ? "Tap to collapse" : "Tap to expand").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    .contentTransition(.opacity)
            }
            CreditStack(items: [
                .init(title: "Surprise wins", amount: total(winItems), count: winItems.count, color: Color(hex: 0xFF7A2F), art: .symbol("gift.fill")),
                .init(title: "Referrals & bonuses", amount: total(referItems), count: referItems.count, color: Color(hex: 0x2B59FF), art: .symbol("person.2.fill")),
                .init(title: "Cashback", amount: total(cashItems), count: cashItems.count, color: Color(hex: 0x0B0C10), art: .logo),
            ], expanded: $walletExpanded)
            .padding(.top, 4)
            .padding(.bottom, 4)
        }
    }

    // MARK: More rewards (wide bars)

    private var moreRewards: some View {
        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            HStack {
                Text("More rewards for you").font(.title3.weight(.semibold))
                Spacer()
                NavigationLink("View all") { InviteEarnView() }.font(.subheadline.weight(.semibold))
            }
            ScrollView(.horizontal) {
                HStack(spacing: ZB.Space.sm) {
                    NavigationLink { InviteEarnView() } label: {
                        RewardBar(title: "Earn ₹100", sub: "when you refer your friends", symbol: "person.2.fill", colors: [Color(hex: 0x2B59FF), Color(hex: 0x6F8BFF)])
                    }
                    ShareLink(item: "Here's ₹21 on me – make your first payment on Zenbit: https://zenbit.app/g/AARAV21") {
                        RewardBar(title: "Gift ₹21", sub: "free cash to your friends", symbol: "gift.fill", colors: [Color(hex: 0x0B8F5A), Color(hex: 0x1FD08A)])
                    }
                    Button { model.showAI = true } label: {
                        RewardBar(title: "Earn ₹100", sub: "on your first split", symbol: "divide", colors: [Color(hex: 0xFF7A2F), Color(hex: 0xFFB05F)])
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
            .buttonStyle(.plain)
        }
    }

    // MARK: Surprise rewards (brand foil cards)

    @ViewBuilder private var scratchCards: some View {
        if !model.scratchCards.isEmpty {
            VStack(alignment: .leading, spacing: ZB.Space.sm) {
                SectionHeader(title: "Surprise rewards")
                ScrollView(.horizontal) {
                    HStack(spacing: ZB.Space.sm) {
                        ForEach(model.scratchCards) { card in
                            Button { if !card.revealed { scratching = card } } label: { SurpriseTile(card: card) }
                                .zbPressable()
                        }
                    }
                    .padding(.vertical, 4)
                }
                .scrollIndicators(.hidden)
                .scrollClipDisabled()
            }
        }
    }

    // MARK: Coupons preview row

    private var couponsRow: some View {
        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            HStack {
                Text("Your coupons").font(.title3.weight(.semibold))
                Spacer()
                Button("See all") { showVouchers = true }.font(.subheadline.weight(.semibold))
            }
            ScrollView(.horizontal) {
                HStack(spacing: ZB.Space.sm) {
                    ForEach(model.vouchers.prefix(4)) { v in
                        Button { showVouchers = true } label: { CouponTicket(voucher: v).frame(width: 330) }.buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 6)
            }
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
        }
    }

    // MARK: History (where every reward came from)

    private var history: some View {
        VStack(alignment: .leading, spacing: ZB.Space.xs) {
            Text("Cashback history").font(.title3.weight(.semibold))
            Label("Cashback expires 6 months after you earn it", systemImage: "info.circle")
                .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
            VStack(spacing: 0) {
                ForEach(model.rewards) { r in
                    HStack(spacing: ZB.Space.sm) {
                        Image(systemName: r.kind.symbol)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(ZB.Palette.ink)
                            .frame(width: 44, height: 44)
                            .background(ZB.Palette.surface, in: .rect(cornerRadius: 14, style: .continuous))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(r.source).font(.subheadline.weight(.semibold)).lineLimit(2)
                            Text("\(r.title) · \(r.date.formatted(.dateTime.day().month(.abbreviated).year(.twoDigits)))")
                                .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                        }
                        Spacer(minLength: ZB.Space.xs)
                        Text(r.amount > 0 ? Money.format(r.amount, decimals: true) : "Voucher")
                            .font(.zbAmountRow).monospacedDigit()
                    }
                    .padding(.vertical, ZB.Space.sm)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    if r.id != model.rewards.last?.id { Divider().overlay(ZB.Palette.hairline).padding(.leading, 56) }
                }
            }
            .padding(.top, ZB.Space.xs)
            .animation(ZB.Motion.standard, value: model.rewards.count)
        }
    }
}

// MARK: - Invite & earn (reference: Refer & Earn)

struct InviteEarnView: View {
    @Environment(AppModel.self) private var model
    @State private var query = ""
    @State private var invited: Set<UUID> = []
    @Environment(\.zbTabBarInset) private var tabBarInset
    private let link = "Join me on Zenbit – we both get ₹100 after your first payment: https://zenbit.app/r/AARAV"

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ZB.Space.xl) {
                (Text("Refer & earn ") + Text("₹700").foregroundStyle(ZB.Palette.greenInk))
                    .font(.system(.largeTitle, design: .rounded).weight(.heavy))
                    .frame(maxWidth: .infinity)
                howItWorks
                VStack(alignment: .leading, spacing: ZB.Space.sm) {
                    HStack(spacing: ZB.Space.xs) {
                        Image(systemName: "magnifyingglass").foregroundStyle(ZB.Palette.inkSecondary)
                        TextField("", text: $query, prompt: Text("Search by contact name").foregroundStyle(ZB.Palette.inkSecondary))
                    }
                    .padding(.horizontal, ZB.Space.md)
                    .frame(height: 52)
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(ZB.Palette.hairline, lineWidth: 1.5))
                    Text("Your contacts").font(.title3.weight(.semibold)).padding(.top, ZB.Space.sm)
                    ForEach(people) { c in
                        HStack(spacing: ZB.Space.sm) {
                            AvatarView(contact: c, size: 44)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(c.name).font(.body.weight(.medium))
                                Text(c.isOnUPI ? "Already on Zenbit" : c.maskedPhone).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                            }
                            Spacer()
                            Button(invited.contains(c.id) ? "Invited" : "Invite") {
                                invited.insert(c.id); Haptics.tap()
                            }
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(ZB.Palette.ink)
                            .padding(.horizontal, 16).frame(minHeight: 36)
                            .overlay(Capsule().strokeBorder(ZB.Palette.hairline, lineWidth: 1.5))
                            .disabled(invited.contains(c.id))
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, 140)
            .frame(maxWidth: 680)
            .frame(maxWidth: .infinity)
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Invite & earn")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: ZB.Space.xs) {
                ShareLink(item: link) { Label("Invite via WhatsApp", systemImage: "message.fill") }
                    .buttonStyle(.zbPrimary)
                ShareLink(item: link) {
                    Image(systemName: "square.and.arrow.up").font(.headline).foregroundStyle(ZB.Palette.ink)
                        .frame(width: 56, height: 54)
                        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(ZB.Palette.hairline, lineWidth: 1.5))
                }
                .accessibilityLabel("Share invite link")
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.top, ZB.Space.xs)
            .padding(.bottom, ZB.Space.xs + tabBarInset)
            .background(ZB.Palette.canvas)
        }
    }

    private var people: [Contact] {
        let all = model.contacts.filter { !$0.isMerchant }
        return query.isEmpty ? all : all.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    private var howItWorks: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("HOW IT WORKS").font(.system(.caption, design: .monospaced).weight(.bold)).tracking(1.5)
                .foregroundStyle(ZB.Palette.inkSecondary)
                .padding(.bottom, ZB.Space.sm)
            step("Invite 4 friends to", "Zenbit UPI", "+₹100")
            Divider().overlay(ZB.Palette.hairline)
            step("A friend gets their", "Zenbit Card", "+₹500")
            Divider().overlay(ZB.Palette.hairline)
            step("A friend makes their", "first split", "+₹100")
        }
        .padding(ZB.Space.lg)
        .background(alignment: .bottomTrailing) {
            BanknoteArt(amount: "₹100").scaleEffect(0.9).rotationEffect(.degrees(-14)).offset(x: 30, y: 26).opacity(0.9)
        }
        .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        .clipShape(.rect(cornerRadius: ZB.Radius.lg, style: .continuous))
    }

    private func step(_ a: String, _ b: String, _ amount: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(a).font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                Text(b).font(.headline)
            }
            Spacer()
            Text(amount).font(.system(.title2, design: .rounded).weight(.bold))
        }
        .padding(.vertical, ZB.Space.sm)
    }
}

#Preview { NavigationStack { RewardsView() }.environment(AppModel()) }
