import { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, TabBar, PriceRow, EmptyState, Button, SkeletonList, colors, spacing } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp } from "../state/store";
import { formatCrypto } from "../lib/format";
import { useCurrency } from "../lib/useCurrency";
import { SyncStatus, SyncEmptyState } from "../ui/SyncStatus";

export default function AssetScreen({ navigation }) {
  const { state } = useApp();
  const { currency, money } = useCurrency();
  const holdings = state.wallet.holdings;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets, loading, error, refetch, lastSuccessAt, refreshing, retryAt } = useMarkets(ids, { vs: currency });

  const priced = holdings.map((h) => {
    const m = markets?.find((x) => x.id === h.id);
    const price = m?.current_price ?? 0;
    return { ...h, price, value: price * h.units, changePct: m?.price_change_percentage_24h ?? 0, image: m?.image };
  });
  const total = priced.reduce((s, h) => s + h.value, 0);
  const pricesReady = holdings.length === 0 || markets.length > 0;

  return (
    <Screen scroll={false}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600", marginBottom: spacing.md }}>Your assets</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Assets balance</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 4 }}>
        {pricesReady ? money(total) : "—"}
      </Text>
      <SyncStatus
        lastSuccessAt={lastSuccessAt}
        error={error}
        refreshing={refreshing}
        retryAt={retryAt}
        onRetry={refetch}
        style={{ marginTop: 4, marginBottom: spacing.lg }}
      />

      {holdings.length === 0 ? (
        <EmptyState icon="briefcase" title="Nothing yet" body="Buy or receive your first asset to see it here." />
      ) : error && !markets.length ? (
        <SyncEmptyState
          error={error}
          refreshing={refreshing}
          retryAt={retryAt}
          onRetry={refetch}
          title="Prices are catching up"
          body="Your holdings are safe and unchanged — only the live prices are waiting on the feed."
        />
      ) : loading && !markets.length ? (
        <View style={{ marginTop: spacing.sm }}><SkeletonList count={holdings.length} /></View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={priced}
          keyExtractor={(h) => h.id}
          renderItem={({ item: h }) => (
            <PriceRow symbol={h.symbol} name={h.name} price={h.price} changePct={h.changePct} holding={formatCrypto(h.units, h.symbol.toUpperCase())} iconUrl={h.image} currency={currency} onPress={() => navigation.navigate("CoinDetail", { id: h.id })} />
          )}
        />
      )}
    </Screen>
  );
}
