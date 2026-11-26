import SwiftUI

// Zen AI motion language (monochrome). Inspired by how Gemini and Siri show an assistant "thinking" –
// a soft glow that fills the top of the screen, shimmering status text, and a few tiny twinkling dots around the
// input when it appears – but only black, white and grey.

/// Smoky grey light that breathes over the top of the screen while the assistant works.
struct ThinkingGlow: View {
    var active: Bool
    @State private var level: Double = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let colors: [Color] = [
        Color(hex: 0x0B0C10), Color(hex: 0x7A7D89), Color(hex: 0x1A1B20),
        Color(hex: 0x9A9CA6), Color(hex: 0x0B0C10), Color(hex: 0x4A4C55),
        Color(hex: 0x15161B), Color(hex: 0x8A8C96), Color(hex: 0x20212A),
    ]

    private func points(_ t: Double) -> [SIMD2<Float>] {
        func p(_ x: Double, _ y: Double, _ ax: Double = 0, _ ay: Double = 0, _ s: Double = 0) -> SIMD2<Float> {
            SIMD2(Float(x + ax * sin(t * 0.9 + s)), Float(y + ay * cos(t * 0.8 + s * 1.3)))
        }
        return [p(0, 0), p(0.5, 0, 0.1, 0, 1), p(1, 0),
                p(0, 0.5, 0, 0.12, 2), p(0.5, 0.5, 0.2, 0.16, 3), p(1, 0.5, 0, 0.12, 4),
                p(0, 1), p(0.5, 1, 0.1, 0, 5), p(1, 1)]
    }

    var body: some View {
        TimelineView(.animation(paused: reduceMotion || (!active && level == 0))) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            MeshGradient(width: 3, height: 3, points: points(t), colors: colors, smoothsColors: true)
                .mask(LinearGradient(stops: [.init(color: .black, location: 0), .init(color: .black.opacity(0.55), location: 0.35), .init(color: .clear, location: 0.62)],
                                     startPoint: .top, endPoint: .bottom))
                .opacity(level * (0.2 + 0.07 * sin(t * 2.3)))
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onChange(of: active) { _, on in withAnimation(.easeInOut(duration: 0.9)) { level = on ? 1 : 0 } }
    }
}

/// Status text with a light band sweeping across it (the "working" shimmer).
struct WorkingText: View {
    let text: String
    var font: Font = .subheadline.weight(.medium)
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let p = reduceMotion ? 0.5 : (ctx.date.timeIntervalSinceReferenceDate * 0.75).truncatingRemainder(dividingBy: 1)
            Text(text).font(font).foregroundStyle(ZB.Palette.inkTertiary)
                .overlay {
                    GeometryReader { geo in
                        Text(text).font(font).foregroundStyle(ZB.Palette.ink)
                            .frame(width: geo.size.width, height: geo.size.height, alignment: .leading)
                            .mask {
                                LinearGradient(colors: [.clear, .black, .clear], startPoint: .leading, endPoint: .trailing)
                                    .frame(width: geo.size.width * 0.55)
                                    .offset(x: CGFloat(p * 1.9 - 0.7) * geo.size.width)
                                    .frame(width: geo.size.width, alignment: .leading)
                            }
                    }
                }
        }
        .accessibilityLabel(text)
    }
}

/// A few tiny dots that twinkle around the input pill when it appears, then fade.
struct PillSparkles: View {
    @State private var start = Date()
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        if reduceMotion { Color.clear } else {
            TimelineView(.animation(minimumInterval: 1 / 30)) { ctx in
                let t = ctx.date.timeIntervalSince(start)
                Canvas { gc, sz in
                    guard t < 2.2 else { return }
                    for i in 0..<18 {
                        let side = Double(i) / 18
                        let ang = side * 2 * .pi
                        let rx = sz.width / 2 + 6 + prand(i, 1) * 10, ry = sz.height / 2 + 6 + prand(i, 2) * 10
                        let x = sz.width / 2 + cos(ang) * rx, y = sz.height / 2 + sin(ang) * ry
                        let tw = max(0, sin((t - prand(i, 3) * 0.6) * 5 + Double(i)))
                        let fade = max(0, 1 - t / 2.2)
                        let d = 1.6 + prand(i, 4) * 2.2
                        gc.opacity = tw * fade * 0.8
                        gc.fill(Path(ellipseIn: CGRect(x: x - d / 2, y: y - d / 2, width: d, height: d)), with: .color(Color(white: 0.15)))
                    }
                }
            }
            .allowsHitTesting(false)
            .accessibilityHidden(true)
            .onAppear { start = Date() }
        }
    }
}
