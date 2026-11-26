import SwiftUI

/// UPI PIN entry used for payments and balance checks.
/// Edge cases: wrong PIN (shake + attempts left), lockout with live countdown, forgot PIN.
struct UPIPinPad: View {
    @Environment(AppModel.self) private var model
    var amount: Decimal?
    var payee: Contact?
    let account: BankAccount
    var purpose = "Enter UPI PIN"
    /// When set, shows the vertical account switcher (balance check).
    var switchAccount: Binding<String>? = nil
    /// Offer Face ID as an alternative to typing the PIN.
    var allowFaceID = false
    var onSuccess: () -> Void
    var onCancel: () -> Void

    @State private var pin = ""
    @State private var errorText: String?
    @State private var shake: CGFloat = 0
    @State private var errorTick = 0
    @State private var verifying = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                GlassIconButton(systemName: "chevron.left", label: "Back", action: onCancel)
                Spacer()
                if switchAccount == nil {
                    HStack(spacing: 8) {
                        BankLogo(bankName: account.bankName, height: 26)
                        Text(account.shortName).font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.ink)
                    }
                }
                Spacer()
                Image(systemName: "lock.shield.fill")
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .frame(width: ZB.minTarget)
                    .accessibilityLabel("Secured by UPI")
            }
            .padding(.horizontal, ZB.Space.margin)

            if let payee {
                HStack(spacing: ZB.Space.sm) {
                    AvatarView(contact: payee, size: 40)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("To \(payee.name)").font(.subheadline.weight(.semibold))
                        Text(payee.upiID).font(.caption).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                    Spacer()
                    if let amount {
                        Text(Money.format(amount)).font(.zbAmount).monospacedDigit()
                    }
                }
                .padding(ZB.Space.md)
                .zbCard(radius: ZB.Radius.md, fill: ZB.Palette.surface)
                .padding(.horizontal, ZB.Space.margin)
                .padding(.top, ZB.Space.sm)
            }

            if let switchAccount {
                AccountSwitcher(items: model.accounts.map(SourceItem.init(account:)), selection: switchAccount, label: "Check balance of")
                    .padding(.horizontal, ZB.Space.margin)
                    .padding(.top, ZB.Space.sm)
            }

            Spacer(minLength: ZB.Space.lg)

            VStack(spacing: ZB.Space.md) {
                Text(purpose).font(.title3.weight(.semibold))
                PinDots(count: pin.count, error: errorText != nil)
                    .modifier(Shake(animatableData: shake))
                TimelineView(.periodic(from: .now, by: 1)) { ctx in
                    if let until = model.pinVault.lockedUntil, until > ctx.date {
                        let s = Int(until.timeIntervalSince(ctx.date).rounded(.up))
                        Text("Too many wrong attempts. Try again in 0:\(String(format: "%02d", s)).")
                            .font(.footnote).foregroundStyle(ZB.Palette.danger)
                    } else if let errorText {
                        Text(errorText).font(.footnote).foregroundStyle(ZB.Palette.danger)
                    } else if verifying {
                        ZSpinner(size: 20)
                    } else {
                        Text("Demo PIN: \(model.pinVault.demoPIN)")
                            .font(.footnote).foregroundStyle(ZB.Palette.inkTertiary)
                    }
                }
                .frame(minHeight: 20)
                .multilineTextAlignment(.center)
            }
            .padding(.horizontal, ZB.Space.margin)

            Spacer(minLength: ZB.Space.lg)

            Keypad(showsDot: false, onKey: handle)
                .padding(.horizontal, ZB.Space.md)
                .disabled(model.pinVault.isLocked || verifying)
                .opacity(model.pinVault.isLocked ? 0.4 : 1)

            if allowFaceID {
                Button {
                    Task { if await Biometrics.authenticate(reason: purpose) { onSuccess() } }
                } label: {
                    Label("Use Face ID instead", systemImage: "faceid")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ZB.Palette.ink)
                        .padding(.horizontal, ZB.Space.md)
                        .frame(minHeight: 40)
                        .background(ZB.Palette.surface, in: .capsule)
                }
                .buttonStyle(.plain)
            }

            Button("Forgot UPI PIN?") {
                model.showToast("Reset needs your debit card – opening soon", symbol: "creditcard.fill")
            }
            .font(.footnote.weight(.semibold))
            .foregroundStyle(ZB.Palette.inkSecondary)
            .frame(minHeight: ZB.minTarget)
        }
        .padding(.vertical, ZB.Space.xs)
        .sensoryFeedback(.error, trigger: errorTick)
    }

    private func handle(_ key: KeypadKey) {
        switch key {
        case .digit(let d):
            guard pin.count < Limits.pinLength else { return }
            errorText = nil
            pin.append("\(d)")
            if pin.count == Limits.pinLength { submit() }
        case .delete:
            _ = pin.popLast()
        case .dot: break
        }
    }

    private func submit() {
        verifying = true
        Task {
            try? await Task.sleep(for: .milliseconds(280)) // Doherty: feedback < 400 ms
            verifying = false
            switch model.pinVault.verify(pin) {
            case .ok:
                Analytics.track("pin_ok")
                onSuccess()
            case .wrong(let left):
                fail("Incorrect PIN. \(left) attempt\(left == 1 ? "" : "s") left.")
            case .locked:
                fail(nil)
            }
        }
    }

    private func fail(_ message: String?) {
        Analytics.track("pin_wrong")
        errorText = message
        errorTick += 1
        withAnimation(.linear(duration: 0.4)) { shake += 1 }
        pin = ""
    }
}
