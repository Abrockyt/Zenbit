import SwiftUI

/// Welcome → phone → OTP → link bank → set UPI PIN → done.
/// Goal-gradient: a 4-step progress bar keeps the finish line visible.
/// Hick's law: one decision per screen.
struct OnboardingFlow: View {
    enum Step: Int, CaseIterable { case welcome, notify, signin, phone, otp, bank, pin, done }

    @Environment(AppModel.self) private var model
    @State private var step: Step = {
        #if DEBUG
        switch UserDefaults.standard.string(forKey: "ZBScreen") {
        case "notify": return .notify
        case "signin": return .signin
        case "bank": return .bank
        case "o-phone": return .phone
        case "o-otp": return .otp
        case "o-pin": return .pin
        case "o-done": return .done
        default: break
        }
        #endif
        return .welcome
    }()
    @State private var phone: String = {
        #if DEBUG
        return UserDefaults.standard.string(forKey: "ZBScreen") == nil ? "" : "98765 43210"
        #else
        return ""
        #endif
    }()
    @State private var email: String?
    @State private var forward = true

    var body: some View {
        ZStack {
            ZB.Palette.canvas.ignoresSafeArea()
            VStack(spacing: 0) {
                if step.rawValue >= Step.phone.rawValue && step != .done {
                    header
                }
                content
                    .frame(maxWidth: 520)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .id(step)
                    .transition(.asymmetric(
                        insertion: .move(edge: forward ? .trailing : .leading).combined(with: .opacity),
                        removal: .move(edge: forward ? .leading : .trailing).combined(with: .opacity)))
            }
        }
        .animation(ZB.Motion.standard, value: step)
    }

    private var header: some View {
        HStack(alignment: .center, spacing: ZB.Space.md) {
            GlassIconButton(systemName: "chevron.left", label: "Back") { go(Step(rawValue: step.rawValue - 1)!) }
            StepBar(labels: ["Mobile", "Verify", "Bank", "PIN"], current: step.rawValue - Step.phone.rawValue)
        }
        .padding(.horizontal, ZB.Space.margin)
        .padding(.top, 10)
        .padding(.bottom, 14)
    }

    @ViewBuilder private var content: some View {
        switch step {
        case .welcome: OrbitStep { go(.notify) }
        case .notify: NotifyStep { go(.signin) }
        case .signin: SignInStep { e in email = e; go(.phone) }
        case .phone: PhoneStep(phone: $phone, email: email) { go(.otp) }
        case .otp: OTPStep(phone: phone, change: { go(.phone) }) { go(.bank) }
        case .bank: BankStep(phone: phone) { go(.pin) }
        case .pin: SetPinStep { go(.done) }
        case .done: DoneStep { model.hasOnboarded = true; Analytics.track("onboarding_complete") }
        }
    }

    private func go(_ s: Step) {
        forward = s.rawValue > step.rawValue
        Analytics.track("onboarding_step", ["step": "\(s)"])
        step = s
    }
}

// MARK: - Phone

private struct PhoneStep: View {
    @Binding var phone: String
    var email: String?
    var next: () -> Void
    @FocusState private var focused: Bool
    @State private var digits = ""
    @State private var caret = false

