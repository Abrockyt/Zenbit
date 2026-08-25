import { useEffect, useState } from "react";

// Real CoinGecko public API — no key required for these endpoints, rate
// limited to roughly 10-30 calls/min on the free tier.
//
// React Navigation's native-stack keeps every visited screen mounted (just
// off-screen) rather than unmounting it, so a naive per-component
// useEffect+setInterval means every screen you've ever visited in a session
// keeps polling forever in the background — Home, Market, Swap, Send etc.
// all firing independently multiplies request volume fast enough to trip
// CoinGecko's rate limit within a couple of minutes of normal navigation.
// Fixed with a shared cache below: components requesting the same
// endpoint+params share one fetch/poll cycle and one in-flight promise,
// keyed by request, with a subscriber set — same shape as the old mock's
// useLiveCoins, just backed by a real fetch instead of a random walk.
const BASE = "https://api.coingecko.com/api/v3";
const DEFAULT_IDS = "bitcoin,ethereum,solana,tether,usd-coin,chainlink,dogecoin,tron,ripple,stellar";
const POLL_MS = 60_000;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko request failed (${res.status})`);
  return res.json();
}

// key -> { data, error, subscribers: Set<fn>, timer, inFlight }
const cache = new Map();

function subscribe(key, loader, onUpdate, intervalMs = POLL_MS) {
  let entry = cache.get(key);
  if (!entry) {
    entry = { data: undefined, error: null, subscribers: new Set(), timer: null, inFlight: null, intervalMs };
    cache.set(key, entry);
  }
  entry.subscribers.add(onUpdate);

  const run = () => {
    if (entry.inFlight) return entry.inFlight;
    entry.inFlight = loader()
      .then((data) => {
        entry.data = data;
        entry.error = null;
      })
      .catch((err) => {
        entry.error = err.message;
      })
      .finally(() => {
        entry.inFlight = null;
        entry.subscribers.forEach((fn) => fn());
      });
    return entry.inFlight;
  };

  if (entry.data === undefined && !entry.inFlight) run();
  // The screen actually looking at this data (e.g. the live chart) can ask
  // for a faster cadence than the default background poll — the fastest
  // request among current subscribers wins, and the timer is restarted at
  // that rate.
  if (!entry.timer) {
    entry.intervalMs = intervalMs;
    entry.timer = setInterval(run, entry.intervalMs);
  } else if (intervalMs < entry.intervalMs) {
    entry.intervalMs = intervalMs;
    clearInterval(entry.timer);
    entry.timer = setInterval(run, entry.intervalMs);
  }

  // Deliberately never delete the cache entry itself, only stop its poll
  // timer once nobody's subscribed. React re-mounts components once in dev
  // (StrictMode-style double-invoke) — if unmount A raced ahead of its
  // in-flight fetch and deleted the entry, the fetch would resolve into an
  // orphaned object nobody could see, and mount B would start over from an
  // empty cache, which is exactly the kind of race that made data
  // intermittently never render. Keeping the entry alive means mount B
  // reuses the same object mount A's fetch is still populating.
  return () => {
    entry.subscribers.delete(onUpdate);
    if (entry.subscribers.size === 0 && entry.timer) {
      clearInterval(entry.timer);
      entry.timer = null;
    }
  };
}

function useShared(key, loader, intervalMs) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(key, loader, () => setTick((t) => t + 1), intervalMs), [key, intervalMs]);
  const entry = cache.get(key);
  // Once a fetch has resolved — success or failure — this is no longer
  // "loading". Without the !error check, a request that keeps failing
  // (rate limit, offline) leaves data permanently undefined, so `loading`
  // never flips false and any UI keyed off it (skeletons) spins forever
  // even while the error banner is already showing above it.
  return { data: entry?.data ?? null, loading: entry?.data === undefined && !entry?.error, error: entry?.error ?? null };
}

export function useMarkets(ids, { vs = "usd", perPage = 100 } = {}) {
  const idParam = ids ? (Array.isArray(ids) ? ids.join(",") : ids) : DEFAULT_IDS;
  const key = `markets:${idParam}:${vs}:${perPage}`;
  const { data, loading, error } = useShared(key, () =>
    getJSON(`${BASE}/coins/markets?vs_currency=${vs}&ids=${idParam}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h`)
  );
  return { data: data ?? [], loading, error };
}

// Faster than the default 60s background poll — this is the live price a
// person is actively watching on the coin detail screen, so it ticks
// closer to real time. Kept moderate (not e.g. 5-10s) because CoinGecko's
// free tier rate-limits hard and this session hit it repeatedly during
// testing — a tighter poll on the one screen that's actually open is worth
// it, but pushing it further starts trading liveliness for more frequent
// "couldn't load" errors, which is worse than a slightly slower tick.
const LIVE_POLL_MS = 20_000;

export function useCoinDetail(id) {
  const key = id ? `detail:${id}` : null;
  const { data, loading, error } = useShared(
    key ?? "detail:none",
    () => getJSON(`${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
    LIVE_POLL_MS
  );
  if (!id) return { data: null, loading: false, error: null };
  return { data, loading, error };
}

