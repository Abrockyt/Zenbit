import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, Cta, StateBlock, SectionLabel, Row } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import CoinIcon from "../../components/data/CoinIcon";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { useMarkets } from "../../data/useCoinGecko";
import { formatMoney, formatCrypto } from "../../lib/format";
import { dur, ease } from "../../lib/motion";

const COINS = ["bitcoin", "ethereum", "solana", "usd-coin", "chainlink"];
const QUICK = [50, 100, 500, 1000];
const FEE_RATE = 0.0149;
const LOCK_SECONDS = 15;

// Buy and Sell are the same machine with the sign flipped: pick an amount,
// review a locked price with the fee broken out, then commit. Kept in one place
// so the two can't drift apart.
export default function TradeFlow({ mode }) {
  const buying = mode === "buy";
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const cur = state.settings.currency;

  const ids = useMemo(() => COINS, []);
  const { data: markets, loading, error } = useMarkets(ids, { vs: cur });

  const [coinId, setCoinId] = useState("bitcoin");
  const [fiatAmount, setFiatAmount] = useState("");
  const [entryMode, setEntryMode] = useState("fiat"); // fiat | crypto
  const [stage, setStage] = useState("form");
  const [lock, setLock] = useState(LOCK_SECONDS);

  const market = markets?.find((m) => m.id === coinId);
  const price = market?.current_price ?? 0;
  const holding = state.wallet.holdings.find((h) => h.id === coinId);
  const method = state.paymentMethods[0];

  const fiat = entryMode === "fiat" ? Number(fiatAmount) || 0 : (Number(fiatAmount) || 0) * price;
  const units = price ? fiat / price : 0;
  const fee = fiat * FEE_RATE;
  const total = buying ? fiat + fee : fiat - fee;

  const sellingTooMuch = !buying && holding ? units > holding.units : !buying;
  const canReview = fiat > 0 && price > 0 && (buying ? Boolean(method) : !sellingTooMuch);

  // Price lock countdown on the review step — expires and must be refreshed
  // rather than silently executing at a stale rate.
  useEffect(() => {
    if (stage !== "review") return;
    setLock(LOCK_SECONDS);
    const t = setInterval(() => setLock((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [stage, coinId, fiatAmount]);

  const commit = useAsyncAction(
    async () => {
      // A declined card is the flow diagram's named error for Buy; make it
      // reachable deterministically on a round 666 amount.
      if (buying && Math.round(fiat) === 666) throw new Error("Your card was declined by the issuer.");
      dispatch({ type: "wallet/adjustUnits", id: coinId, delta: buying ? units : -units });
      dispatch({
        type: "wallet/addTransaction",
        tx: {
          id: `t${Date.now()}`,
          kind: buying ? "buy" : "sell",
          title: `${buying ? "Bought" : "Sold"} ${market.symbol.toUpperCase()}`,
          subtitle: buying ? (method?.label ?? "Card") : "To account balance",
          amount: fiat,
          negative: !buying,
          date: "Just now",
          status: "complete",
          units,
          symbol: market.symbol,
          fee,
        },
      });
    },
    { label: buying ? "Processing payment" : "Processing sale", queueWhenOffline: true }
  );

  const confirm = async () => {
    await commit.run();
    if (!commit.isError && !commit.isQueued) setStage("done");
  };

  if (loading && !markets) {
    return (
      <Screen title={buying ? "Buy" : "Sell"}>
        <StateBlock kind="loading" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen title={buying ? "Buy" : "Sell"}>
        <StateBlock kind="error" title="Price feed unavailable" body="We can't price this trade right now, so it would be unsafe to quote you. Try again in a moment." actionLabel="Retry" onAction={() => window.location.reload()} />
      </Screen>
    );
  }

  if (buying && !method) {
    return (
      <Screen title="Buy">
        <StateBlock kind="empty" title="No payment method linked" body="Add a card or bank account to buy crypto. You can remove it any time." actionLabel="Add payment method" onAction={() => navigate("/payment-methods")} />
      </Screen>
    );
  }

  if (stage === "done") {
    return (
      <Screen title={buying ? "Buy" : "Sell"} onBack={() => navigate("/home")}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "40px 20px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <motion.span initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: dur.base, ease: ease.standard }} style={{ width: 56, height: 56, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(58,222,126,.12)", border: "1px solid var(--up-500)" }}>
            <Icon name="check" size={24} color="var(--up-500)" />
          </motion.span>
          <p className="zb-title-2" style={{ margin: 0, color: "#fff" }}>{buying ? "Purchase complete" : "Sale complete"}</p>
          <p className="zb-balance" style={{ margin: 0, color: "#fff" }}>{formatCrypto(units, market.symbol.toUpperCase())}</p>
          <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
            {buying ? `Charged ${formatMoney(total, cur)} to ${method?.label ?? "your card"}.` : `${formatMoney(total, cur)} added to your account balance.`}
          </p>
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <Cta onClick={() => navigate("/home")}>Done</Cta>
          <Cta variant="secondary" onClick={() => { setStage("form"); setFiatAmount(""); commit.reset(); }}>{buying ? "Buy more" : "Sell more"}</Cta>
        </div>
      </Screen>
    );
  }

  if (stage === "review") {
    const expired = lock === 0;
    return (
      <Screen title="Review order" onBack={() => setStage("form")}>
        <div style={{ padding: 20, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            [buying ? "You buy" : "You sell", formatCrypto(units, market.symbol.toUpperCase())],
            ["Price", `${formatMoney(price, cur)} / ${market.symbol.toUpperCase()}`],
            [buying ? "Subtotal" : "Gross", formatMoney(fiat, cur)],
            ["Fee (1.49%)", formatMoney(fee, cur)],
            [buying ? "Total charged" : "You receive", formatMoney(total, cur)],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: i === arr.length - 1 ? 12 : 0, borderTop: i === arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <span className="zb-body-sm" style={{ color: i === arr.length - 1 ? "#fff" : "var(--text-tertiary)" }}>{k}</span>
              <span className="zb-body-sm zb-tabular" style={{ color: "#fff" }}>{v}</span>
            </div>
          ))}
        </div>

        {buying && <Row icon="card" label={method?.label ?? "Card"} hint="Payment method" onClick={() => navigate("/payment-methods")} />}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <motion.span
            key={lock}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: dur.fast }}
            className="zb-caption zb-tabular"
            style={{ color: expired ? "var(--down-500)" : "var(--text-tertiary)" }}
          >
            {expired ? "Price expired" : `Price locked for ${lock}s`}
          </motion.span>
        </div>

        {commit.isError && (
          <StateBlock
            kind="error"
            title={buying ? "Card declined" : "Sale failed"}
            body={`${commit.error?.message} Nothing was charged and your balance is unchanged.`}
            actionLabel="Try again"
            onAction={() => commit.reset()}
            secondaryLabel={buying ? "Use another card" : "Edit amount"}
            onSecondary={() => { commit.reset(); navigate(buying ? "/payment-methods" : "/sell"); setStage("form"); }}
          />
        )}
        {commit.isQueued && (
          <StateBlock kind="empty" title="Queued" body="You're offline. This order is queued and submits once — never twice — when you reconnect." actionLabel="Back to home" onAction={() => navigate("/home")} />
        )}

        {!commit.isError && !commit.isQueued && (
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {expired ? (
              <Cta onClick={() => setLock(LOCK_SECONDS)}>Refresh price</Cta>
            ) : (
              <Cta busy={commit.isLoading} onClick={confirm}>{buying ? "Confirm buy" : "Confirm sell"}</Cta>
            )}
            <Cta variant="secondary" onClick={() => setStage("form")}>Back</Cta>
          </div>
        )}
      </Screen>
    );
  }

  return (
    <Screen title={buying ? "Buy" : "Sell"}>
      <SectionLabel>Coin</SectionLabel>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {(markets ?? []).map((m) => (
          <button
            key={m.id}
            onClick={() => setCoinId(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto", padding: "9px 14px", borderRadius: 999,
              background: coinId === m.id ? "var(--surface-raised)" : "var(--surface-card)",
              border: `1px solid ${coinId === m.id ? "var(--border-strong)" : "var(--border-subtle)"}`,
              color: "#fff", font: "500 13px/1 var(--font-core)",
            }}
          >
            <CoinIcon symbol={m.symbol} size={18} />
            {m.symbol.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ padding: 20, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: `1px solid ${sellingTooMuch ? "var(--down-500)" : "var(--border-subtle)"}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="zb-title-2" style={{ color: "var(--text-tertiary)" }}>{entryMode === "fiat" ? cur.toUpperCase() : market?.symbol?.toUpperCase()}</span>
          <input
            inputMode="decimal"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0"
            aria-label="Amount"
            style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "#fff", font: "500 34px/1 var(--font-core)", fontVariantNumeric: "tabular-nums", letterSpacing: "-1.1px" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span className="zb-body-sm zb-tabular" style={{ color: "var(--text-tertiary)" }}>
            {entryMode === "fiat" ? `≈ ${formatCrypto(units, market?.symbol?.toUpperCase() ?? "")}` : `≈ ${formatMoney(fiat, cur)}`}
          </span>
          <button
            onClick={() => { setEntryMode(entryMode === "fiat" ? "crypto" : "fiat"); setFiatAmount(""); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--up-500)", font: "500 13px/1 var(--font-core)" }}
          >
            <Icon name="swap" size={14} color="var(--up-500)" />
            {entryMode === "fiat" ? market?.symbol?.toUpperCase() : cur.toUpperCase()}
          </button>
        </div>
      </div>

      {entryMode === "fiat" && (
        <div style={{ display: "flex", gap: 8 }}>
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => setFiatAmount(String(q))}
              style={{ flex: 1, padding: "11px 0", borderRadius: 999, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", color: "#fff", font: "500 13px/1 var(--font-core)" }}
            >
              {formatMoney(q, cur, { digits: 0 })}
            </button>
          ))}
        </div>
      )}

      <p className="zb-caption zb-tabular" style={{ margin: 0, color: sellingTooMuch ? "var(--down-500)" : "var(--text-tertiary)" }}>
        {buying
          ? `${market?.symbol?.toUpperCase()} is ${formatMoney(price, cur)} right now.`
          : sellingTooMuch
            ? `You only hold ${formatCrypto(holding?.units ?? 0, market?.symbol?.toUpperCase() ?? "")}.`
            : `Available ${formatCrypto(holding?.units ?? 0, market?.symbol?.toUpperCase() ?? "")}`}
      </p>

      {buying && (
        <Row icon="card" label={method?.label ?? "Add a payment method"} hint="Payment method" onClick={() => navigate("/payment-methods")} />
      )}

      <div style={{ marginTop: "auto" }}>
        <Cta disabled={!canReview} onClick={() => setStage("review")}>Review order</Cta>
      </div>
    </Screen>
  );
}
