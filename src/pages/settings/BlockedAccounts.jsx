import { useState } from "react";
import { Screen, Row, SectionLabel, StateBlock } from "../../components/screen/Screen";
import SegmentedControl from "../../components/forms/SegmentedControl";
import { useApp, useToast } from "../../state/store";
import { useNavigate } from "react-router-dom";

export default function BlockedAccounts() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("muted");

  const list = tab === "muted" ? state.social.muted : state.social.blocked;

  const undo = (handle) => {
    dispatch({ type: tab === "muted" ? "social/toggleMute" : "social/toggleBlock", handle });
    toast(tab === "muted" ? `Unmuted @${handle}.` : `Unblocked @${handle}.`);
  };

  return (
    <Screen title="Muted & blocked">
      <SegmentedControl
        options={[
          { value: "muted", label: `Muted (${state.social.muted.length})` },
          { value: "blocked", label: `Blocked (${state.social.blocked.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      <p className="zb-caption" style={{ margin: "-8px 0 0", color: "var(--text-tertiary)" }}>
        {tab === "muted"
          ? "Muted accounts stay followed — you just stop seeing their posts in the feed."
          : "Blocked accounts can't message you, see your posts, or appear in your feed."}
      </p>

      {list.length === 0 ? (
        <StateBlock
          kind="empty"
          title={tab === "muted" ? "Nobody muted" : "Nobody blocked"}
          body={`You haven't ${tab === "muted" ? "muted" : "blocked"} anyone. You can do it from any post or profile.`}
          actionLabel="Browse the feed"
          onAction={() => navigate("/social")}
        />
      ) : (
        <>
          <SectionLabel>{tab === "muted" ? "Muted accounts" : "Blocked accounts"}</SectionLabel>
          {list.map((handle) => (
            <Row
              key={handle}
              icon="user"
              label={`@${handle}`}
              trailing={
                <button
                  onClick={() => undo(handle)}
                  style={{ padding: "8px 14px", borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "#fff", font: "500 13px/1 var(--font-core)" }}
                >
                  {tab === "muted" ? "Unmute" : "Unblock"}
                </button>
              }
            />
          ))}
        </>
      )}
    </Screen>
  );
}
