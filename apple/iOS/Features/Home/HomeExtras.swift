import SwiftUI

// MARK: - "3D" product art from SF Symbols (layered depth, gloss, floor shadow) – tiny, themable, no assets

struct AdArt: View {
    let symbol: String
    let colors: [Color]
    var size: CGFloat = 70
    var bg: [Color] = [Color(hex: 0x16181C), Color(hex: 0x16181C)]

    var body: some View {
        ZStack {
            LinearGradient(colors: bg, startPoint: .top, endPoint: .bottom)
            Image(systemName: symbol)
                .font(.system(size: size, weight: .regular))
                .foregroundStyle(colors.first ?? .white)
        }
        .accessibilityHidden(true)
    }
}

/// The small grey "Ad" tag every sponsored unit carries.
struct AdTag: View {
    var onDark = false
    var body: some View {
        Text("Ad")
            .font(.caption2.weight(.bold))
            .foregroundStyle(onDark ? .white : ZB.Palette.inkSecondary)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(onDark ? Color.black.opacity(0.45) : ZB.Palette.surface, in: .rect(cornerRadius: 4))
            .accessibilityLabel("Advertisement")
    }
}

// MARK: - Native ad card (image left, brand, headline, CTA) – reference: notification ad unit

struct NativeAd: Identifiable {
    let id = UUID()
    var offer: Offer = .earbuds
    let brand: String
    let brandSymbol: String
    let headline: String
    let cta: String
    let art: String
    let artColors: [Color]
    var bg: [Color] = [Color(hex: 0x1B1F2A), Color(hex: 0x0B0D12)]

    static let all: [NativeAd] = [
        .init(offer: .earbuds, brand: "Vybe Audio", brandSymbol: "waveform", headline: "Wireless earbuds at just ₹1,299",
              cta: "Buy now", art: "airpods.pro", artColors: [.white, Color(hex: 0xC9CED6)]),
        .init(offer: .flights, brand: "Skyline Travels", brandSymbol: "airplane.departure", headline: "Flights from ₹1,999 · extra 10% off on UPI",
              cta: "Book now", art: "airplane", artColors: [Color(hex: 0xBFE9FF), Color(hex: 0x3D8DFF)],
              bg: [Color(hex: 0xDDF2FF), Color(hex: 0x9FD4FF)]),
        .init(offer: .gold, brand: "AuGold", brandSymbol: "circle.hexagongrid", headline: "Buy 24K digital gold from ₹10",
              cta: "Start saving", art: "circle.hexagongrid.fill", artColors: [Color(hex: 0xFFE9A6), Color(hex: 0xD49A22)],
              bg: [Color(hex: 0x3A2608), Color(hex: 0x120B02)]),
    ]
}

struct NativeAdCard: View {
    @Environment(AppModel.self) private var model
    let ad: NativeAd
    var compact = false

    var body: some View {
        NavigationLink {
            OfferPage(offer: ad.offer)
        } label: {
            HStack(spacing: ZB.Space.md) {
                AdMedia(offer: ad.offer)
                    .frame(width: compact ? 96 : 120, height: compact ? 96 : 120)
                    .clipShape(.rect(cornerRadius: 14, style: .continuous))
                    .overlay(alignment: .bottomLeading) { AdTag(onDark: true).padding(6) }
                VStack(alignment: .leading, spacing: 6) {
                    Label(ad.brand, systemImage: ad.brandSymbol)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ZB.Palette.ink)
                    Text(ad.headline)
                        .font(compact ? .subheadline.weight(.semibold) : .headline)
                        .foregroundStyle(ZB.Palette.ink)
                        .multilineTextAlignment(.leading)
                        .lineLimit(3)
                    Spacer(minLength: 0)
                    HStack(spacing: 4) {
                        Text(ad.cta)
                        Image(systemName: "chevron.right")
                    }
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(ZB.Palette.ink)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(ZB.Space.sm)
            .frame(height: compact ? 136 : 150)
            .background(ZB.Palette.raised, in: .rect(cornerRadius: ZB.Radius.lg, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: ZB.Radius.lg, style: .continuous).strokeBorder(ZB.Palette.hairline))
        }
        .zbPressable()
        .accessibilityLabel("Advertisement from \(ad.brand): \(ad.headline)")
    }
}

// MARK: - Rewards teaser (neutral)

struct RewardsTeaser: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        NavigationLink { RewardsView() } label: {
            HStack(spacing: ZB.Space.md) {
                CoinView(size: 44, spin: 18)
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(Money.format(model.rewardsTotal)) cashback earned")
                        .font(.headline).foregroundStyle(ZB.Palette.ink)
                    Text("0.5% back on every payment · \(model.scratchCards.filter { !$0.revealed }.count) scratch cards")
                        .font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.footnote.weight(.bold)).foregroundStyle(ZB.Palette.inkTertiary)
            }
            .padding(ZB.Space.md)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        }
        .zbPressable()
    }
}

