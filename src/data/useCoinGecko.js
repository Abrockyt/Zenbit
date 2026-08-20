import { useEffect, useState, useMemo } from "react";

// Mock data generator for fake real-time market data
const BASE_COINS = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 94000, price_change_percentage_24h: 2.4, image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
  { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3400, price_change_percentage_24h: -1.2, image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  { id: "solana", symbol: "sol", name: "Solana", current_price: 145, price_change_percentage_24h: 5.6, image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
  { id: "tether", symbol: "usdt", name: "Tether", current_price: 1.0, price_change_percentage_24h: 0.01, image: "https://assets.coingecko.com/coins/images/325/large/Tether.png" },
  { id: "usd-coin", symbol: "usdc", name: "USD Coin", current_price: 1.0, price_change_percentage_24h: 0.0, image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png" },
  { id: "chainlink", symbol: "link", name: "Chainlink", current_price: 18.5, price_change_percentage_24h: 3.2, image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png" },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin", current_price: 0.12, price_change_percentage_24h: -4.5, image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png" },
  { id: "tron", symbol: "trx", name: "TRON", current_price: 0.11, price_change_percentage_24h: 1.1, image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png" },
  { id: "ripple", symbol: "xrp", name: "XRP", current_price: 0.58, price_change_percentage_24h: -0.5, image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white.png" },
  { id: "stellar", symbol: "xlm", name: "Stellar", current_price: 0.10, price_change_percentage_24h: 2.0, image: "https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png" },
];

let globalCoins = BASE_COINS.map(c => {
  let p = c.current_price;
  const walk = [];
  for (let i = 0; i < 120; i++) {
    p = p * (1 + (Math.random() - 0.5) * 0.01);
    walk.push(p);
  }
  return {
    ...c,
    sparkline_in_7d: { price: walk }
  };
});
const subscribers = new Set();

// Simulate real-time price fluctuations
setInterval(() => {
  globalCoins = globalCoins.map(coin => {
    if (coin.id === 'tether' || coin.id === 'usd-coin') return coin; // Stablecoins
    const change = 1 + (Math.random() - 0.5) * 0.01; // 1% max jump

    const newPrice = coin.current_price * change;
    const sparkline = [...coin.sparkline_in_7d.price.slice(1), newPrice];
    return {
      ...coin,
      current_price: newPrice,
      price_change_percentage_24h: coin.price_change_percentage_24h + (Math.random() - 0.5) * 0.5,
      sparkline_in_7d: { price: sparkline }
    };
  });
  subscribers.forEach(cb => cb(globalCoins));
}, 2000);

function useLiveCoins() {
  const [coins, setCoins] = useState(globalCoins);
  useEffect(() => {
    subscribers.add(setCoins);
    return () => subscribers.delete(setCoins);
  }, []);
  return coins;
}

export function useMarkets(ids, { vs = "usd", perPage = 100 } = {}) {
  const liveCoins = useLiveCoins();
  const data = useMemo(() => {
    if (!ids) return liveCoins;
    const idArray = Array.isArray(ids) ? ids : ids.split(",");
    return liveCoins.filter(c => idArray.includes(c.id));
  }, [liveCoins, ids]);

  return { data, loading: false, error: null };
}

export function useCoinDetail(id) {
  const liveCoins = useLiveCoins();
  const data = useMemo(() => {
    const coin = liveCoins.find(c => c.id === id);
    if (!coin) return null;
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: { large: coin.image, small: coin.image },
      market_cap_rank: 1,
      market_data: {
        current_price: { usd: coin.current_price },
        price_change_percentage_24h: coin.price_change_percentage_24h,
        high_24h: { usd: coin.current_price * 1.05 },
        low_24h: { usd: coin.current_price * 0.95 },
        total_volume: { usd: coin.current_price * 1000000 },
        market_cap: { usd: coin.current_price * 19000000 },
        circulating_supply: 19000000
      }
    };
  }, [liveCoins, id]);

  return { data, loading: false, error: null };
}

// ── Stable chart data cache ──────────────────────────────────────────────
// Real trading charts work like this:
//   1. Historical candles are FIXED — each represents a completed time period
//   2. Only the LAST candle (current period) updates with live price
//   3. History is fetched once and never regenerated
//
// We replicate this by caching generated history per coin+timeframe in a Map.
// On each live tick, we only replace the very last data point.

const chartCache = new Map(); // key: "coinId-days" → { history: number[] }

function getOrCreateHistory(coinId, days, seedPrice) {
  const key = `${coinId}-${days}`;
  if (chartCache.has(key)) return chartCache.get(key);

  const volMap = { 1: 0.003, 3: 0.004, 7: 0.005, 30: 0.008, 90: 0.010, 365: 0.012 };
  const countMap = { 1: 40, 3: 50, 7: 60, 30: 80, 90: 90, 365: 100 };
  const volatility = volMap[days] ?? 0.005;
  const count = countMap[days] ?? 60;

  // Generate a random walk backward from seed price, then reverse
  // so prices flow left→right chronologically
  const walk = [seedPrice];
  for (let i = 1; i < count; i++) {
    const prev = walk[walk.length - 1];
    walk.push(prev * (1 + (Math.random() - 0.5) * volatility));
  }
  const history = walk.reverse();
  chartCache.set(key, history);
  return history;
}

export function useCoinChart(id, days = 7) {
  const liveCoins = useLiveCoins();
  const data = useMemo(() => {
    const coin = liveCoins.find(c => c.id === id);
    if (!coin) return [];

    // Get or create stable history (generated once, never changes)
    const history = getOrCreateHistory(id, days, coin.current_price);

    // Return history with ONLY the last point updated to the live price
    // This is exactly how real charts work: history is fixed, last candle updates
    const result = history.slice(0, -1);
    result.push(coin.current_price);
    return result;
  }, [liveCoins, id, days]);

  return { data, loading: false, error: null };
}

export function useCoinSearch(query, delay = 350) {
  const data = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return globalCoins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }, [query]);

  return { data, loading: false, error: null };
}
