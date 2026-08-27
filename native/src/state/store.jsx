// Single source of truth for everything the app mutates locally.
//
// The wallet is self-custody and there is no backend, so every balance, KYC
// decision, post, message and setting lives here and persists to AsyncStorage.
// Live market data is the one exception — it comes from CoinGecko via
// src/data/useCoinGecko.js and is never written into this store.
//
// Ported from the web app's store.jsx: localStorage (sync) -> AsyncStorage
// (async, so the reducer boots with fresh state and hydrates in an effect
// instead of via useReducer's lazy initializer) and window online/offline
// events -> NetInfo, which is how RN actually knows about connectivity.
//
// Flows are modelled to match "Zenbit Pro - App Flow Diagram": each async action
// moves through loading -> success | error, and every error carries a recovery
// path. Use `useAsyncAction` (src/state/useAsyncAction.js) inside screens rather
// than hand-rolling loading flags.

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { account, card as seedCard, holdings as seedHoldings, transactions as seedTx, watchlist as seedWatchlist } from "../data/mockWallet";
import { seedPosts } from "../data/feedSeed";

// v5: posts gained reposts/bookmarked/pinned/views/community/quoteOf, and
// social gained communities/pinnedCoins. Persisted v4 posts have none of
// those, so a like-for-like restore would render "NaN reposts" and crash
// the community lookups — bumping the key retires that state cleanly
// rather than trying to migrate every nested post shape.
const KEY = "zenbit-pro:state:v5";

// ---------------------------------------------------------------- initial state


const seedThreads = [
  {
    id: "th1",
    with: { handle: "mara.eth", name: "Mara Osei", initials: "MO", avatarUrl: "https://i.pravatar.cc/150?u=mara" },
    messages: [
      { id: "m1", from: "them", body: "did you get filled on that swap?", at: Date.now() - 1000 * 60 * 90 },
      { id: "m2", from: "me", body: "yeah, slippage was rough though", at: Date.now() - 1000 * 60 * 88 },
    ],
  },
  {
    id: "th2",
    with: { handle: "leo.base", name: "Leo Marchetti", initials: "LM", avatarUrl: "https://i.pravatar.cc/150?u=leo" },
    messages: [{ id: "m3", from: "them", body: "sending you the recovery checklist", at: Date.now() - 1000 * 60 * 60 * 26 }],
  },
];

function freshState() {
  return {
    session: { signedIn: false, user: account, expired: false, unlocked: true },
    onboarding: { emailVerified: false, phraseBackedUp: false, faceIdEnabled: false, passcodeSet: false, termsAccepted: false, isNewUser: false },

    // 'unverified' | 'pending' | 'approved' | 'rejected'
    kyc: { status: "unverified", rejectionReason: null, documents: [] },

    wallet: { address: account.address, holdings: seedHoldings, transactions: seedTx, recentRecipients: [] },

    // Card is not ordered yet so the Card flow can demo its own empty state.
    card: { ordered: false, activating: false, frozen: false, balance: 0, last4: seedCard.last4, expMonth: seedCard.expMonth, expYear: seedCard.expYear },

    paymentMethods: [],

    watchlist: seedWatchlist,
    priceAlerts: [],

    social: {
      posts: seedPosts,
      draft: "",
      following: ["mara.eth", "leo.base", "ava.charts", "priya.eth"],
      followers: ["mara.eth", "0xquiet", "toby", "nk.defi", "zaid"],
      muted: [],
      blocked: [],
      reports: [],
      // Communities the account has joined, and the coins pinned to the
      // top of their social profile ("stock pinning").
      communities: ["c-ta", "c-sec"],
      pinnedCoins: ["bitcoin", "ethereum"],
    },

    chat: { threads: seedThreads, queued: [] },

    settings: {
      whoCanMessage: "followers", // everyone | followers | none
      postVisibility: "public", // public | followers
      showPortfolio: false,
      notifications: { security: true, transactions: true, priceAlerts: true, social: true, card: true },
      appLock: { faceId: false, passcode: false, requireOnSensitive: true },
      currency: "usd",
    },

    network: { online: true, queued: [] },
    toasts: [],
  };
}

// ---------------------------------------------------------------------- reducer

