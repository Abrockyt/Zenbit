import { useState } from "react";
import { View, Text } from "react-native";
import { Screen, Keypad, Dots, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";

// Enter-twice-to-confirm, matching the web version. Signs the session in
// and lands on Home only once both entries match.
export default function PasscodeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [digits, setDigits] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [mismatch, setMismatch] = useState(false);

  function onKey(k) {
    if (mismatch) { setMismatch(false); setDigits(""); return; }
    if (k === "back") return setDigits((d) => d.slice(0, -1));
    if (digits.length >= 6) return;
    const next = digits + k;
    setDigits(next);
    if (next.length !== 6) return;

    if (!confirm) {
      setTimeout(() => { setConfirm(next); setDigits(""); }, 250);
      return;
    }
    setTimeout(() => {
      if (next !== confirm) { setMismatch(true); return; }
      dispatch({ type: "onboarding/set", patch: { passcodeSet: true } });
      dispatch({ type: "settings/setAppLock", patch: { passcode: true } });
      dispatch({ type: "session/signIn", isNewUser: state.onboarding.isNewUser });
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    }, 250);
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "600" }}>
            {confirm ? "Confirm your passcode" : "Set your app passcode"}
          </Text>
          <Text style={{ color: mismatch ? colors.down : colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: "center", maxWidth: 260 }}>
            {mismatch ? "Those didn't match. Tap anywhere to try again." : confirm ? "Enter it once more to confirm." : "You'll use this to unlock Zenbit Pro and approve sensitive actions."}
          </Text>
        </View>
        <Dots count={6} filled={digits.length} tone={mismatch ? "danger" : "default"} />
        <Keypad onKey={onKey} />
      </View>
    </Screen>
  );
}
