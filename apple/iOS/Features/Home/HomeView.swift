import SwiftUI
import Charts

/// Home, GPay structure in Apple's language:
/// illustrated hero (QR + profile) → four primary actions → requests → People → Businesses → Manage money,
/// with a floating Liquid Glass "New payment" pill that condenses to a "+" while scrolling.
/// Priority follows frequency of use (Pareto) and the layout people already know (Jakob).
struct HomeView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.horizontalSizeClass) private var hSize
    @State private var checkingBalance = false
    @State private var showGetPaid = false
    @State private var showAllPeople = false
    @State private var path = NavigationPath()
    @State private var width: CGFloat = 400
    @State private var scrolled = false
    @Environment(\.zbTabBarInset) private var tabBarInset

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(spacing: 0) {
                    HomeHero(height: hSize == .regular ? 330 : 300)
                        .overlay(alignment: .top) { heroControls }
                    content
                        .padding(.horizontal, ZB.Space.margin)
                        .padding(.bottom, 90)
                        .frame(maxWidth: width >= 980 ? 1100 : 680)
                        .frame(maxWidth: .infinity)
                }
            }
            .tracksTabBarScroll()
            .overlay(alignment: .top) {
                // Status-bar scrim once content scrolls under the clock (laid out before the
                // safe-area ignore, so it starts at the very top of the screen).
                LinearGradient(colors: [ZB.Palette.canvas, ZB.Palette.canvas.opacity(0.85), ZB.Palette.canvas.opacity(0)],
                               startPoint: .top, endPoint: .bottom)
                    .frame(height: IslandGeometry.windowTopInset + 20)
                    .opacity(scrolled ? 1 : 0)
                    .animation(.easeInOut(duration: 0.25), value: scrolled)
                    .allowsHitTesting(false)
            }
            .ignoresSafeArea(edges: .top)
            .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width = $0 }
            .onScrollGeometryChange(for: Bool.self) { $0.contentOffset.y > 160 } action: { _, v in
                withAnimation(ZB.Motion.standard) { scrolled = v }
            }
            .minimizesTabBar()
            .background(ZB.Palette.canvas)
            .toolbarVisibility(.hidden, for: .navigationBar)
            .overlay(alignment: .bottomTrailing) { scanButton }
            .navigationDestination(for: HomeRoute.self) { route in
                switch route {
                case .notifications: NotificationsView()
                case .rewards: RewardsView()
                case .card: CreditCardPage()
                case .fd: FixedDepositPage()
                case .offer: OfferPage(offer: .food)
                }
            }
            .navigationDestination(for: Transaction.self) { TransactionDetailView(tx: $0) }
            .sheet(isPresented: $checkingBalance) { BalanceSheet() }
            .sheet(isPresented: $showGetPaid) { GetPaidSheet() }
            .onAppear {
                if model.debugGetPaid { model.debugGetPaid = false; showGetPaid = true }
                #if DEBUG
                switch UserDefaults.standard.string(forKey: "ZBScreen") {
                case "rewards" where path.isEmpty: path.append(HomeRoute.rewards)
                case "card" where path.isEmpty: path.append(HomeRoute.card)
                case "notifications" where path.isEmpty: path.append(HomeRoute.notifications)
                case "fd" where path.isEmpty: path.append(HomeRoute.fd)
                case "offer" where path.isEmpty: path.append(HomeRoute.offer)
                case "reveal", "redeem", "invite": if path.isEmpty { path.append(HomeRoute.rewards) }
                default: break
                }
                #endif
            }
        }
    }

    // MARK: Hero controls (glass, sits on the illustration)

    private var heroControls: some View {
        HStack(spacing: ZB.Space.xs) {
            Button { model.selectedTab = .profile } label: {
                AvatarView(contact: model.profile.asContact, size: 40)
                    .padding(2)
                    .glassEffect(.regular.interactive(), in: .circle)
            }
            .accessibilityLabel("Profile")
            Spacer()
            // Rewards = a gift icon (the amount lives on the Rewards page).
            GlassIconButton(systemName: "gift", label: "Rewards") { path.append(HomeRoute.rewards) }
            // Zen AI sits beside the bell.
            GlassIconButton(systemName: "sparkles", label: "Zen AI") { model.showAI = true }
            GlassIconButton(systemName: "bell", label: "Notifications") { path.append(HomeRoute.notifications) }
                .overlay(alignment: .topTrailing) {
                    Circle().fill(ZB.Palette.danger).frame(width: 10, height: 10)
                        .overlay(Circle().strokeBorder(ZB.Palette.canvas, lineWidth: 2))
                        .offset(x: -2, y: 2)
                        .accessibilityHidden(true)
                }
        }
        .padding(.horizontal, ZB.Space.md)
        .padding(.top, IslandGeometry.windowTopInset + 4)
    }

    @ViewBuilder private var content: some View {
        if width >= 980 {
            HStack(alignment: .top, spacing: ZB.Space.xxl) {
                VStack(spacing: ZB.Space.xxl) { actions; RewardsTeaser(); RechargeGrid(); CardTeaser(); manageMoney; insight }
                VStack(spacing: ZB.Space.xxl) { requests; people; MoreForYou(); SponsoredBanner(); NextForYou(); GiftBanner(); businesses; SafetyVideoCard() }
            }
        } else {
            // Requests first – and only when there are any (the section disappears when empty).
            VStack(spacing: ZB.Space.xxl) {
                actions
                requests
                people
                MoreForYou()
                RewardsTeaser()
                SponsoredBanner()
                RechargeGrid()
                NextForYou()
                CardTeaser()
                CompleteProfileCard()
                GiftBanner()
                businesses
                manageMoney
                insight
                SafetyVideoCard()
            }
        }
    }

    // MARK: Actions

    private var actions: some View {
        VStack(spacing: ZB.Space.md) {
            HStack(alignment: .top, spacing: ZB.Space.xs) {
                ActionTile(title: "Pay phone\nnumber", symbol: "person.crop.rectangle.stack") { model.selectedTab = .pay }
                ActionTile(title: "Pay UPI ID\nor bank", symbol: "building.columns") { model.selectedTab = .pay }
                ActionTile(title: "Check\nbalance", symbol: "wallet.bifold") { checkingBalance = true }
                ActionTile(title: "Get\npaid", symbol: "arrow.down.left") { showGetPaid = true }
            }
            ScrollView(.horizontal) {
                HStack(spacing: ZB.Space.xs) {
                    ChipButton(title: "My QR code", symbol: "qrcode") { showGetPaid = true }
                    ChipButton(title: "UPI ID: \(model.profile.upiID)", symbol: "doc.on.doc") {
                        Clipboard.copy(model.profile.upiID, label: "UPI ID", model: model)
                    }
                    ChipButton(title: "UPI Lite \(Money.format(model.liteBalance))", symbol: "bolt.fill") { model.selectedTab = .profile }
                    ChipButton(title: "Split an expense", symbol: "person.2") { model.showAI = true }
                }
            }
            .scrollIndicators(.hidden)
            .scrollClipDisabled(hSize != .regular)
        }
        .padding(.top, ZB.Space.xs)
    }

    // MARK: Requests

    @ViewBuilder private var requests: some View {
        if !model.requests.isEmpty {
            VStack(alignment: .leading, spacing: ZB.Space.sm) {
                SectionHeader(title: "Requests")
                VStack(spacing: ZB.Space.xs) {
                    ForEach(model.requests) { r in RequestCard(request: r) }
                }
            }
        }
    }

    // MARK: People (photos, 4 columns, "More" expands in place)

    private var people: some View {
        let all = model.recentPeople
        let visible = showAllPeople ? all : Array(all.prefix(7))
        return VStack(alignment: .leading, spacing: ZB.Space.md) {
            SectionHeader(title: "People")
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: ZB.Space.xs), count: 4),
                      spacing: ZB.Space.lg) {
                ForEach(visible) { c in
                    Button { model.startPay(c, source: "home_people") } label: { PersonCell(contact: c) }
                        .zbPressable()
                        .contextMenu {
                            Button("Pay", systemImage: "indianrupeesign") { model.startPay(c, source: "home_people_menu") }
                            Button("Request", systemImage: "arrow.down.left") { model.startPay(c, mode: .request, source: "home_people_menu") }
                            Button("Copy UPI ID", systemImage: "doc.on.doc") { Clipboard.copy(c.upiID, label: "UPI ID", model: model) }
                        } preview: {
                            VStack(spacing: 8) {
                                AvatarView(contact: c, size: 120)
                                Text(c.name).font(.headline)
                                Text(c.upiID).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                            }
                            .padding(24)
                        }
                        .accessibilityLabel("Pay \(c.name)")
                        .transition(.scale(scale: 0.6).combined(with: .opacity))
                }
                Button {
                    withAnimation(ZB.Motion.hero) { showAllPeople.toggle() }
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: "chevron.down")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ZB.Palette.greenInk)
                            .rotationEffect(.degrees(showAllPeople ? 180 : 0))
                            .frame(width: 56, height: 56)
                            .overlay(Circle().strokeBorder(ZB.Palette.hairline, lineWidth: 1.5))
                        Text(showAllPeople ? "Less" : "More").font(.footnote.weight(.medium)).foregroundStyle(ZB.Palette.ink)
                    }
                    .frame(maxWidth: .infinity)
                }
                .zbPressable()
            }
        }
    }

    // MARK: Businesses

    private var businesses: some View {
        VStack(alignment: .leading, spacing: ZB.Space.md) {
            SectionHeader(title: "Businesses")
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: ZB.Space.xs), count: 4), spacing: ZB.Space.lg) {
                ForEach(model.contacts.filter(\.isMerchant)) { c in
                    Button { model.startPay(c, source: "home_business") } label: {
                        VStack(spacing: 6) {
                            AvatarView(contact: c, size: 56)
                            Text(c.name.split(separator: " ").prefix(2).joined(separator: " "))
                                .font(.footnote.weight(.medium)).foregroundStyle(ZB.Palette.ink).lineLimit(1)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .zbPressable()
                }
            }
        }
    }

    // MARK: Manage your money

    private var manageMoney: some View {
        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            SectionHeader(title: "Manage your money")
            VStack(spacing: 0) {
                TimelineView(.periodic(from: .now, by: 1)) { _ in
                    let visible = model.isBalanceVisible
                    Button {
                        if visible { model.hideBalance() } else { checkingBalance = true }
                    } label: {
                        ManageRow(symbol: "building.columns.fill", title: "Check bank balance",
                                  detail: visible ? Money.format(model.totalBalance, decimals: true) : nil,
                                  trailing: visible ? "eye.slash" : "chevron.right")
                            .contentTransition(.numericText())
                    }
                    .buttonStyle(.plain)
                }
                Divider().overlay(ZB.Palette.hairline).padding(.leading, 56)
                Button { model.selectedTab = .history } label: {
                    ManageRow(symbol: "clock.arrow.circlepath", title: "See transaction history")
                }
                .buttonStyle(.plain)
                Divider().overlay(ZB.Palette.hairline).padding(.leading, 56)
                Button { Clipboard.copy(model.profile.upiID, label: "UPI ID", model: model) } label: {
                    ManageRow(symbol: "at", title: "Your UPI ID", detail: model.profile.upiID, trailing: "doc.on.doc")
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, ZB.Space.md)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        }
    }

    // MARK: Weekly insight (labelled AI; no glow at rest)

    private var insight: some View {
        let cal = Calendar.current
        let week = model.transactions.filter {
            $0.direction == .sent && $0.status == .success
                && cal.dateComponents([.day], from: $0.date, to: Date()).day ?? 99 < 7
        }
        let spent = week.reduce(Decimal(0)) { $0 + $1.amount }
        let byDay: [(Date, Double)] = (0..<7).reversed().map { d in
            let day = cal.startOfDay(for: cal.date(byAdding: .day, value: -d, to: Date())!)
            let total = week.filter { cal.isDate($0.date, inSameDayAs: day) }.reduce(0.0) { $0 + $1.amount.doubleValue }
            return (day, total)
        }
        return Button { model.showAI = true } label: {
            VStack(alignment: .leading, spacing: ZB.Space.md) {
                HStack {
                    AIBadge(text: "Weekly insight")
                    Spacer()
                    Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(ZB.Palette.inkTertiary)
                }
                Text("You spent **\(Money.format(spent))** in the last 7 days.")
                    .foregroundStyle(ZB.Palette.ink)
                    .multilineTextAlignment(.leading)
                Chart(byDay, id: \.0) { item in
                    BarMark(x: .value("Day", item.0, unit: .day), y: .value("Spent", item.1))
                        .foregroundStyle(cal.isDateInToday(item.0) ? ZB.Palette.ink : ZB.Palette.inkTertiary.opacity(0.45))
                        .clipShape(.rect(cornerRadius: 4))
                }
                .chartYAxis(.hidden)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisValueLabel(format: .dateTime.weekday(.narrow)).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                }
                .frame(height: 72)
            }
            .padding(ZB.Space.lg)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        }
        .zbPressable()
    }

    // MARK: Floating scanner (transparent glass pill, green icon → round on scroll).

    private var scanButton: some View {
        Button { model.showScanner = true } label: {
            HStack(spacing: 0) {
                Image(systemName: "qrcode.viewfinder")
                    .font(.system(size: 21, weight: .semibold))
                    .foregroundStyle(ZB.Palette.green)
                    .frame(width: 52, height: 52)
                // The label is always laid out and *clipped* by the shrinking width – it never wraps
                // or spills outside the capsule while the button animates.
                Text("Scan")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(ZB.Palette.ink)
                    .lineLimit(1)
                    .fixedSize()
                    .frame(width: scrolled ? 0 : 36, alignment: .leading)
                    .opacity(scrolled ? 0 : 1)
                    .clipped()
                    .padding(.trailing, scrolled ? 0 : 16)
            }
            .frame(height: 52)
            .clipShape(.capsule)
            .contentShape(.capsule)
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.tint(Color.white.opacity(0.55)).interactive(), in: .capsule)
        .animation(.spring(response: 0.4, dampingFraction: 0.86), value: scrolled)
        .padding(.trailing, ZB.Space.margin)
        .padding(.bottom, ZB.Space.md)
        .accessibilityLabel("Scan and pay")
    }
}

