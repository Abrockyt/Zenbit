import { FlatList, Text } from "react-native";
import { Screen, Header, PriceRow, EmptyState, Button, colors } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp } from "../state/store";

export default function WatchlistScreen({ navigation }) {
  const { state } = useApp();
  const { data: markets, loading } = useMarkets(state.watchlist);

  return (
    <Screen scroll={false}>
      <Header title="Watchlist" onBack={() => navigation.goBack()} />
      {loading ? (
        <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Loading…</Text>
      ) : !markets?.length ? (
        <EmptyState icon="star" title="No coins pinned" body="Pin a coin on its detail page to track it here." />
      ) : (
        <FlatList
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
