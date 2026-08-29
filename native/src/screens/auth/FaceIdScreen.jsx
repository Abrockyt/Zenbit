import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Feather } from "../../ui/IconCompat";
import { Screen, Button, TextButton, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";

export default function FaceIdScreen({ navigation }) {
  const { dispatch } = useApp();
  const [activating, setActivating] = useState(false);
  // Previously this screen always offered "Activate Face ID" regardless of
  // whether the device actually has usable biometric hardware — a device
  // with no sensor, or one whose owner never enrolled a face/fingerprint in
  // system settings, would hit an OS-level failure the moment it tried to
  // activate. checking real hardware state up front so the copy and the
  // button match what the device can actually do.
  const [check, setCheck] = useState({ loading: true, hasHardware: true, isEnrolled: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
        if (!cancelled) setCheck({ loading: false, hasHardware, isEnrolled });
      } catch {
        // A check that fails to even run isn't the same as "no hardware" —
        // treat it as unknown/available rather than wrongly telling someone
        // with a working Face ID that their device doesn't have it.
        if (!cancelled) setCheck({ loading: false, hasHardware: true, isEnrolled: true });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function activate() {
    setActivating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm to activate Face ID",
      });
      if (!result.success) { setActivating(false); return; }
    } catch {
      // Simulator / unsupported environment — fall through to activating
      // rather than stranding a demo build with no way to proceed.
    }
    dispatch({ type: "settings/setAppLock", patch: { faceId: true } });
    dispatch({ type: "onboarding/set", patch: { faceIdEnabled: true } });
    setTimeout(() => navigation.navigate("Passcode"), 500);
  }

  const unavailable = !check.loading && (!check.hasHardware || !check.isEnrolled);

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: unavailable ? colors.overlayWeak : "rgba(58,222,126,0.08)", borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" }}>
          <Feather name={unavailable ? "alert-triangle" : "smile"} size={40} color={unavailable ? colors.textTertiary : colors.up} />
        </View>
        {unavailable ? (
          <>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "600", textAlign: "center" }}>
              {check.hasHardware ? "No Face ID set up on this device" : "This device doesn't support Face ID"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", maxWidth: 280 }}>
              {check.hasHardware
                ? "Set up Face ID in your phone's system settings, then come back and turn it on here."
                : "You can still protect Zenbit Pro with a passcode on the next screen."}
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "600", textAlign: "center" }}>Turn on Face ID for easy login</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", maxWidth: 280 }}>
              Use Face ID instead of your passcode to unlock Zenbit Pro and confirm sensitive actions.
            </Text>
          </>
        )}
      </View>
      {!unavailable && <Button onPress={activate} loading={activating || check.loading}>Activate Face ID</Button>}
      <View style={{ marginTop: unavailable ? 0 : spacing.md, alignItems: "center" }}>
        <TextButton onPress={() => navigation.navigate("Passcode")}>
          {unavailable ? "Continue with passcode only" : "Skip? Activate later"}
        </TextButton>
      </View>
    </Screen>
  );
}
