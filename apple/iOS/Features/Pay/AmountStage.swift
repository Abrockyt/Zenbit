import SwiftUI

/// Amount entry. Thumb-zone keypad, one primary action, inline validation that explains *why*.
struct AmountStage: View {
    let config: PayFlowConfig
    @Binding var raw: String
    @Binding var note: String
    @Binding var accountID: BankAccount.ID?
    @Binding var useLite: Bool
    let liteEligible: Bool
    let issue: AmountIssue?
    let ns: Namespace.ID
    var onClose: () -> Void
    var onContinue: () -> Void

    @Environment(AppModel.self) private var model
    @Environment(\.horizontalSizeClass) private var hSize
    @FocusState private var noteFocused: Bool
    @State private var rejectTick = 0
    @State private var tapTick = 0

    /// NPCI biometric UPI: Face ID instead of PIN for payments up to ₹5,000 (falls back to PIN).
    private var faceIDEligible: Bool { model.faceIDPayEnabled && amount > 0 && amount <= 5_000 && !useLite }

    private var amount: Decimal { Decimal(string: raw) ?? 0 }
    private var payee: Contact { config.payee }
    private var isPay: Bool { config.mode == .pay }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            ScrollView {
                VStack(spacing: ZB.Space.md) {
                    payeeHeader
                    amountDisplay
                    HStack(spacing: ZB.Space.xs) {
                        noteField.frame(minWidth: 130)
                        suggestion.fixedSize()
                    }
                    statusLine
                    if isPay { accountPicker }
                }
                .padding(.horizontal, ZB.Space.margin)
                .padding(.top, ZB.Space.sm)
                .padding(.bottom, ZB.Space.lg)
            }
            .scrollDismissesKeyboard(.interactively)
            .scrollBounceBehavior(.basedOnSize)

