import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import TabBar from "../components/navigation/TabBar";
import IconButton from "../components/core/IconButton";
import BankCard from "../components/data/BankCard";
import ActionTile from "../components/core/ActionTile";
import MorphIconGlyph from "../components/core/MorphIconGlyph";
import SectionHeader from "../components/navigation/SectionHeader";
import TransactionRow from "../components/data/TransactionRow";

import { account } from "../data/mockWallet";
import { useApp, useToast } from "../state/store";
import EmptyState from "../components/feedback/EmptyState";
import { screenTransition } from "../lib/motion";
import { useCurrency } from "../lib/useCurrency";

export default function CardScreen() {
  const { currency, money } = useCurrency();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const card = state.card;
  const frozen = card.frozen;
  const cardTx = state.wallet.transactions.filter((t) => t.kind === "card");

  // Ordering runs through activating -> activated, so the diagram's loading and
  // success edges for the Card flow are both real states rather than instant.
  const order = () => {
    dispatch({ type: "card/order" });
    toast("Card ordered.");
    setTimeout(() => {
      dispatch({ type: "card/activated", balance: 0 });
      toast("Card activated.");
    }, 2400);
  };

  return (
    <PhoneFrame tabBar={<TabBar />}>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 108px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="zb-title-1" style={{ color: "#fff" }}>Card</div>
          <IconButton icon="settings" onClick={() => navigate("/settings")} />
        </div>

        {!card.ordered && (
          <EmptyState
            icon="credit-card"
            title="No card yet"
            message="Order a Zenbit card to spend your balance anywhere. It arrives virtually straight away."
            actionLabel="Order a card"
            onAction={order}
          />
        )}

        {card.ordered && card.activating && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              style={{ width: 20, height: 20, borderRadius: 999, border: "2px solid var(--border-strong)", borderTopColor: "var(--up-500)", flex: "0 0 auto" }}
            />
            <span className="zb-body-sm" style={{ color: "var(--text-secondary)" }}>Activating your card…</span>
          </div>
        )}

        {card.ordered && !card.activating && (
          <>
            <div>
              <div className="zb-body-sm" style={{ color: "var(--text-secondary)", fontSize: 13 }}>Card balance</div>
              <div className="zb-balance" style={{ color: "#fff", marginTop: 4 }}>{money(card.balance)}</div>
            </div>

            <BankCard name={account.name.toUpperCase()} last4={card.last4} frozen={frozen} />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <ActionTile icon="plus" label="Top up" onClick={() => navigate("/buy")} />
              <ActionTile
                glyph={<MorphIconGlyph locked={!frozen} />}
                label={frozen ? "Unfreeze" : "Freeze"}
                onClick={() => {
                  dispatch({ type: frozen ? "card/unfreeze" : "card/freeze" });
                  toast(frozen ? "Card unfrozen." : "Card frozen. Payments will decline.");
                }}
              />
              <ActionTile icon="eye" label="Details" onClick={() => navigate("/card/detail")} />
              <ActionTile icon="settings" label="Settings" onClick={() => navigate("/settings")} />
            </div>

            {frozen && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "rgba(242,80,75,.08)", border: "1px solid rgba(242,80,75,.22)" }}>
                <span className="zb-caption" style={{ color: "var(--down-500)" }}>
                  This card is frozen — payments will be declined until you unfreeze it.
                </span>
              </div>
            )}

            {card.balance === 0 && !frozen && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "rgba(245,181,68,.08)", border: "1px solid rgba(245,181,68,.22)" }}>
                <span className="zb-caption" style={{ color: "var(--warn-500)" }}>
                  Card balance is empty. Top up before spending, or payments will decline.
                </span>
              </div>
            )}

            <div>
              <SectionHeader title="Card transactions" action="View all" onAction={() => navigate("/activity")} />
              <div style={{ marginTop: 4 }}>
                {cardTx.length ? (
                  cardTx.map((t) => (
                    <button key={t.id} onClick={() => navigate(`/activity/${t.id}`)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, textAlign: "left" }}>
                      <TransactionRow {...t} />
                    </button>
                  ))
                ) : (
                  <div className="zb-body-sm" style={{ color: "var(--text-tertiary)", padding: "16px 0" }}>No card transactions yet.</div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </PhoneFrame>
  );
}
