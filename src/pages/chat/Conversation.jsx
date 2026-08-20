import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, StateBlock } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import { Avatar } from "../../components/social/PostCard";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { relativeTime } from "../../lib/time";
import { dur, ease, tapScale } from "../../lib/motion";

export default function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const thread = state.chat.threads.find((t) => t.id === id);
  const queuedHere = state.chat.queued.filter((q) => q.threadId === id);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread?.messages.length, queuedHere.length]);

  // Reconnecting flushes anything queued while offline — sent once, never twice.
  useEffect(() => {
    if (!state.network.online || state.chat.queued.length === 0) return;
    state.chat.queued.forEach((q) => {
      dispatch({ type: "chat/send", threadId: q.threadId, message: { id: `m${Date.now()}${Math.random().toString(16).slice(2, 5)}`, from: "me", body: q.body, at: Date.now() } });
    });
    dispatch({ type: "chat/flushQueue" });
    toast("Back online — queued messages sent.");
  }, [state.network.online, state.chat.queued, dispatch, toast]);

  const send = useAsyncAction(
    async ({ body }) => {
      if (body.trim() === "fail") throw new Error("The message didn't reach them.");
      dispatch({ type: "chat/send", threadId: id, message: { id: `m${Date.now()}`, from: "me", body: body.trim(), at: Date.now() } });
    },
    { label: "Sending message" }
  );

  const submit = async () => {
    const body = text.trim();
    if (!body) return;

    if (!state.network.online) {
      dispatch({ type: "chat/queue", item: { threadId: id, body, at: Date.now() } });
      setText("");
      return;
    }
    await send.run({ body });
    if (!send.isError) setText("");
  };

  if (!thread) {
    return (
      <Screen title="Messages">
        <StateBlock kind="empty" title="Conversation not found" body="It may have been deleted." actionLabel="All messages" onAction={() => navigate("/messages")} />
      </Screen>
    );
  }

  return (
    <Screen
      title={thread.with.name}
      subtitle={`@${thread.with.handle}`}
      onBack={() => navigate("/messages")}
      trailing={
        <button onClick={() => navigate(`/social/u/${thread.with.handle}`)} aria-label="View profile" style={{ background: "none", border: "none", padding: 0 }}>
          <Avatar initials={thread.with.initials} size={36} />
        </button>
      }
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-end", minHeight: 0 }}>
        {thread.messages.length === 0 && queuedHere.length === 0 && (
          <StateBlock kind="empty" title="No messages yet" body={`Say something to ${thread.with.name.split(" ")[0]}.`} />
        )}

        {thread.messages.map((m) => {
          const mine = m.from === "me";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.base, ease: ease.standard }}
              style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}
            >
              <div
                style={{
                  padding: "11px 15px",
                  borderRadius: mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                  background: mine ? "#fff" : "var(--surface-card)",
                  border: mine ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                <span className="zb-body-sm" style={{ color: mine ? "var(--ink-1)" : "#fff" }}>{m.body}</span>
              </div>
              <span className="zb-caption" style={{ display: "block", marginTop: 3, textAlign: mine ? "right" : "left", color: "var(--text-tertiary)" }}>
                {relativeTime(m.at)}
              </span>
            </motion.div>
          );
        })}

        {queuedHere.map((q, i) => (
          <div key={`q${i}`} style={{ alignSelf: "flex-end", maxWidth: "78%", opacity: 0.55 }}>
            <div style={{ padding: "11px 15px", borderRadius: "20px 20px 6px 20px", background: "var(--surface-raised)", border: "1px dashed var(--border-strong)" }}>
              <span className="zb-body-sm" style={{ color: "#fff" }}>{q.body}</span>
            </div>
            <span className="zb-caption" style={{ display: "block", marginTop: 3, textAlign: "right", color: "var(--warn-500)" }}>
              Queued — sends when you reconnect
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {send.isError && (
        <StateBlock kind="error" title="Message failed to send" body={`${send.error?.message} Retry — it stays queued until it goes through.`} actionLabel="Retry" onAction={() => submit()} secondaryLabel="Dismiss" onSecondary={() => send.reset()} />
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message"
          rows={1}
          aria-label="Message text"
          style={{
            flex: 1, resize: "none", padding: "13px 16px", borderRadius: "var(--radius-xl)",
            background: "var(--surface-card)", border: "1px solid var(--border-default)",
            color: "#fff", font: "400 14px/1.4 var(--font-core)", maxHeight: 96,
          }}
        />
        <motion.button
          whileTap={tapScale}
          onClick={submit}
          disabled={!text.trim() || send.isLoading}
          aria-label="Send message"
          style={{
            width: 46, height: 46, borderRadius: 999, flex: "0 0 auto", border: "none",
            background: text.trim() ? "#fff" : "var(--surface-raised)",
            display: "grid", placeItems: "center",
          }}
        >
          <Icon name="send" size={18} color={text.trim() ? "var(--ink-1)" : "var(--text-disabled)"} />
        </motion.button>
      </div>
    </Screen>
  );
}
