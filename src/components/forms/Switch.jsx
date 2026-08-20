import { motion } from "framer-motion";
import { dur, ease } from "../../lib/motion";

export default function Switch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        background: checked ? "var(--up-500)" : "var(--surface-raised)",
        border: `1px solid ${checked ? "var(--up-500)" : "var(--border-default)"}`,
        padding: 2,
        display: "flex",
        justifyContent: checked ? "flex-end" : "flex-start",
        transition: `background var(--dur-base) var(--ease-standard)`,
      }}
    >
      <motion.span
        layout
        transition={{ duration: dur.base, ease: ease.standard }}
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: checked ? "var(--text-inverse)" : "#fff",
        }}
      />
    </button>
  );
}
