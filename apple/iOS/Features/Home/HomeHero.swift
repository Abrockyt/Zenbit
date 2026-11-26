import SwiftUI

/// Home hero: one calm, flat picture in the brand's raw colours – a two-layer city skyline (thin lit window lines,
/// a few antennas) behind three layered hills, with clouds drifting and a couple of birds. Layers drift at different
/// speeds while scrolling.
/// Everything is drawn in SwiftUI (no assets).
struct HomeHero: View {
    var height: CGFloat = 300
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    // Palette – flat, saturated.
    private let sky = Color(hex: 0x4C9BFF), skyBand = Color(hex: 0x7DBBFF)
    private let farBlue = Color(hex: 0x3B78EE), nearBlue = Color(hex: 0x1F4FC8), windowLine = Color(hex: 0xFFD54A)

    private struct Block { let x: CGFloat, w: CGFloat, h: CGFloat; var antenna = false }
    private let farBlocks: [Block] = [Block(x: 0.02, w: 30, h: 74), Block(x: 0.12, w: 26, h: 100, antenna: true), Block(x: 0.22, w: 34, h: 80),
                                      Block(x: 0.55, w: 28, h: 96), Block(x: 0.64, w: 36, h: 72, antenna: true), Block(x: 0.75, w: 30, h: 108),
                                      Block(x: 0.86, w: 34, h: 84), Block(x: 0.95, w: 30, h: 98, antenna: true)]
    private let nearBlocks: [Block] = [Block(x: 0.00, w: 36, h: 58), Block(x: 0.09, w: 30, h: 80), Block(x: 0.19, w: 42, h: 64),
                                       Block(x: 0.58, w: 34, h: 72), Block(x: 0.69, w: 30, h: 92, antenna: true), Block(x: 0.79, w: 40, h: 62),
                                       Block(x: 0.91, w: 34, h: 82)]
    private let hillFar = Color(hex: 0x8BE04E), hillMid = Color(hex: 0x1FB866), hillNear = Color(hex: 0x0E9A55)

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30, paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate
            GeometryReader { geo in
                let w = geo.size.width, h = geo.size.height
                let sw = min(w, 520), ox = (w - sw) / 2
                ZStack {
                    // Sky: flat colour with one lighter band near the horizon
                    ZStack {
                        sky
                        VStack { Spacer(); skyBand.frame(height: h * 0.40) }
                    }
                    .parallax(0.10, w, h)

                    // Skyline, far then near (thin lit window lines blink slowly)
                    skyline(farBlocks, base: h * 0.74, color: farBlue, sw: sw, ox: ox, t: t, lit: false, seed: 0)
                        .parallax(0.18, w, h)
                    skyline(nearBlocks, base: h * 0.78, color: nearBlue, sw: sw, ox: ox, t: t, lit: true, seed: 3)
                        .parallax(0.26, w, h)

                    // Clouds
                    ZStack {
                        ForEach(0..<3, id: \.self) { i in
                            let speed = [6.0, 4.0, 5.0][i]
                            let x = (CGFloat(t * speed) + CGFloat(i) * w * 0.45).truncatingRemainder(dividingBy: w + 200) - 100
                            Cloud().fill(Color.white)
                                .frame(width: [120, 84, 96][i], height: [42, 30, 34][i])
                                .position(x: x, y: h * [0.30, 0.44, 0.20][i])
                        }
                    }
                    .parallax(0.22, w, h)

                    // Birds
                    ZStack {
                        ForEach(0..<2, id: \.self) { i in
                            let x = (CGFloat(t * (10 + Double(i) * 3)) + CGFloat(i) * 130).truncatingRemainder(dividingBy: w + 60) - 30
                            Bird(flap: sin(t * 7 + Double(i) * 2))
                                .stroke(Color(hex: 0x0B1B5C).opacity(0.75), style: .init(lineWidth: 1.6, lineCap: .round))
                                .frame(width: 12, height: 5)
                                .position(x: x, y: h * (0.24 + 0.09 * Double(i)) + CGFloat(sin(t * 1.2 + Double(i))) * 4)
                        }
                    }
                    .parallax(0.26, w, h)

                    // Three hills, back to front
                    Hill(phase: 0.6, amplitude: 0.5).fill(hillFar)
                        .frame(width: w * 1.1, height: h * 0.40).position(x: w / 2, y: h * 0.70)
                        .parallax(0.32, w, h)
                    Hill(phase: 2.2, amplitude: 0.6).fill(hillMid)
                        .frame(width: w * 1.1, height: h * 0.32).position(x: w / 2, y: h * 0.78)
                        .parallax(0.40, w, h)
                    Hill(phase: 4.1, amplitude: 0.5).fill(hillNear)
                        .frame(width: w * 1.1, height: h * 0.26).position(x: w / 2, y: h * 0.86)
                        .parallax(0.48, w, h)

                    // Three friends on the hill: one pays with a phone, one waves, one stands
                    ZStack {
                        Person(shirt: Color(hex: 0xFF3B5C), skin: Color(hex: 0xF2C4A0), hair: Color(hex: 0x2B2530), pants: Color(hex: 0x1F2A5C), phone: true, t: t, phase: 0)
                            .position(x: ox + sw * 0.31, y: h * 0.805)
                        Person(shirt: Color(hex: 0xFFC83D), skin: Color(hex: 0xC68B66), hair: Color(hex: 0x4A2F22), pants: Color(hex: 0x2B59FF), wave: true, t: t, phase: 1.4)
                            .position(x: ox + sw * 0.42, y: h * 0.80)
                        Person(shirt: Color(hex: 0x7B4DFF), skin: Color(hex: 0xE9B58F), hair: Color(hex: 0x1B1B1F), pants: Color(hex: 0x1F2A5C), t: t, phase: 2.6)
                            .position(x: ox + sw * 0.53, y: h * 0.81)
                    }
                    .parallax(0.5, w, h)

                    // Page colour – the content grows out of the scene
                    Hill(phase: 3.4, amplitude: 0.35).fill(ZB.Palette.canvas)
                        .frame(width: w * 1.1, height: h * 0.22).position(x: w / 2, y: h * 0.96)
                        .parallax(0.52, w, h)
                }
                .frame(width: w, height: h)
                .clipped()
            }
        }
        .frame(height: height)
        .accessibilityHidden(true)
    }

    private func skyline(_ blocks: [Block], base: CGFloat, color: Color, sw: CGFloat, ox: CGFloat, t: Double, lit: Bool, seed: Double) -> some View {
        ZStack {
            ForEach(blocks.indices, id: \.self) { i in
                let b = blocks[i]
                RoundedRectangle(cornerRadius: 3, style: .continuous).fill(color)
                    .frame(width: b.w, height: b.h)
                    .overlay(alignment: .top) {
                        if lit { windowLines(rows: max(1, Int((b.h - 16) / 10)), t: t, seed: seed + Double(i) * 1.7).padding(.top, 10) }
                    }
                    .overlay(alignment: .top) {
                        if b.antenna { Rectangle().fill(color).frame(width: 1.8, height: 16).offset(y: -16) }
                    }
                    .position(x: ox + sw * b.x + b.w / 2, y: base - b.h / 2)
            }
        }
    }

    /// Rows of short, thin lines – the windows of a night-time city, a few blinking on and off.
    private func windowLines(rows: Int, t: Double, seed: Double) -> some View {
        VStack(spacing: 7) {
            ForEach(0..<rows, id: \.self) { r in
                HStack(spacing: 5) {
                    ForEach(0..<2, id: \.self) { c in
                        let on = sin(t * 0.6 + seed + Double(r) * 2.1 + Double(c) * 1.3) > -0.4
                        Capsule().fill(windowLine).frame(width: 7, height: 2.5).opacity(on ? 0.95 : 0.25)
                    }
                }
            }
        }
    }
}

