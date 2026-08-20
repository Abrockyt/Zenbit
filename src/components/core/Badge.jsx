export default function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { color: "var(--text-secondary)", border: "var(--border-default)" },
    up: { color: "var(--up-500)", border: "rgba(58,222,126,.35)" },
    down: { color: "var(--down-500)", border: "rgba(242,80,75,.35)" },
    warn: { color: "var(--warn-500)", border: "rgba(245,181,68,.35)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        letterSpacing: ".06em",
        padding: "2px 7px",
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        color: t.color,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}
