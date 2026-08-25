import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { colors } from "../theme";

export default function Sparkline({ points = [], height = 220, up = true }) {
  if (!points.length) return <View style={{ height }} />;
  const width = 335;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`).join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline points={coords} fill="none" stroke={up ? colors.up : colors.down} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
