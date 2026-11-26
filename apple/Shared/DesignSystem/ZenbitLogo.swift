import SwiftUI

// MARK: - Zenbit logo
//
// The Z is three pieces in a 475 × 471 design box, traced from the brand artwork:
//   • an S-shaped band running top-right → bottom-left (point-symmetric),
//   • a quarter-disc "leaf" at the top-left (arc r 188, corner r 74),
//   • the same leaf rotated 180° at the bottom-right.
// `ZenbitMark` draws them as Apple-style glass: translucent body, bright rim light, soft inner shadow,
// a sheen that can sweep across, and depth between the pieces. `ZenbitLogoGlyph` is the plain silhouette.

enum ZLogoGeometry {
    static let box = CGSize(width: 475, height: 471)
    static let bandLeft: [CGPoint] = [
        CGPoint(x: 266.4, y: 0.0), CGPoint(x: 265.2, y: 21.0), CGPoint(x: 262.8, y: 39.0), CGPoint(x: 259.2, y: 57.0),
        CGPoint(x: 254.1, y: 75.0), CGPoint(x: 247.6, y: 93.0), CGPoint(x: 239.5, y: 111.0), CGPoint(x: 229.6, y: 129.0),
        CGPoint(x: 217.0, y: 147.0), CGPoint(x: 202.1, y: 165.0), CGPoint(x: 183.4, y: 183.0), CGPoint(x: 162.0, y: 201.0),
        CGPoint(x: 142.7, y: 219.0), CGPoint(x: 126.0, y: 237.0), CGPoint(x: 111.5, y: 255.0), CGPoint(x: 98.9, y: 273.0),
        CGPoint(x: 87.8, y: 291.0), CGPoint(x: 78.5, y: 309.0), CGPoint(x: 70.4, y: 327.0), CGPoint(x: 63.7, y: 345.0),
        CGPoint(x: 58.3, y: 363.0), CGPoint(x: 53.9, y: 381.0), CGPoint(x: 50.1, y: 399.0), CGPoint(x: 47.8, y: 417.0),
        CGPoint(x: 46.0, y: 435.0), CGPoint(x: 45.5, y: 453.0), CGPoint(x: 46.0, y: 471.0)
    ]
    static let bandRight: [CGPoint] = [
        CGPoint(x: 427.6, y: 0.0), CGPoint(x: 426.0, y: 21.0), CGPoint(x: 424.6, y: 39.0), CGPoint(x: 422.2, y: 57.0),
        CGPoint(x: 418.9, y: 75.0), CGPoint(x: 414.8, y: 93.0), CGPoint(x: 409.8, y: 111.0), CGPoint(x: 403.4, y: 129.0),
        CGPoint(x: 395.9, y: 147.0), CGPoint(x: 387.7, y: 165.0), CGPoint(x: 378.5, y: 183.0), CGPoint(x: 367.4, y: 201.0),
        CGPoint(x: 354.5, y: 219.0), CGPoint(x: 340.1, y: 237.0), CGPoint(x: 323.9, y: 255.0), CGPoint(x: 305.1, y: 273.0),
        CGPoint(x: 283.8, y: 291.0), CGPoint(x: 264.1, y: 309.0), CGPoint(x: 248.7, y: 327.0), CGPoint(x: 236.5, y: 345.0),
        CGPoint(x: 227.1, y: 363.0), CGPoint(x: 219.5, y: 381.0), CGPoint(x: 213.5, y: 399.0), CGPoint(x: 209.3, y: 417.0),
        CGPoint(x: 207.2, y: 435.0), CGPoint(x: 207.0, y: 453.0), CGPoint(x: 207.2, y: 471.0)
    ]
}

