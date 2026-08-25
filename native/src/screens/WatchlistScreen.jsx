import { View, FlatList } from "react-native";
import { Screen, Header, PriceRow, EmptyState, Button, SkeletonList, colors, spacing } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp } from "../state/store";

export default function WatchlistScreen({ navigation }) {
  const { state } = useApp();
  const { data: markets, loading, error } = useMarkets(state.watchlist);

  return (
    <Screen scroll={false}>
      <Header title="Watchlist" onBack={() => navigation.goBack()} />
      {error && !markets?.length ? (
        <EmptyState icon="wifi-off" title="Price feed unavailable" body="CoinGecko didn't respond. Pull to refresh or check your connection." />
      ) : loading && !markets?.length ? (
        <View style={{ marginTop: spacing.sm }}><SkeletonList count={6} /></View>
      ) : !markets?.length ? (
        <EmptyState icon="star" title="No coins pinned" body="Pin a coin on its detail page to track it here." />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={markets}
          keyExtractor={(c) => c.id}
          renderItem={({ item: c }) => (
            <PriceRow symbol={c.symbol} name={c.name} price={c.current_price} changePct={c.price_change_percentage_24h ?? 0} iconUrl={c.image} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />
          )}
        />
      )}
      {!markets?.length && !loading && <Button variant="secondary" onPress={() => navigation.navigate("Market")}>Browse market</Button>}
    </Screen>
  );
}
