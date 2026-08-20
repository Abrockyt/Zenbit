// A card is a 20px-radius rectangle of 4.5% white with a 1px hairline and no shadow.
export default function Card({ children, raised = false, style, padding = 16 }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        borderRadius: "var(--radius-lg)",
        padding,
        background: raised ? "var(--grad-card)" : "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
