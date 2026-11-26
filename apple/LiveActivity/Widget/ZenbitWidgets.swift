import AppIntents
import Charts
import SwiftUI
import WidgetKit

// Zenbit widgets. Payment-app widgets are about *one-tap actions first* (scan, pay a favourite, show my QR),
// glanceable numbers second. Balances are never shown on a widget (anyone can see a home or lock screen).
// Every tap deep-links into the app: zenbit://scan, zenbit://pay/<name>, zenbit://receive, zenbit://rewards, zenbit://history.

@main
struct ZenbitWidgets: WidgetBundle {
    var body: some Widget {
        ScanPayWidget()
        QuickPayWidget()
        RewardsWidget()
        SpendWidget()
        ActivityWidget()
        ScanControl()
        PaymentLiveActivity()
    }
}

// MARK: - Shared data (sample data until an App Group is set up)

struct ZenEntry: TimelineEntry {
    let date: Date
    let favourites: [Contact]
    let recent: [Transaction]
    let monthSpent: Decimal
    let weekByDay: [(Date, Double)]
    let cashback: Decimal
}

struct ZenProvider: TimelineProvider {
    func placeholder(in context: Context) -> ZenEntry { Self.entry() }
    func getSnapshot(in context: Context, completion: @escaping (ZenEntry) -> Void) { completion(Self.entry()) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ZenEntry>) -> Void) {
        completion(Timeline(entries: [Self.entry()], policy: .after(.now.addingTimeInterval(30 * 60))))
    }

    static func entry() -> ZenEntry {
        let cal = Calendar.current
        let sent = SampleData.transactions.filter { $0.direction == .sent && $0.status == .success }
        let month = sent.filter { cal.isDate($0.date, equalTo: .now, toGranularity: .month) }.reduce(Decimal(0)) { $0 + $1.amount }
        let week: [(Date, Double)] = (0..<7).reversed().map { d in
            let day = cal.startOfDay(for: cal.date(byAdding: .day, value: -d, to: .now)!)
            let total = sent.filter { cal.isDate($0.date, inSameDayAs: day) }.reduce(0.0) { $0 + $1.amount.doubleValue }
            return (day, total)
        }
        return ZenEntry(date: .now,
                        favourites: Array(SampleData.contacts.filter { $0.isFavorite && !$0.isMerchant }.prefix(4)),
                        recent: Array(SampleData.transactions.prefix(4)),
                        monthSpent: month, weekByDay: week,
                        cashback: SampleData.rewards.reduce(0) { $0 + $1.amount })
    }
}

enum ZenLink {
    static let scan = URL(string: "zenbit://scan")!
    static let receive = URL(string: "zenbit://receive")!
    static let rewards = URL(string: "zenbit://rewards")!
    static let history = URL(string: "zenbit://history")!
    static func pay(_ c: Contact) -> URL { URL(string: "zenbit://pay/\(c.firstName.lowercased())")! }
}

// MARK: - Look

private enum WZ {
    static let ink = Color(hex: 0x14161F)
    static let ink2 = Color(hex: 0x6F7389)
    static let chip = Color(hex: 0xEEF0F7)
    static let green = Color(hex: 0x00C46A)
    static let surface = Color(hex: 0xF3F4F7)
    static let black = Color(hex: 0x0B0C10)
}

private struct Face: View {
    let contact: Contact
    var size: CGFloat
    var body: some View {
        Group {
            if let p = contact.photoAsset { Image(p).resizable().scaledToFill() }
            else {
                Text(String(contact.firstName.prefix(1)))
                    .font(.system(size: size * 0.42, weight: .semibold, design: .rounded)).foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(hue: contact.hue, saturation: 0.45, brightness: 0.62))
            }
        }
        .frame(width: size, height: size)
        .clipShape(.circle)
    }
}

// MARK: - 1 · Scan & pay (small + lock screen circle)

struct ScanPayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "zen.scan", provider: ZenProvider()) { _ in ScanPayView() }
            .configurationDisplayName("Scan & pay")
            .description("Open the scanner in one tap.")
            .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

