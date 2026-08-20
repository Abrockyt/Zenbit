import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../../state/store";
import { dur, ease } from "../../lib/motion";
import Icon from "../core/Icon";

// The flow diagram treats network loss as cross-cutting: it can happen on any
// screen mid-action, and the recovery is "action queued, auto-retries on
// reconnect — no funds moved twice". This banner is that state, made visible
// app-wide, plus a count of whatever is waiting to be replayed.
export default function NetworkBanner() {
  const { state } = useApp();
  const offline = !state.network.online;
  const queued = state.network.queued.length;

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: dur.base, ease: ease.standard }}
          role="status"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 16px",
            background: "rgba(242,80,75,.16)",
            borderBottom: "1px solid rgba(242,80,75,.32)",
            backdropFilter: "blur(18px)",
          }}
        >
          <Icon name="wifi-off" size={14} color="var(--down-500)" />
          <span className="zb-body-sm" style={{ color: "var(--down-500)" }}>
            Connection lost.{queued > 0 ? ` ${queued} action${queued > 1 ? "s" : ""} queued — retries on reconnect.` : " Reconnecting…"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
