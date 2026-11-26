import SwiftUI
import SceneKit

// MARK: - Card designs (fictional partner banks – never real brands)

enum CardDesign: Int, CaseIterable, Identifiable {
    case obsidian, jade, frost
    var id: Int { rawValue }
    var bank: String {
        switch self {
        case .obsidian: "Northstar Bank"
        case .jade: "Harbor Bank"
        case .frost: "Meridian Bank"
        }
    }
    var tier: String {
        switch self {
        case .obsidian: "BLACK"
        case .jade: "JADE"
        case .frost: "FROST"
        }
    }
    var colors: [Color] {
        switch self {
        case .obsidian: [Color(hex: 0x1A1D1C), Color(hex: 0x050606), Color(hex: 0x0E2419)]
        case .jade: [Color(hex: 0x0E3B28), Color(hex: 0x00924F), Color(hex: 0x7CF5C0)]
        case .frost: [Color(hex: 0xE9EEF0), Color(hex: 0xC9D3D8), Color(hex: 0xF7FAFB)]
        }
    }
    var ink: Color { self == .frost ? Color(hex: 0x111414) : .white }
}

/// Flat artwork for the card face (also used directly where 3D would be overkill).
struct CardFaceArt: View {
    let design: CardDesign
    var holder = "AARAV MEHTA"

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: design.colors, startPoint: .topLeading, endPoint: .bottomTrailing)
                // Fine guilloché + big wordmark
                ForEach(0..<9, id: \.self) { i in
                    Circle().strokeBorder(design.ink.opacity(0.06), lineWidth: 1)
                        .frame(width: w * (0.3 + CGFloat(i) * 0.12))
                        .position(x: w * 0.92, y: w * 0.62)
                }
                Text("ZENBIT")
                    .font(.system(size: w * 0.24, weight: .black, design: .rounded))
                    .foregroundStyle(design.ink.opacity(0.07))
                    .offset(x: -w * 0.02, y: w * 0.36)
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .center) {
                        HStack(spacing: w * 0.015) {
                            Image(systemName: "indianrupeesign.circle.fill")
                                .font(.system(size: w * 0.06, weight: .bold))
                                .foregroundStyle(ZB.Palette.green)
                            Text("zenbit").font(.system(size: w * 0.05, weight: .bold, design: .rounded))
                            Rectangle().fill(design.ink.opacity(0.4)).frame(width: 1, height: w * 0.045)
                            Text(design.bank).font(.system(size: w * 0.032, weight: .semibold))
                        }
                        Spacer()
                        Text(design.tier).font(.system(size: w * 0.03, weight: .bold, design: .monospaced)).tracking(2)
                    }
                    .foregroundStyle(design.ink)
                    Spacer()
                    // EMV chip + contactless
                    HStack(spacing: w * 0.03) {
                        RoundedRectangle(cornerRadius: w * 0.012, style: .continuous)
                            .fill(LinearGradient(colors: [Color(hex: 0xF3E3B0), Color(hex: 0xC9A85A), Color(hex: 0xF7EBC6)],
                                                 startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay {
                                VStack(spacing: w * 0.012) {
                                    ForEach(0..<3, id: \.self) { _ in Rectangle().fill(.black.opacity(0.18)).frame(height: 1) }
                                }
                                .padding(.horizontal, w * 0.01)
                            }
                            .frame(width: w * 0.12, height: w * 0.09)
                        Image(systemName: "wave.3.right").font(.system(size: w * 0.045, weight: .semibold))
                            .foregroundStyle(design.ink.opacity(0.7))
                    }
                    Spacer()
                    Text("••••  ••••  ••••  4821")
                        .font(.system(size: w * 0.045, weight: .medium, design: .monospaced))
                        .foregroundStyle(design.ink.opacity(0.9))
                    HStack(alignment: .bottom) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(holder).font(.system(size: w * 0.034, weight: .semibold))
                            Text("CREDIT ON UPI").font(.system(size: w * 0.022, weight: .bold)).tracking(1.5).opacity(0.6)
                        }
                        Spacer()
                        Text("RuPay").font(.system(size: w * 0.06, weight: .heavy).italic())
                    }
                    .foregroundStyle(design.ink)
                    .padding(.top, w * 0.02)
                }
                .padding(w * 0.06)
            }
        }
        .aspectRatio(1.586, contentMode: .fit)
    }
}

