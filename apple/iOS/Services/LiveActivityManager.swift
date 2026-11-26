import ActivityKit
import Foundation

/// Starts/updates the real Live Activity for a payment.
/// iOS shows an app's Live Activity in the Dynamic Island when you leave the app (home screen,
/// another app) and on the Lock Screen; while Zenbit is open, the in-app island morph plays instead.
@MainActor
enum LiveActivityManager {
    private static var current: Activity<PaymentAttributes>?

    static func start(payee: Contact, amount: Decimal) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("[LiveActivity] disabled by system / user setting")
            return
        }
        let initials = payee.name.split(separator: " ").compactMap(\.first).prefix(2).map(String.init).joined()
        let attrs = PaymentAttributes(payeeName: payee.name, payeeInitials: initials, payeeUPI: payee.upiID,
                                      payeePhoto: payee.photoAsset)
        let state = PaymentAttributes.ContentState(status: "sending", amountText: Money.format(amount), ref: "")
        do {
            current = try Activity.request(attributes: attrs, content: .init(state: state, staleDate: nil))
            print("[LiveActivity] started \(current?.id ?? "?")")
        } catch {
            print("[LiveActivity] request failed: \(error)")
        }
    }

    static func finish(status: TxStatus, amount: Decimal, ref: String) {
        guard let activity = current else { return }
        let s: String = switch status {
        case .success: "paid"
        case .failed: "failed"
        default: "processing"
        }
        let state = PaymentAttributes.ContentState(status: s, amountText: Money.format(amount), ref: ref)
        Task {
            await activity.update(.init(state: state, staleDate: nil))
            // Leave it visible briefly (so leaving the app shows the result), then clear it.
            await activity.end(.init(state: state, staleDate: nil), dismissalPolicy: .after(.now.addingTimeInterval(status == .pending ? 900 : 20)))
        }
        current = nil
    }
}