    private var normalized: String? { UPIValidation.normalizedPhone(phone) }
    private var showError: Bool { phone.filter(\.isNumber).count >= 10 && normalized == nil }

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            StepTitle(title: "Your mobile number",
                      subtitle: "Use the number linked to your bank account. We'll verify it with an SMS.")
            if let email {
                Label("Signed in as \(email)", systemImage: "checkmark.circle.fill")
                    .font(.footnote.weight(.medium)).foregroundStyle(ZB.Palette.inkSecondary)
            }
            // The real field holds only the digits and is invisible; the formatted number is drawn on top.
            // (Reformatting text inside the field made the caret jump to the start.)
            HStack(spacing: ZB.Space.sm) {
                Text("🇮🇳 +91").font(.title3.weight(.medium)).foregroundStyle(ZB.Palette.inkSecondary)
                ZStack(alignment: .leading) {
                    TextField("", text: $digits)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                        .focused($focused)
                        .foregroundStyle(.clear).tint(.clear)
                        .onChange(of: digits) { _, v in
                            let d = String(UPIValidation.normalizedPhone(v) ?? String(v.filter(\.isNumber).suffix(10)))
                            if d != v { digits = d }                          // paste "+91 98765-43210" → 9876543210
                            phone = d.count > 5 ? d.prefix(5) + " " + d.dropFirst(5) : d
                        }
                    HStack(spacing: 1) {
                        if digits.isEmpty { Text("98765 43210").foregroundStyle(ZB.Palette.inkTertiary) }
                        else { Text(phone).foregroundStyle(ZB.Palette.ink) }
                        if focused { Capsule().fill(ZB.Palette.ink).frame(width: 2, height: 24).opacity(caret ? 0 : 1) }
                    }
                    .font(.title3.weight(.semibold).monospacedDigit())
                    .allowsHitTesting(false)
                }
            }
            .padding(ZB.Space.md)
            .zbCard(radius: ZB.Radius.md, fill: ZB.Palette.surface)
            .overlay(RoundedRectangle(cornerRadius: ZB.Radius.md, style: .continuous)
                .strokeBorder(showError ? ZB.Palette.danger : .clear, lineWidth: 1.5))

            if showError {
                Label("Indian mobile numbers start with 6, 7, 8 or 9", systemImage: "exclamationmark.circle.fill")
                    .font(.footnote).foregroundStyle(ZB.Palette.danger)
            }
            Spacer()
            Text("By continuing you agree to Zenbit's Terms and Privacy Policy. Standard SMS charges may apply.")
                .font(.footnote).foregroundStyle(ZB.Palette.inkTertiary)
            Button("Send code", action: next)
                .buttonStyle(.zbInk)
                .disabled(normalized == nil)
        }
        .padding(ZB.Space.margin)
        .onAppear {
            digits = phone.filter(\.isNumber)
            focused = true
            withAnimation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true)) { caret = true }
        }
    }
}

// MARK: - Step bar (shows where you are and what's next)

private struct StepBar: View {
    let labels: [String]
    let current: Int