private struct CardBackArt: View {
    let design: CardDesign
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: design.colors.reversed(), startPoint: .topLeading, endPoint: .bottomTrailing)
                VStack(alignment: .leading, spacing: w * 0.04) {
                    Rectangle().fill(.black.opacity(0.85)).frame(height: w * 0.13).padding(.top, w * 0.08)
                    HStack {
                        RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.85)).frame(width: w * 0.5, height: w * 0.08)
                        Text("•••").font(.system(size: w * 0.04, weight: .bold, design: .monospaced))
                            .foregroundStyle(design.ink)
                    }
                    .padding(.horizontal, w * 0.06)
                    Spacer()
                    Text("Issued by \(design.bank) in partnership with Zenbit. Use only on UPI.")
                        .font(.system(size: w * 0.024)).foregroundStyle(design.ink.opacity(0.6))
                        .padding([.horizontal, .bottom], w * 0.06)
                }
            }
        }
        .aspectRatio(1.586, contentMode: .fit)
    }
}

// MARK: - Real 3D card

/// SceneKit card: an extruded rounded rectangle (0.76 mm thick at scale), clear-coated paint,
/// a brushed-metal edge, image-based lighting so reflections sweep across as it moves.
/// Drag to tilt (springs back). Changing `design` flips the card to the new one.
struct Card3DView: View {
    var design: CardDesign
    var height: CGFloat = 240
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if reduceMotion {
                CardFaceArt(design: design)
                    .clipShape(.rect(cornerRadius: 18, style: .continuous))
                    .padding(.horizontal, 30)
            } else {
                CardScene(design: design)
            }
        }
        .frame(height: height)
        .accessibilityElement()
        .accessibilityLabel("\(design.bank) Zenbit credit card")
    }
}

private struct CardScene: UIViewRepresentable {
    var design: CardDesign

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.backgroundColor = .clear
        view.isOpaque = false
        view.antialiasingMode = .multisampling4X
        view.preferredFramesPerSecond = 120
        view.rendersContinuously = true

        let scene = SCNScene()
        scene.background.contents = UIColor.clear
        scene.lightingEnvironment.contents = Self.environment()
        scene.lightingEnvironment.intensity = 1.4

        let w: CGFloat = 3.37, h: CGFloat = 2.125
        let path = UIBezierPath(roundedRect: CGRect(x: -w / 2, y: -h / 2, width: w, height: h), cornerRadius: 0.13)
        path.flatness = 0.002
        let shape = SCNShape(path: path, extrusionDepth: 0.03)
        shape.chamferRadius = 0.008

        let front = Self.paint(Self.image(CardFaceArt(design: design)))
        let back = Self.paint(Self.image(CardBackArt(design: design)))
        let edge = SCNMaterial()
        edge.lightingModel = .physicallyBased
        edge.diffuse.contents = UIColor(white: 0.55, alpha: 1)
        edge.metalness.contents = 1
        edge.roughness.contents = 0.28
        shape.materials = [front, back, edge, edge]

        let card = SCNNode(geometry: shape)
        let tilt = SCNNode()
        tilt.addChildNode(card)
        tilt.eulerAngles = SCNVector3(-0.16, -0.22, 0.03)
        scene.rootNode.addChildNode(tilt)

        // Idle: slow sway + float so reflections keep moving across the surface.
        let sway = SCNAction.rotateBy(x: 0, y: 0.36, z: 0, duration: 3.2); sway.timingMode = .easeInEaseOut
        card.runAction(.repeatForever(.sequence([sway, sway.reversed()])), forKey: "idle")
        let bob = SCNAction.moveBy(x: 0, y: 0.06, z: 0, duration: 2); bob.timingMode = .easeInEaseOut
        tilt.runAction(.repeatForever(.sequence([bob, bob.reversed()])))

        let key = SCNNode()
        key.light = SCNLight()
        key.light?.type = .directional
        key.light?.intensity = 650
        key.eulerAngles = SCNVector3(-0.6, 0.5, 0)
        scene.rootNode.addChildNode(key)

        let camera = SCNNode()
        camera.camera = SCNCamera()
        camera.camera?.fieldOfView = 30
        camera.camera?.wantsHDR = true
        camera.camera?.bloomIntensity = 0.15
        camera.position = SCNVector3(0, 0, 5.4)
        scene.rootNode.addChildNode(camera)

        view.scene = scene
        view.pointOfView = camera

