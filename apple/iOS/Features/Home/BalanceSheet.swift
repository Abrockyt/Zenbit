import SwiftUI

/// Check balance: pick the account (swipe up/down), verify with UPI PIN or Face ID, see the balance.
/// Switching to another account locks again – each bank check is authorised separately (NPCI).
struct BalanceSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var selected = ""
    @State private var revealed: Set<String> = []
    @State private var shown: Decimal = 0

    private var account: BankAccount {
        model.accounts.first { $0.id.uuidString == selected } ?? model.primaryAccount
    }

    var body: some View {
        Group {
            if revealed.contains(selected) {
                result
                    .transition(.asymmetric(insertion: .opacity.combined(with: .scale(scale: 0.96)), removal: .opacity))
            } else {
                UPIPinPad(account: account, purpose: "Enter UPI PIN for \(account.bankName)",
                          switchAccount: $selected, allowFaceID: true,
                          onSuccess: {
                              withAnimation(ZB.Motion.hero) { _ = revealed.insert(selected) }
                              model.revealBalance()
                              Haptics.success()
                          },
                          onCancel: { dismiss() })
                    .id(selected)
                    .transition(.opacity)
            }
        }
        .animation(ZB.Motion.standard, value: selected)
        .onAppear { if selected.isEmpty { selected = model.primaryAccount.id.uuidString } }
        .presentationDetents([.large])
    }

    private var result: some View {
        VStack(spacing: ZB.Space.xl) {
            HStack {
                GlassIconButton(systemName: "chevron.left", label: "Back") { dismiss() }
                Spacer()
            }
            AccountSwitcher(items: model.accounts.map(SourceItem.init(account:)), selection: $selected, label: "Balance of")
            VStack(spacing: 6) {
                Text("Available balance").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                Text(Money.format(shown, decimals: true))
                    .font(.system(size: 46, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .contentTransition(.numericText(value: shown.doubleValue))
                Text("As of \(Date().formatted(date: .omitted, time: .shortened)) · \(account.ifsc)")
                    .font(.footnote).foregroundStyle(ZB.Palette.inkTertiary)
            }
            .padding(.top, ZB.Space.lg)
            Text("Tap the account above to check your other bank.")
                .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
            Spacer()
            Button("Done") { dismiss() }.buttonStyle(.zbInk)
        }
        .padding(ZB.Space.margin)
        .task(id: selected) {
            shown = 0
            let target = account.balance
            for k in 1...16 {
                try? await Task.sleep(for: .milliseconds(30))
                let e = 1 - pow(1 - Double(k) / 16, 3)
                withAnimation(.snappy(duration: 0.12)) { shown = (target * Decimal(e)).rounded(2) }
            }
            shown = target
        }
    }
}
