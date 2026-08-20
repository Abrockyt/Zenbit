import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, Cta } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import { useApp, useToast } from "../../state/store";
import { dur, ease } from "../../lib/motion";

// Pending → approved | rejected, with the rejection reason shown and a resubmit
// path, exactly as the flow diagram's KYC recovery edge describes.
const REJECTION = "The document photo was too blurry to read the expiry date.";

export default function KycStatus() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/home";
  const { state, dispatch } = useApp();
  const toast = useToast();
  const status = state.kyc.status;
  const [elapsed, setElapsed] = useState(0);

  // Review resolves on its own so the pending state is real rather than a
  // dead end. Two attempts in, it approves — mirroring a resubmit succeeding.
  useEffect(() => {
    if (status !== "pending") return;
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    const timer = setTimeout(() => {
      const attempts = state.kyc.documents?.length ? Number(localStorage.getItem("zenbit-kyc-attempts") ?? "0") : 0;
      if (attempts === 0) {
        localStorage.setItem("zenbit-kyc-attempts", "1");
        dispatch({ type: "kyc/reject", reason: REJECTION });
      } else {
        dispatch({ type: "kyc/approve" });
      }
    }, 3200);
    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [status, dispatch, state.kyc.documents]);

  if (status === "unverified") {
    return (
      <Screen title="Identity">
        <Cta onClick={() => navigate(`/kyc?next=${encodeURIComponent(next)}`)}>Start verification</Cta>
      </Screen>
    );
  }

  const view = {
    pending: {
      icon: "refresh",
      tint: "var(--warn-500)",
      bg: "rgba(245,181,68,.12)",
      title: "Reviewing your documents",
      body: "This usually takes under two minutes. You can leave this screen — we'll notify you when it's done.",
    },
    approved: {
      icon: "check",
      tint: "var(--up-500)",
      bg: "rgba(58,222,126,.12)",
      title: "Identity verified",
      body: "Buy, Sell and the Zenbit card are unlocked.",
    },
    rejected: {
      icon: "alert",
      tint: "var(--down-500)",
      bg: "rgba(242,80,75,.12)",
      title: "Document rejected",
      body: state.kyc.rejectionReason ?? REJECTION,
    },
  }[status];

  return (
    <Screen title="Identity" onBack={() => navigate(next)}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "40px 20px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        <motion.span
          animate={status === "pending" ? { rotate: 360 } : { scale: [0.9, 1] }}
          transition={status === "pending" ? { duration: 1.6, repeat: Infinity, ease: "linear" } : { duration: dur.base, ease: ease.standard }}
          style={{ width: 56, height: 56, borderRadius: 999, display: "grid", placeItems: "center", background: view.bg, border: `1px solid ${view.tint}` }}
        >
          <Icon name={view.icon} size={24} color={view.tint} />
        </motion.span>
        <p className="zb-title-2" style={{ margin: 0, color: "#fff" }}>{view.title}</p>
        <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)", maxWidth: 280 }}>{view.body}</p>
        {status === "pending" && (
          <p className="zb-caption zb-tabular" style={{ margin: 0, color: "var(--text-tertiary)" }}>
            {elapsed}s elapsed
          </p>
        )}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {status === "approved" && (
          <Cta
            onClick={() => {
              toast("Identity verified.");
              navigate(next, { replace: true });
            }}
          >
            Continue
          </Cta>
        )}

        {status === "rejected" && (
          <>
            <Cta
              onClick={() => {
                dispatch({ type: "kyc/reset" });
                navigate(`/kyc/documents?next=${encodeURIComponent(next)}`, { replace: true });
              }}
            >
              Retake and resubmit
            </Cta>
            <Cta variant="secondary" onClick={() => toast("Support will email you within one business day.")}>
              Contact support
            </Cta>
          </>
        )}

        {status === "pending" && (
          <Cta variant="secondary" onClick={() => navigate(next)}>
            Leave and come back later
          </Cta>
        )}
      </div>
    </Screen>
  );
}
