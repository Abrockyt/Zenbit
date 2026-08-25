import { useState } from "react";
import { View, Text } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Screen, Header, Row, Switch, Sheet, Button, TextField, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

const PHRASE = "canyon drift ember lattice quarry vivid nomad thicket pearl summit orbit fable".split(" ");
const DEVICES = [
  { id: "d1", label: "This device", detail: "iOS · Bengaluru", current: true },
  { id: "d2", label: "iPhone 15 Pro", detail: "Last active 2d ago", current: false },
  { id: "d3", label: "MacBook Air", detail: "Last active 3w ago", current: false },
];

export default function SecurityScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const lock = state.settings.appLock;
  const [devices, setDevices] = useState(DEVICES);
  const [gate, setGate] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [gateError, setGateError] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const setLock = (patch, message) => { dispatch({ type: "settings/setAppLock", patch }); toast(message ?? "Changes saved."); };

  const openPhrase = () => {
    setRevealed(false); setPasscode(""); setGateError(false);
    if (!lock.requireOnSensitive) setRevealed(true);
    setGate(true);
  };

  const confirmGate = () => {
    if (passcode === "000000" || passcode.length === 6) { setRevealed(true); setGateError(false); }
    else setGateError(true);
  };

  const revoke = (id) => { setDevices((d) => d.filter((x) => x.id !== id)); toast("Device signed out."); };

  return (
    <Screen>
      <Header title="Security" onBack={() => navigation.goBack()} />

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>App lock</Text>
      <Row icon="shield" title="Face ID" subtitle={lock.faceId ? "Used to unlock and to confirm sends" : "Off — passcode only"} right={<Switch value={lock.faceId} onValueChange={(v) => setLock({ faceId: v }, v ? "Face ID on." : "Face ID off.")} />} />
      <Row icon="lock" title={lock.passcode ? "Change passcode" : "Set a passcode"} subtitle="Six digits. Backs up Face ID if biometrics fail." onPress={() => setLock({ passcode: true }, lock.passcode ? "Passcode updated." : "Passcode set.")} />
      <Row icon="alert-triangle" title="Confirm sensitive actions" subtitle="Re-check identity before showing the phrase or sending a large amount" right={<Switch value={lock.requireOnSensitive} onValueChange={(v) => setLock({ requireOnSensitive: v })} />} />

      <View style={{ height: spacing.md }} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Recovery</Text>
      <Row icon="eye" title="View recovery phrase" subtitle="Twelve words. Never shared with Zenbit." onPress={openPhrase} />

      <View style={{ height: spacing.md }} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Devices</Text>
      {devices.map((d) => (
        <Row key={d.id} icon="user" title={d.label} subtitle={d.detail} right={d.current ? <Text style={{ color: colors.up, fontSize: 12 }}>Active</Text> : <Text onPress={() => revoke(d.id)} style={{ color: colors.down, fontSize: 12 }}>Revoke</Text>} />
      ))}

      <Sheet open={gate} onClose={() => setGate(false)} title={revealed ? "Recovery phrase" : "Confirm it's you"}>
        {!revealed ? (
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md }}>Enter your passcode to show the recovery phrase.</Text>
            <TextField value={passcode} onChangeText={(v) => { setPasscode(v.replace(/\D/g, "").slice(0, 6)); setGateError(false); }} placeholder="••••••" keyboardType="number-pad" secureTextEntry />
            {gateError && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>That passcode isn't right. Six digits — try again.</Text>}
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button onPress={confirmGate}>Show phrase</Button>
              <Button variant="secondary" onPress={() => setGate(false)}>Cancel</Button>
            </View>
          </View>
        ) : (
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md }}>Twelve words, in this order. Zenbit does not store them.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
              {PHRASE.map((w, i) => (
                <View key={w} style={{ width: "33.33%", padding: 4 }}>
                  <View style={{ padding: 8, borderRadius: 6, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: "center" }}>
                    <Text style={{ color: colors.textTertiary, fontSize: 10 }}>{i + 1}</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{w}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button variant="secondary" onPress={async () => { await Clipboard.setStringAsync(PHRASE.join(" ")); toast("Phrase copied. Paste it somewhere offline, then clear your clipboard."); }}>Copy phrase</Button>
              <Button onPress={() => setGate(false)}>Done</Button>
            </View>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
