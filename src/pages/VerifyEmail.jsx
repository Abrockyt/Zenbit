import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import ScreenHeader from "../components/navigation/ScreenHeader";
import OTPInput from "../components/forms/OTPInput";
import Button from "../components/core/Button";
import Icon from "../components/core/Icon";
import { useApp, useToast } from "../state/store";
import { screenTransition, tapScale } from "../lib/motion";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// There's no real inbox behind this demo, so the previous version asked for a
// six-digit code that was never shown anywhere — an unsolvable puzzle, which
// is exactly the "sign-up nobody can get through" complaint. The fix isn't to
// skip verification (it's a real step in the flow diagram); it's to make the
// demo honestly show the code a real email would have delivered, the way a
// test/staging build of a real product does.
export default function VerifyEmail() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const email = state.session.user?.email ?? "your email";

  const [otp, setOtp] = useState(generateOtp);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function submit() {
    if (code.length !== 6) {
      setError(true);
      return;
    }
    if (code !== otp) {
      setError(true);
      return;
    }
    setError(false);
    dispatch({ type: "onboarding/set", patch: { emailVerified: true } });
    navigate("/create-wallet");
  }

  function resend() {
    if (cooldown > 0) return;
    setOtp(generateOtp());
    setCode("");
    setError(false);
    setRevealed(false);
    setCooldown(30);
    toast(`New code sent to ${email}.`);
  }

  return (
    <PhoneFrame>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        <ScreenHeader title="" />
        <div>
          <div className="zb-title-1" style={{ color: "#fff" }}>Enter your code</div>
          <div className="zb-body" style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
            We sent a 6-digit code to <span style={{ color: "#fff" }}>{email}</span>.
          </div>
        </div>

        <OTPInput length={6} value={code} onChange={(v) => { setCode(v); setError(false); }} error={error} />
        {error ? (
          <div className="zb-body-sm" style={{ color: "var(--down-500)", fontSize: 12.5 }}>That code didn't match. Check it and try again.</div>
        ) : null}

        {/* Demo-mode reveal — labelled honestly as a stand-in for the inbox
            this build has no way to actually send to. */}
        <motion.button
          whileTap={tapScale}
          onClick={() => setRevealed((r) => !r)}
          style={{
            display: "flex", alignItems: "center", gap: 10, textAlign: "left",
            padding: 14, borderRadius: "var(--radius-md)",
            background: "rgba(91,140,255,.08)", border: "1px solid rgba(91,140,255,.22)",
          }}
        >
          <Icon name="shield" size={16} color="var(--info-500)" />
          <span style={{ flex: 1 }}>
            <span className="zb-body-sm" style={{ display: "block", color: "var(--info-500)" }}>
              Demo build — no real email is sent
            </span>
            <span className="zb-caption" style={{ display: "block", color: "var(--text-secondary)", marginTop: 2 }}>
              {revealed ? `Your code is ${otp.split("").join(" ")}` : "Tap to reveal the code"}
            </span>
          </span>
        </motion.button>

        <button
          onClick={resend}
          disabled={cooldown > 0}
          style={{ background: "none", border: "none", textAlign: "left", font: "400 13px/18px var(--font-core)", color: cooldown > 0 ? "var(--text-tertiary)" : "var(--up-500)" }}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>

        <div style={{ flex: 1, minHeight: 8 }} />
        <Button onClick={submit} disabled={code.length !== 6}>Continue</Button>
      </motion.div>
    </PhoneFrame>
  );
}
