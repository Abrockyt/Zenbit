import SwiftUI
import UIKit

/// The signature moment (Peak–End rule) — "the money goes into the Dynamic Island".
///
/// 1. **Count** – a green cash card in the middle counts the amount up while the aurora breathes
///    and "● PROCESSING PAYMENT" pulses (Doherty: motion within 100 ms of the PIN).
/// 2. **Dissolve** – on success the card breaks into iridescent pixels (left → right) that stream along an S-curve into the island – the coupon-dissolve reference. (Old: a rocket with an exhaust glow and a
///    coin trail, shrinking and darkening until it *becomes* the Dynamic Island
///    (the Apple Music minimise motion).
/// 3. **Island** – it springs open to a pill showing only the amount and a tick that draws itself, holds, then
///    shrinks back into the hardware island with iOS-style physics.
/// 4. **Compact** – it settles into a compact pill (like music playing) while the receipt focuses in.
/// Failure: the card lifts, loses thrust and drops back red. Pending: the card holds, amber.
/// Reduce Motion: no launch – cross-fades only.
struct PaymentJourneyView: View {
    let payee: Contact
    let amount: Decimal
    let note: String
    let outcome: PaymentOutcome?
    var onDone: () -> Void
    var onRetry: () -> Void

    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    enum IslandMode { case hidden, expanded }

    @State private var counted: Decimal = 0
    @State private var dissolveStart: Date?
    @State private var closing = false
    @State private var cardVisible = true
    @State private var island: IslandMode = .hidden
    @State private var showReceipt = false
    @State private var checkTrim: CGFloat = 0
    @State private var startedAt = Date()
    @State private var hapticTick = 0
    @State private var shake: CGFloat = 0
    @State private var resolved = false

    private var status: TxStatus? { resolved ? outcome?.transaction.status : nil }

    var body: some View {
        GeometryReader { geo in
            let size = geo.size
            let geom = IslandGeometry(size: size, mode: island)
            let cardW = min(size.width - 72, 310)
            let from = CGRect(x: (size.width - cardW) / 2, y: size.height * 0.4 - 95, width: cardW, height: 190)
            let to = CGRect(x: size.width / 2 - 62.5, y: geom.topY, width: 125, height: 37)

            ZStack {
                ZB.Palette.canvas

                AuroraGlow(active: !showReceipt && !closing, colors: auroraColors)

                if !showReceipt && !closing {
                    HStack(spacing: ZB.Space.xs) {
                        AvatarView(contact: payee, size: 28)
                        Text("To \(payee.name)").font(.subheadline.weight(.semibold))
                    }
                    .position(x: size.width / 2, y: from.minY - 34)
                    .opacity(dissolveStart == nil ? 1 : 0)
                    .animation(.easeOut(duration: 0.3), value: dissolveStart)
                    .transition(.opacity)

                    VStack(spacing: 14) {
                        if status == nil { ZSpinner(size: 26).transition(.scale.combined(with: .opacity)) }
                        MonoStatus(text: statusText, tint: statusTint, pulsing: false)
                    }
                    .position(x: size.width / 2, y: from.maxY + (status == nil ? 62 : 40))
                    .animation(.easeOut(duration: 0.25), value: status)
                    .transition(.opacity)
                }

                if cardVisible {
                    DissolveStream(from: from, to: CGPoint(x: to.midX, y: to.midY), start: dissolveStart) {
                        CashCard(amountText: Money.format(counted), payee: payee, tint: cardTint)
                    }
                    .modifier(Shake(amount: 12, shakes: 3, animatableData: shake))
                    .transition(.opacity)
                }

                IslandView(payee: payee, amount: amount, mode: island, status: status, geom: geom, showsWhenIdle: !closing)

                if showReceipt {
                    ReceiptView(payee: payee, amount: amount, outcome: outcome, checkTrim: checkTrim,
                                onDone: closeOut, onRetry: onRetry)
                        .padding(.top, geom.restingBottom + ZB.Space.lg)
                        .transition(.asymmetric(insertion: .modifier(active: FocusIn(amount: 1), identity: FocusIn(amount: 0)),
                                                removal: .scale(scale: 0.2, anchor: .top).combined(with: .opacity)))
                }
            }
            .ignoresSafeArea()
        }
        // Like a Live Activity: the status bar steps aside only while the island is fully expanded.
        .statusBarHidden(island != .hidden || (dissolveStart != nil && !showReceipt))
        .sensoryFeedback(trigger: hapticTick) { _, _ in
            switch status {
            case .success: .success
            case .failed: .error
            default: .warning
            }
        }
        .task { await begin() }
        .onChange(of: outcome?.transaction.id) { _, id in
            guard id != nil else { return }
            Task { await finish() }
        }
    }

