import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Screen, Header, Button, SegmentedControl, Banner, colors, spacing, radius } from "../../ui/kit";
import { useApp } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";

// Tiny wordlist stand-in for real BIP-39 validation — enough to make the
// per-word error state honest without shipping the full 2048-word list.
const KNOWN = new Set(
  "canyon drift ember lattice quarry vivid nomad thicket pearl summit orbit fable anchor bridge cinder harbor ivory jungle kernel meadow".split(" ")
);

export default function RestoreWalletScreen({ navigation }) {
  const { dispatch } = useApp();
  const [count, setCount] = useState(12);
  const [words, setWords] = useState(Array(24).fill(""));
  const [checked, setChecked] = useState(false);

  const active = words.slice(0, count);
  const filled = active.filter((w) => w.trim()).length;
  const badIndexes = checked ? active.map((w, i) => (w.trim() && !KNOWN.has(w.trim().toLowerCase()) ? i : -1)).filter((i) => i >= 0) : [];

  const setWord = (i, value) => {
    const next = [...words];
    next[i] = value.replace(/[^a-zA-Z]/g, "").toLowerCase();
    setWords(next);
    setChecked(false);
    restore.reset();
  };

  const restore = useAsyncAction(async () => {
    setChecked(true);
    if (filled < count) throw new Error(`Only ${filled} of ${count} words entered.`);
    const bad = active.filter((w) => !KNOWN.has(w.trim().toLowerCase()));
    if (bad.length) throw new Error(`${bad.length} word${bad.length > 1 ? "s aren't" : " isn't"} in the recovery wordlist.`);
    dispatch({ type: "session/signIn" });
    dispatch({ type: "onboarding/set", patch: { phraseBackedUp: true, termsAccepted: true, emailVerified: true } });
  }, { label: "Rebuilding wallet", minDuration: 1100 });

  const go = async () => {
    await restore.run();
    if (!restore.isError) navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Button onPress={go} loading={restore.isLoading} disabled={filled === 0}>Restore wallet</Button>
        </View>
      }
    >
      <Header title="Restore wallet" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md }}>
        Enter your recovery phrase in order. Zenbit never stores your phrase.
      </Text>

      <SegmentedControl options={[{ value: 12, label: "12 words" }, { value: 24, label: "24 words" }]} value={count} onChange={setCount} />

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: spacing.md, marginHorizontal: -4 }}>
        {Array.from({ length: count }).map((_, i) => {
          const bad = badIndexes.includes(i);
          return (
            <View key={i} style={{ width: "50%", padding: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: bad ? colors.down : colors.borderSubtle }}>
                <Text style={{ color: colors.textTertiary, fontSize: 11, width: 16 }}>{i + 1}</Text>
                <TextInput
                  value={words[i]}
                  onChangeText={(v) => setWord(i, v)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1, color: colors.textPrimary, fontSize: 13, paddingVertical: 10 }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {restore.isError && (
        <View style={{ marginTop: spacing.md }}>
          <Banner tone="danger">
            {filled < count ? "Phrase incomplete. " : "Invalid recovery phrase. "}
            {restore.error?.message}
          </Banner>
        </View>
      )}

      <View style={{ marginTop: spacing.md }}>
        <Banner>Zenbit never stores your recovery phrase and can't recover it for you.</Banner>
      </View>

    </Screen>
  );
}
