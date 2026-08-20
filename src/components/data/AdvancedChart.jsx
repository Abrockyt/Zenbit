import { useMemo, useRef, useState, useEffect } from "react";
import { useCurrency } from "../../lib/useCurrency";

function calcMA(pts, period) {
  return pts.map((_, i, a) => {
    if (i < period - 1) return null;
    let s = 0;
    for (let j = 0; j < period; j++) s += a[i - j];
    return s / period;
  });
}

function calcEMA(pts, period) {
  const k = 2 / (period + 1);
  let prev = pts[0];
  return pts.map((p, i) => {
    if (i === 0) return null;
    prev = p * k + prev * (1 - k);
    return i < period - 1 ? null : prev;
  });
}

function calcBOLL(pts, period, mult = 2) {
  const ma = calcMA(pts, period);
  const upper = [], lower = [];
  pts.forEach((_, i) => {
    if (i < period - 1) { upper.push(null); lower.push(null); return; }
    const mean = ma[i];
    const std = Math.sqrt(pts.slice(i - period + 1, i + 1).reduce((s, v) => s + (v - mean) ** 2, 0) / period);
    upper.push(mean + mult * std);
    lower.push(mean - mult * std);
  });
  return { upper, lower, ma };
}

function calcSAR(candles) {
  const sar = [];
  let isLong = true;
  let ep = candles[0]?.high || 0;
  let af = 0.02;
  let currentSar = candles[0]?.low || 0;
  candles.forEach((c, i) => {
    if (i === 0) { sar.push(null); return; }
    let nextSar = currentSar + af * (ep - currentSar);
    if (isLong) {
      if (c.low < nextSar) { isLong = false; nextSar = ep; ep = c.low; af = 0.02; }
      else { if (c.high > ep) { ep = c.high; af = Math.min(0.2, af + 0.02); } }
    } else {
      if (c.high > nextSar) { isLong = true; nextSar = ep; ep = c.high; af = 0.02; }
      else { if (c.low < ep) { ep = c.low; af = Math.min(0.2, af + 0.02); } }
    }
    currentSar = nextSar;
    sar.push(nextSar);
  });
  return sar;
}

function calcAVL(candles) {
  const avl = [];
  let sumPv = 0, sumV = 0;
  candles.forEach((c) => {
    const typ = (c.high + c.low + c.close) / 3;
    sumPv += typ * c.volume;
    sumV += c.volume;
    avl.push(sumPv / (sumV || 1));
  });
  return avl;
}

function calcMACD(pts) {
  const ema12 = calcEMA(pts, 12);
  const ema26 = calcEMA(pts, 26);
  const macd = pts.map((_, i) => (ema12[i] !== null && ema26[i] !== null) ? ema12[i] - ema26[i] : null);
  const k = 2 / (9 + 1);
  let prev = macd.find(x => x !== null);
  const signal = macd.map((m) => {
    if (m === null) return null;
    if (prev === undefined) prev = m;
    prev = m * k + prev * (1 - k);
    return prev;
  });
  const hist = macd.map((m, i) => m !== null && signal[i] !== null ? m - signal[i] : null);
  return { macd, signal, hist };
}

