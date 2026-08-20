// Faux iOS status bar
export default function StatusBar() {
  
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--screen-top-safe)",
        zIndex: 50,
      }}
    >
      <div
        className="zb-status-decor"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 26px",
          pointerEvents: "none",
        }}
      >
        <span className="zb-tabular" style={{ font: "600 15px/1 var(--font-core)", color: "#fff", flex: 1, textAlign: "left" }}>7:42</span>
        
        {/* Dynamic Island Notch */}
        <span style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 120, height: 32, borderRadius: 24, background: "#000" }} />
        
        <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
          {/* iOS Signal */}
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none" style={{ marginTop: 1 }}>
            <rect x="0" y="8" width="3" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>
            <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="rgba(255,255,255,0.4)"/>
            <rect x="10" y="3" width="3" height="9" rx="1" fill="rgba(255,255,255,0.4)"/>
            <rect x="15" y="0" width="3" height="12" rx="1" fill="rgba(255,255,255,0.4)"/>
          </svg>
          <span style={{ font: "600 13px/1 var(--font-core)", color: "#fff", letterSpacing: -0.5 }}>5G+</span>
          {/* iOS Battery (Full) */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect x="0.5" y="0.5" width="23" height="12" rx="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
              <rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/>
              <path d="M25 4.5V8.5C25.5523 8.5 26 8.0523 26 7.5V5.5C26 4.9477 25.5523 4.5 25 4.5Z" fill="rgba(255,255,255,0.4)"/>
            </svg>
          </div>
        </span>
      </div>
    </div>
  );
}
