import { useEffect, useRef } from "react";
import { Animated, View, Dimensions, Easing, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { colors } from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");

/**
 * Animated aurora backdrop.
 *
 * The 21st.dev catalog's aurora backgrounds are all web — WebGL/OGL shaders,
 * CSS keyframes on `background-position`, or Framer Motion on blurred divs —
 * and none of those have a React Native equivalent (no CSS animation, no
 * backdrop-filter, and this project deliberately has no reanimated after an
 * Expo Go crash). What ports is the *recipe* those components share:
 * several large, soft, offset colour blobs drifting slowly at different
 * speeds so their overlaps keep changing.
 *
 * Rebuilt here from RN primitives: each blob is an SVG radial gradient
 * fading to fully transparent (that fade is what stands in for the CSS blur
 * — a hard-edged circle would read as a disc), wrapped in an Animated.View
 * driven on the native thread. Colours are the app's own sage/green plus a
 * cool and a warm accent already in the theme, so it reads as the same
 * product rather than the purple/cyan the catalog examples default to.
 */
function Blob({ id, color, size, from, to, duration, delay = 0, opacity = 1 }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          delay,
          // Sine in/out so a blob eases at the turnaround instead of
          // visibly bouncing off an invisible wall.
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, delay]);

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [from.x, to.x] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [from.y, to.y] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.55" />
            <Stop offset="0.45" stopColor={color} stopOpacity="0.22" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export default function AnimatedAurora({ height = 620, style }) {
  return (
    <View pointerEvents="none" style={[{ height, overflow: "hidden" }, style]}>
      {/* Base wash so the blobs sit on the app's own dark surface rather
          than straight on black. */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.surfaceScreen }]} />

      <Blob
        id="auroraA"
        color="#4A5F5D"
        size={SCREEN_W * 1.1}
        from={{ x: -SCREEN_W * 0.28, y: -SCREEN_W * 0.42 }}
        to={{ x: SCREEN_W * 0.1, y: -SCREEN_W * 0.2 }}
        duration={11000}
      />
      <Blob
        id="auroraB"
        color={colors.up}
        size={SCREEN_W * 0.85}
        from={{ x: SCREEN_W * 0.42, y: -SCREEN_W * 0.3 }}
        to={{ x: SCREEN_W * 0.05, y: SCREEN_W * 0.05 }}
        duration={15000}
        delay={900}
        opacity={0.45}
      />
      <Blob
        id="auroraC"
        color={colors.info}
        size={SCREEN_W * 0.8}
        from={{ x: -SCREEN_W * 0.1, y: SCREEN_W * 0.18 }}
        to={{ x: SCREEN_W * 0.5, y: -SCREEN_W * 0.05 }}
        duration={19000}
        delay={1800}
        opacity={0.3}
      />

      {/* Fades the whole thing out at the bottom so it dissolves into the
          page instead of ending on a visible seam. */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="auroraFade" cx="50%" cy="12%" r="95%">
            <Stop offset="0" stopColor={colors.surfaceScreen} stopOpacity="0" />
            <Stop offset="0.62" stopColor={colors.surfaceScreen} stopOpacity="0.55" />
            <Stop offset="1" stopColor={colors.surfaceScreen} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#auroraFade)" />
      </Svg>
    </View>
  );
}
