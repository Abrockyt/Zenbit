import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, Cta } from "../components/screen/Screen";
import Icon from "../components/core/Icon";
import { useApp } from "../state/store";
import { dur, ease } from "../lib/motion";

const PASSCODE = "000000";
const MAX_ATTEMPTS = 5;

// The lock screen the route guard falls back to, and the re-prompt the design
// system asks for on sensitive actions. Face ID is simulated; the passcode
// fallback is real, and wrong entries are counted.
export default function AppLock() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [entry, setEntry] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(0);
  const [mode, setMode] = useState(state.settings.appLock.faceId ? "faceId" : "passcode");

  const lockedOut = attempts >= MAX_ATTEMPTS;

  const unlock = () => {
    dispatch({ type: "session/unlock" });
    navigate("/home", { replace: true });
  };

  const submit = (value) => {
    if (value === PASSCODE || value.length === 6) {
      if (value === PASSCODE) return unlock();
    }
    setAttempts((a) => a + 1);
    setShake((s) => s + 1);
    setEntry("");
  };

  const press = (digit) => {
    if (lockedOut) return;
    const next = (entry + digit).slice(0, 6);
    setEntry(next);
    if (next.length === 6) setTimeout(() => submit(next), 120);
  };

  return (
    <Screen title="" onBack={null} scroll={false}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, textAlign: "center" }}>
        <span style={{ width: 60, height: 60, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-raised)", border: "1px solid var(--border-default)" }}>
          <Icon name={mode === "faceId" ? "user" : "lock"} size={26} />
        </span>

        <div>
          <p className="zb-title-2" style={{ margin: 0, color: "#fff" }}>Zenbit is locked</p>
          <p className="zb-body-sm" style={{ margin: "6px 0 0", color: "var(--text-secondary)" }}>
            {lockedOut
              ? "Too many attempts. Try again in 15 minutes, or restore from your recovery phrase."
              : mode === "faceId"
                ? "Look at your device to unlock."
                : "Enter your six-digit passcode."}
          </p>
        </div>

        {mode === "passcode" && !lockedOut && (
          <>
            <motion.div key={shake} animate={shake ? { x: [0, -8, 8, -5, 0] } : {}} transition={{ duration: 0.32, ease: ease.standard }} style={{ display: "flex", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 12, height: 12, borderRadius: 999,
                    background: i < entry.length ? "#fff" : "transparent",
                    border: `1px solid ${i < entry.length ? "#fff" : "var(--border-strong)"}`,
                    transition: `background ${dur.fast}s`,
                  }}
                />
              ))}
            </motion.div>

            {attempts > 0 && (
              <p className="zb-caption" role="alert" style={{ margin: 0, color: "var(--down-500)" }}>
                Wrong passcode. {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} left.
              </p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 14, marginTop: 4 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) =>
                k === "" ? (
                  <span key={i} />
                ) : (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => (k === "⌫" ? setEntry((e) => e.slice(0, -1)) : press(k))}
                    aria-label={k === "⌫" ? "Delete" : k}
                    style={{
                      width: 72, height: 72, borderRadius: 999,
                      background: k === "⌫" ? "transparent" : "var(--surface-card)",
                      border: k === "⌫" ? "none" : "1px solid var(--border-subtle)",
                      color: "#fff", font: "400 24px/1 var(--font-core)",
                    }}
                  >
                    {k}
                  </motion.button>
                )
              )}
            </div>

            <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
              Demo passcode: <span className="zb-mono">000000</span>
            </p>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
        {mode === "faceId" && !lockedOut && (
          <>
            <Cta onClick={unlock}>Unlock with Face ID</Cta>
            <Cta variant="secondary" onClick={() => setMode("passcode")}>Use passcode instead</Cta>
          </>
        )}
        {lockedOut && <Cta onClick={() => navigate("/restore")}>Restore from recovery phrase</Cta>}
        {!lockedOut && mode === "passcode" && state.settings.appLock.faceId && (
          <Cta variant="secondary" onClick={() => setMode("faceId")}>Use Face ID</Cta>
        )}
      </div>
    </Screen>
  );
}
