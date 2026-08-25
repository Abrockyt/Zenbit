import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, View, Text, useWindowDimensions } from "react-native";
import Svg, { Line, Rect, Polyline, Circle } from "react-native-svg";
import { colors, fonts } from "../theme";
import { sma, ema, bollinger, parabolicSar, superTrend, avl } from "../lib/indicators";

/**
 * Trading chart drawn from real CoinGecko OHLC candles, with real indicator
 * overlays (see lib/indicators.js) and a real volume pane fed by
 * market_chart's total_volumes.
 *
 * Deliberately full-bleed — no card/border around it — so the plot uses the
 * whole screen width the way a real trading view does, with the price scale
 * living on the right edge of the plot itself and the time scale under it.
 *
 * Volume bars are aligned to candles BY TIMESTAMP, not by index: /ohlc and
 * /market_chart bucket at different intervals and return different-length
 * series, so pairing them positionally would silently show the wrong
 * volume against each candle.
 */
const PRICE_AXIS_W = 58;
const VOL_H = 56;
const TIME_AXIS_H = 18;

function nearestVolume(volumes, t) {
  if (!volumes?.length) return null;
  let best = volumes[0];
  let bestGap = Math.abs(volumes[0].t - t);
  for (let i = 1; i < volumes.length; i++) {
    const gap = Math.abs(volumes[i].t - t);
    if (gap < bestGap) { best = volumes[i]; bestGap = gap; }
  }
  return best.v;
}