private func catmull(_ p: Path, _ pts: [CGPoint], moveFirst: Bool) -> Path {
    var path = p
    guard pts.count > 1 else { return path }
    if moveFirst { path.move(to: pts[0]) } else { path.addLine(to: pts[0]) }
    for i in 0..<(pts.count - 1) {
        let p0 = pts[max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[min(i + 2, pts.count - 1)]
        let c1 = CGPoint(x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6)
        let c2 = CGPoint(x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6)
        path.addCurve(to: p2, control1: c1, control2: c2)
    }
    return path
}

private func fit(_ rect: CGRect) -> CGAffineTransform {
    let b = ZLogoGeometry.box
    let s = min(rect.width / b.width, rect.height / b.height)
    return CGAffineTransform(translationX: rect.midX - b.width * s / 2, y: rect.midY - b.height * s / 2).scaledBy(x: s, y: s)
}

struct ZLogoBand: Shape {
    func path(in rect: CGRect) -> Path {
        var p = catmull(Path(), ZLogoGeometry.bandLeft, moveFirst: true)
        p = catmull(p, ZLogoGeometry.bandRight.reversed(), moveFirst: false)
        p.closeSubpath()
        return p.applying(fit(rect))
    }
}

struct ZLogoLeaf: Shape {
    var flipped = false
    func path(in rect: CGRect) -> Path {
        var pts: [CGPoint] = []
        // top edge → big arc (centre (0, 5.4), r 188) → left edge → corner arc (centre (74.5, 74), r 74.4)
        pts.append(CGPoint(x: 74.5, y: 0))
        pts.append(CGPoint(x: 187.9, y: 0))
        let a0 = asin(-5.4 / 188.0), a1 = Double.pi / 2
        for i in 1...60 {
            let a = a0 + (a1 - a0) * Double(i) / 60
            pts.append(CGPoint(x: 188 * cos(a), y: 5.4 + 188 * sin(a)))
        }
        pts.append(CGPoint(x: 0, y: 74))
        for i in 1...36 {
            let a = Double.pi + (Double.pi / 2) * Double(i) / 36
            pts.append(CGPoint(x: 74.5 + 74.4 * cos(a), y: 74 + 74.4 * sin(a)))
        }
        var p = Path(); p.move(to: pts[0]); pts.dropFirst().forEach { p.addLine(to: $0) }; p.closeSubpath()
        if flipped {
            let b = ZLogoGeometry.box
            p = p.applying(CGAffineTransform(translationX: b.width, y: b.height).rotated(by: .pi))
        }
        return p.applying(fit(rect))
    }
}

/// The whole Z as one silhouette (for masks, widgets, watch complications).
struct ZenbitLogoGlyph: Shape {
    func path(in rect: CGRect) -> Path {
        var p = ZLogoBand().path(in: rect)
        p.addPath(ZLogoLeaf().path(in: rect))
        p.addPath(ZLogoLeaf(flipped: true).path(in: rect))
        return p
    }
}

// MARK: - Glass mark

struct ZenbitMark: View {
    var size: CGFloat = 200
    /// 0…1 sweeps a specular sheen across the glyph; nil = none.
    var sheen: Double? = nil
    /// How far the leaves float apart from the band (parallax depth), 0…1.
    var depth: Double = 1
    /// Dark glass (graphite body, bright rim) for use on light backgrounds.
    var dark = false

    var body: some View {
        let u = size / 475          // design unit → points
        ZStack {
            // soft contact shadow under the whole glyph
            ZenbitLogoGlyph().fill(.black.opacity(dark ? 0.28 : 0.55)).frame(width: size, height: size).blur(radius: size * 0.04)
                .offset(y: size * (dark ? 0.05 : 0.035))
            piece(ZLogoBand(), body: bodyGradient(), rimTop: 0.95, u: u)
            piece(ZLogoLeaf(), body: leafGradient(), rimTop: 0.85, u: u)
                .offset(x: -u * 5 * depth, y: -u * 5 * depth)
            piece(ZLogoLeaf(flipped: true), body: leafGradient(), rimTop: 0.85, u: u)
                .offset(x: u * 5 * depth, y: u * 5 * depth)
            if let sheen {
                sheenSweep(sheen)
                    .frame(width: size, height: size)
                    .mask(ZenbitLogoGlyph().frame(width: size, height: size))
                    .allowsHitTesting(false)
            }
        }
        .frame(width: size, height: size)
        .accessibilityLabel("Zenbit")
    }

    private func bodyGradient() -> LinearGradient {
        if dark {
            return LinearGradient(stops: [.init(color: Color(hex: 0x3B3D47), location: 0), .init(color: Color(hex: 0x14151A), location: 0.5), .init(color: Color(hex: 0x050507), location: 1)],
                                  startPoint: .topLeading, endPoint: .bottomTrailing)
        }
        return LinearGradient(stops: [.init(color: .white, location: 0), .init(color: .white.opacity(0.88), location: 0.5),
                               .init(color: .white.opacity(0.58), location: 1)], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
    private func leafGradient() -> LinearGradient {
        if dark {
            return LinearGradient(stops: [.init(color: Color(hex: 0x4A4C57), location: 0), .init(color: Color(hex: 0x1B1C22), location: 1)],
                                  startPoint: .topLeading, endPoint: .bottomTrailing)
        }
        return LinearGradient(stops: [.init(color: .white.opacity(0.95), location: 0), .init(color: .white.opacity(0.72), location: 1)],
                       startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    /// One glass piece: translucent body, tinted refraction, a thick bevel (bright top-left, glowing bottom-right),
    /// a crisp rim line and a soft specular blob.
    private func piece<S: Shape>(_ shape: S, body: LinearGradient, rimTop: Double, u: CGFloat) -> some View {
        let lit = LinearGradient(colors: [.white.opacity(rimTop), .white.opacity(0), .white.opacity(0.55)],
                                 startPoint: .topLeading, endPoint: .bottomTrailing)
        return ZStack {
            shape.fill(body)
            if dark {
                // soft top-left sheen on dark glass; no colour
                shape.fill(LinearGradient(colors: [.white.opacity(0.22), .clear], startPoint: .topLeading, endPoint: UnitPoint(x: 0.7, y: 0.7)))
            } else {
                // light bending through the glass: cool in the lower body, warm kiss up top
                shape.fill(LinearGradient(colors: [.clear, Color(red: 0.62, green: 0.66, blue: 1).opacity(0.3)], startPoint: .center, endPoint: .bottomTrailing))
                shape.fill(LinearGradient(colors: [Color(red: 1, green: 0.82, blue: 0.74).opacity(0.28), .clear], startPoint: .topLeading, endPoint: UnitPoint(x: 0.6, y: 0.6)))
            }
            // bevel: a soft inner band of light hugging the edge
            shape.stroke(lit, lineWidth: u * 18).blur(radius: u * 3.5).mask(shape.fill(.white))
            // dark-ish inner edge at the lower right gives thickness
            shape.stroke(LinearGradient(colors: [.clear, (dark ? Color.black : Color(red: 0.2, green: 0.22, blue: 0.5)).opacity(dark ? 0.6 : 0.5)], startPoint: .center, endPoint: .bottomTrailing),
                         lineWidth: u * 26).blur(radius: u * 9).mask(shape.fill(.white))
            // specular blob upper-left
            Ellipse().fill(.white.opacity(dark ? 0.32 : 0.55)).frame(width: size * 0.3, height: size * 0.12).blur(radius: u * 14)
                .rotationEffect(.degrees(-35)).offset(x: -size * 0.14, y: -size * 0.18).mask(shape.fill(.white))
            // crisp rim
            shape.stroke(lit, lineWidth: max(u * 3.4, 0.5))
        }
        .frame(width: size, height: size)
    }

    private func sheenSweep(_ t: Double) -> some View {
        GeometryReader { geo in
            LinearGradient(stops: [.init(color: .clear, location: 0), .init(color: .white.opacity(0.95), location: 0.5), .init(color: .clear, location: 1)],
                           startPoint: .leading, endPoint: .trailing)
                .frame(width: geo.size.width * 0.38)
                .rotationEffect(.degrees(24))
                .offset(x: CGFloat(t) * geo.size.width * 1.7 - geo.size.width * 0.5)
                .blendMode(.plusLighter)
        }
    }
}

#Preview {
    ZStack { Color.black.ignoresSafeArea(); ZenbitMark(size: 220, sheen: 0.4) }
}


/// Your Z, alive: a sheen sweeps across and the leaves drift against the band while the assistant works.
struct ZenbitThinkingMark: View {
    var size: CGFloat = 40
    var dark = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate
            let sheen = (t * 0.62).truncatingRemainder(dividingBy: 1.7) / 1.7
            ZenbitMark(size: size, sheen: sheen < 1 ? sheen : nil, depth: 0.7 + 0.7 * sin(t * 2.1), dark: dark)
                .scaleEffect(1 + 0.035 * sin(t * 2.4))
        }
    }
}

/// Resting state: a quiet sheen passes over the mark every few seconds.
struct ZenbitIdleMark: View {
    var size: CGFloat = 76
    var dark = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate
            let c = t.truncatingRemainder(dividingBy: 5.5)
            ZenbitMark(size: size, sheen: c < 1.5 ? c / 1.5 : nil, depth: 0.5 + 0.5 * sin(t * 0.9), dark: dark)
        }
    }
}
