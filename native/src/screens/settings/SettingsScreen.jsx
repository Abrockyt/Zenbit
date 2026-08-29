import { View, Text, Pressable } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, TabBar, Row, Sheet, Button, Switch, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp } from "../../state/store";
import { useTheme } from "../../state/ThemeProvider";
import { useState } from "react";

const KYC_LABEL = { unverified: "Not started", pending: "In review", approved: "Verified", rejected: "Action needed" };

export default function SettingsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { mode, setMode } = useTheme();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const s = state.settings;
  const messageLabel = { everyone: "Everyone", followers: "Followers", none: "No one" }[s.whoCanMessage];
  const notifOn = Object.values(s.notifications).filter(Boolean).length;

  return (
    <Screen>
      {/* goBack, not navigate-to-tab. Settings is *pushed* on top of the
          tab navigator, so popping is what actually returns you — and it
          returns you to whichever tab you opened it from rather than
          forcing Profile. Navigating to the nested tab route didn't pop the
          stack at all, which left the back button doing nothing. */}
      <Header title="Settings" onBack={() => navigation.goBack()} />

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Account</Text>
      <Row icon="shield" title="Identity verification" subtitle={KYC_LABEL[state.kyc.status]} onPress={() => navigation.navigate(state.kyc.status === "unverified" ? "KycIntro" : "KycStatus", { next: "Settings" })} />
      <Row icon="credit-card" title="Linked card" subtitle={state.card.ordered ? `•• ${state.card.last4}` : "None"} onPress={() => navigation.navigate("MainTabs", { screen: "Card" })} />
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
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Appearance</Text>

      {/* A real switch as the primary control, since that's what people
          reach for, with the previews underneath so you can still see what
          you're choosing before committing. */}
      <Row
        icon={mode === "light" ? "sun" : "moon"}
        title="Light mode"
        subtitle={mode === "light" ? "Bright theme" : "Dark theme"}
        right={
          <Switch
            value={mode === "light"}
            onValueChange={(on) => setMode(on ? "light" : "dark")}
          />
        }
      />
      <View style={{ height: spacing.sm }} />

      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
        {[
          { key: "dark", label: "Dark", page: "#060B09", card: "#141B18", text: "#FFFFFF", sub: "rgba(255,255,255,0.4)" },
          { key: "light", label: "Light", page: "#F6F8F7", card: "#FFFFFF", text: "#0D1512", sub: "rgba(13,21,18,0.45)" },
        ].map((opt) => {
          const active = mode === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setMode(opt.key)}
              style={{
                flex: 1, borderRadius: radius.lg, overflow: "hidden",
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.up : colors.borderSubtle,
              }}
            >
              <View style={{ backgroundColor: opt.page, padding: 12, gap: 6 }}>
                <View style={{ height: 8, width: "55%", borderRadius: 4, backgroundColor: opt.text, opacity: 0.9 }} />
                <View style={{ backgroundColor: opt.card, borderRadius: 8, padding: 9, gap: 5 }}>
                  <View style={{ height: 6, width: "70%", borderRadius: 3, backgroundColor: opt.text, opacity: 0.75 }} />
                  <View style={{ height: 5, width: "45%", borderRadius: 3, backgroundColor: opt.sub }} />
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 11, backgroundColor: colors.surfaceCard }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium }}>{opt.label}</Text>
                {active && <Feather name="check-circle" size={15} color={colors.up} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing.md }} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Preferences</Text>
      <Row icon="bell" title="Notifications" subtitle={`${notifOn} of 5 on`} onPress={() => navigation.navigate("NotificationSettings")} />
      <Row icon="trending-up" title="Price alerts" subtitle={String(state.priceAlerts.length)} onPress={() => navigation.navigate("PriceAlerts")} />
      <Row icon="refresh-cw" title="Display currency" subtitle={s.currency.toUpperCase()} onPress={() => navigation.navigate("Currency")} />
      <Row icon="help-circle" title="Help centre" onPress={() => navigation.navigate("HelpCentre")} />

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
