import Screen from "../src/screens/CardDetailScreen";
import { useShimNavigation, useShimRoute } from "../src/lib/routerShim";

export default function Route() {
  const navigation = useShimNavigation();
  const route = useShimRoute();
  return <Screen navigation={navigation} route={route} />;
}
