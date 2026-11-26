import SwiftUI

// MARK: - Reward wallet (Apple Wallet-style stack: neat overlap, tap to expand)

struct CreditStack: View {
    struct Item: Identifiable {
        let id = UUID()
        let title: String
        let amount: Decimal
        let count: Int
        let color: Color
        let art: Art
        enum Art { case logo, symbol(String) }
    }
    let items: [Item]
    @Binding var expanded: Bool

    private let cardHeight: CGFloat = 164
    private let peek: CGFloat = 74          // visible strip of each back card when collapsed
    private let gap: CGFloat = 12           // space between cards when expanded
    private var height: CGFloat {
        let n = CGFloat(max(items.count, 1))
        return expanded ? n * cardHeight + (n - 1) * gap : (n - 1) * peek + cardHeight
    }

    var body: some View {
        ZStack(alignment: .top) {
            ForEach(Array(items.enumerated()), id: \.element.id) { i, it in
                let fromFront = items.count - 1 - i                 // 0 = front card
                card(it)
                    .padding(.horizontal, expanded ? 0 : CGFloat(fromFront) * 10)   // back cards sit slightly narrower
                    .offset(y: expanded ? CGFloat(i) * (cardHeight + gap) : CGFloat(i) * peek)
                    .zIndex(Double(i))
            }
        }
        .frame(height: height, alignment: .top)
        .contentShape(.rect)
        .onTapGesture { withAnimation(.spring(response: 0.55, dampingFraction: 0.82)) { expanded.toggle() }; Haptics.tap() }
        .accessibilityElement(children: .combine)
        .accessibilityHint(expanded ? "Double-tap to collapse" : "Double-tap to expand")
    }

    private func card(_ it: Item) -> some View {
        ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: 28, style: .continuous).fill(it.color)
            // brand art, cropped by the card edge
            Group {
                switch it.art {
                case .logo: ZenbitLogoGlyph().fill(Color.white.opacity(0.14)).frame(width: 170, height: 170)
                case .symbol(let s): Image(systemName: s).font(.system(size: 150, weight: .bold)).foregroundStyle(.white.opacity(0.14))
                }
            }
            .offset(x: 200, y: 26)

            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text(Money.format(it.amount, decimals: true))
                        .font(.system(size: 26, weight: .semibold, design: .rounded)).monospacedDigit().foregroundStyle(.white)
                        .lineLimit(1).minimumScaleFactor(0.7)
                    Spacer(minLength: 8)
                    Text(it.title.uppercased())
                        .font(.system(size: 11, weight: .heavy, design: .rounded)).tracking(1.8).foregroundStyle(.white.opacity(0.85))
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                Text("\(it.count) \(it.count == 1 ? "reward" : "rewards")")
                    .font(.footnote.weight(.medium)).foregroundStyle(.white.opacity(0.7))
            }
            .padding(.horizontal, 22)
            .padding(.top, 22)          // fixed top inset so amounts never touch the edge
            .padding(.bottom, 18)
        }
        .frame(height: cardHeight)
        .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous).strokeBorder(.white.opacity(0.2), lineWidth: 1))
        .clipShape(.rect(cornerRadius: 28, style: .continuous))
        .shadow(color: .black.opacity(0.22), radius: 12, y: 6)
    }
}

// MARK: - Wide "more rewards" bars

struct RewardBar: View {
    let title: String
    let sub: String
    let symbol: String
    let colors: [Color]
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: symbol).font(.system(size: 22, weight: .semibold)).foregroundStyle(.white)
                .frame(width: 52, height: 52).background(.white.opacity(0.2), in: .circle)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.system(.headline, design: .rounded)).foregroundStyle(.white)
                Text(sub).font(.footnote).foregroundStyle(.white.opacity(0.85)).lineLimit(2)
            }
            Spacer(minLength: 0)
            Image(systemName: "arrow.right").font(.subheadline.weight(.bold)).foregroundStyle(.white)
                .frame(width: 34, height: 34).background(.white.opacity(0.2), in: .circle)
        }
        .padding(.horizontal, 16)
        .frame(width: 312, height: 92)
        .background(LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing), in: .rect(cornerRadius: 26, style: .continuous))
    }
}