// MARK: - Zenbit Card teaser

struct CardTeaser: View {
    var body: some View {
        NavigationLink { CreditCardPage() } label: {
            HStack(spacing: ZB.Space.md) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Zenbit Card").font(.title3.weight(.bold)).foregroundStyle(ZB.Palette.ink)
                    Text("Credit on UPI with flat 1% cashback. ₹0 fees.")
                        .font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                        .multilineTextAlignment(.leading)
                    HStack(spacing: 4) { Text("Get yours"); Image(systemName: "arrow.up.right") }
                        .font(.subheadline.weight(.bold)).foregroundStyle(ZB.Palette.ink)
                        .padding(.top, 2)
                }
                Spacer(minLength: 0)
                CardTilt(design: .obsidian, width: 140)
            }
            .padding(ZB.Space.lg)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        }
        .zbPressable()
    }
}

// MARK: - Recharge & pay bills

struct BillCategory: Identifiable {
    let id = UUID()
    let title: String
    let symbol: String
}

struct RechargeGrid: View {
    @Environment(AppModel.self) private var model
    private let items: [BillCategory] = [
        .init(title: "Mobile", symbol: "iphone"),
        .init(title: "Electricity", symbol: "bolt"),
        .init(title: "DTH", symbol: "tv"),
        .init(title: "FASTag", symbol: "car"),
        .init(title: "Credit card", symbol: "creditcard"),
        .init(title: "Broadband", symbol: "wifi"),
        .init(title: "Gas", symbol: "flame"),
        .init(title: "Rent", symbol: "house"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.md) {
            SectionHeader(title: "Recharge & pay bills")
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: ZB.Space.xs), count: 4), spacing: ZB.Space.md) {
                ForEach(items) { item in
                    Button {
                        if item.title == "Electricity" { payBill() } else {
                            model.showToast("\(item.title) – coming soon", symbol: item.symbol)
                        }
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: item.symbol)
                                .font(.system(size: 19, weight: .medium))
                                .foregroundStyle(ZB.Palette.ink)
                                .frame(width: 52, height: 52)
                                .background(ZB.Palette.surface, in: .rect(cornerRadius: 17, style: .continuous))
                            Text(item.title).font(.caption.weight(.medium)).foregroundStyle(ZB.Palette.ink).lineLimit(1)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .zbPressable()
                }
            }
            Button(action: payBill) {
                HStack(spacing: ZB.Space.sm) {
                    Image(systemName: "bolt.circle.fill").font(.title2).foregroundStyle(ZB.Palette.warning)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Electricity bill due in 3 days").font(.subheadline.weight(.semibold)).foregroundStyle(ZB.Palette.ink)
                        Text("BESCOM · ₹2,340").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    }
                    Spacer()
                    Text("Pay").font(.subheadline.weight(.bold)).foregroundStyle(ZB.Palette.canvas)
                        .padding(.horizontal, 16).frame(minHeight: 32)
                        .background(ZB.Palette.ink, in: .capsule)
                }
                .padding(ZB.Space.md)
                .zbCard(radius: ZB.Radius.md, fill: ZB.Palette.surface)
            }
            .zbPressable()
        }
    }

    private func payBill() {
        model.startPay(SampleData.contacts.first { $0.name.hasPrefix("BESCOM") }!, amount: 2_340,
                       note: "Electricity – Nov", locked: true, source: "home_bills")
    }
}

// MARK: - "Next for you" (sponsored carousel of native ads)

