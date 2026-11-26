import SwiftUI
import UserNotifications
import WatchKit

/// watchOS: connect, glance, receive. Sending money stays on iPhone (bigger screen, PIN entry,
/// lower error risk) – the watch is for *receiving* and *knowing*.
///
/// Flow: Welcome → "Connect to iPhone" (6-digit code, approve on the phone) → Home.
@main
struct ZenbitWatchApp: App {
    @WKApplicationDelegateAdaptor private var delegate: WatchDelegate
    @State private var model = WatchModel()

    var body: some Scene {
        WindowGroup {
            Group {
                #if DEBUG
                if UserDefaults.standard.string(forKey: "ZBScreen") == "notification" {
                    ScrollView { PaymentNotificationView(amount: "₹1,200", sender: "Arjun Nair", note: "Movie tickets 🎬") }
                        .containerBackground(for: .navigation) { FluidGradient() }
                } else if UserDefaults.standard.string(forKey: "ZBWatchRoute") == "askzen" {
                    NavigationStack { WatchAskZen() }
                } else {
                    WatchRoot()
                }
                #else
                WatchRoot()
                #endif
            }
            .environment(model)
        }
        WKNotificationScene(controller: PaymentNotificationController.self, category: "PAYMENT_RECEIVED")
    }
}

final class WatchDelegate: NSObject, WKApplicationDelegate, UNUserNotificationCenterDelegate {
    func applicationDidFinishLaunching() {
        WatchLink.shared.activate()
        #if DEBUG
        WatchLink.shared.applyDebugState()
        #endif
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
        let thanks = UNNotificationAction(identifier: "THANKS", title: "Say thanks 🙏")
        let view = UNNotificationAction(identifier: "VIEW", title: "View receipt", options: .foreground)
        UNUserNotificationCenter.current().setNotificationCategories([
            UNNotificationCategory(identifier: "PAYMENT_RECEIVED", actions: [thanks, view], intentIdentifiers: []),
        ])
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }
}

#if DEBUG
extension WatchLink {
    /// `-ZBWatchState paired|waiting|unpaired` – jump to a state for screenshots.
    func applyDebugState() {
        switch UserDefaults.standard.string(forKey: "ZBWatchState") {
        case "paired":
            state = .paired; peerName = "Aarav's iPhone"
            snapshot = WatchModel.sampleSnapshot()
        case "waiting":
            state = .waiting; pendingCode = "482913"; codeExpires = Date().addingTimeInterval(300)
        case "unpaired":
            state = .unpaired; snapshot = nil
        case "askzen": state = .paired; peerName = "Aarav's iPhone"; snapshot = WatchModel.sampleSnapshot()
        case "connect":
            state = .unpaired; snapshot = nil
            Task { try? await Task.sleep(for: .seconds(1.5)); startPairing() }
        default: break
        }
    }
}
#endif

// MARK: - Model

@Observable
final class WatchModel {
    let link = WatchLink.shared
    var showBalance = false

    static func sampleSnapshot() -> WatchSnapshot {
        WatchSnapshot(
            name: SampleData.profile.name, upiID: SampleData.profile.upiID,
            balance: SampleData.accounts.reduce(0) { $0 + $1.balance }.doubleValue,
            txs: SampleData.transactions.prefix(6).map {
                .init(id: $0.id.uuidString, name: $0.counterparty.name, amount: $0.amount.doubleValue,
                      received: $0.direction == .received, status: $0.status == .success ? "success" : ($0.status == .failed ? "failed" : "pending"),
                      date: $0.date, ref: $0.upiRef)
            }, updated: .now)
    }

    var upiID: String { link.snapshot?.upiID ?? SampleData.profile.upiID }
    var firstName: String { (link.snapshot?.name ?? SampleData.profile.name).split(separator: " ").first.map(String.init) ?? "" }
    var balance: Decimal { Decimal(link.snapshot?.balance ?? 0) }
    var txs: [WatchSnapshot.Tx] { link.snapshot?.txs ?? [] }

    func simulateIncoming() async {
        let center = UNUserNotificationCenter.current()
        let content = UNMutableNotificationContent()
        content.title = "Payment received"
        content.body = "Arjun Nair sent you ₹1,200"
        content.categoryIdentifier = "PAYMENT_RECEIVED"
        content.sound = .default
        content.userInfo = ["amount": "₹1,200", "sender": "Arjun Nair", "note": "Movie tickets 🎬"]
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        try? await center.add(UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger))
    }
}

