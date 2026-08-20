import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../state/store";
import { dur, ease } from "../../lib/motion";

// Confirmations land here rather than in each screen. The design system asks for
// short, quiet feedback — one line, no icon, gone in three seconds — and reserves
// the two accent colours for gain/loss, so a success toast stays neutral unless
// it genuinely reports a signed outcome.
const toneColor = {
  neutral: "var(--text-primary)",
  up: "var(--up-500)",
  down: "var(--down-500)",
};

export default function ToastHost() {
  const { state, dispatch } = useApp();

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 24,
        zIndex: 95,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {state.toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: dur.base, ease: ease.standard }}
            onClick={() => dispatch({ type: "toast/dismiss", id: t.id })}
            style={{
              pointerEvents: "auto",
              maxWidth: 320,
              padding: "12px 18px",
              borderRadius: 999,
              background: "rgba(12,17,15,.92)",
              border: "1px solid var(--border-default)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 8px 24px rgba(0,0,0,.45)",
            }}
          >
            <span className="zb-body-sm" style={{ color: toneColor[t.tone] ?? toneColor.neutral }}>
              {t.message}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
