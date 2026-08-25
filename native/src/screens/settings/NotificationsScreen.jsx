import { Text } from "react-native";
import { Screen, Header, Row, Switch, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

const CATEGORIES = [
  { key: "security", icon: "shield", label: "Security", hint: "Sign-ins, KYC decisions, recovery attempts" },
  { key: "transactions", icon: "arrow-up", label: "Transactions", hint: "Send, swap and buy confirmations" },
  { key: "priceAlerts", icon: "trending-up", label: "Price alerts", hint: "Targets you set on watchlist coins" },
  { key: "social", icon: "message-circle", label: "Social", hint: "Replies, mentions and new messages" },
  { key: "card", icon: "credit-card", label: "Card", hint: "Declines, top-ups and spend summaries" },
];

export default function NotificationsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const n = state.settings.notifications;
  const allOn = CATEGORIES.every((c) => n[c.key]);
  const toggle = (key, value) => dispatch({ type: "settings/setNotification", key, value });
  const toggleAll = (value) => { CATEGORIES.forEach((c) => toggle(c.key, value)); toast(value ? "All notifications on." : "All notifications off."); };

  return (
    <Screen>
      <Header title="Notifications" onBack={() => navigation.goBack()} />
      <Row icon="bell" title={allOn ? "All categories on" : "Turn on everything"} subtitle="Master switch for the five categories below" right={<Switch value={allOn} onValueChange={toggleAll} />} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginVertical: spacing.md }}>Categories</Text>
      {CATEGORIES.map((c) => (
        <Row key={c.key} icon={c.icon} title={c.label} subtitle={c.hint} right={<Switch value={n[c.key]} onValueChange={(v) => toggle(c.key, v)} />} />
      ))}
    </Screen>
  );
}