    // MARK: Choreography

    private func begin() async {
        startedAt = Date()
        Haptics.soft()
        LiveActivityManager.start(payee: payee, amount: amount)
        // Cash counter: eased count-up with light ticks (like a note counter).
        let steps = 18
        for k in 1...steps {
            try? await Task.sleep(for: .milliseconds(45))
            let e = 1 - pow(1 - Double(k) / Double(steps), 3)
            withAnimation(.snappy(duration: 0.1)) {
                counted = (amount * Decimal(e)).rounded(amount.rounded(0) == amount ? 0 : 2)
            }
            if k % 3 == 0 { Haptics.tap() }
        }
        counted = amount
        if outcome != nil { await finish() }
    }

    private func finish() async {
        guard !resolved else { return }
        let elapsed = Date().timeIntervalSince(startedAt)
        if elapsed < 1.1 { try? await Task.sleep(for: .seconds(1.1 - elapsed)) }
        guard !resolved else { return }
        resolved = true
        if let tx = outcome?.transaction {
            LiveActivityManager.finish(status: tx.status, amount: amount, ref: tx.upiRef)
        }

        switch outcome?.transaction.status {
        case .success: await launchSuccess()
        case .failed: await launchFailure()
        default: await holdPending()
        }
    }

    /// Done: the receipt lifts and shrinks into the island, the island tucks back into the
    /// hardware, then we hand back to Home (which confirms with a toast).
    private func closeOut() {
        guard !closing else { return }
        closing = true
        Haptics.tap()
        // 1) receipt shrinks up into the island; 2) island tucks back into the hardware; 3) hand back to Home.
        withAnimation(.spring(response: 0.42, dampingFraction: 0.92)) { showReceipt = false }
        Task {
            try? await Task.sleep(for: .milliseconds(420))
            onDone()
        }
    }

    /// The island's two moves: a bouncy spring open, and a calm, slightly overdamped close (like iOS).
    private let openSpring = Animation.spring(response: 0.46, dampingFraction: 0.68)
    private let closeSpring = Animation.spring(response: 0.62, dampingFraction: 0.92)

    private func launchSuccess() async {
        if reduceMotion {
            withAnimation(.easeInOut(duration: 0.3)) { cardVisible = false; island = .expanded }
            hapticTick += 1
            Sounds.play(.success)
            try? await Task.sleep(for: .seconds(1.4))
            withAnimation(.easeInOut(duration: 0.3)) { island = .hidden }
            withAnimation(.easeInOut(duration: 0.35)) { showReceipt = true; checkTrim = 1 }
            return
        }
        // 1) The card dissolves into pixels that stream up into the island.
        Haptics.soft()
        Sounds.play(.whoosh)
        dissolveStart = Date()
        try? await Task.sleep(for: .milliseconds(1_000))
        // 2) The island springs open to receive them – amount + a tick that draws itself.
        withAnimation(openSpring) { island = .expanded }
        try? await Task.sleep(for: .milliseconds(380))
        cardVisible = false
        // The circle draws, then the tick – the chime lands exactly as the tick completes.
        try? await Task.sleep(for: .milliseconds(520))
        Sounds.play(.success)
        hapticTick += 1
        // 3) Hold, then shrink back into the hardware island.
        try? await Task.sleep(for: .milliseconds(900))
        withAnimation(closeSpring) { island = .hidden }
        // 4) The receipt comes into focus as the island settles.
        try? await Task.sleep(for: .milliseconds(260))
        withAnimation(.spring(response: 0.6, dampingFraction: 0.86)) { showReceipt = true }
        withAnimation(.easeOut(duration: 0.5).delay(0.35)) { checkTrim = 1 }
    }

