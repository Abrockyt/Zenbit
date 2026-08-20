import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import TabBar from "../components/navigation/TabBar";
import SwapPanel from "../components/finance/SwapPanel";
import Button from "../components/core/Button";
import Icon from "../components/core/Icon";
import CoinIcon from "../components/data/CoinIcon";
import KeyValueList from "../components/data/KeyValueList";
import Sheet from "../components/feedback/Sheet";
import ResultDialog from "../components/feedback/ResultDialog";
import { StateBlock } from "../components/screen/Screen";
import { useMarkets } from "../data/useCoinGecko";
import { useApp, useToast } from "../state/store";
import { screenTransition, tapScale } from "../lib/motion";
import { useCurrency } from "../lib/useCurrency";

// Everything the wallet can hold, plus USDC/USDT so there's always a stable
// leg to swap into or out of even on a fresh wallet.
const PAIR_IDS = ["bitcoin", "ethereum", "solana", "tether", "usd-coin", "chainlink"];

export default function Swap() {
  const { currency, money } = useCurrency();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const { data: markets, loading, error } = useMarkets(PAIR_IDS, { vs: currency });

  const [fromSym, setFromSym] = useState("usdc");
  const [toSym, setToSym] = useState("sol");
  const [amount, setAmount] = useState("500");
  const [picking, setPicking] = useState(null); // 'from' | 'to' | null
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState(null); // null | "sending" | "success" | "error"

  const coinOf = (sym) => markets?.find((m) => m.symbol === sym);
  const holdingOf = (sym) => state.wallet.holdings.find((h) => h.symbol === sym);
  const fromPrice = coinOf(fromSym)?.current_price ?? 0;
  const toPrice = coinOf(toSym)?.current_price ?? 0;
  const rate = toPrice ? fromPrice / toPrice : 0;
  const amountNum = parseFloat(amount) || 0;
  const receiveAmount = rate ? amountNum * rate : 0;
  const fee = amountNum * 0.003;

  // A real balance check, not a hardcoded stablecoin exemption: how many units
  // of fromSym does the wallet actually hold, priced against the live feed.
  const fromHolding = holdingOf(fromSym);
  const availableUnits = fromHolding?.units ?? 0;
  const availableValue = availableUnits * fromPrice;
  const insufficient = fromPrice > 0 && amountNum * fromPrice > availableValue + 0.01;

  function flip() {
    setFromSym(toSym);
    setToSym(fromSym);
  }

  function submit() {
    setConfirming(false);
    setStatus("sending");
    setTimeout(() => {
      // Slippage-too-high is the diagram's named Swap error — reachable
      // deterministically rather than by chance, like the other flows.
      const fails = amount.trim() === "999";
      if (fails) {
        setStatus("error");
        return;
      }
      if (fromHolding) dispatch({ type: "wallet/adjustUnits", id: fromHolding.id, delta: -amountNum });
      const toHolding = holdingOf(toSym);
      if (toHolding) dispatch({ type: "wallet/adjustUnits", id: toHolding.id, delta: receiveAmount });
      dispatch({
        type: "wallet/addTransaction",
        tx: {
          id: `t${Date.now()}`,
          kind: "swap",
          title: `Swapped ${fromSym.toUpperCase()} → ${toSym.toUpperCase()}`,
          subtitle: `Rate 1 ${fromSym.toUpperCase()} ≈ ${rate.toFixed(4)} ${toSym.toUpperCase()}`,
          amount: amountNum * fromPrice,
          negative: true,
          date: "Just now",
          status: "complete",
        },
      });
      setStatus("success");
    }, 1400);
  }

  const pickerList = (markets ?? []).filter((m) => m.symbol !== (picking === "from" ? toSym : fromSym));

  return (
    <PhoneFrame tabBar={!status ? <TabBar /> : null}>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 108px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
        <div className="zb-title-1" style={{ color: "#fff" }}>Swap tokens</div>

        {error ? (
          <StateBlock
            kind="error"
            title="Price feed unavailable"
            body="We can't quote a swap without live prices right now — nothing has been charged."
            actionLabel="Retry"
            onAction={() => window.location.reload()}
          />
        ) : (
          <>
            <SwapPanel
              from={{ symbol: fromSym, amount, usdValue: fromPrice ? `≈ ${money(amountNum * fromPrice)}` : "" }}
              to={{ symbol: toSym, amount: receiveAmount ? receiveAmount.toFixed(6) : "0", usdValue: toPrice ? `≈ ${money(receiveAmount * toPrice)}` : "" }}
              onFlip={flip}
              onAmountChange={setAmount}
              onSelectFrom={() => setPicking("from")}
              onSelectTo={() => setPicking("to")}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="zb-caption" style={{ color: "var(--text-tertiary)" }}>
                Available {fromHolding ? `${availableUnits.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${fromSym.toUpperCase()}` : `0 ${fromSym.toUpperCase()}`}
              </span>
              {fromHolding && (
                <button
                  onClick={() => setAmount(String(Math.floor(availableUnits * fromPrice * 100) / 100))}
                  style={{ background: "none", border: "none", color: "var(--up-500)", font: "500 12.5px/1 var(--font-core)" }}
                >
                  Max
                </button>
              )}
            </div>

            <KeyValueList
              rows={[
                { label: "Rate", value: loading && !markets ? "Finding rate…" : rate ? `1 ${fromSym.toUpperCase()} ≈ ${rate.toFixed(6)} ${toSym.toUpperCase()}` : "Unavailable for this pair" },
                { label: "Network fee", value: money(fee) },
                { label: "Slippage tolerance", value: "0.5%" },
                { label: "You'll receive", value: `${receiveAmount.toFixed(6)} ${toSym.toUpperCase()}` },
              ]}
            />

            {insufficient ? (
              <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--down-500)", background: "rgba(242,80,75,.08)" }}>
                <Icon name="alert" size={15} color="var(--down-500)" />
                <span style={{ color: "#fff", font: "400 12.5px/17px var(--font-core)" }}>
                  Not enough {fromSym.toUpperCase()}. You have {availableUnits.toLocaleString("en-US", { maximumFractionDigits: 6 })}.
                </span>
              </div>
            ) : null}

            <div style={{ flex: 1, minHeight: 8 }} />
            <Button onClick={() => setConfirming(true)} disabled={!amountNum || insufficient || !rate || loading}>
              {loading && !markets ? "Loading prices…" : "Approve Swap"}
            </Button>
          </>
        )}
      </motion.div>

      {/* Coin picker — this is what makes "You pay" / "You receive" actually tappable. */}
      <Sheet open={!!picking} onClose={() => setPicking(null)} title={picking === "from" ? "Pay with" : "Receive"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {pickerList.map((m) => (
            <motion.button
              key={m.id}
              whileTap={tapScale}
              onClick={() => {
                if (picking === "from") setFromSym(m.symbol);
                else setToSym(m.symbol);
                setPicking(null);
              }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", background: "none", border: "none", textAlign: "left" }}
            >
              <CoinIcon symbol={m.symbol} size={34} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="zb-body" style={{ display: "block", color: "#fff" }}>{m.name}</span>
                <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)" }}>{m.symbol.toUpperCase()}</span>
              </span>
              <span className="zb-body-sm zb-tabular" style={{ color: "var(--text-secondary)" }}>{money(m.current_price)}</span>
            </motion.button>
          ))}
          {!pickerList.length && <p className="zb-body-sm" style={{ color: "var(--text-tertiary)" }}>Loading coins…</p>}
        </div>
      </Sheet>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Confirm swap">
        <KeyValueList
          rows={[
            { label: "You pay", value: `${amount} ${fromSym.toUpperCase()}` },
            { label: "You receive", value: `${receiveAmount.toFixed(6)} ${toSym.toUpperCase()}` },
            { label: "Rate", value: `1 ${fromSym.toUpperCase()} ≈ ${rate.toFixed(6)} ${toSym.toUpperCase()}` },
            { label: "Network fee", value: money(fee) },
          ]}
        />
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button onClick={submit}>Confirm</Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
        </div>
      </Sheet>

      {status === "sending" ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "var(--grad-screen)" }}>
          <span style={{ width: 44, height: 44, borderRadius: 999, border: "2px solid var(--border-default)", borderTopColor: "var(--up-500)", animation: "zb-spin 0.8s linear infinite" }} />
          <span className="zb-body" style={{ color: "var(--text-secondary)" }}>Finding the best rate…</span>
        </div>
      ) : null}

      {status === "success" ? (
        <ResultDialog
          tone="success"
          title="Swap sent!"
          message={`${receiveAmount.toFixed(4)} ${toSym.toUpperCase()} is on its way to your wallet.`}
          primaryLabel="Done"
          onPrimary={() => {
            toast("Swap complete.");
            navigate("/home");
          }}
        />
      ) : null}

      {status === "error" ? (
        <ResultDialog
          tone="error"
          title="Swap failed"
          message="Slippage moved past your limit. Try again or adjust your slippage tolerance."
          primaryLabel="Try again"
          onPrimary={() => setStatus(null)}
          secondaryLabel="Cancel"
          onSecondary={() => navigate("/home")}
        />
      ) : null}
    </PhoneFrame>
  );
}
