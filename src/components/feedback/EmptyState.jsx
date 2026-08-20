import Icon from "../core/Icon";
import Button from "../core/Button";

// No empty screen appears in the source; lists need one, so this is scaffolding
// rather than an observed pattern.
export default function EmptyState({ icon = "inbox", title, message, actionLabel, onAction }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "40px 20px" }}>
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={24} color="var(--text-tertiary)" />
      </span>
      <div>
        <div className="zb-title-3" style={{ color: "#fff" }}>{title}</div>
        {message ? <div className="zb-body-sm" style={{ color: "var(--text-tertiary)", marginTop: 6, fontSize: 13 }}>{message}</div> : null}
      </div>
      {actionLabel ? (
        <Button variant="secondary" size="sm" onClick={onAction} style={{ width: "auto", padding: "0 20px" }}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
