import { useState } from "react";
import { Text } from "react-native";
import { Screen, Header, SegmentedControl, Row, EmptyState, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

export default function BlockedAccountsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("muted");
  const list = tab === "muted" ? state.social.muted : state.social.blocked;

  const undo = (handle) => {
    dispatch({ type: tab === "muted" ? "social/toggleMute" : "social/toggleBlock", handle });
    toast(tab === "muted" ? `Unmuted @${handle}.` : `Unblocked @${handle}.`);
  };

  return (
    <Screen>
      <Header title="Muted & blocked" onBack={() => navigation.goBack()} />
      <SegmentedControl options={[{ value: "muted", label: `Muted (${state.social.muted.length})` }, { value: "blocked", label: `Blocked (${state.social.blocked.length})` }]} value={tab} onChange={setTab} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8, marginBottom: spacing.md }}>
        {tab === "muted" ? "Muted accounts stay followed — you just stop seeing their posts in the feed." : "Blocked accounts can't message you, see your posts, or appear in your feed."}
      </Text>

      {list.length === 0 ? (
        <EmptyState icon="user-x" title={tab === "muted" ? "Nobody muted" : "Nobody blocked"} body={`You haven't ${tab === "muted" ? "muted" : "blocked"} anyone.`} />
      ) : (
        list.map((handle) => (
          <Row key={handle} icon="user" title={`@${handle}`} right={<Text onPress={() => undo(handle)} style={{ color: colors.textPrimary, fontSize: 12 }}>{tab === "muted" ? "Unmute" : "Unblock"}</Text>} />
        ))
      )}
    </Screen>
  );
}
