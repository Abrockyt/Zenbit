export default function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flex: "0 0 auto" }}>
      <span style={{ font: "500 13px/18px var(--font-core)", color: "var(--text-secondary)" }}>{title}</span>
      {action ? (
        <button onClick={onAction} style={{ background: "none", border: "none", font: "400 12px/16px var(--font-core)", color: "var(--text-tertiary)" }}>
          {action}
        </button>
      ) : null}
    </div>
  );
}