    private func launchFailure() async {
        // Money never left: the card stays whole, turns red and shakes – no dissolve.
        if !reduceMotion { withAnimation(.linear(duration: 0.4)) { shake += 1 } }
        hapticTick += 1
        Sounds.play(.failure)
        try? await Task.sleep(for: .seconds(1.1))
        withAnimation(ZB.Motion.standard) { cardVisible = false }
        withAnimation(ZB.Motion.hero.delay(0.1)) { showReceipt = true }
    }

    private func holdPending() async {
        withAnimation(openSpring) { island = .expanded }
        hapticTick += 1
        Sounds.play(.pending)
        try? await Task.sleep(for: .milliseconds(1_500))
        withAnimation(closeSpring) { island = .hidden }
        withAnimation(ZB.Motion.standard) { cardVisible = false }
        withAnimation(ZB.Motion.hero.delay(0.2)) { showReceipt = true }
    }

    // MARK: Styling helpers

    private var statusText: String {
        switch status {
        case .success: "PAYMENT SENT"
        case .failed: "PAYMENT FAILED"
        case .pending, .refunded: "WAITING FOR BANK"
        case nil: "PROCESSING PAYMENT"
        }
    }
    private var statusTint: Color {
        switch status {
        case .success: ZB.Palette.greenInk
        case .failed: ZB.Palette.danger
        case .pending, .refunded: ZB.Palette.warning
        case nil: ZB.Palette.inkSecondary
        }
    }
    private var cardTint: Color? {
        switch status {
        case .failed: Color(hex: 0xFF5147)
        case .pending: Color(hex: 0xFFB340)
        default: nil
        }
    }
    private var auroraColors: [Color] {
        switch status {
        case .failed: [Color(hex: 0xFF5147), Color(hex: 0xFF9F7A), .white]
        case .pending: [Color(hex: 0xFFB340), Color(hex: 0xFFE2A8), .white]
        default: [ZB.Palette.green, Color(hex: 0x3DDCFF), ZB.Palette.mint]
        }
    }
}

// MARK: - Island geometry (matches the Dynamic Island on iPhone 14 Pro … 17 family)

struct IslandGeometry {
    let size: CGSize
    var mode: PaymentJourneyView.IslandMode = .hidden

    static var windowTopInset: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.keyWindow?.safeAreaInsets.top }.first ?? 47
    }

    static var hasDynamicIsland: Bool {
        UIDevice.current.userInterfaceIdiom == .phone && windowTopInset >= 51
    }

    /// Measured on every iOS 26 simulator (pixel scan of the hardware island):
    /// 125 × 36.67 pt everywhere, centred; only the top offset differs by model –
    ///   11.33 pt: 14 Pro/Pro Max, 15/15 Plus/15 Pro/15 Pro Max, 16/16 Plus   (393 / 430 pt wide)
    ///   14 pt   : 16 Pro/Pro Max, 17, 17 Pro/Pro Max                         (402 / 440 pt wide)
    ///   20 pt   : iPhone Air                                                 (420 pt wide)
    ///   none    : 16e, 17e (notch)
    var topY: CGFloat { Self.islandTop }
    var collapsed: CGSize { CGSize(width: 125, height: 36.67) }

    static var islandTop: CGFloat {
        guard hasDynamicIsland else { return 16 }
        let w = Double(UIScreen.main.bounds.width.rounded())
        switch w {
        case 393, 430: return 11.33
        case 420: return 20
        default: return 14      // 402, 440 and future sizes
        }
    }
    /// Open. With a physical island the pill widens to either side of the sensor cutout (content can't sit
    /// behind the cutout – iOS puts it leading/trailing); on other phones it's a centred medium pill.
    var expandedSize: CGSize {
        Self.hasDynamicIsland ? CGSize(width: min(size.width - 70, 300), height: 36.67)
                              : CGSize(width: min(size.width - 120, 252), height: 64)
    }
    var current: CGSize { mode == .expanded ? expandedSize : collapsed }
    var restingBottom: CGFloat { topY + collapsed.height + 30 }
}

