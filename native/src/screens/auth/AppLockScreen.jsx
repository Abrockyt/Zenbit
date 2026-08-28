import { useState } from "react";
import { View, Text } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Button, Keypad, Dots, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";

const PASSCODE = "000000";
const MAX_ATTEMPTS = 5;

export default function AppLockScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [entry, setEntry] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [mode, setMode] = useState(state.settings.appLock.faceId ? "faceId" : "passcode");

  const lockedOut = attempts >= MAX_ATTEMPTS;

  const unlock = () => {
    dispatch({ type: "session/unlock" });
    navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  const submit = (value) => {
    if (value === PASSCODE) return unlock();
    setAttempts((a) => a + 1);
    setEntry("");
  };

  const onKey = (k) => {
    if (lockedOut) return;
    if (k === "back") return setEntry((e) => e.slice(0, -1));
    const next = (entry + k).slice(0, 6);
    setEntry(next);
    if (next.length === 6) setTimeout(() => submit(next), 120);
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center" }}>
          <Feather name={mode === "faceId" ? "user" : "lock"} size={26} color={colors.textPrimary} />
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>Zenbit is locked</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: "center", maxWidth: 260 }}>
            {lockedOut ? "Too many attempts. Try again in 15 minutes, or restore from your recovery phrase." : mode === "faceId" ? "Look at your device to unlock." : "Enter your six-digit passcode."}
          </Text>
        </View>

        {mode === "passcode" && !lockedOut && (
          <>
            <Dots count={6} filled={entry.length} />
            {attempts > 0 && (
              <Text style={{ color: colors.down, fontSize: 12 }}>
                Wrong passcode. {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? "" : "s"} left.
              </Text>
            )}
            <Keypad onKey={onKey} />
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Demo passcode: 000000</Text>
          </>
        )}
      </View>

      <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
        {mode === "faceId" && !lockedOut && (
          <>
            <Button onPress={unlock}>Unlock with Face ID</Button>
            <Button variant="secondary" onPress={() => setMode("passcode")}>Use passcode instead</Button>
          </>
        )}
        {lockedOut && <Button onPress={() => navigation.navigate("RestoreWallet")}>Restore from recovery phrase</Button>}
        {!lockedOut && mode === "passcode" && state.settings.appLock.faceId && (
          <Button variant="secondary" onPress={() => setMode("faceId")}>Use Face ID</Button>
        )}
      </View>
    </Screen>
  );
}
