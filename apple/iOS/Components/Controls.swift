import SwiftUI

// MARK: - Numeric keypad (Fitts's law: 64 pt rows, full-width columns, thumb zone)

enum KeypadKey: Hashable {
    case digit(Int), dot, delete
}

struct Keypad: View {
    var showsDot = true
    /// 76 is the iOS passcode size; the amount screen passes a smaller one so everything fits.
    var keySize: CGFloat = 76
    var onKey: (KeypadKey) -> Void

    private let rows: [[KeypadKey?]] = [
        [.digit(1), .digit(2), .digit(3)],
        [.digit(4), .digit(5), .digit(6)],
        [.digit(7), .digit(8), .digit(9)],
        [.dot, .digit(0), .delete],
    ]
    private static let letters = [2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ"]

    /// The iOS Phone-app dial pad: round keys, letters under the digits, even fixed spacing.
    var body: some View {
        VStack(spacing: keySize < 70 ? 8 : 14) {
            ForEach(rows.indices, id: \.self) { r in
                HStack(spacing: keySize < 70 ? 18 : 22) {
                    ForEach(rows[r].indices, id: \.self) { c in
                        key(rows[r][c])
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder private func key(_ k: KeypadKey?) -> some View {
        if let k, !(k == .dot && !showsDot) {
            Button { onKey(k) } label: {
                Group {
                    switch k {
                    case .digit(let d):
                        VStack(spacing: -1) {
                            Text("\(d)").font(.system(size: keySize < 70 ? 28 : 34, weight: .regular))
                            if let l = Self.letters[d] {
                                Text(l).font(.system(size: 10, weight: .semibold)).tracking(1.5).foregroundStyle(ZB.Palette.inkSecondary)
                            }
                        }
                    case .dot: Text(".").font(.system(size: 34, weight: .semibold))
                    case .delete: Image(systemName: "delete.left").font(.system(size: 24, weight: .regular))
                    }
                }
                .foregroundStyle(ZB.Palette.ink)
                .frame(width: keySize, height: keySize)
                .contentShape(.circle)
            }
            .buttonStyle(KeyStyle(filled: k != .delete))
            .accessibilityLabel(label(k))
        } else {
            Color.clear.frame(width: keySize, height: keySize)
        }
    }

    private func label(_ k: KeypadKey) -> String {
        switch k {
        case .digit(let d): "\(d)"
        case .dot: "Decimal point"
        case .delete: "Delete"
        }
    }

    private struct KeyStyle: ButtonStyle {
        var filled = true
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .background(Circle().fill(filled ? ZB.Palette.surface : .clear)
                    .overlay(Circle().fill(ZB.Palette.ink.opacity(configuration.isPressed ? 0.12 : 0))))
                .scaleEffect(configuration.isPressed ? 0.95 : 1)
                .animation(ZB.Motion.snappy, value: configuration.isPressed)
        }
    }
}

// MARK: - PIN dots with shake

struct PinDots: View {
    var count: Int
    var length = Limits.pinLength
    var error = false

    var body: some View {
        HStack(spacing: ZB.Space.lg) {
            ForEach(0..<length, id: \.self) { i in
                Circle()
                    .fill(i < count ? (error ? ZB.Palette.danger : ZB.Palette.ink) : Color.clear)
                    .overlay(Circle().strokeBorder(error ? ZB.Palette.danger : ZB.Palette.inkTertiary, lineWidth: 1.5))
                    .frame(width: 16, height: 16)
                    .scaleEffect(i < count ? 1.0 : 0.86)
                    .animation(ZB.Motion.snappy, value: count)
            }
        }
        .accessibilityElement()
        .accessibilityLabel("\(count) of \(length) digits entered")
    }
}

/// Horizontal shake used for wrong PIN / invalid input (GeometryEffect, no layout jank).
struct Shake: GeometryEffect {
    var amount: CGFloat = 10
    var shakes: CGFloat = 3
    var animatableData: CGFloat
    func effectValue(size: CGSize) -> ProjectionTransform {
        ProjectionTransform(CGAffineTransform(translationX: amount * sin(animatableData * .pi * shakes * 2), y: 0))
    }
}

// MARK: - Glass circular icon button (Liquid Glass, 44 pt)

struct GlassIconButton: View {
    let systemName: String
    var label: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(ZB.Palette.ink)
                .frame(width: ZB.minTarget, height: ZB.minTarget)
        }
        .buttonStyle(.plain)
        .glassEffect(.regular.interactive(), in: .circle)
        .accessibilityLabel(label)
    }
}

// MARK: - Section header

struct SectionHeader: View {
    let title: String
    var action: String? = nil
    var onAction: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.title3.weight(.semibold)).foregroundStyle(ZB.Palette.ink)
            Spacer()
            if let action, let onAction {
                Button(action, action: onAction)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(ZB.Palette.greenInk)
                    .frame(minHeight: ZB.minTarget)
            }
        }
        .accessibilityAddTraits(.isHeader)
    }
}

