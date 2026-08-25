import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView, Animated, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import RadialBackground from "../ui/RadialBackground";
import { colors, fonts } from "../theme";

// Same Spline scene the web app embeds (src/pages/Welcome.jsx) — a live
// 3D coin, non-interactive here since it's decorative background, same as
// on web where the foreground buttons sit in front of it. WebView is the
// only way to run a Spline scene on RN; there's no native Spline runtime.
//
// The embedded Spline page renders its scene into a viewport shorter than
// the phone's screen, which left a flat seam across the bottom of the coin
// on real devices. Since that's the third-party page's own layout, not
// something RN layout can reach into, the WebView is oversized (140% tall)
// and clipped by the wrapper's overflow:hidden — the seam lands below the
// visible frame instead of inside it, and the coin also reads bigger.
const SPLINE_URL = "https://my.spline.design/prismcoin-bUZ2xyGxtROeBvkVK8VdZ5hR/";

const SLIDES = [
  { title: "Your money, your keys", body: "Hold, buy, swap and spend crypto — all in one app you control." },
  { title: "Built-in market data", body: "Live prices, real charts and a watchlist that updates in real time." },
  { title: "One tap to send or spend", body: "Move funds instantly, or spend straight from your wallet with the card." },
];
const { width: SCREEN_W } = Dimensions.get("window");
const AUTO_ADVANCE_MS = 4500;

export default function WelcomeScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (index + 1) % SLIDES.length;
      scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
      setIndex(next);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [index]);

  const onMomentumEnd = (e) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(next);
  };

  return (
    <View style={styles.root}>
      <RadialBackground />
      <View style={styles.splineClip}>
        <WebView
          source={{ uri: SPLINE_URL }}
          style={[styles.spline, { pointerEvents: "none" }]}
          scrollEnabled={false}
          androidLayerType="hardware"
          originWhitelist={["*"]}
        />
      </View>
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)", "#000"]} locations={[0, 0.25, 1]} style={styles.scrim} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.spacer} />
        <View style={styles.footer}>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            style={{ width: SCREEN_W - 40 }}
          >
            {SLIDES.map((s) => (
              <View key={s.title} style={{ width: SCREEN_W - 40 }}>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
          </Animated.ScrollView>

          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View key={s.title} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.primaryButtonText}>Get started</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  splineClip: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  spline: { position: "absolute", top: 0, left: 0, right: 0, height: "140%", backgroundColor: "transparent" },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "45%" },
  safe: { flex: 1 },
  spacer: { flex: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 24 },
  title: { color: colors.textPrimary, fontSize: 26, fontFamily: fonts.medium, marginTop: 8, letterSpacing: -0.4 },
  body: { color: colors.textSecondary, fontSize: 14, marginTop: 8, lineHeight: 21 },
  dots: { flexDirection: "row", gap: 6, marginVertical: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.28)" },
  dotActive: { width: 22, backgroundColor: colors.white },
  primaryButton: { backgroundColor: colors.white, borderRadius: 27, height: 54, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  primaryButtonText: { color: "#050807", fontSize: 15, fontFamily: fonts.medium },
  secondaryButton: { paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.regular },
});