private struct ManageRow: View {
    let symbol: String
    let title: String
    var detail: String? = nil
    var trailing = "chevron.right"
    var body: some View {
        HStack(spacing: ZB.Space.sm) {
            IconTile(symbol: symbol, size: 36)
            Text(title).font(.body).foregroundStyle(ZB.Palette.ink)
            Spacer()
            if let detail { Text(detail).font(.subheadline.weight(.semibold)).monospacedDigit().foregroundStyle(ZB.Palette.inkSecondary) }
            Image(systemName: trailing).font(.footnote.weight(.semibold)).foregroundStyle(ZB.Palette.inkTertiary)
        }
        .frame(minHeight: 56)
        .contentShape(.rect)
    }
}

enum HomeRoute: Hashable { case notifications, rewards, card, fd, offer }

// MARK: - Pieces

private struct ActionTile: View {
    let title: String
    let symbol: String
    var prominent = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: ZB.Space.xs) {
                Image(systemName: symbol)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(ZB.Palette.ink)
                    .frame(width: 64, height: 64)
                    .background(ZB.Palette.raised, in: .circle)
                    .overlay(Circle().strokeBorder(ZB.Palette.hairline))
                    .shadow(color: .black.opacity(0.06), radius: 8, y: 4)
                Text(title)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(ZB.Palette.ink)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
        }
        .zbPressable()
    }
}

