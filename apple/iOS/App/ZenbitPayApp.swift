import SwiftUI
import LocalAuthentication

@main
struct ZenbitPayApp: App {
    @State private var model: AppModel

    init() {
        let m = AppModel()
        m.applyLaunchArguments()
        WatchLink.shared.activate()
        _model = State(initialValue: m)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
        }
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.scenePhase) private var scenePhase
    /// Cold start: logo pop → wireframe (returning users) → content. Skipped for debug entry points.
    private enum Launch { case logo, wireframe, done }
    @State private var launch: Launch = {
        #if DEBUG
        let d = UserDefaults.standard
        if d.string(forKey: "ZBScreen") != nil, !d.bool(forKey: "ZBSkeleton"), !d.bool(forKey: "ZBSplash") { return .done }
        #endif
        return .logo
    }()

    var body: some View {
        @Bindable var model = model
        ZStack(alignment: .top) {
            Group {
                if model.hasOnboarded {
                    MainTabs()
                        .transition(.opacity.combined(with: .scale(scale: 1.02)))
                } else {
                    OnboardingFlow()
                        .transition(.opacity)
                }
            }
            .animation(ZB.Motion.standard, value: model.hasOnboarded)

            if launch == .wireframe {
                HomeWireframe().transition(.opacity).zIndex(30)
            }
            if launch == .logo {
                LaunchSplash().transition(.opacity).zIndex(40)
            }

            if let toast = model.toast {
                ToastView(toast: toast)
                    .padding(.top, ZB.Space.xs)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(10)
            }

            if model.isLocked {
                LockView().transition(.opacity).zIndex(20)
            }
        }
        .task {
            guard launch == .logo else { return }
            try? await Task.sleep(for: .milliseconds(700))
            let returning = UserDefaults.standard.bool(forKey: "onboarded")
            withAnimation(.easeOut(duration: 0.25)) { launch = returning ? .wireframe : .done }
            guard returning else { return }
            try? await Task.sleep(for: .milliseconds(1_000))
            withAnimation(.easeOut(duration: 0.4)) { launch = .done }
        }
        .tint(ZB.Palette.ink)
        .preferredColorScheme(.light) // Zenbit is light-only
        .fullScreenCover(item: $model.activeFlow) { config in
            PayFlowView(config: config)
                .environment(model)
        }
        .sheet(item: Binding(get: { model.watchLink.incoming }, set: { if $0 == nil { model.watchLink.decline() } })) { req in
            WatchApprovalSheet(request: req).environment(model)
        }
        .fullScreenCover(isPresented: $model.showAI) {
            ZenAIView().environment(model)
        }
        .fullScreenCover(isPresented: $model.showScanner) {
            ScanView().environment(model)
        }
        .onChange(of: scenePhase) { _, phase in
            // App lock: hide content when leaving the app (also protects the app-switcher snapshot).
            if phase == .background, model.appLockEnabled, model.hasOnboarded { model.isLocked = true }
        }
        .onOpenURL { url in
            if url.scheme == "zenbit" { model.handleWidgetLink(url); return }
            guard let link = UPILink(string: url.absoluteString) else { return }
            model.startPay(model.resolve(link: link), amount: link.amount, note: link.note ?? "",
                           locked: link.amount != nil, source: "deeplink")
        }
    }
}

/// Face ID / passcode gate. Payments still always need the UPI PIN.
struct LockView: View {
    @Environment(AppModel.self) private var model
    @State private var failed = false

    var body: some View {
        ZStack {
            ZB.Palette.canvas.ignoresSafeArea()
            VStack(spacing: ZB.Space.lg) {
                Image(systemName: "faceid")
                    .font(.system(size: 54, weight: .light))
                    .foregroundStyle(ZB.Palette.ink)
                Text("Zenbit is locked").font(.title2.weight(.semibold))
                Text(failed ? "Couldn't verify. Try again." : "Unlock with Face ID to continue")
                    .font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                Button("Unlock", action: unlock)
                    .buttonStyle(.zbInk)
                    .frame(maxWidth: 280)
            }
            .padding()
        }
        .task { unlock() }
    }

    private func unlock() {
        Task {
            if await Biometrics.authenticate(reason: "Unlock Zenbit") {
                withAnimation(ZB.Motion.standard) { model.isLocked = false }
            } else { failed = true }
        }
    }
}
