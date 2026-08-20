import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, Row, SectionLabel, Cta } from "../../components/screen/Screen";
import TabBar from "../../components/navigation/TabBar";
import { useApp } from "../../state/store";
import { dur, ease, scrimTransition } from "../../lib/motion";

const kycLabel = { unverified: "Not started", pending: "In review", approved: "Verified", rejected: "Action needed" };
const kycTone = {
  unverified: "var(--text-tertiary)",
  pending: "var(--warn-500)",
  approved: "var(--up-500)",
  rejected: "var(--down-500)",
};

export default function Settings() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const s = state.settings;

  const messageLabel = { everyone: "Everyone", followers: "Followers", none: "No one" }[s.whoCanMessage];
  const notifOn = Object.values(s.notifications).filter(Boolean).length;

  return (
    <Screen title="Settings" tabBar={<TabBar />} onBack={() => navigate("/profile")}>
      <SectionLabel>Account</SectionLabel>
      <Row
        icon="shield"
        label="Identity verification"
        hint="Required for Buy, Sell and Card"
        value={kycLabel[state.kyc.status]}
        tone={kycTone[state.kyc.status]}
        onClick={() => navigate(state.kyc.status === "unverified" ? "/kyc" : "/kyc/status")}
      />
      <Row icon="card" label="Linked card" value={state.card.ordered ? `•• ${state.card.last4}` : "None"} onClick={() => navigate("/card")} />
      <Row icon="wallet" label="Payment methods" value={String(state.paymentMethods.length)} onClick={() => navigate("/payment-methods")} />

      <SectionLabel>Security</SectionLabel>
      <Row icon="lock" label="Security & app lock" hint="Face ID, passcode, recovery phrase" onClick={() => navigate("/settings/security")} />

      <SectionLabel>Social & privacy</SectionLabel>
      <Row icon="message" label="Who can message you" value={messageLabel} onClick={() => navigate("/settings/privacy")} />
      <Row icon="eye" label="Privacy" hint="Post visibility, portfolio on profile" onClick={() => navigate("/settings/privacy")} />
      <Row icon="users" label="Muted & blocked" value={String(state.social.muted.length + state.social.blocked.length)} onClick={() => navigate("/settings/blocked")} />
      <Row icon="alert" label="Report & safety" value={String(state.social.reports.length)} onClick={() => navigate("/settings/reports")} />

      <SectionLabel>Preferences</SectionLabel>
      <Row icon="bell" label="Notifications" value={`${notifOn} of 5 on`} onClick={() => navigate("/settings/notifications")} />
      <Row icon="trending-up" label="Price alerts" value={String(state.priceAlerts.length)} onClick={() => navigate("/settings/alerts")} />
      <Row icon="refresh" label="Display currency" value={s.currency.toUpperCase()} onClick={() => navigate("/settings/currency")} />

      <div style={{ marginTop: 8 }}>
        <Row icon="log-out" label="Log out" danger onClick={() => setConfirmSignOut(true)} />
      </div>

      <p className="zb-caption" style={{ color: "var(--text-tertiary)", textAlign: "center", margin: "4px 0 0" }}>
        Zenbit Pro · self-custody · demo build
      </p>

      <AnimatePresence>
        {confirmSignOut && (
          <>
            <motion.button
              {...scrimTransition}
              onClick={() => setConfirmSignOut(false)}
              aria-label="Dismiss"
              style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(6px)", border: "none", zIndex: 40 }}
            />
            <motion.div
              initial={{ y: 280 }}
              animate={{ y: 0 }}
              exit={{ y: 280 }}
              transition={{ duration: dur.slow, ease: ease.emphasis }}
              role="dialog"
              aria-label="Confirm log out"
              style={{
                position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 41,
                padding: "24px 20px 34px", borderTopLeftRadius: 32, borderTopRightRadius: 32,
                background: "var(--surface-card-solid)", borderTop: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>Log out of Zenbit Pro?</p>
              <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
                Your wallet stays on this device. You'll need your recovery phrase to restore it elsewhere.
              </p>
              <Cta
                onClick={() => {
                  dispatch({ type: "session/signOut" });
                  navigate("/welcome", { replace: true });
                }}
              >
                Log out
              </Cta>
              <Cta variant="secondary" onClick={() => setConfirmSignOut(false)}>Stay signed in</Cta>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
