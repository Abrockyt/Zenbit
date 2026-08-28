import { Platform, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Feather } from "../ui/IconCompat";
import { colors, fonts, isLightTheme } from "../theme";
import { useTheme } from "../state/ThemeProvider";

import HomeScreen from "../screens/HomeScreen";
import MarketScreen from "../screens/MarketScreen";
import SwapScreen from "../screens/SwapScreen";
import CardScreen from "../screens/CardScreen";
import FeedScreen from "../screens/social/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const ICONS = { Home: "home", Market: "bar-chart-2", Swap: "repeat", Card: "credit-card", Feed: "users", Profile: "user" };
const LABELS = { Home: "Home", Market: "Market", Swap: "Swap", Card: "Card", Feed: "Social", Profile: "Profile" };

/**
 * The stock React Navigation bottom tab bar, not a hand-built one.
 *
 * A custom floating pill bar (the earlier version of this file) can look
 * good, but it is not what "iOS default" means — the real thing is docked
 * to the bottom edge, uses the platform's own translucent material, shows
 * icon+label the way every stock iOS app does, and gets safe-area/height
 * handling from the framework instead of hand-tuned constants. Achieving
 * that isn't "build a nicer custom bar" — it's "stop building one" and
 * configure the real `Tab.Navigator` the way its own docs do.
 *
 * `tabBarBackground` returning a BlurView is React Navigation's own
 * documented pattern for a translucent iOS tab bar (their docs use this
 * exact expo-blur setup) — same real UIVisualEffectView material as
 * everywhere else in this pass, just wired through the framework's
 * intended extension point instead of a custom-rendered replacement.
 * Android keeps its own real pattern (solid Material surface + elevation,
 * no blur attempt) for the same reason the rest of the glass work does.
 */
export default function MainTabs() {
  // Re-render on a theme switch so tab bar tint/background pick up the new
  // palette — MainTabs itself doesn't get remounted the way an individual
  // Screen's children do, so without consuming this it would stay pinned
  // to whichever theme was active when the tab navigator first mounted.
  useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.up,
        tabBarInactiveTintColor: colors.iconMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 10.5 },
        tabBarIcon: ({ color, size }) => <Feather name={ICONS[route.name]} size={size} color={color} />,
        tabBarLabel: LABELS[route.name],
        tabBarStyle:
          Platform.OS === "ios"
            ? { position: "absolute", backgroundColor: "transparent", borderTopColor: colors.borderSubtle }
            : { backgroundColor: colors.surfaceCardSolid, borderTopColor: colors.borderSubtle, elevation: 8 },
        // iOS: real translucent material behind the stock bar, via the
        // extension point React Navigation designed for exactly this.
        // Android: no tabBarBackground override — the solid tabBarStyle
        // fill above is the whole surface, which is the native Material
        // bottom-nav look, not a blur imitation of the iOS one.
        tabBarBackground:
          Platform.OS === "ios"
            ? () => <BlurView intensity={80} tint={isLightTheme() ? "systemChromeMaterialLight" : "systemThinMaterialDark"} style={StyleSheet.absoluteFillObject} />
            : undefined,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="Swap" component={SwapScreen} />
      <Tab.Screen name="Card" component={CardScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
