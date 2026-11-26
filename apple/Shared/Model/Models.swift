import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// MARK: - People

struct Contact: Identifiable, Hashable, Codable, Sendable {
    var id: UUID = UUID()
    var name: String
    var upiID: String
    var phone: String
    /// 0…1 hue used for the generated avatar so every person has a stable colour.
    var hue: Double
    var isFavorite: Bool = false
    /// Whether the person is on a UPI app (non-UPI contacts get an invite instead of Pay).
    var isOnUPI: Bool = true
    var bankName: String = "HDFC Bank"
    /// Merchants show a storefront glyph and fixed-amount QR behaviour.
    var isMerchant: Bool = false

    var firstName: String { name.split(separator: " ").first.map(String.init) ?? name }
    var initials: String {
        let parts = name.split(separator: " ")
        let letters = parts.prefix(2).compactMap { $0.first }
        return String(letters).uppercased()
    }
    /// Portrait asset ("p-riya") if one ships with the app; otherwise the initials avatar is used.
    var photoAsset: String? {
        guard !isMerchant else { return nil }
        let name = "p-" + firstName.lowercased()
        #if canImport(UIKit)
        return UIImage(named: name) != nil ? name : nil
        #else
        return nil
        #endif
    }

    var maskedPhone: String {
        guard phone.count >= 10 else { return phone }
        return "+91 ••••• " + phone.suffix(5)
    }
}

// MARK: - Money movement

enum TxDirection: String, Codable, Sendable { case sent, received }

enum TxStatus: String, Codable, Sendable, CaseIterable {
    case success, pending, failed, refunded

    var label: String {
        switch self {
        case .success: "Completed"
        case .pending: "Processing"
        case .failed: "Failed"
        case .refunded: "Refunded"
        }
    }
    var symbol: String {
        switch self {
        case .success: "checkmark.circle.fill"
        case .pending: "clock.fill"
        case .failed: "exclamationmark.circle.fill"
        case .refunded: "arrow.uturn.backward.circle.fill"
        }
    }
    var tint: Color {
        switch self {
        case .success: ZB.Palette.greenInk
        case .pending: ZB.Palette.warning
        case .failed: ZB.Palette.danger
        case .refunded: ZB.Palette.inkSecondary
        }
    }
}

enum TxCategory: String, Codable, Sendable, CaseIterable, Identifiable {
    case food, groceries, shopping, transport, bills, rent, entertainment, health, transfer

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .food: "fork.knife"
        case .groceries: "basket.fill"
        case .shopping: "bag.fill"
        case .transport: "car.fill"
        case .bills: "bolt.fill"
        case .rent: "house.fill"
        case .entertainment: "film.fill"
        case .health: "cross.case.fill"
        case .transfer: "arrow.left.arrow.right"
        }
    }
}

struct Transaction: Identifiable, Hashable, Codable, Sendable {
    var id: UUID = UUID()
    var counterparty: Contact
    var amount: Decimal
    var direction: TxDirection
    var status: TxStatus
    var date: Date
    var note: String = ""
    var category: TxCategory = .transfer
    /// 12-digit NPCI reference (what support teams ask for).
    var upiRef: String
    /// App-level transaction id.
    var txnID: String
    var accountMasked: String = "HDFC Bank •• 4821"
    var failureReason: String? = nil
    /// Machine-readable reason, e.g. "insufficient_funds".
    var failureCode: String? = nil

    var signedAmount: Decimal { direction == .sent ? -amount : amount }
}

struct BankAccount: Identifiable, Hashable, Codable, Sendable {
    var id: UUID = UUID()
    var bankName: String
    var last4: String
    var kind: String = "Savings"
    var isPrimary: Bool = false
    var balance: Decimal
    var ifsc: String

    var masked: String { "\(bankName) •• \(last4)" }
    var shortName: String {
        bankName.replacingOccurrences(of: " Bank", with: "")
    }
}

struct UserProfile: Codable, Sendable {
    var name: String
    var phone: String
    var upiID: String
    var email: String
    var kycVerified: Bool
    var hue: Double

    var asContact: Contact {
        Contact(name: name, upiID: upiID, phone: phone, hue: hue)
    }
}

/// Incoming "collect" request. Paying one *debits* you – the classic UPI scam pattern is a
/// request disguised as a prize ("enter PIN to receive"), so suspicious ones are flagged.
struct MoneyRequest: Identifiable, Hashable, Sendable {
    var id: UUID = UUID()
    var from: Contact
    var amount: Decimal
    var note: String
    var date: Date
    var isSuspicious = false
}

// MARK: - Reference generators

enum Ref {
    static func upi() -> String {
        String((0..<12).map { _ in "0123456789".randomElement()! })
    }
    static func txn() -> String {
        "ZB" + String((0..<14).map { _ in "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789".randomElement()! })
    }
}

// MARK: - Rewards (super.money-style)

enum RewardKind: String, Codable, Sendable {
    case cashback, referral, scratch, milestone, voucher
    var symbol: String {
        switch self {
        case .cashback: "indianrupeesign.circle.fill"
        case .referral: "person.2.fill"
        case .scratch: "sparkles.rectangle.stack.fill"
        case .milestone: "flag.checkered"
        case .voucher: "ticket.fill"
        }
    }
}

/// One line in the rewards history: what was earned and *why* (source is always shown).
struct Reward: Identifiable, Hashable, Sendable {
    var id = UUID()
    var kind: RewardKind
    var title: String
    var source: String
    var amount: Decimal
    var date: Date
}

/// A surprise reward: cash, a coupon, or nothing this time ("better luck next time").
struct ScratchCard: Identifiable, Hashable, Sendable {
    var id = UUID()
    var amount: Decimal
    var from: String
    var revealed = false
    var coupon: Voucher? = nil
    /// Partner brand shown on the card ("Zomato", "BookMyShow"…).
    var brand: String = ""
    var isCash: Bool { amount > 0 }
    var isMiss: Bool { amount == 0 && coupon == nil }
}

struct Voucher: Identifiable, Hashable, Sendable {
    var id = UUID()
    var brand: String
    var offer: String
    var code: String
    var symbol: String
    var hue: Double
    var expires: Date
    /// Asset name of the brand's logo, if we ship it.
    var logo: String? { Brand.merchant(brand) }
    /// Ticket colour (the brand's own).
    var tint: Color { Brand.tint(brand) }
}

struct EarnTask: Identifiable, Hashable, Sendable {
    var id = UUID()
    var title: String
    var detail: String
    var reward: String
    var symbol: String
    var progress: Double // 0…1
}
