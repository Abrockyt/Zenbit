import SwiftUI

/// Profile ▸ Apple Watch. Three ways to connect, in order of ease:
/// 1. Open Zenbit on the watch – a request appears here (and as a sheet anywhere in the app) → approve with Face ID.
/// 2. Type the 6-digit code shown on the watch (works even when the watch can't reach the phone).
/// 3. Already connected → see status, sync now, disconnect.
struct AppleWatchView: View {
    @Environment(AppModel.self) private var model
    @State private var code = ""
    @State private var wrong = false
    @FocusState private var focused: Bool

    private var link: WatchLink { model.watchLink }

    var body: some View {
        ScrollView {
            VStack(spacing: ZB.Space.xl) {
                header
                if link.state == .paired { connectedCard } else { connectFlow }
                whatItDoes
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, 80)
            .frame(maxWidth: 560)
            .frame(maxWidth: .infinity)
        }
        .background(ZB.Palette.canvas)
        .navigationTitle("Apple Watch")
        .navigationBarTitleDisplayMode(.inline)
        .animation(ZB.Motion.standard, value: link.state)
        .animation(ZB.Motion.standard, value: link.incoming)
    }

    // MARK: Header

    private var header: some View {
        VStack(spacing: ZB.Space.md) {
            ZStack {
                ForEach(0..<3, id: \.self) { i in
                    PulseRing(delay: Double(i) * 0.8, active: link.state != .paired)
                }
                Image(systemName: "applewatch")
                    .font(.system(size: 44, weight: .regular))
                    .foregroundStyle(ZB.Palette.ink)
                    .frame(width: 96, height: 96)
                    .background(ZB.Palette.surface, in: .circle)
                    .overlay(alignment: .bottomTrailing) {
                        if link.state == .paired {
                            Image(systemName: "checkmark.circle.fill").font(.title2)
                                .foregroundStyle(.white, ZB.Palette.accent)
                                .background(Circle().fill(ZB.Palette.canvas).padding(2))
                                .transition(.scale.combined(with: .opacity))
                        }
                    }
            }
            .frame(height: 140)
            Text(link.state == .paired ? "Connected" : "Connect your Apple Watch")
                .font(.system(.title2, design: .rounded).weight(.bold))
            Text(link.state == .paired
                 ? "\(link.peerName ?? "Apple Watch") can show your balance, QR code and payment alerts."
                 : "See payments and receive money from your wrist. Sending money always happens on your iPhone.")
                .font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary).multilineTextAlignment(.center)
        }
        .padding(.top, ZB.Space.sm)
    }

    // MARK: Not connected

    @ViewBuilder private var connectFlow: some View {
        if let req = link.incoming {
            // A watch is asking right now.
            VStack(spacing: ZB.Space.md) {
                Label("\(req.watchName) wants to connect", systemImage: "wave.3.right")
                    .font(.headline)
                CodeDigits(code: req.code)
                Text("Check this matches the code on your watch.").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                HStack(spacing: ZB.Space.xs) {
                    Button("Decline") { link.decline() }.buttonStyle(.zbSecondary)
                    Button("Approve") { approve(req) }.buttonStyle(.zbInk)
                }
            }
            .padding(ZB.Space.lg)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
            .transition(.scale(scale: 0.96).combined(with: .opacity))
        }

        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            Text("How to connect").font(.title3.weight(.semibold))
            step(1, "Open Zenbit on your Apple Watch", "Tap “Connect to iPhone”. A 6-digit code appears.")
            step(2, "Approve here", "A request shows up on this screen. Approve with Face ID.")
            step(3, "Or type the code", "If no request appears, enter the code from the watch below.")
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            Text("Enter the code from your watch").font(.subheadline.weight(.semibold))
            HStack(spacing: ZB.Space.xs) {
                TextField("", text: $code, prompt: Text("000 000").foregroundStyle(ZB.Palette.inkTertiary))
                    .keyboardType(.numberPad)
                    .font(.system(.title3, design: .monospaced).weight(.semibold))
                    .focused($focused)
                    .onChange(of: code) { _, v in
                        let d = String(v.filter(\.isNumber).prefix(6))
                        let spaced = d.count > 3 ? d.prefix(3) + " " + d.dropFirst(3) : Substring(d)
                        if String(spaced) != v { code = String(spaced) }
                        wrong = false
                    }
                    .padding(.horizontal, ZB.Space.md).frame(height: 52)
                    .background(ZB.Palette.surface, in: .rect(cornerRadius: 14, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(wrong ? ZB.Palette.danger : .clear, lineWidth: 1.5))
                Button("Connect") { manualConnect() }
                    .buttonStyle(.zbInkCompact)
                    .disabled(code.filter(\.isNumber).count != 6)
            }
            if wrong {
                Label("That code doesn't look right.", systemImage: "exclamationmark.circle.fill")
                    .font(.footnote).foregroundStyle(ZB.Palette.danger)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        if !link.hardwarePaired {
            Label("No Apple Watch is paired with this iPhone yet. Pair it in the Watch app first.", systemImage: "info.circle")
                .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func step(_ n: Int, _ title: String, _ sub: String) -> some View {
        HStack(alignment: .top, spacing: ZB.Space.md) {
            Text("\(n)").font(.system(.subheadline, design: .rounded).weight(.bold)).foregroundStyle(ZB.Palette.canvas)
                .frame(width: 26, height: 26).background(ZB.Palette.ink, in: .circle)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold))
                Text(sub).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
            }
        }
    }

    // MARK: Connected

    private var connectedCard: some View {
        VStack(spacing: 0) {
            row("Watch", link.peerName ?? "Apple Watch")
            Divider().overlay(ZB.Palette.hairline)
            row("Link", link.isReachable ? "Connected now" : "Will sync when nearby")
            Divider().overlay(ZB.Palette.hairline)
            row("Last sync", link.lastSync?.formatted(.relative(presentation: .named)) ?? "Not yet")
            Divider().overlay(ZB.Palette.hairline)
            Button { model.syncWatch(); Haptics.tap() } label: {
                Label("Sync now", systemImage: "arrow.triangle.2.circlepath").frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
            }
            .buttonStyle(.plain)
            Divider().overlay(ZB.Palette.hairline)
            Button(role: .destructive) {
                link.disconnectFromPhone()
                model.showToast("Apple Watch disconnected", symbol: "applewatch.slash")
            } label: {
                Label("Disconnect watch", systemImage: "applewatch.slash").frame(maxWidth: .infinity, minHeight: 52, alignment: .leading)
            }
        }
        .padding(.horizontal, ZB.Space.lg)
        .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
    }

    private func row(_ l: String, _ r: String) -> some View {
        HStack { Text(l).foregroundStyle(ZB.Palette.inkSecondary); Spacer(); Text(r).fontWeight(.medium) }
            .frame(minHeight: 52)
    }

    // MARK: What it does

    private var whatItDoes: some View {
        VStack(alignment: .leading, spacing: ZB.Space.md) {
            Text("On your wrist").font(.title3.weight(.semibold))
            ForEach([("bell.badge", "Payment alerts", "Know the moment money arrives."),
                     ("qrcode", "Your QR code", "Let anyone scan and pay you."),
                     ("eye", "Balance, hidden until you tap", "Never shown by accident."),
                     ("lock.shield", "No sending money", "Payments and your PIN stay on iPhone.")], id: \.0) { r in
                HStack(spacing: ZB.Space.md) {
                    Image(systemName: r.0).frame(width: 40, height: 40)
                        .background(ZB.Palette.surface, in: .rect(cornerRadius: 12, style: .continuous))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(r.1).font(.subheadline.weight(.semibold))
                        Text(r.2).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                    Spacer()
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Actions

    private func approve(_ req: WatchPairRequest) {
        Task {
            guard await Biometrics.authenticate(reason: "Connect \(req.watchName) to Zenbit") else { return }
            link.approve(code: req.code, watchName: req.watchName)
            model.syncWatch()
            Haptics.success()
            model.showToast("\(req.watchName) connected", symbol: "applewatch.watchface")
        }
    }

    private func manualConnect() {
        let digits = code.filter(\.isNumber)
        guard digits.count == 6 else { wrong = true; return }
        Task {
            guard await Biometrics.authenticate(reason: "Connect your Apple Watch to Zenbit") else { return }
            link.approve(code: digits)
            model.syncWatch()
            Haptics.success()
            code = ""
            focused = false
            model.showToast("Apple Watch connected", symbol: "applewatch.watchface")
        }
    }
}

// MARK: - Pieces

private struct PulseRing: View {
    let delay: Double
    let active: Bool
    @State private var go = false
    var body: some View {
        Circle().strokeBorder(ZB.Palette.inkTertiary.opacity(0.35), lineWidth: 1.5)
            .frame(width: 96, height: 96)
            .scaleEffect(go ? 1.5 : 0.9)
            .opacity(active ? (go ? 0 : 0.8) : 0)
            .onAppear {
                withAnimation(.easeOut(duration: 2.4).repeatForever(autoreverses: false).delay(delay)) { go = true }
            }
    }
}

/// "482 913" in big monospaced digits.
struct CodeDigits: View {
    let code: String
    var body: some View {
        let a = code.prefix(3), b = code.dropFirst(3)
        HStack(spacing: 14) {
            ForEach([String(a), String(b)], id: \.self) { g in
                HStack(spacing: 6) {
                    ForEach(Array(g), id: \.self) { ch in
                        Text(String(ch)).font(.system(size: 30, weight: .semibold, design: .monospaced))
                            .frame(width: 30, height: 46)
                            .background(ZB.Palette.canvas, in: .rect(cornerRadius: 10, style: .continuous))
                    }
                }
            }
        }
        .accessibilityLabel("Code \(code.map(String.init).joined(separator: " "))")
    }
}

// MARK: - Approval sheet (anywhere in the app)

struct WatchApprovalSheet: View {
    @Environment(AppModel.self) private var model
    let request: WatchPairRequest

    var body: some View {
        VStack(spacing: ZB.Space.lg) {
            Image(systemName: "applewatch.watchface").font(.system(size: 40))
                .frame(width: 84, height: 84).background(ZB.Palette.surface, in: .circle)
                .padding(.top, ZB.Space.xl)
            Text("Connect \(request.watchName)?").font(.system(.title2, design: .rounded).weight(.bold))
            Text("Your watch is asking to show your balance, QR code and payment alerts.")
                .font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary).multilineTextAlignment(.center)
            CodeDigits(code: request.code)
                .padding(ZB.Space.md).background(ZB.Palette.surface, in: .rect(cornerRadius: 18, style: .continuous))
            Text("Make sure this matches the code on your watch.").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
            Spacer(minLength: 0)
            VStack(spacing: ZB.Space.xs) {
                Button {
                    Task {
                        guard await Biometrics.authenticate(reason: "Connect \(request.watchName) to Zenbit") else { return }
                        model.watchLink.approve(code: request.code, watchName: request.watchName)
                        model.syncWatch()
                        Haptics.success()
                        model.showToast("\(request.watchName) connected", symbol: "applewatch.watchface")
                    }
                } label: { Label("Approve", systemImage: "faceid") }
                .buttonStyle(.zbInk)
                Button("Not now") { model.watchLink.decline() }.buttonStyle(.zbSecondary)
            }
        }
        .padding(ZB.Space.margin)
        .presentationDetents([.height(560)])
        .presentationCornerRadius(32)
    }
}

#Preview { NavigationStack { AppleWatchView() }.environment(AppModel()) }
