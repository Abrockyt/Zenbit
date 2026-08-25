import { useState } from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Button, TextButton, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";

export default function FaceIdScreen({ navigation }) {
  const { dispatch } = useApp();
  const [activating, setActivating] = useState(false);

  function activate() {
    setActivating(true);
    dispatch({ type: "settings/setAppLock", patch: { faceId: true } });
    dispatch({ type: "onboarding/set", patch: { faceIdEnabled: true } });
    setTimeout(() => navigation.navigate("Passcode"), 500);
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(58,222,126,0.08)", borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" }}>
          <Feather name="smile" size={40} color={colors.up} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "600", textAlign: "center" }}>Turn on Face ID for easy login</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", maxWidth: 280 }}>
          Use Face ID instead of your passcode to unlock Zenbit Pro and confirm sensitive actions.
        </Text>
      </View>
      <Button onPress={activate} loading={activating}>Activate Face ID</Button>
      <View style={{ marginTop: spacing.md, alignItems: "center" }}>
        <TextButton onPress={() => navigation.navigate("Passcode")}>Skip? Activate later</TextButton>
      </View>
    </Screen>
  );
}
