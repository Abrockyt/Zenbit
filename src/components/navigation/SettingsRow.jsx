import Icon from "../core/Icon";

export default function SettingsRow({ icon, label, value, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: "var(--list-row-height)",
        width: "100%",
        background: "none",
        border: "none",
        padding: "0 2px",
        textAlign: "left",
      }}
    >
      {icon ? (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "var(--surface-raised)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          }}
        >
          <Icon name={icon} size={16} color={danger ? "var(--down-500)" : "var(--text-secondary)"} />
        </span>
      ) : null}
      <span style={{ flex: 1, font: "400 14px/19px var(--font-core)", color: danger ? "var(--down-500)" : "#fff" }}>{label}</span>
      {value ? <span style={{ font: "400 13px/18px var(--font-core)", color: "var(--text-tertiary)" }}>{value}</span> : null}
      <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
    </button>
  );
}
