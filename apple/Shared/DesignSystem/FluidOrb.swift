import SwiftUI

/// Zen AI's face: a smooth, fluid orb in the spirit of Siri on iOS 26/27.
/// • Body: a slowly churning mesh gradient that is mostly black and white, with blue → violet → pink streaks flowing through it.
/// • Waves: three soft colour ribbons ride across the body (faster and taller when `energy` rises – listening / thinking).
/// • Edge: an organic wobble instead of a perfect circle, calm at rest and livelier with energy.
/// • Finish: glass rim light, inner shading, a specular glint, and a soft coloured halo.
/// Everything is vector / GPU gradients – no pixels or particles – so it stays smooth at 120 Hz.
struct FluidOrb: View {
    var size: CGFloat = 160
    /// 0 = resting, 1 = thinking hard.
    var energy: Double = 0.15
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var smoothEnergy: Double = 0

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 2 : ctx.date.timeIntervalSinceReferenceDate
            let e = smoothEnergy
            let d = size * 0.76
            ZStack {
                halo(t, e).frame(width: size, height: size)
                ZStack {
                    MeshGradient(width: 4, height: 4, points: points(t, e), colors: colors, smoothsColors: true)
                    waves(t, e, d)
                    // inner shading: sphere falloff
                    Circle().fill(RadialGradient(colors: [.clear, .black.opacity(0.28)], center: UnitPoint(x: 0.42, y: 0.38), startRadius: d * 0.2, endRadius: d * 0.62))
                    // glint
                    Ellipse().fill(.white.opacity(0.55)).frame(width: d * 0.34, height: d * 0.16).blur(radius: d * 0.05)
                        .rotationEffect(.degrees(-32)).offset(x: -d * 0.16, y: -d * 0.24)
                }
                .frame(width: d, height: d)
                .clipShape(WobbleCircle(t: t, amp: 0.012 + 0.05 * e))
                .overlay {
                    WobbleCircle(t: t, amp: 0.012 + 0.05 * e)
                        .stroke(LinearGradient(colors: [.white.opacity(0.95), .white.opacity(0.05), .white.opacity(0.55)],
                                               startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: max(1, d * 0.012))
                }
                .scaleEffect(1 + 0.025 * sin(t * (1.4 + e * 2.2)) * (0.4 + e))
                .shadow(color: .black.opacity(0.22), radius: d * 0.08, y: d * 0.05)
            }
            .frame(width: size, height: size)
        }
        .onAppear { smoothEnergy = energy }
        .onChange(of: energy) { _, new in withAnimation(.easeInOut(duration: 0.8)) { smoothEnergy = new } }
        .accessibilityHidden(true)
    }

    // MARK: Colours – black & white first, colour as streaks

    private var colors: [Color] {
        let k = Color(hex: 0x050507), g = Color(hex: 0x2A2C36), w = Color.white
        return [k, g, Siri.blue, k,
                w, Siri.violet, k, g,
                k, w, Siri.pink, Siri.violet,
                g, k, w, Siri.blue]
    }

    private func points(_ t: Double, _ e: Double) -> [SIMD2<Float>] {
        let speed = 0.5 + e * 0.9, amp = 0.07 + e * 0.07
        var out: [SIMD2<Float>] = []
        for j in 0..<4 {
            for i in 0..<4 {
                let x = Double(i) / 3, y = Double(j) / 3
                let edge = i == 0 || i == 3 || j == 0 || j == 3
                if edge { out.append(SIMD2(Float(x), Float(y))); continue }
                let ph = Double(i * 4 + j)
                out.append(SIMD2(Float(x + amp * sin(t * speed + ph * 1.3)), Float(y + amp * cos(t * speed * 0.9 + ph * 1.7))))
            }
        }
        return out
    }

    // MARK: Flowing ribbons (Siri-style: layered sine waves that swell and fall like a voice)

    private func waves(_ t: Double, _ e: Double, _ d: CGFloat) -> some View {
        Canvas { gc, sz in
            gc.blendMode = .plusLighter
            let n = 5
            for k in 0..<n {
                let kd = Double(k)
                let speed = (0.8 + e * 1.5) * (1 + 0.18 * kd)
                // a voice-like envelope: each ribbon swells at its own pace
                let env = 0.35 + 0.65 * pow(abs(sin(t * (0.9 + 0.23 * kd) + kd * 1.3)), 1.4)
                let amp = Double(sz.height) * (0.05 + 0.15 * e) * env
                let baseY = Double(sz.height) * (0.22 + 0.14 * kd)
                let ph = t * speed + kd * 1.9
                var p = Path()
                var x = -4.0
                while x <= Double(sz.width) + 4 {
                    let u = x / Double(sz.width)
                    let window = pow(sin(u * .pi), 1.2)
                    let y = baseY + sin(u * .pi * (1.7 + 0.45 * kd) + ph) * amp * window
                    if x < 0 { p.move(to: CGPoint(x: x, y: y)) } else { p.addLine(to: CGPoint(x: x, y: y)) }
                    x += 3
                }
                let bright = k % 2 == 0
                let c = bright ? Color.white : Color(white: 0.55)
                gc.stroke(p, with: .linearGradient(Gradient(colors: [c.opacity(0), c.opacity(bright ? 0.9 : 0.6), c.opacity(0)]),
                                                   startPoint: .zero, endPoint: CGPoint(x: sz.width, y: 0)),
                          style: StrokeStyle(lineWidth: sz.height * (0.085 - 0.01 * kd), lineCap: .round))
            }
        }
        .blur(radius: d * 0.03)
    }

    // MARK: Halo

    private func halo(_ t: Double, _ e: Double) -> some View {
        ZStack {
            Circle()
                .fill(AngularGradient(colors: [Siri.blue, Siri.violet, Siri.pink, Siri.orange, Siri.cyan, Siri.blue], center: .center, angle: .degrees(t * (24 + e * 60))))
                .blur(radius: size * 0.16)
                .opacity(0.22 + 0.5 * e)
                .scaleEffect(0.82 + 0.1 * e + 0.02 * sin(t * 1.7))
        }
    }
}