// Historical chart is fetched once per id+range and cached — CoinGecko's
// market_chart endpoint returns the full series, no need to poll it, and
// re-visiting the same coin/range reuses the cached series instead of
// re-fetching.
const chartCache = new Map();

export function useCoinChart(id, days = 7) {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    if (!id) return;
    const key = `chart:${id}:${days}`;
    if (chartCache.has(key)) {
      setState({ data: chartCache.get(key), loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ data: [], loading: true, error: null });

    getJSON(`${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`)
      .then((json) => {
        const prices = (json.prices || []).map(([, price]) => price);
        chartCache.set(key, prices);
        if (!cancelled) setState({ data: prices, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: [], loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, [id, days]);

  return state;
}

// Real candlestick data — CoinGecko's /ohlc endpoint, not the synthetic
// close-price-only series useCoinChart uses. Granularity is fixed by their
// API to the `days` value: 1 day returns 30-minute candles, 7-30 days
// returns 4-hour candles, and anything longer returns 4-day candles — so
// polling this faster than the default 60s buys nothing visible (the
// bucket a fresh candle would land in doesn't change on a 20s cadence);
// the live-feeling part is the current price above the chart, not the
// candles themselves.
//
// Built on the same shared/polling cache as the live price (useShared),
// so the chart re-fetches every POLL_MS instead of loading once and going
// stale while the price above it keeps ticking.
export function useCoinOHLC(id, days = 1) {
  const key = id ? `ohlc:${id}:${days}` : null;
  const { data, loading, error } = useShared(
    key ?? "ohlc:none",
    () => getJSON(`${BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`).then(
      (json) => (json || []).map(([t, open, high, low, close]) => ({ t, open, high, low, close }))
    )
  );
  if (!id) return { data: [], loading: false, error: null };
  return { data: data ?? [], loading, error };
}

// Real per-interval volume. CoinGecko's /ohlc endpoint returns no volume at
// all, so the volume bars under the chart come from /market_chart's
// total_volumes series instead — same coin, same window, real numbers.
// Returned alongside its timestamps so the chart can align volume bars to
// candles by time rather than assuming both series have the same length
// (they don't — the two endpoints bucket differently).
export function useCoinVolume(id, days = 1) {
  const key = id ? `vol:${id}:${days}` : null;
  const { data, loading, error } = useShared(
    key ?? "vol:none",
    () => getJSON(`${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`).then(
      (json) => (json.total_volumes || []).map(([t, v]) => ({ t, v }))
    )
  );
  if (!id) return { data: [], loading: false, error: null };
  return { data: data ?? [], loading, error };
}

// Real exchange markets for this coin — per-exchange last price, spread and
// volume. This is what backs the markets/depth section: CoinGecko's free
// tier has no live order-book endpoint, so rather than inventing bids and
// asks, the section shows the real venues trading this pair and their real
// quoted prices and spreads.
export function useCoinTickers(id) {
  const key = id ? `tickers:${id}` : null;
  const { data, loading, error } = useShared(
    key ?? "tickers:none",
    () => getJSON(`${BASE}/coins/${id}/tickers?include_exchange_logo=true&depth=true`).then(
      (json) => (json.tickers || []).slice(0, 25)
    )
  );
  if (!id) return { data: [], loading: false, error: null };
  return { data: data ?? [], loading, error };
}

export function useCoinSearch(query, delay = 350) {
  const [state, setState] = useState({ data: [], loading: false, error: null });

  useEffect(() => {
    if (!query) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    const t = setTimeout(async () => {
      try {
        const json = await getJSON(`${BASE}/search?query=${encodeURIComponent(query)}`);
        if (!cancelled) setState({ data: json.coins || [], loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState({ data: [], loading: false, error: err.message });
      }
    }, delay);

    return () => { cancelled = true; clearTimeout(t); };
  }, [query, delay]);

  return state;
}
