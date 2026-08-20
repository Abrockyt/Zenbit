import { useRef } from "react";

export default function OTPInput({ length = 6, value, onChange, error = false }) {
  const refs = useRef([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function setDigit(i, d) {
    const next = digits.slice();
    next[i] = d.replace(/[^0-9]/g, "").slice(-1);
    onChange(next.join("").replace(/\s+$/, ""));
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {digits.map((d, i) => {
        const focused = d === "" && (i === 0 || digits[i - 1] !== "");
        return (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            style={{
              width: 46,
              height: 54,
              textAlign: "center",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-card)",
              border: `1px solid ${error ? "var(--down-500)" : focused ? "var(--border-focus)" : "var(--border-subtle)"}`,
              boxShadow: !error && focused ? "var(--glow-focus)" : "none",
              color: error ? "var(--down-500)" : "#fff",
              font: "500 20px/1 var(--font-core)",
              outline: "none",
            }}
          />
        );
      })}
    </div>
  );
}
