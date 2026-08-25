import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Every request funnels through here, one at a time with a floor between
// them. Several screens can mount in the same tick (Home + Market + a modal
// all requesting on first paint) and firing them all at once is exactly the
// kind of burst that trips a free rate limit even when the steady-state
// polling rate is well within it. Serialising with a gap smooths that out.
const REQUEST_GAP_MS = 350;
let queueTail = Promise.resolve();
function enqueue(fn) {
  const run = () => new Promise((resolve) => setTimeout(() => resolve(fn()), REQUEST_GAP_MS));
  const result = queueTail.then(run, run);
  queueTail = result.catch(() => {});
  return result;
}

async function getJSON(url) {
  return enqueue(async () => {
    const res = await fetch(url);
    if (res.status === 429) {
      const err = new Error("CoinGecko rate limit (429)");
      err.status = 429;
      throw err;
    }
    if (!res.ok) throw new Error(`CoinGecko request failed (${res.status})`);
    return res.json();
  });
}

// Last-known-good data survives an app restart, keyed by request. A cold
// start that immediately hits a rate limit (common right after heavy
// testing) then shows real, if slightly stale, numbers instead of an empty
// screen — same principle as "showing last known values" mid-session, just
// extended across restarts.
const PERSIST_PREFIX = "zenbit-pro:cache:";
async function loadPersisted(key) {
  try {
    const raw = await AsyncStorage.getItem(PERSIST_PREFIX + key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}
function savePersisted(key, data) {
  AsyncStorage.setItem(PERSIST_PREFIX + key, JSON.stringify(data)).catch(() => {});
}

// key -> { data, error, subscribers: Set<fn>, timer, inFlight }
const cache = new Map();

function subscribe(key, loader, onUpdate, intervalMs = POLL_MS, persist = false) {
  let entry = cache.get(key);
  if (!entry) {
    entry = { data: undefined, error: null, subscribers: new Set(), timer: null, inFlight: null, intervalMs, backoffMs: 0 };
    cache.set(key, entry);
    if (persist) {
      loadPersisted(key).then((cached) => {
        if (cached !== undefined && entry.data === undefined) {
          entry.data = cached;
          entry.subscribers.forEach((fn) => fn());
        }
      });
    }
  }
  entry.subscribers.add(onUpdate);

  const run = () => {
    if (entry.inFlight) return entry.inFlight;
    // Back off after a rate limit instead of hammering the same wall on the
    // next fixed tick — each consecutive 429 doubles the wait, capped at 4
    // minutes, and any success resets it back to the normal cadence.
    if (entry.backoffUntil && Date.now() < entry.backoffUntil) return Promise.resolve();
    entry.inFlight = loader()
      .then((data) => {
        entry.data = data;
        entry.error = null;
        entry.backoffMs = 0;
        entry.backoffUntil = 0;
        if (persist) savePersisted(key, data);
      })
      .catch((err) => {
        entry.error = err.message;
        if (err.status === 429) {
          entry.backoffMs = Math.min((entry.backoffMs || entry.intervalMs) * 2, 240_000);
          entry.backoffUntil = Date.now() + entry.backoffMs;
        }
      })
      .finally(() => {
        entry.inFlight = null;
        entry.subscribers.forEach((fn) => fn());
      });
    return entry.inFlight;
  };

  // Kept on the entry so a screen can force a retry after a failure without
  // waiting for the next poll tick — an error the user can only wait out
  // isn't a recovery path.
  entry.run = run;

  if (entry.data === undefined && !entry.inFlight) run();
  // The screen actually looking at this data (e.g. the live chart) can ask
  // for a faster cadence than the default background poll — the fastest
  // request among current subscribers wins, and the timer is restarted at
  // that rate.
  // Infinity means "don't actively poll this" — used when the screen asking
  // isn't focused right now (see CoinDetailScreen). Every visited coin gets
  // its own cache key and native-stack never unmounts a screen, so without
  // this, every coin detail page you've ever opened in a session would keep
  // polling every 20s forever in the background — a much bigger source of
  // rate-limiting than any single screen's own request rate.
  if (!entry.timer && Number.isFinite(intervalMs)) {
    entry.intervalMs = intervalMs;
    entry.timer = setInterval(run, entry.intervalMs);
  } else if (entry.timer && intervalMs < entry.intervalMs) {
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

function useShared(key, loader, intervalMs, persist = false) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(key, loader, () => setTick((t) => t + 1), intervalMs, persist), [key, intervalMs, persist]);

  // Clears the stored error and any rate-limit backoff, then refires
  // immediately — a person tapping "Try again" is explicitly asking to
  // ignore the backoff, not wait out the rest of it.
  const refetch = useCallback(() => {
    const e = cache.get(key);
    if (!e) return;
    e.error = null;
    e.backoffUntil = 0;
    e.subscribers.forEach((fn) => fn());
    e.run?.();
  }, [key]);

  const entry = cache.get(key);
  // Once a fetch has resolved — success or failure — this is no longer
  // "loading". Without the !error check, a request that keeps failing
  // (rate limit, offline) leaves data permanently undefined, so `loading`
  // never flips false and any UI keyed off it (skeletons) spins forever
  // even while the error banner is already showing above it.
  return { data: entry?.data ?? null, loading: entry?.data === undefined && !entry?.error, error: entry?.error ?? null, refetch };
}

export function useMarkets(ids, { vs = "usd", perPage = 100 } = {}) {
  const idParam = ids ? (Array.isArray(ids) ? ids.join(",") : ids) : DEFAULT_IDS;
  const key = `markets:${idParam}:${vs}:${perPage}`;
  // Persisted: this is the list Home and Market open on, so a cold start
  // that immediately hits a rate limit still shows real (if a little
  // stale) prices instead of a blank list.
  const { data, loading, error, refetch } = useShared(
    key,
    () => getJSON(`${BASE}/coins/markets?vs_currency=${vs}&ids=${idParam}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h`),
    undefined,
    true
  );
  return { data: data ?? [], loading, error, refetch };
}

// Faster than the default 60s background poll — this is the live price a
// person is actively watching on the coin detail screen, so it ticks
// closer to real time. Kept moderate (not e.g. 5-10s) because CoinGecko's
// free tier rate-limits hard and this session hit it repeatedly during
// testing — a tighter poll on the one screen that's actually open is worth
// it, but pushing it further starts trading liveliness for more frequent
// "couldn't load" errors, which is worse than a slightly slower tick.
const LIVE_POLL_MS = 20_000;

// `focused` gates the fast poll to only the coin detail screen the person
// is actually looking at right now (see the Infinity note on the timer
// setup above) — pass false while the screen is backgrounded.
export function useCoinDetail(id, focused = true) {
  const key = id ? `detail:${id}` : null;
  const { data, loading, error, refetch } = useShared(
    key ?? "detail:none",
    () => getJSON(`${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
    focused ? LIVE_POLL_MS : Infinity
  );
  if (!id) return { data: null, loading: false, error: null, refetch };
  return { data, loading, error, refetch };
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
export function useCoinOHLC(id, days = 1, focused = true) {
  const key = id ? `ohlc:${id}:${days}` : null;
  const { data, loading, error, refetch } = useShared(
    key ?? "ohlc:none",
    () => getJSON(`${BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`).then(
      (json) => (json || []).map(([t, open, high, low, close]) => ({ t, open, high, low, close }))
    ),
    focused ? POLL_MS : Infinity
  );
  if (!id) return { data: [], loading: false, error: null };
  return { data: data ?? [], loading, error, refetch };
}

// Real per-interval volume. CoinGecko's /ohlc endpoint returns no volume at
// all, so the volume bars under the chart come from /market_chart's
// total_volumes series instead — same coin, same window, real numbers.
// Returned alongside its timestamps so the chart can align volume bars to
// candles by time rather than assuming both series have the same length
// (they don't — the two endpoints bucket differently).
export function useCoinVolume(id, days = 1, focused = true) {
  const key = id ? `vol:${id}:${days}` : null;
  const { data, loading, error, refetch } = useShared(
    key ?? "vol:none",
    () => getJSON(`${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`).then(
      (json) => (json.total_volumes || []).map(([t, v]) => ({ t, v }))
    ),
    focused ? POLL_MS : Infinity
  );
  if (!id) return { data: [], loading: false, error: null };
  return { data: data ?? [], loading, error, refetch };
}

// Real exchange markets for this coin — per-exchange last price, spread and
// volume. This is what backs the markets/depth section: CoinGecko's free
// tier has no live order-book endpoint, so rather than inventing bids and
// asks, the section shows the real venues trading this pair and their real
// quoted prices and spreads.
export function useCoinTickers(id, focused = true) {
  const key = id ? `tickers:${id}` : null;
  const { data, loading, error, refetch } = useShared(
    key ?? "tickers:none",
    () => getJSON(`${BASE}/coins/${id}/tickers?include_exchange_logo=true&depth=true`).then(
      (json) => (json.tickers || []).slice(0, 25)
    ),
    focused ? POLL_MS : Infinity
  );
  if (!id) return { data: [], loading: false, error: null };
  return { data: data ?? [], loading, error, refetch };
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
