import SwiftUI

// Every ad, banner and promo notification opens a real page. Partners are fictional.

enum Offer: String, Hashable, CaseIterable, Identifiable {
    case flights, food, earbuds, gold, insurance
    var id: String { rawValue }

    var brand: String {
        switch self {
        case .flights: "Skyline Travels"
        case .food: "Tiffin & Co."
        case .earbuds: "Vybe Audio"
        case .gold: "AuGold"
        case .insurance: "CoverKart"
        }
    }
    var headline: String {
        switch self {
        case .flights: "Up to 30% off on flights"
        case .food: "Flat ₹150 off your first 3 orders"
        case .earbuds: "Wireless earbuds at ₹1,299"
        case .gold: "Buy 24K digital gold from ₹10"
        case .insurance: "Phone protection from ₹19/month"
        }
    }
    var symbol: String {
        switch self {
        case .flights: "airplane"
        case .food: "takeoutbag.and.cup.and.straw.fill"
        case .earbuds: "airpods.pro"
        case .gold: "circle.hexagongrid.fill"
        case .insurance: "shield.lefthalf.filled"
        }
    }
    var bg: Color {
        switch self {
        case .flights: Color(hex: 0x0E5CC4)
        case .food: Color(hex: 0xF25C2A)
        case .earbuds: Color(hex: 0x16181C)
        case .gold: Color(hex: 0xE8B53C)
        case .insurance: Color(hex: 0x3B2A8F)
        }
    }
    var fg: Color { self == .gold ? .black : .white }
    var code: String? {
        switch self {
        case .food: "ZEN150"
        case .flights: "FLYUPI"
        default: nil
        }
    }
    var points: [(String, String)] {
        switch self {
        case .flights: [("tag", "Extra 10% off when you pay with UPI"), ("arrow.uturn.backward", "Free cancellation up to 24 h before"), ("indianrupeesign", "0.5% Zenbit cashback on top")]
        case .food: [("bag", "Valid on your first 3 orders above ₹299"), ("clock", "Delivery in 30 minutes or ₹50 back"), ("indianrupeesign", "Pay with UPI at checkout")]
        case .earbuds: [("waveform", "Active noise cancellation, 30 h battery"), ("shippingbox", "Free delivery in 2 days"), ("arrow.uturn.backward", "7-day replacement")]
        case .gold: [("lock.shield", "Stored in insured vaults"), ("arrow.left.arrow.right", "Sell any time, money in your bank"), ("indianrupeesign", "Start from ₹10")]
        case .insurance: [("iphone", "Screen, liquid and theft cover"), ("clock", "Claims settled in 20 minutes"), ("xmark.circle", "Cancel any time")]
        }
    }
}

struct OfferPage: View {
    @Environment(AppModel.self) private var model
    let offer: Offer
    @State private var opened = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ZB.Space.xl) {
                // Creative
                VStack(alignment: .leading, spacing: ZB.Space.sm) {
                    HStack {
                        Text(offer.brand.uppercased()).font(.system(.caption, design: .monospaced).weight(.bold)).tracking(1.4).opacity(0.75)
                        Spacer()
                        AdTag(onDark: offer.fg == .white)
                    }
                    Spacer(minLength: ZB.Space.lg)
                    Text(offer.headline).font(.system(.title, design: .rounded).weight(.heavy))
                }
                .foregroundStyle(offer.fg == .black && offer != .gold ? .black : (offer == .gold ? Color.black : .white))
                .padding(ZB.Space.lg)
                .frame(maxWidth: .infinity, minHeight: 260, alignment: .topLeading)
                .background {
                    AdMedia(offer: offer)
                        .overlay(LinearGradient(colors: [.clear, .black.opacity(offer == .gold ? 0.0 : 0.30)], startPoint: .center, endPoint: .bottom))
                }
                .clipShape(.rect(cornerRadius: ZB.Radius.xl, style: .continuous))

                if let code = offer.code {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Use code").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                            Text(code).font(.title3.monospaced().weight(.bold))
                        }
                        Spacer()
                        Button("Copy") { Clipboard.copy(code, label: "Code", model: model) }
                            .buttonStyle(.zbSecondary).frame(width: 96)
                    }
                    .padding(ZB.Space.md)
                    .overlay(RoundedRectangle(cornerRadius: ZB.Radius.md, style: .continuous)
                        .strokeBorder(ZB.Palette.hairline, style: StrokeStyle(lineWidth: 1.5, dash: [6, 4])))
                }

                VStack(spacing: 0) {
                    ForEach(offer.points, id: \.1) { p in
                        HStack(spacing: ZB.Space.md) {
                            Image(systemName: p.0).font(.body.weight(.medium)).frame(width: 28)
                            Text(p.1).font(.body)
                            Spacer()
                        }
                        .padding(.vertical, ZB.Space.md)
                        if p.1 != offer.points.last?.1 { Divider().overlay(ZB.Palette.hairline) }
                    }
                }

                Text("Sponsored by \(offer.brand). Zenbit may earn a fee if you buy. Offer terms are set by the partner.")
                    .font(.caption).foregroundStyle(ZB.Palette.inkTertiary)
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.top, ZB.Space.sm)
            .padding(.bottom, 120)
            .frame(maxWidth: 680)
            .frame(maxWidth: .infinity)
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle(offer.brand)
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            Button(opened ? "Opening \(offer.brand)…" : "Continue to \(offer.brand)") {
                opened = true
                Analytics.track("offer_cta", ["offer": offer.rawValue])
                model.showToast("Partner site opens here in the live app", symbol: "arrow.up.right")
            }
            .buttonStyle(.zbInk)
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, ZB.Space.xs)
        }
    }
}

