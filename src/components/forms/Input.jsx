import { useState } from "react";

export default function Input({ label, value, onChange, placeholder, type = "text", focused: focusedProp, ...rest }) {
  const [focused, setFocused] = useState(false);
  const isFocused = focusedProp ?? focused;
  return (
    <div
      style={{
        boxSizing: "border-box",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        background: "var(--surface-card)",
        border: `1px solid ${isFocused ? "var(--border-focus)" : "var(--border-subtle)"}`,
        boxShadow: isFocused ? "var(--glow-focus)" : "none",
        transition: `border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard)`,
      }}
    >
      {label ? (
        <div className="zb-caption" style={{ color: "var(--text-tertiary)" }}>{label}</div>
      ) : null}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          font: "400 15px/21px var(--font-core)",
          color: "#fff",
          marginTop: label ? 3 : 0,
          padding: 0,
        }}
        {...rest}
      />
    </div>
  );
}
