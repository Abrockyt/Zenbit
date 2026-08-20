import { motion } from "framer-motion";
import Icon from "../core/Icon";
import Button from "../core/Button";
import { dur, ease } from "../../lib/motion";

export default function ResultDialog({ tone = "success", title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  const isSuccess = tone === "success";
  const color = isSuccess ? "var(--up-500)" : "var(--down-500)";
  const glow = isSuccess ? "var(--up-glow)" : "var(--down-glow)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "0 32px",
        textAlign: "center",
        background: "var(--grad-screen)",
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: dur.slow, ease: ease.emphasis }}
        style={{
          width: 76,
          height: 76,
          borderRadius: 999,
          border: `1px solid var(--border-strong)`,
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={isSuccess ? "check" : "x"} size={34} color={color} />
      </motion.div>
      <div>
        <div className="zb-title-1" style={{ color: "#fff" }}>{title}</div>
        {message ? (
          <div className="zb-body" style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>{message}</div>
        ) : null}
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {primaryLabel ? <Button onClick={onPrimary}>{primaryLabel}</Button> : null}
        {secondaryLabel ? (
          <Button variant="ghost" onClick={onSecondary}>{secondaryLabel}</Button>
        ) : null}
      </div>
    </div>
  );
}
