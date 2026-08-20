import { useNavigate, useParams } from "react-router-dom";
import { Screen, StateBlock, Row } from "../../components/screen/Screen";
import { useApp, useToast } from "../../state/store";

export default function FollowList() {
  const { handle, list } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();

  const showingFollowers = list === "followers";
  const handles = showingFollowers ? state.social.followers : state.social.following;
  const title = showingFollowers ? "Followers" : "Following";

  return (
    <Screen title={title} subtitle={`@${handle}`}>
      {handles.length === 0 ? (
        <StateBlock
          kind="empty"
          title={showingFollowers ? "No followers yet" : "Not following anyone"}
          body={showingFollowers ? "People who follow this account will appear here." : "Follow a few accounts and their posts show up in your feed."}
          actionLabel="Browse the feed"
          onAction={() => navigate("/social")}
        />
      ) : (
        handles.map((h) => {
          const following = state.social.following.includes(h);
          return (
            <Row
              key={h}
              icon="user"
              label={`@${h}`}
              onClick={() => navigate(`/social/u/${h}`)}
              trailing={
                h === "you" ? undefined : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "social/toggleFollow", handle: h });
                      toast(following ? `Unfollowed @${h}.` : `Following @${h}.`);
                    }}
                    style={{
                      padding: "8px 14px", borderRadius: 999,
                      background: following ? "var(--surface-raised)" : "#fff",
                      border: following ? "1px solid var(--border-default)" : "none",
                      color: following ? "#fff" : "var(--ink-1)",
                      font: "500 13px/1 var(--font-core)",
                    }}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                )
              }
            />
          );
        })
      )}
    </Screen>
  );
}
