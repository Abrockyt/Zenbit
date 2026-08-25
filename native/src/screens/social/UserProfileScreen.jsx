import { View, Text } from "react-native";
import { Screen, Header, Button, Avatar, Row, EmptyState, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { DIRECTORY } from "../../data/directory";

export default function UserProfileScreen({ navigation, route }) {
  const { handle } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();

  const isMe = handle === "you";
  const person = isMe ? { name: state.session.user.name, initials: state.session.user.avatarInitials, avatarUrl: state.session.user.avatarUrl, bio: "This is you." } : DIRECTORY[handle] ?? { name: `@${handle}`, initials: handle.slice(0, 2).toUpperCase(), bio: "" };
  const following = state.social.following.includes(handle);
  const muted = state.social.muted.includes(handle);
  const blocked = state.social.blocked.includes(handle);
  const posts = state.social.posts.filter((p) => p.author.handle === handle);
  const canMessage = !isMe && (following || state.social.followers.includes(handle));

  const openThread = () => {
    const existing = state.chat.threads.find((t) => t.with.handle === handle);
    if (existing) return navigation.navigate("Conversation", { id: existing.id });
    const thread = { id: `th${Date.now()}`, with: { handle, name: person.name, initials: person.initials, avatarUrl: person.avatarUrl }, messages: [] };
    dispatch({ type: "chat/startThread", thread });
    navigation.navigate("Conversation", { id: thread.id });
  };

  return (
    <Screen>
      <Header title={isMe ? "Your profile" : `@${handle}`} onBack={() => navigation.goBack()} />

      <View style={{ gap: 14, padding: 20, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar uri={person.avatarUrl} initials={person.initials} size={56} />
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "600" }}>{person.name}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>@{handle}</Text>
          </View>
        </View>
        {person.bio ? <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{person.bio}</Text> : null}

        <View style={{ flexDirection: "row", gap: 24 }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{isMe ? state.social.followers.length : 1284}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Followers</Text>
          </View>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{isMe ? state.social.following.length : 312}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Following</Text>
          </View>
        </View>

        {!isMe && (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button style={{ flex: 1 }} variant={following ? "secondary" : "primary"} onPress={() => { dispatch({ type: "social/toggleFollow", handle }); toast(following ? `Unfollowed @${handle}.` : `Following @${handle}.`); }}>{following ? "Following" : "Follow"}</Button>
            <Button style={{ flex: 1 }} variant="secondary" onPress={canMessage ? openThread : () => toast("Only their followers can message them.")}>Message</Button>
          </View>
        )}
      </View>

      {(muted || blocked) && <Text style={{ color: colors.warn, fontSize: 12, marginBottom: spacing.md }}>You've {blocked ? "blocked" : "muted"} this account.</Text>}

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: spacing.sm }}>Posts</Text>
      {posts.length === 0 ? (
        <EmptyState icon="edit-3" title={isMe ? "You haven't posted" : "No posts"} body={isMe ? "Your posts will show up here." : `@${handle} hasn't posted anything yet.`} />
      ) : (
        posts.map((p) => <Text key={p.id} style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 8 }}>{p.body}</Text>)
      )}

      {!isMe && (
        <View style={{ marginTop: spacing.md }}>
          <Row icon="user" title={muted ? "Unmute this account" : "Mute this account"} onPress={() => { dispatch({ type: "social/toggleMute", handle }); toast(muted ? `Unmuted @${handle}.` : `Muted @${handle}.`); }} />
          <Row icon="slash" title={blocked ? "Unblock this account" : "Block this account"} danger={!blocked} onPress={() => { dispatch({ type: "social/toggleBlock", handle }); toast(blocked ? `Unblocked @${handle}.` : `Blocked @${handle}.`); }} />
          <Row icon="flag" title="Report this account" onPress={() => { dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: handle, kind: "user", reason: "Reported from profile", detail: "", at: Date.now(), status: "received" } }); toast("Reported."); }} />
        </View>
      )}
    </Screen>
  );
}