            VStack(spacing: ZB.Space.xs) {
                if !config.amountLocked && !noteFocused {
                    Keypad(keySize: 58, onKey: input).transition(.move(edge: .bottom).combined(with: .opacity))
                }
                Button(action: onContinue) {
                    HStack(spacing: ZB.Space.xs) {
                        if isPay && faceIDEligible {
                            Image(systemName: "faceid").font(.headline)
                        }
                        Text(amount > 0 ? "\(isPay ? "Pay" : "Request") \(Money.format(amount))" : (isPay ? "Pay" : "Request"))
                            .contentTransition(.numericText())
                    }
                }
                .buttonStyle(.zbPrimary)
                .disabled(amount <= 0 || issue != nil)
                .animation(ZB.Motion.snappy, value: raw)
                .sensoryFeedback(.impact(weight: .medium), trigger: tapTick)
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, ZB.Space.xs)
        }
        .frame(maxWidth: hSize == .regular ? 480 : .infinity)
        .animation(ZB.Motion.standard, value: noteFocused)
        .sensoryFeedback(.error, trigger: rejectTick)
    }

    // MARK: Pieces

    private var topBar: some View {
        HStack {
            GlassIconButton(systemName: "chevron.left", label: "Back", action: onClose)
            Spacer()
            Text(isPay ? "Pay" : "Request").font(.headline)
            Spacer()
            Menu {
                Button("Copy UPI ID", systemImage: "doc.on.doc") { Clipboard.copy(payee.upiID, label: "UPI ID", model: model) }
                Button("Report & block", systemImage: "hand.raised", role: .destructive) {
                    model.showToast("\(payee.firstName) blocked", symbol: "hand.raised.fill")
                    onClose()
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(ZB.Palette.ink)
                    .frame(width: ZB.minTarget, height: ZB.minTarget)
                    .glassEffect(.regular.interactive(), in: .circle)
            }
            .accessibilityLabel("More options")
        }
        .padding(.horizontal, ZB.Space.margin)
        .padding(.vertical, ZB.Space.xs)
    }

    private var payeeHeader: some View {
        VStack(spacing: 6) {
            AvatarView(contact: payee, size: 56)
                .matchedGeometryEffect(id: "avatar", in: ns)
            Text("\(isPay ? "Paying" : "Requesting from") \(payee.name)")
                .font(.title3.weight(.semibold))
                .multilineTextAlignment(.center)
            if payee.isOnUPI {
                // Trust cue every UPI app shows: the name registered with the bank.
                HStack(spacing: 5) {
                    Image(systemName: "checkmark.shield.fill").foregroundStyle(ZB.Palette.inkSecondary)
                    Text("\(payee.name.uppercased()) · \(payee.upiID)").lineLimit(1)
                }
                .font(.footnote)
                .foregroundStyle(ZB.Palette.inkSecondary)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var amountDisplay: some View {
        HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text("₹").font(.system(size: 36, weight: .semibold, design: .rounded))
                .foregroundStyle(amount > 0 ? ZB.Palette.ink : ZB.Palette.inkTertiary)
            Text(raw.isEmpty ? "0" : Money.groupedInput(raw))
                .font(.zbAmountHero)
                .monospacedDigit()
                .foregroundStyle(amount > 0 ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                .contentTransition(.numericText())
                .lineLimit(1)
                .minimumScaleFactor(0.5)
            if config.amountLocked {
                Image(systemName: "lock.fill").font(.title3).foregroundStyle(ZB.Palette.inkTertiary)
                    .accessibilityLabel("Amount set by merchant")
            }
        }
        .matchedGeometryEffect(id: "amount", in: ns)
        .animation(ZB.Motion.snappy, value: raw)
        .padding(.vertical, ZB.Space.xs)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Amount \(Money.format(amount))")
    }

    @ViewBuilder private var suggestion: some View {
        // AI nudge (labelled): repeat what you usually pay. One tap fills, nothing is sent.
        if isPay, raw.isEmpty, let last = model.lastPayment(to: payee) {
            Button {
                raw = "\(last.amount)"
                if note.isEmpty { note = last.note }
                Analytics.track("ai_suggestion_used", ["kind": "repeat_amount"])
            } label: {
                Label("Usually \(Money.format(last.amount))", systemImage: "sparkles")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(ZB.Palette.ink)
                    .padding(.horizontal, ZB.Space.md)
                    .frame(minHeight: 36)
                    .background(ZB.Palette.surface, in: .capsule)
            }
            .zbPressable()
            .accessibilityHint("Fills the amount you usually pay. You'll still confirm.")
        }
    }

    private var noteField: some View {
        TextField("Add a note", text: $note)
            .font(.subheadline)
            .multilineTextAlignment(.center)
            .focused($noteFocused)
            .submitLabel(.done)
            .onChange(of: note) { _, v in if v.count > 50 { note = String(v.prefix(50)) } }
            .padding(.horizontal, ZB.Space.md)
            .fixedSize(horizontal: true, vertical: false)
            .frame(minWidth: 130, minHeight: 36)
            .background(ZB.Palette.surface, in: .capsule)
    }

    @ViewBuilder private var statusLine: some View {
        if let issue {
            Label(issue.message, systemImage: "exclamationmark.circle.fill")
                .font(.footnote.weight(.medium))
                .foregroundStyle(ZB.Palette.danger)
                .transition(.opacity.combined(with: .scale(scale: 0.95)))
        }
    }

    private var accountPicker: some View {
        let items = (liteEligible || useLite ? [SourceItem(liteBalance: model.liteBalance)] : [])
            + model.accounts.map(SourceItem.init(account:))
        let selection = Binding<String>(
            get: { useLite && liteEligible ? "lite" : (accountID ?? model.primaryAccount.id).uuidString },
            set: { id in
                if id == "lite" { useLite = true } else { useLite = false; accountID = UUID(uuidString: id) }
            })
        return AccountSwitcher(items: items, selection: selection)
    }

    // MARK: Keypad rules (Postel's law – accept, normalise, bound)

    private func input(_ key: KeypadKey) {
        var next = raw
        switch key {
        case .digit(let d):
            if next == "0" { next = "" }
            next.append("\(d)")
        case .dot:
            guard !next.contains(".") else { return reject() }
            next = next.isEmpty ? "0." : next + "."
        case .delete:
            guard !next.isEmpty else { return }
            next.removeLast()
        }
        let parts = next.split(separator: ".", omittingEmptySubsequences: false)
        if parts.count == 2, parts[1].count > 2 { return reject() }   // paise: max 2 decimals
        if (parts.first?.count ?? 0) > 6 { return reject() }          // ≤ ₹9,99,999
        raw = next
    }

    private func reject() { rejectTick += 1 }
}
