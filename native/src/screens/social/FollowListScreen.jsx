import { View, Text, Pressable } from "react-native";
import { Screen, Header, Avatar, Button, EmptyState, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { DIRECTORY } from "../../data/directory";

export default function FollowListScreen({ navigation, route }) {
  const { handle, list } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const showingFollowers = list === "followers";
  const isMe = handle === "you";

  // Whose list this is actually matters — it used to always render *your*
  // followers/following regardless of which profile you opened it from, so
  // every account appeared to have the same connections. Your own lists are
  // live state; anyone else's come from the directory.
  const person = DIRECTORY[handle];
  const handles = isMe
    ? (showingFollowers ? state.social.followers : state.social.following)
    : showingFollowers
      // Who follows them, out of the accounts this demo actually knows about
      // (plus you, if you follow them) — rather than inventing names to pad
      // the list out to their headline follower count.
      ? [
          ...Object.values(DIRECTORY).filter((p) => p.following?.includes(handle)).map((p) => p.handle),
          ...(state.social.following.includes(handle) ? ["you"] : []),
        ]
      : (person?.following ?? []);

  const title = showingFollowers ? "Followers" : "Following";

  return (
    <Screen bg="black">
      <Header title={isMe ? title : `${title} · @${handle}`} onBack={() => navigation.goBack()} />
      {handles.length === 0 ? (
        <EmptyState icon="users" title={showingFollowers ? "No followers yet" : "Not following anyone"} body={showingFollowers ? "People who follow this account will appear here." : "Follow a few accounts and their posts show up in your feed."} />
      ) : (
        handles.map((h) => {
          const following = state.social.following.includes(h);
          const rowPerson = h === "you"
            ? { name: state.session.user.name, initials: state.session.user.avatarInitials, avatarUrl: state.session.user.avatarUrl }
            : DIRECTORY[h];
          return (
            <Pressable
              key={h}
              onPress={() => navigation.navigate("UserProfile", { handle: h })}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}
            >
              <Avatar uri={rowPerson?.avatarUrl} initials={rowPerson?.initials ?? h.slice(0, 2).toUpperCase()} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{rowPerson?.name ?? `@${h}`}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{h === "you" ? "You" : `@${h}`}</Text>
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
