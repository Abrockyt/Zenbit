import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Screen, Cta } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import { useApp } from "../../state/store";

// The gate. Per the flow diagram, KYC is triggered by Buy/Sell or Card on first
// use (or reached from Profile), and on success returns to whatever asked for it
// — carried through the `next` param.
const STEPS = [
  { icon: "card", label: "Photo ID", hint: "Passport, driving licence or national ID" },
  { icon: "camera", label: "Selfie check", hint: "Confirms the ID belongs to you" },
  { icon: "check", label: "Review", hint: "Usually under two minutes" },
];

export default function KycIntro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/home";
  const { state } = useApp();

  // Already mid-flow? Don't make the user start over. Redirect after commit —
  // navigating during render updates the router while it's still rendering.
  const inFlight = state.kyc.status !== "unverified";
  useEffect(() => {
    if (inFlight) navigate(`/kyc/status?next=${encodeURIComponent(next)}`, { replace: true });
  }, [inFlight, navigate, next]);

  if (inFlight) return null;

  return (
    <Screen title="Verify your identity" onBack={() => navigate(next)}>
      <p className="zb-body" style={{ margin: 0, color: "var(--text-secondary)" }}>
        Buying, selling and the Zenbit card need a verified identity. Holding, sending and swapping what you already own do not.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: 16,
              borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-raised)", flex: "0 0 auto" }}>
              <Icon name={s.icon} size={18} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="zb-body" style={{ display: "block", color: "#fff" }}>{s.label}</span>
              <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)" }}>{s.hint}</span>
            </span>
            <span className="zb-caption" style={{ color: "var(--text-tertiary)" }}>{i + 1} of 3</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "rgba(58,222,126,.07)", border: "1px solid rgba(58,222,126,.18)" }}>
        <Icon name="shield" size={16} color="var(--up-500)" />
        <p className="zb-caption" style={{ margin: 0, color: "var(--text-secondary)" }}>
          Your documents are encrypted in transit and never shown to other Zenbit users. This demo simulates verification — nothing is uploaded anywhere.
        </p>
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <Cta onClick={() => navigate(`/kyc/documents?next=${encodeURIComponent(next)}`)}>Start verification</Cta>
        <Cta variant="secondary" onClick={() => navigate(next)}>Not now</Cta>
      </div>
    </Screen>
  );
}
