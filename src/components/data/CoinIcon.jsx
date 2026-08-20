// Official token logos via jsDelivr's cryptocurrency-icons colour set — never
// restyled or redrawn, per the design system's iconography rules.
export default function CoinIcon({ symbol = "generic", size = 34 }) {
  const s = symbol.toLowerCase();
  const src = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${s}.svg`;
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: 999,
        background: "var(--surface-raised)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img
        src={src}
        alt={symbol.toUpperCase()}
        style={{ width: "100%", height: "100%" }}
        onError={(e) => {
          e.currentTarget.src = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/generic.svg";
        }}
      />
    </span>
  );
}
