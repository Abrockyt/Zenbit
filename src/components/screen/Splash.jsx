import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import PhoneFrame from "../frames/PhoneFrame";

export default function Splash({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <PhoneFrame statusBar={false} indicator={false}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--surface-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          zIndex: 100
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        >
          <svg width="120" height="120" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="zb-bg" cx="50%" cy="0%" r="85%">
                <stop offset="0%" stop-color="#16302A"/>
                <stop offset="42%" stop-color="#0A1512"/>
                <stop offset="100%" stop-color="#040605"/>
              </radialGradient>
            </defs>
            <motion.rect 
              x="0" y="0" width="240" height="240" rx="54" fill="url(#zb-bg)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />
            <rect x="0.5" y="0.5" width="239" height="239" rx="53.5" fill="none" stroke="rgba(255,255,255,.07)"/>

            <g transform="translate(120,120)">
              <motion.path 
                d="M -38,-42 L 38,-42 L -38,42 L 38,42"
                fill="none" stroke="#193029" strokeWidth="16"
                strokeLinecap="square" strokeLinejoin="miter"
                transform="translate(9,9)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />

              <motion.path 
                d="M -38,-42 L 38,-42 L -38,42 L 38,42"
                fill="none" stroke="#3ADE7E" strokeWidth="16"
                strokeLinecap="square" strokeLinejoin="miter"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              />
            </g>
          </svg>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            style={{
              font: "600 24px/1 var(--font-core)",
              color: "#fff",
              letterSpacing: "-0.5px"
            }}
          >
            Zenbit
          </motion.div>
        </motion.div>
      </motion.div>
    </PhoneFrame>
  );
}
