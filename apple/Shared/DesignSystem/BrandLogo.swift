import SwiftUI

/// Real bank / merchant logos (see `Brands-CREDITS.md`) used for realism in this concept app.
enum Brand {
    /// Asset name for a bank, or nil when we don't ship its logo.
    static func bank(_ name: String) -> String? {
        let n = name.lowercased()
        if n.contains("hdfc") { return "brand-hdfc" }
        if n.contains("state bank") || n.contains("sbi") { return "brand-sbi" }
        if n.contains("icici") { return "brand-icici" }
        if n.contains("axis") { return "brand-axis" }
        if n.contains("punjab") || n.contains("pnb") { return "brand-pnb" }
        if n.contains("idfc") { return "brand-idfc" }
        if n.contains("canara") { return "brand-canara" }
        if n.contains("yes bank") { return "brand-yes" }
        return nil
    }

    /// Asset name for a merchant / brand, or nil.
    static func merchant(_ name: String) -> String? {
        let n = name.lowercased()
        for (key, asset) in [("zomato", "brand-zomato"), ("swiggy", "brand-swiggy"), ("uber", "brand-uber"),
                             ("bookmyshow", "brand-bookmyshow"), ("bigbasket", "brand-bigbasket"), ("amazon", "brand-amazon"),
                             ("airtel", "brand-airtel"), ("jio", "brand-jio"), ("spotify", "brand-spotify"),
                             ("blinkit", "brand-blinkit"), ("phonepe", "brand-phonepe"), ("flipkart", "brand-flipkart")] where n.contains(key) { return asset }
        return nil
    }

    /// The brand's own colour, used for coupon tickets and reward cards.
    static func tint(_ name: String) -> Color {
        let n = name.lowercased()
        for (key, hex) in [("zomato", 0xE23744), ("swiggy", 0xFC8019), ("bookmyshow", 0xC4242B), ("uber", 0x0B0B0B),
                           ("spotify", 0x169C46), ("amazon", 0x232F3E), ("flipkart", 0x2874F0), ("bigbasket", 0x6FA81E),
                           ("airtel", 0xE40000), ("jio", 0x0F3CC9), ("blinkit", 0xF8CB46)] where n.contains(key) { return Color(hex: UInt32(hex)) }
        return Color(hex: 0x2B59FF)
    }
}

/// A bank's logo on a white chip (wordmarks are wide, so the chip is 1.6× wider than tall).
struct BankLogo: View {
    let bankName: String
    var height: CGFloat = 36

    var body: some View {
        let asset = Brand.bank(bankName)
        ZStack {
            RoundedRectangle(cornerRadius: height * 0.27, style: .continuous).fill(Color.white)
            if let asset {
                Image(asset).resizable().scaledToFit()
                    .padding(.horizontal, height * 0.1).padding(.vertical, height * 0.2)
            } else {
                Image(systemName: "building.columns.fill")
                    .font(.system(size: height * 0.4)).foregroundStyle(Color(white: 0.45))
            }
        }
        .frame(width: height * 1.6, height: height)
        .overlay(RoundedRectangle(cornerRadius: height * 0.27, style: .continuous).strokeBorder(Color.black.opacity(0.09), lineWidth: 0.6))
        .accessibilityHidden(true)
    }
}

/// A merchant's logo as an app-icon tile: brand-colour tile with the white mark (Zomato, Swiggy, BookMyShow, BigBasket, Uber),
/// the brand's own round / square icon (Jio, Spotify, Blinkit) or a white tile (Amazon, Airtel).
struct MerchantLogo: View {
    let asset: String
    var size: CGFloat = 44

    private var tile: Color? {
        switch asset {
        case "brand-zomato": Color(hex: 0xE23744)
        case "brand-swiggy": Color(hex: 0xFC8019)
        case "brand-bookmyshow": Color(hex: 0xC4242B)
        case "brand-bigbasket": Color(hex: 0x84C225)
        case "brand-uber": Color.black
        default: nil
        }
    }
    private var fullBleed: Bool { ["brand-jio", "brand-spotify", "brand-blinkit"].contains(asset) }

    var body: some View {
        let r = size * 0.3
        Group {
            if let tile {
                Image(asset).resizable().renderingMode(.template).scaledToFit().foregroundStyle(.white)
                    .padding(size * 0.17)
                    .frame(width: size, height: size)
                    .background(tile, in: .rect(cornerRadius: r, style: .continuous))
            } else if fullBleed {
                Image(asset).resizable().scaledToFill().frame(width: size, height: size)
                    .clipShape(.rect(cornerRadius: asset == "brand-blinkit" ? r : size / 2, style: .continuous))
            } else {
                Image(asset).resizable().scaledToFit().padding(size * 0.14)
                    .frame(width: size, height: size)
                    .background(Color.white, in: .rect(cornerRadius: r, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: r, style: .continuous).strokeBorder(Color.black.opacity(0.09), lineWidth: 0.6))
            }
        }
        .accessibilityHidden(true)
    }
}
