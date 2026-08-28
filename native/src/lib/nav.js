// The six screens that live inside the bottom-tab navigator rather than the
// root stack. Navigating to one of these by bare name from a pushed screen
// is ambiguous — React Navigation has to resolve the name across navigators
// — and in practice it did not pop the stack, so back buttons that targeted
// a tab silently did nothing.
// Profile isn't a tab any more (see app/(tabs)/_layout.ios.tsx) — it's a
// plain root-stack screen now, so it falls through to the normal
// navigation.navigate(route, params) branch below like any other screen.
const TAB_ROUTES = ["Home", "Market", "Swap", "Card", "Feed"];

/**
 * Navigate to a route that might be either a root-stack screen or a tab,
 * without the caller having to know which. Use this anywhere the
 * destination comes from a variable (KYC's `next` param, deep links)
 * instead of being written out at the call site.
 */
export function goTo(navigation, route, params) {
  if (!route) return;
  if (TAB_ROUTES.includes(route)) {
    navigation.navigate("MainTabs", { screen: route });
    return;
  }
  navigation.navigate(route, params);
}

export { TAB_ROUTES };
