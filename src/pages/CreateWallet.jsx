import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import ScreenHeader from "../components/navigation/ScreenHeader";
import Icon from "../components/core/Icon";
import Button from "../components/core/Button";
import { useApp } from "../state/store";
import { screenTransition } from "../lib/motion";

// Fixed, obviously-fake demo phrase — this is a portfolio piece, not a real
// wallet; no real key material is ever generated or stored.
const PHRASE = ["orbit", "canyon", "velvet", "matrix", "harbor", "quartz", "ember", "trellis", "cobalt", "meadow", "signal", "granite"];

export default function CreateWallet() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [revealed, setRevealed] = useState(false);

  return (
    <PhoneFrame>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
        <ScreenHeader title="" />
        <div>
          <div className="zb-title-1" style={{ color: "#fff" }}>Your recovery phrase</div>
          <div className="zb-body" style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
            Write these 12 words down in order and keep them somewhere safe. Anyone with this phrase can access your wallet.
          </div>
        </div>
        <div
          style={{
            position: "relative",
            boxSizing: "border-box",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            background: "var(--surface-card)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 14px",
          }}
        >
          {PHRASE.map((w, i) => (
            <div key={w} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="zb-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", width: 16 }}>{i + 1}</span>
              <span style={{ font: "500 14px/20px var(--font-core)", color: "#fff", filter: revealed ? "none" : "blur(5px)" }}>{w}</span>
            </div>
          ))}
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(4,6,5,.35)",
                border: "none",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "#fff",
              }}
            >
              <Icon name="eye" size={20} color="#fff" />
              <span style={{ font: "500 13px/1 var(--font-core)" }}>Tap to reveal</span>
            </button>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "rgba(245,181,68,.08)" }}>
          <Icon name="alert" size={17} color="var(--warn-500)" />
          <span style={{ font: "400 12.5px/17px var(--font-core)", color: "#fff" }}>
            Zenbit Pro can't recover this phrase for you. Losing it means losing access to your funds.
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 8 }} />
        <Button
          onClick={() => {
            dispatch({ type: "onboarding/set", patch: { phraseBackedUp: true } });
            navigate("/face-id");
          }}
          disabled={!revealed}
        >
          I've saved it
        </Button>
      </motion.div>
    </PhoneFrame>
  );
}
