export function formatUsd(n, opts = {}) {
  if (n == null || Number.isNaN(n)) return "$00.00";
  const abs = Math.abs(n);
  const digits = abs > 0 && abs < 1 ? 4 : 2;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: opts.digits ?? digits, maximumFractionDigits: opts.digits ?? digits })}`;
}

// en-US grouping (thousands every 3 digits) is wrong for currencies whose
// own readers expect a different grouping — INR's real convention is lakh/
// crore (2-digit groups after the first 3, e.g. 12,34,567), which only
// Intl's "en-IN" (or "hi-IN") locale data produces. Mapping currency→locale
// here means a rupee amount actually reads like a rupee amount, not a
// dollar amount wearing a ₹ sign.
const CURRENCY_LOCALES = {
  inr: "en-IN",
  jpy: "ja-JP",
  eur: "de-DE",
  gbp: "en-GB",
  aud: "en-AU",
  cad: "en-CA",
  aed: "ar-AE",
};

// Currency-aware money formatter. The display-currency setting changes the
// `vs_currency` we ask CoinGecko for, so amounts arrive already converted — this
// only has to render them with the right symbol and precision. Zero-decimal
// currencies (JPY) are handled by Intl rather than a hardcoded digit count.
export function formatMoney(n, currency = "usd", opts = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const digits = opts.digits ?? (abs > 0 && abs < 1 ? 4 : 2);
  const locale = CURRENCY_LOCALES[currency.toLowerCase()] ?? "en-US";
  try {
    return n.toLocaleString(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } catch {
    return `${currency.toUpperCase()} ${n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  }
}

export function signedMoney(n, currency = "usd") {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(n), currency, { digits: 2 })}`;
}

// Abbreviated money for tight spots — stat blocks, chips, card labels.
// A full ₹22,35,953 doesn't fit a quarter-width column at a readable size,
// and shrinking the type to make it fit leaves the row's sizes mismatched.
// Uses each locale's own scale: lakh/crore for INR, K/M/B elsewhere, since
// "₹2.2M" is not how a rupee amount is ever written.
export function compactMoney(n, currency = "usd") {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const cur = currency.toLowerCase();
  const symbol = { usd: "$", eur: "€", gbp: "£", inr: "₹", jpy: "¥", aud: "A$", cad: "C$", aed: "AED " }[cur] ?? "";

  if (cur === "inr") {
    if (abs >= 1e7) return `${sign}${symbol}${(abs / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${sign}${symbol}${(abs / 1e5).toFixed(2)}L`;
  } else {
    if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) return formatMoney(n, currency, { digits: 0 });
  return formatMoney(n, currency);
}

export function formatCrypto(n, symbol = "") {
  if (n == null || Number.isNaN(n)) return `0.000000 ${symbol}`.trim();
  const digits = Math.abs(n) >= 1 ? 4 : 6;
  return `${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${symbol}`.trim();
}

export function formatPct(n) {
  if (n == null || Number.isNaN(n)) return "0.00%";
  return `${Math.abs(n).toFixed(2)}%`;
}

export function signedUsd(n) {
  if (n == null || Number.isNaN(n)) return "$0.00";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
