import { useApp } from "../state/store";
import { formatMoney, signedMoney } from "./format";

// Binds the display-currency setting to the formatters, so a screen or row never
// hardcodes a symbol. Pair it with `useMarkets(ids, { vs: currency })` — the
// setting changes the currency the market feed is fetched in, so the numbers are
// genuinely converted rather than relabelled.
export function useCurrency() {
  const { state } = useApp();
  const currency = state.settings.currency;
  return {
    currency,
    money: (n, opts) => formatMoney(n, currency, opts),
    signed: (n) => signedMoney(n, currency),
  };
}