// MARK: - Surprise tile (foil with the partner logo, or the result once scratched)

struct SurpriseTile: View {
    let card: ScratchCard

    var body: some View {
        ZStack {
            if card.revealed { revealed } else { foil }
        }
        .frame(width: 150, height: 196)
        .clipShape(.rect(cornerRadius: 26, style: .continuous))
        .shadow(color: .black.opacity(0.12), radius: 10, y: 5)
    }

    private var foil: some View {
        ZStack {
            Foil()
            VStack(spacing: 10) {
                logo.frame(width: 64, height: 64).shadow(color: .black.opacity(0.18), radius: 6, y: 3)
                Text("SCRATCH").font(.system(size: 12, weight: .heavy, design: .rounded)).tracking(2.4).foregroundStyle(Color(white: 0.32))
                Text(card.from).font(.caption2).foregroundStyle(Color(white: 0.38)).lineLimit(1).padding(.horizontal, 10)
            }
        }
    }

    private var revealed: some View {
        ZStack {
            Brand.tint(card.brand)
            VStack(spacing: 8) {
                logo.frame(width: 46, height: 46)
                Text(card.isCash ? Money.format(card.amount) : card.coupon != nil ? "Coupon" : "No luck")
                    .font(.system(size: 26, weight: .bold, design: .rounded)).foregroundStyle(.white)
                Text(card.isCash ? "cashback" : card.coupon?.offer ?? "Try next time")
                    .font(.caption).foregroundStyle(.white.opacity(0.85)).multilineTextAlignment(.center).lineLimit(2).padding(.horizontal, 10)
            }
        }
    }

    @ViewBuilder private var logo: some View {
        if let a = Brand.merchant(card.brand) { MerchantLogo(asset: a, size: 64) }
        else { Image(systemName: "gift.fill").font(.largeTitle).foregroundStyle(Color(white: 0.4)) }
    }
}

/// Silver scratch-off foil with a travelling shimmer.
struct Foil: View {
    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 30)) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            ZStack {
                LinearGradient(stops: [.init(color: Color(hex: 0xD7DAE2), location: 0), .init(color: Color(hex: 0xF4F6FA), location: 0.35),
                                       .init(color: Color(hex: 0xBFC4CF), location: 0.7), .init(color: Color(hex: 0xE5E8EE), location: 1)],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
                Canvas { gc, size in                                   // fine metallic grain
                    for i in 0..<260 {
                        let x = (sin(Double(i) * 12.9898) * 43758.5453).truncatingRemainder(dividingBy: 1)
                        let y = (sin(Double(i) * 78.233) * 12345.6789).truncatingRemainder(dividingBy: 1)
                        let p = CGPoint(x: abs(x) * size.width, y: abs(y) * size.height)
                        gc.fill(Path(ellipseIn: CGRect(x: p.x, y: p.y, width: 1.6, height: 1.6)), with: .color(.white.opacity(i % 2 == 0 ? 0.6 : 0.18)))
                    }
                }
                GeometryReader { geo in
                    LinearGradient(colors: [.clear, .white.opacity(0.75), .clear], startPoint: .leading, endPoint: .trailing)
                        .frame(width: geo.size.width * 0.35)
                        .rotationEffect(.degrees(18))
                        .offset(x: CGFloat((t * 0.45).truncatingRemainder(dividingBy: 1)) * geo.size.width * 1.8 - geo.size.width * 0.5)
                }
            }
        }
    }
}

// MARK: - Scratch card (real scratching)

/// A foil you actually scratch: drag to rub it away; when ~45 % is gone it clears itself.
struct ScratchSurface<Under: View>: View {
    let size: CGSize
    var onProgress: (Double) -> Void = { _ in }
    var onRevealed: () -> Void
    @ViewBuilder var under: () -> Under

