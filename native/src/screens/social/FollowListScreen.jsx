import { View, Text, Pressable } from "react-native";
import { Screen, Header, Avatar, Button, EmptyState, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { DIRECTORY } from "../../data/directory";

export default function FollowListScreen({ navigation, route }) {
  const { handle, list } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const showingFollowers = list === "followers";
  const handles = showingFollowers ? state.social.followers : state.social.following;

  return (
    <Screen>
      <Header title={showingFollowers ? "Followers" : "Following"} onBack={() => navigation.goBack()} />
      {handles.length === 0 ? (
        <EmptyState icon="users" title={showingFollowers ? "No followers yet" : "Not following anyone"} body={showingFollowers ? "People who follow this account will appear here." : "Follow a few accounts and their posts show up in your feed."} />
      ) : (
        handles.map((h) => {
          const following = state.social.following.includes(h);
          const person = DIRECTORY[h];
          return (
            <Pressable
              key={h}
              onPress={() => navigation.navigate("UserProfile", { handle: h })}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}
            >
              <Avatar uri={person?.avatarUrl} initials={person?.initials ?? h.slice(0, 2).toUpperCase()} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{person?.name ?? `@${h}`}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>@{h}</Text>
              </View>
              {h !== "you" && (
                <Button variant={following ? "secondary" : "primary"} onPress={() => { dispatch({ type: "social/toggleFollow", handle: h }); toast(following ? `Unfollowed @${h}.` : `Following @${h}.`); }}>{following ? "Following" : "Follow"}</Button>
              )}
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
