import SwiftUI
import LocalAuthentication
import UIKit

/// One entry point for Face ID across the app (pay ≤ ₹5,000, balance check, app lock).
/// Real device with Face ID → system prompt. Simulator / not enrolled → a faithful demo HUD
/// (scan → tick) so the flow can be shown end to end. The demo never runs on an enrolled device.
@MainActor
enum Biometrics {
    static func authenticate(reason: String) async -> Bool {
        let ctx = LAContext()
        ctx.localizedFallbackTitle = "Use UPI PIN"
        var err: NSError?
        if ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err) {
            let ok = (try? await ctx.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)) ?? false
            Analytics.track("faceid", ["ok": "\(ok)", "demo": "false"])
            return ok
        }
        let ok = await DemoFaceID.run()
        Analytics.track("faceid", ["ok": "\(ok)", "demo": "true"])
        return ok
    }
}

/// Presents the HUD in its own window so it sits above sheets and full-screen covers.
@MainActor
private enum DemoFaceID {
    static var window: UIWindow?

    static func run() async -> Bool {
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first else { return true }
        return await withCheckedContinuation { cont in
            let w = UIWindow(windowScene: scene)
            w.windowLevel = .alert + 1
            w.backgroundColor = .clear
            let host = UIHostingController(rootView: FaceIDHUD {
                window?.isHidden = true
                window = nil
                cont.resume(returning: true)
            })
            host.view.backgroundColor = .clear
            w.rootViewController = host
            w.makeKeyAndVisible()
            window = w
        }
    }
}

/// Mirrors the system Face ID HUD: dark rounded square, glyph scans, then a tick.
private struct FaceIDHUD: View {
    var done: () -> Void
    @State private var phase = 0 // 0 appear, 1 scanning, 2 success, 3 out

    var body: some View {
        ZStack {
            Color.black.opacity(phase == 0 || phase == 3 ? 0 : 0.12).ignoresSafeArea()
            VStack(spacing: 14) {
                ZStack {
                    Image(systemName: "faceid")
                        .font(.system(size: 64, weight: .light))
                        .symbolEffect(.pulse, options: .repeating, isActive: phase == 1)
                        .opacity(phase >= 2 ? 0 : 1)
                        .scaleEffect(phase >= 2 ? 0.6 : 1)
                    Image(systemName: "checkmark.circle")
                        .font(.system(size: 64, weight: .light))
                        .opacity(phase >= 2 ? 1 : 0)
                        .scaleEffect(phase >= 2 ? 1 : 0.6)
                }
                .foregroundStyle(.white)
                Text(phase >= 2 ? "Done" : "Face ID")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white.opacity(0.85))
                    .contentTransition(.opacity)
            }
            .frame(width: 168, height: 168)
            .background(.black.opacity(0.78), in: .rect(cornerRadius: 34, style: .continuous))
            .scaleEffect(phase == 0 ? 0.85 : phase == 3 ? 0.92 : 1)
            .opacity(phase == 0 || phase == 3 ? 0 : 1)
        }
        .sensoryFeedback(.success, trigger: phase == 2)
        .task {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.8)) { phase = 1 }
            try? await Task.sleep(for: .milliseconds(900))
            withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) { phase = 2 }
            try? await Task.sleep(for: .milliseconds(520))
            withAnimation(.easeIn(duration: 0.2)) { phase = 3 }
            try? await Task.sleep(for: .milliseconds(210))
            done()
        }
        .accessibilityLabel(phase >= 2 ? "Face ID succeeded" : "Face ID")
    }
}
