import { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, TabBar, PriceRow, EmptyState, Button, SkeletonList, colors, spacing } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp } from "../state/store";
import { formatCrypto } from "../lib/format";

export default function AssetScreen({ navigation }) {
  const { state } = useApp();
  const holdings = state.wallet.holdings;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets, loading, error, refetch } = useMarkets(ids);

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
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 4, marginBottom: spacing.lg }}>
        {pricesReady ? `$${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
      </Text>

      {holdings.length === 0 ? (
        <EmptyState icon="briefcase" title="Nothing yet" body="Buy or receive your first asset to see it here." />
      ) : error && !markets.length ? (
        <View style={{ alignItems: "center", paddingVertical: 44, gap: 10 }}>
          <Feather name="wifi-off" size={26} color={colors.textTertiary} />
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>Prices unavailable</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", maxWidth: 260 }}>
            Your holdings are safe — the price feed just didn't respond.
          </Text>
          <View style={{ marginTop: 6, minWidth: 150 }}>
            <Button onPress={refetch}>Try again</Button>
          </View>
        </View>
      ) : loading && !markets.length ? (
        <View style={{ marginTop: spacing.sm }}><SkeletonList count={holdings.length} /></View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={priced}
          keyExtractor={(h) => h.id}
          renderItem={({ item: h }) => (
            <PriceRow symbol={h.symbol} name={h.name} price={h.price} changePct={h.changePct} holding={formatCrypto(h.units, h.symbol.toUpperCase())} iconUrl={h.image} onPress={() => navigation.navigate("CoinDetail", { id: h.id })} />
          )}
        />
      )}
    </Screen>
  );
}
