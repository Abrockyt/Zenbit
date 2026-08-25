// Real technical indicators, computed from the real OHLC candles CoinGecko
// returns (see useCoinOHLC). Nothing here is synthesised or randomised —
// every series below is the standard published formula applied to actual
// open/high/low/close values, so the lines drawn on the chart are the same
// ones any other charting tool would draw from the same candles.
//
// Every function returns an array aligned to the END of the candle array:
// indicators need n periods of history before they can produce their first
// value, so the returned array is shorter than `candles` and the chart
// offsets it by (candles.length - series.length) when plotting.

export function sma(values, period) {
  if (values.length < period) return [];
  const out = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out.push(sum / period);
  }
  return out;
}

export function ema(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out = [];
  // Seed with the SMA of the first `period` values, the standard convention.
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

// Bollinger Bands: middle = SMA(period), outer bands = ±mult standard
// deviations of the same window.
export function bollinger(values, period = 20, mult = 2) {
  if (values.length < period) return { upper: [], middle: [], lower: [] };
  const middle = [];
  const upper = [];
  const lower = [];
  for (let i = period - 1; i < values.length; i++) {
    const win = values.slice(i - period + 1, i + 1);
    const mean = win.reduce((a, b) => a + b, 0) / period;
    const variance = win.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    middle.push(mean);
    upper.push(mean + mult * sd);
    lower.push(mean - mult * sd);
  }
  return { upper, middle, lower };
}

// Wilder's Parabolic SAR. Returns one dot per candle (from index 1), each
// tagged with whether the trend was long or short at that point.
export function parabolicSar(candles, step = 0.02, max = 0.2) {
  if (candles.length < 3) return [];
  const out = [];
  let long = candles[1].close >= candles[0].close;
  let sar = long ? candles[0].low : candles[0].high;
  let ep = long ? candles[1].high : candles[1].low;
  let af = step;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    sar = sar + af * (ep - sar);

    if (long) {
      // SAR can never move above the prior two lows while long.
      sar = Math.min(sar, candles[i - 1].low, candles[Math.max(0, i - 2)].low);
      if (c.low < sar) {
        long = false;
        sar = ep;
        ep = c.low;
        af = step;
      } else if (c.high > ep) {
        ep = c.high;
        af = Math.min(af + step, max);
      }
    } else {
      sar = Math.max(sar, candles[i - 1].high, candles[Math.max(0, i - 2)].high);
      if (c.high > sar) {
        long = true;
        sar = ep;
        ep = c.high;
        af = step;
      } else if (c.low < ep) {
        ep = c.low;
        af = Math.min(af + step, max);
      }
    }
    out.push({ value: sar, long });
  }
  return out;
}

// Average True Range — the volatility input SuperTrend needs.
export function atr(candles, period = 10) {
  if (candles.length < period + 1) return [];
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevClose = candles[i - 1].close;
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose)));
  }
  // Wilder smoothing.
  const out = [];
  let prev = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(prev);
  for (let i = period; i < trs.length; i++) {
    prev = (prev * (period - 1) + trs[i]) / period;
    out.push(prev);
  }
  return out;
}

// SuperTrend: ATR-banded trend follower. Returns a value + direction per
// candle so the chart can colour the line by trend the way it's normally
// drawn.
export function superTrend(candles, period = 10, mult = 3) {
  const atrs = atr(candles, period);
  if (!atrs.length) return [];
  const offset = candles.length - atrs.length;
  const out = [];
  let prevUpper = Infinity;
  let prevLower = -Infinity;
  let long = true;

  for (let i = 0; i < atrs.length; i++) {
    const c = candles[offset + i];
    const mid = (c.high + c.low) / 2;
    let upper = mid + mult * atrs[i];
    let lower = mid - mult * atrs[i];
    const prevClose = candles[offset + i - 1]?.close ?? c.close;

    upper = upper < prevUpper || prevClose > prevUpper ? upper : prevUpper;
    lower = lower > prevLower || prevClose < prevLower ? lower : prevLower;

    if (c.close > prevUpper) long = true;
    else if (c.close < prevLower) long = false;

    out.push({ value: long ? lower : upper, long });
    prevUpper = upper;
    prevLower = lower;
  }
  return out;
}

// AVL — volume-weighted average price line. Uses the real per-candle volume
// series when it's available (CoinGecko's market_chart total_volumes), and
// falls back to a plain average of typical price when it isn't, rather than
// inventing volume numbers to weight with.
export function avl(candles, volumes) {
  if (!candles.length) return [];
  const out = [];
  let pv = 0;
  let vol = 0;
  for (let i = 0; i < candles.length; i++) {
    const typical = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const v = volumes?.[i] ?? 1;
    pv += typical * v;
    vol += v;
    out.push(pv / vol);
  }
  return out;
}

// Descriptors the chart and the indicator row share, so adding an indicator
// only means adding it here.
export const INDICATORS = [
  { key: "MA", label: "MA" },
  { key: "EMA", label: "EMA" },
  { key: "BOLL", label: "BOLL" },
  { key: "SAR", label: "SAR" },
  { key: "AVL", label: "AVL" },
  { key: "SUPER", label: "SUPER" },
];
