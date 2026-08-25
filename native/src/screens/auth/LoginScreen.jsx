import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen, Header, Button, TextField, TextButton, Banner, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";

// Demo password is intentionally fixed so the error + recovery path is
// reachable — anything else fails, same as the web version.
const DEMO_PASSWORD = "zenbit";

export default function LoginScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState(state.session.user.email);
  const [password, setPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const signIn = useAsyncAction(async () => {
    if (password !== DEMO_PASSWORD) throw new Error("Incorrect password.");
    dispatch({ type: "session/signIn" });
  }, { label: "Verifying credentials" });

  const submit = async () => {
    await signIn.run();
    if (!signIn.isError) navigation.replace("MainTabs");
  };

  // No real OAuth backend exists for this demo, so social sign-in is
  // honest about what it actually does: signs straight into the same
  // demo account, same as the "Continue with Google" flow on web.
  const socialSignIn = () => {
    dispatch({ type: "session/signIn" });
    navigation.replace("MainTabs");
  };

  return (
    <Screen>
      <Header title="Log in" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.lg }}>
        Welcome back. Your wallet stays on this device — logging in just unlocks it.
      </Text>

      <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
        <TextField value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" />
        <TextField
          value={password}
          onChangeText={(v) => { setPassword(v); if (signIn.isError) signIn.reset(); }}
          placeholder="Password"
          secureTextEntry
        />
      </View>

      <Text style={{ color: colors.textTertiary, fontSize: 11, marginBottom: spacing.md }}>
        Demo build — the password is "zenbit". Anything else shows the failure path.
      </Text>

      {signIn.isError && (
        <View style={{ marginBottom: spacing.md }}>
          <Banner tone="danger">{signIn.error?.message} Check the password, or reset it by email.</Banner>
        </View>
      )}
      {resetSent && !signIn.isError && (
        <Text style={{ color: colors.up, fontSize: 13, marginBottom: spacing.md }}>We emailed a six-digit reset code to {email}.</Text>
      )}

      <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
        <Button onPress={submit} loading={signIn.isLoading} disabled={!email || !password}>Log in</Button>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable onPress={socialSignIn} style={{ flex: 1, height: 50, borderRadius: radius.md, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#000", fontSize: 15, fontFamily: fonts.medium }}>Google</Text>
          </Pressable>
          <Pressable onPress={socialSignIn} style={{ flex: 1, height: 50, borderRadius: radius.md, backgroundColor: "#000", borderWidth: 1, borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.white, fontSize: 15, fontFamily: fonts.medium }}>Apple</Text>
          </Pressable>
        </View>

        <Button variant="secondary" onPress={() => navigation.navigate("RestoreWallet")}>Restore from recovery phrase</Button>
        <TextButton onPress={() => { setResetSent(true); toast("Reset code sent to your email."); }}>Forgot your password?</TextButton>
      </View>
    </Screen>
  );
}
