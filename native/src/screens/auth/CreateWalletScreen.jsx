import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, Banner, colors, spacing, radius } from "../../ui/kit";
import { useApp } from "../../state/store";

// Fixed, obviously-fake demo phrase — portfolio piece, no real key material.
const PHRASE = ["orbit", "canyon", "velvet", "matrix", "harbor", "quartz", "ember", "trellis", "cobalt", "meadow", "signal", "granite"];

export default function CreateWalletScreen({ navigation }) {
  const { dispatch } = useApp();
  const [revealed, setRevealed] = useState(false);

  return (
    <Screen>
      <Header title="" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Your recovery phrase</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, marginBottom: spacing.lg }}>
        Write these 12 words down in order and keep them somewhere safe. Anyone with this phrase can access your wallet.
      </Text>

      <View style={{ borderRadius: radius.lg, backgroundColor: colors.surfaceCard, padding: 16, position: "relative" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {PHRASE.map((w, i) => (
            <View key={w} style={{ width: "50%", flexDirection: "row", gap: 8, paddingVertical: 5 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 11, width: 16 }}>{i + 1}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "500", opacity: revealed ? 1 : 0.15 }}>{w}</Text>
            </View>
          ))}
        </View>
        {!revealed && (
          <Pressable
            onPress={() => setRevealed(true)}
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(4,6,5,0.55)", borderRadius: radius.lg, alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Feather name="eye" size={20} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "500" }}>Tap to reveal</Text>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: spacing.md }}>
        <Banner tone="warn">Zenbit Pro can't recover this phrase for you. Losing it means losing access to your funds.</Banner>
      </View>

      <View style={{ flex: 1 }} />
      <Button
        disabled={!revealed}
        onPress={() => { dispatch({ type: "onboarding/set", patch: { phraseBackedUp: true } }); navigation.navigate("FaceId"); }}
      >
        I've saved it
      </Button>
    </Screen>
  );
}
