import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import TabBar from "../components/navigation/TabBar";
import IconButton from "../components/core/IconButton";
import ActionTile from "../components/core/ActionTile";
import Avatar from "../components/core/Avatar";
import SectionHeader from "../components/navigation/SectionHeader";
import TransactionRow from "../components/data/TransactionRow";
import Icon from "../components/core/Icon";
import { useMarkets } from "../data/useCoinGecko";
import { screenTransition, listStagger, listItem } from "../lib/motion";
import HeroGradient from "../components/art/HeroGradient";
import { useApp } from "../state/store";
import { useCurrency } from "../lib/useCurrency";
import CoinIcon from "../components/data/CoinIcon";
import { formatPct } from "../lib/format";
import { useLiquidGlass } from "../lib/useLiquidGlass";
import SegmentedControl from "../components/forms/SegmentedControl";
import Sheet from "../components/feedback/Sheet";

export default function Home() {
  const { currency, money } = useCurrency();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const [marketTab, setMarketTab] = useState("top");
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const { state, dispatch } = useApp();
  const user = state.session.user;

  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const bgOpacity = useTransform(scrollY, [0, 40], [0, 0.45]);
  const blurValue = useTransform(scrollY, [0, 40], ["blur(0px)", "blur(24px)"]);
  const borderOpacity = useTransform(scrollY, [0, 40], [0, 0.08]);

  const holdings = state.wallet.holdings;
  const transactions = state.wallet.transactions;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets, loading } = useMarkets(null, { vs: currency });

  const priced = holdings.map((h) => {
    const m = markets?.find((x) => x.id === h.id);
    const price = m?.current_price ?? 0;
    return { ...h, price, value: price * h.units, changePct: m?.price_change_percentage_24h ?? 0 };
  });
  const total = priced.reduce((s, h) => s + h.value, 0);

  let tabRows = markets ?? [];
  if (marketTab === "watchlist") {
    tabRows = tabRows.filter(c => state.watchlist.includes(c.id));
  }
  tabRows = tabRows.slice(0, 10);
  const totalChangeAmount = priced.reduce((s, h) => s + (h.value * (h.changePct ?? 0)) / 100, 0);
  const totalChangePct = total ? (totalChangeAmount / (total - totalChangeAmount)) * 100 : 0;
  const isPositive = totalChangeAmount >= 0;

  const unreadNotifs = state.wallet.transactions.filter((t) => t.status === "pending").length;
  const kycApproved = state.kyc.status === "approved";
  const cardActive = state.card.ordered && !state.card.activating;
  const kycGlassRef = useLiquidGlass({ scale: -70, chroma: 5, blur: 5, saturate: 1.4, mapBlur: 10, border: 0.12 });
  const cardGlassRef = useLiquidGlass({ scale: -70, chroma: 5, blur: 5, saturate: 1.4, mapBlur: 10, border: 0.12 });

  return (
    <PhoneFrame tabBar={<TabBar />}>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0 }}>
        
        {/* Absolute Header (Immune to sticky bugs) */}
        <motion.div style={{ 
          position: "absolute", 
          top: 0, left: 0, right: 0,
          zIndex: 30, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          height: 106,
          paddingTop: 54,
          paddingBottom: 12,
          paddingLeft: 20,
          paddingRight: 20,
          background: useTransform(bgOpacity, v => `rgba(10, 15, 13, ${v})`),
          backdropFilter: blurValue,
          WebkitBackdropFilter: blurValue,
          borderBottom: useTransform(borderOpacity, v => `0.5px solid rgba(255,255,255,${v})`),
          pointerEvents: "auto"
        }}>
          <button 
            onClick={() => navigate("/profile")} 
            style={{ 
              display: "flex", alignItems: "center", gap: 10, 
              background: "rgba(255,255,255,0.03)", 
              border: "1px solid rgba(255,255,255,0.08)", 
              padding: "4px 14px 4px 4px", 
              borderRadius: 999,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
          >
            <Avatar 
              src="https://i.pravatar.cc/150?img=68" 
              size={28} 
            />
            <span style={{ display: "block", font: "500 14px/1 var(--font-core)", color: "#fff" }}>
              {user.name.split(" ")[0].toLowerCase()}crypto
            </span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconButton icon="bell" badge={unreadNotifs > 0} onClick={() => navigate("/activity")} style={{ background: "rgba(255,255,255,0.06)" }} />
            <IconButton icon="search" onClick={() => navigate("/market")} style={{ background: "rgba(255,255,255,0.06)" }} />
            <button 
              onClick={() => navigate("/zen-ai")} 
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "none", color: "var(--text-secondary)", fontWeight: 500, fontSize: 13 }}
            >
              AI
            </button>
          </div>
        </motion.div>

        {/* Scrollable Content Container */}
        <div ref={scrollRef} style={{ position: "absolute", inset: 0, boxSizing: "border-box", paddingTop: 106, paddingLeft: 20, paddingRight: 20, paddingBottom: 108, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 12 }}>
            <div>
              <div style={{ font: "400 15px/1 var(--font-core)", color: "var(--text-secondary)", marginBottom: 12 }}>Total balance</div>
              <div className="zb-tabular" style={{ font: "500 40px/1 var(--font-core)", background: "linear-gradient(180deg, #FFFFFF 0%, #A0A5A3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px" }}>
                {loading ? "..." : money(total)}
              </div>
              <div className="zb-tabular" style={{ font: "500 13px/1 var(--font-core)", color: isPositive ? "var(--up-500)" : "var(--down-500)", marginTop: 10 }}>
                {loading ? "0.00" : `${isPositive ? "+" : ""}${money(totalChangeAmount)} (${isPositive ? "+" : ""}${formatPct(totalChangePct)})`}
              </div>
            </div>
            <button onClick={() => setCurrencySheetOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 999, padding: "8px 12px", color: "var(--text-secondary)", font: "400 13px/1 var(--font-core)", cursor: "pointer" }}>
              {currency.toUpperCase()} <Icon name="chevron-down" size={14} color="var(--text-secondary)" />
            </button>
          </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
          <ActionTile icon="plus" label="Deposit" onClick={() => navigate("/add-funds")} />
          <ActionTile icon="arrow-up" label="Send" onClick={() => navigate("/send")} />
          <ActionTile icon="arrow-down" label="Receive" onClick={() => navigate("/receive")} />
          <ActionTile icon="arrow-left-right" label="Swap" onClick={() => navigate("/swap")} />
          <ActionTile icon="clock" label="History" onClick={() => navigate("/activity")} />
        </div>

        {!kycApproved && (
          <button
            ref={kycGlassRef}
            onClick={() => navigate("/kyc?next=/home")}
            style={{
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              padding: 14, borderRadius: "var(--radius-xl)", 
              background: "linear-gradient(180deg, rgba(20,28,25,.42) 0%, rgba(12,17,15,.58) 100%)", 
              boxShadow: "0 16px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.09)",
              border: "none",
            }}
          >
            <span style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(245,181,68,.14)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <Icon name="shield" size={17} color="var(--warn-500)" filled={true} />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", font: "500 14px/18px var(--font-core)", color: "#fff" }}>Verify your identity</span>
              <span style={{ display: "block", font: "400 12px/16px var(--font-core)", color: "var(--text-tertiary)" }}>Unlocks Buy, Sell and the card</span>
            </span>
            <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
          </button>
        )}

        {cardActive && (
          <button
            ref={cardGlassRef}
            onClick={() => navigate("/card")}
            style={{ 
              display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 14, borderRadius: "var(--radius-xl)", 
              background: "linear-gradient(180deg, rgba(20,28,25,.42) 0%, rgba(12,17,15,.58) 100%)", 
              boxShadow: "0 16px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.09)",
              border: "none" 
            }}
          >
            <span style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <Icon name="card" size={18} color="#fff" filled={true} />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", font: "500 14px/18px var(--font-core)", color: "#fff" }}>Card •• {state.card.last4}</span>
              <span style={{ display: "block", font: "400 12px/16px var(--font-core)", color: "rgba(255,255,255,.55)" }}>{money(state.card.balance)} available</span>
            </span>
            <Icon name="chevron-right" size={16} color="rgba(255,255,255,.55)" />
          </button>
        )}

        <div>
          <div style={{ marginBottom: 12 }}>
            <SegmentedControl 
              options={[{ label: "Top Coin", value: "top" }, { label: "Watchlist", value: "watchlist" }]} 
              value={marketTab} 
              onChange={setMarketTab} 
            />
          </div>
          {tabRows.length === 0 ? (
            <p className="zb-body-sm" style={{ margin: "8px 0 0", color: "var(--text-tertiary)" }}>Nothing to show.</p>
          ) : (
            <motion.div variants={listStagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", marginTop: 6 }}>
              {tabRows.map((h) => (
                <motion.button
                  key={h.id}
                  variants={listItem}
                  onClick={() => navigate(`/market/${h.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 12, height: 56, background: "none", border: "none", textAlign: "left" }}
                >
                  <CoinIcon symbol={h.symbol} size={36} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, font: "500 14px/19px var(--font-core)", color: "#fff" }}>
                      {h.name}
                      {state.watchlist?.includes(h.id) && <Icon name="pin" size={10} color="var(--warn-500)" style={{ flex: "0 0 auto", transform: "rotate(45deg)" }} />}
                    </span>
                    <span style={{ display: "block", font: "400 12px/15px var(--font-core)", color: "var(--text-tertiary)" }}>{h.symbol.toUpperCase()}</span>
                  </span>
                  <span className="zb-tabular" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", font: "500 14px/19px var(--font-core)", color: "#fff" }}>
                    <span>{loading ? "…" : money(h.current_price)}</span>
                    <span style={{ color: h.price_change_percentage_24h >= 0 ? "var(--up-500)" : "var(--down-500)", fontSize: 13 }}>
                      {h.price_change_percentage_24h >= 0 ? "↑" : "↓"} {Math.abs(h.price_change_percentage_24h ?? 0).toFixed(2)}%
                    </span>
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        <div>
          <SectionHeader title="Recent activity" action="View all" onAction={() => navigate("/activity")} />
          <div style={{ marginTop: 4 }}>
            {transactions.length === 0 ? (
              <p className="zb-body-sm" style={{ margin: "8px 0 0", color: "var(--text-tertiary)" }}>Nothing yet.</p>
            ) : (
              transactions.slice(0, 4).map((t) => (
                <button key={t.id} onClick={() => navigate(`/activity/${t.id}`)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, textAlign: "left" }}>
                  <TransactionRow {...t} />
                </button>
              ))
            )}
          </div>
        </div>
        </div>
      </motion.div>
      <Sheet open={currencySheetOpen} onClose={() => setCurrencySheetOpen(false)} title="Display Currency">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { id: "usd", label: "USD - US Dollar" },
            { id: "eur", label: "EUR - Euro" },
            { id: "gbp", label: "GBP - British Pound" },
            { id: "jpy", label: "JPY - Japanese Yen" },
            { id: "aed", label: "AED - UAE Dirham" },
            { id: "inr", label: "INR - Indian Rupee" }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                dispatch({ type: "settings/set", patch: { currency: c.id } });
                setCurrencySheetOpen(false);
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px", borderRadius: "var(--radius-lg)",
                background: currency === c.id ? "rgba(255,255,255,0.1)" : "var(--surface-card)",
                border: `1px solid ${currency === c.id ? "var(--border-strong)" : "var(--border-subtle)"}`,
                color: "#fff", font: "500 15px/1 var(--font-core)", cursor: "pointer"
              }}
            >
              {c.label}
              {currency === c.id && <Icon name="check" size={16} color="var(--up-500)" />}
            </button>
          ))}
        </div>
      </Sheet>
    </PhoneFrame>
  );
}
