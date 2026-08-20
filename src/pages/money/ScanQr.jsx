import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, Cta } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";

// A real camera permission prompt would be dishonest in a demo that can't scan,
// so this is an explicitly simulated viewfinder that hands a known address back
// to the Send flow.
const SAMPLE = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export default function ScanQr() {
  const navigate = useNavigate();

  return (
    <Screen title="Scan to send" subtitle="Simulated — no camera is used">
      <div
        style={{
          position: "relative",
          aspectRatio: "1",
          borderRadius: "var(--radius-xl)",
          background: "var(--ink-2)",
          border: "1px solid var(--border-default)",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
        }}
      >
        {[
          { top: 20, left: 20, borderTop: "2px solid #fff", borderLeft: "2px solid #fff", borderRadius: "8px 0 0 0" },
          { top: 20, right: 20, borderTop: "2px solid #fff", borderRight: "2px solid #fff", borderRadius: "0 8px 0 0" },
          { bottom: 20, left: 20, borderBottom: "2px solid #fff", borderLeft: "2px solid #fff", borderRadius: "0 0 0 8px" },
          { bottom: 20, right: 20, borderBottom: "2px solid #fff", borderRight: "2px solid #fff", borderRadius: "0 0 8px 0" },
        ].map((s, i) => (
          <span key={i} style={{ position: "absolute", width: 34, height: 34, opacity: 0.7, ...s }} />
        ))}

        <motion.span
          animate={{ y: [-90, 90, -90] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", left: 30, right: 30, height: 1, background: "var(--up-500)", boxShadow: "0 0 12px rgba(58,222,126,.6)" }}
        />

        <Icon name="qr-code" size={44} color="rgba(255,255,255,.14)" />
      </div>

      <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)", textAlign: "center" }}>
        Point at a wallet QR code. Zenbit reads the address and the amount if the code includes one.
      </p>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <Cta onClick={() => navigate("/send", { state: { address: SAMPLE } })}>Simulate a scan</Cta>
        <Cta variant="secondary" onClick={() => navigate("/send")}>Enter the address instead</Cta>
      </div>
    </Screen>
  );
}
