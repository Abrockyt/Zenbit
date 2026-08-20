import { motion } from "framer-motion";
import Icon from "./Icon";
import { dur, ease, tapScale } from "../../lib/motion";

export default function IconButton({ icon, size = 34, iconSize = 18, onClick, badge = false, tone = "default", style, color, filled }) {
  const bg = tone === "raised" ? "var(--surface-raised)" : "var(--surface-card)";
  return (
    <motion.button
      onClick={onClick}
      whileTap={tapScale}
      transition={{ duration: dur.fast, ease: ease.standard }}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <Icon name={icon} size={iconSize} color={color || style?.color || "var(--text-secondary)"} filled={filled} />
      {badge ? (
        <span
          style={{
            position: "absolute",
            top: 9,
            right: 10,
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "var(--up-500)",
            border: "1.5px solid #0A1512",
          }}
        />
      ) : null}
    </motion.button>
  );
}
