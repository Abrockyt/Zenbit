import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, Row, SectionLabel, StateBlock, Cta } from "../../components/screen/Screen";
import SegmentedControl from "../../components/forms/SegmentedControl";
import CoinIcon from "../../components/data/CoinIcon";
import { useApp, useToast } from "../../state/store";
import { useMarkets } from "../../data/useCoinGecko";
import { formatMoney } from "../../lib/format";
import { dur, ease, scrimTransition } from "../../lib/motion";

export default function PriceAlerts() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [params] = useSearchParams();
  const prefill = params.get("coin");

  const ids = useMemo(() => state.watchlist, [state.watchlist]);
  const { data: markets, loading, error } = useMarkets(ids, { vs: state.settings.currency });

  const [open, setOpen] = useState(Boolean(prefill));
  const [coin, setCoin] = useState(prefill ?? ids[0]);
  const [direction, setDirection] = useState("above");
  const [target, setTarget] = useState("");

  const cur = state.settings.currency;
  const priceOf = (id) => markets?.find((m) => m.id === id)?.current_price ?? null;

  const add = () => {
    const value = Number(target);
    if (!Number.isFinite(value) || value <= 0) return;
    dispatch({
      type: "alerts/add",
      alert: { id: `al${Date.now()}`, coinId: coin, symbol: markets?.find((m) => m.id === coin)?.symbol ?? "", direction, target: value, currency: cur },
    });
    setOpen(false);
    setTarget("");
    toast("Price alert set.");
  };

  const selectedPrice = priceOf(coin);

  return (
    <Screen
      title="Price alerts"
      trailing={
        <button onClick={() => setOpen(true)} aria-label="Add alert" style={{ padding: "9px 14px", borderRadius: 999, background: "#fff", border: "none", color: "var(--ink-1)", font: "500 13px/1 var(--font-core)" }}>
          Add
        </button>
      }
    >
      {state.priceAlerts.length === 0 ? (
        <StateBlock
          kind="empty"
          title="No alerts yet"
          body="Set a target and Zenbit tells you when a coin crosses it, up or down."
          actionLabel="Add an alert"
          onAction={() => setOpen(true)}
        />
      ) : (
        <>
          <SectionLabel>Active alerts</SectionLabel>
          {state.priceAlerts.map((a) => {
            const now = priceOf(a.coinId);
            const hit = now != null && (a.direction === "above" ? now >= a.target : now <= a.target);
            return (
              <Row
                key={a.id}
                label={`${a.symbol?.toUpperCase() || a.coinId} ${a.direction === "above" ? "above" : "below"} ${formatMoney(a.target, a.currency)}`}
                hint={now == null ? "Fetching price…" : `Now ${formatMoney(now, cur)}${hit ? " · target reached" : ""}`}
                icon={a.direction === "above" ? "trending-up" : "arrow-down"}
                tone={hit ? "var(--up-500)" : undefined}
                value={hit ? "Hit" : undefined}
                trailing={
                  <button
                    onClick={() => {
                      dispatch({ type: "alerts/remove", id: a.id });
                      toast("Alert removed.");
                    }}
                    aria-label="Remove alert"
                    style={{ padding: "8px 14px", borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--down-500)", font: "500 13px/1 var(--font-core)" }}
                  >
                    Remove
                  </button>
                }
              />
            );
          })}
        </>
      )}

      {error && (
        <StateBlock
          kind="error"
          title="Price feed unavailable"
          body="Your alerts are safe — we just can't show current prices right now."
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.button {...scrimTransition} onClick={() => setOpen(false)} aria-label="Dismiss" style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(6px)", border: "none", zIndex: 40 }} />
            <motion.div
              initial={{ y: 480 }}
              animate={{ y: 0 }}
              exit={{ y: 480 }}
              transition={{ duration: dur.slow, ease: ease.emphasis }}
              role="dialog"
              aria-label="New price alert"
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
                padding: "24px 20px 34px", borderRadius: "32px 32px 0 0",
                background: "var(--surface-card-solid)", borderTop: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", gap: 14, maxHeight: "84%", overflowY: "auto",
              }}
            >
              <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>New price alert</p>

              <div>
                <p className="zb-label" style={{ margin: "0 0 8px", color: "var(--text-tertiary)" }}>Coin</p>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                  {(markets ?? []).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setCoin(m.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto",
                        padding: "9px 14px", borderRadius: 999,
                        background: coin === m.id ? "var(--surface-raised)" : "var(--surface-card)",
                        border: `1px solid ${coin === m.id ? "var(--border-strong)" : "var(--border-subtle)"}`,
                        color: "#fff", font: "500 13px/1 var(--font-core)",
                      }}
                    >
                      <CoinIcon symbol={m.symbol} size={18} />
                      {m.symbol.toUpperCase()}
                    </button>
                  ))}
                  {loading && <span className="zb-body-sm" style={{ color: "var(--text-tertiary)" }}>Loading coins…</span>}
                </div>
              </div>

              <div>
                <p className="zb-label" style={{ margin: "0 0 8px", color: "var(--text-tertiary)" }}>Trigger when price goes</p>
                <SegmentedControl
                  options={[
                    { value: "above", label: "Above" },
                    { value: "below", label: "Below" },
                  ]}
                  value={direction}
                  onChange={setDirection}
                />
              </div>

              <div>
                <p className="zb-label" style={{ margin: "0 0 8px", color: "var(--text-tertiary)" }}>
                  Target price {selectedPrice != null && <span style={{ color: "var(--text-tertiary)" }}>· now {formatMoney(selectedPrice, cur)}</span>}
                </p>
                <input
                  inputMode="decimal"
                  value={target}
                  onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder={selectedPrice != null ? String(Math.round(selectedPrice)) : "0.00"}
                  aria-label="Target price"
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "15px 18px", borderRadius: "var(--radius-sm)",
                    background: "var(--surface-card)", border: "1px solid var(--border-default)",
                    color: "#fff", font: "500 20px/1 var(--font-core)", fontVariantNumeric: "tabular-nums",
                  }}
                />
              </div>

              <Cta onClick={add} disabled={!target || Number(target) <= 0}>Set alert</Cta>
              <Cta variant="secondary" onClick={() => setOpen(false)}>Cancel</Cta>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