    var body: some View {
        VStack(spacing: 7) {
            HStack(spacing: 6) {
                ForEach(labels.indices, id: \.self) { i in
                    Capsule().fill(i <= current ? ZB.Palette.ink : ZB.Palette.surface).frame(height: 5)
                }
            }
            HStack(spacing: 6) {
                ForEach(labels.indices, id: \.self) { i in
                    HStack(spacing: 3) {
                        if i < current { Image(systemName: "checkmark").font(.system(size: 9, weight: .bold)) }
                        Text(labels[i]).font(.caption.weight(i == current ? .bold : .medium))
                    }
                    .foregroundStyle(i <= current ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .animation(ZB.Motion.standard, value: current)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Step \(current + 1) of \(labels.count): \(labels[min(current, labels.count - 1)])")
    }
}

// MARK: - OTP

private struct OTPStep: View {
    let phone: String
    var change: () -> Void
    var next: () -> Void
    @State private var code = ""
    @State private var error = false
    @State private var shake: CGFloat = 0
    @State private var resendIn = 30
    @State private var verifying = false
    @State private var verified = false
    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            StepTitle(title: "Verify your number", subtitle: "We sent a 6-digit code by SMS to")
            HStack(spacing: ZB.Space.xs) {
                Text("+91 \(phone)").font(.headline.monospacedDigit())
                Button("Change", action: change).font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.inkSecondary)
                    .padding(.horizontal, 10).frame(height: 30).background(ZB.Palette.surface, in: .capsule)
            }

            // Six visible boxes; one real (invisible) field underneath takes the keyboard and SMS autofill.
            ZStack {
                TextField("", text: $code)
                    .keyboardType(.numberPad)
                    .textContentType(.oneTimeCode)
                    .focused($focused)
                    .foregroundStyle(.clear).tint(.clear)
                    .onChange(of: code) { _, v in
                        let d = String(v.filter(\.isNumber).prefix(6))
                        if d != v { code = d }
                        error = false
                        if d.count == 6 { verify() }
                    }
                HStack(spacing: 8) {
                    ForEach(0..<6, id: \.self) { i in OTPBox(index: i, code: code, focused: focused, error: error, verified: verified) }
                }
                .allowsHitTesting(false)
                .modifier(Shake(animatableData: shake))
            }
            .contentShape(.rect)
            .onTapGesture { focused = true }

            Group {
                if error {
                    Label("That code didn't match. Check the SMS and try again.", systemImage: "exclamationmark.circle.fill")
                        .foregroundStyle(ZB.Palette.danger)
                } else if verified {
                    Label("Number verified", systemImage: "checkmark.circle.fill").foregroundStyle(ZB.Palette.greenInk)
                } else if verifying {
                    HStack(spacing: 8) { ZSpinner(size: 16); Text("Verifying…") }.foregroundStyle(ZB.Palette.inkSecondary)
                } else {
                    Text("Demo: any code works except 000000.").foregroundStyle(ZB.Palette.inkTertiary)
                }
            }
            .font(.footnote.weight(.medium))
            .frame(minHeight: 20)

            HStack {
                Text("Didn't get it?").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                Button(resendIn > 0 ? "Resend in 0:\(String(format: "%02d", resendIn))" : "Resend code") { resendIn = 30 }
                    .disabled(resendIn > 0)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(resendIn > 0 ? ZB.Palette.inkTertiary : ZB.Palette.ink)
            }
            Spacer()
        }
        .padding(ZB.Space.margin)
        .sensoryFeedback(.error, trigger: error) { _, n in n }
        .sensoryFeedback(.success, trigger: verified) { _, n in n }
        .onAppear { focused = true }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                if resendIn > 0 { resendIn -= 1 }
            }
        }
    }

    private func verify() {
        verifying = true
        Task {
            try? await Task.sleep(for: .milliseconds(700))
            verifying = false
            if code == "000000" {
                error = true
                withAnimation(.linear(duration: 0.4)) { shake += 1 }
                code = ""
            } else {
                withAnimation(ZB.Motion.standard) { verified = true }
                try? await Task.sleep(for: .milliseconds(650))
                next()
            }
        }
    }
}

private struct OTPBox: View {
    let index: Int
    let code: String
    let focused: Bool
    let error: Bool
    let verified: Bool
    @State private var blink = false

    var body: some View {
        let chars = Array(code)
        let filled = index < chars.count
        let active = focused && index == chars.count && !verified
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous).fill(ZB.Palette.surface)
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(error ? ZB.Palette.danger : (verified ? ZB.Palette.greenInk : (active ? ZB.Palette.ink : .clear)), lineWidth: 2)
            if filled {
                Text(String(chars[index])).font(.system(size: 28, weight: .semibold, design: .rounded)).monospacedDigit()
                    .transition(.scale(scale: 0.6).combined(with: .opacity))
            } else if active {
                Capsule().fill(ZB.Palette.ink).frame(width: 2, height: 28).opacity(blink ? 0 : 1)
            }
        }
        .frame(maxWidth: .infinity).frame(height: 64)
        .animation(.spring(response: 0.25, dampingFraction: 0.8), value: filled)
        .onAppear { withAnimation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true)) { blink = true } }
    }
}

// MARK: - Link bank

