import { useState } from "react";
import { View, Text, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, Chip, IconButton, Skeleton, colors, spacing, radius, fonts } from "../ui/kit";
import CandlestickChart from "../ui/CandlestickChart";
import { useCoinDetail, useCoinOHLC } from "../data/useCoinGecko";
import { useApp, useToast } from "../state/store";
import { formatPct } from "../lib/format";

/**
 * Ported from src/pages/CoinDetail.jsx (web), redone with a real candlestick
 * chart (see ui/CandlestickChart.jsx) instead of a plain price line — built
 * from CoinGecko's actual OHLC series, not synthetic data. The web version
 * also has a fake order book and a "Trading Data" tab of randomly-generated
 * numbers — still dropped here, since neither is real data and CoinGecko's
 * free tier has no real per-candle volume or order-book endpoint to back
 * them with. Kept: live price/detail, the range chart, watchlist toggle,
 * and Buy/Sell. `days` values are CoinGecko's actual OHLC granularity
 * buckets — 1 day returns 30-minute candles, 7-30 returns 4-hour candles,
 * 365 returns 4-day candles.
 */
const RANGES = [{ label: "24H", days: 1 }, { label: "7D", days: 7 }, { label: "30D", days: 30 }, { label: "1Y", days: 365 }];

export default function CoinDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [range, setRange] = useState(1);
  const [tab, setTab] = useState("Price");

  const watched = state.watchlist.includes(id);
  const { data: coin, loading, error } = useCoinDetail(id);
  const { data: candles } = useCoinOHLC(id, range);

  const toggleWatch = () => {
    dispatch({ type: "watchlist/toggle", id });
    toast(watched ? `Removed ${coin?.symbol?.toUpperCase() ?? "coin"} from watchlist.` : `Added ${coin?.symbol?.toUpperCase() ?? "coin"} to watchlist.`);
  };

  const price = coin?.market_data?.current_price?.usd;
  const changePct = coin?.market_data?.price_change_percentage_24h ?? 0;
  const up = changePct >= 0;

  return (
    <Screen footer={
      <View style={{ flexDirection: "row", gap: spacing.md, padding: spacing.lg }}>
        <Button style={{ flex: 1 }} onPress={() => navigation.navigate("Buy")}>Buy</Button>
        <Button style={{ flex: 1 }} variant="danger" onPress={() => navigation.navigate("Sell")}>Sell</Button>
      </View>
    }>
      <Header
        title={coin ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {coin.image?.small ? <Image source={{ uri: coin.image.small }} style={{ width: 22, height: 22, borderRadius: 11 }} /> : null}
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "600" }}>{coin.symbol?.toUpperCase()}/USD</Text>
          </View>
        ) : "—"}
        onBack={() => navigation.goBack()}
        right={<IconButton icon="star" onPress={toggleWatch} size={18} />}
      />

      {error ? (
        <Text style={{ color: colors.textTertiary, textAlign: "center", paddingVertical: 40 }}>Couldn't load this coin. Try again shortly.</Text>
      ) : loading || !coin ? (
        <View style={{ padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md }}>
            <View style={{ gap: 8 }}>
              <Skeleton width={140} height={30} />
              <Skeleton width={80} height={14} />
            </View>
            <View style={{ gap: 8, alignItems: "flex-end" }}>
              <Skeleton width={90} height={12} />
              <Skeleton width={90} height={12} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: spacing.md }}>
            {RANGES.map((r) => <Skeleton key={r.label} width={48} height={28} radius={radius.pill} />)}
          </View>
          <Skeleton width="100%" height={220} radius={radius.md} />
        </View>
      ) : (
        <View>
          <View style={{ padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md }}>
              <View>
                <Text style={{ color: up ? colors.up : colors.down, fontSize: 34, fontWeight: "700" }}>${price?.toLocaleString("en-US", { maximumFractionDigits: 2 })}</Text>
                <Text style={{ color: up ? colors.up : colors.down, fontSize: 14, marginTop: 4 }}>{up ? "▲" : "▼"} {formatPct(Math.abs(changePct))}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>24h High ${coin.market_data?.high_24h?.usd?.toLocaleString()}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 2 }}>24h Low ${coin.market_data?.low_24h?.usd?.toLocaleString()}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
              {RANGES.map((r) => <Chip key={r.label} label={r.label} active={range === r.days} onPress={() => setRange(r.days)} />)}
            </View>

            <CandlestickChart candles={candles} />
          </View>

          <View style={{ flexDirection: "row", gap: 20, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, paddingBottom: 10, marginBottom: spacing.md }}>
            {["Price", "Info"].map((t) => (
              <Text key={t} onPress={() => setTab(t)} style={{ color: tab === t ? colors.textPrimary : colors.textTertiary, fontWeight: tab === t ? "600" : "500" }}>{t}</Text>
            ))}
          </View>

          {tab === "Info" && (
            <View style={{ padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: spacing.md }}>
                {coin.name} ({coin.symbol?.toUpperCase()}) is a digital asset. Market cap is ranked #{coin.market_cap_rank}.
              </Text>
              {[
                ["Market Cap", `$${coin.market_data?.market_cap?.usd?.toLocaleString()}`],
                ["Circulating Supply", coin.market_data?.circulating_supply?.toLocaleString()],
              ].map(([k, v]) => (
                <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                  <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{k}</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{v}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
