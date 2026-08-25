import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View, Text, Image, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { Screen, Button, IconButton, Skeleton, Avatar, colors, spacing, radius, fonts } from "../ui/kit";
import CandlestickChart from "../ui/CandlestickChart";
import { useCoinDetail, useCoinOHLC, useCoinVolume, useCoinTickers } from "../data/useCoinGecko";
import { useApp, useToast } from "../state/store";
import { INDICATORS } from "../lib/indicators";
import { relativeTime } from "../lib/time";

/**
 * Full trading view for one coin, laid out like a real exchange app:
 * Price / Info / Trading Data / Square across the top, a full-bleed
 * candlestick chart with a real indicator row under it, and a markets /
 * depth / network section below that.
 *
 * Everything on this screen is real CoinGecko data:
 *  - candles come from /ohlc, volume bars from /market_chart total_volumes
 *  - MA / EMA / BOLL / SAR / AVL / SUPER are the standard formulas computed
 *    from those real candles (see lib/indicators.js), not decorative lines
 *  - Info / Trading Data read the real coin record (description, supply,
 *    ATH/ATL, links, genesis date, hashing algorithm)
 *  - Markets and Depth read real per-exchange tickers, including CoinGecko's
 *    real cost-to-move-2% depth figures and real bid/ask spreads
 *  - Square shows this app's real social posts that mention the coin
 *
 * Two things a free keyless API genuinely cannot provide, so they are not
 * faked here: sub-30-minute candles (CoinGecko fixes granularity by range —
 * 30m under a day, 4h to a month, 4d beyond) and a live streaming order
 * book. The Depth tab shows CoinGecko's real depth metrics instead of
 * inventing bid/ask ladder rows.
 */
const TABS = ["Price", "Info", "Trading Data", "Square"];

// Labels state the real window AND the real candle size CoinGecko returns
// for it, rather than offering intervals the data can't actually resolve.
const RANGES = [
  { label: "24H", days: 1, grain: "30m" },
  { label: "7D", days: 7, grain: "4h" },
  { label: "1M", days: 30, grain: "4h" },
  { label: "3M", days: 90, grain: "4d" },
  { label: "1Y", days: 365, grain: "4d" },
];

const BOTTOM_TABS = ["Markets", "Depth", "Network"];

function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.up, opacity: pulse }} />
      <Text style={{ color: colors.textTertiary, fontSize: 11, fontFamily: fonts.medium, letterSpacing: 0.5 }}>LIVE</Text>
    </View>
  );
}

function useFlash(value) {
  const flash = useRef(new Animated.Value(0)).current;
  const prev = useRef(value);
  const [flashUp, setFlashUp] = useState(true);
  useEffect(() => {
    if (value == null || prev.current == null) { prev.current = value; return; }
    if (value !== prev.current) {
      setFlashUp(value > prev.current);
      prev.current = value;
      flash.setValue(1);
      Animated.timing(flash, { toValue: 0, duration: 700, useNativeDriver: false }).start();
    }
  }, [value]);
  return { flash, flashUp };
}

function money(v, digits = 2) {
  if (v == null) return "—";
  return `$${Number(v).toLocaleString("en-US", { maximumFractionDigits: digits })}`;
}
function compact(v) {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return money(v);
}
function pct(v) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function StatRow({ label, value, tone }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
      <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: tone ?? colors.textPrimary, fontSize: 13, fontFamily: fonts.mono }}>{value}</Text>
    </View>
  );
}