/// Link a bank (Google Pay structure): pick your bank → we verify your SIM by SMS → choose the account.
private struct BankStep: View {
    let phone: String
    var next: () -> Void
    enum Stage { case pick, verifying, accounts }
    @State private var stage: Stage = .pick
    @State private var query = ""
    @State private var bank: BankChoice?
    @State private var selected = SampleData.accounts[0].id
    @State private var verifyStep = 0

    struct BankChoice: Identifiable, Hashable {
        let id: String; let name: String; let mono: String; let hue: Double
    }
    private let popular: [BankChoice] = [
        .init(id: "hdfc", name: "HDFC Bank", mono: "HB", hue: 0.62),
        .init(id: "sbi", name: "State Bank of India", mono: "SB", hue: 0.58),
        .init(id: "icici", name: "ICICI Bank", mono: "IC", hue: 0.07),
        .init(id: "axis", name: "Axis Bank", mono: "AX", hue: 0.95),
        .init(id: "kotak", name: "Kotak Mahindra Bank", mono: "KM", hue: 0.0),
        .init(id: "pnb", name: "Punjab National Bank", mono: "PN", hue: 0.12),
        .init(id: "bob", name: "Bank of Baroda", mono: "BB", hue: 0.04),
        .init(id: "idfc", name: "IDFC FIRST Bank", mono: "IF", hue: 0.0),
        .init(id: "yes", name: "Yes Bank", mono: "YB", hue: 0.6),
        .init(id: "union", name: "Union Bank of India", mono: "UB", hue: 0.55),
    ]
    private var results: [BankChoice] {
        query.isEmpty ? popular : popular.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }
    private let steps = ["Sending a secure SMS from your SIM", "Verifying with your bank", "Fetching your accounts"]

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            switch stage {
            case .pick: pick.transition(.opacity)
            case .verifying: verifying.transition(.opacity)
            case .accounts: accounts.transition(.opacity.combined(with: .move(edge: .bottom)))
            }
        }
        .padding(ZB.Space.margin)
        .animation(ZB.Motion.standard, value: stage)
    }

    // 1) pick
    private var pick: some View {
        VStack(alignment: .leading, spacing: ZB.Space.md) {
            StepTitle(title: "Add your bank account", subtitle: "Choose the bank where +91 \(phone) is registered.")
            HStack(spacing: ZB.Space.xs) {
                Image(systemName: "magnifyingglass").foregroundStyle(ZB.Palette.inkSecondary)
                TextField("", text: $query, prompt: Text("Search banks").foregroundStyle(ZB.Palette.inkSecondary))
                    .textInputAutocapitalization(.words)
            }
            .padding(.horizontal, ZB.Space.md).frame(height: 48)
            .background(ZB.Palette.surface, in: .rect(cornerRadius: 14, style: .continuous))
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(results) { b in
                        Button { choose(b) } label: {
                            HStack(spacing: ZB.Space.md) {
                                BankLogo(bankName: b.name, height: 42)
                                Text(b.name).font(.body).foregroundStyle(ZB.Palette.ink)
                                Spacer()
                                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(ZB.Palette.inkTertiary)
                            }
                            .frame(minHeight: 60)
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                        if b.id != results.last?.id { Divider().overlay(ZB.Palette.hairline).padding(.leading, 82) }
                    }
                    if results.isEmpty {
                        Text("No bank matches “\(query)”.").foregroundStyle(ZB.Palette.inkSecondary).padding(.top, ZB.Space.xl)
                    }
                }
            }
            .scrollIndicators(.hidden)
        }
    }

    // 2) verifying
    private var verifying: some View {
        VStack(alignment: .leading, spacing: ZB.Space.xl) {
            StepTitle(title: "Linking \(bank?.name ?? "your bank")", subtitle: "This takes a few seconds. Standard SMS charges may apply.")
            VStack(alignment: .leading, spacing: ZB.Space.lg) {
                ForEach(steps.indices, id: \.self) { i in
                    HStack(spacing: ZB.Space.md) {
                        ZStack {
                            if verifyStep > i {
                                Image(systemName: "checkmark.circle.fill").font(.title3).foregroundStyle(ZB.Palette.ink)
                                    .transition(.scale.combined(with: .opacity))
                            } else if verifyStep == i {
                                ZSpinner(size: 22)
                            } else {
                                Circle().strokeBorder(ZB.Palette.hairline, lineWidth: 2).frame(width: 22, height: 22)
                            }
                        }
                        .frame(width: 28, height: 28)
                        Text(steps[i]).foregroundStyle(verifyStep >= i ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                    }
                }
            }
            .padding(.top, ZB.Space.lg)
            Spacer()
        }
        .animation(ZB.Motion.snappy, value: verifyStep)
    }

    // 3) accounts
    private var accounts: some View {
        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            StepTitle(title: "Choose an account", subtitle: "We found \(SampleData.accounts.count) accounts linked to your number.")
            VStack(spacing: ZB.Space.xs) {
                ForEach(SampleData.accounts) { acct in
                    Button { selected = acct.id } label: {
                        HStack(spacing: ZB.Space.md) {
                            BankLogo(bankName: acct.bankName, height: 44)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(acct.bankName).font(.headline).foregroundStyle(ZB.Palette.ink)
                                Text("\(acct.kind) •• \(acct.last4)").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                            }
                            Spacer()
                            Image(systemName: selected == acct.id ? "checkmark.circle.fill" : "circle")
                                .font(.title3)
                                .foregroundStyle(selected == acct.id ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                        }
                        .padding(ZB.Space.md)
                        .zbCard(radius: ZB.Radius.md, fill: ZB.Palette.surface)
                    }
                    .zbPressable()
                }
            }
            Spacer()
            Button("Link account", action: next).buttonStyle(.zbInk)
        }
    }

    private func choose(_ b: BankChoice) {
        bank = b
        stage = .verifying
        Task {
            for i in 1...steps.count {
                try? await Task.sleep(for: .milliseconds(900))
                verifyStep = i
            }
            try? await Task.sleep(for: .milliseconds(350))
            stage = .accounts
        }
    }
}

