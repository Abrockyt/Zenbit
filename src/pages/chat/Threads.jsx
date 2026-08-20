import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, StateBlock } from "../../components/screen/Screen";
import { Avatar } from "../../components/social/PostCard";
import { useApp } from "../../state/store";
import { relativeTime } from "../../lib/time";
import { listItem, listStagger, tapScale } from "../../lib/motion";

export default function Threads() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const threads = state.chat.threads
    .filter((t) => !state.social.blocked.includes(t.with.handle))
    .slice()
    .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));

  return (
    <Screen title="Messages" onBack={() => navigate("/social")}>
      {state.chat.queued.length > 0 && (
        <p className="zb-caption" style={{ margin: 0, color: "var(--warn-500)" }}>
          {state.chat.queued.length} message{state.chat.queued.length > 1 ? "s" : ""} waiting to send.
        </p>
      )}

      {loading ? (
        <StateBlock kind="loading" />
      ) : threads.length === 0 ? (
        <StateBlock
          kind="empty"
          title="No conversations yet"
          body="Message someone from their profile to start a thread."
          actionLabel="Browse the feed"
          onAction={() => navigate("/social")}
        />
      ) : (
        <motion.div variants={listStagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {threads.map((t) => {
            const last = t.messages.at(-1);
            const theirTurn = last?.from === "them";
            return (
              <motion.button
                key={t.id}
                variants={listItem}
                whileTap={tapScale}
                onClick={() => navigate(`/messages/${t.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%",
                  padding: 14, borderRadius: "var(--radius-md)",
                  background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
                }}
              >
                <Avatar initials={t.with.initials} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span className="zb-body" style={{ color: "#fff" }}>{t.with.name}</span>
                    {last && <span className="zb-caption" style={{ color: "var(--text-tertiary)", flex: "0 0 auto" }}>{relativeTime(last.at)}</span>}
                  </span>
                  <span
                    className="zb-body-sm"
                    style={{
                      display: "block", marginTop: 2,
                      color: theirTurn ? "var(--text-primary)" : "var(--text-tertiary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {last ? `${last.from === "me" ? "You: " : ""}${last.body}` : "No messages yet"}
                  </span>
                </span>
                {theirTurn && <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--up-500)", flex: "0 0 auto" }} />}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </Screen>
  );
}
