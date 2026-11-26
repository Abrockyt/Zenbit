import SwiftUI
import UserNotifications

// MARK: - Squircle portrait (rounded-square avatars like the reference)

struct SquirclePortrait: View {
    let contact: Contact
    var size: CGFloat
    var body: some View {
        Group {
            if let p = contact.photoAsset {
                Image(p).resizable().scaledToFill()
            } else {
                AvatarView(contact: contact, size: size)
            }
        }
        .frame(width: size, height: size)
        .clipShape(.rect(cornerRadius: size * 0.3, style: .continuous))
        .shadow(color: .black.opacity(0.12), radius: size * 0.12, y: size * 0.06)
    }
}

// MARK: - Page 1: orbit of people

/// Two counter-rotating rings of portraits around a hero face. Portraits stay upright,
/// bob gently, and pop in with a staggered spring on first appearance.
struct OrbitStep: View {
    var next: () -> Void
    @State private var appeared = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let inner = Array(SampleData.orbitPeople.prefix(6))
    private let outer = Array(SampleData.orbitPeople.dropFirst(6).prefix(7))

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: ZB.Space.lg)
            TimelineView(.animation(paused: reduceMotion)) { ctx in
                let t = reduceMotion ? 0 : ctx.date.timeIntervalSinceReferenceDate
                ZStack {
                    ring(outer, radius: 148, base: 34, angle: -t * 6, t: t, delayBase: 0.35)
                    ring(inner, radius: 92, base: 46, angle: t * 9, t: t, delayBase: 0.1)
                    SquirclePortrait(contact: SampleData.orbitPeople.last!, size: 96)
                        .scaleEffect(appeared ? 1 : 0.4)
                        .opacity(appeared ? 1 : 0)
                    CoinView(size: 30, spin: sin(t * 1.2) * 30)
                        .offset(x: 40, y: 40)
                        .scaleEffect(appeared ? 1 : 0)
                }
                .frame(width: 340, height: 340)
            }
            Spacer(minLength: ZB.Space.lg)
            VStack(spacing: ZB.Space.xs) {
                Text("Pay the people you love")
                    .font(.title.weight(.bold))
                    .multilineTextAlignment(.center)
                Text("Send money to anyone on UPI in a tap — your favourites are always one swipe away.")
                    .font(.body)
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, ZB.Space.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 16)

            Button("Continue", action: next)
                .buttonStyle(.zbInkCompact)
                .padding(.top, ZB.Space.xl)
                .padding(.bottom, ZB.Space.xl)
                .opacity(appeared ? 1 : 0)
        }
        .onAppear { withAnimation(ZB.Motion.hero.delay(0.05)) { appeared = true } }
    }

    private func ring(_ people: [Contact], radius: CGFloat, base: CGFloat, angle: Double, t: Double, delayBase: Double) -> some View {
        ForEach(people.indices, id: \.self) { i in
            let a = (Double(i) / Double(people.count)) * 2 * .pi + angle * .pi / 180
            let size = base + CGFloat((i * 7) % 3) * 6
            SquirclePortrait(contact: people[i], size: size)
                .offset(x: cos(a) * radius, y: sin(a) * radius + sin(t * 1.4 + Double(i)) * 3)
                .scaleEffect(appeared ? 1 : 0.2)
                .opacity(appeared ? 1 : 0)
                .animation(ZB.Motion.hero.delay(delayBase + Double(i) * 0.05), value: appeared)
        }
    }
}

// MARK: - Page 2: notifications

/// Phone mock with notifications sliding in one by one, floating faces around it.
struct NotifyStep: View {
    var next: () -> Void
    @State private var shown = 0
    @State private var appeared = false

    private let items: [(Contact, String, String)] = [
        (SampleData.contact("Riya"), "Riya Sharma", "Paid you ₹250 · Lunch 🍜"),
        (SampleData.contact("Arjun"), "Arjun Nair", "Requested ₹600 for movie night"),
        (SampleData.contact("Meera"), "Meera Iyer", "Split ₹1,200 · Concert"),
    ]

