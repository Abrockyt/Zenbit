import { useNavigate, useParams } from "react-router-dom";
import { Screen, StateBlock, Cta, Row } from "../components/screen/Screen";
import Icon from "../components/core/Icon";
import { useApp, useToast } from "../state/store";
import { useAsyncAction } from "../state/useAsyncAction";
import { formatMoney, formatCrypto } from "../lib/format";

const KIND_LABEL = { send: "Sent", receive: "Received", swap: "Swapped", buy: "Bought", sell: "Sold", card: "Card payment" };

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const cur = state.settings.currency;

  const tx = state.wallet.transactions.find((t) => t.id === id);

  const speedUp = useAsyncAction(
    async () => {
      dispatch({ type: "wallet/patchTransaction", id, patch: { status: "complete", subtitle: `${tx.subtitle} · fee bumped` } });
    },
    { label: "Bumping fee" }
  );

  const cancel = useAsyncAction(
    async () => {
      // A pending send that hasn't confirmed can be replaced with a zero-value
      // transaction; the units go back to the holding.
      if (tx.units && tx.symbol) {
        const holding = state.wallet.holdings.find((h) => h.symbol === tx.symbol);
        if (holding) dispatch({ type: "wallet/adjustUnits", id: holding.id, delta: tx.units + (tx.fee ?? 0) });
      }
      dispatch({ type: "wallet/patchTransaction", id, patch: { status: "cancelled" } });
    },
    { label: "Cancelling transaction" }
  );

  if (!tx) {
    return (
      <Screen title="Transaction">
        <StateBlock kind="empty" title="Transaction not found" body="It may have been cleared from this device." actionLabel="All activity" onAction={() => navigate("/activity")} />
      </Screen>
    );
  }

  const pending = tx.status === "pending";
  const cancelled = tx.status === "cancelled";
  const tone = cancelled ? "var(--text-tertiary)" : tx.negative ? "var(--down-500)" : "var(--up-500)";

  return (
    <Screen title={KIND_LABEL[tx.kind] ?? "Transaction"}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px 20px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        <span style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-raised)" }}>
          <Icon name={tx.negative ? "arrow-up" : "arrow-down"} size={20} color={tone} />
        </span>
        <p className="zb-balance" style={{ margin: 0, color: "#fff" }}>
          {tx.negative ? "−" : "+"}{formatMoney(tx.amount, cur)}
        </p>
        {tx.units && tx.symbol && (
          <p className="zb-body-sm zb-tabular" style={{ margin: 0, color: "var(--text-tertiary)" }}>
            {formatCrypto(tx.units, tx.symbol.toUpperCase())}
          </p>
        )}
        <span
          className="zb-caption"
          style={{
            marginTop: 4, padding: "5px 12px", borderRadius: 999,
            background: pending ? "rgba(245,181,68,.14)" : cancelled ? "var(--surface-raised)" : "rgba(58,222,126,.14)",
            color: pending ? "var(--warn-500)" : cancelled ? "var(--text-tertiary)" : "var(--up-500)",
          }}
        >
          {pending ? "Pending confirmation" : cancelled ? "Cancelled" : "Complete"}
        </span>
      </div>

      <div style={{ padding: 18, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 13 }}>
        {[
          ["Type", KIND_LABEL[tx.kind] ?? tx.kind],
          ["Detail", tx.subtitle],
          ["When", tx.date],
          tx.fee != null && tx.symbol ? ["Network fee", formatCrypto(tx.fee, tx.symbol.toUpperCase())] : null,
          tx.address ? ["To", `${tx.address.slice(0, 10)}…${tx.address.slice(-8)}`] : null,
        ]
          .filter(Boolean)
          .map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="zb-body-sm" style={{ color: "var(--text-tertiary)" }}>{k}</span>
              <span className="zb-body-sm" style={{ color: "#fff", textAlign: "right", maxWidth: "62%" }}>{v}</span>
            </div>
          ))}
      </div>

      {tx.hash && (
        <Row
          icon="copy"
          label="Transaction hash"
          hint={`${tx.hash.slice(0, 18)}…`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(tx.hash);
              toast("Hash copied.");
            } catch {
              toast("Couldn't copy the hash.", "down");
            }
          }}
        />
      )}

      {(speedUp.isError || cancel.isError) && (
        <StateBlock
          kind="error"
          title="That didn't go through"
          body={`${(speedUp.error ?? cancel.error)?.message} The transaction is unchanged.`}
          actionLabel="Dismiss"
          onAction={() => {
            speedUp.reset();
            cancel.reset();
          }}
        />
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {pending && (
          <>
            <Cta busy={speedUp.isLoading} onClick={() => speedUp.run().then(() => toast("Fee bumped — this should confirm shortly."))}>
              Speed up
            </Cta>
            <Cta variant="secondary" busy={cancel.isLoading} onClick={() => cancel.run().then(() => toast("Transaction cancelled. Funds returned."))}>
              Cancel transaction
            </Cta>
          </>
        )}
        <Cta variant="secondary" onClick={() => navigate("/activity")}>Back to activity</Cta>
      </div>
    </Screen>
  );
}
