import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import Icon from "../components/core/Icon";
import Button from "../components/core/Button";
import { useApp } from "../state/store";
import { screenTransition, dur, ease } from "../lib/motion";

export default function FaceId() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [activating, setActivating] = useState(false);

  function activate() {
    setActivating(true);
    dispatch({ type: "settings/setAppLock", patch: { faceId: true } });
    dispatch({ type: "onboarding/set", patch: { faceIdEnabled: true } });
    setTimeout(() => navigate("/passcode"), 700);
  }
  return (
    <PhoneFrame>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
        <div style={{ flex: 1, minHeight: 8 }} />
        <motion.span
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: dur.slow, ease: ease.emphasis }}
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            background: "rgba(58,222,126,.08)",
            border: "1px solid var(--border-strong)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="scan-face" size={40} color="var(--up-500)" />
        </motion.span>
        <div>
          <div className="zb-title-1" style={{ color: "#fff" }}>Turn on Face ID for easy login</div>
          <div className="zb-body" style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14, maxWidth: 280 }}>
            Use Face ID instead of your passcode to unlock Zenbit Pro and confirm sensitive actions.
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 8 }} />
        <Button onClick={activate} loading={activating}>Activate Face ID</Button>
        <button
          onClick={() => navigate("/passcode")}
          style={{ background: "none", border: "none", font: "400 13px/18px var(--font-core)", color: "var(--text-secondary)" }}
        >
          Skip? Activate later
        </button>
      </motion.div>
    </PhoneFrame>
  );
}
