import { AnimatePresence, motion } from "framer-motion";
import { sheetTransition, scrimTransition } from "../../lib/motion";

export default function Sheet({ open, onClose, children, title }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          {...scrimTransition}
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--surface-overlay)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 40,
          }}
        >
          <motion.div
            {...sheetTransition}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "82%",
              boxSizing: "border-box",
              borderTopLeftRadius: "var(--radius-2xl)",
              borderTopRightRadius: "var(--radius-2xl)",
              background: "var(--surface-card-solid)",
              border: "1px solid var(--border-subtle)",
              borderBottom: "none",
              boxShadow: "var(--shadow-sheet)",
              padding: "12px 20px 28px",
              overflowY: "auto",
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 3, background: "var(--border-strong)", margin: "0 auto 16px" }} />
            {title ? (
              <div className="zb-title-2" style={{ color: "#fff", marginBottom: 14 }}>{title}</div>
            ) : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
