import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import RadialBackground from "../ui/RadialBackground";
import { colors, fonts } from "../theme";

// Same Spline scene the web app embeds (src/pages/Welcome.jsx) — a live
// 3D coin, non-interactive here since it's decorative background, same as
// on web where the foreground buttons sit in front of it. WebView is the
// only way to run a Spline scene on RN; there's no native Spline runtime.
const SPLINE_URL = "https://my.spline.design/prismcoin-bUZ2xyGxtROeBvkVK8VdZ5hR/";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <RadialBackground />
      <WebView
        source={{ uri: SPLINE_URL }}
        style={[styles.spline, { pointerEvents: "none" }]}
        scrollEnabled={false}
        androidLayerType="hardware"
        originWhitelist={["*"]}
      />
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)", "#000"]} locations={[0, 0.25, 1]} style={styles.scrim} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.spacer} />
        <View style={styles.footer}>
          <Text style={styles.title}>Your money, your keys</Text>
          <Text style={styles.body}>
            Hold, buy, swap and spend crypto — all in one app you control.
          </Text>

          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
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
  spline: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
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