// MARK: - Look (light, airy – soft pastel mesh, one big number, pill buttons)

enum W {
    static let page = Color.black                      // one flat colour behind everything
    static let onPage = Color.white                    // text that sits directly on the page
    static let onPage2 = Color(hex: 0xA3A7BC)
    static let ink = Color(hex: 0x14161F)
    static let ink2 = Color(hex: 0x8B8FA8)
    static let chip = Color(hex: 0xE9EBF4)
    static let up = Color(hex: 0x2E7D4F), upBg = Color(hex: 0xD3EDDC)
}

/// The page behind everything: one flat colour. No gradient, no drifting shapes.
struct FluidGradient: View {
    var body: some View {
        W.page.ignoresSafeArea()
    }
}

/// The hero card's pastel mesh (periwinkle → lilac → ice), slowly breathing.
struct PastelMesh: View {
    private func points(_ t: Double) -> [SIMD2<Float>] {
        func p(_ x: Double, _ y: Double, _ ax: Double = 0, _ ay: Double = 0, _ s: Double = 0) -> SIMD2<Float> {
            SIMD2(Float(x + ax * sin(t * 0.4 + s)), Float(y + ay * cos(t * 0.33 + s * 1.3)))
        }
        return [p(0, 0), p(0.5, 0, 0.08, 0, 1), p(1, 0),
                p(0, 0.5, 0, 0.1, 2), p(0.6, 0.45, 0.16, 0.12, 3), p(1, 0.5, 0, 0.1, 4),
                p(0, 1), p(0.5, 1, 0.08, 0, 5), p(1, 1)]
    }
    private let colors: [Color] = [
        Color(hex: 0xD9ECFF), Color(hex: 0xBFD3FA), Color(hex: 0xA9B8F2),
        Color(hex: 0xE4E6FA), Color(hex: 0x8E9CEA), Color(hex: 0xC8CCF6),
        Color(hex: 0xF1F2FA), Color(hex: 0xE8E4FA), Color(hex: 0xEFF0FA),
    ]
    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 20)) { ctx in
            MeshGradient(width: 3, height: 3, points: points(ctx.date.timeIntervalSinceReferenceDate),
                         colors: colors, smoothsColors: true)
        }
    }
}

// MARK: - Root: gate on the connection

struct WatchRoot: View {
    @Environment(WatchModel.self) private var model
    @State private var justConnected = false

    var body: some View {
        let link = model.link
        ZStack {
            switch link.state {
            case .unpaired: WatchWelcome().transition(.opacity.combined(with: .scale(scale: 0.96)))
            case .waiting: WatchPairing().transition(.opacity.combined(with: .scale(scale: 0.96)))
            case .paired:
                if justConnected { WatchConnected().transition(.opacity.combined(with: .scale(scale: 1.04))) }
                else { WatchHome().transition(.opacity.combined(with: .scale(scale: 1.04))) }
            }
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.86), value: link.state)
        .animation(.spring(response: 0.5, dampingFraction: 0.86), value: justConnected)
        .onChange(of: link.state) { old, new in
            guard old == .waiting, new == .paired else { return }
            justConnected = true
            WKInterfaceDevice.current().play(.success)
            Task { try? await Task.sleep(for: .seconds(1.8)); justConnected = false }
        }
    }
}

// MARK: - 1 · Welcome

struct WatchWelcome: View {
    @Environment(WatchModel.self) private var model
    var body: some View {
        ZStack {
            FluidGradient()
            ScrollView {
                VStack(spacing: 10) {
                    ZStack(alignment: .topLeading) {
                        PastelMesh()
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Zenbit").font(.system(.footnote, design: .rounded).weight(.medium)).foregroundStyle(W.ink2)
                            Text("Pay from\nyour wrist")
                                .font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(W.ink)
                                .lineSpacing(-2)
                        }
                        .padding(14)
                    }
                    .frame(height: 104)
                    .clipShape(.rect(cornerRadius: 26, style: .continuous))

                    Button { model.link.startPairing() } label: {
                        PillRow(title: "Connect to iPhone", symbol: "iphone.gen3.radiowaves.left.and.right")
                    }
                    .buttonStyle(.plain)
                    Text("Needs Zenbit on your iPhone.").font(.caption2).foregroundStyle(W.onPage2)
                }
                .padding(.horizontal, 4)
            }
            .scrollIndicators(.hidden)
        }
    }
}

