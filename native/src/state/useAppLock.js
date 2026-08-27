import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useApp } from "./store";

// How long the app has to be backgrounded before coming back requires
// unlocking. Instant re-locking makes the app hostile — flicking out to
// check a 2FA code or paste an address would wall you out every time — so
// there's a grace period, which is what iOS/Android banking apps do.
const LOCK_AFTER_MS = 60_000;

/**
 * Locks the app when it returns to the foreground after being away long
 * enough, if the person has actually turned App Lock on in Security
 * settings.
 *
 * AppLockScreen was fully built and registered as a route but nothing ever
 * navigated to it — the whole feature was unreachable dead code, and the
 * Face ID / passcode toggles in Security settings had no effect on
 * anything. This is the missing trigger.
 *
 * Lives above the navigator (App.tsx) rather than in a screen because the
 * lock has to apply no matter which screen is open when the app is
 * backgrounded, so it takes a navigation ref instead of useNavigation().
 */
export function useAppLock(navigationRef) {
  const { state, dispatch } = useApp();
  const backgroundedAt = useRef(null);

  // Read through a ref inside the AppState listener: the listener is
  // registered once, so closing over state directly would freeze it at the
  // values from first mount and the lock would use stale settings.
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const s = latest.current;
      const enabled = s.settings.appLock.passcode || s.settings.appLock.faceId;

      if (next === "background" || next === "inactive") {
        backgroundedAt.current = Date.now();
        return;
      }

      if (next !== "active") return;

      const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
      backgroundedAt.current = null;

      // Only lock a signed-in session — bouncing someone from the signup
      // flow to a passcode screen for an account that doesn't exist yet
      // would strand them with no way forward.
      if (!enabled || !s.session.signedIn || away < LOCK_AFTER_MS) return;
      if (!navigationRef.isReady()) return;
      if (navigationRef.getCurrentRoute()?.name === "AppLock") return;

      dispatch({ type: "session/lock" });
      navigationRef.navigate("AppLock");
    });

    return () => sub.remove();
  }, [dispatch, navigationRef]);
}
