import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Screen, Cta, StateBlock } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import { Avatar } from "../../components/social/PostCard";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import Button from "../../components/core/Button";

const LIMIT = 280;
const TAGS = ["trades", "analysis", "meme", "news", "alpha"];

export default function Compose() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const draft = state.social.draft;
  const visibility = state.settings.postVisibility;
  const left = LIMIT - draft.length;
  
  const [image, setImage] = useState(null);
  const [trade, setTrade] = useState(null);
  const [type, setType] = useState("post");
  const [selectedTags, setSelectedTags] = useState([]);
  
  const fileRef = useRef(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tCoin, setTCoin] = useState("BTC");
  const [tDir, setTDir] = useState("Long");
  const [tPrice, setTPrice] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const publish = useAsyncAction(
    async () => {
      if (draft.trim() === "fail") throw new Error("The server rejected that post.");
      dispatch({
        type: "social/addPost",
        post: {
          body: draft.trim(),
          tags: selectedTags,
          image,
          trade,
          type
        },
      });
    },
    { label: "Publishing post", queueWhenOffline: true }
  );

  const send = async () => {
    await publish.run();
    if (!publish.isError && !publish.isQueued) {
      toast("Post published.");
      navigate("/social");
    }
  };

  const handleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <Screen
      title="New post"
      onBack={() => navigate("/social")}
      trailing={
        <button
          onClick={send}
          disabled={(!draft.trim() && !image) || left < 0 || publish.isLoading}
          style={{
            padding: "9px 16px", borderRadius: 999, border: "none",
            background: (draft.trim() || image) && left >= 0 ? "#fff" : "var(--surface-raised)",
            color: (draft.trim() || image) && left >= 0 ? "var(--ink-1)" : "var(--text-disabled)",
            font: "500 13px/1 var(--font-core)",
          }}
        >
          {publish.isLoading ? "Posting…" : "Post"}
        </button>
      }
    >
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar src={state.session.user.avatarUrl} initials={state.session.user.avatarInitials} />
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => dispatch({ type: "social/setDraft", draft: e.target.value })}
          placeholder="What are you watching?"
          rows={5}
          aria-label="Post text"
          style={{
            flex: 1, resize: "none", background: "none", border: "none", outline: "none",
            color: "#fff", font: "400 16px/1.45 var(--font-core)",
          }}
        />
      </div>

      {image && (
        <div style={{ position: "relative", marginTop: 12, borderRadius: 12, overflow: "hidden" }}>
          <img src={image} alt="" style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />
          <button onClick={() => setImage(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
        </div>
      )}

      {trade && (
        <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: trade.direction === "Long" ? "var(--up-500)" : "var(--down-500)", fontWeight: 600 }}>{trade.direction}</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>${trade.coin}</span>
            <span style={{ color: "var(--text-tertiary)" }}>@ {trade.price}</span>
          </div>
          <button onClick={() => setTrade(null)} style={{ background: "none", border: "none", color: "var(--text-tertiary)" }}><Icon name="x" size={14} /></button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {TAGS.map(t => (
          <button key={t} onClick={() => handleTag(t)} style={{ padding: "4px 10px", borderRadius: 12, background: selectedTags.includes(t) ? "var(--up-500)" : "var(--surface-raised)", border: "none", color: selectedTags.includes(t) ? "#000" : "var(--text-secondary)", font: "500 12px/1 var(--font-core)" }}>
            #{t}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border-subtle)", marginTop: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", color: "var(--up-500)" }}><Icon name="camera" size={20} /></button>
          <button onClick={() => setShowTradeForm(!showTradeForm)} style={{ background: "none", border: "none", color: "var(--up-500)" }}><Icon name="trending-up" size={20} /></button>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-raised)", borderRadius: 16, padding: 4 }}>
          {["post", "community"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ padding: "4px 10px", borderRadius: 12, background: type === t ? "#fff" : "transparent", border: "none", color: type === t ? "#000" : "var(--text-secondary)", font: "500 12px/1 var(--font-core)", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>
        <span className="zb-caption zb-tabular" style={{ color: left < 0 ? "var(--down-500)" : left < 40 ? "var(--warn-500)" : "var(--text-tertiary)" }}>
          {left}
        </span>
      </div>

      {showTradeForm && (
        <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={tCoin} onChange={e => setTCoin(e.target.value)} placeholder="Coin (BTC)" style={{ flex: 1, padding: 8, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", color: "#fff", outline: "none" }} />
            <select value={tDir} onChange={e => setTDir(e.target.value)} style={{ padding: 8, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", color: "#fff", outline: "none" }}>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={tPrice} onChange={e => setTPrice(e.target.value)} placeholder="Entry Price" style={{ flex: 1, padding: 8, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", color: "#fff", outline: "none" }} />
            <Button onClick={() => { setTrade({ coin: tCoin, direction: tDir, price: tPrice }); setShowTradeForm(false); }} size="sm" style={{ width: "auto" }}>Add</Button>
          </div>
        </div>
      )}

      {publish.isError && (
        <StateBlock kind="error" title="Post failed to send" body={`${publish.error?.message} Your draft is saved — retry, or come back to it later.`} actionLabel="Retry" onAction={send} secondaryLabel="Save as draft" onSecondary={() => { publish.reset(); toast("Saved as a draft."); navigate("/social"); }} />
      )}
      {publish.isQueued && (
        <StateBlock kind="empty" title="Queued" body="You're offline. This post is queued and publishes once you reconnect." actionLabel="Back to feed" onAction={() => navigate("/social")} />
      )}

      <div style={{ marginTop: "auto" }}>
        <Cta onClick={send} disabled={(!draft.trim() && !image) || left < 0} busy={publish.isLoading}>Post</Cta>
      </div>
    </Screen>
  );
}
