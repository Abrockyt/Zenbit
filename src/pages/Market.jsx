import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import TabBar from "../components/navigation/TabBar";
import SearchField from "../components/forms/SearchField";
import Chip from "../components/core/Chip";
import AssetRow from "../components/data/AssetRow";
import EmptyState from "../components/feedback/EmptyState";
import { useMarkets, useCoinSearch } from "../data/useCoinGecko";
import { screenTransition, listStagger, listItem } from "../lib/motion";
import { useCurrency } from "../lib/useCurrency";
import { useApp } from "../state/store";

export default function Market() {
  const { currency } = useCurrency();
  const { state: { watchlist } } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const { data: markets, loading, error } = useMarkets(null, { perPage: 40, vs: currency });
  const { data: searchResults, loading: searching } = useCoinSearch(query);

  let rows = markets ?? [];
  if (filter === "Watchlist") rows = rows.filter(c => watchlist.includes(c.id));
  if (filter === "Gainers") rows = [...rows].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  if (filter === "Losers") rows = [...rows].sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));

  const showingSearch = query.trim().length > 0;

  return (
    <PhoneFrame tabBar={<TabBar />}>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 108px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        
        <div className="zb-title-1" style={{ color: "#fff" }}>Market</div>
        <SearchField value={query} onChange={setQuery} />
        {!showingSearch ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["All", "Watchlist", "Gainers", "Losers"].map((f) => (
              <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
            ))}
          </div>
        ) : null}

        {error ? (
          <EmptyState icon="wifi-off" title="Price feed unavailable" message="CoinGecko didn't respond. Pull to refresh or check your connection." />
        ) : showingSearch ? (
          searching ? (
            <div className="zb-body-sm" style={{ color: "var(--text-tertiary)" }}>Searching…</div>
          ) : searchResults.length === 0 ? (
            <EmptyState icon="search-x" title="No results" message={`Nothing matches "${query}".`} />
          ) : (
            <div>
              {searchResults.slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/market/${c.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 12, height: 56, width: "100%", background: "none", border: "none", textAlign: "left" }}
                >
                  <img src={c.large} alt="" style={{ width: 30, height: 30, borderRadius: 999 }} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", font: "500 14px/19px var(--font-core)", color: "#fff" }}>{c.name}</span>
                    <span style={{ display: "block", font: "400 12px/15px var(--font-core)", color: "var(--text-tertiary)", textTransform: "uppercase" }}>{c.symbol}</span>
                  </span>
                </button>
              ))}
            </div>
          )
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 60, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,.045) 0%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.045) 100%)" }} />
            ))}
          </div>
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show">
            {rows.map((c) => (
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
