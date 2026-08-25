import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabBar } from "../ui/kit";

import HomeScreen from "../screens/HomeScreen";
import MarketScreen from "../screens/MarketScreen";
import SwapScreen from "../screens/SwapScreen";
import CardScreen from "../screens/CardScreen";
import FeedScreen from "../screens/social/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

// The six tab-root screens used to each be plain Stack.Screens with the
// TabBar hand-rendered as their own footer — so tapping a tab actually
// pushed a brand-new screen onto the stack (the "sliding, new screen
// covers the old one" behavior), and the stack grew one entry deeper every
// tap instead of switching between a fixed set of roots. A real bottom tab
// navigator switches between mounted screens instantly with no push
// transition, and our existing TabBar component becomes the tab bar itself
// via the `tabBar` render prop instead of being rendered manually per
// screen (removed from each screen's own JSX).
export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ navigation, state }) => <TabBar navigation={navigation} active={state.routeNames[state.index]} />}
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