    @State private var strokes: [[CGPoint]] = []
    @State private var cells = Set<Int>()
    @State private var done = false
    @State private var lastSound = Date.distantPast
    private let grid = 12

    var body: some View {
        ZStack {
            under()
            foil
                .opacity(done ? 0 : 1)
                .scaleEffect(done ? 1.04 : 1)
                .animation(.easeOut(duration: 0.45), value: done)
        }
        .frame(width: size.width, height: size.height)
        .clipShape(.rect(cornerRadius: 30, style: .continuous))
    }

    private var foil: some View {
        Canvas { gc, sz in
            gc.fill(Path(roundedRect: CGRect(origin: .zero, size: sz), cornerRadius: 0),
                    with: .linearGradient(Gradient(stops: [.init(color: Color(hex: 0xD3D7E0), location: 0), .init(color: Color(hex: 0xF6F8FB), location: 0.4),
                                                          .init(color: Color(hex: 0xB9BEC9), location: 0.75), .init(color: Color(hex: 0xE3E6EC), location: 1)]),
                                          startPoint: .zero, endPoint: CGPoint(x: sz.width, y: sz.height)))
            for i in 0..<520 {                                                    // grain
                let x = abs((sin(Double(i) * 12.9898) * 43758.5453).truncatingRemainder(dividingBy: 1))
                let y = abs((sin(Double(i) * 78.233) * 12345.6789).truncatingRemainder(dividingBy: 1))
                gc.fill(Path(ellipseIn: CGRect(x: x * sz.width, y: y * sz.height, width: 2, height: 2)), with: .color(.white.opacity(i % 2 == 0 ? 0.55 : 0.15)))
            }
            // engraved mark + hint
            let g = ZenbitLogoGlyph().path(in: CGRect(x: sz.width / 2 - 40, y: sz.height / 2 - 70, width: 80, height: 80))
            gc.fill(g, with: .color(Color(white: 0.45).opacity(0.35)))
            gc.draw(Text("SCRATCH HERE").font(.system(size: 13, weight: .heavy, design: .rounded)).foregroundStyle(Color(white: 0.4)),
                    at: CGPoint(x: sz.width / 2, y: sz.height / 2 + 44))
            // the rubbed-away part
            gc.blendMode = .destinationOut
            for s in strokes where s.count > 0 {
                var p = Path()
                p.move(to: s[0])
                if s.count == 1 { p.addLine(to: CGPoint(x: s[0].x + 0.1, y: s[0].y)) }
                for pt in s.dropFirst() { p.addLine(to: pt) }
                gc.stroke(p, with: .color(.black), style: StrokeStyle(lineWidth: 46, lineCap: .round, lineJoin: .round))
            }
        }
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { v in
                    guard !done else { return }
                    if v.translation == .zero { strokes.append([v.location]) }
                    else if !strokes.isEmpty { strokes[strokes.count - 1].append(v.location) }
                    mark(v.location)
                }
        )
    }

    private func mark(_ p: CGPoint) {
        let cw = size.width / CGFloat(grid), ch = size.height / CGFloat(grid)
        for dx in -1...1 { for dy in -1...1 {
            let cx = Int(p.x / cw) + dx, cy = Int(p.y / ch) + dy
            if cx >= 0, cy >= 0, cx < grid, cy < grid { cells.insert(cy * grid + cx) }
        } }
        let progress = Double(cells.count) / Double(grid * grid)
        onProgress(progress)
        if Date().timeIntervalSince(lastSound) > 0.11 { lastSound = Date(); Sounds.scratch(); Haptics.soft() }
        if progress > 0.45 && !done { done = true; onRevealed() }
    }
}

// MARK: - Scratch sheet

struct ScratchSheet: View {
    let card: ScratchCard
    var onReveal: (ScratchCard) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var revealed = false
    @State private var revealedAt = Date()

