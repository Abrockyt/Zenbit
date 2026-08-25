import { StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

// Matches the Figma screen background exactly (every "01-xx"/"03-xx"/etc.
// frame uses this same radial fill): centered at top-middle, fading through
// a muted sage green down to black. The web app approximates this with
// --grad-screen; this reproduces the actual gradient stops from the file.
export default function RadialBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="screenGrad" gradientUnits="userSpaceOnUse" cx="195" cy="0" r="588">
          <Stop offset="0" stopColor="rgb(74,95,93)" stopOpacity="1" />
          <Stop offset="0.25" stopColor="rgb(56,71,70)" stopOpacity="1" />
          <Stop offset="0.5" stopColor="rgb(37,48,47)" stopOpacity="1" />
          <Stop offset="0.75" stopColor="rgb(19,24,23)" stopOpacity="1" />
          <Stop offset="0.875" stopColor="rgb(9,12,12)" stopOpacity="1" />
          <Stop offset="1" stopColor="rgb(0,0,0)" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="390" height="844" fill="url(#screenGrad)" />
    </Svg>
  );
}
