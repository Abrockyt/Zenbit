import SwiftUI

/// One "pay from / check" source: a bank account or UPI Lite.
struct SourceItem: Identifiable, Equatable {
    let id: String
    let title: String
    let subtitle: String
    let monogram: String
    let hue: Double
    var bankName = ""
    var isLite = false

    init(account a: BankAccount) {
        id = a.id.uuidString
        title = "\(a.bankName) •• \(a.last4)"
        bankName = a.bankName
        subtitle = a.isPrimary ? "\(a.kind) · Primary" : a.kind
        monogram = a.bankName.split(separator: " ").compactMap(\.first).prefix(2).map(String.init).joined()
        hue = Double(a.bankName.unicodeScalars.reduce(0) { $0 + Int($1.value) } % 100) / 100
    }

    init(liteBalance: Decimal) {
        id = "lite"
        title = "UPI Lite"
        subtitle = "\(Money.format(liteBalance)) · no PIN under ₹500"
        monogram = "⚡︎"
        hue = 0.4
        isLite = true
    }
}

/// iOS-native source picker (Apple Pay / Wallet pattern): a grouped row showing the current
/// account; tapping opens the system menu with every account and a checkmark on the current one.
/// The ⌃⌄ glyph is the standard iOS hint that there are more choices.
struct AccountSwitcher: View {
    let items: [SourceItem]
    @Binding var selection: String
    var label = "Pay from"

    private var current: SourceItem { items.first { $0.id == selection } ?? items[0] }

    var body: some View {
        Menu {
            Picker(label, selection: $selection) {
                ForEach(items) { item in
                    Text("\(item.title)\n\(item.subtitle)").tag(item.id)
                }
            }
            .pickerStyle(.inline)
        } label: {
            HStack(spacing: 10) {
                BankMark(item: current, size: 34)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).font(.caption2.weight(.medium)).foregroundStyle(ZB.Palette.inkSecondary)
                    Text(current.title).font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.ink)
                        .lineLimit(1).minimumScaleFactor(0.85)
                        .contentTransition(.opacity)
                }
                Spacer(minLength: 6)
                if items.count > 1 {
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ZB.Palette.inkTertiary)
                }
            }
            .padding(.horizontal, 12)
            .frame(height: 56)
            .background(ZB.Palette.surface, in: .rect(cornerRadius: 16, style: .continuous))
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .animation(ZB.Motion.snappy, value: selection)
        .sensoryFeedback(.selection, trigger: selection)
        .accessibilityLabel("\(label): \(current.title)")
        .accessibilityHint(items.count > 1 ? "Double-tap to choose another account" : "")
    }
}

/// Bank monogram tile (stand-in for the bank's logo).
struct BankMark: View {
    let item: SourceItem
    var size: CGFloat = 36
    var body: some View {
        if item.isLite {
            Text(item.monogram)
                .font(.system(size: size * 0.4, weight: .bold, design: .rounded)).foregroundStyle(.black)
                .frame(width: size, height: size)
                .background(Color(hex: 0xFFD54A), in: .rect(cornerRadius: size * 0.28, style: .continuous))
        } else {
            BankLogo(bankName: item.bankName, height: size)
        }
    }
}