// MARK: - Icon tile (compact SF Symbol on soft green square)

struct IconTile: View {
    let symbol: String
    var size: CGFloat = 52
    var prominent = false

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: size * 0.36, weight: .semibold))
            .symbolRenderingMode(.hierarchical)
            .foregroundStyle(prominent ? ZB.Palette.onGreen : ZB.Palette.greenInk)
            .frame(width: size, height: size)
            .background(prominent ? ZB.Palette.green : ZB.Palette.greenSoft,
                        in: .rect(cornerRadius: size * 0.32, style: .continuous))
    }
}

// MARK: - Copy row (label · value · copy button)

struct CopyRow: View {
    @Environment(AppModel.self) private var model
    let title: String
    let value: String
    var mono = true

    var body: some View {
        HStack(spacing: ZB.Space.sm) {
            VStack(alignment: .leading, spacing: 5) {
                Text(title).font(.footnote).foregroundStyle(ZB.Palette.inkSecondary)
                Text(value)
                    .font(mono ? .body.monospaced() : .body)
                    .foregroundStyle(ZB.Palette.ink)
                    .textSelection(.enabled)
            }
            Spacer()
            Button {
                Clipboard.copy(value, label: title, model: model)
            } label: {
                Image(systemName: "doc.on.doc")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(ZB.Palette.inkSecondary)
                    .frame(width: ZB.minTarget, height: ZB.minTarget)
            }
            .accessibilityLabel("Copy \(title)")
        }
        .padding(.vertical, ZB.Space.sm)
    }
}

// MARK: - Slide to confirm (reference: "Swipe to top up")

/// Deliberate gesture for moving money: harder to trigger by accident than a tap (error prevention),
/// with a fill that follows the thumb, a shimmering hint, and a haptic tick on completion.
/// VoiceOver users get a standard activate action.
struct SlideToConfirm: View {
    let title: String
    var enabled = true
    var onConfirm: () -> Void

    @State private var drag: CGFloat = 0
    @State private var done = false
    @State private var tick = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        GeometryReader { geo in
            let knob: CGFloat = 48
            let maxX = max(1, geo.size.width - knob - 8)
            let progress = drag / maxX
            ZStack(alignment: .leading) {
                Capsule().fill(ZB.Palette.surface)
                Capsule()
                    .fill(LinearGradient(colors: [ZB.Palette.green.opacity(0.15), ZB.Palette.green],
                                         startPoint: .leading, endPoint: .trailing))
                    .frame(width: drag + knob + 8)
                    .opacity(enabled ? 1 : 0)
                ShimmerText(text: title, active: enabled && !reduceMotion)
                    .frame(maxWidth: .infinity)
                    .padding(.leading, knob)
                    .opacity(enabled ? Double(1 - progress * 1.6) : 0.5)
                Circle()
                    .fill(enabled ? ZB.Palette.green : ZB.Palette.inkTertiary.opacity(0.4))
                    .frame(width: knob, height: knob)
                    .overlay {
                        Image(systemName: done ? "checkmark" : "arrow.right")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(ZB.Palette.onGreen)
                            .contentTransition(.symbolEffect(.replace))
                    }
                    .shadow(color: .black.opacity(0.15), radius: 6, y: 3)
                    .offset(x: 4 + drag)
                    .gesture(
                        DragGesture(minimumDistance: 2)
                            .onChanged { v in
                                guard enabled, !done else { return }
                                drag = min(max(0, v.translation.width), maxX)
                            }
                            .onEnded { _ in
                                guard enabled, !done else { return }
                                if drag > maxX * 0.82 {
                                    withAnimation(ZB.Motion.snappy) { drag = maxX; done = true }
                                    tick += 1
                                    Task { @MainActor in
                                        try? await Task.sleep(for: .milliseconds(220))
                                        onConfirm()
                                    }
                                } else {
                                    withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) { drag = 0 }
                                }
                            }
                    )
            }
        }
        .frame(height: 56)
        .sensoryFeedback(.success, trigger: tick)
        .accessibilityElement()
        .accessibilityLabel(title)
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { if enabled { onConfirm() } }
    }
}

/// Text with a soft light band sweeping across it.
struct ShimmerText: View {
    let text: String
    var active: Bool
    var body: some View {
        TimelineView(.animation(paused: !active)) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 2.2) / 2.2
            Text(text)
                .font(.headline)
                .foregroundStyle(ZB.Palette.inkSecondary)
                .overlay {
                    Text(text).font(.headline).foregroundStyle(ZB.Palette.ink)
                        .mask(
                            LinearGradient(colors: [.clear, .black, .clear], startPoint: .leading, endPoint: .trailing)
                                .frame(width: 80)
                                .offset(x: CGFloat(t) * 360 - 180)
                        )
                        .opacity(active ? 1 : 0)
                }
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
    }
}
