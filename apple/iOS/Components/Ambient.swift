import SwiftUI

// MARK: - Fluid hero background (MeshGradient – mostly canvas, a breath of green)

struct FluidBackground: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var intensity: Double = 1

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30, paused: reduceMotion)) { context in
            let t = reduceMotion ? 0 : context.date.timeIntervalSinceReferenceDate
            let base = ZB.Palette.canvas
            let tint = ZB.Palette.green.opacity((scheme == .dark ? 0.32 : 0.22) * intensity)
            let mint = ZB.Palette.mint.opacity((scheme == .dark ? 0.16 : 0.3) * intensity)
            MeshGradient(
                width: 3, height: 3,
                points: [
                    [0, 0], [0.5, 0], [1, 0],
                    [Float(0.0), Float(0.5 + 0.08 * sin(t * 0.5))],
                    [Float(0.5 + 0.12 * cos(t * 0.4)), Float(0.45 + 0.1 * sin(t * 0.33))],
                    [Float(1.0), Float(0.5 + 0.08 * cos(t * 0.45))],
                    [0, 1], [0.5, 1], [1, 1],
                ],
                colors: [
                    base, mint, base,
                    tint, base, mint,
                    base, base, base,
                ],
                smoothsColors: true)
        }
        .ignoresSafeArea()
    }
}

// MARK: - Apple-Intelligence-style glow, in Zenbit greens

/// Soft animated angular-gradient stroke used *only* on AI surfaces (Von Restorff: AI is
/// visually distinct, and Apple's guidance asks to clearly identify where AI is used).
struct AIGlow: ViewModifier {
    var active: Bool
    var radius: CGFloat
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content.overlay {
            TimelineView(.animation(paused: !active || reduceMotion)) { ctx in
                let angle = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate * 90
                let gradient = AngularGradient(
                    colors: [ZB.Palette.green, ZB.Palette.mint, Color(hex: 0x3DDCFF), Color(hex: 0xB7F7D8),
                             ZB.Palette.green],
                    center: .center, angle: .degrees(angle))
                ZStack {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(gradient, lineWidth: 2)
                        .opacity(active ? 1 : 0)
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(gradient, lineWidth: active ? 8 : 0)
                        .blur(radius: 10)
                        .opacity(active ? 0.55 : 0)
                }
            }
            .allowsHitTesting(false)
        }
        .animation(ZB.Motion.standard, value: active)
    }
}

extension View {
    func aiGlow(active: Bool = false, radius: CGFloat = ZB.Radius.lg) -> some View {
        modifier(AIGlow(active: active, radius: radius))
    }
}

/// "AI" disclosure chip.
struct AIBadge: View {
    var text = "Zen AI"
    var body: some View {
        Label(text, systemImage: "sparkles")
            .font(.caption.weight(.semibold))
            .foregroundStyle(ZB.Palette.greenInk)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(ZB.Palette.greenSoft, in: .capsule)
    }
}