// MARK: - 2 · Pairing (code + waiting)

struct WatchPairing: View {
    @Environment(WatchModel.self) private var model

    var body: some View {
        let link = model.link
        ZStack {
            FluidGradient()
            ScrollView {
                VStack(spacing: 8) {
                    ZStack(alignment: .topLeading) {
                        PastelMesh()
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Pairing code").font(.system(.caption, design: .rounded).weight(.medium)).foregroundStyle(W.ink2)
                            Text(formatted(link.pendingCode ?? "------"))
                                .font(.system(size: 30, weight: .bold, design: .rounded)).monospacedDigit()
                                .foregroundStyle(W.ink).minimumScaleFactor(0.7).lineLimit(1)
                            HStack(spacing: 5) {
                                PulsingDot()
                                Text(link.isReachable ? "Waiting for approval" : "Looking for iPhone")
                                    .font(.system(.caption2, design: .rounded)).foregroundStyle(W.ink2)
                            }
                        }
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .clipShape(.rect(cornerRadius: 26, style: .continuous))
                    .accessibilityLabel("Code \((link.pendingCode ?? "").map(String.init).joined(separator: " "))")

                    VStack(alignment: .leading, spacing: 7) {
                        stepLine("1", "Open Zenbit on iPhone")
                        stepLine("2", "Profile › Apple Watch")
                        stepLine("3", "Approve, or type the code")
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.white, in: .rect(cornerRadius: 22, style: .continuous))

                    TimelineView(.periodic(from: .now, by: 1)) { ctx in
                        if let exp = link.codeExpires {
                            let left = max(0, Int(exp.timeIntervalSince(ctx.date)))
                            Text("Expires in \(left / 60):\(String(format: "%02d", left % 60))")
                                .font(.caption2.monospacedDigit()).foregroundStyle(W.onPage2)
                                .onChange(of: left) { _, v in if v == 0 { link.startPairing() } }
                        }
                    }
                    Button { link.cancelPairing() } label: { PillRow(title: "Cancel", symbol: "xmark") }.buttonStyle(.plain)
                }
                .padding(.horizontal, 4)
            }
            .scrollIndicators(.hidden)
        }
    }

    private func formatted(_ c: String) -> String { c.count == 6 ? "\(c.prefix(3)) \(c.dropFirst(3))" : c }

    private func stepLine(_ n: String, _ text: String) -> some View {
        HStack(spacing: 8) {
            Text(n).font(.system(.caption2, design: .rounded).weight(.bold)).foregroundStyle(.white)
                .frame(width: 18, height: 18).background(W.ink, in: .circle)
            Text(text).font(.system(.caption2, design: .rounded)).foregroundStyle(W.ink)
        }
    }
}

private struct PulsingDot: View {
    @State private var on = false
    var body: some View {
        Circle().fill(W.ink2).frame(width: 6, height: 6)
            .opacity(on ? 1 : 0.3)
            .onAppear { withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) { on = true } }
    }
}

/// Pill with a round white icon on the left (the reference's Swap / Send buttons).
struct PillRow: View {
    let title: String
    let symbol: String
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: symbol)
                .font(.system(size: 12, weight: .semibold)).foregroundStyle(W.ink2)
                .frame(width: 28, height: 28).background(.white, in: .circle)
            Text(title).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(W.ink).lineLimit(1).minimumScaleFactor(0.7)
            Spacer(minLength: 0)
        }
        .padding(.leading, 3).padding(.trailing, 8).padding(.vertical, 3)
        .frame(maxWidth: .infinity)
        .background(W.chip, in: .capsule)
    }
}

// MARK: - 3 · Connected moment

struct WatchConnected: View {
    @Environment(WatchModel.self) private var model
    @State private var drawn = false
    var body: some View {
        ZStack {
            FluidGradient()
            VStack(spacing: 8) {
                ZStack {
                    Circle().fill(W.upBg).frame(width: 68, height: 68)
                    Circle().trim(from: 0, to: drawn ? 1 : 0).stroke(W.up, style: .init(lineWidth: 4, lineCap: .round))
                        .rotationEffect(.degrees(-90)).frame(width: 68, height: 68)
                    WatchCheck().trim(from: 0, to: drawn ? 1 : 0)
                        .stroke(W.up, style: .init(lineWidth: 5, lineCap: .round, lineJoin: .round))
                        .frame(width: 26, height: 20)
                        .animation(.easeOut(duration: 0.35).delay(0.45), value: drawn)
                }
                Text("Connected").font(.system(.title3, design: .rounded).weight(.bold)).foregroundStyle(W.onPage)
                Text(model.link.peerName ?? "your iPhone").font(.caption).foregroundStyle(W.onPage2)
            }
        }
        .onAppear { withAnimation(.easeOut(duration: 0.55)) { drawn = true } }
    }
}

