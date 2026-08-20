import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, Row, SectionLabel, StateBlock, Cta } from "../../components/screen/Screen";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { dur, ease, scrimTransition } from "../../lib/motion";
import { relativeTime } from "../../lib/time";

const REASONS = ["Spam or scam", "Impersonation", "Harassment", "Financial advice / manipulation", "Something else"];

export default function Reports() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");

  const file = useAsyncAction(
    async () => {
      dispatch({
        type: "social/report",
        report: { id: `rep${Date.now()}`, target: "Zenbit Pro", kind: "problem", reason, detail: detail.trim(), at: Date.now(), status: "received" },
      });
    },
    { label: "Filing report", queueWhenOffline: true }
  );

  const submit = async () => {
    await file.run();
    if (!file.isError) {
      setOpen(false);
      setDetail("");
      toast("Report received. We'll follow up by email.");
    }
  };

  return (
    <Screen title="Report & safety" trailing={
      <button onClick={() => setOpen(true)} aria-label="Report a problem" style={{ padding: "9px 14px", borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "#fff", font: "500 13px/1 var(--font-core)" }}>
        Report
      </button>
    }>
      {state.social.reports.length === 0 ? (
        <StateBlock
          kind="empty"
          title="No reports filed"
          body="Reports you file from a post, a profile, or here will show up in this list with their status."
          actionLabel="Report a problem"
          onAction={() => setOpen(true)}
        />
      ) : (
        <>
          <SectionLabel>Your reports</SectionLabel>
          {state.social.reports
            .slice()
            .reverse()
            .map((r) => (
              <Row
                key={r.id}
                icon="alert"
                label={r.kind === "problem" ? r.reason : `Reported ${r.target.startsWith("@") ? r.target : `@${r.target}`}`}
                hint={`${r.reason}${r.detail ? ` · ${r.detail}` : ""} · ${relativeTime(r.at)}`}
                value={r.status === "received" ? "Received" : "Reviewed"}
                tone={r.status === "received" ? "var(--warn-500)" : "var(--up-500)"}
              />
            ))}
        </>
      )}

      <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
        Reports are reviewed by a person. Nothing you report is shared with the account you reported.
      </p>

      <AnimatePresence>
        {open && (
          <>
            <motion.button {...scrimTransition} onClick={() => setOpen(false)} aria-label="Dismiss" style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(6px)", border: "none", zIndex: 40 }} />
            <motion.div
              initial={{ y: 420 }}
              animate={{ y: 0 }}
              exit={{ y: 420 }}
              transition={{ duration: dur.slow, ease: ease.emphasis }}
              role="dialog"
              aria-label="Report a problem"
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
                padding: "24px 20px 34px", borderRadius: "32px 32px 0 0",
                background: "var(--surface-card-solid)", borderTop: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", gap: 12, maxHeight: "82%", overflowY: "auto",
              }}
            >
              <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>Report a problem</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    style={{
                      textAlign: "left", padding: "13px 16px", borderRadius: "var(--radius-sm)",
                      background: reason === r ? "var(--surface-raised)" : "var(--surface-card)",
                      border: `1px solid ${reason === r ? "var(--border-strong)" : "var(--border-subtle)"}`,
                      color: "#fff", font: "400 14px/1.3 var(--font-core)",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Anything else we should know? (optional)"
                rows={3}
                style={{
                  resize: "none", padding: 14, borderRadius: "var(--radius-sm)",
                  background: "var(--surface-card)", border: "1px solid var(--border-default)",
                  color: "#fff", font: "400 14px/1.4 var(--font-core)",
                }}
              />
              {file.isError && (
                <p className="zb-body-sm" role="alert" style={{ margin: 0, color: "var(--down-500)" }}>
                  Couldn't file that report. {file.error?.message} Try again — nothing was lost.
                </p>
              )}
              {file.isQueued && (
                <p className="zb-body-sm" style={{ margin: 0, color: "var(--warn-500)" }}>
                  You're offline. This report is queued and sends when you reconnect.
                </p>
              )}
              <Cta onClick={submit} busy={file.isLoading}>Send report</Cta>
              <Cta variant="secondary" onClick={() => setOpen(false)}>Cancel</Cta>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