function fmtPrice(v) {
  if (v == null) return "";
  if (v >= 1000) return `$${Math.round(v).toLocaleString("en-US")}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

function fmtCompact(v) {
  if (v == null) return "";
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

function fmtTime(t, days) {
  const d = new Date(t);
  if (days <= 1) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function CandlestickChart({ candles = [], volumes = [], active = "MA", height = 300, days = 1 }) {
  const { width: screenW } = useWindowDimensions();
  const width = Math.max(280, screenW - 40);
  const plotW = width - PRICE_AXIS_W;
  const priceH = height - VOL_H - TIME_AXIS_H;

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const vols = useMemo(
    () => candles.map((c) => nearestVolume(volumes, c.t)),
    [candles, volumes]
  );

  // Every overlay the active indicator needs, computed from the real candles.
  const series = useMemo(() => {
    if (!candles.length) return {};
    switch (active) {
      case "MA":
        return { lines: [
          { pts: sma(closes, 5), color: "#F5B544", label: "MA(5)" },
          { pts: sma(closes, 10), color: "#5B8CFF", label: "MA(10)" },
        ] };
      case "EMA":
        return { lines: [
          { pts: ema(closes, 7), color: "#F5B544", label: "EMA(7)" },
          { pts: ema(closes, 25), color: "#5B8CFF", label: "EMA(25)" },
        ] };
      case "BOLL": {
        const b = bollinger(closes, 20, 2);
        return { lines: [
          { pts: b.upper, color: "#5B8CFF", label: "UP" },
          { pts: b.middle, color: "#F5B544", label: "MB(20)" },
          { pts: b.lower, color: "#5B8CFF", label: "DN" },
        ] };
      }
      case "AVL":
        return { lines: [{ pts: avl(candles, vols), color: "#F5B544", label: "AVL" }] };
      case "SAR":
        return { dots: parabolicSar(candles), label: "SAR(0.02, 0.2)" };
      case "SUPER":
        return { trend: superTrend(candles, 10, 3), label: "SUPER(10, 3)" };
      default:
        return {};
    }
  }, [active, candles, closes, vols]);

  // Sweep the candles in left-to-right whenever the series changes (new coin
  // or new range), so the chart draws itself rather than snapping in. Driven
  // by an Animated listener writing a reveal count into state, which works
  // identically on native and web — no reanimated, which Expo Go can't load
  // (see the note in ui/kit.jsx).
  const [revealCount, setRevealCount] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;
  const seriesSig = candles.length ? `${candles.length}:${candles[0].t}:${candles[candles.length - 1].t}` : "";

  useEffect(() => {
    if (!candles.length) return;
    sweep.setValue(0);
    const sub = sweep.addListener(({ value }) => {
      setRevealCount(Math.max(1, Math.round(value * candles.length)));
    });
    const anim = Animated.timing(sweep, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => { anim.stop(); sweep.removeListener(sub); };
  }, [seriesSig]);

  if (!candles.length) {
    return <View style={{ height }} />;
  }

  // Scale to fit candles AND whatever the active overlay draws, so bands
  // like BOLL never get clipped off the top or bottom of the plot.
  const extraValues = [
    ...(series.lines?.flatMap((l) => l.pts) ?? []),
    ...(series.dots?.map((d) => d.value) ?? []),
    ...(series.trend?.map((d) => d.value) ?? []),
  ].filter((v) => Number.isFinite(v));

  const min = Math.min(...candles.map((c) => c.low), ...extraValues);
  const max = Math.max(...candles.map((c) => c.high), ...extraValues);
  const range = max - min || 1;
  const y = (p) => priceH - ((p - min) / range) * priceH;

  const slot = plotW / candles.length;
  const bodyW = Math.max(1.5, Math.min(9, slot * 0.62));

  const maxVol = Math.max(...vols.filter(Number.isFinite), 0);
  const last = candles[candles.length - 1];
  const lastUp = last.close >= last.open;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const timeTicks = [0, Math.floor(candles.length / 3), Math.floor((candles.length * 2) / 3), candles.length - 1];

  // Scales stay pinned to the FULL series while the sweep runs, so the chart
  // draws in place instead of rescaling under itself on every frame; only
  // how much is drawn changes.
  const shown = Math.min(revealCount || candles.length, candles.length);

  const line = (pts, color, key) => {
    if (!pts || pts.length < 2) return null;
    const off = candles.length - pts.length;
    const visible = pts.slice(0, Math.max(0, shown - off));
    if (visible.length < 2) return null;
    const d = visible.map((v, i) => `${((off + i) * slot + slot / 2).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return <Polyline key={key} points={d} fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />;
  };

  return (
    <View>
      {/* Legend — live values of whatever indicator is active, same as a real chart header */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 6, minHeight: 15 }}>
        {series.lines?.map((l) => (
          <Text key={l.label} style={{ color: l.color, fontSize: 10.5, fontFamily: fonts.mono }}>
            {l.label} {fmtPrice(l.pts[l.pts.length - 1])}
          </Text>
        ))}
        {(series.label && !series.lines) && (
          <Text style={{ color: colors.textTertiary, fontSize: 10.5, fontFamily: fonts.mono }}>{series.label}</Text>
        )}
      </View>

      <Svg width={width} height={priceH + VOL_H + TIME_AXIS_H}>
        {/* Horizontal grid + right-hand price scale */}
        {gridLines.map((g) => (
          <Line key={g} x1={0} x2={plotW} y1={g * priceH} y2={g * priceH} stroke={colors.borderSubtle} strokeWidth={0.5} />
        ))}

        {/* Candles */}
        {candles.slice(0, shown).map((c, i) => {
          const cx = i * slot + slot / 2;
          const up = c.close >= c.open;
          const color = up ? colors.up : colors.down;
          const top = y(Math.max(c.open, c.close));
          const bottom = y(Math.min(c.open, c.close));
          return (
            <Fragment key={c.t}>
              <Line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
              <Rect x={cx - bodyW / 2} y={top} width={bodyW} height={Math.max(1.2, bottom - top)} fill={color} />
            </Fragment>
          );
        })}

        {/* Indicator overlays */}
        {series.lines?.map((l, i) => line(l.pts, l.color, `l${i}`))}

        {series.dots?.slice(0, Math.max(0, shown - (candles.length - series.dots.length))).map((d, i) => {
          const off = candles.length - series.dots.length;
          return (
            <Circle
              key={`sar${i}`}
              cx={(off + i) * slot + slot / 2}
              cy={y(d.value)}
              r={1.5}
              fill={d.long ? colors.up : colors.down}
            />
          );
        })}

        {series.trend && line(series.trend.map((t) => t.value), series.trend[series.trend.length - 1]?.long ? colors.up : colors.down, "super")}

        {/* Current price marker */}
        <Line
          x1={0}
          x2={plotW}
          y1={y(last.close)}
          y2={y(last.close)}
          stroke={lastUp ? colors.up : colors.down}
          strokeWidth={0.8}
          strokeDasharray="4 3"
        />

        {/* Volume pane */}
        {candles.slice(0, shown).map((c, i) => {
          const v = vols[i];
          if (!Number.isFinite(v) || !maxVol) return null;
          const h = (v / maxVol) * (VOL_H - 8);
          const up = c.close >= c.open;
          return (
            <Rect
              key={`v${c.t}`}
              x={i * slot + slot / 2 - bodyW / 2}
              y={priceH + (VOL_H - 8) - h + 8}
              width={bodyW}
              height={Math.max(0.8, h)}
              fill={up ? colors.up : colors.down}
              opacity={0.55}
            />
          );
        })}
      </Svg>

      {/* Right-hand price scale, overlaid so the SVG plot keeps full width */}
      <View style={{ position: "absolute", right: 0, top: 21, height: priceH, width: PRICE_AXIS_W, justifyContent: "space-between" }}>
        {gridLines.map((g) => (
          <Text key={g} style={{ color: colors.textTertiary, fontSize: 9.5, fontFamily: fonts.mono, textAlign: "right" }}>
            {fmtPrice(max - g * range)}
          </Text>
        ))}
      </View>

      {/* Current-price badge, pinned to the dashed line */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 21 + y(last.close) - 8,
          backgroundColor: lastUp ? colors.up : colors.down,
          borderRadius: 3,
          paddingHorizontal: 5,
          paddingVertical: 2,
        }}
      >
        <Text style={{ color: "#03150c", fontSize: 9.5, fontFamily: fonts.mono }}>{fmtPrice(last.close)}</Text>
      </View>

      {/* Volume scale label */}
      <Text style={{ position: "absolute", left: 0, top: 21 + priceH + 8, color: colors.textTertiary, fontSize: 9.5, fontFamily: fonts.mono }}>
        Vol {fmtCompact(maxVol)}
      </Text>

      {/* Time scale */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: plotW, marginTop: -TIME_AXIS_H + 2 }}>
        {timeTicks.map((i) => (
          <Text key={i} style={{ color: colors.textTertiary, fontSize: 9.5, fontFamily: fonts.mono }}>
            {fmtTime(candles[i]?.t, days)}
          </Text>
        ))}
      </View>
    </View>
  );
}