function reducer(state, action) {
  switch (action.type) {
    // ---- session / onboarding
    case "session/signIn": {
      let newState = { ...state, session: { ...state.session, signedIn: true, expired: false, unlocked: true } };
      if (action.isNewUser) {
        newState.wallet = { ...newState.wallet, holdings: [], transactions: [] };
        newState.session.user = { ...newState.session.user, name: action.name || "New User", email: action.email || "new@user.com", avatarUrl: null, avatarInitials: "NU" };
        // NOT touching watchlist here: PickWatchlistScreen already ran and
        // set it (to the person's picks, or explicitly to [] on skip)
        // *before* this fires — session/signIn is dispatched at the very
        // end of signup, from PasscodeScreen. Resetting it here would wipe
        // out whatever they just picked.
      } else {
        // Logging in is a *returning* account, so it lands on the funded
        // demo wallet — a real exchange login shows the holdings you
        // already had. Without this, signing up (which correctly empties
        // the wallet) and then logging back in left a returning user
        // staring at a 0.00 balance and an empty portfolio, with no way to
        // reach any of the app that depends on actually holding coins.
        newState.wallet = {
          ...newState.wallet,
          holdings: state.wallet.holdings.length ? state.wallet.holdings : seedHoldings,
          transactions: state.wallet.transactions.length ? state.wallet.transactions : seedTx,
        };
        newState.session.user = { ...account };
        newState.watchlist = state.watchlist.length ? state.watchlist : seedWatchlist;
        // A returning demo account is already verified, and already has its
        // card — otherwise every fresh login walls Buy/Sell and Card back
        // off behind onboarding the account has notionally already done.
        newState.kyc = { ...state.kyc, status: "approved", rejectionReason: null };
        newState.card = { ...state.card, ordered: true, balance: state.card.balance || 240.5 };
      }
      return newState;
    }
    case "session/signOut":
      return { ...freshState(), watchlist: state.watchlist };
    case "session/expire":
      return { ...state, session: { ...state.session, expired: true } };
    case "session/lock":
      return { ...state, session: { ...state.session, unlocked: false } };
    case "session/unlock":
      return { ...state, session: { ...state.session, unlocked: true, expired: false } };
    case "onboarding/set":
      return { ...state, onboarding: { ...state.onboarding, ...action.patch } };
    case "session/setUser":
      return { ...state, session: { ...state.session, user: { ...state.session.user, ...action.patch } } };

    // ---- KYC
    case "kyc/submit":
      // `quality` ("good" | "blurry") is what the review outcome keys off —
      // a good capture is approved, so verification isn't an arbitrary
      // coin-flip that contradicts what the capture screen just said.
      return { ...state, kyc: { status: "pending", rejectionReason: null, documents: action.documents ?? [], quality: action.quality ?? "good" } };
    case "kyc/approve":
      return { ...state, kyc: { ...state.kyc, status: "approved", rejectionReason: null } };
    case "kyc/reject":
      return { ...state, kyc: { ...state.kyc, status: "rejected", rejectionReason: action.reason } };
    case "kyc/reset":
      return { ...state, kyc: { status: "unverified", rejectionReason: null, documents: [] } };

    // ---- wallet
    case "wallet/addTransaction":
      return { ...state, wallet: { ...state.wallet, transactions: [action.tx, ...state.wallet.transactions] } };
    case "wallet/patchTransaction":
      return {
        ...state,
        wallet: {
          ...state.wallet,
          transactions: state.wallet.transactions.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
        },
      };
    case "wallet/adjustUnits": {
      // A first-ever buy of a coin the wallet doesn't already hold a row
      // for used to silently do nothing — .map() only touches an existing
      // match, so the purchase would go through (receipt, transaction
      // history) but never actually appear in the portfolio. Insert a new
      // holding when there isn't one to add units to and the delta is
      // positive (a buy); a negative delta with no existing holding has
      // nothing to subtract from, so it stays a no-op.
      const exists = state.wallet.holdings.some((h) => h.id === action.id);
      const holdings = exists
        ? state.wallet.holdings.map((h) => (h.id === action.id ? { ...h, units: Math.max(0, h.units + action.delta) } : h))
        : action.delta > 0
          ? [...state.wallet.holdings, { id: action.id, symbol: action.symbol ?? action.id, name: action.name ?? action.id, units: action.delta }]
          : state.wallet.holdings;
      return { ...state, wallet: { ...state.wallet, holdings } };
    }
    case "wallet/addRecipient": {
      const next = [action.recipient, ...state.wallet.recentRecipients.filter((r) => r.address !== action.recipient.address)].slice(0, 6);
      return { ...state, wallet: { ...state.wallet, recentRecipients: next } };
    }
    case "wallet/fund":
      return {
        ...state,
        wallet: {
          ...state.wallet,
          holdings: state.wallet.holdings.length ? state.wallet.holdings : seedHoldings,
        },
      };
    case "wallet/empty":
      return { ...state, wallet: { ...state.wallet, holdings: [], transactions: [] } };

    // ---- card
    case "card/order":
      return { ...state, card: { ...state.card, ordered: true, activating: true } };
    case "card/activated":
      return { ...state, card: { ...state.card, activating: false, balance: action.balance ?? 0 } };
    case "card/freeze":
      return { ...state, card: { ...state.card, frozen: true } };
    case "card/unfreeze":
      return { ...state, card: { ...state.card, frozen: false } };
    case "card/topUp":
      return { ...state, card: { ...state.card, balance: state.card.balance + action.amount } };

    // ---- payment methods
    case "payment/add":
      return { ...state, paymentMethods: [...state.paymentMethods, action.method] };
    case "payment/remove":
      return { ...state, paymentMethods: state.paymentMethods.filter((m) => m.id !== action.id) };

    // ---- watchlist / alerts
    case "watchlist/toggle":
      return {
        ...state,
        watchlist: state.watchlist.includes(action.id) ? state.watchlist.filter((i) => i !== action.id) : [...state.watchlist, action.id],
      };
    case "watchlist/clear":
      return { ...state, watchlist: [] };
    case "watchlist/set":
      return { ...state, watchlist: action.ids };
    case "alerts/add":
      return { ...state, priceAlerts: [...state.priceAlerts, action.alert] };
    case "alerts/remove":
      return { ...state, priceAlerts: state.priceAlerts.filter((a) => a.id !== action.id) };

    // ---- social
    case "social/addPost": {
      const newPost = {
        id: "p" + Date.now(),
        author: {
          handle: "you",
          name: state.session.user.name,
          avatarUrl: state.session.user.avatarUrl,
          initials: state.session.user.avatarInitials
        },
        body: action.post.body,
        tags: action.post.tags || [],
        image: action.post.image || null,
        trade: action.post.trade || null,
        community: action.post.community || null,
        quoteOf: action.post.quoteOf || null,
        type: action.post.type || "post",
        createdAt: Date.now(),
        likes: 0,
        liked: false,
        reposts: 0,
        reposted: false,
        bookmarked: false,
        pinned: false,
        views: 0,
        replies: [],
        visibility: state.settings.postVisibility,
      };
      return { ...state, social: { ...state.social, posts: [newPost, ...state.social.posts], draft: "" } };
    }
    case "social/setDraft":
      return { ...state, social: { ...state.social, draft: action.draft } };
    case "social/toggleLike":
      return {
        ...state,
        social: {
          ...state.social,
          posts: state.social.posts.map((p) => (p.id === action.id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)),
        },
      };
    case "social/addReply":
      return {
        ...state,
        social: {
          ...state.social,
          posts: state.social.posts.map((p) => (p.id === action.postId ? { ...p, replies: [...p.replies, action.reply] } : p)),
        },
      };
    case "social/toggleReplyLike":
      return {
        ...state,
        social: {
          ...state.social,
          posts: state.social.posts.map((p) =>
            p.id === action.postId
              ? {
                  ...p,
                  replies: p.replies.map((r) =>
                    r.id === action.replyId ? { ...r, liked: !r.liked, likes: (r.likes ?? 0) + (r.liked ? -1 : 1) } : r
                  ),
                }
              : p
          ),
        },
      };
    // Repost is a real state change with a real count, not a toast — same
    // shape as like, since it's the same kind of reversible engagement.
    case "social/toggleRepost":
      return {
        ...state,
        social: {
          ...state.social,
          posts: state.social.posts.map((p) =>
            p.id === action.id ? { ...p, reposted: !p.reposted, reposts: p.reposts + (p.reposted ? -1 : 1) } : p
          ),
        },
      };
    case "social/toggleBookmark":
      return {
        ...state,
        social: {
          ...state.social,
          posts: state.social.posts.map((p) => (p.id === action.id ? { ...p, bookmarked: !p.bookmarked } : p)),
        },
      };
    case "social/togglePin":
      return {
        ...state,
        social: {
          ...state.social,
          posts: state.social.posts.map((p) => (p.id === action.id ? { ...p, pinned: !p.pinned } : p)),
        },
      };
    case "social/toggleCommunity":
      return {
        ...state,
        social: {
          ...state.social,
          communities: state.social.communities.includes(action.id)
            ? state.social.communities.filter((c) => c !== action.id)
            : [...state.social.communities, action.id],
        },
      };
    case "social/togglePinnedCoin":
      return {
        ...state,
        social: {
          ...state.social,
          pinnedCoins: state.social.pinnedCoins.includes(action.id)
            ? state.social.pinnedCoins.filter((c) => c !== action.id)
            : [...state.social.pinnedCoins, action.id],
        },
      };
    case "social/toggleFollow":
      return {
        ...state,
        social: {
          ...state.social,
          following: state.social.following.includes(action.handle)
            ? state.social.following.filter((h) => h !== action.handle)
            : [...state.social.following, action.handle],
        },
      };
    case "social/toggleMute":
      return {
        ...state,
        social: {
          ...state.social,
          muted: state.social.muted.includes(action.handle) ? state.social.muted.filter((h) => h !== action.handle) : [...state.social.muted, action.handle],
        },
      };
    case "social/toggleBlock":
      return {
        ...state,
        social: {
          ...state.social,
          blocked: state.social.blocked.includes(action.handle) ? state.social.blocked.filter((h) => h !== action.handle) : [...state.social.blocked, action.handle],
        },
      };
    case "social/report":
      return { ...state, social: { ...state.social, reports: [...state.social.reports, action.report] } };
    case "social/clearPosts":
      return { ...state, social: { ...state.social, posts: [] } };
    case "social/restorePosts":
      return { ...state, social: { ...state.social, posts: seedPosts } };

    // ---- chat
    case "chat/send":
      return {
        ...state,
        chat: {
          ...state.chat,
          threads: state.chat.threads.map((t) => (t.id === action.threadId ? { ...t, messages: [...t.messages, action.message] } : t)),
        },
      };
    case "chat/queue":
      return { ...state, chat: { ...state.chat, queued: [...state.chat.queued, action.item] } };
    case "chat/flushQueue":
      return { ...state, chat: { ...state.chat, queued: [] } };
    case "chat/startThread":
      return { ...state, chat: { ...state.chat, threads: [action.thread, ...state.chat.threads] } };
    case "chat/clearThreads":
      return { ...state, chat: { ...state.chat, threads: [] } };

    // ---- settings
    case "settings/set":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "settings/setNotification":
      return { ...state, settings: { ...state.settings, notifications: { ...state.settings.notifications, [action.key]: action.value } } };
    case "settings/setAppLock":
      return { ...state, settings: { ...state.settings, appLock: { ...state.settings.appLock, ...action.patch } } };

    // ---- network (cross-cutting)
    case "network/online":
      return { ...state, network: { ...state.network, online: true } };
    case "network/offline":
      return { ...state, network: { ...state.network, online: false } };
    case "network/enqueue":
      return { ...state, network: { ...state.network, queued: [...state.network.queued, action.item] } };
    case "network/drain":
      return { ...state, network: { ...state.network, queued: [] } };

    // ---- toasts
    case "toast/push":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "toast/dismiss":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    // ---- dev / demo helpers, used by the state inspector on Profile
    case "state/replace":
      return action.state;
    case "state/reset":
      return freshState();

    default:
      return state;
  }
}