    var body: some View {
        VStack(spacing: 22) {
            VStack(spacing: 4) {
                Text(revealed ? title : "Scratch to reveal").font(.system(.title2, design: .rounded).weight(.bold)).contentTransition(.opacity)
                Text(card.from).font(.subheadline).foregroundStyle(ZB.Palette.inkSecondary)
            }
            ZStack {
                ScratchSurface(size: CGSize(width: 300, height: 320), onRevealed: reveal) { result }
                    .shadow(color: .black.opacity(0.16), radius: 18, y: 10)
                if revealed && !card.isMiss { CoinRain(since: revealedAt).frame(width: 360, height: 420).allowsHitTesting(false) }
            }
            .frame(width: 300, height: 320)

            if revealed {
                VStack(spacing: 10) {
                    if let c = card.coupon { Text("Code \(c.code)").font(.headline.monospaced()); Text("Added to your coupons").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary) }
                    else if card.isCash { Text("Added to your cashback").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary) }
                    else { Text("Every payment can bring a surprise.").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary) }
                    Button("Done") { dismiss() }.buttonStyle(.zbInkCompact)
                }
                .transition(.opacity.combined(with: .offset(y: 10)))
            } else {
                Text("Rub the foil with your finger").font(.footnote).foregroundStyle(ZB.Palette.inkTertiary)
            }
        }
        .padding(ZB.Space.margin)
        .animation(ZB.Motion.hero, value: revealed)
        .sensoryFeedback(card.isMiss ? .warning : .success, trigger: revealed)
    }

    private var title: String { card.isCash ? "You won!" : card.coupon != nil ? "A coupon for you" : "Better luck next time" }

    /// What sits under the foil: the brand tile with the result.
    private var result: some View {
        ZStack {
            Brand.tint(card.brand)
            VStack(spacing: 12) {
                if let a = Brand.merchant(card.brand) { MerchantLogo(asset: a, size: 72) }
                if card.isCash {
                    Text(Money.format(card.amount)).font(.system(size: 54, weight: .bold, design: .rounded)).foregroundStyle(.white)
                    Text("cashback").font(.subheadline).foregroundStyle(.white.opacity(0.85))
                } else if let c = card.coupon {
                    Text(c.offer).font(.system(.title3, design: .rounded).weight(.bold)).foregroundStyle(.white).multilineTextAlignment(.center).padding(.horizontal, 20)
                } else {
                    Text("Nothing this time").font(.system(.title3, design: .rounded).weight(.bold)).foregroundStyle(.white)
                    Text("Your next payment could win.").font(.subheadline).foregroundStyle(.white.opacity(0.85))
                }
            }
        }
    }

    private func reveal() {
        revealedAt = Date()
        withAnimation(ZB.Motion.hero) { revealed = true }
        onReveal(card)
        Sounds.play(card.isMiss ? .miss : .reward)
    }
}

// MARK: - Coupons (ticket style)

/// Rounded rectangle with a half-circle bite out of the top and bottom edge at `notchX` (a perforated ticket).
struct TicketShape: Shape {
    var notchX: CGFloat = 0.72
    func path(in r: CGRect) -> Path {
        let nx = r.minX + r.width * notchX
        return Path(roundedRect: r, cornerRadius: 24, style: .continuous)
            .subtracting(Path(ellipseIn: CGRect(x: nx - 10, y: r.minY - 10, width: 20, height: 20)))
            .subtracting(Path(ellipseIn: CGRect(x: nx - 10, y: r.maxY - 10, width: 20, height: 20)))
    }
}

struct CouponTicket: View {
    let voucher: Voucher
    var onCopy: () -> Void = {}

