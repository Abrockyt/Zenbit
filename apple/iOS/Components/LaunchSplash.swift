import SwiftUI

/// Cold start, the way official apps do it: plain white with only the static black Zenbit mark – identical to the
/// system launch screen (`UILaunchScreen` = white + `LaunchLogo`, 148 pt wide) so nothing jumps or animates.
/// It simply hands over to the wireframe (returning users) or onboarding.
struct LaunchSplash: View {
    var body: some View {
        ZStack {
            Color.white
            ZenbitLogoGlyph().fill(Color.black).frame(width: 148, height: 146.7)
        }
        .ignoresSafeArea()      // centre on the full screen, exactly like the system launch image
        .accessibilityLabel("Zenbit")
    }
}

#Preview { LaunchSplash() }
