import { View, Text } from "react-native";
import { Screen, Header, TabBar, Row, Sheet, Button, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";
import { useState } from "react";

const KYC_LABEL = { unverified: "Not started", pending: "In review", approved: "Verified", rejected: "Action needed" };

export default function SettingsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const s = state.settings;
  const messageLabel = { everyone: "Everyone", followers: "Followers", none: "No one" }[s.whoCanMessage];
  const notifOn = Object.values(s.notifications).filter(Boolean).length;

  return (
    <Screen>
      <Header title="Settings" onBack={() => navigation.navigate("Profile")} />

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Account</Text>
      <Row icon="shield" title="Identity verification" subtitle={KYC_LABEL[state.kyc.status]} onPress={() => navigation.navigate(state.kyc.status === "unverified" ? "KycIntro" : "KycStatus", { next: "Settings" })} />
      <Row icon="credit-card" title="Linked card" subtitle={state.card.ordered ? `•• ${state.card.last4}` : "None"} onPress={() => navigation.navigate("Card")} />
      <Row icon="briefcase" title="Payment methods" subtitle={String(state.paymentMethods.length)} onPress={() => navigation.navigate("PaymentMethods")} />

      <View style={{ height: spacing.md }} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Security</Text>
      <Row icon="lock" title="Security & app lock" subtitle="Face ID, passcode, recovery phrase" onPress={() => navigation.navigate("Security")} />

      <View style={{ height: spacing.md }} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Social & privacy</Text>
      <Row icon="message-circle" title="Who can message you" subtitle={messageLabel} onPress={() => navigation.navigate("Privacy")} />
      <Row icon="eye" title="Privacy" subtitle="Post visibility, portfolio on profile" onPress={() => navigation.navigate("Privacy")} />
      <Row icon="users" title="Muted & blocked" subtitle={String(state.social.muted.length + state.social.blocked.length)} onPress={() => navigation.navigate("BlockedAccounts")} />
      <Row icon="alert-triangle" title="Report & safety" subtitle={String(state.social.reports.length)} onPress={() => navigation.navigate("Reports")} />

      <View style={{ height: spacing.md }} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Preferences</Text>
      <Row icon="bell" title="Notifications" subtitle={`${notifOn} of 5 on`} onPress={() => navigation.navigate("NotificationSettings")} />
      <Row icon="trending-up" title="Price alerts" subtitle={String(state.priceAlerts.length)} onPress={() => navigation.navigate("PriceAlerts")} />
      <Row icon="refresh-cw" title="Display currency" subtitle={s.currency.toUpperCase()} onPress={() => navigation.navigate("Currency")} />

      <View style={{ height: spacing.md }} />
      <Row icon="log-out" title="Log out" danger onPress={() => setConfirmSignOut(true)} />
      <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: "center", marginTop: spacing.md }}>Zenbit Pro · self-custody · demo build</Text>

      <Sheet open={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Log out of Zenbit Pro?">
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md }}>Your wallet stays on this device. You'll need your recovery phrase to restore it elsewhere.</Text>
        <View style={{ gap: spacing.sm }}>
          <Button onPress={() => { dispatch({ type: "session/signOut" }); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }}>Log out</Button>
          <Button variant="secondary" onPress={() => setConfirmSignOut(false)}>Stay signed in</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
