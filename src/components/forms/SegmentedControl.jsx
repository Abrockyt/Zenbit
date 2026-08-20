import { motion } from "framer-motion";
import { dur, ease } from "../../lib/motion";

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-pill)",
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              position: "relative",
              padding: "8px 10px",
              borderRadius: "var(--radius-pill)",
              border: "none",
              background: "transparent",
              font: `500 12.5px/1 var(--font-core)`,
              color: selected ? "#fff" : "var(--text-tertiary)",
              zIndex: 1,
            }}
          >
            {selected ? (
              <motion.span
                layoutId="segmented-pill"
                transition={{ duration: dur.base, ease: ease.standard }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "var(--radius-pill)",
                  background: "var(--surface-raised)",
                  zIndex: -1,
                }}
              />
            ) : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
