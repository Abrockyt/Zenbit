import SwiftUI

/// One transaction line. Information order follows how people scan a statement:
/// who → what/when → how much → state (serial-position: name first, amount last).
struct TransactionRow: View {
    let tx: Transaction

    var body: some View {
        HStack(spacing: ZB.Space.sm) {
            AvatarView(contact: tx.counterparty, size: 44)
            VStack(alignment: .leading, spacing: 2) {
                Text(tx.counterparty.name)
                    .font(.body.weight(.medium))
                    .foregroundStyle(ZB.Palette.ink)
                    .lineLimit(1)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .lineLimit(1)
            }
            Spacer(minLength: ZB.Space.xs)
            VStack(alignment: .trailing, spacing: 2) {
                AmountLabel(tx: tx)
                if tx.status != .success {
                    StatusBadge(status: tx.status)
                }
            }
        }
        .padding(.vertical, ZB.Space.xs)
        .contentShape(.rect)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(a11y)
    }

    private var subtitle: String {
        let note = tx.note.isEmpty ? (tx.direction == .sent ? "Paid" : "Received") : tx.note
        return "\(note) · \(tx.date.zbTime)"
    }

    private var a11y: String {
        "\(tx.direction == .sent ? "Paid" : "Received") \(Money.format(tx.amount)) \(tx.direction == .sent ? "to" : "from") \(tx.counterparty.name), \(tx.status.label), \(tx.date.zbRelativeDay) \(tx.date.zbTime)"
    }
}

/// Person bubble used in grids.
struct PersonCell: View {
    let contact: Contact
    var body: some View {
        VStack(spacing: 6) {
            AvatarView(contact: contact, size: 56)
            Text(contact.firstName)
                .font(.footnote.weight(.medium))
                .foregroundStyle(ZB.Palette.ink)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .contentShape(.rect)
    }
}