struct NextForYou: View {
    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            HStack {
                Text("Next for you").font(.title3.weight(.semibold))
                Spacer()
                Text("Sponsored").font(.caption.weight(.medium)).foregroundStyle(ZB.Palette.inkTertiary)
            }
            ScrollView(.horizontal) {
                HStack(spacing: ZB.Space.sm) {
                    ForEach(NativeAd.all) { ad in
                        NativeAdCard(ad: ad, compact: true)
                            .containerRelativeFrame(.horizontal) { w, _ in w * 0.88 }
                            .scrollTransition(.interactive, axis: .horizontal) { c, p in
                                c.scaleEffect(p.isIdentity ? 1 : 0.95).opacity(p.isIdentity ? 1 : 0.7)
                            }
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
        }
    }
}

// MARK: - "More for you" – typographic creatives, the way real brand banners are designed

struct MoreForYou: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            HStack {
                Text("More for you").font(.title3.weight(.semibold))
                Spacer()
                Text("Sponsored").font(.caption.weight(.medium)).foregroundStyle(ZB.Palette.inkTertiary)
            }
            HStack(spacing: ZB.Space.sm) {
                creative(bg: Color(hex: 0xF4EEE3), fg: Color(hex: 0x1D1A14), brand: "HARBOR BANK", cta: "Invest", destination: { FixedDepositPage() }) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("8.5%").font(.system(size: 46, weight: .heavy, design: .rounded)).tracking(-1)
                        Text("p.a. on a fixed deposit, opened on UPI").font(.footnote.weight(.medium)).opacity(0.7)
                    }
                }
                creative(bg: Color(hex: 0x0E5CC4), fg: .white, brand: "SKYLINE TRAVELS", cta: "Book", media: .flights, destination: { OfferPage(offer: .flights) }) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text("BLR").font(.system(size: 26, weight: .heavy, design: .rounded))
                            Image(systemName: "airplane").font(.system(size: 15, weight: .bold))
                            Text("DEL").font(.system(size: 26, weight: .heavy, design: .rounded))
                        }
                        Text("from ₹3,499").font(.headline)
                        Text("Extra 10% off on UPI").font(.footnote.weight(.medium)).opacity(0.75)
                    }
                }
            }
        }
    }

    private func creative<Body: View, Dest: View>(bg: Color, fg: Color, brand: String, cta: String, media: Offer? = nil, @ViewBuilder destination: () -> Dest, @ViewBuilder body: () -> Body) -> some View {
        NavigationLink { destination() } label: {
            VStack(alignment: .leading, spacing: ZB.Space.sm) {
                HStack {
                    Text(brand).font(.system(.caption2, design: .monospaced).weight(.bold)).tracking(1.2).opacity(0.7)
                    Spacer()
                    AdTag(onDark: fg == .white)
                }
                Spacer(minLength: 0)
                body()
                HStack(spacing: 4) { Text(cta); Image(systemName: "arrow.up.right") }
                    .font(.subheadline.weight(.bold))
                    .padding(.horizontal, 12).frame(minHeight: 32)
                    .background(fg.opacity(0.12), in: .capsule)
            }
            .foregroundStyle(fg)
            .padding(ZB.Space.md)
            .frame(maxWidth: .infinity, minHeight: 220, alignment: .topLeading)
            .background {
                if let media {
                    AdMedia(offer: media)
                        .overlay(LinearGradient(colors: [.clear, .black.opacity(0.34)], startPoint: .center, endPoint: .bottom))
                } else { bg }
            }
            .clipShape(.rect(cornerRadius: ZB.Radius.lg, style: .continuous))
        }
        .zbPressable()
    }
}

// MARK: - Full-width sponsored banner (food brand creative)

struct SponsoredBanner: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        NavigationLink { OfferPage(offer: .food) } label: {
            HStack(alignment: .center, spacing: 0) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("tiffin&co.").font(.system(size: 15, weight: .heavy, design: .rounded)).opacity(0.9)
                    Text("FLAT ₹150 OFF").font(.system(size: 30, weight: .black, design: .rounded)).tracking(-0.5)
                        .minimumScaleFactor(0.8).lineLimit(1)
                    Text("on your first 3 orders").font(.subheadline.weight(.medium)).opacity(0.85)
                    HStack(spacing: 8) {
                        Text("ZEN150").font(.caption.monospaced().weight(.bold))
                            .padding(.horizontal, 8).frame(minHeight: 26)
                            .overlay(Capsule().strokeBorder(style: StrokeStyle(lineWidth: 1.2, dash: [3, 2])))
                        Text("Order now →").font(.subheadline.weight(.bold))
                    }
                    .padding(.top, 6)
                }
                Spacer(minLength: 0)
            }
            .foregroundStyle(.white)
            .padding(ZB.Space.lg)
            .frame(height: 168)
            .background { AdMedia(offer: .food) }
            .clipShape(.rect(cornerRadius: ZB.Radius.lg, style: .continuous))
            .overlay(alignment: .topTrailing) { AdTag(onDark: true).padding(10) }
        }
        .zbPressable()
        .accessibilityLabel("Advertisement. Tiffin and Co: flat ₹150 off your first 3 orders")
    }
}

// MARK: - Gift ₹21 banner (reference: "free gift to friends")

struct GiftBanner: View {
    var body: some View {
        ShareLink(item: "Here's ₹21 on me – make your first payment on Zenbit and it's yours: https://zenbit.app/g/AARAV21") {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Gift ₹21 to a friend").font(.title3.weight(.bold)).foregroundStyle(ZB.Palette.ink)
                    Text("They get it on their first payment").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                    Image(systemName: "arrow.right")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(ZB.Palette.onGreen)
                        .frame(width: 52, height: 30)
                        .background(ZB.Palette.green, in: .capsule)
                        .padding(.top, 4)
                }
                Spacer()
                BanknoteArt(amount: "₹21")
                    .rotationEffect(.degrees(-8))
            }
            .padding(ZB.Space.lg)
            .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
        }
        .zbPressable()
    }
}

