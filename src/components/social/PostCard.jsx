import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "../core/Icon";
import Avatar from "../core/Avatar";
import { relativeTime } from "../../lib/time";
import { tapScale } from "../../lib/motion";

export { default as Avatar } from "../core/Avatar";

// Handles the reference crypto apps treat as notable voices — gets the
// verified badge next to their name, the way Binance Square marks KOLs.
const VERIFIED = new Set(["mara.eth", "leo.base"]);

// $BTC / $eth style tickers get pulled out and rendered as tappable pills,
// same pattern as Binance Square / Twitter cashtags — turns a wall of text
// into something that reads as a market app, not a generic forum.
function extractTickers(body) {
  const matches = body.match(/\$[A-Za-z]{2,6}\b/g);
  return matches ? [...new Set(matches.map((m) => m.slice(1).toUpperCase()))] : [];
}

// Deterministic view count so it's stable across renders without a backend —
// scaled off engagement so it stays plausible relative to likes/replies.
function viewsFor(post) {
  let h = 0;
  for (const c of post.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const base = (post.likes + post.replies.length * 3) * 11 + (h % 40);
  return base;
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

export default function PostCard({ post, onLike, onOpen, onOverflow, compact }) {
  const navigate = useNavigate();
  const tickers = extractTickers(post.body);
  const verified = VERIFIED.has(post.author.handle);

  return (
    <div
      style={{
        padding: 16, borderRadius: "var(--radius-lg)",
        background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
        display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <motion.button
          whileTap={tapScale}
          onClick={() => navigate(`/social/u/${post.author.handle}`)}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", flex: 1, minWidth: 0, textAlign: "left" }}
        >
          <Avatar src={post.author.avatarUrl} initials={post.author.initials} seed={post.author.handle} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="zb-body" style={{ color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.author.name}</span>
              {verified && (
                <span title="Notable voice" style={{ width: 14, height: 14, borderRadius: 999, background: "var(--up-500)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                  <Icon name="check" size={9} color="var(--ink-1)" strokeWidth={3} />
                </span>
              )}
              {post.type === "community" && (
                <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Community</span>
              )}
            </span>
            <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)" }}>@{post.author.handle} · {relativeTime(post.createdAt)}</span>
          </span>
        </motion.button>
        {onOverflow && (
          <button onClick={onOverflow} aria-label="More options" style={{ width: 36, height: 36, display: "grid", placeItems: "center", background: "none", border: "none" }}>
            <Icon name="more-horizontal" size={18} color="var(--text-tertiary)" />
          </button>
        )}
      </div>

      <button
        onClick={onOpen}
        disabled={!onOpen}
        style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: onOpen ? "pointer" : "default" }}
      >
        <p className="zb-body" style={{ margin: 0, color: "var(--text-primary)", opacity: 0.92, whiteSpace: "pre-wrap" }}>{post.body}</p>
        
        {post.image && (
          <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
            <img src={post.image} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }} />
          </div>
        )}

        {post.trade && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: post.trade.direction === "Long" ? "rgba(58,222,126,0.15)" : "rgba(242,80,75,0.15)", display: "grid", placeItems: "center", color: post.trade.direction === "Long" ? "var(--up-500)" : "var(--down-500)" }}>
              <Icon name={post.trade.direction === "Long" ? "trending-up" : "trending-down"} size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: post.trade.direction === "Long" ? "var(--up-500)" : "var(--down-500)", fontWeight: 600, fontSize: 14 }}>{post.trade.direction}</span>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>${post.trade.coin}</span>
              </div>
              <div style={{ color: "var(--text-tertiary)", fontSize: 12, marginTop: 2 }}>Entry @ ${post.trade.price}</div>
            </div>
          </div>
        )}
      </button>

      {((post.tags && post.tags.length > 0) || tickers.length > 0) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tickers.map((t) => (
            <span
              key={t}
              style={{
                padding: "3px 9px", borderRadius: 999, background: "rgba(58,222,126,.1)",
                border: "1px solid rgba(58,222,126,.22)", color: "var(--up-500)",
                font: "500 11.5px/1.6 var(--font-mono)",
              }}
            >
              ${t}
            </span>
          ))}
          {post.tags && post.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "3px 9px", borderRadius: 999, background: "var(--surface-raised)",
                color: "var(--text-secondary)", font: "500 11.5px/1.6 var(--font-mono)",
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 2 }}>
        <motion.button
          whileTap={tapScale}
          onClick={onLike}
          aria-label={post.liked ? "Remove like" : "Like"}
          aria-pressed={post.liked}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", minHeight: 44, paddingRight: 4 }}
        >
          <Icon name="heart" size={16} color={post.liked ? "var(--up-500)" : "var(--text-tertiary)"} />
          <span className="zb-caption zb-tabular" style={{ color: post.liked ? "var(--up-500)" : "var(--text-tertiary)" }}>{post.likes}</span>
        </motion.button>

        <motion.button
          whileTap={tapScale}
          onClick={onOpen}
          aria-label="Replies"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", minHeight: 44 }}
        >
          <Icon name="message" size={16} color="var(--text-tertiary)" />
          <span className="zb-caption zb-tabular" style={{ color: "var(--text-tertiary)" }}>{post.replies.length}</span>
        </motion.button>

        <span style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}>
          <Icon name="trending-up" size={15} color="var(--text-tertiary)" />
          <span className="zb-caption zb-tabular" style={{ color: "var(--text-tertiary)" }}>{formatCount(viewsFor(post))}</span>
        </span>

        {!compact && post.visibility === "followers" && (
          <span className="zb-caption" style={{ color: "var(--text-tertiary)", marginLeft: "auto" }}>Followers only</span>
        )}
      </div>
    </div>
  );
}