    var body: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .top) {
                LinearGradient(colors: [ZB.Palette.greenSoft, ZB.Palette.mint.opacity(0.35), ZB.Palette.canvas],
                               startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
                phone
                    .padding(.top, ZB.Space.xl)
                floaters
            }
            .frame(maxHeight: .infinity)

            VStack(spacing: ZB.Space.xs) {
                Text("Never miss a payment")
                    .font(.title.weight(.bold))
                Text("Get notified the moment money arrives, someone requests, or a bill is due.")
                    .font(.body)
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, ZB.Space.xxl)

            VStack(spacing: ZB.Space.xxs) {
                Button("Turn on notifications") {
                    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
                        Task { @MainActor in next() }
                    }
                }
                .buttonStyle(.zbInkCompact)
                Button("Another time", action: next)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .frame(minHeight: ZB.minTarget)
            }
            .padding(.top, ZB.Space.xl)
            .padding(.bottom, ZB.Space.md)
        }
        .task {
            withAnimation(ZB.Motion.hero) { appeared = true }
            for i in 1...items.count {
                try? await Task.sleep(for: .milliseconds(i == 1 ? 500 : 650))
                withAnimation(ZB.Motion.hero) { shown = i }
                Haptics.soft()
            }
        }
    }

    private var phone: some View {
        VStack(spacing: ZB.Space.sm) {
            Text("9:41")
                .font(.system(size: 64, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.top, ZB.Space.xl)
            Text(Date().formatted(.dateTime.weekday(.wide).day().month(.wide)))
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.white.opacity(0.8))
                .padding(.bottom, ZB.Space.sm)
            VStack(spacing: ZB.Space.xs) {
                ForEach(Array(items.enumerated()).reversed(), id: \.offset) { i, item in
                    if i < shown {
                        HStack(spacing: ZB.Space.sm) {
                            AvatarView(contact: item.0, size: 34)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(item.1).font(.footnote.weight(.semibold)).foregroundStyle(.black)
                                Text(item.2).font(.caption).foregroundStyle(.black.opacity(0.65))
                            }
                            Spacer(minLength: 0)
                            Text("now").font(.caption2).foregroundStyle(.black.opacity(0.45))
                        }
                        .padding(10)
                        .background(.white.opacity(0.92), in: .rect(cornerRadius: 18, style: .continuous))
                        .transition(.asymmetric(insertion: .move(edge: .top).combined(with: .opacity).combined(with: .scale(scale: 0.9, anchor: .top)),
                                                removal: .opacity))
                    }
                }
            }
            .padding(.horizontal, 12)
            Spacer(minLength: 0)
        }
        .frame(width: 250, height: 330)
        .background(
            LinearGradient(colors: [ZB.Palette.greenDeep, ZB.Palette.green, ZB.Palette.mint],
                           startPoint: .topLeading, endPoint: .bottomTrailing),
            in: UnevenRoundedRectangle(topLeadingRadius: 44, bottomLeadingRadius: 0, bottomTrailingRadius: 0,
                                       topTrailingRadius: 44, style: .continuous))
        .overlay(alignment: .top) {
            Capsule().fill(.black).frame(width: 74, height: 22).padding(.top, 10)
        }
        .overlay(
            UnevenRoundedRectangle(topLeadingRadius: 44, bottomLeadingRadius: 0, bottomTrailingRadius: 0,
                                   topTrailingRadius: 44, style: .continuous)
                .strokeBorder(.black.opacity(0.85), lineWidth: 7))
        .mask(LinearGradient(colors: [.black, .black, .clear], startPoint: .top, endPoint: .bottom))
        .scaleEffect(appeared ? 1 : 0.92)
        .opacity(appeared ? 1 : 0)
    }

    private var floaters: some View {
        TimelineView(.animation) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            let spots: [(Contact, CGFloat, CGFloat, CGFloat)] = [
                (SampleData.contact("Kabir"), -150, 90, 40), (SampleData.contact("Sara"), 150, 60, 44),
                (SampleData.contact("Ishaan"), -140, 250, 34), (SampleData.contact("Ananya"), 148, 230, 38),
                (SampleData.contact("Vihaan"), -40, 360, 30), (SampleData.contact("Dev"), 70, 380, 36),
            ]
            ZStack {
                ForEach(spots.indices, id: \.self) { i in
                    let s = spots[i]
                    AvatarView(contact: s.0, size: s.3)
                        .overlay(Circle().strokeBorder(.white, lineWidth: 2))
                        .shadow(color: .black.opacity(0.12), radius: 6, y: 3)
                        .offset(x: s.1, y: s.2 + sin(t * 1.3 + Double(i)) * 5)
                        .scaleEffect(appeared ? 1 : 0)
                        .animation(ZB.Motion.hero.delay(0.2 + Double(i) * 0.06), value: appeared)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
