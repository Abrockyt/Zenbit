import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, StateBlock, Cta, Row } from "../../components/screen/Screen";
import PostCard, { Avatar } from "../../components/social/PostCard";
import { useApp, useToast } from "../../state/store";
import { tapScale } from "../../lib/motion";

const DIRECTORY = {
  "mara.eth": { name: "Mara Osei", initials: "MO", bio: "Position sizing over prediction. Ex-market maker." },
  "0xquiet": { name: "Ines Duarte", initials: "ID", bio: "Funding rates and quiet charts." },
  "leo.base": { name: "Leo Marchetti", initials: "LM", bio: "Self-custody maximalist. Test your backups." },
  toby: { name: "Toby Vance", initials: "TV", bio: "Learning in public." },
};

export default function UserProfile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();

  const isMe = handle === "you";
  const person = isMe
    ? { name: state.session.user.name, initials: state.session.user.avatarInitials, bio: "This is you." }
    : DIRECTORY[handle] ?? { name: `@${handle}`, initials: handle.slice(0, 2).toUpperCase(), bio: "" };

  const following = state.social.following.includes(handle);
  const blocked = state.social.blocked.includes(handle);
  const muted = state.social.muted.includes(handle);
  const posts = state.social.posts.filter((p) => p.author.handle === handle);

  // The viewer's own privacy setting governs whether a portfolio strip appears
  // on their profile; other people's stay private in this demo.
  const showPortfolio = isMe && state.settings.showPortfolio;

  // Whether messaging is open depends on the recipient's rule. For demo people we
  // assume the default from the flow diagram: followers only.
  const canMessage = isMe ? false : following || state.social.followers.includes(handle);

  const openThread = () => {
    const existing = state.chat.threads.find((t) => t.with.handle === handle);
    if (existing) return navigate(`/messages/${existing.id}`);
    const thread = { id: `th${Date.now()}`, with: { handle, name: person.name, initials: person.initials }, messages: [] };
    dispatch({ type: "chat/startThread", thread });
    navigate(`/messages/${thread.id}`);
  };

  return (
    <Screen title={isMe ? "Your profile" : `@${handle}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 20, borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar initials={person.initials} size={56} />
          <div style={{ minWidth: 0 }}>
            <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>{person.name}</p>
            <p className="zb-caption" style={{ margin: "2px 0 0", color: "var(--text-tertiary)" }}>@{handle}</p>
          </div>
        </div>

        {person.bio && <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>{person.bio}</p>}

        <div style={{ display: "flex", gap: 20 }}>
          <motion.button whileTap={tapScale} onClick={() => navigate(`/social/u/${handle}/followers`)} style={{ background: "none", border: "none", padding: 0, textAlign: "left" }}>
            <span className="zb-body zb-tabular" style={{ color: "#fff" }}>{isMe ? state.social.followers.length : 1284}</span>
            <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)" }}>Followers</span>
          </motion.button>
          <motion.button whileTap={tapScale} onClick={() => navigate(`/social/u/${handle}/following`)} style={{ background: "none", border: "none", padding: 0, textAlign: "left" }}>
            <span className="zb-body zb-tabular" style={{ color: "#fff" }}>{isMe ? state.social.following.length : 312}</span>
            <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)" }}>Following</span>
          </motion.button>
        </div>

        {!isMe && (
          <div style={{ display: "flex", gap: 8 }}>
            <Cta
              full={false}
              variant={following ? "secondary" : "primary"}
              onClick={() => {
                dispatch({ type: "social/toggleFollow", handle });
                toast(following ? `Unfollowed @${handle}.` : `Following @${handle}.`);
              }}
            >
              {following ? "Following" : "Follow"}
            </Cta>
            <Cta full={false} variant="secondary" onClick={canMessage ? openThread : () => toast("Only their followers can message them.")}>
              Message
            </Cta>
          </div>
        )}
      </div>

      {showPortfolio && (
        <Row icon="wallet" label="Portfolio visible on your profile" hint="Turn this off in Privacy settings" onClick={() => navigate("/settings/privacy")} />
      )}

      {(muted || blocked) && (
        <p className="zb-caption" style={{ margin: 0, color: "var(--warn-500)" }}>
          You've {blocked ? "blocked" : "muted"} this account. Manage that in Settings → Muted & blocked.
        </p>
      )}

      <p className="zb-label" style={{ margin: 0, color: "var(--text-tertiary)" }}>Posts</p>

      {posts.length === 0 ? (
        <StateBlock
          kind="empty"
          title={isMe ? "You haven't posted" : "No posts"}
          body={isMe ? "Your posts will show up here." : `@${handle} hasn't posted anything yet.`}
          actionLabel={isMe ? "Write a post" : undefined}
          onAction={isMe ? () => navigate("/social/compose") : undefined}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onLike={() => dispatch({ type: "social/toggleLike", id: p.id })} onOpen={() => navigate(`/social/post/${p.id}`)} compact />
          ))}
        </div>
      )}

      {!isMe && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <Row
            icon="user"
            label={muted ? "Unmute this account" : "Mute this account"}
            onClick={() => {
              dispatch({ type: "social/toggleMute", handle });
              toast(muted ? `Unmuted @${handle}.` : `Muted @${handle}.`);
            }}
          />
          <Row
            icon="x"
            label={blocked ? "Unblock this account" : "Block this account"}
            danger={!blocked}
            onClick={() => {
              dispatch({ type: "social/toggleBlock", handle });
              toast(blocked ? `Unblocked @${handle}.` : `Blocked @${handle}.`);
            }}
          />
          <Row
            icon="alert"
            label="Report this account"
            onClick={() => {
              dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: handle, kind: "user", reason: "Reported from profile", detail: "", at: Date.now(), status: "received" } });
              toast("Reported. Thanks — we'll take a look.");
            }}
          />
        </div>
      )}
    </Screen>
  );
}
