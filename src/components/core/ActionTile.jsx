import { motion } from "framer-motion";
import Icon from "./Icon";
import { dur, ease, tapScale } from "../../lib/motion";
import { useLiquidGlass } from "../../lib/useLiquidGlass";

export default function ActionTile({ icon, label, onClick, glyph }) {
  const glassRef = useLiquidGlass({ scale: -70, chroma: 5, blur: 5, saturate: 1.4, mapBlur: 10, border: 0.12 });

  return (
    <motion.button
      onClick={onClick}
      whileTap={tapScale}
      transition={{ duration: dur.fast, ease: ease.standard }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", flex: 1, padding: 0 }}
    >
      <span
        ref={glassRef}
        style={{
          width: 58,
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          background: "linear-gradient(180deg, rgba(20,28,25,.42) 0%, rgba(12,17,15,.58) 100%)",
          boxShadow: "0 16px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.09)",
        }}
      >
        {glyph ?? <Icon name={icon} size={22} color="#fff" filled={true} />}
      </span>
      <span className="zb-body-sm" style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
    </motion.button>
  );
}
