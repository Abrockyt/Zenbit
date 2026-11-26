import Foundation

/// Indian-rupee formatting with lakh/crore grouping (₹1,23,456).
enum Money {
    static let locale = Locale(identifier: "en_IN")

    static func format(_ value: Decimal, decimals: Bool = false, sign: Bool = false) -> String {
        // Whole rupees show no paise; any fractional amount always shows two digits (₹24,308.50).
        let hasPaise = value != value.rounded(0)
        let style = Decimal.FormatStyle.Currency(code: "INR", locale: locale)
            .precision(decimals || hasPaise ? .fractionLength(2) : .fractionLength(0))
        let body = abs(value).formatted(style)
        guard sign else { return value < 0 ? "−" + body : body }
        return (value < 0 ? "−" : "+") + body
    }

    /// Short form for charts / watch: ₹1.2K, ₹3.4L.
    static func compact(_ value: Decimal) -> String {
        let d = NSDecimalNumber(decimal: abs(value)).doubleValue
        switch d {
        case 1_00_00_000...: return String(format: "₹%.1fCr", d / 1_00_00_000)
        case 1_00_000...: return String(format: "₹%.1fL", d / 1_00_000)
        case 1_000...: return String(format: "₹%.1fK", d / 1_000)
        default: return "₹" + String(Int(d))
        }
    }

    /// Groups the integer digits of a raw keypad string Indian-style, keeping a trailing "." and decimals.
    static func groupedInput(_ raw: String) -> String {
        let parts = raw.split(separator: ".", omittingEmptySubsequences: false)
        let intPart = String(parts.first ?? "0")
        var digits = Array(intPart.isEmpty ? "0" : intPart)
        var out = ""
        if digits.count > 3 {
            let last3 = String(digits.suffix(3))
            digits.removeLast(3)
            var head = ""
            for (i, c) in digits.reversed().enumerated() {
                if i > 0 && i % 2 == 0 { head = "," + head }
                head = String(c) + head
            }
            out = head + "," + last3
        } else {
            out = String(digits)
        }
        if parts.count > 1 { out += "." + parts[1] }
        return out
    }
}

extension Decimal {
    var doubleValue: Double { NSDecimalNumber(decimal: self).doubleValue }

    func rounded(_ scale: Int) -> Decimal {
        var x = self, r = Decimal()
        NSDecimalRound(&r, &x, scale, .plain)
        return r
    }
}

/// Builds and parses `upi://pay` deep links (the format inside every UPI QR code).
struct UPILink: Equatable {
    var payeeVPA: String
    var payeeName: String
    var amount: Decimal?
    var note: String?

    var url: URL {
        var c = URLComponents()
        c.scheme = "upi"
        c.host = "pay"
        var items = [URLQueryItem(name: "pa", value: payeeVPA),
                     URLQueryItem(name: "pn", value: payeeName),
                     URLQueryItem(name: "cu", value: "INR")]
        if let amount { items.append(URLQueryItem(name: "am", value: "\(amount)")) }
        if let note, !note.isEmpty { items.append(URLQueryItem(name: "tn", value: note)) }
        c.queryItems = items
        return c.url!
    }

    /// Postel's law: be liberal in what we accept (case, whitespace, missing fields).
    init?(string: String) {
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let c = URLComponents(string: trimmed),
              c.scheme?.lowercased() == "upi",
              c.host?.lowercased() == "pay" else { return nil }
        func value(_ key: String) -> String? {
            c.queryItems?.first { $0.name.lowercased() == key }?.value?
                .trimmingCharacters(in: .whitespaces)
        }
        guard let pa = value("pa"), UPIValidation.isValidVPA(pa) else { return nil }
        payeeVPA = pa.lowercased()
        payeeName = value("pn") ?? pa
        amount = value("am").flatMap { Decimal(string: $0) }.flatMap { $0 > 0 ? $0 : nil }
        note = value("tn")
    }

    init(payeeVPA: String, payeeName: String, amount: Decimal? = nil, note: String? = nil) {
        self.payeeVPA = payeeVPA
        self.payeeName = payeeName
        self.amount = amount
        self.note = note
    }
}

enum UPIValidation {
    static func isValidVPA(_ s: String) -> Bool {
        s.range(of: #"^[A-Za-z0-9.\-_]{2,256}@[A-Za-z]{2,64}$"#, options: .regularExpression) != nil
    }
    /// Indian mobile: 10 digits starting 6–9. Accepts +91 / 0 prefixes and spaces.
    static func normalizedPhone(_ s: String) -> String? {
        var digits = s.filter(\.isNumber)
        if digits.count == 12, digits.hasPrefix("91") { digits.removeFirst(2) }
        if digits.count == 11, digits.hasPrefix("0") { digits.removeFirst() }
        guard digits.count == 10, let f = digits.first, "6789".contains(f) else { return nil }
        return digits
    }
}
