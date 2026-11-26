import SwiftUI

// Pixel / particle effects (reference: coupon that dissolves into iridescent pixels and streams
// into the total). Everything draws in a single Canvas per effect → smooth at 120 Hz.

/// Deterministic pseudo-random in 0…1 (stable per particle, no state to keep).
@inline(__always) func prand(_ i: Int, _ salt: Double = 0) -> Double {
    let x = sin(Double(i) * 12.9898 + salt * 78.233) * 43758.5453
    return x - floor(x)
}

/// Holographic colour along green → cyan → lilac (brand-adjacent iridescence).
@inline(__always) func iridescent(_ phase: Double, dark: Bool) -> Color {
    let h = 0.47 + 0.2 * sin(phase)
    return Color(hue: h, saturation: dark ? 0.45 : 0.6, brightness: dark ? 1 : 0.82)
}

/// Siri-like spectrum: blue → violet → magenta → pink (no green).
@inline(__always) func siriTint(_ phase: Double, dark: Bool) -> Color {
    let h = 0.58 + 0.38 * (0.5 + 0.5 * sin(phase))
    return Color(hue: h, saturation: dark ? 0.55 : 0.7, brightness: dark ? 1 : 0.9)
}

/// Zen AI's palette is strictly black and white: these "Siri" tones are all greys (ink → near-white).
enum Siri {
    static let blue = Color(hex: 0x0B0C10)      // ink
    static let violet = Color(hex: 0x34353D)    // graphite
    static let pink = Color(hex: 0x7B7E8A)      // mid grey
    static let orange = Color(hex: 0xC4C6CE)    // light grey
    static let cyan = Color(hex: 0xF1F2F5)      // near white
    static var gradient: LinearGradient {
        LinearGradient(colors: [blue, violet, pink], startPoint: .leading, endPoint: .trailing)
    }
}

// MARK: - Pixel orb (Zen AI's face)

/// A sphere of ~460 tiny square pixels, rotating in 3D with depth shading. `energy` 0…1 speeds it
/// up and makes pixels burst off the surface and settle back – "thinking".
struct PixelOrb: View {
    var size: CGFloat = 160
    var energy: Double = 0.2
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private let count = 460

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 1 : ctx.date.timeIntervalSinceReferenceDate
            Canvas { gc, sz in
                let dark = scheme == .dark
                let c = CGPoint(x: sz.width / 2, y: sz.height / 2)
                let R = min(sz.width, sz.height) * 0.36
                let spin = t * (0.35 + energy * 1.1)
                let tilt = 0.35 + 0.1 * sin(t * 0.5)
                var pts: [(CGPoint, Double, Double, Int)] = []
                pts.reserveCapacity(count)
                let golden = Double.pi * (3 - sqrt(5))
                for i in 0..<count {
                    let y = 1 - (Double(i) / Double(count - 1)) * 2
                    let r = sqrt(1 - y * y)
                    let th = golden * Double(i) + spin
                    var x = cos(th) * r, z = sin(th) * r, yy = y
                    // tilt around X
                    let y2 = yy * cos(tilt) - z * sin(tilt); z = yy * sin(tilt) + z * cos(tilt); yy = y2
                    // breathing + bursts
                    let burst = pow(max(0, sin(t * 2.3 + Double(i) * 0.61)), 6) * energy * 0.45
                    let k = 1 + 0.03 * sin(t * 1.6 + Double(i)) + burst
                    x *= k; yy *= k
                    pts.append((CGPoint(x: c.x + x * R, y: c.y + yy * R), z, Double(i) * 0.37 + t * 0.6, i))
                }
                pts.sort { $0.1 < $1.1 }
                // Additive blending glows on large orbs, but turns tiny ones into a white disc.
                if dark && min(sz.width, sz.height) > 80 { gc.blendMode = .plusLighter }
                for p in pts {
                    let depth = (p.1 + 1) / 2 // 0 back … 1 front
                    let s = 1.2 + 2.4 * depth
                    let rect = CGRect(x: p.0.x - s / 2, y: p.0.y - s / 2, width: s, height: s)
                    let front = depth > 0.92 && prand(p.3) > 0.6
                    gc.fill(Path(rect), with: .color(front ? .white : siriTint(p.2, dark: dark)
                        .opacity(0.25 + 0.75 * depth)))
                }
            }
        }
        .frame(width: size, height: size)
        .background {
            Circle().fill(Siri.violet.opacity(scheme == .dark ? 0.28 : 0.14))
                .blur(radius: size * 0.22)
                .scaleEffect(0.8 + energy * 0.35)
        }
        .animation(.easeInOut(duration: 0.6), value: energy)
        .accessibilityHidden(true)
    }
}

// MARK: - Siri-style edge glow

