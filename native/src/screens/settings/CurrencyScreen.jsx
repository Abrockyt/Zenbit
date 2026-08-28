import { Feather } from "../../ui/IconCompat";
import { Screen, Header, Row, colors } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

export const CURRENCIES = [
  { code: "usd", label: "US dollar", symbol: "$" },
  { code: "eur", label: "Euro", symbol: "€" },
  { code: "gbp", label: "British pound", symbol: "£" },
  { code: "inr", label: "Indian rupee", symbol: "₹" },
  { code: "jpy", label: "Japanese yen", symbol: "¥" },
  { code: "aud", label: "Australian dollar", symbol: "A$" },
  { code: "cad", label: "Canadian dollar", symbol: "C$" },
  { code: "aed", label: "UAE dirham", symbol: "AED" },
];

export default function CurrencyScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const current = state.settings.currency;
  const pick = (code) => {
    if (code === current) return;
    dispatch({ type: "settings/set", patch: { currency: code } });
    toast(`Prices now shown in ${code.toUpperCase()}.`);
  };

  return (
    <Screen>
      <Header title="Display currency" onBack={() => navigation.goBack()} />
      {CURRENCIES.map((c) => (
        <Row key={c.code} title={c.label} subtitle={`${c.symbol} · ${c.code.toUpperCase()}`} onPress={() => pick(c.code)} right={c.code === current ? <Feather name="check" size={18} color={colors.up} /> : undefined} />
      ))}
    </Screen>
  );
}
