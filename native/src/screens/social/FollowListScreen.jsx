import { Screen, Header, Row, Button, EmptyState, colors } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

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
          return (
            <Row
              key={h}
              icon="user"
              title={`@${h}`}
              onPress={() => navigation.navigate("UserProfile", { handle: h })}
              right={h === "you" ? undefined : (
                <Button variant={following ? "secondary" : "primary"} onPress={() => { dispatch({ type: "social/toggleFollow", handle: h }); toast(following ? `Unfollowed @${h}.` : `Following @${h}.`); }}>{following ? "Following" : "Follow"}</Button>
              )}
            />
          );
        })
      )}
    </Screen>
  );
}
