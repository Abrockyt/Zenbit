import PairSelect from "../forms/PairSelect";

// One side of the swap panel — "You pay" / "You receive". Amount is
// display-only text (typed via AmountPad), matching the source screens.
export default function SwapField({ label, symbol, amount, usdValue, onSelectCoin, editable = false, onAmountChange, muted = false }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        background: "var(--grad-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div className="zb-caption" style={{ color: "var(--text-tertiary)" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {editable ? (
          <input
            value={amount}
            onChange={(e) => onAmountChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            inputMode="decimal"
            className="zb-tabular"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              font: "500 26px/32px var(--font-core)",
              letterSpacing: "-0.7px",
              color: muted ? "var(--text-tertiary)" : "#fff",
            }}
          />
        ) : (
          <span className="zb-tabular" style={{ font: "500 26px/32px var(--font-core)", letterSpacing: "-0.7px", color: muted ? "var(--text-tertiary)" : "#fff" }}>
            {amount}
          </span>
        )}
        <PairSelect symbol={symbol} onClick={onSelectCoin} />
      </div>
      {usdValue != null ? (
        <div className="zb-body-sm" style={{ color: "var(--text-tertiary)", fontSize: 13 }}>{usdValue}</div>
      ) : null}
    </div>
  );
}
