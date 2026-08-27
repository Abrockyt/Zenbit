import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, View, Text, FlatList, Pressable, Image, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Screen, TabBar, IconButton, SegmentedControl, Avatar, SkeletonList, Button, GlassAction, colors, spacing, radius, fonts } from "../ui/kit";
import { isLightTheme } from "../theme";
import { useApp } from "../state/store";
import { useMarkets } from "../data/useCoinGecko";
import { useCurrency } from "../lib/useCurrency";
import { compactMoney } from "../lib/format";
import Sparkline from "../ui/Sparkline";
import { SyncStatus, SyncEmptyState } from "../ui/SyncStatus";

// How far past the top the big balance figure has scrolled before the
// compact bar takes over — roughly where the avatar row and headline
// balance have moved out from under the status bar. Below this the large
// balance is still fully visible, so a second copy of it up top would just
// be redundant chrome.
const COLLAPSE_AT = 130;

// The compact replacement for the header once you've scrolled past the
// real balance — the pattern iOS's own apps use (Wallet, Messages: a large
// title that gives way to a small persistent one once it scrolls off),
// rebuilt here since RN's stock navigation header doesn't do this
// automatically. Search AND the account avatar stay reachable up top
// instead of scrolling away with the rest of the header — the compact bar
// is meant to replace both, not just the balance.
function CompactHeader({ opacity, revealed, total, totalChange, currency, user, onSearch, onProfile }) {
  const insets = useSafeAreaInsets();
  const up = totalChange >= 0;
  return (
    <Animated.View
      pointerEvents={revealed ? "auto" : "none"}
      style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, opacity, paddingTop: insets.top, overflow: "hidden" }}
    >
      {/* Real backdrop blur, not a flat fill — this sits directly over
          content that's actively scrolling underneath it, which is exactly
          the case blur is for: there's always something real behind it to
          refract. A soft translucent wash on top keeps text readable
          without fully hiding what's moving past beneath it. */}
      <BlurView intensity={55} tint={isLightTheme() ? "light" : "dark"} style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={isLightTheme() ? ["rgba(255,255,255,0.82)", "rgba(255,255,255,0.68)"] : ["rgba(6,11,9,0.78)", "rgba(6,11,9,0.62)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, backgroundColor: colors.borderSubtle }} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: 10, gap: spacing.sm }}>
        <Pressable onPress={onProfile} hitSlop={6}>
          <Avatar uri={user?.avatarUrl} initials={user?.avatarInitials} size={30} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: colors.textTertiary, fontSize: 10.5 }}>Total balance</Text>
          {/* Coloured by the same up/down semantics as the number below it
              on the full header — the compact bar previously always
              rendered the balance in plain text regardless of whether the
              account was actually up or down for the day. */}
          <Text style={{ color: up ? colors.up : colors.down, fontSize: 16, fontFamily: fonts.semibold }} numberOfLines={1}>
            {compactMoney(total, currency)}
          </Text>
        </View>
        <Pressable onPress={onSearch} hitSlop={10} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
          <Feather name="search" size={15} color={colors.textPrimary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

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

// Section heading with an optional "See all" affordance — used by the
// widgets below so each one has a real destination instead of dead-ending.
function SectionTitle({ title, actionLabel, onAction }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg, marginBottom: spacing.sm }}>
      <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>{title}</Text>
      {onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: colors.up, fontSize: 12.5, fontFamily: fonts.medium }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Binance's actual Favorites widget shows price + a 24h trend line + volume
// per coin rather than a flat price list (see the UX research memo) — that's
// what this mirrors, driven by the user's own watchlist picks.
function WatchCard({ coin, money, onPress }) {
  const up = (coin?.price_change_percentage_24h ?? 0) >= 0;
  const spark = coin?.sparkline_in_7d?.price ?? [];
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 152, padding: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginRight: spacing.sm }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        {coin?.image && <Image source={{ uri: coin.image }} style={{ width: 20, height: 20, borderRadius: 10 }} />}
        <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontFamily: fonts.medium }}>{coin?.symbol?.toUpperCase()}</Text>
      </View>
      <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontFamily: fonts.mono, marginTop: 8 }} numberOfLines={1}>
        {money(coin?.current_price ?? 0)}
      </Text>
      <Text style={{ color: up ? colors.up : colors.down, fontSize: 11.5, fontFamily: fonts.mono, marginTop: 2 }}>
        {up ? "+" : ""}{(coin?.price_change_percentage_24h ?? 0).toFixed(2)}%
      </Text>
      <View style={{ marginTop: 6, height: 30 }}>
        {/* Sampled down: the 7d sparkline ships ~168 points and drawing all
            of them into 126px renders as a solid smear, not a trend. */}
        <Sparkline points={spark.filter((_, i) => i % 6 === 0)} width={126} height={30} up={up} strokeWidth={1.5} />
      </View>
      <Text style={{ color: colors.textTertiary, fontSize: 10.5, marginTop: 4 }} numberOfLines={1}>
        Vol {compactNumber(coin?.total_volume ?? 0)}
      </Text>
    </Pressable>
  );
}

