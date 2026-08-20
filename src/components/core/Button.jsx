import { motion } from "framer-motion";
import { dur, ease, tapScale } from "../../lib/motion";

const base = {
  height: "var(--control-height-lg)",
  borderRadius: "var(--radius-pill)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  font: "500 15px/1 var(--font-core)",
  border: "1px solid transparent",
  width: "100%",
  boxSizing: "border-box",
};

const variants = {
  primary: {
    background: "#fff",
    color: "var(--text-inverse)",
    borderColor: "#fff",
    boxShadow: "var(--shadow-cta)",
  },
  secondary: {
    background: "var(--surface-card)",
    color: "#fff",
    borderColor: "var(--border-default)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    borderColor: "transparent",
  },
  danger: {
    background: "var(--down-500)",
    color: "#fff",
    borderColor: "var(--down-500)",
  },
  buy: {
    background: "var(--up-500)",
    color: "var(--text-inverse)",
    borderColor: "var(--up-500)",
  },
  sell: {
    background: "var(--down-500)",
    color: "#fff",
    borderColor: "var(--down-500)",
  },
};

export default function Button({
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  style,
  size = "lg",
}) {
  const heights = { lg: 54, md: 44, sm: 34 };
  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileTap={disabled || loading ? {} : tapScale}
      transition={{ duration: dur.fast, ease: ease.standard }}
      style={{
        ...base,
        ...variants[variant],
        height: heights[size],
        opacity: disabled ? "var(--state-disabled-opacity)" : 1,
        ...style,
      }}
    >
      {loading ? (
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            border: "2px solid rgba(5,8,7,.25)",
            borderTopColor: variant === "primary" ? "var(--text-inverse)" : "#fff",
            animation: "zb-spin 0.7s linear infinite",
          }}
        />
      ) : null}
      {children}
    </motion.button>
  );
}
