import Icon from "../core/Icon";
import { useCurrency } from "../../lib/useCurrency";

const kindIcon = {
  send: "arrow-up",
  receive: "arrow-down",
  swap: "arrow-left-right",
  buy: "plus",
  card: "credit-card",
};

export default function TransactionRow({ kind = "send", title, subtitle, amount, negative, merchant, status }) {
  const { signed } = useCurrency();
  const tone = status === "failed" ? "var(--down-500)" : status === "pending" ? "var(--warn-500)" : "var(--text-tertiary)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: "var(--list-row-height)",
        padding: "0 4px",
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: "var(--surface-raised)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          overflow: "hidden",
        }}
      >
        {merchant ? (
          <img
            src={`https://cdn.simpleicons.org/${merchant}/ffffff`}
            alt=""
            style={{ width: 16, height: 16 }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <Icon name={kindIcon[kind] || "arrow-up"} size={16} color="var(--text-secondary)" />
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", font: "500 15px/19px var(--font-core)", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </span>
        <span style={{ display: "block", font: "400 12px/15px var(--font-core)", color: tone }}>{subtitle}</span>
      </span>
      <span className="zb-tabular" style={{ font: "500 15px/19px var(--font-core)", color: negative ? "#fff" : "var(--up-500)" }}>
        {negative ? "-" : "+"}
        {signed(amount).replace("-", "")}
      </span>
    </div>
  );
}