struct ChipButton: View {
    let title: String
    let symbol: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: symbol)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(ZB.Palette.ink)
                .imageScale(.small)
                .padding(.horizontal, ZB.Space.md)
                .frame(minHeight: 40)
                .background(ZB.Palette.surface, in: .capsule)
        }
        .zbPressable()
    }
}

private struct RequestCard: View {
    @Environment(AppModel.self) private var model
    let request: MoneyRequest

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            HStack(spacing: ZB.Space.sm) {
                AvatarView(contact: request.from, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(request.from.name).font(.subheadline.weight(.semibold))
                    Text(request.note).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary).lineLimit(2)
                }
                Spacer()
                // The amount is the point of a request: large and bold.
                Text(Money.format(request.amount))
                    .font(.system(size: 30, weight: .bold, design: .rounded)).monospacedDigit()
                    .foregroundStyle(ZB.Palette.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
            if request.isSuspicious {
                // Calm, not alarming: one quiet line + two plain actions.
                Label("Looks like a scam – you never need a PIN to receive money.", systemImage: "exclamationmark.triangle")
                    .font(.footnote)
                    .foregroundStyle(ZB.Palette.warning)
                HStack(spacing: ZB.Space.xs) {
                    Button("Ignore") { remove("Request ignored", "xmark.circle.fill") }
                        .buttonStyle(.zbSecondary)
                    Button("Block") { remove("Blocked and reported", "hand.raised.fill") }
                        .buttonStyle(.zbSecondary)
                }
            } else {
                HStack(spacing: ZB.Space.xs) {
                    Button("Decline") { remove("Request declined", "xmark.circle.fill") }
                        .buttonStyle(.zbSecondary)
                    Button("Pay") {
                        model.startPay(request.from, amount: request.amount, note: request.note, source: "request")
                        model.requests.removeAll { $0.id == request.id }
                    }
                    .buttonStyle(.zbPrimary)
                }
            }
        }
        .padding(ZB.Space.md)
        .background { cornerArt }
        .clipShape(.rect(cornerRadius: ZB.Radius.lg, style: .continuous))
    }

    /// Light decoration that grows out of two corners – thin concentric arcs top right, a faint arc and dot bottom left.
    /// Sits mostly outside the card so it never competes with the text.
    private var cornerArt: some View {
        let tint = request.isSuspicious ? Color(hex: 0xFF7A2F) : Color(hex: 0x2B59FF)
        return Color(ZB.Palette.surface)
            .overlay(alignment: .topTrailing) {
                ZStack {
                    ForEach(0..<4, id: \.self) { i in
                        Circle().strokeBorder(tint.opacity(0.14 - 0.03 * Double(i)), lineWidth: 1.4)
                            .frame(width: 70 + CGFloat(i) * 34, height: 70 + CGFloat(i) * 34)
                    }
                    Circle().fill(tint.opacity(0.07)).frame(width: 70, height: 70)
                }
                .offset(x: 70, y: -70)
            }
            .overlay(alignment: .bottomLeading) {
                ZStack {
                    Circle().strokeBorder(Color(hex: 0x00C46A).opacity(0.14), lineWidth: 1.4).frame(width: 90, height: 90)
                    Circle().strokeBorder(Color(hex: 0x00C46A).opacity(0.09), lineWidth: 1.4).frame(width: 124, height: 124)
                    Circle().fill(Color(hex: 0x00C46A).opacity(0.07)).frame(width: 54, height: 54)
                }
                .offset(x: -50, y: 50)
            }
    }

    private func remove(_ msg: String, _ symbol: String) {
        withAnimation(ZB.Motion.standard) { model.requests.removeAll { $0.id == request.id } }
        model.showToast(msg, symbol: symbol)
    }
}

