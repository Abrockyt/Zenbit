import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen, Cta, StateBlock } from "../components/screen/Screen";
import SegmentedControl from "../components/forms/SegmentedControl";
import Icon from "../components/core/Icon";
import { useApp } from "../state/store";
import { useAsyncAction } from "../state/useAsyncAction";

// A tiny wordlist stand-in. Real BIP-39 validation needs the full 2048-word
// list; here we check shape and flag words that aren't plausible, which is
// enough to make the per-word error state honest.
const KNOWN = new Set(
  "canyon drift ember lattice quarry vivid nomad thicket pearl summit orbit fable anchor bridge cinder harbor ivory jungle kernel meadow" .split(" ")
);

export default function RestoreWallet() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [count, setCount] = useState(12);
  const [words, setWords] = useState(Array(24).fill(""));
  const [checked, setChecked] = useState(false);

  const active = words.slice(0, count);
  const filled = active.filter((w) => w.trim()).length;
  const badIndexes = checked ? active.map((w, i) => (w.trim() && !KNOWN.has(w.trim().toLowerCase()) ? i : -1)).filter((i) => i >= 0) : [];

  const setWord = (i, value) => {
    const next = [...words];
    next[i] = value.replace(/[^a-zA-Z]/g, "").toLowerCase();
    setWords(next);
    setChecked(false);
    restore.reset();
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parts = text.trim().split(/\s+/).slice(0, count);
      const next = Array(24).fill("");
      parts.forEach((p, i) => (next[i] = p.replace(/[^a-zA-Z]/g, "").toLowerCase()));
      setWords(next);
      setChecked(false);
    } catch {
      /* clipboard blocked — the user can type instead */
    }
  };

  const restore = useAsyncAction(
    async () => {
      setChecked(true);
      if (filled < count) throw new Error(`Only ${filled} of ${count} words entered.`);
      const bad = active.filter((w) => !KNOWN.has(w.trim().toLowerCase()));
      if (bad.length) throw new Error(`${bad.length} word${bad.length > 1 ? "s aren't" : " isn't"} in the recovery wordlist.`);
      dispatch({ type: "session/signIn" });
      dispatch({ type: "onboarding/set", patch: { phraseBackedUp: true, termsAccepted: true, emailVerified: true } });
    },
    { label: "Rebuilding wallet", minDuration: 1100 }
  );

  const go = async () => {
    await restore.run();
    if (!restore.isError) navigate("/home", { replace: true });
  };

  return (
    <Screen title="Restore wallet" onBack={() => navigate("/welcome")}>
      <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
        Enter your recovery phrase in order. Zenbit never stores your phrase, so this is the only way back into a wallet on a new device.
      </p>

      <SegmentedControl
        options={[
          { value: 12, label: "12 words" },
          { value: 24, label: "24 words" },
        ]}
        value={count}
        onChange={setCount}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {Array.from({ length: count }).map((_, i) => {
          const bad = badIndexes.includes(i);
          return (
            <label
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                borderRadius: "var(--radius-xs)", background: "var(--surface-card)",
                border: `1px solid ${bad ? "var(--down-500)" : "var(--border-subtle)"}`,
              }}
            >
              <span className="zb-caption zb-tabular" style={{ color: "var(--text-tertiary)", width: 16, flex: "0 0 auto" }}>{i + 1}</span>
              <input
                value={words[i]}
                onChange={(e) => setWord(i, e.target.value)}
                aria-label={`Word ${i + 1}`}
                autoComplete="off"
                spellCheck={false}
                style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "#fff", font: "400 13px/1 var(--font-mono)" }}
              />
            </label>
          );
        })}
      </div>

      <button
        onClick={paste}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "none", border: "none", color: "var(--up-500)", font: "500 13px/1 var(--font-core)", minHeight: 44 }}
      >
        <Icon name="copy" size={15} color="var(--up-500)" />
        Paste from clipboard
      </button>

      {restore.isError && (
        <StateBlock
          kind="error"
          title={filled < count ? "Phrase incomplete" : "Invalid recovery phrase"}
          body={`${restore.error?.message} Re-check the order and spelling — the highlighted words don't match. If it still fails, contact support.`}
          actionLabel="Check again"
          onAction={() => restore.reset()}
          secondaryLabel="Contact support"
          onSecondary={() => restore.reset()}
        />
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        <Icon name="shield" size={16} color="var(--text-tertiary)" />
        <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
          Zenbit never stores your recovery phrase and can't recover it for you. Anyone who has it controls the wallet.
        </p>
      </div>

      <div style={{ marginTop: "auto" }}>
        <Cta onClick={go} busy={restore.isLoading} disabled={filled === 0}>
          Restore wallet
        </Cta>
      </div>
    </Screen>
  );
}