// ---------------------------------------------------------------------- context

const AppContext = createContext(null);

// Shallow-merge saved JSON over a fresh tree so added keys in later versions
// don't crash — same merge shape the web store used with localStorage.
function mergeSaved(saved) {
  const base = freshState();
  return {
    ...base,
    ...saved,
    session: {
      ...base.session,
      ...saved.session,
      user: { ...base.session.user, ...saved.session?.user },
    },
    settings: {
      ...base.settings,
      ...saved.settings,
      notifications: { ...base.settings.notifications, ...saved.settings?.notifications },
      appLock: { ...base.settings.appLock, ...saved.settings?.appLock },
    },
    social: { ...base.social, ...saved.social },
  };
}

export function AppProvider({ children }) {
  // AsyncStorage is async, unlike localStorage, so the reducer boots with
  // fresh state and a hydrate effect below replaces it once storage resolves
  // — screens see the seed data for one frame on cold start, then the real
  // persisted state.
  const [state, dispatch] = useReducer(reducer, null, freshState);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        dispatch({ type: "state/replace", state: mergeSaved(JSON.parse(raw)) });
      })
      .catch(() => {
        /* corrupt or missing entry — fresh state already loaded */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {
      /* storage full or blocked — the demo still works in-memory */
    });
  }, [state]);

  // Real connectivity drives the cross-cutting network-loss flow.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      dispatch({ type: netState.isConnected ? "network/online" : "network/offline" });
    });
    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

// Convenience selectors so screens don't reach into the tree shape directly.
export function useSession() {
  return useApp().state.session;
}
export function useKyc() {
  return useApp().state.kyc;
}
export function useSettings() {
  return useApp().state.settings;
}
export function useToast() {
  const { dispatch } = useApp();
  return (message, tone = "neutral") => {
    const id = `t${Date.now()}${Math.random().toString(16).slice(2, 6)}`;
    dispatch({ type: "toast/push", toast: { id, message, tone } });
    setTimeout(() => dispatch({ type: "toast/dismiss", id }), 3000);
  };
}
