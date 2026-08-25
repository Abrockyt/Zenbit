import { useMemo } from "react";
import { View, Text, FlatList } from "react-native";
import { Screen, TabBar, PriceRow, IconButton, colors, spacing } from "../ui/kit";
import { useApp } from "../state/store";
import { useMarkets } from "../data/useCoinGecko";

/**
 * Ported from src/pages/Home.jsx (web). Dropped the scroll-linked blurring
 * header (Framer Motion + backdrop-filter, no direct RN equivalent) for a
 * plain header. Everything else is real: shared AppContext state, live
 * useMarkets(...) against the actual CoinGecko API, same balance math.
 */
export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const user = state.session.user;
  const holdings = state.wallet.holdings;

  const { data: markets, loading, error } = useMarkets(null, { vs: "usd" });

  const priced = useMemo(
    () => holdings.map((h) => {
      const m = markets?.find((x) => x.id === h.id);
      const price = m?.current_price ?? 0;
      return { ...h, price, value: price * h.units, changePct: m?.price_change_percentage_24h ?? 0, image: m?.image };
    }),
    [holdings, markets]
  );
  const total = priced.reduce((s, h) => s + h.value, 0);

  return (
    <Screen scroll={false} footer={<TabBar navigation={navigation} active="Home" />}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: spacing.md }}>
        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "500" }}>
          {user?.name ? user.name.split(" ")[0].toLowerCase() : "user"}crypto
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <IconButton icon="bell" onPress={() => navigation.navigate("RecentActivity")} badge={state.wallet.transactions.some((t) => t.status === "pending")} />
          <IconButton icon="search" onPress={() => navigation.navigate("Market")} />
        </View>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Total balance</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 34, fontWeight: "700", marginTop: 4, marginBottom: spacing.lg }}>
        {total ? `$${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
      </Text>
      {error && <Text style={{ color: colors.down, fontSize: 12, marginBottom: spacing.sm }}>Couldn't refresh prices — showing last known values.</Text>}
      {loading && !markets?.length && <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: spacing.sm }}>Loading live prices…</Text>}

      <FlatList
        data={priced}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PriceRow symbol={item.symbol} name={item.name} price={item.price} changePct={item.changePct} holding={`${item.units} ${item.symbol.toUpperCase()}`} iconUrl={item.image} onPress={() => navigation.navigate("CoinDetail", { id: item.id })} />
        )}
      />
    </Screen>
  );
}
