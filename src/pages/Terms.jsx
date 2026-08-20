import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen, Cta } from "../components/screen/Screen";
import Icon from "../components/core/Icon";
import { useApp } from "../state/store";

const POINTS = [
  { icon: "lock", title: "You hold the keys", body: "Zenbit can't move your funds, freeze your wallet, or recover your phrase. Self-custody means the responsibility is yours." },
  { icon: "alert", title: "Transfers are final", body: "Once a transaction is broadcast it cannot be reversed, including a send to the wrong address." },
  { icon: "shield", title: "Verification for some features", body: "Buying, selling and the Zenbit card require identity verification. Holding, sending and swapping do not." },
];

export default function Terms() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [accepted, setAccepted] = useState(false);

  return (
    <Screen title="Before you start" onBack={() => navigate("/sign-up")}>
      <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
        Three things worth understanding before your wallet is created.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {POINTS.map((p) => (
          <div key={p.title} style={{ display: "flex", gap: 14, padding: 16, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ width: 36, height: 36, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-raised)", flex: "0 0 auto" }}>
              <Icon name={p.icon} size={17} />
            </span>
            <span>
              <span className="zb-body" style={{ display: "block", color: "#fff" }}>{p.title}</span>
              <span className="zb-caption" style={{ display: "block", marginTop: 3, color: "var(--text-secondary)" }}>{p.body}</span>
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setAccepted((a) => !a)}
        role="checkbox"
        aria-checked={accepted}
        style={{
          display: "flex", alignItems: "center", gap: 12, textAlign: "left",
          padding: 16, borderRadius: "var(--radius-md)", background: "var(--surface-card)",
          border: `1px solid ${accepted ? "var(--up-500)" : "var(--border-default)"}`,
        }}
      >
        <span
          style={{
            width: 22, height: 22, flex: "0 0 auto", borderRadius: 6,
            background: accepted ? "var(--up-500)" : "transparent",
            border: `1px solid ${accepted ? "var(--up-500)" : "var(--border-strong)"}`,
            display: "grid", placeItems: "center",
          }}
        >
          {accepted && <Icon name="check" size={14} color="var(--ink-1)" />}
        </span>
        <span className="zb-body-sm" style={{ color: "#fff" }}>
          I understand, and I accept the Terms of Service and Privacy Policy.
        </span>
      </button>

      <div style={{ marginTop: "auto" }}>
        <Cta
          disabled={!accepted}
          onClick={() => {
            dispatch({ type: "onboarding/set", patch: { termsAccepted: true } });
            navigate("/create-wallet");
          }}
        >
          Create my wallet
        </Cta>
      </div>
    </Screen>
  );
}
