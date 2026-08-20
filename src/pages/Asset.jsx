import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import TabBar from "../components/navigation/TabBar";
import BalanceHeader from "../components/data/BalanceHeader";
import AssetRow from "../components/data/AssetRow";
import { useMarkets } from "../data/useCoinGecko";
import EmptyState from "../components/feedback/EmptyState";
import { useApp } from "../state/store";
import { screenTransition, listStagger, listItem } from "../lib/motion";
import { useCurrency } from "../lib/useCurrency";

export default function Asset() {
  const { currency, money } = useCurrency();
  const navigate = useNavigate();
  const { state } = useApp();
  const holdings = state.wallet.holdings;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets, loading } = useMarkets(ids, { vs: currency });

  const priced = holdings.map((h) => {
    const m = markets?.find((x) => x.id === h.id);
    const price = m?.current_price ?? 0;
    return { ...h, price, value: price * h.units, changePct: m?.price_change_percentage_24h ?? 0 };
  });
  const total = priced.reduce((s, h) => s + h.value, 0);
  const totalChangeAmount = priced.reduce((s, h) => s + (h.value * (h.changePct ?? 0)) / 100, 0);
  const totalChangePct = total ? (totalChangeAmount / (total - totalChangeAmount)) * 100 : 0;

  return (
    <PhoneFrame tabBar={<TabBar />}>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 108px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
        <div className="zb-title-1" style={{ color: "#fff" }}>Your assets</div>
        <BalanceHeader label="Assets balance" balance={loading ? null : total} changeAmount={loading ? null : totalChangeAmount} changePct={loading ? null : totalChangePct} />

        {holdings.length === 0 ? (
          <EmptyState icon="wallet" title="Nothing yet" message="Buy or receive your first asset to see it here." actionLabel="Buy crypto" onAction={() => navigate("/buy")} />
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 60, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,.045) 0%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.045) 100%)" }} />
            ))}
          </div>
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show">
            {priced.map((h) => (
              <motion.div key={h.id} variants={listItem}>
                <AssetRow
                  symbol={h.symbol}
                  name={h.name}
                  price={h.price}
                  changePct={h.changePct}
                  holding={`${h.units} ${h.symbol.toUpperCase()}`}
                  onClick={() => navigate(`/market/${h.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </PhoneFrame>
  );
}
