import { motion } from "framer-motion";

// A slow, subtle drift behind the dashboard hero — not a loud "AI slop" blob,
// just the brand's own forest-green wash breathing very gently so the hero
// doesn't sit static. Absolutely positioned behind its parent's content;
// the parent needs `position: relative`.
export default function HeroGradient() {
  return (
    <motion.div
      aria-hidden="true"
      animate={{
        background: [
          "radial-gradient(120% 90% at 30% -10%, rgba(58,222,126,.16) 0%, transparent 60%)",
          "radial-gradient(120% 90% at 70% -10%, rgba(58,222,126,.20) 0%, transparent 60%)",
          "radial-gradient(120% 90% at 30% -10%, rgba(58,222,126,.16) 0%, transparent 60%)",
        ],
      }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        top: -40,
        left: -20,
        right: -20,
        height: 280,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
