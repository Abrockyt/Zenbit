import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, TabBar, IconButton, SegmentedControl, Avatar, SkeletonList, Button, colors, spacing, radius, fonts } from "../ui/kit";
import { useApp } from "../state/store";
import { useMarkets } from "../data/useCoinGecko";

/**
 * Rebuilt against the real Figma frame (03-01 · Home, node 309:2) — action
 * row, card summary, Top Coin/Watchlist segmented tabs, coin rows with
 * brand-colored icon circles — instead of the earlier flat placeholder.
 * Data is still live: holdings/prices come from useMarkets, not the
 * Figma mockup's static numbers.
 */
const ACTIONS = [
  { key: "deposit", icon: "plus", label: "Deposit", route: "AddFunds" },
  { key: "send", icon: "arrow-up", label: "Send", route: "Send" },
  { key: "receive", icon: "arrow-down", label: "Receive", route: "Receive" },
  { key: "swap", icon: "repeat", label: "Swap", route: "Swap" },
  { key: "history", icon: "clock", label: "History", route: "RecentActivity" },
];

function ActionButton({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 8 }}>
      <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon} size={22} color={colors.textPrimary} />
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function CoinRow({ coin, holding, onPress }) {
  const up = (coin?.price_change_percentage_24h ?? 0) >= 0;
  const brand = colors.coin[coin?.symbol] ?? colors.textTertiary;
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
      {/* The real coin mark CoinGecko ships with every market row. The
          initial-in-a-circle fallback only shows if a coin has no image. */}
      {coin?.image ? (
        <Image source={{ uri: coin.image }} style={{ width: 36, height: 36, borderRadius: 18 }} />
      ) : (
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: brand + "22", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: brand, fontFamily: fonts.bold, fontSize: 13 }}>{coin?.symbol?.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>{coin?.name}</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{holding ?? coin?.symbol?.toUpperCase()}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.mono }}>
          ${Number(coin?.current_price ?? 0).toLocaleString("en-US", { maximumFractionDigits: coin?.current_price < 1 ? 4 : 2 })}
        </Text>
        <Text style={{ fontSize: 13, marginTop: 2, fontFamily: fonts.mono, color: up ? colors.up : colors.down }}>
          {up ? "↑" : "↓"}{Math.abs(coin?.price_change_percentage_24h ?? 0).toFixed(2)}%
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const user = state.session.user;
  const holdings = state.wallet.holdings;
  const [tab, setTab] = useState("top");

  const { data: markets, loading, error, refetch } = useMarkets(null, { vs: "usd" });

  const priced = useMemo(
    () => holdings.map((h) => ({ ...h, market: markets?.find((x) => x.id === h.id) })),
    [holdings, markets]
  );
  const total = priced.reduce((s, h) => s + (h.market?.current_price ?? 0) * h.units, 0);
  const totalChange = priced.reduce((s, h) => s + ((h.market?.current_price ?? 0) * h.units * (h.market?.price_change_percentage_24h ?? 0)) / 100, 0);
  const totalChangePct = total ? (totalChange / (total - totalChange)) * 100 : 0;

  // "Top Coin" is the top-market-cap list (already the order useMarkets'
  // default query returns), not "coins you hold" — a brand new account has
  // zero holdings, so filtering this tab down to held coins left it looking
  // empty/broken for every new signup even though live prices were fetching
  // fine. Watchlist stays personal since that's what it's for.
  const rows = tab === "watchlist" ? (markets ?? []).filter((m) => state.watchlist.includes(m.id)) : (markets ?? []);

  return (
    <Screen scroll={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceRaised, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 6, paddingRight: 14 }}>
          <Avatar uri={user?.avatarUrl} initials={user?.avatarInitials} size={28} />
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>{user?.name ? user.name.split(" ")[0].toLowerCase() : "user"}crypto</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <IconButton icon="bell" size={18} onPress={() => navigation.navigate("RecentActivity")} badge={state.wallet.transactions.some((t) => t.status === "pending")} />
          <IconButton icon="search" size={18} onPress={() => navigation.navigate("Market")} />
          <Pressable onPress={() => navigation.navigate("AiChat")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>AI</Text>
          </Pressable>
        </View>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Total balance</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 10 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 34, fontFamily: fonts.medium }}>
          ${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceRaised, borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>USD</Text>
          <Feather name="chevron-down" size={12} color={colors.textSecondary} />
        </View>
      </View>
      <Text style={{ color: totalChange >= 0 ? colors.up : colors.down, fontSize: 13, marginBottom: spacing.lg }}>
        {totalChange >= 0 ? "+" : ""}${totalChange.toFixed(2)} ({totalChangePct.toFixed(2)}%)
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg }}>
        {ACTIONS.map((a) => <ActionButton key={a.key} icon={a.icon} label={a.label} onPress={() => navigation.navigate(a.route)} />)}
      </View>

      {state.card.ordered && (
        <Pressable onPress={() => navigation.navigate("Card")} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceRaised, marginBottom: spacing.md }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
            <Feather name="credit-card" size={18} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>Card •• {state.card.last4}</Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>${state.card.balance.toFixed(2)} available</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        </Pressable>
      )}

      <SegmentedControl options={[{ value: "top", label: "Top Coin" }, { value: "watchlist", label: "Watchlist" }]} value={tab} onChange={setTab} />

      {error && markets?.length > 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm }}>
          <Text style={{ color: colors.down, fontSize: 12, flex: 1 }}>Couldn't refresh — showing last known prices.</Text>
          <Pressable onPress={refetch} hitSlop={8}>
            <Text style={{ color: colors.up, fontSize: 12, fontFamily: fonts.medium }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {error && !markets?.length ? (
        <View style={{ alignItems: "center", paddingVertical: 44, gap: 10 }}>
          <Feather name="wifi-off" size={26} color={colors.textTertiary} />
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>Price feed unavailable</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", maxWidth: 270, lineHeight: 18 }}>
            {String(error).includes("429")
              ? "The free price feed is rate-limiting. Give it a few seconds and try again."
              : "CoinGecko didn't respond. Check your connection and try again."}
          </Text>
          <View style={{ marginTop: 6, minWidth: 150 }}>
            <Button onPress={refetch}>Try again</Button>
          </View>
        </View>
      ) : loading && !markets?.length ? (
        <View style={{ marginTop: spacing.sm }}><SkeletonList count={6} /></View>
      ) : (
      <FlatList
        style={{ flex: 1, marginTop: spacing.sm }}
        data={rows}
        keyExtractor={(c) => c.id}
        renderItem={({ item: c }) => {
          const h = holdings.find((x) => x.id === c.id);
          return <CoinRow coin={c} holding={h ? `${h.units} ${h.symbol.toUpperCase()}` : undefined} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />;
        }}
      />
      )}
    </Screen>
  );
}
