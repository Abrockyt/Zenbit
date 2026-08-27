import { useState } from "react";
import { View, Text } from "react-native";
import { Screen, Header, Button, TextField, Chip, Banner, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";

const LIMIT = 280;
const TAGS = ["trades", "analysis", "meme", "news", "alpha"];

// Deterministic "fail" draft text preserved from the web version so the
// error + save-as-draft recovery path is reachable on demand.
export default function ComposeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const draft = state.social.draft;
  const left = LIMIT - draft.length;
  const [selectedTags, setSelectedTags] = useState([]);

  const publish = useAsyncAction(async () => {
    if (draft.trim() === "fail") throw new Error("The server rejected that post.");
    dispatch({ type: "social/addPost", post: { body: draft.trim(), tags: selectedTags, image: null, trade: null, type: "post" } });
  }, { label: "Publishing post", queueWhenOffline: true });

  const send = async () => {
    await publish.run();
    if (!publish.isError && !publish.isQueued) { toast("Post published."); navigation.navigate("MainTabs", { screen: "Feed" }); }
  };

  const toggleTag = (t) => setSelectedTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <Screen
      bg="black"
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Button disabled={!draft.trim() || left < 0} loading={publish.isLoading} onPress={send}>Post</Button>
        </View>
      }
    >
      <Header title="New post" onBack={() => navigation.goBack()} right={<Text style={{ color: draft.trim() && left >= 0 ? colors.up : colors.textDisabled, fontWeight: "600" }} onPress={send}>Post</Text>} />

      <TextField value={draft} onChangeText={(v) => dispatch({ type: "social/setDraft", draft: v })} placeholder="What are you watching?" multiline />
      <Text style={{ color: left < 0 ? colors.down : left < 40 ? colors.warn : colors.textTertiary, fontSize: 12, textAlign: "right", marginTop: 4, marginBottom: spacing.md }}>{left}</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {TAGS.map((t) => <Chip key={t} label={`#${t}`} active={selectedTags.includes(t)} onPress={() => toggleTag(t)} />)}
      </View>

      {publish.isError && <View style={{ marginTop: spacing.md }}><Banner tone="danger">Post failed to send. {publish.error?.message} Your draft is saved — retry, or come back to it later.</Banner></View>}
      {publish.isQueued && <View style={{ marginTop: spacing.md }}><Banner tone="warn">You're offline. This post is queued and publishes once you reconnect.</Banner></View>}

    </Screen>
  );
}