export default function CoinDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [range, setRange] = useState(RANGES[0]);
  const [tab, setTab] = useState("Price");
  const [indicator, setIndicator] = useState("MA");
  const [bottomTab, setBottomTab] = useState("Markets");

  // Every coin ever opened keeps its own polling cache entry alive for the
  // rest of the session (native-stack never unmounts a visited screen), so
  // the fast poll is gated to only the coin currently on screen — otherwise
  // browsing through several coins in one session leaves all of them
  // polling in the background forever, which is the real reason this feed
  // kept looking rate-limited.
  const isFocused = useIsFocused();

  const watched = state.watchlist.includes(id);
  const hasAlert = state.priceAlerts.some((a) => a.coinId === id);
  const { data: coin, loading, error, refetch } = useCoinDetail(id, isFocused);
  const { data: candles, error: candlesError, refetch: refetchCandles } = useCoinOHLC(id, range.days, isFocused);
  const { data: volumes } = useCoinVolume(id, range.days, isFocused);
  const { data: tickers, loading: tickersLoading } = useCoinTickers(id, isFocused);

  const md = coin?.market_data;
  const price = md?.current_price?.usd;
  const changePct = md?.price_change_percentage_24h ?? 0;
  const up = changePct >= 0;
  const { flash, flashUp } = useFlash(price);
  const flashColor = flashUp ? colors.up : colors.down;
  const sym = coin?.symbol?.toUpperCase() ?? "";

  const toggleWatch = () => {
    dispatch({ type: "watchlist/toggle", id });
    toast(watched ? `Removed ${sym || "coin"} from watchlist.` : `Added ${sym || "coin"} to watchlist.`);
  };

  // Real posts from this app's social feed that actually mention this coin.
  const squarePosts = useMemo(() => {
    if (!coin) return [];
    const needle = sym.toLowerCase();
    const name = coin.name?.toLowerCase() ?? "";
    return state.social.posts.filter((p) => {
      const body = p.body?.toLowerCase() ?? "";
      return body.includes(`$${needle}`) || body.includes(name) || p.trade?.coin?.toLowerCase() === needle;
    });
  }, [coin, sym, state.social.posts]);

  // Strip the HTML CoinGecko returns in descriptions.
  const description = useMemo(() => {
    const raw = coin?.description?.en;
    if (!raw) return null;
    return raw.replace(/<[^>]+>/g, "").split("\n")[0].trim() || null;
  }, [coin]);

  if (error && !coin) {
    return (
      <Screen>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: spacing.md }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
            <Feather name="chevron-left" size={19} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ alignItems: "center", paddingVertical: 60, gap: 10 }}>
          <Feather name="wifi-off" size={26} color={colors.textTertiary} />
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>Couldn't load this coin</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", maxWidth: 270, lineHeight: 18 }}>
            {String(error).includes("429")
              ? "The free price feed is rate-limiting right now. Give it a few seconds and try again."
              : "The price feed didn't respond."}
          </Text>
          <View style={{ marginTop: 6, minWidth: 150 }}>
            <Button onPress={refetch}>Try again</Button>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      footer={
        <View style={{ flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Button style={{ flex: 1 }} onPress={() => navigation.navigate("Buy")}>Buy</Button>
          <Button style={{ flex: 1 }} variant="danger" onPress={() => navigation.navigate("Sell")}>Sell</Button>
        </View>
      }
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: spacing.md }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
          <Feather name="chevron-left" size={19} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
          {coin?.image?.small ? <Image source={{ uri: coin.image.small }} style={{ width: 22, height: 22, borderRadius: 11 }} /> : null}
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontFamily: fonts.semibold }}>{sym ? `${sym}/USD` : "—"}</Text>
          {coin?.market_cap_rank ? (
            <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 10, fontFamily: fonts.mono }}>#{coin.market_cap_rank}</Text>
            </View>
          ) : null}
        </View>
        <IconButton
          family="ionicons"
          icon="star-outline"
          activeIcon="star"
          active={watched}
          activeColor="#F5B544"
          onPress={toggleWatch}
          size={19}
        />
        <IconButton
          family="ionicons"
          icon="notifications-outline"
          activeIcon="notifications"
          active={hasAlert}
          onPress={() => navigation.navigate("PriceAlerts")}
          size={19}
        />
      </View>

      {/* Top tabs */}
      <View style={{ flexDirection: "row", gap: 20, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={{ paddingBottom: 9, borderBottomWidth: 2, borderBottomColor: tab === t ? colors.textPrimary : "transparent" }}>
            <Text style={{ color: tab === t ? colors.textPrimary : colors.textTertiary, fontSize: 14, fontFamily: tab === t ? fonts.semibold : fonts.regular }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {loading && !coin ? (
          <View style={{ paddingTop: spacing.lg, gap: 12 }}>
            <Skeleton width={180} height={34} />
            <Skeleton width={120} height={14} />
            <View style={{ height: 8 }} />
            <Skeleton width="100%" height={300} radius={radius.md} />
          </View>
        ) : !coin ? null : tab === "Price" ? (
          <View>
            {/* Price block */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: spacing.lg, marginBottom: spacing.md }}>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View>
                    <Animated.View
                      pointerEvents="none"
                      style={[StyleSheet.absoluteFillObject, { backgroundColor: flashColor, opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }), borderRadius: radius.sm }]}
                    />
                    <Text style={{ color: up ? colors.up : colors.down, fontSize: 32, fontFamily: fonts.bold }}>
                      {price >= 1 ? Number(price).toLocaleString("en-US", { maximumFractionDigits: 2 }) : Number(price).toFixed(6)}
                    </Text>
                  </View>
                  <LiveBadge />
                </View>
                <Text style={{ color: up ? colors.up : colors.down, fontSize: 13, marginTop: 3, fontFamily: fonts.mono }}>
                  ≈ {money(price)}  {up ? "▲" : "▼"} {pct(changePct)}
                </Text>
              </View>
              <View style={{ gap: 3, alignItems: "flex-end" }}>
                {[
                  ["24h High", money(md?.high_24h?.usd)],
                  ["24h Low", money(md?.low_24h?.usd)],
                  ["24h Vol", compact(md?.total_volume?.usd)],
                ].map(([k, v]) => (
                  <View key={k} style={{ flexDirection: "row", gap: 10 }}>
                    <Text style={{ color: colors.textTertiary, fontSize: 11 }}>{k}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: fonts.mono, minWidth: 78, textAlign: "right" }}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Range row — real windows, with the real candle size for each */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 4 }}>
              {RANGES.map((r) => (
                <Pressable key={r.label} onPress={() => setRange(r)} hitSlop={6}>
                  <Text style={{ color: range.label === r.label ? colors.textPrimary : colors.textTertiary, fontSize: 13, fontFamily: range.label === r.label ? fonts.semibold : fonts.regular }}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <Text style={{ color: colors.textTertiary, fontSize: 10.5, fontFamily: fonts.mono }}>{range.grain} candles</Text>
            </View>

            {/* Chart. Switching range fetches a whole new candle series, so
                show the chart's own footprint as a skeleton rather than
                collapsing to blank space while it loads. */}
            <View style={{ marginTop: 8 }}>
              {candles.length ? (
                <CandlestickChart candles={candles} volumes={volumes} active={indicator} days={range.days} />
              ) : candlesError ? (
                // An empty chart area with no explanation reads as broken, so
                // say what happened and give a way out. Each range is a
                // separate request, so one failing doesn't mean the others will.
                <View style={{ height: 300, alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <Feather name="bar-chart-2" size={24} color={colors.textTertiary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontFamily: fonts.semibold }}>Chart unavailable</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: "center", maxWidth: 250, lineHeight: 17 }}>
                    The {range.label} candles didn't load — the price feed is rate-limiting.
                  </Text>
                  <View style={{ flexDirection: "row", gap: 18, marginTop: 4 }}>
                    <Pressable onPress={refetchCandles} hitSlop={8}>
                      <Text style={{ color: colors.up, fontSize: 12.5, fontFamily: fonts.medium }}>Try again</Text>
                    </Pressable>
                    {range.label !== "24H" && (
                      <Pressable onPress={() => setRange(RANGES[0])} hitSlop={8}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontFamily: fonts.medium }}>Back to 24H</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{ height: 300, justifyContent: "flex-end", gap: 6 }}>
                  <Skeleton width="100%" height={226} radius={radius.sm} />
                  <Skeleton width="100%" height={48} radius={radius.sm} />
                </View>
              )}
            </View>

            {/* Indicator row */}
            <View style={{ flexDirection: "row", gap: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
              {INDICATORS.map((ind) => (
                <Pressable key={ind.key} onPress={() => setIndicator(ind.key)} hitSlop={6}>
                  <Text style={{ color: indicator === ind.key ? colors.textPrimary : colors.textTertiary, fontSize: 12.5, fontFamily: indicator === ind.key ? fonts.semibold : fonts.regular }}>
                    {ind.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Markets / Depth / Network */}
            <View style={{ flexDirection: "row", gap: 20, marginTop: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
              {BOTTOM_TABS.map((t) => (
                <Pressable key={t} onPress={() => setBottomTab(t)} style={{ paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: bottomTab === t ? colors.textPrimary : "transparent" }}>
                  <Text style={{ color: bottomTab === t ? colors.textPrimary : colors.textTertiary, fontSize: 13, fontFamily: bottomTab === t ? fonts.semibold : fonts.regular }}>{t}</Text>
                </Pressable>
              ))}
            </View>

            {bottomTab === "Markets" && (
              <View style={{ marginTop: spacing.sm }}>
                <View style={{ flexDirection: "row", paddingVertical: 8 }}>
                  <Text style={{ flex: 1.3, color: colors.textTertiary, fontSize: 11 }}>Exchange</Text>
                  <Text style={{ flex: 1, color: colors.textTertiary, fontSize: 11, textAlign: "right" }}>Price</Text>
                  <Text style={{ flex: 1, color: colors.textTertiary, fontSize: 11, textAlign: "right" }}>24h Vol</Text>
                </View>
                {tickersLoading && !tickers.length ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 10, paddingVertical: 9 }}>
                      <Skeleton width="40%" height={12} />
                      <View style={{ flex: 1 }} />
                      <Skeleton width={60} height={12} />
                    </View>
                  ))
                ) : !tickers.length ? (
                  <Text style={{ color: colors.textTertiary, fontSize: 12.5, paddingVertical: 14 }}>No exchange data available for this coin.</Text>
                ) : (
                  tickers.slice(0, 12).map((t, i) => (
                    <View key={`${t.market?.identifier}-${t.target}-${i}`} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                      <View style={{ flex: 1.3 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 12.5 }} numberOfLines={1}>{t.market?.name}</Text>
                        <Text style={{ color: colors.textTertiary, fontSize: 10.5 }}>{t.base}/{t.target}</Text>
                      </View>
                      <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 12, fontFamily: fonts.mono, textAlign: "right" }}>
                        {money(t.converted_last?.usd)}
                      </Text>
                      <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 12, fontFamily: fonts.mono, textAlign: "right" }}>
                        {compact(t.converted_volume?.usd)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {bottomTab === "Depth" && (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={{ color: colors.textTertiary, fontSize: 11.5, lineHeight: 17, paddingVertical: 8 }}>
                  Real order-book depth per venue: spread, and the USD it would take to move the price 2% in each direction.
                </Text>
                <View style={{ flexDirection: "row", paddingVertical: 8 }}>
                  <Text style={{ flex: 1.2, color: colors.textTertiary, fontSize: 11 }}>Exchange</Text>
                  <Text style={{ flex: 0.7, color: colors.textTertiary, fontSize: 11, textAlign: "right" }}>Spread</Text>
                  <Text style={{ flex: 1, color: colors.up, fontSize: 11, textAlign: "right" }}>+2%</Text>
                  <Text style={{ flex: 1, color: colors.down, fontSize: 11, textAlign: "right" }}>−2%</Text>
                </View>
                {tickers.filter((t) => t.cost_to_move_up_usd || t.cost_to_move_down_usd).slice(0, 12).map((t, i) => (
                  <View key={`${t.market?.identifier}-d-${i}`} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                    <Text style={{ flex: 1.2, color: colors.textPrimary, fontSize: 12.5 }} numberOfLines={1}>{t.market?.name}</Text>
                    <Text style={{ flex: 0.7, color: colors.textSecondary, fontSize: 12, fontFamily: fonts.mono, textAlign: "right" }}>
                      {t.bid_ask_spread_percentage != null ? `${t.bid_ask_spread_percentage.toFixed(2)}%` : "—"}
                    </Text>
                    <Text style={{ flex: 1, color: colors.up, fontSize: 12, fontFamily: fonts.mono, textAlign: "right" }}>{compact(t.cost_to_move_up_usd)}</Text>
                    <Text style={{ flex: 1, color: colors.down, fontSize: 12, fontFamily: fonts.mono, textAlign: "right" }}>{compact(t.cost_to_move_down_usd)}</Text>
                  </View>
                ))}
                {!tickers.some((t) => t.cost_to_move_up_usd) && !tickersLoading && (
                  <Text style={{ color: colors.textTertiary, fontSize: 12.5, paddingVertical: 14 }}>
                    No venue reports order-book depth for this pair.
                  </Text>
                )}
              </View>
            )}

            {bottomTab === "Network" && (
              <View style={{ marginTop: spacing.sm }}>
                <StatRow label="Hashing algorithm" value={coin.hashing_algorithm ?? "Not applicable"} />
                <StatRow label="Genesis date" value={coin.genesis_date ?? "—"} />
                <StatRow label="Block time" value={coin.block_time_in_minutes ? `${coin.block_time_in_minutes} min` : "—"} />
                <StatRow label="Categories" value={coin.categories?.filter(Boolean).slice(0, 2).join(", ") || "—"} />
                <StatRow label="Watchlist users" value={coin.watchlist_portfolio_users?.toLocaleString() ?? "—"} />
                {coin.links?.homepage?.[0] ? (
                  <Pressable onPress={() => toast(coin.links.homepage[0])}>
                    <StatRow label="Website" value={coin.links.homepage[0].replace(/^https?:\/\//, "").replace(/\/$/, "")} tone={colors.up} />
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        ) : tab === "Info" ? (
          <View style={{ paddingTop: spacing.lg }}>
            {description ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 21, marginBottom: spacing.md }}>{description}</Text>
            ) : (
              <Text style={{ color: colors.textTertiary, fontSize: 13, marginBottom: spacing.md }}>No description published for this asset.</Text>
            )}
            <StatRow label="Rank" value={coin.market_cap_rank ? `#${coin.market_cap_rank}` : "—"} />
            <StatRow label="Market cap" value={compact(md?.market_cap?.usd)} />
            <StatRow label="Fully diluted" value={compact(md?.fully_diluted_valuation?.usd)} />
            <StatRow label="Circulating supply" value={md?.circulating_supply ? `${Math.round(md.circulating_supply).toLocaleString()} ${sym}` : "—"} />
            <StatRow label="Total supply" value={md?.total_supply ? `${Math.round(md.total_supply).toLocaleString()} ${sym}` : "—"} />
            <StatRow label="Max supply" value={md?.max_supply ? `${Math.round(md.max_supply).toLocaleString()} ${sym}` : "Uncapped"} />
            <StatRow label="Genesis date" value={coin.genesis_date ?? "—"} />
          </View>
        ) : tab === "Trading Data" ? (
          <View style={{ paddingTop: spacing.lg }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 4 }}>Price change</Text>
            <StatRow label="1 hour" value={pct(md?.price_change_percentage_1h_in_currency?.usd)} tone={(md?.price_change_percentage_1h_in_currency?.usd ?? 0) >= 0 ? colors.up : colors.down} />
            <StatRow label="24 hours" value={pct(md?.price_change_percentage_24h)} tone={changePct >= 0 ? colors.up : colors.down} />
            <StatRow label="7 days" value={pct(md?.price_change_percentage_7d)} tone={(md?.price_change_percentage_7d ?? 0) >= 0 ? colors.up : colors.down} />
            <StatRow label="30 days" value={pct(md?.price_change_percentage_30d)} tone={(md?.price_change_percentage_30d ?? 0) >= 0 ? colors.up : colors.down} />
            <StatRow label="1 year" value={pct(md?.price_change_percentage_1y)} tone={(md?.price_change_percentage_1y ?? 0) >= 0 ? colors.up : colors.down} />

            <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: spacing.lg, marginBottom: 4 }}>All-time</Text>
            <StatRow label="All-time high" value={money(md?.ath?.usd)} />
            <StatRow label="From ATH" value={pct(md?.ath_change_percentage?.usd)} tone={colors.down} />
            <StatRow label="ATH date" value={md?.ath_date?.usd ? new Date(md.ath_date.usd).toLocaleDateString() : "—"} />
            <StatRow label="All-time low" value={money(md?.atl?.usd, 6)} />
            <StatRow label="From ATL" value={pct(md?.atl_change_percentage?.usd)} tone={colors.up} />

            <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: spacing.lg, marginBottom: 4 }}>Liquidity</Text>
            <StatRow label="24h volume" value={compact(md?.total_volume?.usd)} />
            <StatRow label="Volume / market cap" value={md?.total_volume?.usd && md?.market_cap?.usd ? (md.total_volume.usd / md.market_cap.usd).toFixed(4) : "—"} />
            <StatRow label="Listed markets" value={tickers.length ? `${tickers.length}+ pairs` : "—"} />
          </View>
        ) : (
          <View style={{ paddingTop: spacing.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {squarePosts.length ? `${squarePosts.length} post${squarePosts.length === 1 ? "" : "s"} mentioning ${sym}` : `No posts mention ${sym} yet`}
              </Text>
              <Pressable onPress={() => navigation.navigate("Compose")} hitSlop={8}>
                <Text style={{ color: colors.up, fontSize: 13, fontFamily: fonts.medium }}>Post</Text>
              </Pressable>
            </View>

            {squarePosts.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
                <Feather name="message-square" size={26} color={colors.textTertiary} />
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.semibold }}>Nothing here yet</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12.5, textAlign: "center", maxWidth: 250 }}>
                  Be the first to share what you're seeing on {sym}.
                </Text>
              </View>
            ) : (
              squarePosts.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => navigation.navigate("PostDetail", { id: p.id })}
                  style={{ flexDirection: "row", gap: 10, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}
                >
                  <Avatar uri={p.author.avatarUrl} initials={p.author.initials} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>@{p.author.handle} · {relativeTime(p.createdAt)}</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 13.5, marginTop: 3, lineHeight: 19 }}>{p.body}</Text>
                    {p.trade ? (
                      <View style={{ flexDirection: "row", alignSelf: "flex-start", marginTop: 7, gap: 6, backgroundColor: colors.surfaceRaised, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ color: p.trade.direction === "Long" ? colors.up : colors.down, fontSize: 11, fontFamily: fonts.medium }}>{p.trade.direction}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: fonts.mono }}>{p.trade.coin} @ ${p.trade.price}</Text>
                      </View>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: 14, marginTop: 7 }}>
                      <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>♥ {p.likes}</Text>
                      <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>{p.replies.length} replies</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
