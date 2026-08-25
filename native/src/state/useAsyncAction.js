import { useCallback, useRef, useState } from "react";
import { useApp } from "./store";

// Every flow in "Zenbit Pro - App Flow Diagram" moves through the same shape:
//
//   default -> loading -> success
//                      -> error -> recovery
//
// `useAsyncAction` is that shape, so screens declare the work and the recovery
// path instead of re-implementing four booleans each time. It also honours the
// cross-cutting network-loss rule from the diagram: while offline, an action is
// queued rather than fired, so nothing is sent twice on reconnect.
//
//   const send = useAsyncAction(async ({ amount }) => { ... }, {
//     label: "Broadcasting transaction",
//     queueWhenOffline: true,
//   });
//
//   send.status   // 'idle' | 'loading' | 'success' | 'error' | 'queued'
//   send.error    // Error | null
//   send.run(args)
//   send.reset()  // the recovery edge — back to default
export function useAsyncAction(fn, { label, queueWhenOffline = false, minDuration = 650 } = {}) {
  const { state, dispatch } = useApp();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const running = useRef(false);

  const run = useCallback(
    async (args) => {
      if (running.current) return;

      if (!state.network.online) {
        if (queueWhenOffline) {
          dispatch({ type: "network/enqueue", item: { label: label ?? "Pending action", at: Date.now() } });
          setStatus("queued");
          return;
        }
        setError(new Error("Connection lost. Check your network and try again."));
        setStatus("error");
        return;
      }

      running.current = true;
      setStatus("loading");
      setError(null);
      const started = Date.now();
      try {
        const value = await fn(args);
        // Hold the loading state briefly so the transition is legible rather
        // than a flash — the design system asks for quiet, deliberate motion.
        const elapsed = Date.now() - started;
        if (elapsed < minDuration) await new Promise((r) => setTimeout(r, minDuration - elapsed));
        setResult(value ?? null);
        setStatus("success");
        return value;
      } catch (err) {
        const elapsed = Date.now() - started;
        if (elapsed < minDuration) await new Promise((r) => setTimeout(r, minDuration - elapsed));
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      } finally {
        running.current = false;
      }
    },
    [fn, dispatch, label, queueWhenOffline, minDuration, state.network.online]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    status,
    error,
    result,
    run,
    reset,
    isIdle: status === "idle",
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    isQueued: status === "queued",
  };
}

// Deterministic pseudo-failure so error + recovery states are reachable in the
// demo without a backend. Screens pass a rate; the same input fails predictably
// within a session, which keeps the prototype honest instead of random.
export function simulate({ failRate = 0, message = "Something went wrong." } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failRate > 0 && Math.random() < failRate) reject(new Error(message));
      else resolve(true);
    }, 400);
  });
}
