import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import TabBar from "../components/navigation/TabBar";
import SettingsRow from "../components/navigation/SettingsRow";
import SectionHeader from "../components/navigation/SectionHeader";
import Icon from "../components/core/Icon";
import { useApp, useToast } from "../state/store";
import { screenTransition } from "../lib/motion";

const kycView = {
  unverified: { label: "Verify your identity", tone: "var(--text-tertiary)", hint: "Needed for Buy, Sell and Card" },
  pending: { label: "Verification in review", tone: "var(--warn-500)", hint: "Usually under two minutes" },
  approved: { label: "Identity verified", tone: "var(--up-500)", hint: "Buy, Sell and Card unlocked" },
  rejected: { label: "Verification needs attention", tone: "var(--down-500)", hint: "Tap to resubmit your documents" },
};

export default function Profile() {
  const navigate = useNavigate();
  const { state } = useApp();
  const toast = useToast();
  const user = state.session.user;
  const kyc = kycView[state.kyc.status];

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(state.wallet.address);
      toast("Address copied.");
    } catch {
      toast("Couldn't copy the address.", "down");
    }
  };

  return (
    <PhoneFrame tabBar={<TabBar />}>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 108px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="zb-title-1" style={{ color: "#fff" }}>Profile</div>
          <button onClick={() => navigate("/settings")} aria-label="Settings" style={{ width: 44, height: 44, display: "grid", placeItems: "center", background: "none", border: "none" }}>
            <Icon name="settings" size={20} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 999, background: "var(--surface-raised)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="zb-title-3" style={{ color: "#fff" }}>{user.avatarInitials}</span>
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="zb-title-3" style={{ color: "#fff" }}>{user.name}</div>
            <div className="zb-body-sm" style={{ color: "var(--text-tertiary)" }}>{user.email}</div>
          </div>
        </div>

        <button
          onClick={() => navigate(state.kyc.status === "unverified" ? "/kyc?next=/profile" : "/kyc/status?next=/profile")}
          style={{
            display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%",
            padding: 16, borderRadius: "var(--radius-lg)",
            background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{ width: 36, height: 36, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-raised)", flex: "0 0 auto" }}>
            <Icon name="shield" size={17} color={kyc.tone} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="zb-body" style={{ display: "block", color: kyc.tone }}>{kyc.label}</span>
            <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)" }}>{kyc.hint}</span>
          </span>
          <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
        </button>

        <button onClick={copyAddress} style={{ textAlign: "left", padding: 12, borderRadius: "var(--radius-sm)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)", marginBottom: 3 }}>Wallet address · tap to copy</span>
          <span className="zb-mono" style={{ color: "var(--text-secondary)", fontSize: 12, wordBreak: "break-all" }}>{state.wallet.address}</span>
        </button>

        <div>
          <SectionHeader title="Account" />
          <SettingsRow icon="shield-check" label="Security and login" onClick={() => navigate("/settings/security")} />
          <SettingsRow icon="lock" label="Social and privacy" onClick={() => navigate("/settings/privacy")} />
          <SettingsRow icon="credit-card" label="Payment methods" onClick={() => navigate("/payment-methods")} />
          <SettingsRow icon="bell" label="Notifications" onClick={() => navigate("/settings/notifications")} />
          <SettingsRow icon="clock" label="Recent activity" onClick={() => navigate("/activity")} />
        </div>

        <div>
          <SectionHeader title="Social" />
          <SettingsRow icon="user" label="Your public profile" onClick={() => navigate("/social/u/you")} />
          <SettingsRow icon="message-circle" label="Messages" onClick={() => navigate("/messages")} />
          <SettingsRow icon="user-x" label="Muted and blocked" onClick={() => navigate("/settings/blocked")} />
        </div>

        <div>
          <SectionHeader title="More" />
          <SettingsRow icon="trending-up" label="Price alerts" onClick={() => navigate("/settings/alerts")} />
          <SettingsRow icon="triangle-alert" label="Report and safety" onClick={() => navigate("/settings/reports")} />
          <SettingsRow icon="circle-help" label="Help centre" onClick={() => toast("Support will reply by email within a day.")} />
          <SettingsRow icon="settings" label="All settings" onClick={() => navigate("/settings")} />
        </div>
      </motion.div>
    </PhoneFrame>
  );
}
