import { useEffect, useState } from "react";

// Real CoinGecko public API — no key required for these endpoints, rate
// limited to roughly 10-30 calls/min on the free tier, hence the 45s poll
// interval below rather than the 2s the old mock used.
const BASE = "https://api.coingecko.com/api/v3";
const DEFAULT_IDS = "bitcoin,ethereum,solana,tether,usd-coin,chainlink,dogecoin,tron,ripple,stellar";
const POLL_MS = 45_000;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko request failed (${res.status})`);
  return res.json();
}

export function useMarkets(ids, { vs = "usd", perPage = 100 } = {}) {
  const [state, setState] = useState({ data: [], loading: true, error: null });
  const idParam = ids ? (Array.isArray(ids) ? ids.join(",") : ids) : DEFAULT_IDS;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = `${BASE}/coins/markets?vs_currency=${vs}&ids=${idParam}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h`;
        const data = await getJSON(url);
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState((s) => ({ data: s.data, loading: false, error: err.message }));
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [idParam, vs, perPage]);

  return state;
}

export function useCoinDetail(id) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    async function load() {
      try {
        const url = `${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
        const data = await getJSON(url);
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [id]);

  return state;
}

// Historical chart is fetched once per id+range — CoinGecko's market_chart
// endpoint returns the full series, no need to poll it every tick.
export function useCoinChart(id, days = 7) {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ data: [], loading: true, error: null });

    async function load() {
      try {
        const url = `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
        const json = await getJSON(url);
        const prices = (json.prices || []).map(([, price]) => price);
        if (!cancelled) setState({ data: prices, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState({ data: [], loading: false, error: err.message });
      }
    }

    load();
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