// MARK: - Fixed deposit (investment) with a live calculator

struct FixedDepositPage: View {
    @Environment(AppModel.self) private var model
    @State private var principal: Double = 25_000
    @State private var months = 12
    @State private var booked = false
    @State private var shownMaturity: Double = 0

    private let tenures = [6, 12, 24, 36]
    private var rate: Double { [6: 7.25, 12: 8.0, 24: 8.5, 36: 8.25][months] ?? 8 }
    /// Quarterly compounding, the convention for Indian bank FDs.
    private var maturity: Double { principal * pow(1 + rate / 400, Double(months) / 3) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ZB.Space.xl) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("HARBOR BANK · FD ON UPI").font(.system(.caption, design: .monospaced).weight(.bold)).tracking(1.2)
                        .foregroundStyle(ZB.Palette.inkSecondary)
                    Text("\(rate, specifier: "%.2f")% p.a.").font(.system(size: 44, weight: .heavy, design: .rounded))
                        .contentTransition(.numericText(value: rate))
                    Text("Insured up to ₹5 lakh by DICGC. Break it any time.").font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
                }

                VStack(alignment: .leading, spacing: ZB.Space.sm) {
                    HStack {
                        Text("You invest").foregroundStyle(ZB.Palette.inkSecondary)
                        Spacer()
                        Text(Money.format(Decimal(principal))).font(.title3.weight(.semibold)).monospacedDigit()
                            .contentTransition(.numericText(value: principal))
                    }
                    Slider(value: $principal, in: 1_000...500_000, step: 1_000).tint(ZB.Palette.ink)
                }

                VStack(alignment: .leading, spacing: ZB.Space.sm) {
                    Text("For").foregroundStyle(ZB.Palette.inkSecondary)
                    Picker("Tenure", selection: $months) {
                        ForEach(tenures, id: \.self) { m in Text(m < 12 ? "\(m) mo" : "\(m / 12) yr").tag(m) }
                    }
                    .pickerStyle(.segmented)
                }

                VStack(spacing: ZB.Space.sm) {
                    row("Interest earned", Money.format(Decimal(maturity - principal).rounded(0)))
                    Divider().overlay(ZB.Palette.hairline)
                    row("You get back", Money.format(Decimal(maturity).rounded(0)), bold: true)
                }
                .padding(ZB.Space.md)
                .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
                .animation(ZB.Motion.snappy, value: months)

                if booked {
                    Label("FD booked · matures \(Calendar.current.date(byAdding: .month, value: months, to: .now)!.formatted(date: .abbreviated, time: .omitted))",
                          systemImage: "checkmark.seal.fill")
                        .font(.subheadline.weight(.semibold))
                        .padding(ZB.Space.md)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(ZB.Palette.surface, in: .rect(cornerRadius: ZB.Radius.md, style: .continuous))
                        .transition(.scale(scale: 0.95).combined(with: .opacity))
                }
                Text("Sponsored · Harbor Bank pays Zenbit a distribution fee. Interest is taxable.")
                    .font(.caption).foregroundStyle(ZB.Palette.inkTertiary)
            }
            .padding(.horizontal, ZB.Space.margin)
            .padding(.top, ZB.Space.sm)
            .padding(.bottom, 120)
            .frame(maxWidth: 680)
            .frame(maxWidth: .infinity)
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Fixed deposit")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            Button(booked ? "Book another FD" : "Invest \(Money.format(Decimal(principal)))") {
                Task {
                    if await Biometrics.authenticate(reason: "Invest \(Money.format(Decimal(principal))) in a fixed deposit") {
                        withAnimation(ZB.Motion.hero) { booked = true }
                        Haptics.success()
                    }
                }
            }
            .buttonStyle(.zbPrimary)
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, ZB.Space.xs)
        }
    }

    private func row(_ l: String, _ r: String, bold: Bool = false) -> some View {
        HStack {
            Text(l).foregroundStyle(ZB.Palette.inkSecondary)
            Spacer()
            Text(r).font(bold ? .title3.weight(.bold) : .body.weight(.medium)).monospacedDigit()
                .contentTransition(.numericText())
        }
    }
}
