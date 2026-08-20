import { Screen, Row, SectionLabel } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import { useApp, useToast } from "../../state/store";

// Changing this changes the `vs_currency` sent to CoinGecko, so every price in
// the app re-fetches in the chosen currency — it is not a display-only relabel.
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

export default function Currency() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const current = state.settings.currency;

  const pick = (code) => {
    if (code === current) return;
    dispatch({ type: "settings/set", patch: { currency: code } });
    toast(`Prices now shown in ${code.toUpperCase()}.`);
  };

  return (
    <Screen title="Display currency" subtitle="Applies to every price in the app">
      <SectionLabel>Currency</SectionLabel>
      {CURRENCIES.map((c) => (
        <Row
          key={c.code}
          label={c.label}
          hint={`${c.symbol} · ${c.code.toUpperCase()}`}
          onClick={() => pick(c.code)}
          trailing={c.code === current ? <Icon name="check" size={18} color="var(--up-500)" /> : <span style={{ width: 18 }} />}
        />
      ))}
      <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
        Rates come from the live market feed. Your holdings are unchanged — only how they're priced.
      </p>
    </Screen>
  );
}
