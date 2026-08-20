import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import PhoneFrame from "../frames/PhoneFrame";

export default function Splash({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // 2.5 seconds loading screen
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
          <svg width="80" height="80" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="var(--up-500)"
              strokeWidth="4"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <motion.path
              d="M35,65 L50,35 L65,65 M40,55 L60,55"
              stroke="#fff"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
            />
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
