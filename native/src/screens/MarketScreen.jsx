import { useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, TabBar, TextField, Chip, PriceRow, EmptyState, SkeletonList, colors, spacing } from "../ui/kit";
import { useMarkets, useCoinSearch } from "../data/useCoinGecko";
import { useApp } from "../state/store";
import { useCurrency } from "../lib/useCurrency";
import { SyncStatus, SyncEmptyState } from "../ui/SyncStatus";

const FILTERS = ["All", "Watchlist", "Gainers", "Losers"];

export default function MarketScreen({ navigation }) {
  const { state } = useApp();
  const { currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const { data: markets, loading, error, refetch, lastSuccessAt, refreshing, retryAt } = useMarkets(null, { vs: currency, perPage: 40 });
  const { data: searchResults, loading: searching } = useCoinSearch(query);

  let rows = markets ?? [];
  if (filter === "Watchlist") rows = rows.filter((c) => state.watchlist.includes(c.id));
  if (filter === "Gainers") rows = [...rows].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  if (filter === "Losers") rows = [...rows].sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));

  const showingSearch = query.trim().length > 0;

  return (
    <Screen scroll={false}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Market</Text>
        {/* WatchlistScreen was fully built and registered but nothing ever
            navigated to it — Home reimplemented the same filter inline
            instead. This is its real entry point. */}
        <Pressable onPress={() => navigation.navigate("Watchlist")} hitSlop={8}>
          <Feather name="star" size={19} color={colors.textSecondary} />
        </Pressable>
      </View>
      <TextField value={query} onChangeText={setQuery} placeholder="Search coins" icon="search" />

      {!showingSearch && (
        <>
          <SyncStatus
            lastSuccessAt={lastSuccessAt}
            error={error}
            refreshing={refreshing}
            retryAt={retryAt}
            onRetry={refetch}
            style={{ marginTop: spacing.sm }}
          />
          <View style={{ flexDirection: "row", marginVertical: spacing.md }}>
            {FILTERS.map((f) => <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />)}
          </View>
        </>
      )}

      {/* Only a genuine no-data case gets the full-screen treatment. With
          cached rows on screen the feed being paused is shown as a quiet
          status line under the search field instead. */}
      {error && !rows.length ? (
        <SyncEmptyState error={error} refreshing={refreshing} retryAt={retryAt} onRetry={refetch} />
      ) : showingSearch ? (
        searching ? (
          <View style={{ marginTop: spacing.sm }}><SkeletonList count={5} /></View>
        ) : searchResults.length === 0 ? (
          <EmptyState icon="search" title="No results" body={`Nothing matches "${query}".`} />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={searchResults.slice(0, 12)}
            keyExtractor={(c) => c.id}
            renderItem={({ item: c }) => <PriceRow symbol={c.symbol} name={c.name} iconUrl={c.large} price={0} changePct={0} holding=" " onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />}
          />
        )
      ) : loading ? (
        <View style={{ marginTop: spacing.sm }}><SkeletonList count={8} /></View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(c) => c.id}
          renderItem={({ item: c }) => (
            <PriceRow symbol={c.symbol} name={c.name} price={c.current_price} changePct={c.price_change_percentage_24h ?? 0} iconUrl={c.image} currency={currency} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />
          )}
        />
      )}
    </Screen>
  );
}
