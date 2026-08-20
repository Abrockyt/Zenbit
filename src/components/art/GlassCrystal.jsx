import { motion } from "framer-motion";

// A faceted glass crystal for the Welcome hero — the reference brief for this
// screen (an earlier Zenbit exploration) used a real-time 3D render; there's
// no WebGL/3D pipeline wired into this build, so this stands in for it as a
// layered SVG: eight facets each get their own gradient and opacity to fake
// refraction, plus a soft floor reflection and a slow drift/rotation loop.
// It reads as dimensional at a glance without pulling in a 3D runtime for one
// hero image.
export default function GlassCrystal({ size = 200 }) {
  return (
    <div style={{ position: "relative", width: size, height: size * 1.15, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 2.5, 0, -2.5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 30px 40px rgba(58,222,126,.16)) drop-shadow(0 8px 16px rgba(0,0,0,.5))" }}
      >
        <svg width={size} height={size} viewBox="0 0 200 200" fill="none" role="img" aria-label="">
          <defs>
            <linearGradient id="gc-left" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e8fff2" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3ADE7E" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="gc-right" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cbe8dc" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0b1512" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="gc-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3ADE7E" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="gc-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#193029" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#040605" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* back facets */}
          <path d="M100 14 L162 78 L100 100 Z" fill="url(#gc-right)" stroke="rgba(255,255,255,.25)" strokeWidth="0.75" />
          <path d="M100 14 L38 78 L100 100 Z" fill="url(#gc-left)" stroke="rgba(255,255,255,.4)" strokeWidth="0.75" />
          {/* lower facets */}
          <path d="M38 78 L100 100 L100 178 Z" fill="url(#gc-base)" stroke="rgba(255,255,255,.15)" strokeWidth="0.75" />
          <path d="M162 78 L100 100 L100 178 Z" fill="url(#gc-base)" stroke="rgba(255,255,255,.08)" strokeWidth="0.75" />
          {/* front highlight facet */}
          <path d="M100 40 L128 82 L100 118 L72 82 Z" fill="url(#gc-front)" stroke="rgba(255,255,255,.5)" strokeWidth="1" />
          {/* top spark */}
          <path d="M100 14 L106 30 L100 40 L94 30 Z" fill="#ffffff" fillOpacity="0.9" />
        </svg>
      </motion.div>

      {/* floor reflection */}
      <motion.div
        animate={{ opacity: [0.5, 0.3, 0.5], scaleX: [1, 0.92, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 6,
          width: size * 0.5,
          height: 10,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(58,222,126,.35), transparent 75%)",
          filter: "blur(2px)",
        }}
      />
    </div>
  );
}
