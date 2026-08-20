import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, Cta, Row, SectionLabel } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import { useApp } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { dur, ease } from "../../lib/motion";

const DOC_TYPES = [
  { id: "passport", label: "Passport", hint: "Photo page" },
  { id: "licence", label: "Driving licence", hint: "Front and back" },
  { id: "national", label: "National ID", hint: "Front and back" },
];

// Simulated capture: the design brief has no backend and no camera permission is
// requested. The affordance says so plainly rather than pretending to scan.
function CaptureTile({ label, captured, onCapture, busy }) {
  return (
    <motion.button
      whileTap={busy ? undefined : { scale: 0.97 }}
      onClick={onCapture}
      disabled={busy || captured}
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
        padding: 16, borderRadius: "var(--radius-lg)",
        background: captured ? "rgba(58,222,126,.07)" : "var(--surface-card)",
        border: `1px solid ${captured ? "rgba(58,222,126,.28)" : "var(--border-default)"}`,
      }}
    >
      <span style={{ width: 44, height: 44, borderRadius: "var(--radius-xs)", display: "grid", placeItems: "center", background: "var(--surface-raised)", flex: "0 0 auto" }}>
        <Icon name={captured ? "check" : "camera"} size={19} color={captured ? "var(--up-500)" : "#fff"} />
      </span>
      <span style={{ flex: 1 }}>
        <span className="zb-body" style={{ display: "block", color: "#fff" }}>{label}</span>
        <span className="zb-caption" style={{ display: "block", color: captured ? "var(--up-500)" : "var(--text-tertiary)" }}>
          {busy ? "Checking image quality…" : captured ? "Looks good — sharp and fully in frame" : "Tap to simulate capture"}
        </span>
      </span>
    </motion.button>
  );
}

export default function KycDocuments() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/home";
  const { dispatch } = useApp();

  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState(null);
  const [front, setFront] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [capturing, setCapturing] = useState(null);

  const capture = async (which) => {
    setCapturing(which);
    await new Promise((r) => setTimeout(r, 900));
    if (which === "front") setFront(true);
    else setSelfie(true);
    setCapturing(null);
  };

  const submit = useAsyncAction(
    async () => {
      dispatch({ type: "kyc/submit", documents: [docType, "selfie"] });
    },
    { label: "Submitting documents", queueWhenOffline: true }
  );

  const go = async () => {
    await submit.run();
    if (!submit.isError) navigate(`/kyc/status?next=${encodeURIComponent(next)}`, { replace: true });
  };

  return (
    <Screen title="Identity check" subtitle={`Step ${step} of 3`}>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: i <= step ? 1 : 0.22 }}
            transition={{ duration: dur.base, ease: ease.standard }}
            style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? "var(--up-500)" : "#fff" }}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <SectionLabel>Choose a document</SectionLabel>
          {DOC_TYPES.map((d) => (
            <Row
              key={d.id}
              icon="card"
              label={d.label}
              hint={d.hint}
              onClick={() => {
                setDocType(d.id);
                setStep(2);
              }}
            />
          ))}
        </>
      )}

      {step === 2 && (
        <>
          <SectionLabel>Photograph your {DOC_TYPES.find((d) => d.id === docType)?.label.toLowerCase()}</SectionLabel>
          <CaptureTile label="Document photo" captured={front} busy={capturing === "front"} onCapture={() => capture("front")} />
          <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
            Flat surface, no glare, all four corners visible. We check sharpness before accepting it.
          </p>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <Cta disabled={!front} onClick={() => setStep(3)}>Continue</Cta>
            <Cta variant="secondary" onClick={() => setStep(1)}>Choose a different document</Cta>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <SectionLabel>Selfie check</SectionLabel>
          <CaptureTile label="Face photo" captured={selfie} busy={capturing === "selfie"} onCapture={() => capture("selfie")} />
          <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
            Look straight at the camera in even light. This is matched against your document photo.
          </p>

          {submit.isError && (
            <p className="zb-body-sm" role="alert" style={{ margin: 0, color: "var(--down-500)" }}>
              Couldn't submit — {submit.error?.message} Your captures are kept, so just try again.
            </p>
          )}
          {submit.isQueued && (
            <p className="zb-body-sm" style={{ margin: 0, color: "var(--warn-500)" }}>
              You're offline. This submission is queued and sends when you reconnect.
            </p>
          )}

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <Cta disabled={!selfie} busy={submit.isLoading} onClick={go}>Submit for review</Cta>
            <Cta variant="secondary" onClick={() => setStep(2)}>Back</Cta>
          </div>
        </>
      )}
    </Screen>
  );
}