/// A circle with a gentle organic wobble that never leaves a small tolerance.
struct WobbleCircle: Shape {
    var t: Double
    var amp: Double
    func path(in r: CGRect) -> Path {
        let c = CGPoint(x: r.midX, y: r.midY)
        let R = min(r.width, r.height) / 2 * 0.97
        var p = Path()
        let n = 120
        for i in 0...n {
            let th = Double(i) / Double(n) * 2 * .pi
            let k = 1 + amp * (0.6 * sin(3 * th + t * 1.3) + 0.4 * sin(5 * th - t * 0.9) + 0.5 * sin(2 * th + t * 0.7))
            let pt = CGPoint(x: c.x + R * k * cos(th), y: c.y + R * k * sin(th))
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        p.closeSubpath()
        return p
    }
}

#Preview {
    VStack(spacing: 30) { FluidOrb(size: 260, energy: 0.1); FluidOrb(size: 260, energy: 1); FluidOrb(size: 44) }.padding().background(.white)
}


// MARK: - Siri wave band (the animation behind the Zen AI screen)

/// Layered black / grey ribbons flowing along the bottom of the screen, rising and swelling when the assistant listens or thinks.
struct SiriWaves: View {
    /// 0 = a calm ripple, 1 = thinking hard.
    var intensity: Double = 0.2
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var smooth: Double = 0.2

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 1 : ctx.date.timeIntervalSinceReferenceDate
            let e = smooth
            Canvas { gc, sz in
                let n = 7
                for k in 0..<n {
                    let kd = Double(k)
                    let speed = (0.55 + e * 1.3) * (1 + 0.14 * kd)
                    let env = 0.3 + 0.7 * pow(abs(sin(t * (0.7 + 0.19 * kd) + kd * 1.1)), 1.5)
                    let amp = Double(sz.height) * (0.10 + 0.34 * e) * env
                    let baseY = Double(sz.height) * (0.62 + 0.05 * kd) - Double(sz.height) * 0.12 * e
                    var p = Path()
                    var x = -6.0
                    while x <= Double(sz.width) + 6 {
                        let u = x / Double(sz.width)
                        let window = pow(sin(u * .pi), 0.8)
                        let y = baseY + sin(u * .pi * (1.4 + 0.38 * kd) + t * speed + kd * 2.0) * amp * window
                        if x < 0 { p.move(to: CGPoint(x: x, y: y)) } else { p.addLine(to: CGPoint(x: x, y: y)) }
                        x += 4
                    }
                    let dark = k % 3 != 1
                    let c = dark ? Color(white: 0.04 + 0.1 * kd / Double(n)) : Color(white: 0.55)
                    gc.stroke(p, with: .linearGradient(Gradient(colors: [c.opacity(0), c.opacity(0.10 + 0.34 * e + (dark ? 0.06 : 0)), c.opacity(0)]),
                                                       startPoint: .zero, endPoint: CGPoint(x: sz.width, y: 0)),
                              style: StrokeStyle(lineWidth: Double(sz.height) * (0.13 - 0.01 * kd), lineCap: .round))
                }
            }
            .blur(radius: 9)
        }
        .frame(height: 300)
        .frame(maxHeight: .infinity, alignment: .bottom)
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear { smooth = intensity }
        .onChange(of: intensity) { _, v in withAnimation(.easeInOut(duration: 0.7)) { smooth = v } }
    }
}
