import SwiftUI

/// Zenbit's circular loader: a round-capped arc that fades in behind its head and turns continuously.
/// Used wherever the app waits on a bank or server (PIN check, payment, redeem, OTP).
struct ZSpinner: View {
    var size: CGFloat = 28
    var lineWidth: CGFloat? = nil
    var color: Color = ZB.Palette.ink
    @State private var spin = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let lw = lineWidth ?? max(2, size * 0.11)
        ZStack {
            Circle().stroke(color.opacity(0.12), lineWidth: lw)
            Circle()
                .trim(from: 0, to: 0.72)
                .stroke(AngularGradient(colors: [color.opacity(0), color], center: .center, startAngle: .degrees(0), endAngle: .degrees(260)),
                        style: StrokeStyle(lineWidth: lw, lineCap: .round))
                .rotationEffect(.degrees(spin ? 360 : 0))
        }
        .frame(width: size, height: size)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.linear(duration: 0.95).repeatForever(autoreverses: false)) { spin = true }
        }
        .accessibilityLabel("Loading")
    }
}

#Preview { HStack(spacing: 24) { ZSpinner(size: 20); ZSpinner(size: 44); ZSpinner(size: 72, color: .green) }.padding() }
