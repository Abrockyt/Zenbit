import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Image, ScrollView } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, TabBar, IconButton, TextField, Avatar, Sheet, Button, Banner, EmptyState, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { DIRECTORY, DIRECTORY_LIST } from "../../data/directory";
import { COMMUNITIES, COMMUNITY_BY_ID } from "../../data/communities";
import { useMarkets } from "../../data/useCoinGecko";
import { useCurrency } from "../../lib/useCurrency";
import PostCard, { compactCount } from "./PostCard";

// Feed tabs, X-style: For you (everything), Following (accounts you follow),
// Trending (engagement-ranked) and Bookmarks (saved). Previously three
// filter chips where "Trending" only re-sorted the same list by like count.
const TABS = [
  { value: "foryou", label: "For you" },
  { value: "following", label: "Following" },
  { value: "trending", label: "Trending" },
  { value: "bookmarks", label: "Saved" },
];

// Coins pinned to your social profile — the "stock pinning" idea: what
// you're actually holding a view on, shown with live prices so it's real
// market data rather than a static badge.
function PinnedCoinRail({ ids, markets, money, onPress }) {
  if (!ids.length) return null;
  const coins = ids.map((id) => markets?.find((m) => m.id === id)).filter(Boolean);
  if (!coins.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
      {coins.map((c) => {
        const up = (c.price_change_percentage_24h ?? 0) >= 0;
        return (
          <Pressable
            key={c.id}
            onPress={() => onPress(c.id)}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginRight: 8 }}
          >
            {c.image && <Image source={{ uri: c.image }} style={{ width: 18, height: 18, borderRadius: 9 }} />}
            <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontFamily: fonts.medium }}>{c.symbol.toUpperCase()}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: fonts.mono }}>{money(c.current_price ?? 0)}</Text>
            <Text style={{ color: up ? colors.up : colors.down, fontSize: 11.5, fontFamily: fonts.mono }}>
              {up ? "+" : ""}{(c.price_change_percentage_24h ?? 0).toFixed(1)}%
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function FeedScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const { money } = useCurrency();
  const [sheetFor, setSheetFor] = useState(null);
  const [tab, setTab] = useState("foryou");
  const [tag, setTag] = useState(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const { data: markets } = useMarkets(state.social.pinnedCoins?.length ? state.social.pinnedCoins : null);

  const hidden = useMemo(
    () => new Set([...state.social.muted, ...state.social.blocked]),
    [state.social.muted, state.social.blocked]
  );

  const posts = useMemo(() => {
    let list = state.social.posts.filter((p) => !hidden.has(p.author.handle));
    if (tab === "following") list = list.filter((p) => state.social.following.includes(p.author.handle));
    if (tab === "bookmarks") list = list.filter((p) => p.bookmarked);
    if (tab === "trending") {
      // Rank by total engagement rather than raw likes — a post with 40
      // likes and 200 reposts is more "trending" than one with 60 likes.
      list = [...list].sort(
        (a, b) => (b.likes + b.reposts * 2 + b.replies.length * 3) - (a.likes + a.reposts * 2 + a.replies.length * 3)
      );
    } else {
      // Pinned first, then newest — matches how X orders a timeline.
      list = [...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);
    }
    if (tag) list = list.filter((p) => p.tags?.includes(tag));
    return list;
  }, [state.social.posts, state.social.following, hidden, tab, tag]);

  const trendingTags = useMemo(() => {
    const totals = new Map();
    state.social.posts.forEach((p) => {
      if (hidden.has(p.author.handle)) return;
      p.tags?.forEach((t) => totals.set(t, (totals.get(t) ?? 0) + p.likes + p.reposts + p.replies.length));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [state.social.posts, hidden]);

  // Accounts you don't follow yet, ranked by reach — a real "who to follow"
  // rail rather than a fixed list.
  const suggestions = useMemo(
    () => DIRECTORY_LIST
      .filter((p) => !state.social.following.includes(p.handle) && !hidden.has(p.handle))
      .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
      .slice(0, 6),
    [state.social.following, hidden]
  );

  const myCommunities = state.social.communities.map((id) => COMMUNITY_BY_ID[id]).filter(Boolean);

  const refresh = useAsyncAction(async () => {}, { label: "Refreshing feed" });

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { people: [], tags: [] };
    return {
      people: DIRECTORY_LIST.filter((p) => p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q)),
      tags: trendingTags.filter(([t]) => t.includes(q.replace("#", ""))).map(([t]) => t),
    };
  }, [query, trendingTags]);

  const postById = (id) => state.social.posts.find((p) => p.id === id);

  const header = (
    <View>
      <PinnedCoinRail
        ids={state.social.pinnedCoins ?? []}
        markets={markets}
        money={money}
        onPress={(id) => navigation.navigate("CoinDetail", { id })}
      />

      {/* Communities you're in, plus a way into the full directory. */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
        <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>Your communities</Text>
        <Pressable onPress={() => navigation.navigate("Communities")} hitSlop={8}>
          <Text style={{ color: colors.up, fontSize: 12.5, fontFamily: fonts.medium }}>Discover</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {myCommunities.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate("Community", { id: c.id })}
            style={{ width: 150, marginRight: spacing.sm, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.borderSubtle }}
          >
            <Image source={{ uri: c.banner }} style={{ width: "100%", height: 58, backgroundColor: colors.surfaceRaised }} />
            <View style={{ padding: 9, backgroundColor: colors.surfaceCard }}>
              <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontFamily: fonts.medium }} numberOfLines={1}>{c.name}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 10.5, marginTop: 2 }}>{compactCount(c.members)} members</Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={() => navigation.navigate("Communities")}
          style={{ width: 110, marginRight: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Feather name="plus" size={17} color={colors.textTertiary} />
          <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>Join more</Text>
        </Pressable>
      </ScrollView>

      {trendingTags.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold, marginBottom: 8 }}>Trending</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trendingTags.map(([t, score]) => {
              const active = tag === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTag(active ? null : t)}
                  style={{
                    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, marginRight: 7,
                    backgroundColor: active ? colors.info + "22" : colors.surfaceCard,
                    borderWidth: 1, borderColor: active ? colors.info : colors.borderSubtle,
                  }}
                >
                  <Text style={{ color: active ? colors.info : colors.textSecondary, fontSize: 12.5 }}>#{t}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 10 }}>{compactCount(score)} engagements</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {tag && (
        <Pressable onPress={() => setTag(null)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
          <Feather name="x" size={13} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Clear #{tag} filter</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Screen scroll={false} bg="black">
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Social</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <IconButton icon="search" onPress={() => setSearching(true)} />
          <IconButton icon="refresh-cw" onPress={() => refresh.run()} />
          <IconButton icon="message-circle" onPress={() => navigation.navigate("Threads")} />
          <IconButton icon="plus" onPress={() => navigation.navigate("Compose")} />
        </View>
      </View>

      {/* Underline tabs rather than pill chips — reads as a timeline
          switcher instead of a set of filters. */}
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, marginBottom: spacing.md }}>
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <Pressable key={t.value} onPress={() => setTab(t.value)} style={{ flex: 1, alignItems: "center", paddingVertical: 11 }}>
              <Text style={{ color: active ? colors.textPrimary : colors.textTertiary, fontSize: 13.5, fontFamily: active ? fonts.semibold : fonts.regular }}>
                {t.label}
              </Text>
              {active && <View style={{ position: "absolute", bottom: -1, height: 2.5, width: 34, borderRadius: 2, backgroundColor: colors.up }} />}
            </Pressable>
          );
        })}
      </View>

      {/* warn, not danger — the timeline below is still fully readable, so
          a failed refresh is an inconvenience, not a broken screen. */}
      {refresh.isError && <Banner tone="warn">Couldn't refresh just now — you're seeing the last loaded posts. Pull the refresh icon to try again.</Banner>}

      <FlatList
        style={{ flex: 1 }}
        data={posts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={tab === "foryou" ? header : tag ? (
          <Pressable onPress={() => setTag(null)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
            <Feather name="x" size={13} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Clear #{tag} filter</Text>
          </Pressable>
        ) : null}
        ListEmptyComponent={
          <EmptyState
            icon={tab === "bookmarks" ? "bookmark" : "users"}
            title={tag ? `Nothing tagged #${tag}` : tab === "bookmarks" ? "Nothing saved yet" : tab === "following" ? "Quiet in here" : "No posts"}
            body={
              tag ? "Try another topic, or clear the filter."
                : tab === "bookmarks" ? "Tap the bookmark icon on any post to save it for later."
                : tab === "following" ? "Nobody you follow has posted. Try the For you tab."
                : "The feed is empty."
            }
          />
        }
        ListFooterComponent={
          tab === "foryou" && suggestions.length ? (
            <View style={{ marginTop: spacing.md, marginBottom: 90 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold, marginBottom: spacing.sm }}>Who to follow</Text>
              {suggestions.map((p) => (
                <View key={p.handle} style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10 }}>
                  <Pressable onPress={() => navigation.navigate("UserProfile", { handle: p.handle })}>
                    <Avatar uri={p.avatarUrl} initials={p.initials} size={40} />
                  </Pressable>
                  <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate("UserProfile", { handle: p.handle })}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontFamily: fonts.medium }}>{p.name}</Text>
                      {p.verified && <Feather name="check-circle" size={12} color={colors.info} />}
                    </View>
                    <Text style={{ color: colors.textTertiary, fontSize: 11.5 }} numberOfLines={1}>
                      @{p.handle} · {compactCount(p.followers)} followers
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { dispatch({ type: "social/toggleFollow", handle: p.handle }); toast(`Following @${p.handle}.`); }}
                    style={{ paddingVertical: 7, paddingHorizontal: 15, borderRadius: 999, backgroundColor: colors.textPrimary }}
                  >
                    <Text style={{ color: colors.ink0, fontSize: 12.5, fontFamily: fonts.semibold }}>Follow</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : <View style={{ height: 90 }} />
        }
        renderItem={({ item: p }) => (
          <PostCard
            post={p}
            quoted={p.quoteOf ? postById(p.quoteOf) : null}
            onLike={() => dispatch({ type: "social/toggleLike", id: p.id })}
            onRepost={() => { dispatch({ type: "social/toggleRepost", id: p.id }); toast(p.reposted ? "Repost removed." : "Reposted."); }}
            onBookmark={() => { dispatch({ type: "social/toggleBookmark", id: p.id }); toast(p.bookmarked ? "Removed from saved." : "Saved."); }}
            onOpen={() => navigation.navigate("PostDetail", { id: p.id })}
            onOverflow={() => setSheetFor(p)}
            onAuthor={() => navigation.navigate("UserProfile", { handle: p.author.handle })}
            onQuote={() => navigation.navigate("PostDetail", { id: p.quoteOf })}
            onTag={(t) => setTag(t)}
            onCommunity={() => navigation.navigate("Community", { id: p.community })}
          />
        )}
      />

      <Sheet open={searching} onClose={() => { setSearching(false); setQuery(""); }} title="Search">
        <TextField value={query} onChangeText={setQuery} placeholder="People, #topics" icon="search" autoFocus />
        <View style={{ height: spacing.md }} />
        {query.trim() && !searchResults.people.length && !searchResults.tags.length ? (
          <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", paddingVertical: 12 }}>Nothing matches "{query}".</Text>
        ) : (
          <>
            {searchResults.tags.map((t) => (
              <Pressable
                key={t}
                onPress={() => { setSearching(false); setQuery(""); setTag(t); setTab("foryou"); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="hash" size={16} color={colors.info} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>#{t}</Text>
              </Pressable>
            ))}
            {searchResults.people.map((p) => (
              <Pressable
                key={p.handle}
                onPress={() => { setSearching(false); setQuery(""); navigation.navigate("UserProfile", { handle: p.handle }); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
              >
                <Avatar uri={p.avatarUrl} initials={p.initials} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{p.name}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>@{p.handle} · {compactCount(p.followers)} followers</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </Sheet>

      <Sheet open={!!sheetFor} onClose={() => setSheetFor(null)} title={sheetFor ? `@${sheetFor.author.handle}` : ""}>
        <View style={{ gap: spacing.sm }}>
          <Button variant="secondary" onPress={() => { dispatch({ type: "social/togglePin", id: sheetFor.id }); toast(sheetFor.pinned ? "Unpinned." : "Pinned to the top of your feed."); setSheetFor(null); }}>
            {sheetFor?.pinned ? "Unpin this post" : "Pin this post"}
          </Button>
          <Button variant="secondary" onPress={() => { dispatch({ type: "social/toggleMute", handle: sheetFor.author.handle }); toast(`Muted @${sheetFor.author.handle}.`); setSheetFor(null); }}>Mute this account</Button>
          <Button variant="secondary" onPress={() => { dispatch({ type: "social/toggleBlock", handle: sheetFor.author.handle }); toast(`Blocked @${sheetFor.author.handle}.`); setSheetFor(null); }}>Block this account</Button>
          <Button variant="secondary" onPress={() => { dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: sheetFor.author.handle, kind: "post", reason: "Reported from feed", detail: "", at: Date.now(), status: "received" } }); toast("Reported. Thanks — we'll take a look."); setSheetFor(null); }}>Report post</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
