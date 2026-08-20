import { motion } from "framer-motion";
import CoinIcon from "./CoinIcon";
import Icon from "../core/Icon";
import { dur, ease } from "../../lib/motion";
import { formatPct } from "../../lib/format";
import { useCurrency } from "../../lib/useCurrency";

// 60px list row, no dividers — the coin column and tabular figures do the alignment work.
export default function AssetRow({ symbol, name, price, changePct, onClick, holding }) {
  const { money } = useCurrency();
  const up = changePct >= 0;
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ backgroundColor: "var(--state-hover-lift)" }}
      transition={{ duration: dur.fast, ease: ease.standard }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: "var(--list-row-height)",
        width: "100%",
        background: "none",
        border: "none",
        borderRadius: 12,
        padding: "0 4px",
        textAlign: "left",
      }}
    >
      <CoinIcon symbol={symbol} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", font: "500 15px/19px var(--font-core)", color: "#fff" }}>{name}</span>
        <span style={{ display: "block", font: "400 12px/15px var(--font-core)", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
          {holding ? holding : symbol}
        </span>
      </span>
      <span style={{ textAlign: "right" }}>
        <span className="zb-tabular" style={{ display: "block", font: "500 15px/19px var(--font-core)", color: "#fff" }}>
          {money(price)}
        </span>
        <span
          className="zb-tabular"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            font: "500 11px/1.2 var(--font-core)",
            color: up ? "var(--up-500)" : "var(--down-500)",
          }}
        >
          <Icon name={up ? "arrow-up" : "arrow-down"} size={11} color={up ? "var(--up-500)" : "var(--down-500)"} />
          {formatPct(changePct)}
        </span>
      </span>
    </motion.button>
  );
}
