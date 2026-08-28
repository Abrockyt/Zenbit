import { useEffect } from "react";
import { View, Text } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, Button, Banner, colors, spacing, radius } from "../../ui/kit";
import { goTo } from "../../lib/nav";
import { useApp } from "../../state/store";

const STEPS = [
  { icon: "credit-card", label: "Photo ID", hint: "Passport, driving licence or national ID" },
  { icon: "camera", label: "Selfie check", hint: "Confirms the ID belongs to you" },
  { icon: "check", label: "Review", hint: "Usually under two minutes" },
];

// KYC is triggered by Buy/Sell or Card on first use, and on success returns
// to whatever asked for it — carried through the `next` route param.
export default function KycIntroScreen({ navigation, route }) {
  const next = route.params?.next ?? "Home";
  const { state } = useApp();
  const inFlight = state.kyc.status !== "unverified";

  useEffect(() => {
    if (inFlight) navigation.replace("KycStatus", { next });
  }, [inFlight]);

  if (inFlight) return null;

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
          <Button onPress={() => navigation.navigate("KycDocuments", { next })}>Start verification</Button>
          <Button variant="secondary" onPress={() => goTo(navigation, next)}>Not now</Button>
        </View>
      }
    >
      <Header title="Verify your identity" onBack={() => goTo(navigation, next)} />
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: spacing.lg }}>
        Buying, selling and the Zenbit card need a verified identity. Holding, sending and swapping what you already own do not.
      </Text>

      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {STEPS.map((s, i) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
              <Feather name={s.icon} size={18} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{s.label}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{s.hint}</Text>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{i + 1} of 3</Text>
          </View>
        ))}
      </View>

      <Banner>Your documents are encrypted in transit and never shown to other Zenbit users. This demo simulates verification — nothing is uploaded anywhere.</Banner>

    </Screen>
  );
}
