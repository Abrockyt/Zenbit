// Mock local state for the self-custody wallet demo. There is no backend —
// balances, holdings, the card and transaction history are all seeded here.
// Only market prices (src/data/useCoinGecko.js) are live.

export const account = {
  name: "Alex Rivera",
  email: "alex.rivera@gmail.com",
  address: "0x8f3Cc1a2B9E4d6F0a7C5b3D9e1A4c6F8B0d2E4A6",
  avatarInitials: "AR",
  // Deterministic placeholder headshot (pravatar.cc — a free service built
  // exactly for this: a real-looking photo in a prototype without using
  // anyone's actual likeness or a licensed stock image).
  avatarUrl: "https://i.pravatar.cc/160?u=alex.rivera@gmail.com",
  memberSince: "Mar 2024",
};

// coingecko id -> holding units. Drives Home / Asset balances against live prices.
export const holdings = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", units: 0.1842 },
  { id: "ethereum", symbol: "eth", name: "Ethereum", units: 2.317 },
  { id: "solana", symbol: "sol", name: "Solana", units: 18.4 },
  { id: "tether", symbol: "usdt", name: "Tether", units: 640.0 },
  { id: "usd-coin", symbol: "usdc", name: "USD Coin", units: 210.5 },
  { id: "chainlink", symbol: "link", name: "Chainlink", units: 42.0 },
];

export const watchlist = ["bitcoin", "ethereum", "solana", "dogecoin", "tron", "ripple", "stellar", "chainlink"];

export const transactions = [
  { id: "t1", kind: "receive", title: "Received ETH", subtitle: "From 0x71...4a2c", amount: 842.15, negative: false, date: "Today, 9:12 AM" },
  { id: "t2", kind: "card", title: "Starbucks", subtitle: "Card •• 4821", amount: 6.5, negative: true, merchant: "starbucks", date: "Today, 8:03 AM" },
  { id: "t3", kind: "swap", title: "Swapped USDC → SOL", subtitle: "Rate 1 SOL = 178.42 USDC", amount: 500.0, negative: true, date: "Yesterday, 6:41 PM" },
  { id: "t4", kind: "send", title: "Sent BTC", subtitle: "To 0x4e...9b31", amount: 1200.0, negative: true, date: "Yesterday, 2:17 PM" },
  { id: "t5", kind: "card", title: "Amazon", subtitle: "Card •• 4821", amount: 84.23, negative: true, merchant: "amazon", date: "Aug 18, 11:52 AM" },
  { id: "t6", kind: "buy", title: "Bought ETH", subtitle: "Apple Pay", amount: 300.0, negative: false, date: "Aug 17, 4:30 PM" },
  { id: "t7", kind: "receive", title: "Received USDT", subtitle: "From 0x9a...1c04", amount: 640.0, negative: false, date: "Aug 15, 10:05 AM" },
  { id: "t8", kind: "card", title: "Uber", subtitle: "Card •• 4821", amount: 22.4, negative: true, merchant: "uber", date: "Aug 14, 7:48 PM" },
];

export const card = {
  last4: "4821",
  frozen: false,
  balance: 1284.62,
  expMonth: "09",
  expYear: "29",
};

export const notifications = [
  { id: "n1", title: "Price alert: BTC crossed $95,000", time: "2h ago", read: false },
  { id: "n2", title: "Your card payment to Uber cleared", time: "1d ago", read: false },
  { id: "n3", title: "Swap complete: USDC → SOL", time: "1d ago", read: true },
  { id: "n4", title: "New sign-in from Windows · Chrome", time: "3d ago", read: true },
];
