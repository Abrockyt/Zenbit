import SwiftUI

// MARK: - Zen orb (the face of Zen AI)

/// A living, wavy, glowing orb: four translucent blobs whose edges ripple at different
/// frequencies, rotating slowly. `energy` (0…1) raises speed and amplitude while thinking –
/// the orb *is* the state indicator (like Siri's), so no spinner is needed.
struct ZenOrb: View {
    var size: CGFloat = 120
    var energy: Double = 0.25
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let palette: [Color] = [ZB.Palette.green, Color(hex: 0x3DDCFF), ZB.Palette.mint, Color(hex: 0xEFFFF7)]

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate * (0.8 + energy * 1.6)
            Canvas { gc, sz in
                let c = CGPoint(x: sz.width / 2, y: sz.height / 2)
                let r = min(sz.width, sz.height) * 0.34
                for (i, color) in palette.enumerated() {
                    let fi = Double(i)
                    var p = Path()
                    let steps = 72
                    for k in 0...steps {
                        let a = Double(k) / Double(steps) * 2 * .pi
                        let wob = sin(a * 3 + t * (1 + fi * 0.35) + fi * 1.7) * (0.05 + energy * 0.1)
                            + sin(a * 5 - t * 1.3 + fi) * (0.025 + energy * 0.05)
                        let rr = r * (1 - fi * 0.1) * (1 + wob)
                        let rot = t * 0.25 * (i.isMultiple(of: 2) ? 1 : -1)
                        let pt = CGPoint(x: c.x + cos(a + rot) * rr + CGFloat(sin(t + fi)) * r * 0.06,
                                         y: c.y + sin(a + rot) * rr + CGFloat(cos(t * 0.8 + fi)) * r * 0.06)
                        k == 0 ? p.move(to: pt) : p.addLine(to: pt)
                    }
                    p.closeSubpath()
                    gc.drawLayer { layer in
                        layer.addFilter(.blur(radius: r * 0.08))
                        if scheme == .dark { layer.blendMode = .plusLighter }
                        layer.fill(p, with: .color(color.opacity(i == 3 ? 0.55 : 0.75)))
                    }
                }
                // Specular highlight
                let hl = Path(ellipseIn: CGRect(x: c.x - r * 0.45, y: c.y - r * 0.62, width: r * 0.6, height: r * 0.32))
                gc.drawLayer { layer in
                    layer.addFilter(.blur(radius: r * 0.1))
                    layer.fill(hl, with: .color(.white.opacity(0.7)))
                }
            }
        }
        .frame(width: size, height: size)
        .background {
            Circle().fill(ZB.Palette.green.opacity(scheme == .dark ? 0.35 : 0.22))
                .blur(radius: size * 0.25)
                .scaleEffect(1 + energy * 0.3)
        }
        .animation(.easeInOut(duration: 0.6), value: energy)
        .accessibilityHidden(true)
    }
}

// MARK: - Aurora (full-screen "generating" glow, from the reference video)

/// Large blurred colour fields that breathe up from the bottom edge. Used behind content
/// while Zen AI generates and while a payment processes.
struct AuroraGlow: View {
    var active: Bool
    var colors: [Color] = [ZB.Palette.green, Color(hex: 0x3DDCFF), ZB.Palette.mint]
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: !active || reduceMotion)) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            GeometryReader { geo in
                let w = geo.size.width, h = geo.size.height
                ZStack {
                    Circle().fill(colors[0])
                        .frame(width: w * 1.0)
                        .offset(x: -w * 0.3 + sin(t * 0.7) * 30, y: h * 0.42 + cos(t * 0.9) * 26)
                    Circle().fill(colors[1])
                        .frame(width: w * 0.85)
                        .offset(x: w * 0.32 + cos(t * 0.6) * 30, y: h * 0.46 + sin(t * 0.8) * 22)
                    Circle().fill(colors[2])
                        .frame(width: w * 0.7)
                        .offset(x: sin(t * 0.5) * 40, y: h * 0.36 + sin(t * 1.1) * 30)
                }
                .frame(width: w, height: h)
                .blur(radius: 70)
                .opacity(active ? (scheme == .dark ? 0.6 : 0.5) : 0)
                .offset(y: active ? 0 : h * 0.3)
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .animation(.spring(response: 0.9, dampingFraction: 0.9), value: active)
    }
}

/// Monospaced caps status line with a pulsing dot ("● ANALYSING YOUR PAYMENTS").
struct MonoStatus: View {
    let text: String
    var tint: Color = ZB.Palette.inkSecondary
    var pulsing = true
    @State private var on = false

    var body: some View {
        HStack(spacing: 8) {
            Circle().fill(tint).frame(width: 6, height: 6).opacity(pulsing ? (on ? 1 : 0.25) : 1)
            Text(text)
                .font(.system(.caption, design: .monospaced).weight(.semibold))
                .tracking(1.6)
                .foregroundStyle(tint)
                .contentTransition(.opacity)
        }
        .animation(ZB.Motion.standard, value: text)
        .onAppear { withAnimation(.easeInOut(duration: 0.7).repeatForever(autoreverses: true)) { on = true } }
        .accessibilityLabel(text.capitalized)
    }
}

#Preview {
    VStack(spacing: 40) {
        ZenOrb(size: 160, energy: 0.2)
        ZenOrb(size: 160, energy: 0.9)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(AuroraGlow(active: true))
}
