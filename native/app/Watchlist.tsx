import Screen from "../src/screens/WatchlistScreen";
import { useShimNavigation, useShimRoute } from "../src/lib/routerShim";

export default function Route() {
  const navigation = useShimNavigation();
  const route = useShimRoute();
  return <Screen navigation={navigation} route={route} />;
}
