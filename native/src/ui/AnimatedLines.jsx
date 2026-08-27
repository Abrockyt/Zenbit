import { useEffect, useRef } from "react";
import { Animated, View, Dimensions, Easing, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Line, G } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

/**
 * Minimal animated line grid for the top of the Home screen.
 *
 * Ported from the 21st.dev "Grid Beam" idea (light travelling along grid
 * dividers), which is a canvas/WebGL shader with no React Native
 * equivalent — rebuilt from SVG plus native-driven Animated transforms.
 *
 * Deliberately restrained:
 *   - ONE accent tone, not three. An earlier pass ran green + blue + gold
 *     beams together, which read as decoration rather than atmosphere.
 *   - Low opacity throughout; the grid should be something you notice on
 *     second look, not the first thing your eye lands on.
 *   - Slow, long cycles so nothing ever appears to blink or dart.
 *
 * Edges matter as much as the motion. This fades to nothing at BOTH ends:
 * the bottom fade keeps it from stopping on a hard line mid-page, and the
 * top fade is what makes it blend into the status-bar area instead of
 * starting abruptly a few pixels below it.
 */

const GRID_GAP = 52;

// A single soft glow drifting down the grid. Radial rather than linear so
// it falls off on both axes — a linear gradient left visible vertical
// edges and read as a coloured rectangle sliding past.
function Beam({ delay, duration, left, width, height, color, peak = 0.3 }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [duration, delay]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.5, height * 0.9] });
  const opacity = t.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: "absolute", left, width, height: height * 0.5, opacity, transform: [{ translateY }] }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={`beam${left}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={String(peak)} />
            <Stop offset="0.5" stopColor={color} stopOpacity={String(peak * 0.3)} />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#beam${left})`} />
      </Svg>
    </Animated.View>
  );
}

export default function AnimatedLines({
  height = 520,
  style,
  lineColor = "rgba(255,255,255,0.04)",
  beamColor = "#3ADE7E",
  fadeTo = "#060B09",
}) {
  const cols = Math.ceil(SCREEN_W / GRID_GAP) + 2;
  const rows = Math.ceil(height / GRID_GAP) + 1;

  return (
    <View pointerEvents="none" style={[{ height }, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <G>
          {Array.from({ length: cols }).map((_, i) => (
            <Line key={`v${i}`} x1={i * GRID_GAP} y1={0} x2={i * GRID_GAP} y2={height} stroke={lineColor} strokeWidth={1} />
          ))}
          {Array.from({ length: rows }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={i * GRID_GAP} x2={SCREEN_W + GRID_GAP} y2={i * GRID_GAP} stroke={lineColor} strokeWidth={1} />
          ))}
        </G>
      </Svg>

      {/* Two beams, same colour, very different speeds — enough for their
          overlap to keep changing without ever looking busy. */}
      <Beam delay={0} duration={16000} left={-GRID_GAP} width={GRID_GAP * 5} height={height} color={beamColor} peak={0.3} />
      <Beam delay={7000} duration={21000} left={GRID_GAP * 4} width={GRID_GAP * 5} height={height} color={beamColor} peak={0.2} />

      {/* Fade sits above grid and beams so both dissolve together. Defs are
          scoped per Svg root, so this gradient is declared here rather than
          in the grid Svg above. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
            {/* Opaque at the very top so the grid emerges from the screen
                colour instead of butting against it with a visible seam. */}
            <Stop offset="0" stopColor={fadeTo} stopOpacity="1" />
            <Stop offset="0.12" stopColor={fadeTo} stopOpacity="0.25" />
            <Stop offset="0.45" stopColor={fadeTo} stopOpacity="0.5" />
            <Stop offset="1" stopColor={fadeTo} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#gridFade)" />
      </Svg>
    </View>
  );
}
