import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import AmountPad from "../components/finance/AmountPad";
import { useApp } from "../state/store";
import { screenTransition } from "../lib/motion";

export default function Passcode() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [digits, setDigits] = useState("");
  const [confirm, setConfirm] = useState(null); // first entry, held while re-entering
  const [mismatch, setMismatch] = useState(false);

  // The screen the diagram describes ("enter twice to confirm") — the previous
  // version fired after a single entry and never signed the session in, so
  // /home's RequireSession guard bounced straight back to Welcome. That was
  // the actual reason onboarding never completed.
  function onKey(k) {
    if (mismatch) {
      setMismatch(false);
      setDigits("");
      return;
    }
    if (k === "back") return setDigits((d) => d.slice(0, -1));
    if (digits.length >= 6) return;
    const next = digits + k;
    setDigits(next);
    if (next.length !== 6) return;

    if (!confirm) {
      setTimeout(() => {
        setConfirm(next);
        setDigits("");
      }, 250);
      return;
    }

    setTimeout(() => {
      if (next !== confirm) {
        setMismatch(true);
        return;
      }
      dispatch({ type: "onboarding/set", patch: { passcodeSet: true } });
      dispatch({ type: "settings/setAppLock", patch: { passcode: true } });
      dispatch({ type: "session/signIn", isNewUser: state.onboarding.isNewUser });
      navigate("/home", { replace: true });
    }, 250);
  }

  return (
    <PhoneFrame>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "80px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <div style={{ textAlign: "center" }}>
          <div className="zb-title-1" style={{ color: "#fff" }}>{confirm ? "Confirm your passcode" : "Set your app passcode"}</div>
          <div className="zb-body" style={{ color: mismatch ? "var(--down-500)" : "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
            {mismatch
              ? "Those didn't match. Tap anywhere to try again."
              : confirm
                ? "Enter it once more to confirm."
                : "You'll use this to unlock Zenbit Pro and approve sensitive actions."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                border: `1px solid ${mismatch ? "var(--down-500)" : "var(--border-default)"}`,
                background: mismatch ? "transparent" : i < digits.length ? "var(--up-500)" : "transparent",
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 8 }} />
        <div style={{ width: "100%" }}>
          <AmountPad onKey={onKey} />
        </div>
      </motion.div>
    </PhoneFrame>
  );
}
