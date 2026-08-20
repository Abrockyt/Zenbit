import { Screen, Row, SectionLabel } from "../../components/screen/Screen";
import Switch from "../../components/forms/Switch";
import { useApp, useToast } from "../../state/store";

// The five categories named in the flow diagram, each independently togglable.
const CATEGORIES = [
  { key: "security", icon: "shield", label: "Security", hint: "Sign-ins, KYC decisions, recovery attempts" },
  { key: "transactions", icon: "arrow-up", label: "Transactions", hint: "Send, swap and buy confirmations" },
  { key: "priceAlerts", icon: "trending-up", label: "Price alerts", hint: "Targets you set on watchlist coins" },
  { key: "social", icon: "message", label: "Social", hint: "Replies, mentions and new messages" },
  { key: "card", icon: "card", label: "Card", hint: "Declines, top-ups and spend summaries" },
];

export default function NotificationSettings() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const n = state.settings.notifications;
  const allOn = CATEGORIES.every((c) => n[c.key]);

  const toggle = (key, value) => dispatch({ type: "settings/setNotification", key, value });

  const toggleAll = (value) => {
    CATEGORIES.forEach((c) => toggle(c.key, value));
    toast(value ? "All notifications on." : "All notifications off.");
  };

  return (
    <Screen title="Notifications" subtitle="Security alerts are worth keeping on">
      <Row
        icon="bell"
        label={allOn ? "All categories on" : "Turn on everything"}
        hint="Master switch for the five categories below"
        trailing={<Switch checked={allOn} onChange={toggleAll} />}
      />

      <SectionLabel>Categories</SectionLabel>
      {CATEGORIES.map((c) => (
        <Row
          key={c.key}
          icon={c.icon}
          label={c.label}
          hint={c.hint}
          trailing={<Switch checked={n[c.key]} onChange={(v) => toggle(c.key, v)} />}
        />
      ))}

      <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
        Turning off Security still leaves in-app records — you'll see sign-ins and KYC updates on the activity screen, just without a push.
      </p>
    </Screen>
  );
}