    var body: some View {
        ZStack {
            TicketShape().fill(LinearGradient(colors: [voucher.tint, voucher.tint.opacity(0.82)], startPoint: .topLeading, endPoint: .bottomTrailing))
            HStack(spacing: 0) {
                HStack(spacing: 12) {
                    if let a = voucher.logo { MerchantLogo(asset: a, size: 54) }
                    VStack(alignment: .leading, spacing: 3) {
                        Text(voucher.brand.uppercased()).font(.system(size: 11, weight: .heavy, design: .rounded)).tracking(1.6).foregroundStyle(.white.opacity(0.8))
                        Text(voucher.offer).font(.system(.subheadline, design: .rounded).weight(.bold)).foregroundStyle(.white).lineLimit(2)
                        Text("Expires \(voucher.expires.formatted(.relative(presentation: .named)))").font(.caption2).foregroundStyle(.white.opacity(0.75))
                    }
                }
                .padding(.leading, 14).frame(maxWidth: .infinity, alignment: .leading)
                Rectangle().fill(.clear).frame(width: 1).overlay(
                    Line().stroke(.white.opacity(0.55), style: StrokeStyle(lineWidth: 1.4, dash: [4, 4])).padding(.vertical, 14))
                VStack(spacing: 6) {
                    Text("CODE").font(.system(size: 10, weight: .heavy)).tracking(1.5).foregroundStyle(.white.opacity(0.75))
                    Text(voucher.code).font(.system(.footnote, design: .monospaced).weight(.heavy)).foregroundStyle(.white).minimumScaleFactor(0.7).lineLimit(1)
                    Image(systemName: "doc.on.doc").font(.caption).foregroundStyle(.white.opacity(0.9))
                }
                .frame(width: 92)
            }
        }
        .frame(height: 118)
        .compositingGroup()
        .shadow(color: voucher.tint.opacity(0.35), radius: 10, y: 6)
    }

    private struct Line: Shape {
        func path(in r: CGRect) -> Path { var p = Path(); p.move(to: CGPoint(x: r.midX, y: r.minY)); p.addLine(to: CGPoint(x: r.midX, y: r.maxY)); return p }
    }
}

/// Soft wave along the bottom edge (the coupon header, like the reference).
struct WaveBottom: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.minY)); p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - 14))
        let steps = 40
        for i in stride(from: steps, through: 0, by: -1) {
            let x = r.minX + r.width * CGFloat(i) / CGFloat(steps)
            p.addLine(to: CGPoint(x: x, y: r.maxY - 14 + sin(CGFloat(i) / CGFloat(steps) * .pi * 7) * 7))
        }
        p.closeSubpath()
        return p
    }
}

struct CouponsSheet: View {
    @Environment(AppModel.self) private var model
    @State private var selected: Voucher?
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    ZStack(alignment: .bottomLeading) {
                        WaveBottom().fill(Color(hex: 0x2B59FF)).frame(height: 150)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Your coupons").font(.system(.largeTitle, design: .rounded).weight(.bold)).foregroundStyle(.white)
                            Text("\(model.vouchers.count) ready to use").font(.subheadline).foregroundStyle(.white.opacity(0.8))
                        }
                        .padding(.horizontal, ZB.Space.margin).padding(.bottom, 30)
                    }
                    VStack(spacing: 14) {
                        ForEach(model.vouchers) { v in
                            Button { selected = v } label: { CouponTicket(voucher: v) }.buttonStyle(.plain).zbPressable()
                        }
                    }
                    .padding(.horizontal, ZB.Space.margin).padding(.top, 10).padding(.bottom, 40)
                }
            }
            .ignoresSafeArea(edges: .top)
            .background(ZB.Palette.canvas)
            .navigationDestination(item: $selected) { CouponDetail(voucher: $0) }
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

/// The "redeem" ticket: brand colour backdrop, white ticket, perforated divider, code box, copy and barcode.
struct CouponDetail: View {
    let voucher: Voucher
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var showBarcode = false

