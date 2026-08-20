import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import Button from "../components/core/Button";
import GlassCrystal from "../components/art/GlassCrystal";
import { screenTransition } from "../lib/motion";
import { useLiquidGlass } from "../lib/useLiquidGlass";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <PhoneFrame>
      {/* Full-screen Spline Background */}
      <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
        <iframe 
          src='https://my.spline.design/prismcoin-bUZ2xyGxtROeBvkVK8VdZ5hR/' 
          frameBorder='0' 
          style={{ 
            position: "absolute",
            top: "-15%",
            left: "-5%",
            display: "block", 
            border: "none", 
            outline: "none", 
            width: "130%", 
            height: "140%",
            maxWidth: "none",
            maxHeight: "none"
          }}
        ></iframe>
      </div>

      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", display: "flex", flexDirection: "column", pointerEvents: "none" }}>
        
        {/* Spacer to push text to the bottom and let the 3D coin be visible in the center */}
        <div style={{ flex: 1 }} />

        {/* Text and Actions Area */}
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", padding: "40px 20px 44px", pointerEvents: "auto", background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 25%, #000 100%)" }}>
          
          <div className="zb-title-1" style={{ color: "#fff", marginTop: 8 }}>Your money, your keys</div>
          <div className="zb-body" style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
            Hold, buy, swap and spend crypto — all in one app you control.
          </div>
          
          <div style={{ display: "flex", gap: 6, margin: "20px 0" }}>
            <span style={{ width: 22, height: 6, borderRadius: 3, background: "#fff" }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "rgba(255,255,255,.28)" }} />
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "rgba(255,255,255,.28)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Button onClick={() => navigate("/sign-up")}>Get started</Button>
            <button
              onClick={() => navigate("/login")}
              style={{ background: "none", border: "none", font: "400 13px/18px var(--font-core)", color: "var(--text-secondary)", padding: "10px 0" }}
            >
              I already have an account
            </button>
          </div>
        </div>

      </motion.div>
    </PhoneFrame>
  );
}
