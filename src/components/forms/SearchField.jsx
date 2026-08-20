import Icon from "../core/Icon";

export default function SearchField({ value, onChange, placeholder = "Search coins" }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        borderRadius: "var(--radius-md)",
        padding: 13,
        background: "var(--grad-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Icon name="search" size={18} color="var(--text-tertiary)" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          font: "400 14px/19px var(--font-core)",
          color: "#fff",
        }}
      />
    </div>
  );
}
