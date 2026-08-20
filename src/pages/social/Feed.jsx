import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, StateBlock, Cta } from "../../components/screen/Screen";
import TabBar from "../../components/navigation/TabBar";
import PostCard from "../../components/social/PostCard";
import Icon from "../../components/core/Icon";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { dur, ease, listItem, listStagger, scrimTransition, tapScale } from "../../lib/motion";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "following", label: "Following" },
  { value: "trending", label: "Trending" },
  { value: "community", label: "Community" },
];

export default function Feed() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [firstLoad, setFirstLoad] = useState(true);
  const [sheetFor, setSheetFor] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);

  // Visible feed excludes muted and blocked authors, then applies the active
  // filter and search text — real search, not a decorative input.
  const hidden = new Set([...state.social.muted, ...state.social.blocked]);
  let posts = state.social.posts.filter((p) => !hidden.has(p.author.handle));
  if (filter === "following") posts = posts.filter((p) => state.social.following.includes(p.author.handle));
  if (filter === "trending") posts = [...posts].sort((a, b) => b.likes - a.likes);
  if (filter === "community") posts = posts.filter((p) => p.type === "community");
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    posts = posts.filter((p) => 
      p.body.toLowerCase().includes(q) || 
      p.author.handle.toLowerCase().includes(q) || 
      p.author.name.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  useEffect(() => {
    const t = setTimeout(() => setFirstLoad(false), 700);
    return () => clearTimeout(t);
  }, []);

  const refresh = useAsyncAction(async () => {
    // Nothing to fetch — the feed is local. This still exercises the loading and
    // error edges the flow diagram asks for.
    if (!navigator.onLine) throw new Error("You're offline.");
  }, { label: "Refreshing feed" });

  const unread = state.chat.threads.filter((t) => t.messages.at(-1)?.from === "them").length;

  return (
    <Screen
      title="Social"
      onBack={() => navigate("/home")}
      tabBar={<TabBar />}
      trailing={
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setSearchOpen((s) => !s)} aria-label="Search" aria-pressed={searchOpen} style={{ width: 40, height: 40, display: "grid", placeItems: "center", background: "none", border: "none" }}>
            <Icon name="search" size={18} color={searchOpen ? "#fff" : "var(--text-secondary)"} />
          </button>
          <button onClick={() => refresh.run()} aria-label="Refresh feed" style={{ width: 40, height: 40, display: "grid", placeItems: "center", background: "none", border: "none" }}>
            <motion.span animate={refresh.isLoading ? { rotate: 360 } : { rotate: 0 }} transition={refresh.isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: dur.base }} style={{ display: "grid", placeItems: "center" }}>
              <Icon name="refresh" size={18} color="var(--text-secondary)" />
            </motion.span>
          </button>
          <button onClick={() => navigate("/messages")} aria-label="Messages" style={{ position: "relative", width: 40, height: 40, display: "grid", placeItems: "center", background: "none", border: "none" }}>
            <Icon name="message" size={19} />
            {unread > 0 && <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 999, background: "var(--up-500)" }} />}
          </button>
        </div>
      }
    >
      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.standard }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--radius-pill)", background: "var(--surface-card)", border: "1px solid var(--border-default)" }}>
              <Icon name="search" size={16} color="var(--text-tertiary)" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts and people"
                aria-label="Search posts and people"
                style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "#fff", font: "400 14px/1 var(--font-core)" }}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search" style={{ background: "none", border: "none", display: "grid", placeItems: "center" }}>
                  <Icon name="x" size={15} color="var(--text-tertiary)" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            style={{
              flex: "0 0 auto", padding: "8px 16px", borderRadius: 999,
              background: filter === f.value ? "var(--surface-raised)" : "var(--surface-card)",
              border: `1px solid ${filter === f.value ? "var(--border-strong)" : "var(--border-subtle)"}`,
              color: filter === f.value ? "#fff" : "var(--text-tertiary)",
              font: `500 13px/1 var(--font-core)`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {refresh.isError && (
        <StateBlock kind="error" title="Couldn't refresh" body={`${refresh.error?.message} The posts below are the last ones we loaded.`} actionLabel="Retry" onAction={() => refresh.run()} secondaryLabel="Dismiss" onSecondary={() => refresh.reset()} />
      )}

      {firstLoad ? (
        <StateBlock kind="loading" />
      ) : posts.length === 0 ? (
        query.trim() ? (
          <StateBlock kind="empty" title="No matches" body={`Nothing in ${filter === "all" ? "the feed" : filter} matches "${query.trim()}".`} actionLabel="Clear search" onAction={() => setQuery("")} />
        ) : filter !== "all" ? (
          <StateBlock kind="empty" title={filter === "following" ? "Nobody you follow has posted" : "Nothing trending yet"} body="Try All to see the full feed." actionLabel="Show all posts" onAction={() => setFilter("all")} />
        ) : (
          <StateBlock
            kind="empty"
            title="No posts yet"
            body={state.social.posts.length > 0 ? "Everyone in your feed is muted or blocked. Manage that in Settings." : "Be the first to post. Say what you're watching, or what you got wrong."}
            actionLabel="Write a post"
            onAction={() => navigate("/social/compose")}
            secondaryLabel={state.social.posts.length > 0 ? "Muted & blocked" : undefined}
            onSecondary={state.social.posts.length > 0 ? () => navigate("/settings/blocked") : undefined}
          />
        )
      ) : (
        <motion.div variants={listStagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((p) => (
            <motion.div key={p.id} variants={listItem}>
              <PostCard
                post={p}
                onLike={() => dispatch({ type: "social/toggleLike", id: p.id })}
                onOpen={() => navigate(`/social/post/${p.id}`)}
                onOverflow={() => setSheetFor(p)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.button
        whileTap={tapScale}
        onClick={() => navigate("/social/compose")}
        aria-label="Write a post"
        style={{
          position: "fixed", right: 20, bottom: 108, width: 54, height: 54, borderRadius: 999,
          background: "#fff", border: "none", display: "grid", placeItems: "center",
          boxShadow: "var(--shadow-cta)", zIndex: 25,
        }}
      >
        <Icon name="plus" size={22} color="var(--ink-1)" />
      </motion.button>

      <AnimatePresence>
        {sheetFor && (
          <>
            <motion.button {...scrimTransition} onClick={() => setSheetFor(null)} aria-label="Dismiss" style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(6px)", border: "none", zIndex: 40 }} />
            <motion.div
              initial={{ y: 320 }}
              animate={{ y: 0 }}
              exit={{ y: 320 }}
              transition={{ duration: dur.slow, ease: ease.emphasis }}
              role="dialog"
              aria-label="Post options"
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
                padding: "24px 20px 34px", borderRadius: "32px 32px 0 0",
                background: "var(--surface-card-solid)", borderTop: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-tertiary)" }}>@{sheetFor.author.handle}</p>
              <Cta
                variant="secondary"
                onClick={() => {
                  dispatch({ type: "social/toggleMute", handle: sheetFor.author.handle });
                  toast(`Muted @${sheetFor.author.handle}. You still follow them.`);
                  setSheetFor(null);
                }}
              >
                Mute this account
              </Cta>
              <Cta
                variant="secondary"
                onClick={() => {
                  dispatch({ type: "social/toggleBlock", handle: sheetFor.author.handle });
                  toast(`Blocked @${sheetFor.author.handle}.`);
                  setSheetFor(null);
                }}
              >
                Block this account
              </Cta>
              <Cta
                variant="secondary"
                onClick={() => {
                  dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: sheetFor.author.handle, kind: "post", reason: "Reported from feed", detail: "", at: Date.now(), status: "received" } });
                  toast("Reported. Thanks — we'll take a look.");
                  setSheetFor(null);
                }}
              >
                Report post
              </Cta>
              <Cta onClick={() => setSheetFor(null)}>Cancel</Cta>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
