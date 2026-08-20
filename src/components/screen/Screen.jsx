import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PhoneFrame from "../frames/PhoneFrame";
import Icon from "../core/Icon";
import { screenTransition, tapScale, dur, ease } from "../../lib/motion";

const HEADER_H = 56;

export function Screen({ title, subtitle, onBack, trailing, tabBar, children, scroll = true, pad = true }) {
  const navigate = useNavigate();
  const back = onBack ?? (() => navigate(-1));
  const hasHeader = title || onBack !== null;

  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const bgOpacity = useTransform(scrollY, [0, 30], [0, 0.45]);
  const blurValue = useTransform(scrollY, [0, 30], ["blur(0px)", "blur(24px)"]);
  const borderOpacity = useTransform(scrollY, [0, 30], [0, 0.08]);

  return (
    <PhoneFrame tabBar={tabBar}>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0 }}>
        {hasHeader && (
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: `calc(var(--screen-top-safe) + ${HEADER_H}px)`,
                zIndex: 25,
                boxSizing: "border-box",
                padding: "var(--screen-top-safe) 20px 0",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: useTransform(bgOpacity, v => `rgba(10, 15, 13, ${v})`),
                backdropFilter: blurValue,
                WebkitBackdropFilter: blurValue,
                borderBottom: useTransform(borderOpacity, v => `0.5px solid rgba(255,255,255,${v})`),
              }}
            >
            <motion.button
              whileTap={tapScale}
              onClick={back}
              aria-label="Go back"
              style={{ width: 44, height: 44, marginLeft: -12, display: "grid", placeItems: "center", background: "none", border: "none", flex: "0 0 auto" }}
            >
              <Icon name="chevron-left" size={22} />
            </motion.button>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <h1 className="zb-title-3" style={{ margin: 0, color: "#fff" }}>{title}</h1>}
              {subtitle && <p className="zb-body-sm" style={{ margin: "2px 0 0", color: "var(--text-tertiary)" }}>{subtitle}</p>}
            </div>
            {trailing}
            </motion.div>
        )}

        <div
          ref={scrollRef}
          style={{
            position: "absolute",
            inset: 0,
            boxSizing: "border-box",
            paddingTop: pad ? `calc(var(--screen-top-safe) + ${hasHeader ? HEADER_H : 12}px)` : 0,
            paddingLeft: pad ? 20 : 0,
            paddingRight: pad ? 20 : 0,
            paddingBottom: pad ? (tabBar ? 140 : 32) : 0,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflowY: scroll ? "auto" : "hidden",
          }}
        >
          {children}
        </div>
      </motion.div>
    </PhoneFrame>
  );
}

// The flow diagram's loading / empty / error trio. Every screen that fetches or
// submits renders one of these instead of inventing its own placeholder.
export function StateBlock({ kind, title, body, actionLabel, onAction, secondaryLabel, onSecondary }) {
  if (kind === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
            style={{ height: 60, borderRadius: "var(--radius-md)", background: "var(--surface-card)" }}
          />
        ))}
      </div>
    );
  }

  const tone = kind === "error" ? "var(--down-500)" : "var(--text-tertiary)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.base, ease: ease.standard }}
      role={kind === "error" ? "alert" : undefined}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        padding: "32px 20px", borderRadius: "var(--radius-lg)",
        background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
      }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 999, display: "grid", placeItems: "center", background: kind === "error" ? "rgba(242,80,75,.14)" : "var(--surface-raised)" }}>
        <Icon name={kind === "error" ? "alert" : "search"} size={18} color={tone} />
      </span>
      {title && <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>{title}</p>}
      {body && <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)", maxWidth: 260 }}>{body}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {actionLabel && (
          <motion.button whileTap={tapScale} onClick={onAction} style={{ padding: "11px 20px", borderRadius: 999, background: "#fff", border: "none", color: "var(--ink-1)", font: "500 14px/1 var(--font-core)" }}>
            {actionLabel}
          </motion.button>
        )}
        {secondaryLabel && (
          <motion.button whileTap={tapScale} onClick={onSecondary} style={{ padding: "11px 20px", borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "#fff", font: "500 14px/1 var(--font-core)" }}>
            {secondaryLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// A tappable list row — settings, lists, pickers. 60px per the design system's
// list rhythm, no dividers.
//
// The row is always a plain container and only the label area becomes a button,
// so a row can carry its own trailing control (a switch, an Unblock button)
// without nesting one button inside another.
export function Row({ icon, label, value, hint, onClick, trailing, tone, danger }) {
  const body = (
    <>
      {icon && (
        <span style={{ width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-raised)", flex: "0 0 auto" }}>
          <Icon name={icon} size={17} color={danger ? "var(--down-500)" : "#fff"} />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="zb-body" style={{ display: "block", color: danger ? "var(--down-500)" : "#fff" }}>{label}</span>
        {hint && <span className="zb-caption" style={{ display: "block", color: "var(--text-tertiary)", marginTop: 1 }}>{hint}</span>}
      </span>
      {value != null && <span className="zb-body-sm zb-tabular" style={{ color: tone ?? "var(--text-secondary)", flex: "0 0 auto" }}>{value}</span>}
      {onClick && !trailing && <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
    </>
  );

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        minHeight: 60, padding: "10px 16px", borderRadius: "var(--radius-md)",
        background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
        boxSizing: "border-box",
      }}
    >
      {onClick ? (
        <motion.button
          whileTap={tapScale}
          onClick={onClick}
          style={{
            display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0,
            textAlign: "left", background: "none", border: "none", padding: 0, margin: 0,
            minHeight: 40,
          }}
        >
          {body}
        </motion.button>
      ) : (
        body
      )}
      {trailing}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <p className="zb-label" style={{ margin: "8px 0 -8px", color: "var(--text-tertiary)", textTransform: "none" }}>
      {children}
    </p>
  );
}

// Primary / secondary CTA, pill, with the system's press behaviour.
export function Cta({ children, onClick, variant = "primary", disabled, busy, full = true, type = "button" }) {
  const primary = variant === "primary";
  return (
    <motion.button
      type={type}
      whileTap={disabled || busy ? undefined : tapScale}
      onClick={onClick}
      disabled={disabled || busy}
      style={{
        width: full ? "100%" : undefined,
        padding: "15px 24px",
        borderRadius: 999,
        border: primary ? "none" : "1px solid var(--border-default)",
        background: primary ? "#fff" : "var(--surface-raised)",
        color: primary ? "var(--ink-1)" : "#fff",
        font: "500 15px/1 var(--font-core)",
        opacity: disabled ? 0.38 : 1,
        transition: `opacity ${dur.fast}s`,
      }}
    >
      {busy ? "Working…" : children}
    </motion.button>
  );
}