import { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { Screen, TabBar, PriceRow, EmptyState, Button, colors, spacing } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp } from "../state/store";

export default function AssetScreen({ navigation }) {
  const { state } = useApp();
  const holdings = state.wallet.holdings;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets, loading } = useMarkets(ids);

  const priced = holdings.map((h) => {
    const m = markets?.find((x) => x.id === h.id);
    const price = m?.current_price ?? 0;
    return { ...h, price, value: price * h.units, changePct: m?.price_change_percentage_24h ?? 0, image: m?.image };
  });
  const total = priced.reduce((s, h) => s + h.value, 0);

  return (
    <Screen scroll={false} footer={<TabBar navigation={navigation} active="Asset" />}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600", marginBottom: spacing.md }}>Your assets</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Assets balance</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 4, marginBottom: spacing.lg }}>
        {loading ? "—" : `$${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
      </Text>

      {holdings.length === 0 ? (
        <EmptyState icon="briefcase" title="Nothing yet" body="Buy or receive your first asset to see it here." />
      ) : (
        <FlatList
          data={priced}
          keyExtractor={(h) => h.id}
          renderItem={({ item: h }) => (
            <PriceRow symbol={h.symbol} name={h.name} price={h.price} changePct={h.changePct} holding={`${h.units} ${h.symbol.toUpperCase()}`} iconUrl={h.image} onPress={() => navigation.navigate("CoinDetail", { id: h.id })} />
          )}
        />
      )}
    </Screen>
  );
}
