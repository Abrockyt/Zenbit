import { useEffect, useRef } from "react";
import { Animated, View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Feather } from "../../ui/IconCompat";
import { colors, spacing, radius, fonts } from "../../ui/kit";
import { Avatar } from "../../ui/kit";
import { relativeTime } from "../../lib/time";
import { COMMUNITY_BY_ID } from "../../data/communities";

// Shared post renderer for the feed, post detail, profiles and community
// pages, so a post looks and behaves identically everywhere it appears —
// previously the feed and the coin Square tab drew posts differently and
// disagreed about which fields even existed.

export function compactCount(n) {
  if (n == null) return "";
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return String(n);
}

export function TradeBadge({ trade, compact }) {
  const isLong = trade.direction?.toLowerCase() === "long";
  const tint = isLong ? colors.up : colors.down;
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start",
        paddingVertical: compact ? 4 : 6, paddingHorizontal: compact ? 8 : 10, borderRadius: 8,
        backgroundColor: isLong ? colors.upDim : colors.downDim,
        borderWidth: 1, borderColor: tint + "44",
      }}
    >
      <Feather name={isLong ? "trending-up" : "trending-down"} size={compact ? 11 : 13} color={tint} />
      <Text style={{ color: tint, fontSize: compact ? 11 : 12, fontFamily: fonts.semibold }}>
        {trade.direction?.toUpperCase()} {trade.coin?.toUpperCase()}
      </Text>
      <View style={{ width: 1, height: 11, backgroundColor: tint + "44" }} />
      <Text style={{ color: colors.textSecondary, fontSize: compact ? 10.5 : 11.5, fontFamily: fonts.mono }}>@ ${trade.price}</Text>
    </View>
  );
}

// Filled + pop on activation, outline otherwise — a colour-only change
// doesn't read as "this is on now".
function EngageButton({ icon, activeIcon, family = "feather", active, count, activeColor, onPress }) {
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!active) return;
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.4, duration: 130, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 240, useNativeDriver: true }),
    ]).start();
  }, [active]);

  const tint = active ? activeColor : colors.textTertiary;
  const Icon = family === "ion" ? Ionicons : Feather;

  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", gap: 5, minWidth: 44 }}>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Icon name={active ? activeIcon : icon} size={15} color={tint} />
      </Animated.View>
      {count != null && count > 0 && <Text style={{ color: tint, fontSize: 12 }}>{compactCount(count)}</Text>}
    </Pressable>
  );
}

// The post being quoted, rendered inline as a nested card — the whole point
// of a quote is that you can read what's being quoted without leaving.
function QuotedPost({ post, onPress }) {
  if (!post) return null;
  return (
    <Pressable
      onPress={onPress}
      style={{ padding: 11, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderDefault, gap: 6 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <Avatar uri={post.author.avatarUrl} initials={post.author.initials} size={20} />
        <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontFamily: fonts.medium }}>{post.author.name}</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>@{post.author.handle} · {relativeTime(post.createdAt)}</Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }} numberOfLines={4}>{post.body}</Text>
    </Pressable>
  );
}

export default function PostCard({
  post,
  quoted,
  onLike, onRepost, onBookmark, onOpen, onOverflow, onAuthor, onQuote, onTag, onCommunity,
}) {
  const community = post.community ? COMMUNITY_BY_ID[post.community] : null;

  return (
    <Pressable
      onPress={onOpen}
      style={{ gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.sm }}
    >
      {post.pinned && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name="bookmark" size={11} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 11, fontFamily: fonts.medium }}>Pinned</Text>
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Pressable onPress={onAuthor} hitSlop={6}>
          <Avatar uri={post.author.avatarUrl} initials={post.author.initials} size={38} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Pressable onPress={onAuthor} hitSlop={4} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.semibold }}>{post.author.name}</Text>
            {post.author.verified && <Feather name="check-circle" size={12.5} color={colors.info} />}
          </Pressable>
          <Text style={{ color: colors.textTertiary, fontSize: 11.5, marginTop: 1 }}>
            @{post.author.handle} · {relativeTime(post.createdAt)}
          </Text>
        </View>
        <Pressable onPress={onOverflow} hitSlop={8}>
          <Feather name="more-horizontal" size={17} color={colors.textTertiary} />
        </Pressable>
      </View>

      {community && (
        <Pressable onPress={onCommunity} hitSlop={4} style={{ flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" }}>
          <Feather name="users" size={11} color={colors.textTertiary} />
          <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>{community.name}</Text>
        </Pressable>
      )}

      {post.trade ? <TradeBadge trade={post.trade} /> : null}

      <Text style={{ color: colors.textPrimary, fontSize: 14.5, lineHeight: 21 }}>{post.body}</Text>

      {post.image ? (
        <Image source={{ uri: post.image }} style={{ width: "100%", height: 190, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }} />
      ) : null}

      {post.quoteOf ? <QuotedPost post={quoted} onPress={onQuote} /> : null}

      {post.tags?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {post.tags.map((t) => (
            <Pressable key={t} onPress={() => onTag?.(t)} hitSlop={4}>
              <Text style={{ color: colors.info, fontSize: 12 }}>#{t}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 10, marginTop: 2 }}>
        <EngageButton icon="chatbubble-outline" activeIcon="chatbubble" family="ion" count={post.replies.length} activeColor={colors.info} onPress={onOpen} />
        <EngageButton icon="repeat" activeIcon="repeat" active={post.reposted} count={post.reposts} activeColor={colors.up} onPress={onRepost} />
        <EngageButton icon="heart-outline" activeIcon="heart" family="ion" active={post.liked} count={post.likes} activeColor={colors.down} onPress={onLike} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Feather name="bar-chart-2" size={14} color={colors.textTertiary} />
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{compactCount(post.views)}</Text>
        </View>
        <EngageButton icon="bookmark" activeIcon="bookmark" active={post.bookmarked} activeColor={colors.accent} onPress={onBookmark} />
      </View>
    </Pressable>
  );
}
