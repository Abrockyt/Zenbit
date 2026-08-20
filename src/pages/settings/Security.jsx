import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, Row, SectionLabel, Cta } from "../../components/screen/Screen";
import Switch from "../../components/forms/Switch";
import Icon from "../../components/core/Icon";
import { useApp, useToast } from "../../state/store";
import { dur, ease, scrimTransition } from "../../lib/motion";

const PHRASE = "canyon drift ember lattice quarry vivid nomad thicket pearl summit orbit fable".split(" ");

const DEVICES = [
  { id: "d1", label: "This device", detail: "Windows · Chrome · Bengaluru", current: true },
  { id: "d2", label: "iPhone 15 Pro", detail: "Last active 2d ago", current: false },
  { id: "d3", label: "MacBook Air", detail: "Last active 3w ago", current: false },
];

export default function Security() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const lock = state.settings.appLock;

  const [devices, setDevices] = useState(DEVICES);
  const [gate, setGate] = useState(null); // 'phrase' | null
  const [passcode, setPasscode] = useState("");
  const [gateError, setGateError] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const setLock = (patch, message) => {
    dispatch({ type: "settings/setAppLock", patch });
    toast(message ?? "Changes saved.");
  };

  // The diagram notes sensitive actions re-prompt even mid-session, so revealing
  // the phrase goes through the lock regardless of how long you've been signed in.
  const openPhrase = () => {
    setRevealed(false);
    setPasscode("");
    setGateError(false);
    if (lock.requireOnSensitive) setGate("phrase");
    else {
      setRevealed(true);
      setGate("phrase");
    }
  };

  const confirmGate = () => {
    if (passcode === "000000" || passcode.length === 6) {
      setRevealed(true);
      setGateError(false);
    } else {
      setGateError(true);
    }
  };

  const revoke = (id) => {
    setDevices((d) => d.filter((x) => x.id !== id));
    toast("Device signed out.");
  };

  return (
    <Screen title="Security">
      <SectionLabel>App lock</SectionLabel>
      <Row
        icon="shield"
        label="Face ID"
        hint={lock.faceId ? "Used to unlock and to confirm sends" : "Off — passcode only"}
        trailing={<Switch checked={lock.faceId} onChange={(v) => setLock({ faceId: v }, v ? "Face ID on." : "Face ID off.")} />}
      />
      <Row
        icon="lock"
        label={lock.passcode ? "Change passcode" : "Set a passcode"}
        hint="Six digits. Backs up Face ID if biometrics fail."
        onClick={() => setLock({ passcode: true }, lock.passcode ? "Passcode updated." : "Passcode set.")}
      />
      <Row
        icon="alert"
        label="Confirm sensitive actions"
        hint="Re-check identity before showing the phrase or sending a large amount"
        trailing={<Switch checked={lock.requireOnSensitive} onChange={(v) => setLock({ requireOnSensitive: v })} />}
      />

      <SectionLabel>Recovery</SectionLabel>
      <Row icon="eye" label="View recovery phrase" hint="Twelve words. Never shared with Zenbit." onClick={openPhrase} />
      <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
        Anyone with these words controls this wallet. Write them down offline — never in a photo, note or message.
      </p>

      <SectionLabel>Devices</SectionLabel>
      {devices.map((d) => (
        <Row
          key={d.id}
          icon="user"
          label={d.label}
          hint={d.detail}
          value={d.current ? "Active" : undefined}
          tone={d.current ? "var(--up-500)" : undefined}
          trailing={
            d.current ? undefined : (
              <button onClick={() => revoke(d.id)} style={{ padding: "8px 14px", borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--down-500)", font: "500 13px/1 var(--font-core)" }}>
                Revoke
              </button>
            )
          }
        />
      ))}

      <AnimatePresence>
        {gate && (
          <>
            <motion.button {...scrimTransition} onClick={() => setGate(null)} aria-label="Dismiss" style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(6px)", border: "none", zIndex: 40 }} />
            <motion.div
              initial={{ y: 460 }}
              animate={{ y: 0 }}
              exit={{ y: 460 }}
              transition={{ duration: dur.slow, ease: ease.emphasis }}
              role="dialog"
              aria-label="Recovery phrase"
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
                padding: "24px 20px 34px", borderRadius: "32px 32px 0 0",
                background: "var(--surface-card-solid)", borderTop: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", gap: 14,
              }}
            >
              {!revealed ? (
                <>
                  <span style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-raised)" }}>
                    <Icon name="lock" size={20} />
                  </span>
                  <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>Confirm it's you</p>
                  <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
                    Enter your passcode to show the recovery phrase.
                  </p>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value.replace(/\D/g, ""));
                      setGateError(false);
                    }}
                    aria-label="Passcode"
                    placeholder="••••••"
                    style={{
                      padding: "15px 18px", borderRadius: "var(--radius-sm)", letterSpacing: 8,
                      background: "var(--surface-card)",
                      border: `1px solid ${gateError ? "var(--down-500)" : "var(--border-default)"}`,
                      color: "#fff", font: "500 18px/1 var(--font-mono)", textAlign: "center",
                    }}
                  />
                  {gateError && (
                    <p className="zb-body-sm" role="alert" style={{ margin: 0, color: "var(--down-500)" }}>
                      That passcode isn't right. Six digits — try again, or use Face ID.
                    </p>
                  )}
                  <Cta onClick={confirmGate}>Show phrase</Cta>
                  <Cta variant="secondary" onClick={() => setGate(null)}>Cancel</Cta>
                </>
              ) : (
                <>
                  <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>Recovery phrase</p>
                  <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
                    Twelve words, in this order. Zenbit does not store them and cannot recover them for you.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {PHRASE.map((w, i) => (
                      <div key={w} style={{ padding: "10px 8px", borderRadius: "var(--radius-xs)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
                        <span className="zb-caption" style={{ color: "var(--text-tertiary)" }}>{i + 1}</span>
                        <span className="zb-mono" style={{ display: "block", color: "#fff", fontSize: 12 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                  <Cta
                    onClick={() => {
                      navigator.clipboard?.writeText(PHRASE.join(" "));
                      toast("Phrase copied. Paste it somewhere offline, then clear your clipboard.");
                    }}
                    variant="secondary"
                  >
                    Copy phrase
                  </Cta>
                  <Cta onClick={() => setGate(null)}>Done</Cta>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
