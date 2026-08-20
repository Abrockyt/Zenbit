import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import ScreenHeader from "../components/navigation/ScreenHeader";
import Input from "../components/forms/Input";
import Checkbox from "../components/forms/Checkbox";
import Button from "../components/core/Button";
import { useApp } from "../state/store";
import { screenTransition } from "../lib/motion";

export default function SignUp() {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [email, setEmail] = useState("alex.rivera@gmail.com");
  const [alerts, setAlerts] = useState(true);
  const [loading, setLoading] = useState(false);

  function submit() {
    setLoading(true);
    dispatch({ type: "session/setUser", patch: { email } });
    dispatch({ type: "onboarding/set", patch: { isNewUser: true } });
    dispatch({ type: "settings/setNotification", key: "priceAlerts", value: alerts });
    setTimeout(() => navigate("/verify"), 900);
  }

  return (
    <PhoneFrame>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
        <ScreenHeader title="" />
        <div>
          <div className="zb-title-1" style={{ color: "#fff" }}>Create your account</div>
          <div className="zb-body" style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
            Sign up to hold your assets and discover new opportunities.
          </div>
        </div>
        <Input label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <div style={{ boxSizing: "border-box", borderRadius: "var(--radius-sm)", padding: 14, background: "var(--grad-card)", border: "1px solid var(--border-subtle)" }}>
          <Checkbox
            checked={alerts}
            onChange={setAlerts}
            label="Email me price alerts and product updates. You can turn this off any time."
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          <span style={{ font: "400 12px/1 var(--font-core)", color: "var(--text-tertiary)" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        </div>

        <button 
          onClick={() => {
             dispatch({ type: "session/setUser", patch: { email: "new.user@gmail.com" } });
             dispatch({ type: "onboarding/set", patch: { isNewUser: true } });
             navigate("/create-wallet");
          }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 50, borderRadius: "var(--radius-sm)", background: "#fff", color: "#000", font: "500 15px/1 var(--font-core)", border: "none" }}
        >
          Continue with Google
        </button>

        <div style={{ flex: 1, minHeight: 8 }} />
        <Button onClick={submit} loading={loading} disabled={!email.includes("@")}>Continue</Button>
        <div style={{ textAlign: "center", font: "400 11px/16px var(--font-core)", color: "var(--text-tertiary)" }}>
          By continuing you agree to our Terms and Privacy Policy.
        </div>
      </motion.div>
    </PhoneFrame>
  );
}