struct TrailingIconLabel: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 6) { configuration.title; configuration.icon.imageScale(.small) }
    }
}

/// Notifications: every row opens somewhere real (receipt, Rewards/Invite, bill payment, offer page).
struct NotificationsView: View {
    @Environment(AppModel.self) private var model
    private enum Dest: Hashable { case receipt, invite, bill, offer(Offer), scam }
    private struct Item: Identifiable {
        let id = UUID(); let symbol: String; let tag: String?; let category: String; let time: String
        let body: String; let cta: String; let dest: Dest; var unread = true
    }
    @State private var items: [Item] = [
        .init(symbol: "exclamationmark.shield", tag: "Looks like a scam", category: "Payment request", time: "15 min",
              body: "**Rewards Desk** is asking you for **₹4,999** – “You won ₹5,000! Enter PIN to receive”. Receiving money never needs a PIN.",
              cta: "Review request", dest: .scam),
        .init(symbol: "arrow.down.left", tag: nil, category: "Payments", time: "12 min",
              body: "**Arjun Nair** paid you **₹1,200** for movie tickets.", cta: "View receipt", dest: .receipt),
        .init(symbol: "gift", tag: "Only for you", category: "Rewards", time: "1 hr",
              body: "Invite a friend and get up to **₹700** when they start paying on Zenbit.", cta: "Invite now", dest: .invite),
        .init(symbol: "bolt", tag: "Due soon", category: "Bill payments", time: "5 hrs",
              body: "Your BESCOM bill of **₹2,340** is due in 3 days. Pay now, get ₹6 off.", cta: "Pay bill", dest: .bill),
        .init(symbol: "shield.lefthalf.filled", tag: "Sponsored", category: "Insurance · CoverKart", time: "1 day",
              body: "Phone protection from ₹19/month. 20-minute claims.", cta: "Get quote", dest: .offer(.insurance), unread: false),
    ]
    @State private var pending: Dest?

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                NativeAdCard(ad: NativeAd.all[0])
                    .padding(ZB.Space.md)
                ForEach($items) { $item in
                    Button {
                        withAnimation(ZB.Motion.snappy) { item.unread = false }
                        open(item.dest)
                    } label: {
                        row(item)
                            .background(item.unread ? ZB.Palette.surface : Color.clear)
                    }
                    .buttonStyle(.plain)
                    Divider().overlay(ZB.Palette.hairline)
                }
            }
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button("Mark all read") { withAnimation { for i in items.indices { items[i].unread = false } } }
                .font(.subheadline)
        }
        .navigationDestination(item: $pending) { d in
            switch d {
            case .receipt:
                if let tx = model.transactions.first(where: { $0.direction == .received }) { TransactionDetailView(tx: tx) }
            case .invite: InviteEarnView()
            case .bill: BillPayPage()
            case .scam: ScamRequestPage()
            case .offer(let o): OfferPage(offer: o)
            }
        }
    }

    private func open(_ d: Dest) { pending = d }

    private func row(_ item: Item) -> some View {
        HStack(alignment: .top, spacing: ZB.Space.md) {
            Image(systemName: item.symbol)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(ZB.Palette.ink)
                .frame(width: 44, height: 44)
                .background(ZB.Palette.raised, in: .circle)
                .overlay(Circle().strokeBorder(ZB.Palette.hairline))
                .overlay(alignment: .topTrailing) {
                    if item.unread { Circle().fill(ZB.Palette.danger).frame(width: 10, height: 10).offset(x: 1, y: -1) }
                }
            VStack(alignment: .leading, spacing: 6) {
                if let tag = item.tag {
                    Text(tag).font(.caption.weight(.semibold))
                        .foregroundStyle(tag == "Sponsored" ? ZB.Palette.inkSecondary : ZB.Palette.ink)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(ZB.Palette.hairline, in: .rect(cornerRadius: 6))
                }
                Text("\(item.category) · \(item.time)").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                Text(LocalizedStringKey(item.body)).font(.body).foregroundStyle(ZB.Palette.ink).multilineTextAlignment(.leading)
                Text(item.cta).font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.accent)
            }
            Spacer(minLength: 0)
        }
        .padding(ZB.Space.md)
        .contentShape(.rect)
    }
}

