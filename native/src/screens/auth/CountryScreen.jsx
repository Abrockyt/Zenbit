import { useMemo, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Row, TextField, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";

// Country -> default display currency. Kept as a plain map (not a full
// ISO-3166 list) since Zenbit only actually supports the 8 currencies
// CurrencyScreen offers — every other country still gets a sane default
// instead of an unhandled currency code.
export const COUNTRIES = [
  { code: "US", name: "United States", currency: "usd" },
  { code: "IN", name: "India", currency: "inr" },
  { code: "GB", name: "United Kingdom", currency: "gbp" },
  { code: "DE", name: "Germany", currency: "eur" },
  { code: "FR", name: "France", currency: "eur" },
  { code: "ES", name: "Spain", currency: "eur" },
  { code: "IT", name: "Italy", currency: "eur" },
  { code: "JP", name: "Japan", currency: "jpy" },
  { code: "AU", name: "Australia", currency: "aud" },
  { code: "CA", name: "Canada", currency: "cad" },
  { code: "AE", name: "United Arab Emirates", currency: "aed" },
  { code: "SG", name: "Singapore", currency: "usd" },
  { code: "BR", name: "Brazil", currency: "usd" },
  { code: "NG", name: "Nigeria", currency: "usd" },
  { code: "ZA", name: "South Africa", currency: "usd" },
];

export default function CountryScreen({ navigation }) {
  const { dispatch } = useApp();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  function pick(country) {
    dispatch({ type: "session/setUser", patch: { country: country.code } });
    // Every country in the list maps to a currency this app actually
    // supports (see COUNTRIES above); an unmapped country would fall back
    // to USD, but nothing in this fixed list is unmapped.
    dispatch({ type: "settings/set", patch: { currency: country.currency } });
    navigation.navigate("CreateWallet");
  }

  return (
    <Screen scroll={false}>
      <Header title="" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Where are you based?</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, marginBottom: spacing.lg }}>
        Sets your default display currency — you can change it any time in Settings.
      </Text>
      <TextField value={query} onChangeText={setQuery} placeholder="Search countries" />
      <FlatList
        style={{ flex: 1, marginTop: spacing.md }}
        data={filtered}
        keyExtractor={(c) => c.code}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: c }) => (
          <Row title={c.name} subtitle={c.currency.toUpperCase()} onPress={() => pick(c)} right={<Feather name="chevron-right" size={16} color={colors.textTertiary} />} />
        )}
        ListEmptyComponent={<Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: spacing.lg }}>No matching countries.</Text>}
      />
    </Screen>
  );
}
