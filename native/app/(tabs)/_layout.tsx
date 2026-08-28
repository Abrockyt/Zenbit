import { View } from "react-native";
import { Tabs } from "expo-router";
import { TabBar } from "../../src/ui/kit";
import { useTheme } from "../../src/state/ThemeProvider";

/**
 * Android (and web) fallback: the floating pill tab bar this app used
 * before the iOS NativeTabs migration — Android has no real equivalent of
 * iOS's UIVisualEffectView material, so rather than fake glass there, it
 * gets its own genuine "floating surface" look (Material elevation) via the
 * same TabBar/GlassPanel pair used everywhere else in the app.
 *
 * iOS gets a completely different file for this layout — app/(tabs)/
 * _layout.ios.tsx, using the real native Liquid Glass NativeTabs — Metro's
 * platform-extension resolution picks that one for iOS automatically and
 * falls back to this plain _layout.tsx for every other platform, so no
 * runtime Platform.select branching is needed here.
 *
 * The built-in tab bar is hidden (tabBarStyle: display none) since `layout`
 * renders TabBar in its place, positioned over `children` (the active
 * screen) exactly like it always was.
 */
export default function TabLayout() {
  // Re-render on a theme switch so the pill's tint/border follow the
  // palette — this layout doesn't get remounted the way an individual
  // Screen's children do, so without consuming this it would stay pinned
  // to whichever theme was active on first mount.
  useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      layout={({ state, navigation, children }) => (
        <View style={{ flex: 1 }}>
          {children}
          <TabBar navigation={navigation} active={state.routeNames[state.index]} />
        </View>
      )}
    >
      <Tabs.Screen name="Home" />
      <Tabs.Screen name="Market" />
      <Tabs.Screen name="Swap" />
      <Tabs.Screen name="Card" />
      <Tabs.Screen name="Feed" />
    </Tabs>
  );
}
