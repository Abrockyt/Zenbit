import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, Button, colors, spacing, radius } from "../../ui/kit";
import { useApp } from "../../state/store";

const POINTS = [
  { icon: "lock", title: "You hold the keys", body: "Zenbit can't move your funds, freeze your wallet, or recover your phrase." },
  { icon: "alert-triangle", title: "Transfers are final", body: "Once a transaction is broadcast it cannot be reversed, including a send to the wrong address." },
  { icon: "shield", title: "Verification for some features", body: "Buying, selling and the Zenbit card require identity verification." },
];

export default function TermsScreen({ navigation }) {
  const { dispatch } = useApp();
  const [accepted, setAccepted] = useState(false);

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Button
            disabled={!accepted}
            onPress={() => { dispatch({ type: "onboarding/set", patch: { termsAccepted: true } }); navigation.navigate("CreateWallet"); }}
          >
            Create my wallet
          </Button>
        </View>
      }
    >
      <Header title="Before you start" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.lg }}>
        Three things worth understanding before your wallet is created.
      </Text>

      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {POINTS.map((p) => (
          <View key={p.title} style={{ flexDirection: "row", gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
              <Feather name={p.icon} size={17} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{p.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{p.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => setAccepted((a) => !a)}
        style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 16, borderRadius: radius.md, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: accepted ? colors.up : colors.borderDefault }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: accepted ? colors.up : "transparent", borderWidth: 1, borderColor: accepted ? colors.up : colors.borderStrong, alignItems: "center", justifyContent: "center" }}>
          {accepted && <Feather name="check" size={14} color="#03150c" />}
        </View>
        <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 13 }}>
          I understand, and I accept the Terms of Service and Privacy Policy.
        </Text>
      </Pressable>

    </Screen>
  );
}