    var body: some View {
        ZStack(alignment: .top) {
            voucher.tint.ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Button { dismiss() } label: { Image(systemName: "chevron.left").font(.headline).foregroundStyle(.white).frame(width: 44, height: 44) }
                    Spacer()
                    Text(voucher.brand).font(.headline).foregroundStyle(.white)
                    Spacer()
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, 8)

                ZStack {
                    TicketCardShape().fill(Color.white)
                    VStack(spacing: 0) {
                        HStack(alignment: .center) {
                            if let a = voucher.logo { MerchantLogo(asset: a, size: 72) }
                            Spacer()
                            Text(voucher.offer).font(.system(.title2, design: .rounded).weight(.heavy)).foregroundStyle(voucher.tint)
                                .multilineTextAlignment(.trailing).lineLimit(3).minimumScaleFactor(0.7)
                        }
                        .padding(.top, 28).padding(.horizontal, 24)
                        Spacer(minLength: 8)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(voucher.brand)").font(.headline)
                            Text("Valid until \(voucher.expires.formatted(.dateTime.day().month(.wide)))").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                            Text("Show this code at checkout to get your offer.").font(.footnote).foregroundStyle(ZB.Palette.inkSecondary).padding(.top, 4)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 24).padding(.bottom, 22)
                        Line().stroke(Color.black.opacity(0.18), style: StrokeStyle(lineWidth: 1.4, dash: [6, 5])).frame(height: 1).padding(.horizontal, 12)
                        VStack(spacing: 14) {
                            Text("CODE").font(.system(size: 12, weight: .heavy)).tracking(2).foregroundStyle(ZB.Palette.inkSecondary).padding(.top, 20)
                            Text(voucher.code).font(.system(size: 30, weight: .heavy, design: .rounded)).foregroundStyle(voucher.tint)
                                .padding(.horizontal, 26).padding(.vertical, 14)
                                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Color.black.opacity(0.2), style: StrokeStyle(lineWidth: 1.4, dash: [4, 4])))
                            if showBarcode { Barcode(code: voucher.code).frame(height: 54).padding(.horizontal, 40).transition(.opacity.combined(with: .scale(scale: 0.95))) }
                            HStack(spacing: 12) {
                                Button { Clipboard.copy(voucher.code, label: "Coupon code", model: model) } label: {
                                    Image(systemName: "doc.on.doc").font(.headline).foregroundStyle(.white)
                                        .frame(width: 96, height: 46).background(voucher.tint, in: .rect(cornerRadius: 12, style: .continuous))
                                }
                                Button { withAnimation(ZB.Motion.standard) { showBarcode.toggle() } } label: {
                                    Image(systemName: "barcode").font(.headline).foregroundStyle(.white)
                                        .frame(width: 96, height: 46).background(voucher.tint, in: .rect(cornerRadius: 12, style: .continuous))
                                }
                            }
                            .padding(.bottom, 26)
                        }
                    }
                }
                .frame(maxWidth: 420)
                .padding(.horizontal, 22).padding(.top, 18)
                .frame(maxHeight: .infinity, alignment: .top)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private struct Line: Shape {
        func path(in r: CGRect) -> Path { var p = Path(); p.move(to: CGPoint(x: r.minX, y: r.midY)); p.addLine(to: CGPoint(x: r.maxX, y: r.midY)); return p }
    }
}

/// White card with half-circle notches on both sides at the perforation.
private struct TicketCardShape: Shape {
    func path(in r: CGRect) -> Path {
        let y = r.minY + r.height * 0.5
        return Path(roundedRect: r, cornerRadius: 26, style: .continuous)
            .subtracting(Path(ellipseIn: CGRect(x: r.minX - 12, y: y - 12, width: 24, height: 24)))
            .subtracting(Path(ellipseIn: CGRect(x: r.maxX - 12, y: y - 12, width: 24, height: 24)))
    }
}

/// A decorative barcode drawn from the code's characters.
private struct Barcode: View {
    let code: String
    var body: some View {
        Canvas { gc, size in
            var x: CGFloat = 0
            var i = 0
            let seed = code.unicodeScalars.map { Int($0.value) }
            while x < size.width {
                let w = CGFloat(1 + (seed[i % seed.count] + i * 7) % 4)
                if i % 2 == 0 { gc.fill(Path(CGRect(x: x, y: 0, width: w, height: size.height)), with: .color(.black)) }
                x += w + 1.5; i += 1
            }
        }
    }
}
