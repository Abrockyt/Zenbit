import SwiftUI
import SceneKit

/// Real 3D rupee coin rendered with SceneKit (physically based metal, no external assets).
/// Spins slowly; people can flick it with a drag. Falls back to the 2.5D coin with Reduce Motion.
struct Coin3DView: View {
    var size: CGFloat = 220
    /// Sway (±32°) instead of a full spin – used where the coin sits beside text and must always read as a coin.
    var sway = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if reduceMotion {
                CoinView(size: size * 0.72, spin: 18)
            } else {
                CoinScene(sway: sway)
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

private struct CoinScene: UIViewRepresentable {
    var sway = false
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
        scene.lightingEnvironment.contents = Self.environmentImage()
        scene.lightingEnvironment.intensity = 1.6

        // Coin geometry: caps face the camera after a 90° X rotation.
        let cylinder = SCNCylinder(radius: 1, height: 0.17)
        cylinder.radialSegmentCount = 120
        let side = SCNMaterial()
        side.lightingModel = .physicallyBased
        side.diffuse.contents = UIColor(rgb: 0x00A85B)
        side.metalness.contents = 0.95
        side.roughness.contents = 0.22
        let face = SCNMaterial()
        face.lightingModel = .physicallyBased
        face.diffuse.contents = Self.faceImage()
        // Cylinder caps map UVs sideways once the coin is stood up – rotate the artwork upright.
        let toCenter = SCNMatrix4MakeTranslation(-0.5, -0.5, 0)
        let back = SCNMatrix4MakeTranslation(0.5, 0.5, 0)
        face.diffuse.contentsTransform = SCNMatrix4Mult(SCNMatrix4Mult(toCenter, SCNMatrix4MakeRotation(-.pi / 2, 0, 0, 1)), back)
        face.metalness.contents = 0.85
        face.roughness.contents = 0.3
        cylinder.materials = [side, face, face]

        let coin = SCNNode(geometry: cylinder)
        coin.eulerAngles.x = .pi / 2

        let tilt = SCNNode()
        tilt.eulerAngles.x = -0.18
        tilt.eulerAngles.z = 0.08
        let spin = SCNNode()
        spin.addChildNode(coin)
        tilt.addChildNode(spin)
        scene.rootNode.addChildNode(tilt)

        if sway {
            spin.eulerAngles.y = -0.56
            let a = SCNAction.rotateBy(x: 0, y: 1.12, z: 0, duration: 2.4); a.timingMode = .easeInEaseOut
            spin.runAction(.repeatForever(.sequence([a, a.reversed()])), forKey: "spin")
        } else {
            spin.runAction(.repeatForever(.rotateBy(x: 0, y: .pi * 2, z: 0, duration: 7)), forKey: "spin")
        }
        let bob = SCNAction.sequence([.moveBy(x: 0, y: 0.08, z: 0, duration: 1.6),
                                      .moveBy(x: 0, y: -0.08, z: 0, duration: 1.6)])
        bob.timingMode = .easeInEaseOut
        tilt.runAction(.repeatForever(bob))

        let key = SCNNode()
        key.light = SCNLight()
        key.light?.type = .directional
        key.light?.intensity = 900
        key.eulerAngles = SCNVector3(-0.7, 0.6, 0)
        scene.rootNode.addChildNode(key)

        let camera = SCNNode()
        camera.camera = SCNCamera()
        camera.camera?.fieldOfView = 32
        camera.camera?.wantsHDR = true
        camera.camera?.bloomIntensity = 0.25
        camera.position = SCNVector3(0, 0, 4.6)
        scene.rootNode.addChildNode(camera)

        view.scene = scene
        view.pointOfView = camera
        context.coordinator.spinNode = spin

        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.pan(_:)))
        view.addGestureRecognizer(pan)
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {}

    final class Coordinator: NSObject {
        var spinNode: SCNNode?
        private var last: CGFloat = 0

        @objc func pan(_ g: UIPanGestureRecognizer) {
            guard let node = spinNode else { return }
            let x = g.translation(in: g.view).x
            switch g.state {
            case .began:
                node.removeAction(forKey: "spin")
                last = 0
            case .changed:
                node.eulerAngles.y += Float((x - last) * 0.012)
                last = x
            default:
                // Flick: carry the velocity, then settle back into the idle spin.
                let v = g.velocity(in: g.view).x
                let flick = SCNAction.rotateBy(x: 0, y: CGFloat(v) * 0.0025, z: 0, duration: 0.9)
                flick.timingMode = .easeOut
                node.runAction(.sequence([flick, .repeatForever(.rotateBy(x: 0, y: .pi * 2, z: 0, duration: 7))]),
                               forKey: "spin")
            }
        }
    }

    // MARK: Procedural textures

    static func faceImage() -> UIImage {
        let size = CGSize(width: 512, height: 512)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let cg = ctx.cgContext
            let colors = [UIColor(rgb: 0x9CFAD0).cgColor, UIColor(rgb: 0x00C46A).cgColor, UIColor(rgb: 0x007A40).cgColor] as CFArray
            let grad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 0.55, 1])!
            cg.drawRadialGradient(grad, startCenter: CGPoint(x: 190, y: 170), startRadius: 0,
                                  endCenter: CGPoint(x: 256, y: 256), endRadius: 330, options: [.drawsAfterEndLocation])
            // Inner ring
            cg.setStrokeColor(UIColor.white.withAlphaComponent(0.55).cgColor)
            cg.setLineWidth(10)
            cg.strokeEllipse(in: CGRect(x: 52, y: 52, width: 408, height: 408))
            cg.setStrokeColor(UIColor(rgb: 0x006A37).withAlphaComponent(0.5).cgColor)
            cg.setLineWidth(4)
            cg.strokeEllipse(in: CGRect(x: 70, y: 70, width: 372, height: 372))
            // Embossed ₹: dark body + light bevel offset
            let font = UIFont.systemFont(ofSize: 270, weight: .bold).rounded
            func draw(_ color: UIColor, dx: CGFloat, dy: CGFloat) {
                let s = NSAttributedString(string: "₹", attributes: [.font: font, .foregroundColor: color])
                let b = s.size()
                s.draw(at: CGPoint(x: (512 - b.width) / 2 + dx, y: (512 - b.height) / 2 + dy))
            }
            draw(UIColor.white.withAlphaComponent(0.6), dx: -5, dy: -5)
            draw(UIColor(rgb: 0x005C2E), dx: 0, dy: 0)
        }
    }

    static func environmentImage() -> UIImage {
        let size = CGSize(width: 256, height: 128)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let colors = [UIColor.white.cgColor, UIColor(rgb: 0xD9FBEA).cgColor, UIColor(rgb: 0x0A3A22).cgColor] as CFArray
            let grad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 0.45, 1])!
            ctx.cgContext.drawLinearGradient(grad, start: .zero, end: CGPoint(x: 0, y: 128), options: [])
        }
    }
}

private extension UIFont {
    var rounded: UIFont {
        guard let d = fontDescriptor.withDesign(.rounded) else { return self }
        return UIFont(descriptor: d, size: pointSize)
    }
}

#Preview { Coin3DView() }
