import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Switch as RNSwitch, TextInput, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, SlideInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { colors, spacing, radius, gradients, fonts, shadow } from "../theme";
import RadialBackground from "./RadialBackground";

/**
 * Shared RN UI kit — visual pass two.
 *
 * Pass one ported *behavior* only (flat colors, no motion) to get all 46
 * screens working fast. This pass ports the web app's actual look through
 * the same shared components, so every screen picks it up at once: glass
 * cards (BlurView, matching --surface-card + --grad-card), the gradient
 * screen background (--grad-screen), a real floating glass tab bar with a
 * sliding indicator, press/entrance animation via Reanimated (the RN
 * equivalent of the web app's Framer Motion), and the actual type family
 * (Hanken Grotesk / Geist Mono, loaded in App.tsx) instead of system font.
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale(to = 0.96) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => { scale.value = withTiming(to, { duration: 90 }); };
  const onPressOut = () => { scale.value = withSpring(1, { damping: 14, stiffness: 260 }); };
  return { style, onPressIn, onPressOut };
}

// No per-screen entrance animation here on purpose — React Navigation's
// native-stack already drives the real iOS/Android push transition and
// swipe-back gesture (see App.tsx screenOptions). A second fade wrapped
// around every screen's content fought that native transition and made
// navigation feel janky; the background/gradient can stay static underneath
// the native animation without conflicting with it.
export function Screen({ children, scroll = true, style, footer }) {
  const Wrap = scroll ? ScrollView : View;
  return (
    <View style={[styles.screen, style]}>
      <RadialBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <Wrap contentContainerStyle={scroll ? styles.scrollBody : styles.body} style={scroll ? { flex: 1 } : styles.body}>
          {children}
        </Wrap>
        {footer}
      </SafeAreaView>
    </View>
  );
}

export function Header({ title, onBack, right }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.headerBtn}>
          <Feather name="chevron-left" size={22} color={colors.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.headerBtn}>{right}</View>
    </View>
  );
}

export function Button({ children, onPress, variant = "primary", disabled, loading }) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale(0.97);
  const inner = (
    <Text
      style={[
        styles.buttonText,
        variant === "primary" && styles.buttonTextPrimary,
        variant === "secondary" && styles.buttonTextSecondary,
        variant === "danger" && styles.buttonTextDanger,
      ]}
    >
      {loading ? "Working…" : children}
    </Text>
  );

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        pressStyle,
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={gradients.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: radius.md }]} />
      ) : null}
      {inner}
    </AnimatedPressable>
  );
}

export function TextButton({ children, onPress, tone = "secondary" }) {
  return (
    <Pressable onPress={onPress} style={styles.textButton} hitSlop={8}>
      <Text style={[styles.textButtonLabel, tone === "danger" && { color: colors.down }]}>{children}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, badge, size = 20 }) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale(0.88);
  return (
    <AnimatedPressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={[pressStyle, styles.iconButton]} hitSlop={8}>
      <Feather name={icon} size={size} color={colors.textPrimary} />
      {badge ? <View style={styles.badgeDot} /> : null}
    </AnimatedPressable>
  );
}

export function Row({ icon, title, subtitle, right, onPress, danger }) {
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.55 }]}>
      {icon ? (
        <View style={styles.rowIcon}>
          <Feather name={icon} size={16} color={danger ? colors.down : colors.textSecondary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: colors.down }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : onPress ? <Feather name="chevron-right" size={18} color={colors.textTertiary} /> : null}
    </Wrap>
  );
}

// Glass card — BlurView for the translucent depth, a soft gradient sheen on
// top of it, matching the web app's --surface-card / --grad-card look.
export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
      <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFillObject} />
      <View>{children}</View>
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={[styles.segmentItem, active && styles.segmentItemActive]}>
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Switch({ value, onValueChange }) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.surfaceRaised, true: colors.up }}
      thumbColor={colors.white}
    />
  );
}

export function TextField({ value, onChangeText, placeholder, keyboardType, secureTextEntry, autoFocus, multiline }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoFocus={autoFocus}
      multiline={multiline}
      style={[styles.input, multiline && { minHeight: 90, textAlignVertical: "top" }]}
    />
  );
}

export function Avatar({ uri, initials, size = 36 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: colors.textPrimary, fontSize: size * 0.38, fontFamily: fonts.semibold }}>{initials}</Text>
      )}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <TextButton onPress={onAction}>{action}</TextButton> : null}
    </View>
  );
}

export function EmptyState({ icon = "inbox", title, body }) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.empty}>
      <Feather name={icon} size={28} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </Animated.View>
  );
}

export function Banner({ tone = "info", children }) {
  const toneColor = tone === "danger" ? colors.down : tone === "warn" ? colors.warn : colors.info;
  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.banner, { borderColor: toneColor + "55", backgroundColor: toneColor + "14" }]}>
      <Text style={[styles.bannerText, { color: toneColor }]}>{children}</Text>
    </Animated.View>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
export function Keypad({ onKey }) {
  return (
    <View style={styles.keypad}>
      {KEYS.map((k, i) =>
        k === "" ? (
          <View key={i} style={styles.keypadKey} />
        ) : (
          <Pressable key={i} onPress={() => onKey(k)} style={({ pressed }) => [styles.keypadKey, pressed && { opacity: 0.5, backgroundColor: colors.surfaceRaised }]}>
            {k === "back" ? (
              <Feather name="delete" size={22} color={colors.textPrimary} />
            ) : (
              <Text style={styles.keypadDigit}>{k}</Text>
            )}
          </Pressable>
        )
      )}
    </View>
  );
}

export function Dots({ count, filled, tone }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 12, height: 12, borderRadius: 6,
            backgroundColor: i < filled ? (tone === "danger" ? colors.down : colors.white) : "transparent",
            borderWidth: 1, borderColor: tone === "danger" ? colors.down : i < filled ? colors.white : colors.borderStrong,
          }}
        />
      ))}
    </View>
  );
}

// Real floating glass tab bar — matches the web TabBar.jsx: rounded pill,
// blurred glass background, a sliding indicator behind the active icon.
const TABS = [
  { key: "Home", icon: "home" },
  { key: "Market", icon: "bar-chart-2" },
  { key: "Swap", icon: "repeat" },
  { key: "Card", icon: "credit-card" },
  { key: "Feed", icon: "users" },
  { key: "Profile", icon: "user" },
];
export function TabBar({ navigation, active }) {
  const index = Math.max(0, TABS.findIndex((t) => t.key === active));
  const x = useSharedValue(index);

  useEffect(() => {
    x.value = withSpring(index, { damping: 18, stiffness: 220 });
  }, [index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${(x.value / TABS.length) * 100}%`,
  }));

  return (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabBar}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={["rgba(20,28,25,0.5)", "rgba(12,17,15,0.65)"]} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[styles.tabIndicatorTrack, indicatorStyle]}>
          <View style={styles.tabIndicator} />
        </Animated.View>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => navigation.navigate(t.key)} style={styles.tabItem} hitSlop={8}>
            <Feather name={t.icon} size={20} color={active === t.key ? colors.textPrimary : "rgba(255,255,255,0.4)"} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function PriceRow({ symbol, name, price, changePct, holding, iconUrl, onPress }) {
  const up = (changePct ?? 0) >= 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.55 }]}>
      {iconUrl ? (
        <Image source={{ uri: iconUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
      ) : (
        <View style={styles.rowIcon}><Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: fonts.bold }}>{symbol?.slice(0, 2).toUpperCase()}</Text></View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{name}</Text>
        <Text style={styles.rowSubtitle}>{holding ?? symbol?.toUpperCase()}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.rowTitle, { fontFamily: fonts.mono }]}>${Number(price ?? 0).toLocaleString("en-US", { maximumFractionDigits: price < 1 ? 4 : 2 })}</Text>
        <Text style={{ fontSize: 12, marginTop: 2, fontFamily: fonts.mono, color: up ? colors.up : colors.down }}>{up ? "+" : ""}{(changePct ?? 0).toFixed(2)}%</Text>
      </View>
    </Pressable>
  );
}

export function Sheet({ open, onClose, title, children }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      {open && (
        <Animated.View entering={SlideInDown.springify().damping(18).stiffness(220)} style={styles.sheetBody}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.sheetHandle} />
          {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
          {children}
        </Animated.View>
      )}
    </Modal>
  );
}

export function ResultDialog({ tone = "success", title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  const tint = tone === "success" ? colors.up : colors.down;
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.resultBackdrop}>
        <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFillObject} />
        <Animated.View entering={FadeInDown.duration(320)} style={styles.resultCard}>
          <View style={[styles.resultIcon, { backgroundColor: tint + "20", borderColor: tint }]}>
            <Feather name={tone === "success" ? "check" : "x"} size={26} color={tint} />
          </View>
          <Text style={styles.resultTitle}>{title}</Text>
          <Text style={styles.resultMessage}>{message}</Text>
          <View style={{ width: "100%", gap: spacing.sm, marginTop: spacing.md }}>
            <Button onPress={onPrimary}>{primaryLabel}</Button>
            {secondaryLabel && <Button variant="secondary" onPress={onSecondary}>{secondaryLabel}</Button>}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export { colors, spacing, radius, gradients, fonts, shadow };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceScreen },
  body: { flex: 1, padding: spacing.xl },
  scrollBody: { padding: spacing.xl, paddingBottom: 48 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", color: colors.textPrimary, fontSize: 16, fontFamily: fonts.semibold },

  button: { borderRadius: radius.md, paddingVertical: 15, alignItems: "center", justifyContent: "center", overflow: "hidden", ...shadow.cta },
  buttonSecondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderDefault },
  buttonDanger: { backgroundColor: colors.downDim, borderWidth: 1, borderColor: colors.down },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 15, fontFamily: fonts.semibold },
  buttonTextPrimary: { color: "#03150c" },
  buttonTextSecondary: { color: colors.textPrimary },
  buttonTextDanger: { color: colors.down },

  textButton: { paddingVertical: 6, paddingHorizontal: 4 },
  textButtonLabel: { color: colors.up, fontSize: 13, fontFamily: fonts.medium },

  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised },
  badgeDot: { position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.down },

  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.medium },
  rowSubtitle: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },

  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.lg, overflow: "hidden" },

  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, marginRight: 8 },
  chipActive: { backgroundColor: colors.up },
  chipLabel: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.medium },
  chipLabelActive: { color: "#03150c" },

  segment: { flexDirection: "row", backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: radius.sm - 2 },
  segmentItemActive: { backgroundColor: colors.surfaceCardSolid },
  segmentLabel: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.medium },
  segmentLabelActive: { color: colors.textPrimary },

  input: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderDefault, color: colors.textPrimary, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },

  avatar: { backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center", overflow: "hidden" },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.semibold },
  emptyBody: { color: colors.textTertiary, fontSize: 13, textAlign: "center", paddingHorizontal: 24 },

  banner: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  bannerText: { fontSize: 13, lineHeight: 18 },

  keypad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, width: 3 * 72 + 2 * 14 },
  keypadKey: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  keypadDigit: { color: colors.textPrimary, fontSize: 26, fontFamily: fonts.regular },

  tabBarWrap: { position: "absolute", left: 20, right: 20, bottom: 26 },
  tabBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    height: 64, borderRadius: 999, paddingHorizontal: 12, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
    ...shadow.sheet,
  },
  tabItem: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", zIndex: 2 },
  tabIndicatorTrack: { position: "absolute", top: 0, bottom: 0, width: `${100 / TABS.length}%`, alignItems: "center", justifyContent: "center" },
  tabIndicator: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },

  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheetBody: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden", backgroundColor: "rgba(15,22,20,0.92)", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, paddingTop: spacing.md, maxHeight: "75%", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: fonts.semibold, marginBottom: spacing.md },

  resultBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  resultCard: { alignItems: "center", width: "100%" },
  resultIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  resultTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.semibold },
  resultMessage: { color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, maxWidth: 280 },
});