// MARK: - Island (amount + a tick that draws itself)

private struct IslandView: View {
    let payee: Contact
    let amount: Decimal
    let mode: PaymentJourneyView.IslandMode
    let status: TxStatus?
    let geom: IslandGeometry
    /// The idle capsule blends with the hardware island; hide it once the screen starts leaving.
    var showsWhenIdle = true
    @State private var drawn = false

    var body: some View {
        let s = geom.current
        let full = geom.expandedSize
        ZStack(alignment: .top) {
            Capsule(style: .continuous).fill(.black)
                .frame(width: s.width, height: s.height)

            let onIsland = IslandGeometry.hasDynamicIsland
            HStack(spacing: 0) {
                Text(Money.format(amount))
                    .font(.system(size: onIsland ? 17 : 26, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .lineLimit(1).minimumScaleFactor(0.6)
                    .frame(maxWidth: onIsland ? (full.width - geom.collapsed.width) / 2 - 18 : nil, alignment: .leading)
                if onIsland {
                    Spacer(minLength: geom.collapsed.width + 4)   // the sensor cutout lives here
                } else {
                    Spacer().frame(width: 12)
                }
                StatusMark(status: status, drawn: drawn)
                    .frame(width: onIsland ? 22 : 28, height: onIsland ? 22 : 28)
            }
            .padding(.horizontal, onIsland ? 16 : 0)
            .frame(width: full.width, height: full.height)
            .opacity(mode == .expanded ? 1 : 0)
            .animation(.easeOut(duration: 0.18), value: mode)
        }
        .frame(width: full.width, height: full.height, alignment: .top)
        .mask(alignment: .top) { Capsule(style: .continuous).frame(width: s.width, height: s.height) }
        .opacity((IslandGeometry.hasDynamicIsland && showsWhenIdle) || mode != .hidden ? 1 : 0)
        .position(x: geom.size.width / 2, y: geom.topY + full.height / 2)
        .onChange(of: mode) { _, m in
            if m == .expanded {
                drawn = false
                withAnimation(.easeOut(duration: 0.55).delay(0.28)) { drawn = true }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(Money.format(amount)) \(status == .failed ? "failed" : "paid")")
    }
}

/// A circle that draws itself, then a tick (or ✕ / clock) inside it.
private struct StatusMark: View {
    let status: TxStatus?
    let drawn: Bool

    var body: some View {
        ZStack {
            switch status {
            case .failed:
                Circle().trim(from: 0, to: drawn ? 1 : 0).stroke(Color(hex: 0xFF5147), style: .init(lineWidth: 2.5, lineCap: .round)).rotationEffect(.degrees(-90))
                CrossShape().trim(from: 0, to: drawn ? 1 : 0).stroke(Color(hex: 0xFF5147), style: .init(lineWidth: 2.5, lineCap: .round)).padding(8)
            case .pending:
                Circle().trim(from: 0, to: drawn ? 1 : 0).stroke(Color(hex: 0xFFB340), style: .init(lineWidth: 2.5, lineCap: .round)).rotationEffect(.degrees(-90))
                Image(systemName: "clock").font(.system(size: 13, weight: .semibold)).foregroundStyle(Color(hex: 0xFFB340)).opacity(drawn ? 1 : 0)
            default:
                Circle().trim(from: 0, to: drawn ? 1 : 0).stroke(.white, style: .init(lineWidth: 2.5, lineCap: .round)).rotationEffect(.degrees(-90))
                Circle().fill(.white).scaleEffect(drawn ? 1 : 0.2).opacity(drawn ? 1 : 0)
                    .animation(.spring(response: 0.4, dampingFraction: 0.7).delay(0.55), value: drawn)
                CheckShape().trim(from: 0, to: drawn ? 1 : 0)
                    .stroke(.black, style: .init(lineWidth: 2.8, lineCap: .round, lineJoin: .round)).padding(8)
                    .animation(.easeOut(duration: 0.3).delay(0.62), value: drawn)
            }
        }
    }
}

private struct CrossShape: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.maxY))
        p.move(to: CGPoint(x: r.maxX, y: r.minY)); p.addLine(to: CGPoint(x: r.minX, y: r.maxY))
        return p
    }
}