/// A flagged collect request: explains why it's risky and offers Block / Ignore. Nothing here can send money.
struct ScamRequestPage: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        let r = model.flaggedRequests[0]
        ScrollView {
            VStack(spacing: ZB.Space.xl) {
                VStack(spacing: 6) {
                    AvatarView(contact: r.from, size: 64)
                    Text(r.from.name).font(.title3.weight(.semibold))
                    Text(r.from.upiID).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    Text(Money.format(r.amount)).font(.system(size: 40, weight: .bold, design: .rounded)).padding(.top, 6)
                    Text("“\(r.note)”").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary).multilineTextAlignment(.center)
                }
                VStack(alignment: .leading, spacing: ZB.Space.md) {
                    Label("This is a request to take money **from you**.", systemImage: "arrow.up.right")
                    Label("Entering your PIN sends money out – you never need a PIN to receive.", systemImage: "key")
                    Label("Prize and cashback offers that ask for a PIN are scams.", systemImage: "gift")
                }
                .font(.subheadline)
                .padding(ZB.Space.lg)
                .frame(maxWidth: .infinity, alignment: .leading)
                .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
                VStack(spacing: ZB.Space.xs) {
                    Button("Block & report") {
                        model.showToast("Blocked and reported", symbol: "hand.raised.fill"); dismiss()
                    }.buttonStyle(.zbInk)
                    Button("Ignore") { dismiss() }.buttonStyle(.zbSecondary)
                }
            }
            .padding(ZB.Space.margin)
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Payment request")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Pay-a-bill page (electricity): amount, due date, account, pay.
struct BillPayPage: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        VStack(spacing: ZB.Space.xl) {
            VStack(spacing: 6) {
                Image(systemName: "bolt.fill").font(.system(size: 30)).frame(width: 72, height: 72)
                    .background(ZB.Palette.surface, in: .circle)
                Text("BESCOM Electricity").font(.title3.weight(.semibold))
                Text("Consumer no. 4021 8832 · Due in 3 days").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                Text(Money.format(2_340)).font(.system(size: 46, weight: .bold, design: .rounded)).padding(.top, 8)
                Text("Bill period Oct 22 – Nov 21").font(.footnote).foregroundStyle(ZB.Palette.inkTertiary)
            }
            .padding(.top, ZB.Space.xl)
            Spacer()
            Button("Pay ₹2,340") {
                model.startPay(SampleData.contacts.first { $0.name.hasPrefix("BESCOM") }!, amount: 2_340,
                               note: "Electricity – Nov", locked: true, source: "notification_bill")
            }
            .buttonStyle(.zbPrimary)
            .padding(.horizontal, ZB.Space.margin)
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Pay bill")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview { HomeView().environment(AppModel()) }
