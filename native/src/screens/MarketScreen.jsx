import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { Screen, TabBar, TextField, Chip, PriceRow, EmptyState, colors, spacing } from "../ui/kit";
import { useMarkets, useCoinSearch } from "../data/useCoinGecko";
import { useApp } from "../state/store";

const FILTERS = ["All", "Watchlist", "Gainers", "Losers"];

export default function MarketScreen({ navigation }) {
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const { data: markets, loading, error } = useMarkets(null, { perPage: 40 });
  const { data: searchResults, loading: searching } = useCoinSearch(query);

  let rows = markets ?? [];
  if (filter === "Watchlist") rows = rows.filter((c) => state.watchlist.includes(c.id));
  if (filter === "Gainers") rows = [...rows].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  if (filter === "Losers") rows = [...rows].sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));

  const showingSearch = query.trim().length > 0;

  return (
    <Screen scroll={false} footer={<TabBar navigation={navigation} active="Market" />}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600", marginBottom: spacing.md }}>Market</Text>
      <TextField value={query} onChangeText={setQuery} placeholder="Search coins" />

      {!showingSearch && (
        <View style={{ flexDirection: "row", marginVertical: spacing.md }}>
          {FILTERS.map((f) => <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />)}
        </View>
      )}

      {error ? (
        <EmptyState icon="wifi-off" title="Price feed unavailable" body="CoinGecko didn't respond. Pull to refresh or check your connection." />
      ) : showingSearch ? (
        searching ? (
          <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: spacing.md }}>Searching…</Text>
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
        <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: spacing.md }}>Loading…</Text>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(c) => c.id}
          renderItem={({ item: c }) => (
            <PriceRow symbol={c.symbol} name={c.name} price={c.current_price} changePct={c.price_change_percentage_24h ?? 0} iconUrl={c.image} onPress={() => navigation.navigate("CoinDetail", { id: c.id })} />
          )}
        />
      )}
    </Screen>
  );
}
