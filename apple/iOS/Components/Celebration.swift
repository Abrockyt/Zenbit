import SwiftUI

/// Redeem sequence: black full screen → circular loader while "the bank" is contacted (the amount counts up) →
/// the loader becomes a green tick that draws itself, coins rain, a chime plays, and the bank + reference are confirmed.
/// Reduce Motion: no rain, no spin-in.
struct Celebration: View {
    let amount: Decimal
    let account: BankAccount
    var onDone: () -> Void

    @State private var phase = 0            // 0 enter · 1 sending · 2 sent
    @State private var counted: Decimal = 0
    @State private var tick: CGFloat = 0
    @State private var sentAt = Date()
    @State private var ref = Ref.upi()
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if phase >= 2 && !reduceMotion { CoinRain(since: sentAt).ignoresSafeArea().allowsHitTesting(false) }

            VStack(spacing: 28) {
                Spacer()
                ZStack {
                    if phase < 2 {
                        ZSpinner(size: 88, lineWidth: 5, color: .white).transition(.scale(scale: 0.6).combined(with: .opacity))
                    } else {
                        Circle().fill(ZB.Palette.green).frame(width: 88, height: 88)
                            .transition(.scale(scale: 0.4).combined(with: .opacity))
                        CheckShape().trim(from: 0, to: tick)
                            .stroke(Color.black, style: StrokeStyle(lineWidth: 7, lineCap: .round, lineJoin: .round))
                            .frame(width: 38, height: 29)
                    }
                }
                .frame(height: 88)

                VStack(spacing: 8) {
                    Text(phase >= 2 ? "Sent to your bank" : "Sending to your bank…")
                        .font(.headline).foregroundStyle(.white.opacity(0.7)).contentTransition(.opacity)
                    Text(Money.format(counted, decimals: true))
                        .font(.system(size: 58, weight: .bold, design: .rounded)).monospacedDigit().foregroundStyle(.white)
                        .contentTransition(.numericText(value: counted.doubleValue))
                }

                HStack(spacing: 12) {
                    BankLogo(bankName: account.bankName, height: 38)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(account.bankName).font(.subheadline.weight(.semibold)).foregroundStyle(.white)
                        Text("\(account.kind) •• \(account.last4)").font(.footnote).foregroundStyle(.white.opacity(0.6))
                    }
                    Spacer(minLength: 0)
                    Image(systemName: phase >= 2 ? "checkmark.circle.fill" : "arrow.right")
                        .foregroundStyle(phase >= 2 ? ZB.Palette.green : .white.opacity(0.5))
                        .contentTransition(.symbolEffect(.replace))
                }
                .padding(14)
                .frame(maxWidth: 360)
                .background(.white.opacity(0.09), in: .rect(cornerRadius: 22, style: .continuous))

                if phase >= 2 {
                    VStack(spacing: 4) {
                        Text("UPI Ref \(ref)").font(.footnote.monospaced()).foregroundStyle(.white.opacity(0.55))
                        Text("Usually arrives within a minute").font(.footnote).foregroundStyle(.white.opacity(0.55))
                    }
                    .transition(.opacity.combined(with: .offset(y: 8)))
                }
                Spacer()
                if phase >= 2 {
                    Button(action: onDone) {
                        Text("Done").font(.headline).foregroundStyle(.black)
                            .frame(maxWidth: .infinity, minHeight: 54).background(.white, in: .capsule)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, ZB.Space.margin)
                    .transition(.opacity.combined(with: .offset(y: 12)))
                }
            }
            .padding(.bottom, ZB.Space.md)
        }
        .preferredColorScheme(.dark)
        .animation(.spring(response: 0.55, dampingFraction: 0.82), value: phase)
        .sensoryFeedback(.success, trigger: phase == 2)
        .task {
            Haptics.soft()
            phase = 1
            let steps = 40
            for k in 1...steps {                                // the amount counts up while the loader turns
                try? await Task.sleep(for: .milliseconds(40))
                let e = 1 - pow(1 - Double(k) / Double(steps), 3)
                withAnimation(.snappy(duration: 0.1)) { counted = (amount * Decimal(e)).rounded(2) }
                if k % 8 == 0 { Haptics.tap() }
            }
            counted = amount
            try? await Task.sleep(for: .milliseconds(350))
            sentAt = Date()
            phase = 2
            Sounds.play(.redeem)
            withAnimation(.easeOut(duration: 0.5).delay(0.18)) { tick = 1 }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(phase >= 2 ? "\(Money.format(amount, decimals: true)) sent to \(account.bankName)" : "Sending \(Money.format(amount, decimals: true))")
    }
}

/// Gold coins and a few colour flecks tumbling down (deterministic per index).
struct CoinRain: View {
    let since: Date
    private func r(_ i: Int, _ s: Double) -> Double { let x = sin(Double(i) * 12.9898 + s * 78.233) * 43758.5453; return x - floor(x) }

    var body: some View {
        TimelineView(.animation) { ctx in
            let t = ctx.date.timeIntervalSince(since)
            Canvas { gc, size in
                for i in 0..<46 {
                    let delay = r(i, 1) * 1.1
                    let q = (t - delay) / (2.3 + r(i, 2) * 1.2)
                    guard q >= 0, q <= 1 else { continue }
                    let x = size.width * r(i, 3) + sin(q * 7 + Double(i)) * 18
                    let y = -40 + (size.height + 80) * q
                    let d = 14 + r(i, 4) * 16
                    let squish = abs(cos(q * 9 + Double(i)))                 // coin turning in the air
                    gc.opacity = 1 - max(0, (q - 0.88) / 0.12)
                    if i % 5 == 0 {                                          // flecks of colour
                        let col = [Color(hex: 0x00C46A), Color(hex: 0x6D6AFF), Color(hex: 0xFF5FA2), Color(hex: 0xFFC83D)][i % 4]
                        gc.fill(Path(roundedRect: CGRect(x: x, y: y, width: 7, height: 11 * squish + 2), cornerRadius: 2), with: .color(col))
                    } else {
                        let coin = CGRect(x: x - d / 2, y: y - d / 2, width: d * (0.35 + 0.65 * squish), height: d)
                        gc.fill(Path(ellipseIn: coin), with: .linearGradient(Gradient(colors: [Color(hex: 0xFFE08A), Color(hex: 0xE5A526)]),
                                                                             startPoint: coin.origin, endPoint: CGPoint(x: coin.maxX, y: coin.maxY)))
                        gc.stroke(Path(ellipseIn: coin.insetBy(dx: d * 0.14 * squish, dy: d * 0.14)), with: .color(Color(hex: 0xB9801A).opacity(0.7)), lineWidth: 1)
                    }
                }
            }
        }
    }
}
