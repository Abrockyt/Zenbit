import { View, Text } from "react-native";
import { Screen, Header, SegmentedControl, Switch, Row, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

export default function PrivacyScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const s = state.settings;
  const set = (patch, label) => { dispatch({ type: "settings/set", patch }); toast(label ?? "Changes saved."); };

  return (
    <Screen>
      <Header title="Privacy" onBack={() => navigation.goBack()} />

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Who can message you</Text>
      <SegmentedControl options={[{ value: "everyone", label: "Everyone" }, { value: "followers", label: "Followers" }, { value: "none", label: "No one" }]} value={s.whoCanMessage} onChange={(v) => set({ whoCanMessage: v })} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8, marginBottom: spacing.md }}>
        {s.whoCanMessage === "everyone" && "Anyone on Zenbit can start a conversation with you."}
        {s.whoCanMessage === "followers" && "Only people you follow back can start a conversation."}
        {s.whoCanMessage === "none" && "New conversations are turned off. Existing threads stay open."}
      </Text>

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Post visibility</Text>
      <SegmentedControl options={[{ value: "public", label: "Public" }, { value: "followers", label: "Followers only" }]} value={s.postVisibility} onChange={(v) => set({ postVisibility: v })} />

      <View style={{ height: spacing.lg }} />
      <Row icon="eye" title="Show portfolio on profile" subtitle={s.showPortfolio ? "Holdings and totals are visible to others" : "Your holdings stay private"} right={<Switch value={s.showPortfolio} onValueChange={(v) => set({ showPortfolio: v })} />} />
    </Screen>
  );
}
