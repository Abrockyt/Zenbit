import ActivityKit
import Foundation

/// Live Activity for a payment in flight – shown in the real Dynamic Island and on the Lock Screen.
struct PaymentAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// "sending" | "paid" | "processing" | "failed"
        var status: String
        var amountText: String
        var ref: String
    }
    var payeeName: String
    var payeeInitials: String
    var payeeUPI: String
}