/// Iridescent light that runs around the screen edge while the assistant works (Apple Intelligence Siri).
struct EdgeGlow: View {
    var active: Bool
    var corner: CGFloat = 58
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: !active || reduceMotion)) { ctx in
            let a = ctx.date.timeIntervalSinceReferenceDate * 70
            let g = AngularGradient(colors: [Color(white: 0.05), Color(white: 0.55), .white, Color(white: 0.2), Color(white: 0.05)],
                                    center: .center, angle: .degrees(a))
            ZStack {
                RoundedRectangle(cornerRadius: corner, style: .continuous).strokeBorder(g, lineWidth: 14).blur(radius: 18)
                RoundedRectangle(cornerRadius: corner, style: .continuous).strokeBorder(g, lineWidth: 4).blur(radius: 3)
            }
        }
        .ignoresSafeArea()
        .opacity(active ? 1 : 0)
        .animation(.easeInOut(duration: 0.5), value: active)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

// MARK: - Dissolve & stream (payment done)

/// Draws `card` in `from`; once `start` is set the card dissolves left → right into pixels that
/// flow along a soft S-curve into `to` (the Dynamic Island), shrinking as they arrive.
struct DissolveStream<Card: View>: View {
    let from: CGRect
    let to: CGPoint
    let start: Date?
    @ViewBuilder var card: Card
    @Environment(\.colorScheme) private var scheme
    private let count = 760

    var body: some View {
        TimelineView(.animation) { ctx in
            Canvas { gc, _ in
                let dark = scheme == .dark
                let e = start.map { ctx.date.timeIntervalSince($0) } ?? -1
                // 1) remaining part of the card (sweep reveals pixels underneath)
                let sweep = e < 0 ? 0 : min(1, e / 0.55)
                if sweep < 1, let sym = gc.resolveSymbol(id: 0) {
                    gc.drawLayer { l in
                        let x = from.minX + from.width * sweep
                        l.clip(to: Path(roundedRect: CGRect(x: x, y: from.minY - 40, width: from.maxX - x + 40, height: from.height + 80), cornerRadius: 0))
                        l.draw(sym, in: from)
                    }
                }
                guard e >= 0 else { return }
                // 2) particles
                if dark { gc.blendMode = .plusLighter }
                for i in 0..<count {
                    let u = prand(i, 1), v = prand(i, 2)
                    let delay = u * 0.5 + prand(i, 3) * 0.1
                    let dur = 0.8 + prand(i, 4) * 0.35
                    let q0 = (e - delay) / dur
                    guard q0 >= 0, q0 <= 1.05 else { continue }
                    let q = min(1, q0)
                    let s = q < 0.5 ? 4 * q * q * q : 1 - pow(-2 * q + 2, 3) / 2 // ease in-out cubic
                    let p0 = CGPoint(x: from.minX + from.width * u, y: from.minY + from.height * v)
                    let c1 = CGPoint(x: p0.x + 30 + prand(i, 5) * 70, y: p0.y - 30 - prand(i, 6) * 40)
                    let c2 = CGPoint(x: to.x - 110 - prand(i, 7) * 60, y: to.y + 230 + prand(i, 8) * 80)
                    let mt = 1 - s
                    var x = mt * mt * mt * p0.x + 3 * mt * mt * s * c1.x + 3 * mt * s * s * c2.x + s * s * s * to.x
                    var y = mt * mt * mt * p0.y + 3 * mt * mt * s * c1.y + 3 * mt * s * s * c2.y + s * s * s * to.y
                    let wob = sin(q * .pi) * (prand(i, 9) - 0.5) * 26
                    x += wob; y += wob * 0.4
                    let size = (1.6 + prand(i, 10) * 2.2) * (1 - 0.65 * s)
                    let alpha = q0 > 0.92 ? max(0, 1 - (q0 - 0.92) / 0.13) : 1
                    let col = prand(i, 11) > 0.82 ? Color.white : iridescent(Double(i) * 0.21 + q * 5, dark: dark)
                    gc.fill(Path(CGRect(x: x - size / 2, y: y - size / 2, width: size, height: size)),
                            with: .color(col.opacity(alpha)))
                }
            } symbols: {
                card.frame(width: from.width, height: from.height).tag(0)
            }
        }
        .allowsHitTesting(false)
    }
}


// MARK: - Siri aurora (resting backdrop for Zen AI)

/// Large soft colour fields drifting along the bottom edge – the Siri / Apple Intelligence mood.
struct SiriAurora: View {
    var intensity: Double = 0.4
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate
            GeometryReader { geo in
                let w = geo.size.width, h = geo.size.height
                ZStack {
                    blob(Siri.blue, w * 0.9, -w * 0.30 + sin(t * 0.55) * 40, h * 0.52 + cos(t * 0.7) * 24)
                    blob(Siri.violet, w * 0.85, w * 0.05 + cos(t * 0.45) * 50, h * 0.56 + sin(t * 0.6) * 30)
                    blob(Siri.pink, w * 0.7, w * 0.32 + sin(t * 0.65) * 36, h * 0.50 + cos(t * 0.5) * 22)
                    blob(Siri.orange, w * 0.45, -w * 0.05 + cos(t * 0.8) * 60, h * 0.60 + sin(t * 0.9) * 18)
                }
                .frame(width: w, height: h)
                .blur(radius: 70)
                .opacity(intensity * (scheme == .dark ? 1.25 : 1))
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func blob(_ c: Color, _ d: CGFloat, _ x: CGFloat, _ y: CGFloat) -> some View {
        Circle().fill(c).frame(width: d).offset(x: x, y: y)
    }
}