// Volume figures run to 11+ digits; printed in full they blow out the card
// and read as noise, so they're abbreviated the way every exchange does it.
function compactNumber(n) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function MoverRow({ coin, money, onPress }) {
  const up = (coin?.price_change_percentage_24h ?? 0) >= 0;
  return (
    <Pressable onPress={onPress} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 }}>
      {coin?.image && <Image source={{ uri: coin.image }} style={{ width: 22, height: 22, borderRadius: 11 }} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontFamily: fonts.medium }}>{coin?.symbol?.toUpperCase()}</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 10.5, fontFamily: fonts.mono }} numberOfLines={1}>{money(coin?.current_price ?? 0)}</Text>
      </View>
      <Text style={{ color: up ? colors.up : colors.down, fontSize: 12, fontFamily: fonts.mono }}>
        {up ? "+" : ""}{(coin?.price_change_percentage_24h ?? 0).toFixed(1)}%
      </Text>
    </Pressable>
  );
}

function CoinRow({ coin, holding, money, onPress }) {
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
          {money(coin?.current_price ?? 0)}
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

  const { currency, money } = useCurrency();
  const { data: markets, loading, error, refetch, lastSuccessAt, refreshing, retryAt } = useMarkets(null, { vs: currency });

  // Drives the compact header: fades in as the real balance scrolls out
  // from under the status bar, fades back out on the way up. `revealed`
  // gates pointer events separately from the opacity animation — an
  // Animated.View at opacity 0 still intercepts touches in RN, so without
  // this the invisible compact search button would eat taps meant for
  // whatever's underneath it near the top of the list.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => setRevealed(value > COLLAPSE_AT));
    return () => scrollY.removeListener(id);
  }, [scrollY]);
  const compactOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT - 30, COLLAPSE_AT + 10],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

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

  const watched = useMemo(
    () => (markets ?? []).filter((m) => state.watchlist.includes(m.id)),
    [markets, state.watchlist]
  );

  const { gainers, losers } = useMemo(() => {
    const sorted = [...(markets ?? [])].sort(
      (a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
    );
    return { gainers: sorted.slice(0, 3), losers: sorted.slice(-3).reverse() };
  }, [markets]);

  // Driven by real account state, so a card only appears when its action is
  // actually outstanding — no fabricated marketing, and each one goes
  // somewhere real.
  const promos = [
    state.kyc.status !== "approved" && {
      key: "kyc",
      icon: "shield",
      title: "Verify your identity",
      body: "Unlocks Buy, Sell and the Zenbit card",
      tint: colors.accent,
      onPress: () => navigation.navigate("KycIntro", { next: "Home" }),
    },
    !state.card.ordered && {
      key: "card",
      icon: "credit-card",
      title: "Order your Zenbit card",
      body: "Spend crypto straight from your wallet",
      tint: colors.info,
      onPress: () => navigation.navigate("Card"),
    },
    state.priceAlerts.length === 0 && {
      key: "alerts",
      icon: "trending-up",
      title: "Set a price alert",
      body: "Get told when a coin hits your target",
      tint: colors.up,
      onPress: () => navigation.navigate("PriceAlerts"),
    },
  ].filter(Boolean);

  return (
    <Screen
      scroll={true}
      bg="animated"
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      stickyHeader={
        <CompactHeader
          opacity={compactOpacity}
          revealed={revealed}
          total={total}
          totalChange={totalChange}
          currency={currency}
          user={user}
          onSearch={() => navigation.navigate("MainTabs", { screen: "Market" })}
          onProfile={() => navigation.navigate("MainTabs", { screen: "Profile" })}
        />
      }
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        {/* Was a bare View — an avatar and a name that look exactly like an
            account button but did nothing when tapped. Opens Profile now. */}
        <Pressable
          onPress={() => navigation.navigate("Profile")}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceRaised, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 6, paddingRight: 14, opacity: pressed ? 0.6 : 1 })}
        >
          <Avatar uri={user?.avatarUrl} initials={user?.avatarInitials} size={28} />
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>{user?.name ? user.name.split(" ")[0].toLowerCase() : "user"}crypto</Text>
        </Pressable>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <IconButton icon="bell" size={18} onPress={() => navigation.navigate("RecentActivity")} badge={state.wallet.transactions.some((t) => t.status === "pending")} />
          <IconButton icon="search" size={18} onPress={() => navigation.navigate("Market")} />
          <Pressable onPress={() => navigation.navigate("AiChat")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>AI</Text>
          </Pressable>
        </View>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Total balance</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 4 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 34, fontFamily: fonts.medium }}>
          {money(total)}
        </Text>
        {/* Was a bare View with zero onPress — the chevron implied it opened
            something, but tapping it did nothing at all. Now a real link to
            the currency picker, and shows the currency the user actually
            has selected instead of a hardcoded "USD". */}
        <Pressable
          onPress={() => navigation.navigate("Currency")}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceRaised, borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{currency.toUpperCase()}</Text>
          <Feather name="chevron-down" size={12} color={colors.textSecondary} />
        </Pressable>
      </View>
      <SyncStatus
        lastSuccessAt={lastSuccessAt}
        error={error}
        refreshing={refreshing}
        retryAt={retryAt}
        onRetry={refetch}
        style={{ marginTop: 2 }}
      />
      <Text style={{ color: totalChange >= 0 ? colors.up : colors.down, fontSize: 13, marginTop: 6, marginBottom: spacing.lg }}>
        {totalChange >= 0 ? "+" : ""}{money(totalChange)} ({totalChangePct.toFixed(2)}%)
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg }}>
        {ACTIONS.map((a) => <GlassAction key={a.key} icon={a.icon} label={a.label} onPress={() => navigation.navigate(a.route)} />)}
      </View>

      {state.card.ordered && (
        <Pressable onPress={() => navigation.navigate("Card")} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceRaised, marginBottom: spacing.md }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.overlayMedium, alignItems: "center", justifyContent: "center" }}>
            <Feather name="credit-card" size={18} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>Card •• {state.card.last4}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{money(state.card.balance)} available</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        </Pressable>
      )}

      {promos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
          {promos.map((p) => (
            <Pressable
              key={p.key}
              onPress={p.onPress}
              style={{ width: 232, flexDirection: "row", alignItems: "center", gap: 11, padding: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginRight: spacing.sm }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: p.tint + "22", alignItems: "center", justifyContent: "center" }}>
                <Feather name={p.icon} size={16} color={p.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium }}>{p.title}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }} numberOfLines={2}>{p.body}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {markets?.length > 0 && (
        <>
          <SectionTitle
            title="Your watchlist"
            actionLabel={watched.length ? "See all" : "Pick coins"}
            onAction={() => navigation.navigate(watched.length ? "Watchlist" : "PickWatchlist", watched.length ? undefined : { mode: "edit" })}
          />
          {watched.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {watched.map((c) => (
                <WatchCard key={c.id} coin={c} money={money} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />
              ))}
            </ScrollView>
          ) : (
            <Pressable
              onPress={() => navigation.navigate("PickWatchlist", { mode: "edit" })}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 15, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderDefault }}
            >
              <Feather name="plus-circle" size={17} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>Pick coins to track them here</Text>
              <Feather name="chevron-right" size={15} color={colors.textTertiary} />
            </Pressable>
          )}

          <SectionTitle title="Market movers" actionLabel="Markets" onAction={() => navigation.navigate("Market")} />
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <Text style={{ color: colors.up, fontSize: 11.5, fontFamily: fonts.medium, marginBottom: 3 }}>Top gainers</Text>
              {gainers.map((c) => (
                <MoverRow key={c.id} coin={c} money={money} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />
              ))}
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <Text style={{ color: colors.down, fontSize: 11.5, fontFamily: fonts.medium, marginBottom: 3 }}>Top losers</Text>
              {losers.map((c) => (
                <MoverRow key={c.id} coin={c} money={money} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />
              ))}
            </View>
          </View>
          <View style={{ height: spacing.lg }} />
        </>
      )}

      <SegmentedControl options={[{ value: "top", label: "Top Coin" }, { value: "watchlist", label: "Watchlist" }]} value={tab} onChange={setTab} />

      {/* No inline "couldn't refresh" warning here any more — while real
          prices are on screen the SyncStatus line above already says the
          feed is paused, and a second, redder message about the same
          handled condition just makes a working app feel broken. */}

      {error && !markets?.length ? (
        <SyncEmptyState error={error} refreshing={refreshing} retryAt={retryAt} onRetry={refetch} />
      ) : loading && !markets?.length ? (
        <View style={{ marginTop: spacing.sm }}><SkeletonList count={6} /></View>
      ) : tab === "watchlist" && rows.length === 0 ? (
        // Home only ever shows the coins the account already has picked —
        // a brand new signup has an empty watchlist, so without this the
        // tab just silently rendered nothing with no way to fix it.
        <View style={{ alignItems: "center", paddingVertical: 36, gap: 10 }}>
          <Feather name="star" size={22} color={colors.textTertiary} />
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>No coins tracked yet</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: "center", maxWidth: 240 }}>
            Pick a few coins to watch and they'll show up here.
          </Text>
          <View style={{ marginTop: 4, minWidth: 160 }}>
            <Button onPress={() => navigation.navigate("PickWatchlist", { mode: "edit" })}>Pick coins</Button>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: spacing.sm }}>
          {rows.map((c) => {
            const h = holdings.find((x) => x.id === c.id);
            return (
              <CoinRow
                key={c.id}
                coin={c}
                money={money}
                holding={h ? `${h.units} ${h.symbol.toUpperCase()}` : undefined}
                onPress={() => navigation.navigate("CoinDetail", { id: c.id })}
              />
            );
          })}
        </View>
      )}
    </Screen>
  );
}
