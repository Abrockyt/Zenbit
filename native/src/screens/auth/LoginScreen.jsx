import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
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
  const [showPassword, setShowPassword] = useState(false);

  const signIn = useAsyncAction(async () => {
    if (password !== DEMO_PASSWORD) throw new Error("Incorrect password.");
    dispatch({ type: "session/signIn" });
  }, { label: "Verifying credentials" });

  // reset, not replace: `replace` only swaps the *current* route (Login)
  // for MainTabs and leaves Welcome sitting underneath it in the stack — so
  // the app animated Home in over the welcome carousel, and a swipe-back
  // from Home returned you to it while still signed in. Clearing the stack
  // makes MainTabs the only route, which is what every other auth exit
  // (Passcode, RestoreWallet, AppLock) already did.
  const enterApp = () => navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });

  const submit = async () => {
    await signIn.run();
    if (!signIn.isError) enterApp();
  };

  // No real OAuth backend exists for this demo, so social sign-in is
  // honest about what it actually does: signs straight into the same
  // demo account, same as the "Continue with Google" flow on web.
  const socialSignIn = () => {
    dispatch({ type: "session/signIn" });
    enterApp();
  };

  const invalidEmail = email.length > 0 && !email.includes("@");

  return (
    <Screen>
      <Header title="" onBack={() => navigation.goBack()} />

      {/* Brand mark + a real headline instead of opening straight into a
          form under a small "Log in" header — the old screen had no visual
          anchor and read as a settings page, not an entry point. */}
      <View style={{ alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xxl }}>
        <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
          <Text style={{ color: colors.up, fontSize: 27, fontFamily: fonts.display }}>Z</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontFamily: fonts.medium, letterSpacing: -0.4 }}>Welcome back</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13.5, marginTop: 7, textAlign: "center", lineHeight: 19, maxWidth: 290 }}>
          Your wallet stays on this device — logging in just unlocks it.
        </Text>
      </View>

      {/* Labelled fields in a grouped card: the two bare placeholders gave
          no indication of what was wrong when a login failed. */}
      <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
        <View style={{ gap: 7 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>Email</Text>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            icon="mail"
          />
          {invalidEmail && <Text style={{ color: colors.down, fontSize: 11.5 }}>That doesn't look like an email address.</Text>}
        </View>

        <View style={{ gap: 7 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textTertiary, fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>Password</Text>
            <Pressable onPress={() => { setResetSent(true); toast("Reset code sent to your email."); }} hitSlop={8}>
              <Text style={{ color: colors.up, fontSize: 12, fontFamily: fonts.medium }}>Forgot?</Text>
            </Pressable>
          </View>
          <TextField
            value={password}
            onChangeText={(v) => { setPassword(v); if (signIn.isError) signIn.reset(); }}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            icon="lock"
            right={
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={17} color={colors.textTertiary} />
              </Pressable>
            }
          />
        </View>
      </View>

      {signIn.isError && (
        <View style={{ marginBottom: spacing.md }}>
          <Banner tone="danger">{signIn.error?.message} Check the password, or reset it by email.</Banner>
        </View>
      )}
      {resetSent && !signIn.isError && (
        <View style={{ marginBottom: spacing.md }}>
          <Banner>We emailed a six-digit reset code to {email}.</Banner>
        </View>
      )}

      <Button onPress={submit} loading={signIn.isLoading} disabled={!email || !password}>Log in</Button>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: spacing.xl }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
        <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>or continue with</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
      </View>

      {/* Both providers now share one neutral treatment — the old pair had a
          white Google button next to a black Apple one, which read as one
          primary action and one disabled. */}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {[
          { key: "google", icon: "google", label: "Google" },
          { key: "apple", icon: "apple1", label: "Apple" },
        ].map((p) => (
          <Pressable
            key={p.key}
            onPress={socialSignIn}
            style={({ pressed }) => ({
              flex: 1, height: 52, flexDirection: "row", gap: 9, borderRadius: radius.lg,
              backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderDefault,
              alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1,
            })}
          >
            <AntDesign name={p.icon} size={17} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontFamily: fonts.medium }}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button variant="secondary" onPress={() => navigation.navigate("RestoreWallet")}>Restore from recovery phrase</Button>
      </View>

      <Pressable onPress={() => navigation.navigate("SignUp")} style={{ alignItems: "center", paddingVertical: spacing.xl }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          New to Zenbit? <Text style={{ color: colors.up, fontFamily: fonts.medium }}>Create an account</Text>
        </Text>
      </Pressable>

      <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: "center", paddingBottom: spacing.md }}>
        Demo build — the password is "zenbit". Anything else shows the failure path.
      </Text>
    </Screen>
  );
}
