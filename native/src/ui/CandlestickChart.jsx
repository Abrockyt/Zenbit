import { Fragment } from "react";
import { View, Text } from "react-native";
import Svg, { Line, Rect, Polyline } from "react-native-svg";
import { colors, fonts } from "../theme";

// Real OHLC candles from CoinGecko (see useCoinOHLC) plus a moving average
// derived from those same closes — no fabricated volume or order-book data,
// since CoinGecko's free tier doesn't expose real per-candle volume.
function movingAverage(candles, period) {
  if (candles.length < period) return [];
  const out = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    out.push(sum / period);
  }
  return out;
}

export default function CandlestickChart({ candles = [], height = 260, maPeriod = 5 }) {
  const width = 335;

  if (!candles.length) {
    return <View style={{ height, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.textTertiary, fontSize: 12 }}>Loading chart…</Text></View>;
  }

  const chartH = height - 24; // leave room for the axis labels row
  const min = Math.min(...candles.map((c) => c.low));
  const max = Math.max(...candles.map((c) => c.high));
  const range = max - min || 1;
  const y = (price) => chartH - ((price - min) / range) * chartH;

  const slot = width / candles.length;
  const bodyW = Math.max(2, Math.min(8, slot * 0.6));

  const ma = movingAverage(candles, maPeriod);
  const maOffset = candles.length - ma.length;
  const maPoints = ma.map((v, i) => `${((maOffset + i) * slot + slot / 2).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <View>
      <Svg width={width} height={chartH}>
        {candles.map((c, i) => {
          const cx = i * slot + slot / 2;
          const up = c.close >= c.open;
          const color = up ? colors.up : colors.down;
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyBottom = y(Math.min(c.open, c.close));
          return (
            <Fragment key={c.t}>
              <Line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
              <Rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={Math.max(1.5, bodyBottom - bodyTop)} fill={color} />
            </Fragment>
          );
        })}
        {ma.length > 1 && <Polyline points={maPoints} fill="none" stroke={colors.warn} strokeWidth={1.5} opacity={0.8} />}
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        <Text style={{ color: colors.textTertiary, fontSize: 10, fontFamily: fonts.mono }}>${min.toLocaleString("en-US", { maximumFractionDigits: min < 1 ? 4 : 0 })}</Text>
        <Text style={{ color: colors.warn, fontSize: 10, fontFamily: fonts.mono }}>MA({maPeriod})</Text>
        <Text style={{ color: colors.textTertiary, fontSize: 10, fontFamily: fonts.mono }}>${max.toLocaleString("en-US", { maximumFractionDigits: max < 1 ? 4 : 0 })}</Text>
      </View>
    </View>
  );
}
