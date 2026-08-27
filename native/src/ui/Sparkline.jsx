import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { colors } from "../theme";

// `width` is a prop rather than a constant so the same component serves the
// full-bleed detail chart and the small trend lines on Home's watchlist cards.
export default function Sparkline({ points = [], height = 220, width = 335, up = true, strokeWidth = 2 }) {
  if (!points.length) return <View style={{ height }} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`).join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline points={coords} fill="none" stroke={up ? colors.up : colors.down} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
