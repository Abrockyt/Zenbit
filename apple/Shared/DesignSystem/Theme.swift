import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// MARK: - Zenbit design tokens
//
// Colour hierarchy (brief): light = white → green → black, dark = black → green → white.
// The brand green is the *same* fill in both appearances; only text-on-canvas greens
// shift so they keep WCAG AA contrast (≥ 4.5:1) against white or black.

enum ZB {
    // MARK: Colour
    enum Palette {
        /// Dominant colour. White in light, true black in dark (OLED-friendly, mirrors the brief).
        static let canvas = Color.adaptive(light: 0xFFFFFF, dark: 0x000000)
        /// Grouped/secondary background (cards sitting on canvas).
        static let surface = Color.adaptive(light: 0xF3F6F4, dark: 0x101312)
        /// Elevated card on top of `surface`.
        static let raised = Color.adaptive(light: 0xFFFFFF, dark: 0x1A1D1C)
        static let hairline = Color.adaptive(light: 0xE3E8E5, dark: 0x262A28)

        /// Primary text: black in light, white in dark.
        static let ink = Color.adaptive(light: 0x0B0D0C, dark: 0xFFFFFF)
        static let inkSecondary = Color.adaptive(light: 0x5F6662, dark: 0x9BA39F)
        static let inkTertiary = Color.adaptive(light: 0x9AA29E, dark: 0x5E6662)

        /// Brand green – identical in both appearances. Use as a fill with `onGreen` labels.
        static let green = Color(hex: 0x00C46A)
        /// Deeper green for gradients / pressed states.
        static let greenDeep = Color(hex: 0x00924F)
        /// Mint highlight used sparingly in AI glow + 3D coin speculars.
        static let mint = Color(hex: 0x7CF5C0)
        /// Green for *text* on canvas (5.0:1 on white, 9.1:1 on black).
        static let greenInk = Color.adaptive(light: 0x00804A, dark: 0x1FD67F)
        /// Tinted background for green chips/icons.
        static let greenSoft = Color.adaptive(light: 0xE4F8EE, dark: 0x0A2618)
        /// Label colour on a green fill (9.1:1).
        static let onGreen = Color(hex: 0x000000)

        /// Chrome accent (selected tab, links in AI). Indigo – deliberately not the money green.
        static let accent = Color.adaptive(light: 0x4338CA, dark: 0x9A9BFF)

        static let danger = Color.adaptive(light: 0xE5372C, dark: 0xFF5147)
        static let dangerSoft = Color.adaptive(light: 0xFDECEA, dark: 0x2E0F0D)
        static let warning = Color.adaptive(light: 0xB86E00, dark: 0xFFB340)
        static let warningSoft = Color.adaptive(light: 0xFFF4E0, dark: 0x2E2108)
    }

    // MARK: Spacing – 4 pt base, 8 pt grid (Apple layout margins are 16/20 pt)
    enum Space {
        static let xxs: CGFloat = 4
        static let xs: CGFloat = 8
        static let sm: CGFloat = 12
        static let md: CGFloat = 16
        static let lg: CGFloat = 20
        static let xl: CGFloat = 24
        static let xxl: CGFloat = 32
        static let xxxl: CGFloat = 48
        /// Screen edge margin (HIG: 16 pt compact, 20 pt+ regular).
        static let margin: CGFloat = 20
    }

    // MARK: Corner radius (always `.continuous`, Apple squircle)
    enum Radius {
        static let sm: CGFloat = 12
        static let md: CGFloat = 16
        static let lg: CGFloat = 22
        static let xl: CGFloat = 30
    }

    /// Minimum hit target (HIG 44×44 pt, Fitts's law).
    static let minTarget: CGFloat = 44

    // MARK: Motion – springs tuned to feel like system UI
    enum Motion {
        /// Taps, toggles, chips.
        static let snappy = Animation.spring(response: 0.28, dampingFraction: 0.86)
        /// Default screen-level movement.
        static let standard = Animation.spring(response: 0.42, dampingFraction: 0.84)
        /// Hero / celebratory moments (a touch of bounce).
        static let hero = Animation.spring(response: 0.62, dampingFraction: 0.74)
        /// Dynamic-Island-like morph.
        static let island = Animation.spring(response: 0.5, dampingFraction: 0.78)
    }
}

