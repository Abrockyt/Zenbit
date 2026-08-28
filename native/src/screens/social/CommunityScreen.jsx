import { View, Text, Image, Pressable, FlatList } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, EmptyState, Button, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { COMMUNITY_BY_ID } from "../../data/communities";
import { useMarkets } from "../../data/useCoinGecko";
import { useCurrency } from "../../lib/useCurrency";
import PostCard, { compactCount } from "./PostCard";

export default function CommunityScreen({ navigation, route }) {
  const { id } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const { money } = useCurrency();
  const community = COMMUNITY_BY_ID[id];

  // A community tied to a coin shows that coin's live price in the header —
  // the market context is the reason the group exists.
  const { data: markets } = useMarkets(community?.coin ? [community.coin] : null);
  const coin = community?.coin ? markets?.find((m) => m.id === community.coin) : null;

  if (!community) {
    return (
      <Screen bg="black">
        <Header title="Community" onBack={() => navigation.goBack()} />
        <EmptyState icon="users" title="Community not found" body="This group may have been removed." />
      </Screen>
    );
  }

  const joined = state.social.communities.includes(id);
  const hidden = new Set([...state.social.muted, ...state.social.blocked]);
  const posts = state.social.posts
    .filter((p) => p.community === id && !hidden.has(p.author.handle))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);

  const postById = (pid) => state.social.posts.find((p) => p.id === pid);
  const up = (coin?.price_change_percentage_24h ?? 0) >= 0;

  return (
    <Screen scroll={false} bg="black">
      <Header title={community.name} onBack={() => navigation.goBack()} />

      <FlatList
        style={{ flex: 1 }}
        data={posts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <Image source={{ uri: community.banner }} style={{ width: "100%", height: 110, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised }} />

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.md }}>
              {community.icon ? (
                <Image source={{ uri: community.icon }} style={{ width: 34, height: 34, borderRadius: 17 }} />
              ) : (
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="users" size={15} color={colors.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontFamily: fonts.semibold }}>{community.name}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                  {compactCount(community.members)} members · {compactCount(community.online)} online
                </Text>
              </View>
              <Pressable
                onPress={() => { dispatch({ type: "social/toggleCommunity", id }); toast(joined ? `Left ${community.name}.` : `Joined ${community.name}.`); }}
                style={{
                  paddingVertical: 8, paddingHorizontal: 17, borderRadius: 999,
                  backgroundColor: joined ? "transparent" : colors.textPrimary,
                  borderWidth: joined ? 1 : 0, borderColor: colors.borderStrong,
                }}
              >
                <Text style={{ color: joined ? colors.textPrimary : colors.ink0, fontSize: 13, fontFamily: fonts.semibold }}>
                  {joined ? "Joined" : "Join"}
                </Text>
              </Pressable>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 10 }}>{community.about}</Text>

            {coin && (
              <Pressable
                onPress={() => navigation.navigate("CoinDetail", { id: community.coin })}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginTop: spacing.md }}
              >
                {coin.image && <Image source={{ uri: coin.image }} style={{ width: 26, height: 26, borderRadius: 13 }} />}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontFamily: fonts.medium }}>{coin.name}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>{coin.symbol.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13.5, fontFamily: fonts.mono }}>{money(coin.current_price ?? 0)}</Text>
                  <Text style={{ color: up ? colors.up : colors.down, fontSize: 11.5, fontFamily: fonts.mono }}>
                    {up ? "+" : ""}{(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                  </Text>
                </View>
              </Pressable>
            )}

            <View style={{ marginTop: spacing.lg }}>
              <Button onPress={() => navigation.navigate("Compose", { community: id })}>Post to {community.name}</Button>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="message-square" title="No posts yet" body={`Be the first to post in ${community.name}.`} />
        }
        ListFooterComponent={<View style={{ height: 90 }} />}
        renderItem={({ item: p }) => (
          <PostCard
            post={p}
            quoted={p.quoteOf ? postById(p.quoteOf) : null}
            onLike={() => dispatch({ type: "social/toggleLike", id: p.id })}
            onRepost={() => dispatch({ type: "social/toggleRepost", id: p.id })}
            onBookmark={() => dispatch({ type: "social/toggleBookmark", id: p.id })}
            onOpen={() => navigation.navigate("PostDetail", { id: p.id })}
            onAuthor={() => navigation.navigate("UserProfile", { handle: p.author.handle })}
            onQuote={() => navigation.navigate("PostDetail", { id: p.quoteOf })}
            onCommunity={() => {}}
          />
        )}
      />
    </Screen>
  );
}