private struct WatchCheck: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.midY + r.height * 0.05))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.36, y: r.maxY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY))
        return p
    }
}

// MARK: - 4 · Home (the reference layout)

struct WatchHome: View {
    @Environment(WatchModel.self) private var model
    @State private var demoScheduled = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 8) {
                    heroCard
                    HStack(spacing: 6) {
                        NavigationLink { ReceiveQRView() } label: { PillRow(title: "Receive", symbol: "qrcode") }
                        NavigationLink { RequestPicker() } label: { PillRow(title: "Request", symbol: "arrow.down.left") }
                    }
                    .buttonStyle(.plain)
                    NavigationLink { WatchAskZen() } label: { PillRow(title: "Ask Zen", symbol: "sparkles") }
                        .buttonStyle(.plain)

                    if !model.txs.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Recent").font(.system(.caption, design: .rounded).weight(.semibold)).foregroundStyle(W.onPage2).padding(.leading, 6)
                            ForEach(model.txs.prefix(5)) { tx in
                                NavigationLink { WatchTxDetail(tx: tx) } label: { WatchTxRow(tx: tx) }.buttonStyle(.plain)
                            }
                        }
                        .padding(.top, 4)
                    }
                    footer
                }
                .padding(.horizontal, 4)
            }
            .scrollIndicators(.hidden)
            .containerBackground(for: .navigation) { FluidGradient() }
        }
    }

    /// Pastel mesh card: label, UPI id, huge balance, recent faces + a small green delta pill.
    private var heroCard: some View {
        Button {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) { model.showBalance.toggle() }
            if model.showBalance { Task { try? await Task.sleep(for: .seconds(8)); withAnimation { model.showBalance = false } } }
        } label: {
            ZStack(alignment: .topLeading) {
                PastelMesh()
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Main account").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(W.ink2)
                            Text(model.upiID).font(.system(size: 12, weight: .semibold, design: .rounded)).foregroundStyle(W.ink).lineLimit(1)
                        }
                        Spacer()
                        Image(systemName: model.showBalance ? "eye.slash" : "eye").font(.system(size: 12)).foregroundStyle(W.ink2)
                    }
                    Spacer(minLength: 6)
                    Text(model.showBalance ? Money.format(model.balance, decimals: false) : "₹ •••••")
                        .font(.system(size: 30, weight: .bold, design: .rounded)).monospacedDigit()
                        .foregroundStyle(W.ink).minimumScaleFactor(0.5).lineLimit(1)
                        .contentTransition(.numericText())
                    Spacer(minLength: 8)
                    HStack {
                        HStack(spacing: -8) {
                            ForEach(Array(model.txs.prefix(3).enumerated()), id: \.offset) { _, tx in
                                Text(String(tx.name.prefix(1)))
                                    .font(.system(size: 10, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                    .frame(width: 22, height: 22).background(Color(hex: 0x9AA3CF), in: .circle)
                                    .overlay(Circle().strokeBorder(Color(hex: 0xE9ECF9), lineWidth: 1.5))
                            }
                        }
                        Spacer()
                        Text("+₹1,200").font(.system(size: 11, weight: .semibold, design: .rounded)).foregroundStyle(W.up)
                            .padding(.horizontal, 8).padding(.vertical, 3).background(W.upBg, in: .capsule)
                    }
                }
                .padding(14)
            }
            .frame(height: 138)
            .clipShape(.rect(cornerRadius: 26, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(model.showBalance ? "Balance \(Money.format(model.balance))" : "Balance hidden. Double tap to show.")
    }

    private var footer: some View {
        VStack(spacing: 6) {
            Button { Task { await model.simulateIncoming(); demoScheduled = true } } label: {
                PillRow(title: demoScheduled ? "Alert in 5 s" : "Try an alert", symbol: "bell.badge")
            }
            .buttonStyle(.plain)
            Button("Disconnect", role: .destructive) { model.link.disconnectFromWatch() }.font(.caption2)
            HStack(spacing: 4) {
                Circle().fill(model.link.isReachable ? W.up : W.ink2).frame(width: 5, height: 5)
                Text(model.link.isReachable ? "Connected to \(model.link.peerName ?? "iPhone")" : "iPhone away")
                    .font(.system(size: 10, design: .rounded)).foregroundStyle(W.onPage2)
            }
        }
        .padding(.top, 6)
    }
}