// MARK: - Typography (SF Pro / SF Pro Rounded via the system font so Dynamic Type works)
extension Font {
    static let zbAmountHero = Font.system(size: 64, weight: .semibold, design: .rounded)
    static let zbAmountLarge = Font.system(size: 40, weight: .semibold, design: .rounded)
    static let zbAmount = Font.system(.title2, design: .rounded).weight(.semibold)
    static let zbAmountRow = Font.system(.body, design: .rounded).weight(.semibold)
}

// MARK: - Colour helpers
extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255,
                  opacity: alpha)
    }

    /// Light/dark pair. With Increase Contrast on, text-like colours are pushed toward
    /// pure black/white (HIG: every custom colour needs an increased-contrast variant).
    static func adaptive(light: UInt32, dark: UInt32) -> Color {
        #if os(iOS)
        return Color(UIColor { trait in
            let isDark = trait.userInterfaceStyle == .dark
            let base = UIColor(rgb: isDark ? dark : light)
            guard trait.accessibilityContrast == .high else { return base }
            var h: CGFloat = 0, s: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            base.getHue(&h, saturation: &s, brightness: &b, alpha: &a)
            // Backgrounds (very light in light mode / very dark in dark mode) stay put.
            if (!isDark && b > 0.9 && s < 0.1) || (isDark && b < 0.15) { return base }
            return UIColor(hue: h, saturation: s, brightness: isDark ? min(1, b * 1.25) : b * 0.7, alpha: a)
        })
        #else
        return Color(hex: dark) // watchOS is always dark
        #endif
    }
}

#if canImport(UIKit)
extension UIColor {
    convenience init(rgb: UInt32) {
        self.init(red: CGFloat((rgb >> 16) & 0xFF) / 255,
                  green: CGFloat((rgb >> 8) & 0xFF) / 255,
                  blue: CGFloat(rgb & 0xFF) / 255,
                  alpha: 1)
    }
}
#endif

// MARK: - Reusable modifiers
extension View {
    /// Card surface with Apple's continuous corners.
    func zbCard(radius: CGFloat = ZB.Radius.lg, fill: Color = ZB.Palette.raised) -> some View {
        background(fill, in: .rect(cornerRadius: radius, style: .continuous))
    }

    /// Gentle press feedback for custom buttons.
    func zbPressable() -> some View { buttonStyle(ZBPressStyle()) }
}

struct ZBPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .contentShape(.rect)
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(ZB.Motion.snappy, value: configuration.isPressed)
    }
}

/// Primary call-to-action: brand-green capsule, black label, full width, 54 pt tall.
struct ZBPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(isEnabled ? ZB.Palette.onGreen : ZB.Palette.inkTertiary)
            .frame(maxWidth: .infinity, minHeight: 54)
            .background(isEnabled ? ZB.Palette.green : ZB.Palette.surface, in: .capsule)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(ZB.Motion.snappy, value: configuration.isPressed)
            .animation(ZB.Motion.snappy, value: isEnabled)
    }
}

/// Secondary: ink outline-free tinted capsule.
struct ZBSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(ZB.Palette.ink)
            .frame(maxWidth: .infinity, minHeight: 54)
            .background(ZB.Palette.surface, in: .capsule)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(ZB.Motion.snappy, value: configuration.isPressed)
    }
}

/// Neutral call-to-action (onboarding "Continue", "Done"): ink pill – black in light, white in dark.
/// Green stays reserved for money-moving actions (Pay, Request), so it keeps its meaning.
struct ZBInkButtonStyle: ButtonStyle {
    var fullWidth = true
    @Environment(\.isEnabled) private var isEnabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(ZB.Palette.canvas)
            .padding(.horizontal, fullWidth ? 0 : 32)
            .frame(maxWidth: fullWidth ? .infinity : nil, minHeight: 52)
            .background(ZB.Palette.ink.opacity(isEnabled ? 1 : 0.25), in: .capsule)
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(ZB.Motion.snappy, value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == ZBInkButtonStyle {
    static var zbInk: ZBInkButtonStyle { .init() }
    static var zbInkCompact: ZBInkButtonStyle { .init(fullWidth: false) }
}

extension ButtonStyle where Self == ZBPrimaryButtonStyle {
    static var zbPrimary: ZBPrimaryButtonStyle { .init() }
}
extension ButtonStyle where Self == ZBSecondaryButtonStyle {
    static var zbSecondary: ZBSecondaryButtonStyle { .init() }
}
