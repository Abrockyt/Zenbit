import { useState } from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, TextField, IconButton, Avatar, EmptyState, Banner, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { relativeTime } from "../../lib/time";

export default function PostDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [reply, setReply] = useState("");
  const post = state.social.posts.find((p) => p.id === id);

  const sendReply = useAsyncAction(async () => {
    dispatch({ type: "social/addReply", postId: id, reply: { id: `r${Date.now()}`, author: { handle: "you", name: state.session.user.name, initials: state.session.user.avatarInitials, avatarUrl: state.session.user.avatarUrl }, body: reply.trim(), createdAt: Date.now() } });
  }, { label: "Sending reply", queueWhenOffline: true });

  const submit = async () => {
    if (!reply.trim()) return;
    await sendReply.run();
    if (!sendReply.isError) { setReply(""); if (!sendReply.isQueued) toast("Reply sent."); }
  };

  if (!post) {
    return (
      <Screen>
        <Header title="Post" onBack={() => navigation.goBack()} />
        <EmptyState icon="inbox" title="Post not found" body="It may have been deleted by its author." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Post" onBack={() => navigation.goBack()} right={<IconButton icon="flag" size={16} onPress={() => { dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: post.author.handle, kind: "post", reason: "Reported from post", detail: "", at: Date.now(), status: "received" } }); toast("Reported. Thanks — we'll take a look."); }} />} />

      <View style={{ flexDirection: "row", gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
        <Avatar uri={post.author.avatarUrl} initials={post.author.initials} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>@{post.author.handle} · {relativeTime(post.createdAt)}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 14, marginTop: 3 }}>{post.body}</Text>
        </View>
      </View>

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: spacing.sm }}>
        {post.replies.length === 0 ? "No replies yet" : `${post.replies.length} ${post.replies.length === 1 ? "reply" : "replies"}`}
      </Text>

      {post.replies.map((r) => (
        <View key={r.id} style={{ flexDirection: "row", gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.sm }}>
          <Avatar uri={r.author.avatarUrl} initials={r.author.initials} size={30} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>@{r.author.handle} · {relativeTime(r.createdAt)}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, marginTop: 2 }}>{r.body}</Text>
          </View>
        </View>
      ))}

      {sendReply.isError && <Banner tone="danger">Reply failed to send. {sendReply.error?.message}</Banner>}
      {sendReply.isQueued && <Text style={{ color: colors.warn, fontSize: 12 }}>Offline — your reply is queued and sends on reconnect.</Text>}

      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <TextField value={reply} onChangeText={setReply} placeholder="Write a reply" />
        </View>
        <IconButton icon="send" onPress={submit} />
      </View>
    </Screen>
  );
}