struct WatchTxRow: View {
    let tx: WatchSnapshot.Tx
    var body: some View {
        HStack(spacing: 8) {
            Text(String(tx.name.prefix(1)))
                .font(.system(.footnote, design: .rounded).weight(.bold)).foregroundStyle(.white)
                .frame(width: 28, height: 28).background(Color(hex: 0x9AA3CF), in: .circle)
            VStack(alignment: .leading, spacing: 1) {
                Text(tx.name.split(separator: " ").first.map(String.init) ?? tx.name)
                    .font(.system(.footnote, design: .rounded).weight(.semibold)).foregroundStyle(W.ink).lineLimit(1)
                Text(tx.status == "success" ? tx.date.formatted(.relative(presentation: .named)) : (tx.status == "failed" ? "Failed" : "Processing"))
                    .font(.system(.caption2, design: .rounded)).foregroundStyle(W.ink2).lineLimit(1)
            }
            Spacer(minLength: 0)
            Text((tx.received ? "+" : "") + Money.format(Decimal(tx.amount)))
                .font(.system(.footnote, design: .rounded).weight(.semibold)).monospacedDigit()
                .foregroundStyle(tx.received ? W.up : W.ink)
                .strikethrough(tx.status == "failed")
        }
        .padding(.horizontal, 8).padding(.vertical, 8)
        .background(.white, in: .rect(cornerRadius: 20, style: .continuous))
    }
}

struct WatchTxDetail: View {
    let tx: WatchSnapshot.Tx
    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                ZStack(alignment: .topLeading) {
                    PastelMesh()
                    VStack(alignment: .leading, spacing: 4) {
                        Text(tx.name).font(.system(.caption, design: .rounded).weight(.medium)).foregroundStyle(W.ink2)
                        Text((tx.received ? "+" : "") + Money.format(Decimal(tx.amount)))
                            .font(.system(size: 28, weight: .bold, design: .rounded)).monospacedDigit().foregroundStyle(W.ink)
                            .minimumScaleFactor(0.6).lineLimit(1)
                        Text(tx.status == "success" ? "Completed" : (tx.status == "failed" ? "Failed" : "Processing"))
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(tx.status == "success" ? W.up : W.ink)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(tx.status == "success" ? W.upBg : .white, in: .capsule)
                    }
                    .padding(14).frame(maxWidth: .infinity, alignment: .leading)
                }
                .clipShape(.rect(cornerRadius: 26, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text("UPI Ref").font(.caption2).foregroundStyle(W.ink2)
                    Text(tx.ref).font(.caption.monospaced()).foregroundStyle(W.ink)
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding(12)
                .background(.white, in: .rect(cornerRadius: 20, style: .continuous))
            }
            .padding(.horizontal, 4)
        }
        .containerBackground(for: .navigation) { FluidGradient() }
        .navigationTitle(tx.date.formatted(.dateTime.day().month()))
    }
}

// MARK: - Receive

struct ReceiveQRView: View {
    @Environment(WatchModel.self) private var model
    var body: some View {
        VStack(spacing: 6) {
            Image("MyQR")
                .interpolation(.none)
                .resizable()
                .scaledToFit()
                .padding(10)
                .background(.white, in: .rect(cornerRadius: 22, style: .continuous))
                .accessibilityLabel("Your UPI QR code")
            Text(model.upiID).font(.system(.caption2, design: .rounded).weight(.medium)).foregroundStyle(W.onPage2)
        }
        .padding(.horizontal, 4)
        .containerBackground(for: .navigation) { FluidGradient() }
        .navigationTitle("Scan to pay me")
    }
}

// MARK: - Request (Digital Crown amount)

