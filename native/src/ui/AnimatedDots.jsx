import { useEffect, useMemo, useRef } from "react";
import { Animated, View, Dimensions, Easing, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");

/**
 * Minimal twinkling dot field for the top of Home.
 *
 * Adapted from the 21st.dev "Gradient Dots" idea (a field of small dots
 * that shimmer, Framer Motion) — that's DOM/CSS, no RN equivalent, so this
 * is rebuilt from plain Views on native-driven Animated opacity/scale
 * loops. Replaces an earlier grid-and-beam version: a rigid line grid read
 * as a UI element in its own right rather than atmosphere, and a scattered
 * dot field is the calmer, more "quiet build texture" read the reference
 * was going for.
 *
 * Restrained on purpose:
 *   - one accent tone
 *   - a loose scatter, not a grid — organic rather than technical
 *   - each dot drifts AND twinkles on its own slow, randomised cycle so
 *     nothing in the field ever moves in lockstep or reads as a pattern
 *     repeating — the first pass only twinkled in place, which read as
 *     "flickering" rather than "alive"; real motion is what sells it as a
 *     particle field instead of a static texture with a pulse on it.
 *   - low density, low peak opacity
 */

// Deterministic pseudo-random so the layout doesn't reshuffle on every
// re-render — same seed always produces the same scatter.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Dot({ x, y, size, delay, duration, peak, driftX, driftY, driftDuration, color }) {
  const twinkle = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    // A separate, much slower loop drives actual position — a gentle drift
    // out and back rather than a lap around a path, so it reads as
    // particles suspended in a current rather than anything orbiting or
    // bouncing. Independent duration from the twinkle so the two never
    // fall into a shared rhythm.
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: driftDuration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: driftDuration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    twinkleLoop.start();
    driftLoop.start();
    return () => { twinkleLoop.stop(); driftLoop.stop(); };
  }, [duration, delay, driftDuration]);

  const opacity = twinkle.interpolate({ inputRange: [0, 1], outputRange: [peak * 0.15, peak] });
  const scale = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, driftX] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, driftY] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

export default function AnimatedDots({ height = 420, style, dotColor = "#3ADE7E", fadeTo = "#060B09", count = 34 }) {
  const dots = useMemo(() => {
    const rand = seeded(1337);
    return Array.from({ length: count }).map((_, i) => ({
      key: i,
      x: rand() * SCREEN_W,
      y: rand() * height * 0.85,
      size: 2 + rand() * 2.5,
      delay: rand() * 4000,
      duration: 2200 + rand() * 2600,
      peak: 0.35 + rand() * 0.4,
      // Small, slow wander — a handful of pixels over several seconds.
      // Kept modest deliberately: enough to read as motion on close look,
      // never enough to look like the layout is unstable.
      driftX: (rand() - 0.5) * 26,
      driftY: (rand() - 0.5) * 22,
      driftDuration: 5000 + rand() * 6000,
    }));
  }, [count, height]);

  return (
    <View pointerEvents="none" style={[{ height, overflow: "hidden" }, style]}>
      {dots.map((d) => (
        <Dot
          key={d.key}
          x={d.x}
          y={d.y}
          size={d.size}
          delay={d.delay}
          duration={d.duration}
          peak={d.peak}
          driftX={d.driftX}
          driftY={d.driftY}
          driftDuration={d.driftDuration}
          color={dotColor}
        />
      ))}

      {/* Same top-emerges / bottom-dissolves fade as before: opaque at the
          very top so the field starts from the screen colour rather than a
          visible seam, fading to reveal dots through the middle, opaque
          again by the bottom so it resolves back into the page. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="dotFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fadeTo} stopOpacity="1" />
            <Stop offset="0.15" stopColor={fadeTo} stopOpacity="0.15" />
            <Stop offset="0.55" stopColor={fadeTo} stopOpacity="0.4" />
            <Stop offset="1" stopColor={fadeTo} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotFade)" />
      </Svg>
    </View>
  );
}