// MARK: - Cash card

/// A banknote-like card: guilloché rings, ₹ watermark, rounded amount.
private struct CashCard: View {
    let amountText: String
    let payee: Contact
    let tint: Color?

    var body: some View {
        ZStack(alignment: .topLeading) {
            LinearGradient(colors: tint.map { [$0.opacity(0.9), $0] } ?? [Color(hex: 0x1C2120), Color(hex: 0x060707)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            ForEach(0..<5, id: \.self) { i in
                Circle().strokeBorder(.white.opacity(0.06), lineWidth: 1)
                    .frame(width: 80 + CGFloat(i) * 46)
                    .offset(x: 170, y: 70)
            }
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: "indianrupeesign.circle.fill").foregroundStyle(tint == nil ? ZB.Palette.green : .white)
                    Text("ZENBIT").font(.system(.caption2, design: .monospaced).weight(.bold)).tracking(2)
                    Spacer()
                    Text("UPI").font(.system(.caption2, design: .monospaced).weight(.bold)).tracking(2)
                }
                .foregroundStyle(.white.opacity(0.7))
                Spacer()
                Text(amountText)
                    .font(.system(size: 46, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .contentTransition(.numericText())
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                Text(payee.upiID.isEmpty ? payee.name : payee.upiID)
                    .font(.footnote).foregroundStyle(.white.opacity(0.55)).lineLimit(1)
            }
            .padding(20)
        }
        .clipShape(.rect(cornerRadius: 28, style: .continuous))
    }
}

// MARK: - Receipt

private struct ReceiptView: View {
    @Environment(AppModel.self) private var model
    let payee: Contact
    let amount: Decimal
    let outcome: PaymentOutcome?
    let checkTrim: CGFloat
    var onDone: () -> Void
    var onRetry: () -> Void

    @State private var shown: Decimal = 0
    private var tx: Transaction? { outcome?.transaction }
    private var status: TxStatus { tx?.status ?? .pending }
    private var cashback: Decimal {
        var raw = amount * model.cashbackRate, r = Decimal()
        NSDecimalRound(&r, &raw, 2, .plain)
        return max(r, 0.10)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: ZB.Space.xl) {
                badge
                VStack(spacing: ZB.Space.xs) {
                    Text(Money.format(shown))
                        .font(.zbAmountLarge).monospacedDigit()
                        .contentTransition(.numericText(value: shown.doubleValue))
                        .task {
                            let steps = 14
                            for k in 1...steps {
                                try? await Task.sleep(for: .milliseconds(38))
                                let e = 1 - pow(1 - Double(k) / Double(steps), 3)
                                withAnimation(.snappy(duration: 0.12)) {
                                    shown = (amount * Decimal(e)).rounded(amount.rounded(0) == amount ? 0 : 2)
                                }
                            }
                            shown = amount
                        }
                    Text(headline).font(.headline)
                    Text(subline).font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                        .multilineTextAlignment(.center)
                }

                if status == .success {
                    // Reward moment (super.money-style) – sits right at the peak.
                    HStack(spacing: ZB.Space.sm) {
                        CoinView(size: 30, spin: 20)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("You earned \(Money.format(cashback, decimals: true)) cashback")
                                .font(.subheadline.weight(.semibold))
                            Text(amount >= 500 ? "+ a scratch card · see Rewards" : "0.5% back on every payment")
                                .font(.caption).foregroundStyle(ZB.Palette.inkSecondary)
                        }
                        Spacer()
                    }
                    .padding(ZB.Space.md)
                    .background(ZB.Palette.surface, in: .rect(cornerRadius: ZB.Radius.md, style: .continuous))
                }