        context.coordinator.card = card
        context.coordinator.front = front
        context.coordinator.back = back
        context.coordinator.design = design
        view.addGestureRecognizer(UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.pan(_:))))
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        context.coordinator.flip(to: design)
    }

    final class Coordinator: NSObject {
        var card: SCNNode?
        var front: SCNMaterial?
        var back: SCNMaterial?
        var design: CardDesign = .obsidian

        func flip(to new: CardDesign) {
            guard new != design, let card else { return }
            design = new
            card.removeAction(forKey: "idle")
            let half = SCNAction.rotateTo(x: 0, y: .pi / 2, z: 0, duration: 0.22); half.timingMode = .easeIn
            let swap = SCNAction.run { [weak self] _ in
                self?.front?.diffuse.contents = CardScene.image(CardFaceArt(design: new))
                self?.back?.diffuse.contents = CardScene.image(CardBackArt(design: new))
            }
            let jump = SCNAction.rotateTo(x: 0, y: -.pi / 2, z: 0, duration: 0)
            let land = SCNAction.rotateTo(x: 0, y: 0, z: 0, duration: 0.42); land.timingMode = .easeOut
            let sway = SCNAction.rotateBy(x: 0, y: 0.36, z: 0, duration: 3.2); sway.timingMode = .easeInEaseOut
            card.runAction(.sequence([half, swap, jump, land])) {
                card.runAction(.repeatForever(.sequence([sway, sway.reversed()])), forKey: "idle")
            }
        }

        private var start = SCNVector3Zero
        @objc func pan(_ g: UIPanGestureRecognizer) {
            guard let card else { return }
            let t = g.translation(in: g.view)
            switch g.state {
            case .began:
                card.removeAllActions()
                start = card.eulerAngles
            case .changed:
                card.eulerAngles = SCNVector3(start.x + Float(t.y) * 0.008, start.y + Float(t.x) * 0.012, 0)
            default:
                let back = SCNAction.rotateTo(x: 0, y: 0, z: 0, duration: 0.6, usesShortestUnitArc: true)
                back.timingMode = .easeOut
                let sway = SCNAction.rotateBy(x: 0, y: 0.36, z: 0, duration: 3.2); sway.timingMode = .easeInEaseOut
                card.runAction(back) { card.runAction(.repeatForever(.sequence([sway, sway.reversed()])), forKey: "idle") }
            }
        }
    }

    @MainActor static func image<V: View>(_ v: V) -> UIImage {
        let r = ImageRenderer(content: v.frame(width: 860, height: 542))
        r.scale = 2
        return r.uiImage ?? UIImage()
    }

    static func paint(_ img: UIImage) -> SCNMaterial {
        let m = SCNMaterial()
        m.lightingModel = .physicallyBased
        m.diffuse.contents = img
        m.metalness.contents = 0.25
        m.roughness.contents = 0.32
        m.clearCoat.contents = 1
        m.clearCoatRoughness.contents = 0.05
        return m
    }

    static func environment() -> UIImage {
        let size = CGSize(width: 512, height: 256)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let cg = ctx.cgContext
            let colors = [UIColor.white.cgColor, UIColor(white: 0.75, alpha: 1).cgColor, UIColor(white: 0.08, alpha: 1).cgColor] as CFArray
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 0.4, 1])!
            cg.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: 256), options: [])
            // Two soft-box highlights → the streaks that sweep across glossy cards.
            cg.setFillColor(UIColor.white.cgColor)
            cg.fill(CGRect(x: 90, y: 30, width: 40, height: 110))
            cg.fill(CGRect(x: 330, y: 50, width: 70, height: 60))
        }
    }
}

// MARK: - 2.5D card (lists, teasers): artwork + tilt + moving specular

struct CardTilt: View {
    var design: CardDesign
    var width: CGFloat = 150
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate
            CardFaceArt(design: design)
                .frame(width: width)
                .overlay {
                    LinearGradient(colors: [.clear, .white.opacity(0.35), .clear], startPoint: .leading, endPoint: .trailing)
                        .frame(width: width * 0.4)
                        .rotationEffect(.degrees(20))
                        .offset(x: CGFloat(sin(t * 0.8)) * width * 0.7)
                        .blendMode(.plusLighter)
                }
                .clipShape(.rect(cornerRadius: width * 0.06, style: .continuous))
                .rotation3DEffect(.degrees(sin(t * 0.8) * 10), axis: (x: 0.2, y: 1, z: 0), perspective: 0.5)
                .shadow(color: .black.opacity(0.25), radius: 14, y: 10)
        }
        .accessibilityHidden(true)
    }
}
