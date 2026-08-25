import { useState } from "react";
import { View, Text, FlatList, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, TabBar, IconButton, Chip, Avatar, Sheet, Button, Banner, EmptyState, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { relativeTime } from "../../lib/time";

const FILTERS = [{ value: "all", label: "All" }, { value: "following", label: "Following" }, { value: "trending", label: "Trending" }];

// Real photos, not fabricated: pravatar.cc for author headshots and Unsplash
// for attached post images, both already present in the seed data
// (state/store.jsx) but never wired up to actually render until now.
function PostRow({ post, onLike, onOpen, onOverflow }) {
  return (
    <Pressable onPress={onOpen} style={{ gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Avatar uri={post.author.avatarUrl} initials={post.author.initials} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>@{post.author.handle} · {relativeTime(post.createdAt)}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 14, marginTop: 3 }}>{post.body}</Text>
        </View>
        <Pressable onPress={onOverflow} hitSlop={8}><Feather name="more-horizontal" size={16} color={colors.textTertiary} /></Pressable>
      </View>
      {post.image ? <Image source={{ uri: post.image }} style={{ width: "100%", height: 180, borderRadius: radius.md, marginTop: 2 }} /> : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Pressable onPress={onLike} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="heart" size={14} color={post.liked ? colors.down : colors.textTertiary} />
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{post.likes}</Text>
        </Pressable>
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{post.replies.length} replies</Text>
      </View>
    </Pressable>
  );
}

export default function FeedScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [sheetFor, setSheetFor] = useState(null);
  const [filter, setFilter] = useState("all");

  const hidden = new Set([...state.social.muted, ...state.social.blocked]);
  let posts = state.social.posts.filter((p) => !hidden.has(p.author.handle));
  if (filter === "following") posts = posts.filter((p) => state.social.following.includes(p.author.handle));
  if (filter === "trending") posts = [...posts].sort((a, b) => b.likes - a.likes);

  const refresh = useAsyncAction(async () => {}, { label: "Refreshing feed" });

  return (
    <Screen scroll={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Social</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <IconButton icon="refresh-cw" onPress={() => refresh.run()} />
          <IconButton icon="message-circle" onPress={() => navigation.navigate("Threads")} />
          <IconButton icon="plus" onPress={() => navigation.navigate("Compose")} />
        </View>
      </View>

      <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
        {FILTERS.map((f) => <Chip key={f.value} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />)}
      </View>

      {refresh.isError && <Banner tone="danger">Couldn't refresh. {refresh.error?.message}</Banner>}

      {posts.length === 0 ? (
        <EmptyState icon="users" title="No posts" body="Nobody you follow has posted, or the feed is empty." />
      ) : (
        <FlatList style={{ flex: 1 }} data={posts} keyExtractor={(p) => p.id} renderItem={({ item: p }) => (
          <PostRow post={p} onLike={() => dispatch({ type: "social/toggleLike", id: p.id })} onOpen={() => navigation.navigate("PostDetail", { id: p.id })} onOverflow={() => setSheetFor(p)} />
        )} />
      )}

      <Sheet open={!!sheetFor} onClose={() => setSheetFor(null)} title={sheetFor ? `@${sheetFor.author.handle}` : ""}>
        <View style={{ gap: spacing.sm }}>
          <Button variant="secondary" onPress={() => { dispatch({ type: "social/toggleMute", handle: sheetFor.author.handle }); toast(`Muted @${sheetFor.author.handle}.`); setSheetFor(null); }}>Mute this account</Button>
          <Button variant="secondary" onPress={() => { dispatch({ type: "social/toggleBlock", handle: sheetFor.author.handle }); toast(`Blocked @${sheetFor.author.handle}.`); setSheetFor(null); }}>Block this account</Button>
          <Button variant="secondary" onPress={() => { dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: sheetFor.author.handle, kind: "post", reason: "Reported from feed", detail: "", at: Date.now(), status: "received" } }); toast("Reported. Thanks — we'll take a look."); setSheetFor(null); }}>Report post</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