// MARK: - Welcome / sign in

/// "Continue with phone number" or "Continue with Apple". Simulated – it only pre-fills the profile;
/// UPI still needs the phone number your bank knows.
private struct SignInStep: View {
    var next: (String?) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(spacing: ZB.Space.md) {
                ZenbitLogoGlyph().fill(Color.black).frame(width: 76, height: 75.4)
                Text("Welcome to Zenbit").font(.system(.largeTitle, design: .rounded).weight(.bold))
                Text("Pay anyone, scan any QR, earn cashback on every payment.")
                    .font(.body).foregroundStyle(ZB.Palette.inkSecondary).multilineTextAlignment(.center)
                    .padding(.horizontal, ZB.Space.xl)
            }
            Spacer()
            VStack(spacing: ZB.Space.xs) {
                Button { next(nil) } label: { Label("Continue with phone number", systemImage: "phone.fill") }
                    .buttonStyle(.zbInk)
                Button { next("aarav.mehta@icloud.com") } label: {
                    HStack(spacing: ZB.Space.sm) {
                        Image(systemName: "apple.logo").font(.title3)
                        Text("Continue with Apple").font(.headline)
                    }
                    .foregroundStyle(ZB.Palette.ink)
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .overlay(Capsule().strokeBorder(ZB.Palette.hairline, lineWidth: 1.5))
                }
                .buttonStyle(.plain)
                Text("By continuing you agree to the Terms and Privacy Policy.")
                    .font(.caption).foregroundStyle(ZB.Palette.inkTertiary).multilineTextAlignment(.center)
                    .padding(.top, ZB.Space.xs)
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, ZB.Space.md)
        }
    }
}

private struct SetPinStep: View {
    var next: () -> Void
    @Environment(AppModel.self) private var model
    @State private var first = ""
    @State private var confirm = ""
    @State private var confirming = false
    @State private var mismatch = false
    @State private var shake: CGFloat = 0

