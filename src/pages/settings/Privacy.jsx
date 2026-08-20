import { Screen, Row, SectionLabel } from "../../components/screen/Screen";
import SegmentedControl from "../../components/forms/SegmentedControl";
import Switch from "../../components/forms/Switch";
import { useApp, useToast } from "../../state/store";

// The three privacy controls the flow diagram specifies, with its stated
// defaults: messages from Followers, posts Public, portfolio hidden.
export default function Privacy() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const s = state.settings;

  const set = (patch, label) => {
    dispatch({ type: "settings/set", patch });
    toast(label ?? "Changes saved.");
  };

  return (
    <Screen title="Privacy" subtitle="Who sees you, and who can reach you">
      <SectionLabel>Who can message you</SectionLabel>
      <SegmentedControl
        options={[
          { value: "everyone", label: "Everyone" },
          { value: "followers", label: "Followers" },
          { value: "none", label: "No one" },
        ]}
        value={s.whoCanMessage}
        onChange={(v) => set({ whoCanMessage: v })}
      />
      <p className="zb-caption" style={{ margin: "-8px 0 0", color: "var(--text-tertiary)" }}>
        {s.whoCanMessage === "everyone" && "Anyone on Zenbit can start a conversation with you."}
        {s.whoCanMessage === "followers" && "Only people you follow back can start a conversation."}
        {s.whoCanMessage === "none" && "New conversations are turned off. Existing threads stay open."}
      </p>

      <SectionLabel>Post visibility</SectionLabel>
      <SegmentedControl
        options={[
          { value: "public", label: "Public" },
          { value: "followers", label: "Followers only" },
        ]}
        value={s.postVisibility}
        onChange={(v) => set({ postVisibility: v })}
      />
      <p className="zb-caption" style={{ margin: "-8px 0 0", color: "var(--text-tertiary)" }}>
        Applies to new posts. Posts you've already published keep the visibility they were sent with.
      </p>

      <SectionLabel>Profile</SectionLabel>
      <Row
        icon="eye"
        label="Show portfolio on profile"
        hint={s.showPortfolio ? "Holdings and totals are visible to others" : "Your holdings stay private"}
        trailing={<Switch checked={s.showPortfolio} onChange={(v) => set({ showPortfolio: v })} />}
      />
      <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
        Zenbit never shows your wallet address or transaction history on your profile, whatever this is set to.
      </p>
    </Screen>
  );
}