function seededRand(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function buildCandles(pts) {
  return pts.map((p, i) => {
    const open = i === 0 ? p * 0.9995 : pts[i - 1];
    const close = p;
    const isUp = close >= open;
    const bodyH = Math.abs(close - open) || p * 0.0005;
    return {
      open, close, isUp,
      high: Math.max(open, close) + bodyH * (seededRand(i * 2) * 1.5 + 0.2),
      low:  Math.min(open, close) - bodyH * (seededRand(i * 2 + 1) * 1.5 + 0.2),
      volume: seededRand(i * 3 + 100) * 100 + 20,
    };
  });
}

const IND_H     = 18;
const TIME_H    = 20;
const VLBL_H    = 16;
const RPAD      = 50;
const VOL_RATIO = 0.18;

export default function AdvancedChart({ points = [], indicator, height = 280, timeMode = "candle", showDepth = false }) {
  const { money } = useCurrency();
  const svgRef = useRef(null);
  const [width, setWidth] = useState(390);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth || el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const computed = useMemo(() => {
    let VOL_BAR_H  = Math.round(height * VOL_RATIO);
    let MACD_H = indicator === "MACD" && !showDepth ? 40 : 0;
    
    const CANDLE_H   = height - IND_H - TIME_H - VLBL_H - VOL_BAR_H - MACD_H;
    const CANDLE_TOP = IND_H;
    const CANDLE_BOT = IND_H + CANDLE_H;
    const MACD_TOP = CANDLE_BOT + TIME_H;
    const VOL_BOT    = height;
    const CHART_W    = width - RPAD;

    if (!points.length) {
      return { isEmpty: true, CHART_W };
    }

    if (showDepth) {
      const lastP = points[points.length - 1];
      const step = lastP * 0.002;
      const bids = [], asks = [];
      let bSum = 0, aSum = 0;
      for (let i = 0; i < 40; i++) {
        bSum += (seededRand(i * 5) * 10 + 2);
        bids.push({ p: lastP - step * i, v: bSum });
        aSum += (seededRand(i * 5 + 1) * 10 + 2);
        asks.push({ p: lastP + step * i, v: aSum });
      }
      bids.reverse();
      const maxV = Math.max(bSum, aSum);
      
      const bidPts = bids.map((b, i) => `${(CHART_W / 2) * (i / 40)},${height - (b.v / maxV) * height * 0.8}`).join(" ");
      const askPts = asks.map((a, i) => `${(CHART_W / 2) + (CHART_W / 2) * (i / 40)},${height - (a.v / maxV) * height * 0.8}`).join(" ");
      
      return { isDepth: true, bidPts: `0,${height} ` + bidPts + ` ${(CHART_W / 2)},${height}`, askPts: `${(CHART_W / 2)},${height} ` + askPts + ` ${CHART_W},${height}`, CHART_W, lastP };
    }

    const raw   = buildCandles(points);
    const ma5d  = calcMA(points, 5);
    const ma10d = calcMA(points, 10);
    const emad  = calcEMA(points, 7);
    const bolld = calcBOLL(points, 7);
    const sard  = calcSAR(raw);
    const avld  = calcAVL(raw);
    const macdd = calcMACD(points);

    let mn = Math.min(...raw.map(c => c.low));
    let mx = Math.max(...raw.map(c => c.high));

    if (indicator === "MA")   { mn = Math.min(mn, ...ma5d.filter(Boolean), ...ma10d.filter(Boolean)); mx = Math.max(mx, ...ma5d.filter(Boolean), ...ma10d.filter(Boolean)); }
    if (indicator === "EMA")  { mn = Math.min(mn, ...emad.filter(Boolean)); mx = Math.max(mx, ...emad.filter(Boolean)); }
    if (indicator === "BOLL") { mn = Math.min(mn, ...bolld.lower.filter(Boolean)); mx = Math.max(mx, ...bolld.upper.filter(Boolean)); }
    if (indicator === "SAR")  { mn = Math.min(mn, ...sard.filter(Boolean)); mx = Math.max(mx, ...sard.filter(Boolean)); }
    if (indicator === "AVL")  { mn = Math.min(mn, ...avld.filter(Boolean)); mx = Math.max(mx, ...avld.filter(Boolean)); }

    const range  = (mx - mn) || 1;
    const pMin   = mn - range * 0.05;
    const pMax   = mx + range * 0.05;
    const pRange = pMax - pMin;
    const stepX  = CHART_W / (points.length || 1);

    const toY    = v => CANDLE_TOP + CANDLE_H - ((v - pMin) / pRange) * CANDLE_H;
    const volMax = Math.max(...raw.map(c => c.volume));

    const candles = raw.map((c, i) => ({
      ...c,
      x:      i * stepX + stepX / 2,
      yHigh:  toY(c.high),
      yLow:   toY(c.low),
      yOpen:  toY(c.open),
      yClose: toY(c.close),
      volH:   (c.volume / volMax) * (VOL_BAR_H * 0.88),
    }));

    const toPath = data => {
      const p2 = data.map((v, i) => v !== null ? [i * stepX + stepX / 2, toY(v)] : null).filter(Boolean);
      return p2.length ? p2.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") : "";
    };

    const yLabels = [0, 1, 2, 3].map(i => {
      const y   = CANDLE_TOP + (CANDLE_H / 3) * i;
      const val = pMax - (pRange / 3) * i;
      return { y, text: val > 1000 ? (val / 1000).toFixed(1) + "k" : val.toFixed(2) };
    });

    const timeLabels = [
      { x: 4,              text: "09:00" },
      { x: CHART_W * 0.25, text: "11:00" },
      { x: CHART_W * 0.5,  text: "13:00" },
      { x: CHART_W * 0.75, text: "15:00" },
      { x: CHART_W - 2,    text: "now", anchor: "end" },
    ];
    
    // MACD scaling
    let macdMn = 0, macdMx = 0;
    if (indicator === "MACD") {
      const allM = [...macdd.macd, ...macdd.signal, ...macdd.hist].filter(x => x !== null);
      macdMn = Math.min(...allM);
      macdMx = Math.max(...allM);
    }
    const mRange = (macdMx - macdMn) || 1;
    const toMacdY = v => MACD_TOP + MACD_H - ((v - macdMn) / mRange) * MACD_H;
    
    const macdLines = {
      macd: macdd.macd.map((v, i) => v !== null ? [i * stepX + stepX / 2, toMacdY(v)] : null).filter(Boolean),
      signal: macdd.signal.map((v, i) => v !== null ? [i * stepX + stepX / 2, toMacdY(v)] : null).filter(Boolean),
      hist: macdd.hist.map((v, i) => v !== null ? { x: i * stepX + stepX / 2, y: toMacdY(Math.max(0, v)), h: Math.abs(toMacdY(v) - toMacdY(0)), isUp: v >= 0 } : null).filter(Boolean),
      zeroY: toMacdY(0)
    };

    const last = candles[candles.length - 1];
    return {
      candles,
      linePath: toPath(points),
      ma5: toPath(ma5d), ma10: toPath(ma10d), ema: toPath(emad), avl: toPath(avld),
      boll: { upper: toPath(bolld.upper), lower: toPath(bolld.lower), ma: toPath(bolld.ma) },
      sar: sard.map((v, i) => v !== null ? { x: i * stepX + stepX / 2, y: toY(v) } : null).filter(Boolean),
      macd: {
         macd: macdLines.macd.length ? macdLines.macd.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") : "",
         signal: macdLines.signal.length ? macdLines.signal.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") : "",
         hist: macdLines.hist,
         zeroY: macdLines.zeroY
      },
      yLabels, timeLabels,
      currentPriceY: last?.yClose ?? (CANDLE_TOP + CANDLE_H / 2),
      lastClose: last?.close ?? 0,
      CANDLE_BOT, VOL_BOT, MACD_TOP, MACD_H, CHART_W, CANDLE_H, stepX,
    };
  }, [points, width, height, indicator, showDepth]);

  if (computed.isEmpty) return <div style={{ width: "100%", height }} />;

  if (computed.isDepth) {
    const { bidPts, askPts, CHART_W, lastP } = computed;
    return (
      <svg ref={svgRef} width="100%" height={height} style={{ display: "block" }}>
        <polygon points={bidPts} fill="rgba(58,222,126,0.3)" />
        <polyline points={bidPts} fill="none" stroke="var(--up-500)" strokeWidth={2} />
        <polygon points={askPts} fill="rgba(242,80,75,0.3)" />
        <polyline points={askPts} fill="none" stroke="var(--down-500)" strokeWidth={2} />
        <line x1={CHART_W/2} y1={0} x2={CHART_W/2} y2={height} stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" />
        <text x={CHART_W/2} y={15} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="600">{lastP.toFixed(2)}</text>
      </svg>
    );
  }

  const { candles, linePath, ma5, ma10, ema, boll, sar, avl, macd, yLabels, timeLabels, currentPriceY, lastClose, CANDLE_BOT, VOL_BOT, MACD_TOP, MACD_H, CHART_W, stepX } = computed;
  const candleW      = Math.max(stepX * 0.6, 1);
  const TIME_LABEL_Y = indicator === "MACD" ? MACD_TOP + MACD_H + TIME_H - 4 : CANDLE_BOT + TIME_H - 4;
  const VLBL_Y       = indicator === "MACD" ? MACD_TOP + MACD_H + TIME_H + VLBL_H - 3 : CANDLE_BOT + TIME_H + VLBL_H - 3;

  return (
    <svg ref={svgRef} width="100%" height={height} style={{ display: "block" }}>
      {indicator === "MA" && (
        <>
          <text x={4}   y={13} fontSize={10} fill="rgba(255,255,255,0.45)">MA(5) </text>
          <text x={40}  y={13} fontSize={10} fill="#F5B544">{lastClose.toFixed(2)}</text>
          <text x={130} y={13} fontSize={10} fill="rgba(255,255,255,0.45)">MA(10) </text>
          <text x={172} y={13} fontSize={10} fill="#5B8CFF">{(lastClose * 0.998).toFixed(2)}</text>
        </>
      )}
      {indicator === "EMA" && (
        <text x={4} y={13} fontSize={10} fill="rgba(255,255,255,0.45)">
          {"EMA(7):  "}<tspan fill="#5B8CFF">{lastClose.toFixed(2)}</tspan>
        </text>
      )}
      {indicator === "BOLL" && <text x={4} y={13} fontSize={10} fill="rgba(255,255,255,0.45)">BOLL(7,2)</text>}
      {indicator === "SAR" && <text x={4} y={13} fontSize={10} fill="rgba(255,255,255,0.45)">SAR(0.02, 0.2)</text>}
      {indicator === "AVL" && <text x={4} y={13} fontSize={10} fill="rgba(255,255,255,0.45)">AVL</text>}
      {indicator === "MACD" && <text x={4} y={13} fontSize={10} fill="rgba(255,255,255,0.45)">MACD(12,26,9)</text>}

      {yLabels.map((lbl, i) => (
        <line key={i} x1={0} y1={lbl.y} x2={CHART_W} y2={lbl.y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <line x1={0} y1={currentPriceY} x2={CHART_W} y2={currentPriceY} stroke="var(--up-500)" strokeWidth={1} strokeDasharray="3 3" />

      {timeMode === "candle" ? (
        candles.map((c, i) => (
          <g key={i}>
            <line x1={c.x} y1={c.yHigh} x2={c.x} y2={c.yLow} stroke={c.isUp ? "var(--up-500)" : "var(--down-500)"} strokeWidth={1} />
            <rect x={c.x - candleW / 2} y={Math.min(c.yOpen, c.yClose)} width={candleW} height={Math.max(Math.abs(c.yClose - c.yOpen), 1)} fill={c.isUp ? "var(--up-500)" : "var(--down-500)"} />
          </g>
        ))
      ) : (
        <path d={linePath} fill="none" stroke="var(--up-500)" strokeWidth={2} />
      )}

      {indicator === "MA" && (
        <><path d={ma5} fill="none" stroke="#F5B544" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={ma10} fill="none" stroke="#5B8CFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></>
      )}
      {indicator === "EMA"  && <path d={ema} fill="none" stroke="#5B8CFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
      {indicator === "BOLL" && (
        <><path d={boll.upper} fill="none" stroke="rgba(245,181,68,0.5)" strokeWidth={1} />
          <path d={boll.lower} fill="none" stroke="rgba(245,181,68,0.5)" strokeWidth={1} />
          <path d={boll.ma}    fill="none" stroke="rgba(245,181,68,0.5)" strokeDasharray="4 4" strokeWidth={1} /></>
      )}
      {indicator === "SAR" && (
        sar.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r={1.5} fill="#5B8CFF" />)
      )}
      {indicator === "AVL" && <path d={avl} fill="none" stroke="#F5B544" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
      
      {indicator === "MACD" && (
        <g>
           <line x1={0} y1={macd.zeroY} x2={CHART_W} y2={macd.zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
           {macd.hist.map((h, i) => (
             <rect key={i} x={h.x - candleW/2} y={h.y} width={candleW} height={h.h} fill={h.isUp ? "var(--up-500)" : "var(--down-500)"} opacity={0.6} />
           ))}
           <path d={macd.macd} fill="none" stroke="#F5B544" strokeWidth={1.5} strokeLinecap="round" />
           <path d={macd.signal} fill="none" stroke="#5B8CFF" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}

      {yLabels.map((lbl, i) => (
        <text key={i} x={width - 2} y={lbl.y + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.6)" fontFamily="var(--font-core)">
          {lbl.text}
        </text>
      ))}

      <rect x={CHART_W + 2} y={currentPriceY - 9} width={RPAD - 4} height={16} rx={3} fill="var(--up-500)" />
      <text x={CHART_W + 2 + (RPAD - 4) / 2} y={currentPriceY + 3.5} textAnchor="middle" fontSize={8} fontWeight="700" fill="#fff">
        {lastClose > 1000 ? (lastClose / 1000).toFixed(2) + "k" : lastClose.toFixed(2)}
      </text>

      <line x1={0} y1={CANDLE_BOT} x2={width} y2={CANDLE_BOT} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

      {timeLabels.map((t, i) => (
        <text key={i} x={t.x} y={TIME_LABEL_Y} textAnchor={t.anchor ?? "start"} fontSize={9.5} fill="rgba(255,255,255,0.55)">
          {t.text}
        </text>
      ))}

      <text x={4} y={VLBL_Y} fontSize={8.5} fill="rgba(255,255,255,0.5)">
        {`Vol(USDT)${indicator === "MA" ? "  MA(5) \u00b7 MA(10)" : ""}`}
      </text>

      {candles.map((c, i) => (
        <rect key={i}
          x={c.x - candleW / 2} y={VOL_BOT - c.volH}
          width={candleW} height={c.volH}
          fill={c.isUp ? "var(--up-500)" : "var(--down-500)"}
          opacity={0.55}
        />
      ))}
    </svg>
  );
}
