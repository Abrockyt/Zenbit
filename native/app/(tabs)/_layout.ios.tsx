import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "../../src/theme";
import { useTheme } from "../../src/state/ThemeProvider";

/**
 * iOS only (Metro picks this file over the plain _layout.tsx on iOS via the
 * .ios. platform extension). The real native iOS 26 Liquid Glass tab bar —
 * a genuine UITabBarController-backed bar, not a hand-built BlurView
 * imitation — via expo-router/unstable-native-tabs, the only way to get it
 * since it's tied to file-based routing rather than a component you can
 * drop into a classic @react-navigation stack.
 *
 * Android and web fall through to the plain _layout.tsx in this folder,
 * which renders the app's own floating pill TabBar instead — Android has
 * no real equivalent of iOS's glass material, so it keeps its own look
 * rather than an imitation of this one.
 *
 * Route names below (Home, Market, Swap, Card, Feed) are the tab screen
 * filenames in this folder — they also have to match every bare
 * navigation.navigate("Card")-style call already in the screens themselves,
 * since sibling-tab navigation by name still works the same way it did
 * under the old Tab.Navigator.
 *
 * Only 5 tabs, deliberately: iOS's real UITabBarController shows tabs 1-4
 * directly and collapses tab 5+ into a system "More" screen once there are
 * more than 5 — with the earlier 6th tab (Profile) that pushed Feed/Social
 * behind "More" too. Profile is reachable from the avatar in Home's header
 * and its own settings icon instead (a root-stack push, not a tab), which
 * keeps Social as a directly-visible tab and avoids the native bar ever
 * needing to collapse anything.
 */
export default function TabLayout() {
  // Re-render on a theme switch so the tint colour follows the palette.
  useTheme();

  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={colors.up}>
      {/* disableAutomaticContentInsets on every trigger: the native tab
          controller applies its own top/bottom safe-area content insets by
          default, on top of the ones this app's own <Screen>/SafeAreaView
          already computes in JS for every screen — the double-inset is what
          pushed Home's content (and its absolutely-positioned compact
          scroll header) down well past where it should sit. Screen already
          handles safe areas correctly on its own, so the native side's
          automatic version is redundant here. */}
      <NativeTabs.Trigger name="Home" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Market" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} md="bar_chart" />
        <NativeTabs.Trigger.Label>Market</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Swap" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf="arrow.triangle.2.circlepath" md="swap_horiz" />
        <NativeTabs.Trigger.Label>Swap</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Card" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} md="credit_card" />
        <NativeTabs.Trigger.Label>Card</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Feed" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} md="groups" />
        <NativeTabs.Trigger.Label>Social</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
