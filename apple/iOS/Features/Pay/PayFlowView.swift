import SwiftUI
import LocalAuthentication

/// Pay / request state machine: amount → (warnings) → UPI PIN → journey animation → receipt.
/// One screen with stage transitions (rather than pushed pages) so the payee avatar and amount
/// can morph continuously between stages – people never lose their place.
struct PayFlowView: View {
    let config: PayFlowConfig
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    enum Stage: Equatable { case amount, pin, journey }

    @State private var stage: Stage = .amount
    @State private var raw = ""
    @State private var note = ""
    @State private var accountID: BankAccount.ID?
    @State private var useLite = false
    @State private var warnings: [PaymentWarning] = []
    @State private var showWarnings = false
    @State private var outcome: PaymentOutcome?
    @State private var attempt = 0
    @Namespace private var ns

    private var amount: Decimal { Decimal(string: raw) ?? 0 }
    private var account: BankAccount {
        model.accounts.first { $0.id == accountID } ?? model.primaryAccount
    }
    private var liteEligible: Bool {
        config.mode == .pay && model.upiLiteEnabled && amount > 0 && amount <= Limits.liteMaxPerTxn
            && amount <= model.liteBalance
    }
    private var issue: AmountIssue? {
        model.validator(for: account).issue(for: amount, payee: config.payee, mode: config.mode)
    }

    var body: some View {
        ZStack {
            ZB.Palette.canvas.ignoresSafeArea()
            switch stage {
            case .amount:
                AmountStage(config: config, raw: $raw, note: $note, accountID: $accountID, useLite: $useLite,
                            liteEligible: liteEligible, issue: issue, ns: ns,
                            onClose: { dismiss() }, onContinue: proceed)
                    .transition(.asymmetric(insertion: .opacity, removal: .move(edge: .leading).combined(with: .opacity)))
            case .pin:
                UPIPinPad(amount: amount, payee: config.payee, account: account,
                          allowFaceID: model.faceIDPayEnabled && amount <= 5_000,
                          onSuccess: { send() },
                          onCancel: { withAnimation(ZB.Motion.standard) { stage = .amount } })
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            case .journey:
                PaymentJourneyView(payee: config.payee, amount: amount, note: note, outcome: outcome,
                                   onDone: finish, onRetry: retry)
                    .id(attempt)
                    .transition(.opacity)
            }
        }
        .animation(ZB.Motion.standard, value: stage)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .sheet(isPresented: $showWarnings) {
            WarningSheet(warnings: warnings, payee: config.payee, amount: amount,
                         onContinue: { showWarnings = false; toPinOrSend() },
                         onCancel: { showWarnings = false })
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
        .onAppear(perform: setUp)
        .interactiveDismissDisabled(stage == .journey && outcome == nil) // never lose an in-flight payment
    }

    // MARK: Flow

    private func setUp() {
        if let p = config.presetAmount { raw = "\(p)" }
        note = config.note
        accountID = model.primaryAccount.id
        #if DEBUG
        switch config.debugStage {
        case "pin": stage = .pin
        case "success", "failure", "pending":
            let mode: SimulationMode = config.debugStage == "success" ? .alwaysSucceed
                : config.debugStage == "failure" ? .bankDown : .pending
            model.simulation = mode
            send()
        default: break
        }
        #endif
    }

    private func proceed() {
        if config.mode == .request {
            model.recordRequest(to: config.payee, amount: amount, note: note)
            dismiss()
            return
        }
        warnings = model.validator(for: account).warnings(for: amount, payee: config.payee)
        Analytics.track("amount_confirmed", ["warnings": "\(warnings.count)", "lite": "\(useLite && liteEligible)"])
        if warnings.isEmpty { toPinOrSend() } else { showWarnings = true }
    }

    private func toPinOrSend() {
        // UPI Lite: small payments skip the PIN (NPCI rule) – fewer steps where risk is low.
        if useLite && liteEligible { send(); return }
        // NPCI on-device biometrics (≤ ₹5,000): Face ID instead of the PIN; any failure → PIN.
        if model.faceIDPayEnabled && amount <= 5_000 {
            Task {
                if await Biometrics.authenticate(reason: "Pay \(Money.format(amount)) to \(config.payee.name)") { send() }
                else { stage = .pin }
            }
            return
        }
        stage = .pin
    }

    private func send() {
        outcome = nil
        stage = .journey
        let req = PaymentRequest(payee: config.payee, amount: amount, note: note, account: account,
                                 viaLite: useLite && liteEligible)
        let network = SimulatedPaymentNetwork(mode: model.simulation)
        let acct = account.id
        Task {
            let result = await network.execute(req)
            model.record(result, from: acct, viaLite: req.viaLite)
            outcome = result
            Analytics.track("payment_result", ["status": result.transaction.status.rawValue])
            if case .pending(let tx) = result { model.resolveLater(tx) }
        }
    }

    private func retry() {
        attempt += 1
        stage = .pin
    }

    private func finish() {
        model.selectedTab = .home
        let paid = outcome?.transaction
        dismiss()
        if let paid, paid.status == .success {
            Task {
                try? await Task.sleep(for: .milliseconds(450))
                model.showToast("\(Money.format(paid.amount)) sent to \(paid.counterparty.firstName)", symbol: "checkmark.circle.fill")
            }
        }
    }
}

// MARK: - Soft warnings (duplicate / first-time large amount)

private struct WarningSheet: View {
    let warnings: [PaymentWarning]
    let payee: Contact
    let amount: Decimal
    var onContinue: () -> Void
    var onCancel: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.lg) {
            Image(systemName: "exclamationmark.shield.fill")
                .font(.system(size: 36))
                .foregroundStyle(ZB.Palette.warning)
            ForEach(warnings) { w in
                switch w {
                case .duplicate(let tx):
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Pay \(Money.format(amount)) again?").font(.title2.weight(.bold))
                        Text("You paid \(payee.firstName) the same amount \(tx.date.formatted(.relative(presentation: .named))). Make sure this isn't a duplicate.")
                            .foregroundStyle(ZB.Palette.inkSecondary)
                    }
                case .firstTimeLarge:
                    VStack(alignment: .leading, spacing: 6) {
                        Text("First payment to \(payee.firstName)").font(.title2.weight(.bold))
                        Text("You're sending \(Money.format(amount)) to someone you haven't paid before. Check the banking name and UPI ID. Zenbit will never ask you to pay to *receive* money.")
                            .foregroundStyle(ZB.Palette.inkSecondary)
                    }
                }
            }
            Spacer()
            VStack(spacing: ZB.Space.xs) {
                Button("Continue to pay", action: onContinue).buttonStyle(.zbPrimary)
                Button("Cancel", action: onCancel).buttonStyle(.zbSecondary)
            }
        }
        .padding(ZB.Space.margin)
        .padding(.top, ZB.Space.md)
        .sensoryFeedback(.warning, trigger: true)
    }
}

// MARK: - Pending resolution (bank callback simulation)

extension AppModel {
    /// A pending payment settles later (here: 15 s) – mirrors the bank's async callback.
    func resolveLater(_ tx: Transaction) {
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(15))
            guard let i = transactions.firstIndex(where: { $0.id == tx.id }), transactions[i].status == .pending else { return }
            withAnimation(ZB.Motion.standard) {
                transactions[i].status = .success
                transactions[i].failureReason = nil
            }
            Haptics.success()
            showToast("\(Money.format(tx.amount)) to \(tx.counterparty.firstName) completed")
        }
    }
}
