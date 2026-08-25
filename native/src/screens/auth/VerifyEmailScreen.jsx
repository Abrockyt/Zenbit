import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, TextField, TextButton, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Demo build has no real inbox, so the code is honestly revealable in-UI
// rather than asking for a code the user has no way to receive.
export default function VerifyEmailScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const email = state.session.user?.email ?? "your email";

  const [otp, setOtp] = useState(generateOtp);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function submit() {
    if (code.length !== 6 || code !== otp) { setError(true); return; }
    setError(false);
    dispatch({ type: "onboarding/set", patch: { emailVerified: true } });
    navigation.navigate("CreateWallet");
  }

  function resend() {
    if (cooldown > 0) return;
    setOtp(generateOtp());
    setCode("");
    setError(false);
    setRevealed(false);
    setCooldown(30);
    toast(`New code sent to ${email}.`);
  }

  return (
    <Screen>
      <Header title="" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Enter your code</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, marginBottom: spacing.lg }}>
        We sent a 6-digit code to {email}.
      </Text>

      <TextField value={code} onChangeText={(v) => { setCode(v.replace(/\D/g, "").slice(0, 6)); setError(false); }} placeholder="6-digit code" keyboardType="number-pad" />
      {error && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>That code didn't match. Check it and try again.</Text>}

      <Pressable
        onPress={() => setRevealed((r) => !r)}
        style={{ flexDirection: "row", gap: 10, alignItems: "center", padding: 14, borderRadius: radius.md, backgroundColor: "rgba(91,140,255,0.08)", borderWidth: 1, borderColor: "rgba(91,140,255,0.22)", marginTop: spacing.lg }}
      >
        <Feather name="shield" size={16} color={colors.info} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.info, fontSize: 13 }}>Demo build — no real email is sent</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {revealed ? `Your code is ${otp.split("").join(" ")}` : "Tap to reveal the code"}
          </Text>
        </View>
      </Pressable>

      <View style={{ marginTop: spacing.md }}>
        <TextButton onPress={resend}>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</TextButton>
      </View>

      <View style={{ flex: 1 }} />
      <Button onPress={submit} disabled={code.length !== 6}>Continue</Button>
    </Screen>
  );
}