private struct ScanPayView: View {
    @Environment(\.widgetFamily) private var family
    var body: some View {
        switch family {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                Image(systemName: "qrcode.viewfinder").font(.system(size: 24, weight: .semibold))
            }
            .widgetURL(ZenLink.scan)
            .containerBackground(for: .widget) { Color.clear }
        default:
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Image(systemName: "indianrupeesign.circle.fill").font(.title3).foregroundStyle(.white)
                    Spacer()
                    Text("UPI").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.55))
                }
                Spacer()
                Image(systemName: "qrcode.viewfinder")
                    .font(.system(size: 40, weight: .medium))
                    .foregroundStyle(.white)
                Spacer()
                Text("Scan & pay").font(.system(.headline, design: .rounded)).foregroundStyle(.white)
                Text("Any UPI QR").font(.caption2).foregroundStyle(.white.opacity(0.6))
            }
            .widgetURL(ZenLink.scan)
            .containerBackground(for: .widget) { WZ.black }
        }
    }
}

// MARK: - 2 · Quick pay (medium)

struct QuickPayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "zen.quickpay", provider: ZenProvider()) { e in QuickPayView(entry: e) }
            .configurationDisplayName("Quick pay")
            .description("Pay your favourite people, or scan a QR.")
            .supportedFamilies([.systemMedium])
    }
}

private struct QuickPayView: View {
    let entry: ZenEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Quick pay").font(.system(.subheadline, design: .rounded).weight(.semibold)).foregroundStyle(WZ.ink)
                Spacer()
                Link(destination: ZenLink.receive) {
                    Label("My QR", systemImage: "qrcode").font(.caption.weight(.semibold)).foregroundStyle(WZ.ink2)
                }
            }
            HStack(spacing: 0) {
                ForEach(entry.favourites) { c in
                    Link(destination: ZenLink.pay(c)) {
                        VStack(spacing: 5) {
                            Face(contact: c, size: 44)
                            Text(c.firstName).font(.caption2.weight(.medium)).foregroundStyle(WZ.ink).lineLimit(1)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                Link(destination: ZenLink.scan) {
                    VStack(spacing: 5) {
                        Image(systemName: "qrcode.viewfinder").font(.system(size: 19, weight: .semibold)).foregroundStyle(.white)
                            .frame(width: 44, height: 44).background(WZ.ink, in: .circle)
                        Text("Scan").font(.caption2.weight(.medium)).foregroundStyle(WZ.ink)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .containerBackground(for: .widget) { Color.white }
    }
}

// MARK: - 3 · Rewards (small + lock screen inline)

struct RewardsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "zen.rewards", provider: ZenProvider()) { e in RewardsView(entry: e) }
            .configurationDisplayName("Cashback")
            .description("What you've earned back on payments.")
            .supportedFamilies([.systemSmall, .accessoryInline])
    }
}

private struct RewardsView: View {
    let entry: ZenEntry
    @Environment(\.widgetFamily) private var family
    var body: some View {
        if family == .accessoryInline {
            Label("\(Money.format(entry.cashback)) cashback earned", systemImage: "gift")
                .widgetURL(ZenLink.rewards)
                .containerBackground(for: .widget) { Color.clear }
        } else {
            VStack(alignment: .leading, spacing: 4) {
                Image(systemName: "gift.fill").font(.title3).foregroundStyle(WZ.ink)
                Spacer()
                Text("Cashback earned").font(.caption).foregroundStyle(WZ.ink2)
                Text(Money.format(entry.cashback, decimals: true))
                    .font(.system(size: 26, weight: .bold, design: .rounded)).monospacedDigit()
                    .foregroundStyle(WZ.ink).minimumScaleFactor(0.6).lineLimit(1)
                Text("0.5% back")
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(hex: 0x2E7D4F))
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(Color(hex: 0xD3EDDC), in: .capsule)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .widgetURL(ZenLink.rewards)
            .containerBackground(for: .widget) { WZ.surface }
        }
    }
}

// MARK: - 4 · Spending (medium + lock screen rectangle)

struct SpendWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "zen.spend", provider: ZenProvider()) { e in SpendView(entry: e) }
            .configurationDisplayName("Spending")
            .description("This month's total and the last 7 days.")
            .supportedFamilies([.systemMedium, .accessoryRectangular])
    }
}

