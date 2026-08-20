import Icon from "../core/Icon";
import { formatPct } from "../../lib/format";
import { useCurrency } from "../../lib/useCurrency";

export default function BalanceHeader({ label = "Total balance", balance, changeAmount, changePct }) {
  const { money, signed } = useCurrency();
  const up = (changePct ?? 0) >= 0;
  return (
    <div>
      <div className="zb-body" style={{ fontSize: 13, lineHeight: "17px", color: "var(--text-secondary)" }}>{label}</div>
      <div className="zb-balance" style={{ color: "#fff", marginTop: 4 }}>{money(balance)}</div>
      {changeAmount != null ? (
        <span
          className="zb-tabular"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            font: "500 13px/1.2 var(--font-core)",
            color: up ? "var(--up-500)" : "var(--down-500)",
            marginTop: 6,
          }}
        >
          <Icon name={up ? "arrow-up" : "arrow-down"} size={13} color={up ? "var(--up-500)" : "var(--down-500)"} />
          {signed(changeAmount).replace("-", "")} ({formatPct(changePct)})
        </span>
      ) : null}
    </div>
  );
}
