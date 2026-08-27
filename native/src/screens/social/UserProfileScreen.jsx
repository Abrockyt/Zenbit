import { View, Text, Pressable } from "react-native";
import { Screen, Header, Button, Avatar, Row, EmptyState, colors, spacing, radius, fonts } from "../../ui/kit";
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
  // Used to require a follow relationship in either direction before the
  // button worked at all, which meant it silently refused to do anything
  // for most profiles in the seed data — reading as a dead button rather
  // than a deliberate restriction with no explanation on screen. Anyone can
  // start a conversation; per-account message permissions are a real
  // feature (Settings → Who can message you) that isn't modelled per-seed-
  // account here, so gating on it for a handful of directory entries did
  // more harm (looked broken) than good (enforced a rule nothing explains).
  const canMessage = !isMe;

  // Your own counts come from live state (they change when you follow
  // someone); everyone else's come from the directory. The +1 reflects you
  // following them right now, so the number moves when you tap Follow
  // rather than sitting frozen while the button says "Following".
  const followerCount = isMe
    ? state.social.followers.length
    : (DIRECTORY[handle]?.followers ?? 0) + (following ? 1 : 0);
  const followingCount = isMe
    ? state.social.following.length
    : (DIRECTORY[handle]?.following?.length ?? 0);

  const openThread = () => {
    const existing = state.chat.threads.find((t) => t.with.handle === handle);
    if (existing) return navigation.navigate("Conversation", { id: existing.id });
    const thread = { id: `th${Date.now()}`, with: { handle, name: person.name, initials: person.initials, avatarUrl: person.avatarUrl }, messages: [] };
    dispatch({ type: "chat/startThread", thread });
    navigation.navigate("Conversation", { id: thread.id });
  };

  return (
    <Screen bg="black">
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

        {/* Both blocks were bare Views with no onPress, and for anyone who
            isn't you the counts were the hardcoded literals 1284 / 312 — so
            every profile showed the same two numbers and tapping them did
            nothing. Now real per-account figures, and each opens the list
            it describes (FollowListScreen, which was built but orphaned). */}
        <View style={{ flexDirection: "row", gap: 24 }}>
          <Pressable onPress={() => navigation.navigate("FollowList", { handle, list: "followers" })} hitSlop={6}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>{followerCount.toLocaleString()}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Followers</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("FollowList", { handle, list: "following" })} hitSlop={6}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>{followingCount.toLocaleString()}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Following</Text>
          </Pressable>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>{posts.length}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Posts</Text>
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
