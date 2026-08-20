import Icon from "../core/Icon";
import CoinIcon from "../data/CoinIcon";

// Coin selector trigger used inside SwapField — opens a Sheet with the full
// asset list elsewhere in the flow; this is just the closed/collapsed state.
export default function PairSelect({ symbol, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px 6px 6px",
        borderRadius: "var(--radius-pill)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border-default)",
        flex: "0 0 auto",
      }}
    >
      <CoinIcon symbol={symbol} size={24} />
      <span style={{ font: "500 14px/1 var(--font-core)", color: "#fff", textTransform: "uppercase" }}>{symbol}</span>
      <Icon name="chevron-down" size={14} color="var(--text-tertiary)" />
    </button>
  );
}
