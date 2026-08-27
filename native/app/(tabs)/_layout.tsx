import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "../../src/theme";
import { useTheme } from "../../src/state/ThemeProvider";

/**
 * The real native iOS 26 Liquid Glass tab bar (a genuine
 * UITabBarController-backed bar, not a hand-built BlurView imitation) and
 * Android's own Material 3 bar — expo-router/unstable-native-tabs is the
 * only way to get either, since it's tied to file-based routing rather than
 * a component you can drop into a classic @react-navigation stack.
 *
 * Route names below (Home, Market, Swap, Card, Feed, Profile) are the tab
 * screen filenames in this folder — they also have to match every bare
 * navigation.navigate("Card")-style call already in the screens themselves,
 * since sibling-tab navigation by name still works the same way it did
 * under the old Tab.Navigator.
 */
export default function TabLayout() {
  // Re-render on a theme switch so the tint colour follows the palette.
  useTheme();

  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={colors.up}>
      <NativeTabs.Trigger name="Home">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Market">
        <NativeTabs.Trigger.Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} md="bar_chart" />
        <NativeTabs.Trigger.Label>Market</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Swap">
        <NativeTabs.Trigger.Icon sf="arrow.triangle.2.circlepath" md="swap_horiz" />
        <NativeTabs.Trigger.Label>Swap</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Card">
        <NativeTabs.Trigger.Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} md="credit_card" />
        <NativeTabs.Trigger.Label>Card</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Feed">
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} md="groups" />
        <NativeTabs.Trigger.Label>Social</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Profile">
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
