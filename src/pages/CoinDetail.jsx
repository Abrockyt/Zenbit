import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import PhoneFrame from "../components/frames/PhoneFrame";
import ScreenHeader from "../components/navigation/ScreenHeader";
import IconButton from "../components/core/IconButton";
import Icon from "../components/core/Icon";
import AdvancedChart from "../components/data/AdvancedChart";
import Chip from "../components/core/Chip";
import Button from "../components/core/Button";
import KeyValueList from "../components/data/KeyValueList";
import { useCoinDetail, useCoinChart } from "../data/useCoinGecko";
import { useApp, useToast } from "../state/store";
import { formatPct } from "../lib/format";
import { screenTransition } from "../lib/motion";
import { useCurrency } from "../lib/useCurrency";

const RANGES = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "1Y", days: 365 },
];

export default function CoinDetail() {
  const { currency, money } = useCurrency();
  const [pair, setPair] = useState("USDT");
  const [showDepth, setShowDepth] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [timeMode, setTimeMode] = useState("candle");
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [range, setRange] = useState(1);
  const [activeTab, setActiveTab] = useState("Price");
  const [activeBookTab, setActiveBookTab] = useState("Order Book");
  const [activeIndicator, setActiveIndicator] = useState("MA");

  const watched = state.watchlist.includes(id);
  const { data: coin, loading, error } = useCoinDetail(id);
  const { data: points } = useCoinChart(id, range);

  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const bgOpacity = useTransform(scrollY, [0, 60], [0, 0.7]);
  const blurValue = useTransform(scrollY, [0, 60], ["blur(0px)", "blur(16px)"]);

  const toggleWatch = () => {
    dispatch({ type: "watchlist/toggle", id });
    toast(watched ? `Removed ${coin?.symbol?.toUpperCase() ?? "coin"} from watchlist.` : `Added ${coin?.symbol?.toUpperCase() ?? "coin"} to watchlist.`);
  };

  const price = coin?.market_data?.current_price?.usd;
  const changePct = coin?.market_data?.price_change_percentage_24h ?? 0;
  const up = changePct >= 0;

  return (
    <PhoneFrame tabBar={null}>
      {/* Absolute dark background just for this page */}
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-screen)", zIndex: -1, borderRadius: "calc(var(--radius-phone) - 3px)" }} />
      
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0 }}>
        
        {/* Absolute Header */}
        <motion.div style={{ 
          position: "absolute", 
          top: 0, left: 0, right: 0, 
          zIndex: 30, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          height: 106,
          paddingTop: 54,
          paddingBottom: 10,
          paddingLeft: 20,
          paddingRight: 20,
          background: useTransform(bgOpacity, v => `rgba(8, 16, 12, ${v})`), 
          backdropFilter: blurValue,
          WebkitBackdropFilter: blurValue,
          pointerEvents: "auto"
        }}>
          <IconButton icon="chevron-left" onClick={() => navigate(-1)} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img src={coin?.image?.small} alt="" style={{ width: 24, height: 24, borderRadius: 12 }} />
            <button 
              onClick={() => setPair(p => p === "USDT" ? "USD" : "USDT")} 
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 16, padding: "6px 12px", font: "500 14px/1 var(--font-core)", color: "#fff", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
            >
              {coin?.symbol?.toUpperCase() ?? "—"}/{pair}
              <Icon name="chevron-down" size={14} style={{ opacity: 0.5 }} />
            </button>
          </div>
          <IconButton icon="pin" filled={watched} onClick={toggleWatch} style={{ color: watched ? "var(--warn-500)" : "#fff" }} />
        </motion.div>

        <div ref={scrollRef} style={{ position: "absolute", inset: 0, boxSizing: "border-box", paddingTop: 106, paddingLeft: 20, paddingRight: 20, paddingBottom: 100, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10, paddingTop: 10 }}>
            {["Price", "Info", "Trading Data"].map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t)}
                 style={{ 
                   background: "none", border: "none", padding: 0, cursor: "pointer",
                   color: activeTab === t ? "#fff" : "var(--text-tertiary)", 
                   fontWeight: activeTab === t ? 600 : 500, 
                   borderBottom: activeTab === t ? "2px solid #fff" : "none", 
                   paddingBottom: 10, marginBottom: -11 
                 }}
               >
                 {t}
               </button>
            ))}
          </div>

        {error ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-tertiary)" }}>Couldn't load this coin. Try again shortly.</div>
        ) : loading || !coin ? (
          <div style={{ height: 300, borderRadius: 16, background: "linear-gradient(90deg, rgba(255,255,255,.045) 0%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.045) 100%)" }} />
        ) : (
          <>
            {/* Price and 24h Stats */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="zb-tabular" style={{ font: "600 40px/1 var(--font-core)", color: up ? "var(--up-500)" : "var(--down-500)", letterSpacing: "-1px" }}>
                  {money(price)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ color: "#fff", fontWeight: 500 }}>≈ {money(price)}</span>
                  <span style={{ color: up ? "var(--up-500)" : "var(--down-500)", fontWeight: 500 }}>
                    {up ? "▲" : "▼"} {formatPct(Math.abs(changePct))}
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "4px 16px", fontSize: 12 }}>
                <span style={{ color: "var(--text-tertiary)", textAlign: "right" }}>24h High</span>
                <span style={{ color: "#fff", textAlign: "right" }}>{money(coin.market_data?.high_24h?.[currency])}</span>
                
                <span style={{ color: "var(--text-tertiary)", textAlign: "right" }}>24h Low</span>
                <span style={{ color: "#fff", textAlign: "right" }}>{money(coin.market_data?.low_24h?.[currency])}</span>
                
                <span style={{ color: "var(--text-tertiary)", textAlign: "right" }}>24h Vol</span>
                <span style={{ color: "#fff", textAlign: "right" }}>{(coin.market_data?.total_volume?.[currency] / 1e9).toFixed(2)}B</span>
              </div>
            </div>

            {activeTab === "Price" && (
              <>
                {/* Timeframes */}
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-tertiary)", marginTop: 10, fontWeight: 500, position: "relative" }}>
                  {["Time", "15m", "1H", "4H", "1D", "More", "Depth"].map((t) => {
                    let isActive = false;
                    if (t === "Time" && timeMode === "line" && !showDepth) isActive = true;
                    if (t === "15m" && range === 1 && timeMode === "candle" && !showDepth) isActive = true;
                    if (t === "1H" && range === 7 && timeMode === "candle" && !showDepth) isActive = true;
                    if (t === "4H" && range === 30 && timeMode === "candle" && !showDepth) isActive = true;
                    if (t === "1D" && range === 365 && timeMode === "candle" && !showDepth) isActive = true;
                    if (t === "More" && [3, 90].includes(range) && timeMode === "candle" && !showDepth) isActive = true; // using 7, 30 for 1H, 4H instead of 1W, 1M to avoid conflicts
                    if (t === "Depth" && showDepth) isActive = true;

                    return (
                      <button 
                        key={t}
                        onClick={() => {
                           if (t === "Time") { setTimeMode("line"); setShowDepth(false); setShowMoreMenu(false); }
                           else if (t === "15m") { setRange(1); setTimeMode("candle"); setShowDepth(false); setShowMoreMenu(false); }
                           else if (t === "1H") { setRange(7); setTimeMode("candle"); setShowDepth(false); setShowMoreMenu(false); }
                           else if (t === "4H") { setRange(30); setTimeMode("candle"); setShowDepth(false); setShowMoreMenu(false); }
                           else if (t === "1D") { setRange(365); setTimeMode("candle"); setShowDepth(false); setShowMoreMenu(false); }
                           else if (t === "More") { setShowMoreMenu(prev => !prev); }
                           else if (t === "Depth") { setShowDepth(true); setShowMoreMenu(false); }
                        }}
                        style={{ 
                          background: "none", border: "none", padding: 0, 
                          color: isActive ? "#fff" : "var(--text-tertiary)",
                          cursor: "pointer",
                          position: "relative"
                        }}
                      >
                        {t} {t === "More" && <Icon name="chevron-down" size={10} style={{ marginLeft: 2, display: "inline-block", verticalAlign: "middle" }} />}
                        
                        {t === "More" && showMoreMenu && (
                          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 8, background: "#1C2023", borderRadius: 8, padding: 4, zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            {[ {l:"3D", r:3}, {l:"3M", r:90} ].map(m => (
                              <div 
                                key={m.l}
                                onClick={(e) => { e.stopPropagation(); setRange(m.r); setTimeMode("candle"); setShowDepth(false); setShowMoreMenu(false); }}
                                style={{ padding: "8px 16px", color: range === m.r ? "#fff" : "var(--text-tertiary)", textAlign: "center", borderRadius: 4, background: range === m.r ? "rgba(255,255,255,0.1)" : "transparent" }}
                              >
                                {m.l}
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Chart Area */}
                <div style={{ margin: "8px -20px 0", position: "relative" }}>
                  <AdvancedChart points={points ?? []} height={290} indicator={activeIndicator} timeMode={timeMode} showDepth={showDepth} />
                </div>

                {/* Chart Indicators */}
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-tertiary)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10 }}>
                  {["MA", "EMA", "BOLL", "SAR", "AVL", "MACD"].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setActiveIndicator(activeIndicator === t ? null : t)}
                      style={{ 
                        background: "none", border: "none", padding: 0, 
                        color: activeIndicator === t ? "#fff" : "var(--text-tertiary)",
                        fontWeight: activeIndicator === t ? 600 : 500,
                        cursor: "pointer"
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Order Book */}
                <div>
                  <div style={{ display: "flex", gap: 20, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
                    {["Order Book", "Trades"].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActiveBookTab(t)}
                        style={{ 
                          background: "none", border: "none", padding: 0, cursor: "pointer",
                          color: activeBookTab === t ? "#fff" : "var(--text-tertiary)", 
                          borderBottom: activeBookTab === t ? "2px solid #fff" : "none", 
                          paddingBottom: 4 
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  
                  {activeBookTab === "Order Book" ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>
                        <span>Price (USDT)</span>
                        <span>Amount ({coin.symbol?.toUpperCase()})</span>
                      </div>

                      {/* Fake Order Book rows (Sell / Red) */}
                      {[4, 3, 2, 1].map((i) => (
                        <div key={`sell-${i}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, position: "relative" }}>
                          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${20 + i * 15}%`, background: "rgba(242, 80, 75, 0.15)" }} />
                          <span style={{ color: "var(--down-500)", position: "relative" }}>{(price * (1 + 0.001 * i)).toFixed(2)}</span>
                          <span style={{ color: "#fff", position: "relative" }}>{(Math.random() * 5).toFixed(3)}</span>
                        </div>
                      ))}
                      
                      <div style={{ margin: "10px 0", fontSize: 18, color: up ? "var(--up-500)" : "var(--down-500)", fontWeight: 600 }}>
                        {money(price)}
                      </div>

                      {/* Fake Order Book rows (Buy / Green) */}
                      {[1, 2, 3, 4].map((i) => (
                        <div key={`buy-${i}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, position: "relative" }}>
                          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${20 + i * 15}%`, background: "rgba(58, 222, 126, 0.15)" }} />
                          <span style={{ color: "var(--up-500)", position: "relative" }}>{(price * (1 - 0.001 * i)).toFixed(2)}</span>
                          <span style={{ color: "#fff", position: "relative" }}>{(Math.random() * 5).toFixed(3)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ padding: "0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>
                        <span style={{ width: 80 }}>Time</span>
                        <span style={{ flex: 1, textAlign: "right" }}>Price (USDT)</span>
                        <span style={{ flex: 1, textAlign: "right" }}>Amount</span>
                      </div>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                        const isBuy = Math.random() > 0.5;
                        const time = new Date(Date.now() - i * 1000 * 15).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        return (
                          <div key={`trade-${i}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0" }}>
                            <span style={{ color: "var(--text-tertiary)", width: 80 }}>{time}</span>
                            <span style={{ color: isBuy ? "var(--up-500)" : "var(--down-500)", flex: 1, textAlign: "right", fontWeight: 500 }}>
                              {(price * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2)}
                            </span>
                            <span style={{ color: "#fff", flex: 1, textAlign: "right" }}>
                              {(Math.random() * 2).toFixed(4)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "Info" && (
              <div style={{ padding: "20px 0", color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 16px 0" }}>
                  {coin.name} ({coin.symbol?.toUpperCase()}) is a digital asset. 
                  Market cap is ranked #{coin.market_cap_rank}.
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Market Cap</span>
                  <span style={{ color: "#fff" }}>{money(coin.market_data?.market_cap?.[currency])}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Circulating Supply</span>
                  <span style={{ color: "#fff" }}>{coin.market_data?.circulating_supply?.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>All Time High</span>
                  <span style={{ color: "#fff" }}>{money(price * 1.2)}</span>
                </div>
              </div>
            )}

            {activeTab === "Trading Data" && (
              <div style={{ padding: "10px 0", color: "var(--text-secondary)", fontSize: 14 }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "var(--text-tertiary)" }}>Long/Short Ratio (24h)</span>
                    <span style={{ color: "#fff" }}>1.24</span>
                  </div>
                  <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ flex: 55, background: "var(--up-500)" }} />
                    <div style={{ flex: 45, background: "var(--down-500)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 }}>
                    <span style={{ color: "var(--up-500)" }}>Long 55%</span>
                    <span style={{ color: "var(--down-500)" }}>Short 45%</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Taker Buy Vol</span>
                  <span style={{ color: "var(--up-500)" }}>45.2M USDT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Taker Sell Vol</span>
                  <span style={{ color: "var(--down-500)" }}>41.8M USDT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Funding Rate</span>
                  <span style={{ color: "#F5B544" }}>0.0100%</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </motion.div>
      {/* Binance-style Fixed Bottom Bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, 
        padding: "20px 20px 34px", 
        background: "linear-gradient(180deg, rgba(5,8,7,0) 0%, rgba(5,8,7,0.95) 40%, #050807 100%)",
        display: "flex", gap: 12, zIndex: 10 
      }}>
        <Button variant="buy" onClick={() => navigate("/buy")} style={{
          background: "#0D2E1C",
          border: "none",
          color: "var(--up-500)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          boxShadow: "none"
        }}>Buy</Button>
        <Button variant="sell" onClick={() => navigate("/sell")} style={{
          background: "#2E1515",
          border: "none",
          color: "var(--down-500)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          boxShadow: "none"
        }}>Sell</Button>
      </div>
    </PhoneFrame>
  );
}