// MARK: - People (flat, no outlines)

private struct Person: View {
    let shirt: Color, skin: Color, hair: Color, pants: Color
    var phone = false
    var wave = false
    var t: Double
    var phase: Double

    var body: some View {
        let bob = CGFloat(sin(t * 2.2 + phase)) * 1.2
        ZStack {
            // legs
            HStack(spacing: 2) {
                Capsule().fill(pants).frame(width: 8, height: 24)
                Capsule().fill(pants).frame(width: 8, height: 24)
            }
            .offset(y: 26)
            // torso
            RoundedRectangle(cornerRadius: 8, style: .continuous).fill(shirt).frame(width: 22, height: 30).offset(y: 3)
            // arms
            Capsule().fill(shirt).frame(width: 6, height: 20).rotationEffect(.degrees(phone ? 18 : 8), anchor: .top).offset(x: -13, y: 6)
            Capsule().fill(shirt).frame(width: 6, height: 20)
                .rotationEffect(.degrees(wave ? -150 + sin(t * 5 + phase) * 22 : (phone ? -42 : -8)), anchor: .top)
                .offset(x: 13, y: wave ? -5 : 6)
            if phone {
                RoundedRectangle(cornerRadius: 2).fill(Color(hex: 0x14161F)).frame(width: 8, height: 14)
                    .overlay(Rectangle().fill(Color(hex: 0x9DB4FF)).frame(width: 5, height: 10).opacity(0.6 + 0.4 * sin(t * 3)))
                    .rotationEffect(.degrees(-14)).offset(x: 11, y: 8)
            }
            // head: skin circle with a hair cap on top (cap sits above the brow, never over the face)
            Circle().fill(skin).frame(width: 16, height: 16).offset(y: -18)
            Capsule().fill(hair).frame(width: 17, height: 8).offset(x: 0, y: -23.5)
        }
        .frame(width: 34, height: 70)
        .offset(y: bob)
    }
}

