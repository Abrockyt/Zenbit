import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, StateBlock, Cta } from "../../components/screen/Screen";
import PostCard, { Avatar } from "../../components/social/PostCard";
import Icon from "../../components/core/Icon";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { relativeTime } from "../../lib/time";
import { listItem, listStagger, tapScale } from "../../lib/motion";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [reply, setReply] = useState("");

  const post = state.social.posts.find((p) => p.id === id);

  const sendReply = useAsyncAction(
    async () => {
      dispatch({
        type: "social/addReply",
        postId: id,
        reply: {
          id: `r${Date.now()}`,
          author: { handle: "you", name: state.session.user.name, initials: state.session.user.avatarInitials },
          body: reply.trim(),
          createdAt: Date.now(),
        },
      });
    },
    { label: "Sending reply", queueWhenOffline: true }
  );

  const submit = async () => {
    if (!reply.trim()) return;
    await sendReply.run();
    if (!sendReply.isError) {
      setReply("");
      if (!sendReply.isQueued) toast("Reply sent.");
    }
  };

  if (!post) {
    return (
      <Screen title="Post">
        <StateBlock kind="empty" title="Post not found" body="It may have been deleted by its author." actionLabel="Back to feed" onAction={() => navigate("/social")} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Post"
      trailing={
        <button
          onClick={() => {
            dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: post.author.handle, kind: "post", reason: "Reported from post", detail: "", at: Date.now(), status: "received" } });
            toast("Reported. Thanks — we'll take a look.");
          }}
          aria-label="Report this post"
          style={{ width: 40, height: 40, display: "grid", placeItems: "center", background: "none", border: "none" }}
        >
          <Icon name="alert" size={18} color="var(--text-tertiary)" />
        </button>
      }
    >
      <PostCard post={post} onLike={() => dispatch({ type: "social/toggleLike", id: post.id })} compact />

      <p className="zb-label" style={{ margin: 0, color: "var(--text-tertiary)" }}>
        {post.replies.length === 0 ? "No replies yet" : `${post.replies.length} ${post.replies.length === 1 ? "reply" : "replies"}`}
      </p>

      {post.replies.length > 0 && (
        <motion.div variants={listStagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {post.replies.map((r) => (
            <motion.div key={r.id} variants={listItem} style={{ display: "flex", gap: 10, padding: 14, borderRadius: "var(--radius-md)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
              <Avatar initials={r.author.initials} size={30} />
              <div style={{ minWidth: 0 }}>
                <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
                  @{r.author.handle} · {relativeTime(r.createdAt)}
                </p>
                <p className="zb-body-sm" style={{ margin: "2px 0 0", color: "#fff" }}>{r.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {sendReply.isError && (
        <StateBlock kind="error" title="Reply failed to send" body={`${sendReply.error?.message} Your text is still here — try again.`} actionLabel="Retry" onAction={submit} secondaryLabel="Dismiss" onSecondary={() => sendReply.reset()} />
      )}
      {sendReply.isQueued && (
        <p className="zb-caption" style={{ margin: 0, color: "var(--warn-500)" }}>Offline — your reply is queued and sends on reconnect.</p>
      )}

      <div style={{ marginTop: "auto", display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply"
          rows={1}
          aria-label="Reply text"
          style={{
            flex: 1, resize: "none", padding: "13px 16px", borderRadius: "var(--radius-xl)",
            background: "var(--surface-card)", border: "1px solid var(--border-default)",
            color: "#fff", font: "400 14px/1.4 var(--font-core)", maxHeight: 96,
          }}
        />
        <motion.button
          whileTap={tapScale}
          onClick={submit}
          disabled={!reply.trim() || sendReply.isLoading}
          aria-label="Send reply"
          style={{
            width: 46, height: 46, borderRadius: 999, flex: "0 0 auto", border: "none",
            background: reply.trim() ? "#fff" : "var(--surface-raised)",
            display: "grid", placeItems: "center",
          }}
        >
          <Icon name="send" size={18} color={reply.trim() ? "var(--ink-1)" : "var(--text-disabled)"} />
        </motion.button>
      </div>
    </Screen>
  );
}
