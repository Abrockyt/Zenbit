export function formatUsd(n, opts = {}) {
  if (n == null || Number.isNaN(n)) return "$00.00";
  const abs = Math.abs(n);
  const digits = abs > 0 && abs < 1 ? 4 : 2;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: opts.digits ?? digits, maximumFractionDigits: opts.digits ?? digits })}`;
}

// Currency-aware money formatter. The display-currency setting changes the
// `vs_currency` we ask CoinGecko for, so amounts arrive already converted — this
// only has to render them with the right symbol and precision. Zero-decimal
// currencies (JPY) are handled by Intl rather than a hardcoded digit count.
export function formatMoney(n, currency = "usd", opts = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const digits = opts.digits ?? (abs > 0 && abs < 1 ? 4 : 2);
  try {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } catch {
    return `${currency.toUpperCase()} ${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  }
}

export function signedMoney(n, currency = "usd") {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(n), currency, { digits: 2 })}`;
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