private struct SpendView: View {
    let entry: ZenEntry
    @Environment(\.widgetFamily) private var family
    var body: some View {
        if family == .accessoryRectangular {
            VStack(alignment: .leading, spacing: 1) {
                Label("Zenbit", systemImage: "indianrupeesign.circle").font(.caption2.weight(.semibold))
                Text(Money.format(entry.monthSpent)).font(.system(.title3, design: .rounded).weight(.bold)).monospacedDigit()
                Text("spent this month").font(.caption2)
            }
            .widgetURL(ZenLink.history)
            .containerBackground(for: .widget) { Color.clear }
        } else {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("This month").font(.caption).foregroundStyle(WZ.ink2)
                    Text(Money.format(entry.monthSpent))
                        .font(.system(size: 28, weight: .bold, design: .rounded)).monospacedDigit()
                        .foregroundStyle(WZ.ink).minimumScaleFactor(0.6).lineLimit(1)
                    Spacer()
                    Label("History", systemImage: "list.bullet.rectangle").font(.caption.weight(.semibold)).foregroundStyle(WZ.ink2)
                }
                Chart(entry.weekByDay, id: \.0) { d in
                    BarMark(x: .value("Day", d.0, unit: .day), y: .value("₹", d.1))
                        .foregroundStyle(Calendar.current.isDateInToday(d.0) ? WZ.green : Color(hex: 0xC5CADF))
                        .clipShape(.rect(cornerRadius: 3))
                }
                .chartYAxis(.hidden)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { _ in
                        AxisValueLabel(format: .dateTime.weekday(.narrow)).foregroundStyle(WZ.ink2)
                    }
                }
            }
            .widgetURL(ZenLink.history)
            .containerBackground(for: .widget) { Color.white }
        }
    }
}

// MARK: - 5 · Activity (large)

struct ActivityWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "zen.activity", provider: ZenProvider()) { e in ActivityView(entry: e) }
            .configurationDisplayName("Payments")
            .description("Quick actions and your latest payments.")
            .supportedFamilies([.systemLarge])
    }
}

private struct ActivityView: View {
    let entry: ZenEntry
    var body: some View {
        VStack(spacing: 14) {
            HStack(spacing: 8) {
                action("Scan", "qrcode.viewfinder", ZenLink.scan, filled: true)
                action("Receive", "qrcode", ZenLink.receive)
                action("Rewards", "gift", ZenLink.rewards)
            }
            VStack(spacing: 0) {
                ForEach(entry.recent) { tx in
                    Link(destination: ZenLink.history) {
                        HStack(spacing: 10) {
                            Face(contact: tx.counterparty, size: 34)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(tx.counterparty.name).font(.subheadline.weight(.semibold)).foregroundStyle(WZ.ink).lineLimit(1)
                                Text(tx.date.formatted(.relative(presentation: .named))).font(.caption2).foregroundStyle(WZ.ink2)
                            }
                            Spacer()
                            Text((tx.direction == .received ? "+" : "") + Money.format(tx.amount))
                                .font(.system(.subheadline, design: .rounded).weight(.semibold)).monospacedDigit()
                                .foregroundStyle(tx.direction == .received ? Color(hex: 0x2E7D4F) : WZ.ink)
                        }
                        .padding(.vertical, 7)
                    }
                    if tx.id != entry.recent.last?.id { Divider() }
                }
            }
            Spacer(minLength: 0)
        }
        .containerBackground(for: .widget) { Color.white }
    }

    private func action(_ t: String, _ s: String, _ url: URL, filled: Bool = false) -> some View {
        Link(destination: url) {
            VStack(spacing: 6) {
                Image(systemName: s).font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(filled ? .white : WZ.ink)
                    .frame(width: 44, height: 44)
                    .background(filled ? AnyShapeStyle(WZ.ink) : AnyShapeStyle(.white), in: .circle)
                Text(t).font(.caption.weight(.semibold)).foregroundStyle(WZ.ink)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(WZ.surface)
            .clipShape(.rect(cornerRadius: 20, style: .continuous))
        }
    }
}

// MARK: - 6 · Control Center: Scan & pay

struct ScanControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "zen.control.scan") {
            ControlWidgetButton(action: OpenURLIntent(ZenLink.scan)) {
                Label("Scan & pay", systemImage: "qrcode.viewfinder")
            }
        }
        .displayName("Zenbit Scan & pay")
        .description("Open the Zenbit scanner.")
    }
}

// MARK: - Previews

#Preview("Quick pay", as: .systemMedium) { QuickPayWidget() } timeline: { ZenProvider.entry() }
#Preview("Scan", as: .systemSmall) { ScanPayWidget() } timeline: { ZenProvider.entry() }
#Preview("Spend", as: .systemMedium) { SpendWidget() } timeline: { ZenProvider.entry() }
#Preview("Activity", as: .systemLarge) { ActivityWidget() } timeline: { ZenProvider.entry() }