    var body: some View {
        VStack(spacing: 0) {
            stageControl
                .padding(.top, 10)

            VStack(alignment: .leading, spacing: 8) {
                Text(confirming ? "Enter it again" : "Create a 4-digit UPI PIN")
                    .font(.system(.title, design: .rounded).weight(.bold)).foregroundStyle(ZB.Palette.ink)
                Text(confirming ? "Re-enter the same PIN to confirm it."
                                : "You'll enter it for every payment. Never share it, not even with Zenbit support.")
                    .font(.body).foregroundStyle(ZB.Palette.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 28)

            Spacer(minLength: 24)
            PinDots(count: confirming ? confirm.count : first.count, error: mismatch)
                .modifier(Shake(animatableData: shake))
            Text(mismatch ? "The two PINs didn't match. Create it again." : " ")
                .font(.footnote.weight(.medium)).foregroundStyle(ZB.Palette.danger)
                .padding(.top, 18).frame(height: 36, alignment: .top)
            Spacer(minLength: 24)

            Keypad(showsDot: false) { key in handle(key) }
                .padding(.bottom, 16)
        }
        .padding(.horizontal, ZB.Space.margin)
        .sensoryFeedback(.error, trigger: mismatch) { _, n in n }
        .animation(ZB.Motion.standard, value: confirming)
    }

    /// iOS-style segmented control: Create → Confirm.
    private var stageControl: some View {
        HStack(spacing: 4) {
            segment("Create PIN", active: !confirming, done: confirming)
            segment("Confirm PIN", active: confirming, done: false)
        }
        .padding(4)
        .background(ZB.Palette.surface, in: .capsule)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(confirming ? "Step 2 of 2: confirm PIN" : "Step 1 of 2: create PIN")
    }

    private func segment(_ title: String, active: Bool, done: Bool) -> some View {
        HStack(spacing: 6) {
            if done { Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)) }
            Text(title).font(.subheadline.weight(.semibold))
        }
        .foregroundStyle(active ? ZB.Palette.canvas : (done ? ZB.Palette.ink : ZB.Palette.inkTertiary))
        .frame(maxWidth: .infinity).frame(height: 40)
        .background(active ? ZB.Palette.ink : .clear, in: .capsule)
    }

    private func handle(_ key: KeypadKey) {
        mismatch = false
        switch key {
        case .digit(let d):
            if confirming {
                guard confirm.count < 4 else { return }
                confirm.append("\(d)")
                if confirm.count == 4 {
                    if confirm == first { model.pinVault.demoPIN = first; next() } else {
                        mismatch = true
                        withAnimation(.linear(duration: 0.4)) { shake += 1 }
                        first = ""; confirm = ""; confirming = false
                    }
                }
            } else {
                guard first.count < 4 else { return }
                first.append("\(d)")
                if first.count == 4 { withAnimation(ZB.Motion.standard) { confirming = true } }
            }
        case .delete:
            if confirming { _ = confirm.popLast() } else { _ = first.popLast() }
        case .dot: break
        }
    }
}

// MARK: - Done (peak–end: finish on a high)