// MARK: - Shapes

struct Cloud: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.addRoundedRect(in: CGRect(x: r.minX, y: r.midY, width: r.width, height: r.height / 2),
                         cornerSize: CGSize(width: r.height / 4, height: r.height / 4), style: .continuous)
        p.addEllipse(in: CGRect(x: r.minX + r.width * 0.12, y: r.minY + r.height * 0.25, width: r.width * 0.4, height: r.height * 0.7))
        p.addEllipse(in: CGRect(x: r.minX + r.width * 0.38, y: r.minY, width: r.width * 0.45, height: r.height * 0.9))
        return p
    }
}

struct Hill: Shape {
    var phase: Double
    var amplitude: Double
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.maxY))
        let steps = 48
        for s in 0...steps {
            let k = Double(s) / Double(steps)
            let y = r.minY + r.height * CGFloat(0.5 - 0.42 * amplitude * sin(k * .pi * 1.5 + phase) - 0.12 * cos(k * .pi * 3 + phase))
            p.addLine(to: CGPoint(x: r.minX + r.width * CGFloat(k), y: max(r.minY, y)))
        }
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY))
        p.closeSubpath()
        return p
    }
}

private struct Bird: Shape {
    var flap: Double
    func path(in r: CGRect) -> Path {
        var p = Path()
        let lift = CGFloat(flap) * r.height * 0.5
        p.move(to: CGPoint(x: r.minX, y: r.midY - lift))
        p.addQuadCurve(to: CGPoint(x: r.midX, y: r.midY + 2), control: CGPoint(x: r.minX + r.width * 0.25, y: r.minY - lift))
        p.addQuadCurve(to: CGPoint(x: r.maxX, y: r.midY - lift), control: CGPoint(x: r.maxX - r.width * 0.25, y: r.minY - lift))
        return p
    }
}

// MARK: - Parallax (layer moves slower than the scroll)

private extension View {
    /// Each layer is framed to the hero's size first, so its position in the scroll view *is* the hero's:
    /// zero shift at rest, a slower-than-scroll drift while scrolling, and no movement on overscroll.
    func parallax(_ factor: CGFloat, _ w: CGFloat, _ h: CGFloat) -> some View {
        frame(width: w, height: h)
            .visualEffect { content, proxy in
                let minY = min(0, proxy.frame(in: .scrollView(axis: .vertical)).minY)
                return content.offset(y: -minY * factor)
            }
    }
}

#Preview { ScrollView { HomeHero(height: 290) } }
