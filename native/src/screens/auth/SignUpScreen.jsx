import { useState } from "react";
import { View, Text } from "react-native";
import { Screen, Header, Button, TextField, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";

export default function SignUpScreen({ navigation }) {
  const { dispatch } = useApp();
  const [email, setEmail] = useState("alex.rivera@gmail.com");
  const [loading, setLoading] = useState(false);

  function submit() {
    setLoading(true);
    dispatch({ type: "session/setUser", patch: { email } });
    dispatch({ type: "onboarding/set", patch: { isNewUser: true } });
    setTimeout(() => navigation.navigate("VerifyEmail"), 600);
  }

  return (
    <Screen
      scroll={false}
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Button onPress={submit} loading={loading} disabled={!email.includes("@")}>Continue</Button>
          <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: "center", marginTop: spacing.md }}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      }
    >
      <Header title="" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Create your account</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, marginBottom: spacing.lg }}>
        Sign up to hold your assets and discover new opportunities.
      </Text>
      <TextField value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
    </Screen>
  );
}
