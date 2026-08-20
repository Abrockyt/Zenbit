import Icon from "../core/Icon";
import SwapField from "./SwapField";

// The two SwapFields plus the flip control between them, laid out with the
// -8px negative margin the source screens use to nest the flip button.
export default function SwapPanel({ from, to, onFlip, onSelectFrom, onSelectTo, onAmountChange }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
      <SwapField label="You pay" symbol={from.symbol} amount={from.amount} usdValue={from.usdValue} editable onAmountChange={onAmountChange} onSelectCoin={onSelectFrom} />
      <div style={{ display: "flex", justifyContent: "center", margin: "-14px 0" }}>
        <button
          onClick={onFlip}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "var(--surface-card-solid)",
            border: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Icon name="arrow-down" size={18} color="var(--up-500)" />
        </button>
      </div>
      <SwapField label="You receive" symbol={to.symbol} amount={to.amount} usdValue={to.usdValue} muted onSelectCoin={onSelectTo} />
    </div>
  );
}
