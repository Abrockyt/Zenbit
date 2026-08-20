export default function KeyValueList({ rows = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="zb-body-sm" style={{ color: "var(--text-tertiary)", fontSize: 13 }}>{r.label}</span>
          <span
            className={r.mono ? "zb-mono" : "zb-tabular"}
            style={{ font: "500 13px/18px var(--font-core)", color: r.tone === "up" ? "var(--up-500)" : r.tone === "down" ? "var(--down-500)" : "#fff" }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
