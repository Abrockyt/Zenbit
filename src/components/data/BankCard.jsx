import zenbitLogo from "../../assets/logo.svg";

export default function BankCard({ name = "Alex Rivera", last4 = "4821", frozen = false }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        width: "100%",
        aspectRatio: "1.586",
        borderRadius: "var(--radius-xl)",
        padding: 20,
        background: "var(--grad-bank-card)",
        border: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        filter: frozen ? "grayscale(1) brightness(0.7)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src={zenbitLogo} alt="Zenbit Pro" style={{ height: 22, width: 22, borderRadius: 6 }} />
        <span className="zb-brand" style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>ZENBIT PRO</span>
      </div>
      <div>
        <div className="zb-mono" style={{ fontSize: 16, color: "#fff", letterSpacing: "2px" }}>•••• •••• •••• {last4}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <span className="zb-label" style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>{name}</span>
          <span className="zb-caption" style={{ color: "rgba(255,255,255,.5)" }}>{frozen ? "Frozen" : "Virtual"}</span>
        </div>
      </div>
    </div>
  );
}
