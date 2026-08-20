import { motion } from "framer-motion";
import { dur, ease, tapScale } from "../../lib/motion";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

export default function AmountPad({ onKey }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {keys.map((k) => (
        <motion.button
          key={k}
          onClick={() => onKey(k)}
          whileTap={tapScale}
          transition={{ duration: dur.fast, ease: ease.standard }}
          style={{
            height: 56,
            borderRadius: "var(--radius-md)",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: "500 20px/1 var(--font-core)",
            color: "#fff",
          }}
        >
          {k === "back" ? "⌫" : k}
        </motion.button>
      ))}
    </div>
  );
}
