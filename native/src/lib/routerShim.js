import { useMemo } from "react";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";

// Every screen component in src/screens was written against the old flat
// React Navigation stack, where the six tab screens lived inside a
// "MainTabs" nested navigator and were reached as
// navigation.navigate("MainTabs", { screen: "X" }) or
// navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] }).
//
// Under expo-router there is no "MainTabs" route any more — the tabs are
// their own top-level paths (/Home, /Market, ...), reached via the router's
// path-based navigation instead of a nested-navigator screen name. Rather
// than hunting down and rewriting every one of those call sites (they're
// spread across ~10 screen files, plus src/lib/nav.js's goTo() helper which
// itself calls navigate("MainTabs", ...)), this shim translates at the one
// seam every screen already goes through: the `navigation` prop. Screens
// keep calling the exact same "MainTabs" API they always did; it just
// resolves correctly now.
export function useShimNavigation() {
  const navigation = useNavigation();
  const router = useRouter();

  return useMemo(() => {
    const navigate = (name, params) => {
      if (name === "MainTabs") {
        const tab = params?.screen ?? "Home";
        router.push({ pathname: `/${tab}`, params: params?.params });
        return undefined;
      }
      return navigation.navigate(name, params);
    };

    const reset = (state) => {
      const target = state?.routes?.[state.index ?? 0]?.name;
      if (target === "MainTabs") {
        router.replace("/Home");
        return undefined;
      }
      return navigation.reset(state);
    };

    // Keep every other method (goBack, setOptions, addListener, ...) as the
    // real navigation object's — only navigate/reset need translating.
    return Object.assign(Object.create(navigation), navigation, { navigate, reset });
  }, [navigation, router]);
}

// Old screens read route.params.<x>; expo-router hands params back via
// useLocalSearchParams() instead of a `route` prop. This wraps it back into
// the { params } shape every screen already expects.
export function useShimRoute() {
  const params = useLocalSearchParams();
  return { params };
}
