import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Ported from src/pages/Welcome.jsx (web).
 *
 * The web version's background is a Spline 3D iframe — RN has no iframe, and
 * a WebView-embedded Spline scene wasn't worth the dependency for a first
 * pass, so this is a flat gradient instead. Everything else — copy, layout,
 * the two actions — is the same screen.
 *
 */
export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0a0f0d", "#050a08"]} style={StyleSheet.absoluteFill} />
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
  safe: { flex: 1 },
  spacer: { flex: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 24 },
  title: { color: "#fff", fontSize: 28, fontWeight: "600", marginTop: 8 },
  body: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 8, lineHeight: 20 },
  dots: { flexDirection: "row", gap: 6, marginVertical: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.28)" },
  dotActive: { width: 22, backgroundColor: "#fff" },
  primaryButton: { backgroundColor: "#3ADE7E", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 12 },
  primaryButtonText: { color: "#03150c", fontSize: 15, fontWeight: "600" },
  secondaryButton: { paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
});