struct RequestPicker: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                ForEach(SampleData.contacts.filter { $0.isFavorite }) { c in
                    NavigationLink { RequestAmountView(contact: c) } label: {
                        HStack(spacing: 8) {
                            Text(String(c.firstName.prefix(1))).font(.system(.footnote, design: .rounded).weight(.bold)).foregroundStyle(.white)
                                .frame(width: 28, height: 28).background(Color(hex: 0x9AA3CF), in: .circle)
                            Text(c.firstName).font(.system(.footnote, design: .rounded).weight(.semibold)).foregroundStyle(W.ink)
                            Spacer()
                        }
                        .padding(8).background(.white, in: .rect(cornerRadius: 20, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 4)
        }
        .containerBackground(for: .navigation) { FluidGradient() }
        .navigationTitle("Request from")
    }
}

struct RequestAmountView: View {
    let contact: Contact
    @State private var amount: Double = 200
    @State private var sent = false

    var body: some View {
        VStack(spacing: 8) {
            if sent {
                ZStack { Circle().fill(W.upBg).frame(width: 56, height: 56)
                    Image(systemName: "checkmark").font(.system(size: 24, weight: .bold)).foregroundStyle(W.up) }
                    .transition(.scale.combined(with: .opacity))
                Text("Requested \(Money.format(Decimal(amount))) from \(contact.firstName)")
                    .font(.system(.footnote, design: .rounded)).foregroundStyle(W.onPage).multilineTextAlignment(.center)
            } else {
                Text(contact.firstName).font(.system(.caption, design: .rounded).weight(.medium)).foregroundStyle(W.onPage2)
                Text(Money.format(Decimal(amount)))
                    .font(.system(size: 36, weight: .bold, design: .rounded)).monospacedDigit().foregroundStyle(W.onPage)
                    .contentTransition(.numericText())
                    .focusable()
                    .digitalCrownRotation($amount, from: 10, through: 10_000, by: 10, sensitivity: .medium,
                                          isContinuous: false, isHapticFeedbackEnabled: true)
                Text("Turn the Digital Crown").font(.caption2).foregroundStyle(W.onPage2)
                Button {
                    withAnimation(.spring(response: 0.6, dampingFraction: 0.74)) { sent = true }
                    WKInterfaceDevice.current().play(.success)
                } label: { PillRow(title: "Request", symbol: "arrow.down.left") }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 4)
        .animation(.spring(response: 0.28, dampingFraction: 0.86), value: amount)
        .containerBackground(for: .navigation) { FluidGradient() }
        .navigationTitle(contact.firstName)
    }
}

// MARK: - Rich notification (long look)

final class PaymentNotificationController: WKUserNotificationHostingController<PaymentNotificationView> {
    private var amount = "₹1,200"
    private var sender = "Arjun Nair"
    private var note = ""

    override var body: PaymentNotificationView {
        PaymentNotificationView(amount: amount, sender: sender, note: note)
    }

    override func didReceive(_ notification: UNNotification) {
        let info = notification.request.content.userInfo
        amount = info["amount"] as? String ?? amount
        sender = info["sender"] as? String ?? sender
        note = info["note"] as? String ?? ""
    }
}

struct PaymentNotificationView: View {
    let amount: String
    let sender: String
    let note: String

    @State private var shown = false
    @State private var counted: Double = 0
    private var target: Double { Double(amount.filter { $0.isNumber || $0 == "." }) ?? 0 }

    var body: some View {
        VStack(spacing: 6) {
            ZStack(alignment: .bottomTrailing) {
                Text(String(sender.prefix(1)))
                    .font(.system(.title3, design: .rounded).weight(.bold))
                    .frame(width: 46, height: 46).background(.white.opacity(0.2), in: .circle)
                Image(systemName: "arrow.down.left.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(.black, .white)
                    .offset(x: 4, y: 4)
            }
            Text("+\(Money.format(Decimal(counted)))")
                .font(.system(size: 30, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .contentTransition(.numericText(value: counted))
            Text("from \(sender)").font(.footnote)
            if !note.isEmpty {
                Text("“\(note)”").font(.caption2).foregroundStyle(.secondary)
            }
            Label("Credited to your account", systemImage: "checkmark.seal.fill")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .foregroundStyle(.white)
        .scaleEffect(shown ? 1 : 0.85).opacity(shown ? 1 : 0)
        .task {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) { shown = true }
            WKInterfaceDevice.current().play(.success)
            for k in 1...24 {
                try? await Task.sleep(for: .milliseconds(30))
                let e = 1 - pow(1 - Double(k) / 24, 3)
                withAnimation(.snappy(duration: 0.1)) { counted = target * e }
            }
            counted = target
        }
    }
}

#Preview("Watch") { WatchRoot().environment(WatchModel()) }
