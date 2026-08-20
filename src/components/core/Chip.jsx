import { motion } from "framer-motion";
import { dur, ease, tapScale } from "../../lib/motion";

export default function Chip({ children, selected = false, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={tapScale}
      transition={{ duration: dur.fast, ease: ease.standard }}
      style={{
        boxSizing: "border-box",
        padding: "7px 14px",
        borderRadius: 999,
        font: `${selected ? 500 : 400} 12.5px/1 var(--font-core)`,
        color: selected ? "#fff" : "var(--text-tertiary)",
        background: selected ? "var(--surface-raised)" : "transparent",
        border: `1px solid ${selected ? "var(--border-default)" : "var(--border-subtle)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </motion.button>
  );
}