                if let tx {
                    VStack(spacing: 0) {
                        CopyRow(title: "UPI Ref No.", value: tx.upiRef)
                        Divider().overlay(ZB.Palette.hairline)
                        CopyRow(title: "To", value: payee.upiID.isEmpty ? payee.name : payee.upiID, mono: false)
                        Divider().overlay(ZB.Palette.hairline)
                        HStack(alignment: .center) {
                            VStack(alignment: .leading, spacing: 5) {
                                Text("From").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                                Text(tx.accountMasked).font(.body)
                            }
                            Spacer()
                            Text(tx.date.zbTime).font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                        }
                        .padding(.vertical, ZB.Space.sm)
                    }
                    .padding(.horizontal, ZB.Space.lg)
                    .padding(.vertical, ZB.Space.xs)
                    .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
                }
            }
            .padding(.horizontal, ZB.Space.margin)
            .frame(maxWidth: 520)
            .frame(maxWidth: .infinity)
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: ZB.Space.xs) {
                if status == .failed {
                    Button(tx?.failureCode == "insufficient_funds" ? "Choose another account" : "Try again", action: onRetry).buttonStyle(.zbInk)
                    Button("Done", action: onDone).buttonStyle(.zbSecondary)
                } else {
                    Button("Done", action: onDone).buttonStyle(.zbInk)
                    if let tx {
                        ShareLink(item: shareText(tx)) {
                            Label("Share receipt", systemImage: "square.and.arrow.up")
                        }
                        .buttonStyle(.zbSecondary)
                    }
                }
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, 34)
            .frame(maxWidth: 520)
        }
    }

    private var badge: some View {
        ZStack {
            Circle().fill(badgeFill).frame(width: 84, height: 84)
            switch status {
            case .success:
                CheckShape().trim(from: 0, to: checkTrim)
                    .stroke(ZB.Palette.onGreen, style: StrokeStyle(lineWidth: 7, lineCap: .round, lineJoin: .round))
                    .frame(width: 36, height: 28)
            case .failed:
                Image(systemName: "exclamationmark").font(.system(size: 36, weight: .bold)).foregroundStyle(.white)
            default:
                Image(systemName: "clock").font(.system(size: 34, weight: .semibold)).foregroundStyle(.black)
            }
        }
        .accessibilityLabel(status.label)
    }

    private var badgeFill: Color {
        switch status {
        case .success: ZB.Palette.green
        case .failed: ZB.Palette.danger
        default: Color(hex: 0xFFB340)
        }
    }
    private var headline: String {
        switch status {
        case .success: "Paid to \(payee.name)"
        case .failed: tx?.failureCode == "insufficient_funds" ? "Not enough balance" : "Payment to \(payee.firstName) failed"
        default: "Payment is processing"
        }
    }
    private var subline: String {
        if let reason = tx?.failureReason { return reason }
        return (tx?.date ?? Date()).formatted(date: .abbreviated, time: .shortened)
    }
    private func shareText(_ tx: Transaction) -> String {
        """
        Paid \(Money.format(tx.amount)) to \(tx.counterparty.name) via Zenbit
        UPI Ref: \(tx.upiRef)
        \(tx.date.formatted(date: .long, time: .shortened))
        """
    }
}

struct CheckShape: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.midY + r.height * 0.05))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.36, y: r.maxY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY))
        return p
    }
}

/// Blur + scale + fade ("comes into focus").
private struct FocusIn: ViewModifier {
    var amount: CGFloat
    func body(content: Content) -> some View {
        content
            .blur(radius: 18 * amount)
            .scaleEffect(1 - 0.08 * amount)
            .opacity(1 - amount)
    }
}
