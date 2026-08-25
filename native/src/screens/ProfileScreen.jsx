import { View, Text, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Screen, TabBar, IconButton, SectionHeader, Row, Avatar, colors, spacing, radius } from "../ui/kit";
import { useApp, useToast } from "../state/store";

const KYC_VIEW = {
  unverified: { label: "Verify your identity", tone: colors.textTertiary, hint: "Needed for Buy, Sell and Card" },
  pending: { label: "Verification in review", tone: colors.warn, hint: "Usually under two minutes" },
  approved: { label: "Identity verified", tone: colors.up, hint: "Buy, Sell and Card unlocked" },
  rejected: { label: "Verification needs attention", tone: colors.down, hint: "Tap to resubmit your documents" },
};

export default function ProfileScreen({ navigation }) {
  const { state } = useApp();
  const toast = useToast();
  const user = state.session.user;
  const kyc = KYC_VIEW[state.kyc.status];

  const copyAddress = async () => {
    await Clipboard.setStringAsync(state.wallet.address);
    toast("Address copied.");
  };

  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Profile</Text>
        <IconButton icon="settings" onPress={() => navigation.navigate("Settings")} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: spacing.lg }}>
        <Avatar uri={user.avatarUrl} initials={user.avatarInitials} size={56} />
        <View>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "600" }}>{user.name}</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{user.email}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate(state.kyc.status === "unverified" ? "KycIntro" : "KycStatus", { next: "Profile" })}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: kyc.tone, fontSize: 14 }}>{kyc.label}</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{kyc.hint}</Text>
        </View>
      </Pressable>

      <Pressable onPress={copyAddress} style={{ padding: 12, borderRadius: 10, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.lg }}>
        <Text style={{ color: colors.textTertiary, fontSize: 11, marginBottom: 3 }}>Wallet address · tap to copy</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>{state.wallet.address}</Text>
      </Pressable>

      <SectionHeader title="Account" />
      <Row icon="shield" title="Security and login" onPress={() => navigation.navigate("Security")} />
      <Row icon="lock" title="Social and privacy" onPress={() => navigation.navigate("Privacy")} />
      <Row icon="credit-card" title="Payment methods" onPress={() => navigation.navigate("PaymentMethods")} />
      <Row icon="bell" title="Notifications" onPress={() => navigation.navigate("NotificationSettings")} />
      <Row icon="clock" title="Recent activity" onPress={() => navigation.navigate("RecentActivity")} />

      <View style={{ height: spacing.lg }} />
      <SectionHeader title="Social" />
      <Row icon="user" title="Your public profile" onPress={() => navigation.navigate("UserProfile", { handle: "you" })} />
      <Row icon="message-circle" title="Messages" onPress={() => navigation.navigate("Threads")} />
      <Row icon="user-x" title="Muted and blocked" onPress={() => navigation.navigate("BlockedAccounts")} />

      <View style={{ height: spacing.lg }} />
      <SectionHeader title="More" />
      <Row icon="trending-up" title="Price alerts" onPress={() => navigation.navigate("PriceAlerts")} />
      <Row icon="alert-triangle" title="Report and safety" onPress={() => navigation.navigate("Reports")} />
      <Row icon="help-circle" title="Help centre" onPress={() => toast("Support will reply by email within a day.")} />
      <Row icon="settings" title="All settings" onPress={() => navigation.navigate("Settings")} />
    </Screen>
  );
}
