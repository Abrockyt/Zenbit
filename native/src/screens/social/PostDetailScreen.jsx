import { useEffect, useRef, useState } from "react";
import { Animated, View, Text, Pressable, FlatList } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Screen, Header, TextField, IconButton, Avatar, EmptyState, Banner, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { relativeTime } from "../../lib/time";
import PostCard, { compactCount } from "./PostCard";

// Compact like control for a reply row — same filled-pop pattern PostCard
// uses for the main post's action bar, scaled down.
function ReplyLike({ liked, count, onPress }) {
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!liked) return;
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 240, useNativeDriver: true }),
    ]).start();
  }, [liked]);
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={14} color={liked ? colors.down : colors.textTertiary} />
      </Animated.View>
      {count > 0 && <Text style={{ color: liked ? colors.down : colors.textTertiary, fontSize: 11.5 }}>{compactCount(count)}</Text>}
    </Pressable>
  );
}

function ReplyRow({ reply, onLike, onAuthor, onReply }) {
  return (
    <View style={{ flexDirection: "row", gap: 11, paddingVertical: 12 }}>
      <Pressable onPress={onAuthor}>
        <Avatar uri={reply.author.avatarUrl} initials={reply.author.initials} size={34} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <Pressable onPress={onAuthor}>
            <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontFamily: fonts.semibold }}>{reply.author.name}</Text>
          </Pressable>
          <Text style={{ color: colors.textTertiary, fontSize: 12.5 }}>@{reply.author.handle} · {relativeTime(reply.createdAt)}</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 19.5, marginTop: 2 }}>{reply.body}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 22, marginTop: 8 }}>
          <Pressable onPress={onReply} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textTertiary} />
          </Pressable>
          <ReplyLike liked={!!reply.liked} count={reply.likes ?? 0} onPress={onLike} />
        </View>
      </View>
    </View>
  );
}

export default function PostDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [reply, setReply] = useState("");
  const [replyTarget, setReplyTarget] = useState(null); // handle being replied to, or null for the root post
  const post = state.social.posts.find((p) => p.id === id);
  const quoted = post?.quoteOf ? state.social.posts.find((p) => p.id === post.quoteOf) : null;

  const sendReply = useAsyncAction(async () => {
    dispatch({
      type: "social/addReply",
      postId: id,
      reply: {
        id: `r${Date.now()}`,
        author: { handle: "you", name: state.session.user.name, initials: state.session.user.avatarInitials, avatarUrl: state.session.user.avatarUrl },
        body: reply.trim(),
        createdAt: Date.now(),
        likes: 0,
        liked: false,
      },
    });
  }, { label: "Sending reply", queueWhenOffline: true });

  const submit = async () => {
    if (!reply.trim()) return;
    await sendReply.run();
    if (!sendReply.isError) { setReply(""); setReplyTarget(null); if (!sendReply.isQueued) toast("Reply sent."); }
  };

  if (!post) {
    return (
      <Screen bg="black">
        <Header title="Post" onBack={() => navigation.goBack()} />
        <EmptyState icon="inbox" title="Post not found" body="It may have been deleted by its author." />
      </Screen>
    );
  }

  const replyingToLabel = replyTarget ? `@${replyTarget}` : `@${post.author.handle}`;

  return (
    <Screen
      scroll={false}
      bg="black"
      footer={
        <View>
          {/* "Replying to @x" — the composer only ever said "Write a
              reply" with no indication of what it was attached to, unlike
              a real reply UI where the target is always visible. */}
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: 6 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
              Replying to <Text style={{ color: colors.info }}>{replyingToLabel}</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
            <Avatar uri={state.session.user.avatarUrl} initials={state.session.user.avatarInitials} size={30} />
            <View style={{ flex: 1 }}>
              <TextField value={reply} onChangeText={setReply} placeholder="Post your reply" multiline />
            </View>
            <IconButton icon="send" onPress={submit} />
          </View>
        </View>
      }
    >
      <Header
        title="Post"
        onBack={() => navigation.goBack()}
        right={
          <IconButton
            icon="flag"
            size={16}
            onPress={() => {
              dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: post.author.handle, kind: "post", reason: "Reported from post", detail: "", at: Date.now(), status: "received" } });
              toast("Reported. Thanks — we'll take a look.");
            }}
          />
        }
      />

      <FlatList
        data={post.replies}
        keyExtractor={(r) => r.id}
        style={{ flex: 1 }}
        ListHeaderComponent={
          <View>
            <PostCard
              post={post}
              quoted={quoted}
              onLike={() => dispatch({ type: "social/toggleLike", id: post.id })}
              onRepost={() => dispatch({ type: "social/toggleRepost", id: post.id })}
              onBookmark={() => dispatch({ type: "social/toggleBookmark", id: post.id })}
              onOpen={() => {}}
              onOverflow={() => {}}
              onAuthor={() => navigation.navigate("UserProfile", { handle: post.author.handle })}
              onQuote={() => post.quoteOf && navigation.navigate("PostDetail", { id: post.quoteOf })}
              onTag={() => {}}
              onCommunity={() => post.community && navigation.navigate("Community", { id: post.community })}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
              <Text style={{ color: colors.textTertiary, fontSize: 12.5 }}>
                {post.replies.length === 0 ? "No replies yet" : `${post.replies.length} ${post.replies.length === 1 ? "reply" : "replies"}`}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="bar-chart-2" size={12} color={colors.textTertiary} />
                <Text style={{ color: colors.textTertiary, fontSize: 12.5 }}>{compactCount(post.views)} views</Text>
              </View>
            </View>

            {sendReply.isError && <View style={{ marginTop: spacing.sm }}><Banner tone="danger">Reply failed to send. {sendReply.error?.message}</Banner></View>}
            {sendReply.isQueued && <Text style={{ color: colors.warn, fontSize: 12, marginTop: spacing.sm }}>Offline — your reply is queued and sends on reconnect.</Text>}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.borderSubtle }} />}
        ListFooterComponent={<View style={{ height: spacing.xl }} />}
        renderItem={({ item: r }) => (
          <ReplyRow
            reply={r}
            onLike={() => dispatch({ type: "social/toggleReplyLike", postId: post.id, replyId: r.id })}
            onAuthor={() => (r.author.handle !== "you" ? navigation.navigate("UserProfile", { handle: r.author.handle }) : navigation.navigate("UserProfile", { handle: "you" }))}
            onReply={() => setReplyTarget(r.author.handle)}
          />
        )}
      />
    </Screen>
  );
}
