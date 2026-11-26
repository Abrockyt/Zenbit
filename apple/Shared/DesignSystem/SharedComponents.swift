import SwiftUI

// MARK: - Avatar

/// Generated avatar: soft hue gradient + initials (or a storefront for merchants).
struct AvatarView: View {
    let contact: Contact
    var size: CGFloat = 48
    var ring: Color? = nil

    var body: some View {
        if contact.isMerchant, let logo = Brand.merchant(contact.name) {
            MerchantLogo(asset: logo, size: size)
        } else if let photo = contact.photoAsset {
            Image(photo)
                .resizable()
                .scaledToFill()
                .frame(width: size, height: size)
                .clipShape(.circle)
                .overlay(Circle().strokeBorder(.black.opacity(0.06), lineWidth: 0.5))
                .overlay {
                    if let ring {
                        Circle().strokeBorder(ring, lineWidth: max(2, size * 0.05))
                            .padding(-max(3, size * 0.07))
                    }
                }
                .accessibilityHidden(true)
        } else {
            initials
        }
    }

    private var initials: some View {
        ZStack {
            Circle().fill(
                LinearGradient(colors: [Color(hue: contact.hue, saturation: 0.32, brightness: 0.98),
                                        Color(hue: contact.hue, saturation: 0.55, brightness: 0.82)],
                               startPoint: .topLeading, endPoint: .bottomTrailing))
            if contact.isMerchant {
                Image(systemName: "storefront.fill")
                    .font(.system(size: size * 0.38, weight: .semibold))
                    .foregroundStyle(.white)
            } else {
                Text(contact.initials)
                    .font(.system(size: size * 0.36, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
            }
        }
        .frame(width: size, height: size)
        .overlay {
            if let ring {
                Circle().strokeBorder(ring, lineWidth: max(2, size * 0.05))
                    .padding(-max(3, size * 0.07))
            }
        }
        .accessibilityHidden(true)
    }
}

// MARK: - 2.5D rupee coin (used for the "money flight" and on watchOS)

/// A coin drawn entirely in SwiftUI: edge thickness, metallic face, embossed ₹, specular sweep.
/// `spin` is in degrees around the Y axis.
struct CoinView: View {
    var size: CGFloat = 64
    var spin: Double = 0

    var body: some View {
        let edge = max(2, size * 0.08)
        ZStack {
            // Edge – stacked discs give a believable thickness when the coin turns.
            ForEach(0..<4, id: \.self) { i in
                Circle()
                    .fill(ZB.Palette.greenDeep.opacity(0.95))
                    .offset(x: CGFloat(i) * edge / 4 * sideSign)
            }
            Circle()
                .fill(AngularGradient(colors: [ZB.Palette.green, ZB.Palette.mint, ZB.Palette.green,
                                               ZB.Palette.greenDeep, ZB.Palette.green],
                                      center: .center))
            Circle()
                .strokeBorder(LinearGradient(colors: [.white.opacity(0.75), .clear, ZB.Palette.greenDeep.opacity(0.6)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing),
                              lineWidth: size * 0.06)
                .padding(size * 0.06)
            Text("₹")
                .font(.system(size: size * 0.48, weight: .bold, design: .rounded))
                .foregroundStyle(ZB.Palette.greenDeep)
                .shadow(color: .white.opacity(0.55), radius: 0, x: -size * 0.012, y: -size * 0.012)
            // Specular highlight
            Ellipse()
                .fill(LinearGradient(colors: [.white.opacity(0.7), .clear], startPoint: .top, endPoint: .bottom))
                .frame(width: size * 0.55, height: size * 0.28)
                .offset(y: -size * 0.22)
                .blendMode(.screen)
        }
        .frame(width: size, height: size)
        .rotation3DEffect(.degrees(spin), axis: (x: 0, y: 1, z: 0), perspective: 0.45)
        .shadow(color: ZB.Palette.greenDeep.opacity(0.35), radius: size * 0.12, y: size * 0.08)
        .accessibilityHidden(true)
    }

    private var sideSign: CGFloat {
        let s = sin(spin * .pi / 180)
        return s >= 0 ? -1 : 1
    }
}

// MARK: - Status badge (icon + text, never colour alone – Von Restorff / accessibility)

struct StatusBadge: View {
    let status: TxStatus
    var body: some View {
        Label(status.label, systemImage: status.symbol)
            .font(.caption.weight(.semibold))
            .foregroundStyle(status.tint)
            .labelStyle(.titleAndIcon)
            .imageScale(.small)
    }
}

// MARK: - Amount text with signed colouring

struct AmountLabel: View {
    let tx: Transaction
    var font: Font = .zbAmountRow

    var body: some View {
        Text(Money.format(tx.amount, sign: tx.direction == .received ? true : false))
            .font(font)
            .monospacedDigit()
            .foregroundStyle(color)
            .strikethrough(tx.status == .failed, color: ZB.Palette.inkTertiary)
    }

    /// HIG: one colour, one meaning. Green is reserved for *actions*, so incoming money is
    /// signalled by the "+" sign (like Apple Card/Wallet), not by colour.
    private var color: Color {
        tx.status == .failed ? ZB.Palette.inkTertiary : ZB.Palette.ink
    }
}

#Preview("Shared components") {
    VStack(spacing: 24) {
        HStack { ForEach(SampleData.contacts.prefix(4)) { AvatarView(contact: $0) } }
        CoinView(size: 96, spin: 25)
        StatusBadge(status: .pending)
        AmountLabel(tx: SampleData.transactions[2])
    }
    .padding()
}
