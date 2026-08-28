import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "../ui/IconCompat";
import * as Clipboard from "expo-clipboard";
import { Screen, TabBar, IconButton, SectionHeader, Row, Avatar, Sheet, Button, Skeleton, colors, spacing, radius, fonts } from "../ui/kit";
import { useApp, useToast } from "../state/store";
import { useMarkets } from "../data/useCoinGecko";
import { useCurrency } from "../lib/useCurrency";
import { compactMoney } from "../lib/format";
import { useBootReady } from "../state/useBootReady";

const KYC_VIEW = {
  unverified: { label: "Verify your identity", tone: colors.textTertiary, hint: "Needed for Buy, Sell and Card" },
  pending: { label: "Verification in review", tone: colors.warn, hint: "Usually under two minutes" },
  approved: { label: "Identity verified", tone: colors.up, hint: "Buy, Sell and Card unlocked" },
  rejected: { label: "Verification needs attention", tone: colors.down, hint: "Tap to resubmit your documents" },
};

// Real derived numbers, not decoration — portfolio value comes from the
// same live market feed the rest of the app uses, and every count is read
// off actual state rather than hardcoded.
function StatBlock({ value, label, onPress }) {
  const body = (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 2 }}>
      {/* Fixed size with tail ellipsis rather than shrink-to-fit. Auto-
          shrinking made the portfolio figure noticeably smaller than the
          counts beside it, so the row's type size jumped around depending
          on how much money you had. The value is abbreviated upstream
          (compactMoney) so it fits at this size in the normal case, and
          the ellipsis is the honest fallback when it genuinely can't. */}
      <Text
        style={{ color: colors.textPrimary, fontSize: 16, fontFamily: fonts.semibold }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
      <Text style={{ color: colors.textTertiary, fontSize: 11.5, marginTop: 3 }}>{label}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} style={{ flex: 1 }}>{body}</Pressable> : body;
}

export default function ProfileScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const { currency, money } = useCurrency();
  const user = state.session.user;
  const kyc = KYC_VIEW[state.kyc.status];
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const holdings = state.wallet.holdings;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets } = useMarkets(ids, { vs: currency });
  const portfolioValue = holdings.reduce(
    (sum, h) => sum + (markets?.find((m) => m.id === h.id)?.current_price ?? 0) * h.units,
    0
  );

  const copyAddress = async () => {
    await Clipboard.setStringAsync(state.wallet.address);
    toast("Address copied.");
  };

  const signOut = () => {
    setConfirmSignOut(false);
    dispatch({ type: "session/signOut" });
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  };

  // Only the portfolio figure had a real loading state (useMarkets); the
  // avatar, stat row, KYC card and every settings link rendered instantly
  // with no loading beat at all on the first visit each session.
  if (!useBootReady()) {
    return (
      <Screen>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
          <Skeleton width={80} height={22} />
          <Skeleton width={36} height={36} radius={18} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: spacing.lg }}>
          <Skeleton width={56} height={56} radius={28} />
          <View style={{ gap: 6 }}>
            <Skeleton width={120} height={16} />
            <Skeleton width={160} height={12} />
          </View>
        </View>
        <Skeleton width="100%" height={70} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={60} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={50} radius={radius.md} style={{ marginBottom: spacing.md }} />
        <Skeleton width={70} height={12} style={{ marginBottom: spacing.sm }} />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} width="100%" height={46} radius={radius.md} style={{ marginBottom: spacing.sm }} />)}
      </Screen>
    );
  }

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

      {/* Real portfolio/social numbers, each tapping through to the screen
          that owns them — the profile used to be a bare avatar + a list of
          links with nothing about the actual account on it. */}
      <View style={{ flexDirection: "row", borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
        <StatBlock value={compactMoney(portfolioValue, currency)} label="Portfolio" onPress={() => navigation.navigate("Asset")} />
        <View style={{ width: 1, backgroundColor: colors.borderSubtle, marginVertical: 10 }} />
        <StatBlock value={String(holdings.length)} label="Assets" onPress={() => navigation.navigate("Asset")} />
        <View style={{ width: 1, backgroundColor: colors.borderSubtle, marginVertical: 10 }} />
        <StatBlock value={String(state.watchlist.length)} label="Watchlist" onPress={() => navigation.navigate("Watchlist")} />
        <View style={{ width: 1, backgroundColor: colors.borderSubtle, marginVertical: 10 }} />
        <StatBlock value={String(state.social.following.length)} label="Following" onPress={() => navigation.navigate("FollowList", { handle: "you", list: "following" })} />
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

      {/* Log out lived only inside Settings, three taps deep, where nobody
          looks for it. It stays there too — this is just the obvious place. */}
      <View style={{ height: spacing.lg }} />
      <Row icon="log-out" title="Log out" danger onPress={() => setConfirmSignOut(true)} />
      <View style={{ height: spacing.xl }} />

      <Sheet open={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Log out of Zenbit Pro?">
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md }}>
          Your wallet stays on this device. You'll need your password to get back in.
        </Text>
        <View style={{ gap: spacing.sm }}>
          <Button onPress={signOut}>Log out</Button>
          <Button variant="secondary" onPress={() => setConfirmSignOut(false)}>Stay signed in</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
