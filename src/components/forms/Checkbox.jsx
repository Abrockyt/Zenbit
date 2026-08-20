import Icon from "../core/Icon";

export default function Checkbox({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: "none",
        border: "none",
        textAlign: "left",
        padding: 0,
        width: "100%",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `1px solid ${checked ? "var(--up-500)" : "var(--border-default)"}`,
          background: checked ? "var(--up-500)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          transition: "background var(--dur-fast) var(--ease-standard)",
        }}
      >
        {checked ? <Icon name="check" size={13} color="var(--text-inverse)" /> : null}
      </span>
      <span className="zb-body-sm" style={{ color: "var(--text-secondary)", fontSize: 12.5, lineHeight: "18px" }}>
        {label}
      </span>
    </button>
  );
}
