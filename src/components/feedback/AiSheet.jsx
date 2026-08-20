import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../core/Icon";
import { dur, ease, scrimTransition, tapScale } from "../../lib/motion";
import { formatMoney, formatCrypto } from "../../lib/format";

// A scripted assistant, not a language model. It answers from the wallet's own
// state so the replies are true, and it says up front that it's scripted —
// pretending to be a live model in a demo would be a lie the UI tells for us.
function answer(question, ctx) {
  const q = question.toLowerCase();
  const holding = ctx.priced.find((h) => q.includes(h.symbol.toLowerCase()) || q.includes(h.name.toLowerCase()));

  if (holding) {
    return `You hold ${formatCrypto(holding.units, holding.symbol.toUpperCase())}, worth ${formatMoney(holding.value, ctx.currency)} at ${formatMoney(holding.price, ctx.currency)} each.`;
  }
  if (q.includes("total") || q.includes("balance") || q.includes("worth")) {
    return `Your portfolio is ${formatMoney(ctx.total, ctx.currency)} across ${ctx.priced.length} assets.`;
  }
  if (q.includes("best") || q.includes("up") || q.includes("gain")) {
    const best = [...ctx.priced].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0];
    return best ? `${best.name} is your best performer today, ${best.changePct >= 0 ? "up" : "down"} ${Math.abs(best.changePct).toFixed(2)}%.` : "No holdings to compare yet.";
  }
  if (q.includes("worst") || q.includes("down") || q.includes("loss")) {
    const worst = [...ctx.priced].sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))[0];
    return worst ? `${worst.name} is your weakest today, ${worst.changePct >= 0 ? "up" : "down"} ${Math.abs(worst.changePct).toFixed(2)}%.` : "No holdings to compare yet.";
  }
  if (q.includes("fee")) {
    return "Buys and sells carry a 1.49% fee. Network fees on a send depend on the chain and are shown before you confirm.";
  }
  if (q.includes("kyc") || q.includes("verif")) {
    return "Identity verification is needed for Buy, Sell and the card. Holding, sending and swapping what you already own are not gated.";
  }
  if (q.includes("secure") || q.includes("safe") || q.includes("phrase")) {
    return "Zenbit is self-custody: your recovery phrase never leaves your device, and we can't move or freeze your funds. Keep the phrase offline.";
  }
  return "I can answer questions about your balances, today's movers, fees, verification and security. Try asking what your total is, or how much ETH you hold.";
}

const SUGGESTIONS = ["What's my total?", "How much ETH do I hold?", "What's up today?", "What are the fees?"];

export default function AiSheet({ open, onClose, ctx }) {
  const [log, setLog] = useState([]);
  const [text, setText] = useState("");

  const ask = (question) => {
    const q = question.trim();
    if (!q) return;
    setLog((l) => [...l, { from: "me", body: q }, { from: "ai", body: answer(q, ctx) }]);
    setText("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button {...scrimTransition} onClick={onClose} aria-label="Dismiss" style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(6px)", border: "none", zIndex: 40 }} />
          <motion.div
            initial={{ y: 520 }}
            animate={{ y: 0 }}
            exit={{ y: 520 }}
            transition={{ duration: dur.slow, ease: ease.emphasis }}
            role="dialog"
            aria-label="Zenbit assistant"
            style={{
              position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41, maxHeight: "80%",
              padding: "22px 20px 34px", borderRadius: "32px 32px 0 0",
              background: "var(--surface-card-solid)", borderTop: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(58,222,126,.12)" }}>
                <Icon name="sparkles" size={16} color="var(--up-500)" />
              </span>
              <span style={{ flex: 1 }}>
                <span className="zb-body" style={{ display: "block", color: "#fff" }}>Zenbit assistant</span>
                <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)" }}>Scripted demo — reads your wallet, not a live model</span>
              </span>
              <button onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, display: "grid", placeItems: "center", background: "none", border: "none" }}>
                <Icon name="x" size={18} color="var(--text-tertiary)" />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 80, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {log.length === 0 && (
                <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
                  Ask about your balances, today's movers, fees or security.
                </p>
              )}
              {log.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: dur.base, ease: ease.standard }}
                  style={{
                    alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "84%",
                    padding: "10px 14px",
                    borderRadius: m.from === "me" ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                    background: m.from === "me" ? "#fff" : "var(--surface-card)",
                    border: m.from === "me" ? "none" : "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="zb-body-sm" style={{ color: m.from === "me" ? "var(--ink-1)" : "#fff" }}>{m.body}</span>
                </motion.div>
              ))}
            </div>

            {log.length === 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    style={{ padding: "9px 13px", borderRadius: 999, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", color: "#fff", font: "400 12.5px/1 var(--font-core)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask(text)}
                placeholder="Ask about your wallet"
                aria-label="Ask the assistant"
                style={{
                  flex: 1, minWidth: 0, padding: "13px 16px", borderRadius: 999,
                  background: "var(--surface-card)", border: "1px solid var(--border-default)",
                  color: "#fff", font: "400 14px/1 var(--font-core)",
                }}
              />
              <motion.button
                whileTap={tapScale}
                onClick={() => ask(text)}
                disabled={!text.trim()}
                aria-label="Send question"
                style={{ width: 46, height: 46, borderRadius: 999, flex: "0 0 auto", border: "none", background: text.trim() ? "#fff" : "var(--surface-raised)", display: "grid", placeItems: "center" }}
              >
                <Icon name="send" size={17} color={text.trim() ? "var(--ink-1)" : "var(--text-disabled)"} />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
