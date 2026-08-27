import { useEffect, useRef, useState } from "react";

/**
 * Holds a screen in its loading state for a minimum duration on first
 * mount, even when it has no real async fetch to wait on.
 *
 * Most screens here already show a real skeleton proportional to an actual
 * network fetch (Home, Market, Swap, CoinDetail — via useMarkets/
 * useCoinDetail's `loading`). The gap this fills is the screens with no
 * remote data at all (Card, Profile's static parts, Settings) that popped
 * in instantly with zero loading treatment — which reads as an unfinished
 * page snapping into place rather than a screen that loaded.
 *
 * Deliberately per-mount, not per-navigation: MainTabs keeps tab screens
 * mounted, so switching back to an already-visited tab does NOT re-run
 * this — only the first visit in a session gets the loading beat. Re-
 * showing it on every tab switch would make navigation feel slower for no
 * real benefit.
 */
export function useBootReady(minMs = 600) {
  const [ready, setReady] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const t = setTimeout(() => setReady(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);

  return ready;
}
