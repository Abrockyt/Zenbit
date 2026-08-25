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

function subscribe(key, loader, onUpdate) {
  let entry = cache.get(key);
  if (!entry) {
    entry = { data: undefined, error: null, subscribers: new Set(), timer: null, inFlight: null };
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
  if (!entry.timer) entry.timer = setInterval(run, POLL_MS);

  return () => {
    entry.subscribers.delete(onUpdate);
    if (entry.subscribers.size === 0) {
      clearInterval(entry.timer);
      cache.delete(key);
    }
  };
}

function useShared(key, loader) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(key, loader, () => setTick((t) => t + 1)), [key]);
  const entry = cache.get(key);
  return { data: entry?.data ?? null, loading: entry?.data === undefined, error: entry?.error ?? null };
}

export function useMarkets(ids, { vs = "usd", perPage = 100 } = {}) {
  const idParam = ids ? (Array.isArray(ids) ? ids.join(",") : ids) : DEFAULT_IDS;
  const key = `markets:${idParam}:${vs}:${perPage}`;
  const { data, loading, error } = useShared(key, () =>
    getJSON(`${BASE}/coins/markets?vs_currency=${vs}&ids=${idParam}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h`)
  );
  return { data: data ?? [], loading, error };
}

export function useCoinDetail(id) {
  const key = id ? `detail:${id}` : null;
  const { data, loading, error } = useShared(
    key ?? "detail:none",
    () => getJSON(`${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`)
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
