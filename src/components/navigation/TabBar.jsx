import { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "../core/Icon";
import { useLiquidGlass } from "../../lib/useLiquidGlass";

const tabs = [
  { to: "/home", icon: "house" },
  { to: "/market", icon: "chart-candlestick" },
  { to: "/swap", icon: "arrow-left-right" },
  { to: "/card", icon: "credit-card" },
  { to: "/social", icon: "users" },
  { to: "/profile", icon: "user" },
];



export default function TabBar() {
  const location = useLocation();
  const glassRef = useLiquidGlass({ scale: -70, chroma: 5, blur: 5, saturate: 1.4, mapBlur: 10, border: 0.12 });
  const [isHolding, setIsHolding] = useState(false);

  const activeIndex = tabs.findIndex(t => location.pathname.startsWith(t.to));
  const index = Math.max(0, activeIndex);

  return (
    <nav
      ref={glassRef}
      style={{
        position: "absolute",
        left: 20, right: 20, bottom: 26,
        height: "var(--tabbar-height)",
        boxSizing: "border-box",
        borderRadius: 999,
        background: "linear-gradient(180deg, rgba(20,28,25,.42) 0%, rgba(12,17,15,.58) 100%)",
        boxShadow: "0 16px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.09)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        zIndex: 20,
      }}
    >
      {/* Sliding Water Drop Indicator */}
      <div style={{ position: "absolute", left: 12, right: 12, top: 0, bottom: 0, display: "flex", pointerEvents: "none", zIndex: 1 }}>
        <motion.div 
          animate={{ x: `${index * 100}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{ 
            flex: `0 0 ${100 / tabs.length}%`, 
            height: "100%", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            position: "relative" 
          }}
        >
        </motion.div>
      </div>

      {/* Normal NavLinks */}
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          style={{ 
            flex: 1, 
            height: 44, 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            position: "relative", 
            zIndex: 2,
            textDecoration: "none"
          }}
        >
          {({ isActive }) => (
            <Icon 
              name={t.icon} 
              size={21} 
              color={isActive ? "#fff" : "rgba(255,255,255,0.4)"} 
            />
          )}
        </NavLink>
      ))}
    </nav>
  );
}
