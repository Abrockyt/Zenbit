import SwiftUI

/// "Zenbit Card" – credit on UPI (RuPay). Bank picker flips the real 3D card.
struct CreditCardPage: View {
    @Environment(AppModel.self) private var model
    @State private var design: CardDesign = .obsidian
    @State private var applied = false
    @Environment(\.zbTabBarInset) private var tabBarInset

    var body: some View {
        ScrollView {
            VStack(spacing: ZB.Space.xl) {
                // Bank picker (like a segmented carousel)
                ScrollView(.horizontal) {
                    HStack(spacing: ZB.Space.lg) {
                        ForEach(CardDesign.allCases) { d in
                            Button {
                                withAnimation(ZB.Motion.standard) { design = d }
                                Haptics.tap()
                            } label: {
                                Text(d.bank)
                                    .font(design == d ? .title3.weight(.bold) : .body.weight(.medium))
                                    .foregroundStyle(design == d ? ZB.Palette.ink : ZB.Palette.inkTertiary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, ZB.Space.margin)
                }
                .scrollIndicators(.hidden)

                Card3DView(design: design, height: 250)
                    .gesture(DragGesture(minimumDistance: 40).onEnded { v in
                        guard abs(v.translation.width) > abs(v.translation.height) * 2 else { return }
                        let all = CardDesign.allCases
                        let i = all.firstIndex(of: design)!
                        let next = v.translation.width < 0 ? min(i + 1, all.count - 1) : max(i - 1, 0)
                        withAnimation(ZB.Motion.standard) { design = all[next] }
                    })

                VStack(spacing: 4) {
                    Text("Flat 1% cashback").font(.system(.largeTitle, design: .rounded).weight(.bold))
                    Text("on every UPI spend, on top of your rewards").foregroundStyle(ZB.Palette.inkSecondary)
                }

                VStack(spacing: 0) {
                    benefit("checkmark.seal", "Approval in minutes", "Backed by a fixed deposit from ₹2,000 – no income proof")
                    Divider().overlay(ZB.Palette.hairline).padding(.leading, 60)
                    benefit("gauge.with.needle", "Build your credit score", "On-time repayments are reported every month")
                    Divider().overlay(ZB.Palette.hairline).padding(.leading, 60)
                    benefit("calendar", "45 days interest-free", "Pay with Scan & Pay now, repay next month")
                    Divider().overlay(ZB.Palette.hairline).padding(.leading, 60)
                    benefit("lock.shield", "Lock it in one tap", "Freeze, set limits and turn off online use any time")
                }
                .padding(.horizontal, ZB.Space.md)
                .zbCard(radius: ZB.Radius.lg, fill: ZB.Palette.surface)
                .padding(.horizontal, ZB.Space.margin)

                Text("Joining fee ₹0 · Annual fee ₹0 · Interest 3.5%/month after the free period. Subject to \(design.bank)'s approval.")
                    .font(.caption).foregroundStyle(ZB.Palette.inkTertiary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, ZB.Space.xxl)
            }
            .padding(.top, ZB.Space.sm)
            .padding(.bottom, 120)
            .frame(maxWidth: 680)
            .frame(maxWidth: .infinity)
        }
        .background(ZB.Palette.canvas)
        .pageLoad()
        .navigationTitle("Zenbit Card")
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            Button(applied ? "Application started" : "Apply now") {
                applied = true
                Analytics.track("card_apply", ["bank": design.bank])
                model.showToast("We'll confirm with \(design.bank) shortly", symbol: "creditcard")
            }
            .buttonStyle(.zbPrimary)
            .disabled(applied)
            .padding(.horizontal, ZB.Space.margin)
            .padding(.bottom, ZB.Space.xs + tabBarInset)
        }
    }

    private func benefit(_ symbol: String, _ title: String, _ sub: String) -> some View {
        HStack(spacing: ZB.Space.md) {
            Image(systemName: symbol)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(ZB.Palette.ink)
                .frame(width: 44, height: 44)
                .background(ZB.Palette.raised, in: .rect(cornerRadius: 14, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.semibold))
                Text(sub).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, ZB.Space.sm)
    }
}

#Preview { NavigationStack { CreditCardPage() }.environment(AppModel()) }
