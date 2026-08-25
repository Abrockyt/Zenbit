import { useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl } from "react-native";
import { useApp } from "../state/store";
import { useMarkets } from "../data/useCoinGecko";

/**
 * Ported from src/pages/Home.jsx (web).
 *
 * The web version has a scroll-linked blurring header (Framer Motion +
 * backdrop-filter) and a bunch of glass/liquid effects that don't have an
 * RN equivalent without extra libraries — dropped for this first pass in
 * favour of a plain header. What's real and unchanged: the shared
 * AppContext store, the live useMarkets(...) call against the actual
 * CoinGecko API, and the same balance-from-holdings math as the web app.
 */
export default function HomeScreen() {
  const { state } = useApp();
  const user = state.session.user;
  const holdings = state.wallet.holdings;

  const { data: markets, loading, error } = useMarkets(null, { vs: "usd" });

  const priced = useMemo(
    () =>
      holdings.map((h) => {
        const m = markets?.find((x) => x.id === h.id);
        const price = m?.current_price ?? 0;
        return { ...h, price, value: price * h.units, changePct: m?.price_change_percentage_24h ?? 0 };
      }),
    [holdings, markets]
  );

  const total = priced.reduce((s, h) => s + h.value, 0);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {user?.name ? user.name.split(" ")[0].toLowerCase() : "user"}crypto
        </Text>
      </View>

      <View style={styles.balanceBlock}>
        <Text style={styles.balanceLabel}>Total balance</Text>
        <Text style={styles.balanceValue}>
          {total ? `$${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
        </Text>
        {error && <Text style={styles.errorText}>Couldn't refresh prices — showing last known values.</Text>}
        {loading && !markets?.length && <Text style={styles.loadingText}>Loading live prices…</Text>}
      </View>

      <FlatList
        data={priced}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor="#3ADE7E" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowUnits}>{item.units} {item.symbol.toUpperCase()}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>${item.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}</Text>
              <Text style={[styles.rowChange, item.changePct >= 0 ? styles.positive : styles.negative]}>
                {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050a08" },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  greeting: { color: "#fff", fontSize: 15, fontWeight: "500" },
  balanceBlock: { paddingHorizontal: 20, paddingBottom: 16 },
  balanceLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  balanceValue: { color: "#fff", fontSize: 34, fontWeight: "700", marginTop: 4 },
  errorText: { color: "#e2725b", fontSize: 12, marginTop: 6 },
  loadingText: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 6 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowName: { color: "#fff", fontSize: 15, fontWeight: "500" },
  rowUnits: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  rowValue: { color: "#fff", fontSize: 15, fontWeight: "500" },
  rowChange: { fontSize: 12, marginTop: 2 },
  positive: { color: "#3ADE7E" },
  negative: { color: "#e2725b" },
});
