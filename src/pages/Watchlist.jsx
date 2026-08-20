import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import ScreenHeader from "../components/navigation/ScreenHeader";
import AssetRow from "../components/data/AssetRow";
import EmptyState from "../components/feedback/EmptyState";
import { useMarkets } from "../data/useCoinGecko";
import { useApp } from "../state/store";
import { screenTransition, listStagger, listItem } from "../lib/motion";
import { useCurrency } from "../lib/useCurrency";

export default function Watchlist() {
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { state } = useApp();
  const { data: markets, loading } = useMarkets(state.watchlist, { vs: currency });

  return (
    <PhoneFrame>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 40px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        <ScreenHeader title="Watchlist" />
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 60, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,.045) 0%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.045) 100%)" }} />
            ))}
          </div>
        ) : !markets?.length ? (
          <EmptyState icon="pin" title="No coins pinned" message="Pin a coin on its detail page to track it here." actionLabel="Browse market" onAction={() => navigate("/market")} />
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show">
            {markets.map((c) => (
              <motion.div key={c.id} variants={listItem}>
                <AssetRow
                  symbol={c.symbol}
                  name={c.name}
                  price={c.current_price}
                  changePct={c.price_change_percentage_24h ?? 0}
                  onClick={() => navigate(`/market/${c.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </PhoneFrame>
  );
}