/// One clear moment: a ring draws, fills with dark glass, a white tick draws itself, a soft ring pulses once –
/// then everything is still. Headline, UPI ID and a single button below.
private struct DoneStep: View {
    var finish: () -> Void
    @Environment(AppModel.self) private var model
    @State private var ring: CGFloat = 0
    @State private var filled = false
    @State private var tick: CGFloat = 0
    @State private var pulse = false
    @State private var textIn = false
    @State private var done = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let d: CGFloat = 132

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            ZStack {
                // one soft pulse after the tick lands
                Circle().stroke(ZB.Palette.ink.opacity(0.18), lineWidth: 2).frame(width: d, height: d)
                    .scaleEffect(pulse ? 1.65 : 1).opacity(pulse ? 0 : 0.9).opacity(done ? 1 : 0)
                // ring drawing itself
                Circle().trim(from: 0, to: ring).stroke(ZB.Palette.ink, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90)).frame(width: d, height: d).opacity(filled ? 0 : 1)
                // dark glass disc
                Circle()
                    .fill(LinearGradient(colors: [Color(hex: 0x3B3D47), Color(hex: 0x0B0C10)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .overlay(Circle().strokeBorder(LinearGradient(colors: [.white.opacity(0.7), .white.opacity(0.04), .white.opacity(0.3)],
                                                                  startPoint: .topLeading, endPoint: .bottomTrailing), lineWidth: 2))
                    .overlay(alignment: .topLeading) {
                        Ellipse().fill(.white.opacity(0.22)).frame(width: d * 0.5, height: d * 0.22).blur(radius: 8)
                            .rotationEffect(.degrees(-30)).offset(x: d * 0.12, y: d * 0.1)
                    }
                    .frame(width: d, height: d)
                    .shadow(color: .black.opacity(0.25), radius: 18, y: 10)
                    .scaleEffect(filled ? 1 : 0.7).opacity(filled ? 1 : 0)
                CheckShape().trim(from: 0, to: tick)
                    .stroke(Color.white, style: StrokeStyle(lineWidth: 9, lineCap: .round, lineJoin: .round))
                    .frame(width: 52, height: 40)
            }
            .frame(width: d * 1.7, height: d * 1.7)

            VStack(spacing: 12) {
                Text("You're all set,\n\(model.profile.asContact.firstName)!")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center).foregroundStyle(ZB.Palette.ink)
                Text("Your account is ready. You can now pay anyone, scan any QR and earn cashback on every payment.")
                    .font(.callout).foregroundStyle(ZB.Palette.inkSecondary).multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
                HStack(spacing: 8) {
                    Image(systemName: "at").font(.footnote.weight(.bold)).foregroundStyle(ZB.Palette.inkSecondary)
                    Text(model.profile.upiID).font(.system(.subheadline, design: .rounded).weight(.semibold)).foregroundStyle(ZB.Palette.ink)
                }
                .padding(.horizontal, 14).frame(height: 38)
                .background(ZB.Palette.surface, in: .capsule)
                .padding(.top, 6)
            }
            .opacity(textIn ? 1 : 0).offset(y: textIn ? 0 : 14)

            Spacer()
            Button("Start using Zenbit", action: finish).buttonStyle(.zbInk)
                .opacity(textIn ? 1 : 0)
        }
        .padding(.horizontal, ZB.Space.margin)
        .padding(.bottom, ZB.Space.md)
        .sensoryFeedback(.success, trigger: done)
        .task { await play() }
    }

    private func play() async {
        if reduceMotion { ring = 1; filled = true; tick = 1; textIn = true; done = true; return }
        withAnimation(.easeOut(duration: 0.65)) { ring = 1 }
        try? await Task.sleep(for: .milliseconds(620))
        withAnimation(.spring(response: 0.5, dampingFraction: 0.72)) { filled = true }
        try? await Task.sleep(for: .milliseconds(240))
        withAnimation(.easeOut(duration: 0.42)) { tick = 1 }
        try? await Task.sleep(for: .milliseconds(420))
        done = true
        Sounds.play(.success)
        withAnimation(.easeOut(duration: 0.9)) { pulse = true }
        withAnimation(.spring(response: 0.7, dampingFraction: 0.86).delay(0.1)) { textIn = true }
    }
}

struct StepTitle: View {
    let title: String
    let subtitle: String
    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.xs) {
            Text(title).font(.title.weight(.bold)).foregroundStyle(ZB.Palette.ink)
            Text(subtitle).font(.body).foregroundStyle(ZB.Palette.inkSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, ZB.Space.md)
    }
}

#Preview { OnboardingFlow().environment(AppModel()) }