struct BanknoteArt: View {
    let amount: String
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(LinearGradient(colors: [ZB.Palette.mint, ZB.Palette.green, ZB.Palette.greenDeep],
                                     startPoint: .topLeading, endPoint: .bottomTrailing))
            RoundedRectangle(cornerRadius: 5, style: .continuous)
                .strokeBorder(.white.opacity(0.5), style: StrokeStyle(lineWidth: 1.5, dash: [3, 2]))
                .padding(6)
            VStack(spacing: 0) {
                Text("FREE CASH").font(.system(size: 9, weight: .heavy)).tracking(1)
                Text(amount).font(.system(size: 30, weight: .heavy, design: .rounded))
            }
            .foregroundStyle(.white)
        }
        .frame(width: 128, height: 72)
        .shadow(color: ZB.Palette.green.opacity(0.35), radius: 10, y: 6)
        .accessibilityHidden(true)
    }
}

// MARK: - Complete your profile + UPI safety

struct CompleteProfileCard: View {
    @Environment(AppModel.self) private var model
    @State private var done = false
    var body: some View {
        if !done {
            VStack(alignment: .leading, spacing: ZB.Space.sm) {
                HStack(spacing: 6) {
                    Text("Complete your profile").font(.title3.weight(.semibold))
                    Circle().fill(ZB.Palette.danger).frame(width: 8, height: 8)
                }
                Button {
                    withAnimation(ZB.Motion.standard) { done = true }
                    model.showToast("UPI number activated", symbol: "checkmark.circle.fill")
                } label: {
                    HStack(spacing: ZB.Space.md) {
                        Image(systemName: "iphone.gen3.radiowaves.left.and.right")
                            .font(.system(size: 30, weight: .medium))
                            .foregroundStyle(ZB.Palette.ink)
                            .frame(width: 72, height: 72)
                            .background(ZB.Palette.raised, in: .rect(cornerRadius: 20, style: .continuous))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Receive money on your mobile number from any UPI app")
                                .font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                                .multilineTextAlignment(.leading)
                            HStack(spacing: 4) { Text("Activate now"); Image(systemName: "arrow.up.right") }
                                .font(.headline).foregroundStyle(ZB.Palette.ink)
                        }
                    }
                    .padding(ZB.Space.md)
                    .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
                }
                .zbPressable()
            }
            .transition(.opacity.combined(with: .scale(scale: 0.96)))
        }
    }
}

struct SafetyVideoCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: ZB.Space.sm) {
            Text("Stay safe").font(.title3.weight(.semibold))
            NavigationLink { SafetyGuidePage() } label: {
                HStack(spacing: ZB.Space.md) {
                    Image(systemName: "checkmark.shield")
                        .font(.system(size: 34, weight: .regular))
                        .foregroundStyle(ZB.Palette.ink)
                        .frame(width: 88, height: 88)
                        .background(ZB.Palette.raised, in: .rect(cornerRadius: 18, style: .continuous))
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Guide · 1 min").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                        Text("You never need a PIN to receive money").font(.headline).foregroundStyle(ZB.Palette.ink)
                            .multilineTextAlignment(.leading)
                    }
                    Spacer(minLength: 0)
                }
                .padding(ZB.Space.sm)
                .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
            }
            .zbPressable()
        }
    }
}

struct SafetyGuidePage: View {
    private let tips: [(String, String, String)] = [
        ("arrow.down.left", "Receiving money never needs a PIN", "If someone says “enter your PIN to receive”, it's a scam. You only enter your PIN to send money."),
        ("person.fill.questionmark", "Check the name before you pay", "Zenbit shows the name registered with the bank. If it doesn't match who you expect, stop."),
        ("qrcode", "Scanning a QR code is for paying", "Never scan a QR code to receive a refund or prize."),
        ("phone.down", "No one from Zenbit will call for your PIN", "We never ask for your PIN, OTP or card details – by call, SMS or chat."),
        ("hand.raised", "Block and report", "Spotted something odd? Block the request from Home – it also warns others."),
    ]
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ZB.Space.xl) {
                Text("Five things that keep your money safe").font(.system(.title, design: .rounded).weight(.bold))
                ForEach(tips, id: \.1) { t in
                    HStack(alignment: .top, spacing: ZB.Space.md) {
                        Image(systemName: t.0).font(.title3).frame(width: 44, height: 44)
                            .background(ZB.Palette.surface, in: .rect(cornerRadius: 14, style: .continuous))
                        VStack(alignment: .leading, spacing: 4) {
                            Text(t.1).font(.headline)
                            Text(t.2).font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                        }
                    }
                }
            }
            .padding(ZB.Space.margin)
            .padding(.bottom, 80)
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Stay safe")
        .navigationBarTitleDisplayMode(.inline)
    }
}
