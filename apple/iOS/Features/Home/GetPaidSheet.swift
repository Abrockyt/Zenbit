import SwiftUI

/// Fanned, perspective stack of faces that shuffles on a loop (inspired by the "Add money"
/// sheet in the reference video). The front item is always centred and largest.
struct FanStack: View {
    let people: [Contact]
    var size: CGFloat = 64
    @State private var front = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            ForEach(people.indices, id: \.self) { i in
                let d = distance(i)
                AvatarView(contact: people[i], size: size)
                    .overlay(Circle().strokeBorder(ZB.Palette.canvas, lineWidth: 2))
                    .scaleEffect(1 - min(abs(d), 3) * 0.1)
                    .rotation3DEffect(.degrees(d * -28), axis: (x: 0, y: 1, z: 0), perspective: 0.6)
                    .offset(x: d * size * 0.42)
                    .zIndex(-abs(d))
                    .opacity(abs(d) > 3.2 ? 0 : 1)
                    .shadow(color: .black.opacity(0.12), radius: 6, y: 4)
            }
        }
        .frame(height: size * 1.2)
        .task {
            guard !reduceMotion else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1.3))
                withAnimation(.spring(response: 0.6, dampingFraction: 0.82)) { front = (front + 1) % people.count }
            }
        }
        .accessibilityHidden(true)
    }

    /// Signed distance from the front item, wrapped so the loop is seamless.
    private func distance(_ i: Int) -> Double {
        let n = Double(people.count)
        var d = Double(i - front)
        if d > n / 2 { d -= n }
        if d < -n / 2 { d += n }
        return d
    }
}

/// "Get paid" – a sheet whose height morphs between states with the content cross-blurring,
/// like the reference: menu → my QR / request a contact.
struct GetPaidSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    enum Mode { case menu, qr, request }
    @State private var mode: Mode = .menu
    @State private var detent: PresentationDetent = .height(470)

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                if mode != .menu {
                    GlassIconButton(systemName: "chevron.left", label: "Back") { go(.menu) }
                        .transition(.scale.combined(with: .opacity))
                }
                Spacer()
                GlassIconButton(systemName: "xmark", label: "Close") { dismiss() }
            }
            .padding([.horizontal, .top], ZB.Space.md)

            Group {
                switch mode {
                case .menu: menu
                case .qr: qr
                case .request: request
                }
            }
            .transition(.asymmetric(insertion: .opacity.combined(with: .scale(scale: 0.96)),
                                    removal: .opacity))
            .id(mode)
            Spacer(minLength: 0)
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.86), value: mode)
        .presentationDetents([.height(470), .height(600), .large], selection: $detent)
        .presentationDragIndicator(.hidden)
        .presentationCornerRadius(36)
    }

    private func go(_ m: Mode) {
        withAnimation(.spring(response: 0.5, dampingFraction: 0.86)) {
            mode = m
            detent = m == .menu ? .height(470) : (m == .qr ? .height(600) : .large)
        }
        Haptics.tap()
    }

    private var menu: some View {
        VStack(spacing: ZB.Space.lg) {
            FanStack(people: model.recentPeople)
            VStack(spacing: 4) {
                Text("Get paid").font(.title2.weight(.bold))
                Text("Choose how people can pay you.").foregroundStyle(ZB.Palette.inkSecondary)
            }
            VStack(spacing: ZB.Space.xs) {
                option("Show my QR", "Anyone with a UPI app can scan it", "qrcode") { go(.qr) }
                option("Request from a contact", "They'll get a request to approve", "arrow.down.left") { go(.request) }
                option("Split a bill", "Zen AI works out who owes what", "person.2") {
                    dismiss(); model.showAI = true
                }
            }
        }
        .padding(.horizontal, ZB.Space.margin)
    }

    private func option(_ title: String, _ sub: String, _ symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: ZB.Space.sm) {
                IconTile(symbol: symbol, size: 40)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.body.weight(.semibold)).foregroundStyle(ZB.Palette.ink)
                    Text(sub).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(ZB.Palette.inkTertiary)
            }
            .padding(ZB.Space.md)
            .zbCard(radius: ZB.Radius.md, fill: ZB.Palette.surface)
        }
        .zbPressable()
    }

    private var qr: some View {
        VStack(spacing: ZB.Space.md) {
            AvatarView(contact: model.profile.asContact, size: 56)
            Text(model.profile.name).font(.title3.weight(.semibold))
            Image(uiImage: QRCode.image(for: UPILink(payeeVPA: model.profile.upiID, payeeName: model.profile.name).url.absoluteString))
                .interpolation(.none).resizable().scaledToFit()
                .frame(width: 230, height: 230)
                .padding(ZB.Space.md)
                .background(.white, in: .rect(cornerRadius: ZB.Radius.lg, style: .continuous))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 6)
            Button { Clipboard.copy(model.profile.upiID, label: "UPI ID", model: model) } label: {
                Label(model.profile.upiID, systemImage: "doc.on.doc")
                    .labelStyle(TrailingIconLabel())
                    .font(.subheadline.weight(.semibold).monospaced())
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .frame(minHeight: ZB.minTarget)
            }
        }
        .padding(.top, ZB.Space.xs)
    }

    private var request: some View {
        VStack(alignment: .leading, spacing: ZB.Space.md) {
            Text("Request from").font(.title2.weight(.bold)).padding(.horizontal, ZB.Space.margin)
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(model.recentPeople.filter(\.isOnUPI)) { c in
                        Button {
                            dismiss()
                            model.startPay(c, mode: .request, source: "get_paid")
                        } label: {
                            HStack(spacing: ZB.Space.sm) {
                                AvatarView(contact: c, size: 44)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(c.name).font(.body.weight(.medium)).foregroundStyle(ZB.Palette.ink)
                                    Text(c.upiID).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                                }
                                Spacer()
                            }
                            .padding(.horizontal, ZB.Space.margin)
                            .frame(minHeight: 60)
                            .contentShape(.rect)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

#Preview { Text("Home").sheet(isPresented: .constant(true)) { GetPaidSheet().environment(AppModel()) } }
