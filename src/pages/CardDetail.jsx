import { useNavigate } from "react-router-dom";
import { Screen, Row, SectionLabel, StateBlock, Cta } from "../components/screen/Screen";
import Icon from "../components/core/Icon";
import { useApp, useToast } from "../state/store";
import { formatMoney } from "../lib/format";

export default function CardDetail() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const card = state.card;
  const cur = state.settings.currency;

  const cardTx = state.wallet.transactions.filter((t) => t.kind === "card");

  if (!card.ordered) {
    return (
      <Screen title="Card">
        <StateBlock kind="empty" title="No card yet" body="Order a Zenbit card to spend your balance anywhere." actionLabel="Order a card" onAction={() => navigate("/card")} />
      </Screen>
    );
  }

  return (
    <Screen title="Card details">
      <div
        style={{
          padding: 24, borderRadius: "var(--radius-lg)", minHeight: 190,
          background: "var(--grad-bank-card)", border: "1px solid var(--border-subtle)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          opacity: card.frozen ? 0.5 : 1,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span className="zb-brand" style={{ color: "#fff", fontSize: 12 }}>ZENBIT PRO</span>
          {card.frozen && (
            <span className="zb-caption" style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,.12)", color: "#fff" }}>Frozen</span>
          )}
        </div>
        <div>
          <p className="zb-mono" style={{ margin: 0, color: "#fff", fontSize: 16, letterSpacing: 1 }}>
            •••• •••• •••• {card.last4}
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
            <span className="zb-caption" style={{ color: "rgba(255,255,255,.62)" }}>{state.session.user.name}</span>
            <span className="zb-caption zb-tabular" style={{ color: "rgba(255,255,255,.62)" }}>{card.expMonth}/{card.expYear}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px" }}>
        <span className="zb-body-sm" style={{ color: "var(--text-tertiary)" }}>Card balance</span>
        <span className="zb-title-2 zb-tabular" style={{ color: "#fff" }}>{formatMoney(card.balance, cur)}</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Cta full={false} onClick={() => navigate("/buy")}>Top up</Cta>
        <Cta
          full={false}
          variant="secondary"
          onClick={() => {
            dispatch({ type: card.frozen ? "card/unfreeze" : "card/freeze" });
            toast(card.frozen ? "Card unfrozen." : "Card frozen. Payments will decline.");
          }}
        >
          {card.frozen ? "Unfreeze" : "Freeze"}
        </Cta>
      </div>

      <SectionLabel>Controls</SectionLabel>
      <Row
        icon="eye"
        label="Show full number"
        hint="Requires your passcode"
        onClick={() => toast("Confirm your identity in Settings → Security to reveal card details.")}
      />
      <Row icon="lock" label="Change PIN" onClick={() => toast("A new PIN was sent to your registered device.")} />
      <Row
        icon="alert"
        label="Report lost or stolen"
        danger
        onClick={() => {
          dispatch({ type: "card/freeze" });
          toast("Card frozen and a replacement ordered.");
        }}
      />
      <Row icon="message" label="Contact support" onClick={() => toast("Support will reply by email within a day.")} />

      <SectionLabel>Card spend</SectionLabel>
      {cardTx.length === 0 ? (
        <StateBlock kind="empty" title="No card spend yet" body="Payments made with this card will show up here." actionLabel="Top up the card" onAction={() => navigate("/buy")} />
      ) : (
        cardTx.map((t) => (
          <Row
            key={t.id}
            icon="card"
            label={t.title}
            hint={t.date}
            value={`−${formatMoney(t.amount, cur)}`}
            onClick={() => navigate(`/activity/${t.id}`)}
          />
        ))
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        <Icon name="shield" size={16} color="var(--text-tertiary)" />
        <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
          Freezing is instant and reversible. Nothing can be spent while the card is frozen.
        </p>
      </div>
    </Screen>
  );
}
