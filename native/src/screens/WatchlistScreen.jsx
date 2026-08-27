import { View, FlatList, Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, PriceRow, EmptyState, Button, SkeletonList, colors, spacing } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp } from "../state/store";
import { useCurrency } from "../lib/useCurrency";
import { SyncStatus, SyncEmptyState } from "../ui/SyncStatus";

export default function WatchlistScreen({ navigation }) {
  const { state } = useApp();
  const { currency } = useCurrency();
  const { data: markets, loading, error, refetch, lastSuccessAt, refreshing, retryAt } = useMarkets(state.watchlist, { vs: currency });

  return (
    <Screen scroll={false}>
      <Header
        title="Watchlist"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={() => navigation.navigate("PickWatchlist", { mode: "edit" })} hitSlop={8}>
            <Feather name="edit-2" size={17} color={colors.textSecondary} />
          </Pressable>
        }
      />
      {error && !markets?.length ? (
        <SyncEmptyState error={error} refreshing={refreshing} retryAt={retryAt} onRetry={refetch} />
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
            <PriceRow symbol={c.symbol} name={c.name} price={c.current_price} changePct={c.price_change_percentage_24h ?? 0} iconUrl={c.image} currency={currency} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />
          )}
        />
      )}
      {!markets?.length && !loading && <Button variant="secondary" onPress={() => navigation.navigate("MainTabs", { screen: "Market" })}>Browse market</Button>}
    </Screen>
  );
}
