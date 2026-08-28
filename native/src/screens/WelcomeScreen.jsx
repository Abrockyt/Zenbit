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
const H_PADDING = 20;
// The carousel lives inside footer's paddingHorizontal:20, so one "page" is
// the screen minus both paddings — NOT the full screen width. Paging,
// slide width and programmatic scrollTo all have to agree on this single
// number: they didn't before (scrollTo stepped by SCREEN_W while pagingEnabled
// snapped to the narrower track), so every auto-advance drifted 40px further
// out of alignment and slides ended up rendering half-off the screen.
const PAGE_W = SCREEN_W - H_PADDING * 2;
const AUTO_ADVANCE_MS = 2800;

// Story-style progress dot (Instagram/Snapchat pattern): every slide gets a
// fixed-width track, the active one fills left-to-right over the slide's
// dwell time, and past slides stay fully filled instead of just "on/off".
// Tappable, so the bar is a real control rather than a passive indicator.
function StoryDot({ active, done, paused, onPress }) {
  const fill = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    if (active && !paused) {
      fill.setValue(0);
      Animated.timing(fill, { toValue: 1, duration: AUTO_ADVANCE_MS, useNativeDriver: false }).start();
    } else if (active && paused) {
      // Manual browsing: show the slide as current without running the
      // countdown, since nothing is going to auto-advance off it.
      fill.setValue(1);
    } else {
      fill.setValue(done ? 1 : 0);
    }
  }, [active, done, paused]);

  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.dotTrack}>
      <Animated.View style={[styles.dotFill, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
    </Pressable>
  );
}

export default function WelcomeScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  // Once the person swipes or taps a dot themselves, stop yanking the
  // carousel out from under them — auto-advance is for an idle screen.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      const next = (index + 1) % SLIDES.length;
      scrollRef.current?.scrollTo({ x: next * PAGE_W, animated: true });
      setIndex(next);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [index, paused]);

  const onMomentumEnd = (e) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / PAGE_W);
    setIndex(next);
  };

  const goTo = (i) => {
    setPaused(true);
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * PAGE_W, animated: true });
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
          // Hardened after the SDK 54->57 upgrade (react-native-webview
          // 13.15->13.16, and RN's New Architecture is the default from
          // this SDK on) — the Spline scene stopped rendering on-device
          // after that jump. These are the standard fixes for a WebGL/
          // canvas-heavy embedded page going blank post-upgrade: explicit
          // JS/DOM-storage/media flags rather than relying on defaults
          // that can shift between library versions, since Spline's
          // renderer depends on all three actually being on.
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          // Diagnostics only, temporary: the WebView's own JS context is
          // isolated from RN's — a Spline load failure inside the page
          // never reached Metro's console before, so every earlier fix
          // attempt was a guess with no way to confirm the actual cause.
          // These three surface the real error into the Metro terminal on
          // a live device/dev-client connection (not possible under Expo
          // Go, which is what every earlier attempt was limited to).
          onError={(e) => console.warn("[Spline WebView] onError:", JSON.stringify(e.nativeEvent))}
          onHttpError={(e) => console.warn("[Spline WebView] onHttpError:", JSON.stringify(e.nativeEvent))}
          onMessage={(e) => console.warn("[Spline WebView] page console:", e.nativeEvent.data)}
          injectedJavaScriptBeforeContentLoaded={`
            (function () {
              function send(kind, args) {
                try {
                  window.ReactNativeWebView.postMessage(kind + ": " + Array.from(args).map(String).join(" "));
                } catch (e) {}
              }
              window.onerror = function (message, source, lineno, colno, error) {
                send("onerror", [message, source, lineno, colno, error && error.stack]);
              };
              window.addEventListener("unhandledrejection", function (e) {
                send("unhandledrejection", [e.reason]);
              });
              var origError = console.error;
              console.error = function () { send("console.error", arguments); origError.apply(console, arguments); };
              var origWarn = console.warn;
              console.warn = function () { send("console.warn", arguments); origWarn.apply(console, arguments); };
              true;
            })();
          `}
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
            onScrollBeginDrag={() => setPaused(true)}
            onMomentumScrollEnd={onMomentumEnd}
            style={{ width: PAGE_W }}
          >
            {SLIDES.map((s) => (
              <View key={s.title} style={{ width: PAGE_W }}>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
          </Animated.ScrollView>

          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <StoryDot key={s.title} active={i === index} done={i < index} paused={paused} onPress={() => goTo(i)} />
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
  dotTrack: { width: 26, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.22)", overflow: "hidden" },
  dotFill: { height: "100%", borderRadius: 2, backgroundColor: colors.white },
  primaryButton: { backgroundColor: colors.white, borderRadius: 27, height: 54, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  primaryButtonText: { color: "#050807", fontSize: 15, fontFamily: fonts.medium },
  secondaryButton: { paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.regular },
});
