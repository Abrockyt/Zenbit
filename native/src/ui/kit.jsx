import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, Text, Pressable, StyleSheet, ScrollView, Switch as RNSwitch, TextInput, Image, Modal, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, gradients, fonts, shadow, onThemeChange, isLightTheme } from "../theme";
import RadialBackground from "./RadialBackground";
import AnimatedDots from "./AnimatedDots";
import { formatMoney } from "../lib/format";
import { useTheme } from "../state/ThemeProvider";

/**
 * Shared RN UI kit — visual pass two.
 *
 * Animation runs on React Native's built-in Animated API, not
 * react-native-reanimated. Reanimated's native worklets module crashed
 * inside Expo Go with "Exception in HostFunction: NativeWorklets" on a real
 * device — Expo Go ships one fixed native Reanimated build, and neither v4
 * nor a downgrade to v3 matched it (confirmed by testing both against a live
 * dev-server connection, which surfaces the real native crash instead of a
 * silent blank screen). Animated ships inside react-native core itself, so
 * there's no separate native module to mismatch — it can't hit this class
 * of bug. Every animation this kit does (press-scale, sheet slide-up, result
 * fade-in) is well within what Animated handles natively.
 *
 * Also ports the web app's actual look through the shared components, so
 * every screen picks it up at once: glass cards (BlurView, matching
 * --surface-card / --grad-card), the gradient screen background
 * (--grad-screen), a real floating glass tab bar, and the actual type
 * family (Hanken Grotesk / Geist Mono, loaded in App.tsx).
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale(to = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(scale, { toValue: to, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 6, tension: 220, useNativeDriver: true }).start();
  return { style: { transform: [{ scale }] }, onPressIn, onPressOut };
}

// Simple mount-time fade/slide-in, replacing Reanimated's entering= prop.
function useEnterAnimation({ fromY = 0 } = {}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);
  return {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }],
  };
}

// No per-screen entrance animation here on purpose — React Navigation's
// native-stack already drives the real iOS/Android push transition and
// swipe-back gesture (see App.tsx screenOptions). A second fade wrapped
// around every screen's content fought that native transition and made
// navigation feel janky; the background/gradient can stay static underneath
// the native animation without conflicting with it.
/**
 * `bg` picks the backdrop:
 *   "plain"    - flat dark surface (default: every screen except Home)
 *   "black"    - true black, used across the social section where dense
 *                media and avatars sit better on it than on a tint
 *   "animated" - the drifting aurora, Home only. Unlike the others this one
 *                is rendered INSIDE the scroll view, so it travels with the
 *                content instead of staying pinned behind it.
 *
 * "plain"/"black" are painted outside the ScrollView and stay put while
 * content scrolls over them.
 *
 * The background lives here rather than as one shared layer behind the
 * navigator: screens have to stay opaque to occlude the ones beneath them
 * in the stack. Hoisting it out and making the navigator transparent left
 * Home, Market and Social all visible at once.
 */
export function Screen({ children, scroll = true, style, footer, bg = "plain", onScroll, scrollEventThrottle = 16, stickyHeader }) {
  const Wrap = scroll ? ScrollView : View;
  // Consuming the theme here is what makes a switch repaint the app. Most
  // components never read this context — they read the mutated `colors`
  // object — so React has no reason to re-render them on its own. Screen
  // wraps virtually every page, so it re-renders on a switch and keys its
  // children below to force their subtrees to re-read the new palette.
  const { mode } = useTheme();
  const light = isLightTheme();
  // "black" is a dark-theme device for the social section; on the light
  // theme true black would be a jarring hole in the middle of the app, so
  // it maps to the plain white surface instead.
  const base = bg === "black" && !light ? colors.black : colors.surfaceScreen;
  const animated = bg === "animated";
  // Any screen with a footer (PostDetail's reply box, Conversation's
  // message field, Login, Compose…) had no keyboard handling at all — the
  // footer stayed pinned to the bottom of the *screen*, and the keyboard
  // simply rose up and covered it, so typing a reply meant typing blind
  // into a field you could no longer see. KeyboardAvoidingView only wraps
  // when there's a footer to protect; scroll-only screens don't need it.
  const Wrapper = footer ? KeyboardAvoidingView : View;
  const wrapperProps = footer
    ? { style: { flex: 1 }, behavior: Platform.OS === "ios" ? "padding" : undefined, keyboardVerticalOffset: Platform.OS === "ios" ? 0 : 0 }
    : { style: { flex: 1 } };

  return (
    <View style={[styles.screen, { backgroundColor: base }, style]}>
      <SafeAreaView style={{ flex: 1 }}>
      {/* Sits above the ScrollView so it stays fixed while content scrolls
          beneath it — the caller (Home) drives its own opacity/visibility
          off `onScroll`, this just gives it a place to float. The node
          passed in must position itself (position:"absolute", top/left/
          right:0) — this slot doesn't reserve layout space of its own, or
          every screen without a sticky header would get a dead gap here. */}
      {stickyHeader}
      <Wrapper {...wrapperProps}>
        <Wrap
          contentContainerStyle={scroll ? styles.scrollBody : styles.body}
          style={scroll ? { flex: 1 } : styles.body}
          onScroll={onScroll}
          scrollEventThrottle={onScroll ? scrollEventThrottle : undefined}
        >
          {/* Negative insets cancel the content container's padding so the
              field runs edge to edge; it sits first in the tree and is
              absolutely positioned, so content renders over it and the two
              scroll together as one surface. */}
          {animated && (
            <AnimatedDots
              dotColor={colors.up}
              fadeTo={colors.surfaceScreen}
              style={{
                position: "absolute",
                // Pulled well above the content inset so the field starts
                // behind the status-bar area and its top fade has room to
                // resolve — clipping it at the safe-area edge is what left
                // a visible seam across the top of the screen.
                top: -(spacing.xl + 120),
                left: -spacing.xl,
                right: -spacing.xl,
              }}
            />
          )}
          {/* Keyed by theme so the screen's own subtree remounts and
              re-reads colours on a switch, without disturbing the navigator
              above. Screen-local state resets, which is an acceptable cost
              for a rare, deliberate action — losing your place in the app
              was not. */}
          <View key={mode} style={scroll ? undefined : { flex: 1 }}>{children}</View>
        </Wrap>
        {footer}
      </Wrapper>
      </SafeAreaView>
    </View>
  );
}

// Back button is a small circular translucent pill (confirmed against the
// Figma file's own header pattern — 34px, rgba white 0.04 fill) rather than
// a bare chevron, and the title sits left-aligned next to it, not centered.
export function Header({ title, onBack, right }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backPill}>
          <Feather name="chevron-left" size={19} color={colors.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      {title ? (
        typeof title === "string"
          ? <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          : <View style={{ flex: 1 }}>{title}</View>
      ) : <View style={{ flex: 1 }} />}
      <View style={styles.headerBtn}>{right}</View>
    </View>
  );
}

export function Button({ children, onPress, variant = "primary", disabled, loading, style }) {
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
        style,
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

// `active` swaps the outline glyph for its filled twin and pops it, the way
// a favourite/like reads in a real app — an outline that only changes
// colour doesn't register as "this is now on". Ionicons is used for the
// toggleable ones because Feather ships outline-only and has no filled
// star/heart/bell to switch to.
export function IconButton({ icon, activeIcon, active, onPress, badge, size = 20, activeColor = colors.up, family = "feather" }) {
  const { style: pressStyle, onPressIn, onPressOut } = usePressScale(0.88);
  const pop = useRef(new Animated.Value(1)).current;
  const firstRun = useRef(true);

  useEffect(() => {
    // Don't pop on mount for something that was already on — only on the
    // actual off -> on transition the user just caused.
    if (firstRun.current) { firstRun.current = false; return; }
    if (!active) return;
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.38, duration: 130, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 240, useNativeDriver: true }),
    ]).start();
  }, [active]);

  const Glyph = family === "ionicons" ? Ionicons : Feather;
  const name = active && activeIcon ? activeIcon : icon;

  return (
    <AnimatedPressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={[pressStyle, styles.iconButton]} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Glyph name={name} size={size} color={active ? activeColor : colors.textPrimary} />
      </Animated.View>
      {badge ? <View style={styles.badgeDot} /> : null}
    </AnimatedPressable>
  );
}

export function Row({ icon, title, subtitle, right, onPress, danger }) {
  // A function style prop is a Pressable-only feature — View silently drops
  // it, taking the whole row style with it, which left every Row without an
  // onPress (e.g. a saved payment method) stacking vertically instead of
  // laying out as a row. Only Pressable gets the function form.
  if (!onPress) {
    return (
      <View style={styles.row}>
        <RowBody icon={icon} title={title} subtitle={subtitle} right={right} danger={danger} interactive={false} />
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.55 }]}>
      <RowBody icon={icon} title={title} subtitle={subtitle} right={right} danger={danger} interactive />
    </Pressable>
  );
}

function RowBody({ icon, title, subtitle, right, danger, interactive }) {
  return (
    <>
      {icon ? (
        <View style={styles.rowIcon}>
          <Feather name={icon} size={16} color={danger ? colors.down : colors.textSecondary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: colors.down }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : interactive ? <Feather name="chevron-right" size={18} color={colors.textTertiary} /> : null}
    </>
  );
}

// Glass card — BlurView for the translucent depth, a soft gradient sheen on
// top of it, matching the web app's --surface-card / --grad-card look.
export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={24} tint={isLightTheme() ? "light" : "dark"} style={StyleSheet.absoluteFillObject} />
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

// `right` renders a control inside the field's trailing edge (a password
// reveal toggle, a "Max" affordance) rather than forcing callers to lay one
// out beside the input and fight its height.
export function TextField({ value, onChangeText, placeholder, keyboardType, secureTextEntry, autoFocus, multiline, icon, right }) {
  if (!icon && !right) {
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
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {icon && <Feather name={icon} size={16} color={colors.textTertiary} style={{ position: "absolute", left: 16, zIndex: 1 }} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoFocus={autoFocus}
        style={[styles.input, { flex: 1 }, icon && { paddingLeft: 42 }, right && { paddingRight: 46 }]}
      />
      {right && <View style={{ position: "absolute", right: 16, zIndex: 1 }}>{right}</View>}
    </View>
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

// No entering animation here — these render immediately on screen mount as
// part of the initial content, so a fade-in on top of the native push
// transition just compounds into two animations running at once instead of
// one clean one. (ResultDialog's fade stays: it appears from setState after
// a user action, not during navigation, so it doesn't fight anything.)
export function EmptyState({ icon = "inbox", title, body }) {
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={28} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

// Pulsing placeholder, not a spinner — per the build contract, content
// that's still loading shows a wireframe of its own shape rather than a
// blocking spinner, so the screen doesn't visually jump when data arrives.
export function Skeleton({ width = "100%", height = 14, radius: r = 6, style }) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceRaised, opacity: pulse }, style]} />;
}

export function SkeletonRow() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
      <Skeleton width={36} height={36} radius={18} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="55%" height={13} />
        <Skeleton width="30%" height={11} />
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Skeleton width={64} height={13} />
        <Skeleton width={40} height={11} />
      </View>
    </View>
  );
}

// A real spinning indicator (not a static glyph) for any "this is actively
// working" moment — order processing, a simulated scan, a submit in flight.
export function Spinner({ size = 28, color = colors.up }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Feather name="loader" size={size} color={color} />
    </Animated.View>
  );
}

export function SkeletonList({ count = 6 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </View>
  );
}

export function Banner({ tone = "info", children }) {
  const toneColor = tone === "danger" ? colors.down : tone === "warn" ? colors.warn : colors.info;
  return (
    <View style={[styles.banner, { borderColor: toneColor + "55", backgroundColor: toneColor + "14" }]}>
      <Text style={[styles.bannerText, { color: toneColor }]}>{children}</Text>
    </View>
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
/**
 * Genuinely different per platform, not one blur trick used everywhere.
 *
 * iOS: BlurView's iOS materials (`systemThinMaterial` etc.) ARE the same
 * native UIVisualEffectView backing the OS's own tab bars and toolbars —
 * "official" in the literal sense, not an approximation of one. That's
 * worth using as-is.
 *
 * Android: expo-blur's Android path is a software blur, not a real system
 * material — there is no Android equivalent of UIVisualEffectView, and the
 * software approximation reads visibly flatter and greyer than the iOS
 * version sitting right next to it in the same codebase. Rather than ship
 * a worse-looking imitation of the iOS effect, Android gets Android's own
 * real answer to "a surface that floats above the page": Material
 * Design's elevation model — a solid surface lifted off the page by a real
 * shadow (`shadow.sheet`, which already carries the right shadowColor/
 * Offset/Opacity/Radius for iOS AND a real `elevation` value Android
 * actually renders). This is the same "use the official thing, and only
 * fall back to something else where the official thing doesn't hold up"
 * approach as everywhere else in this pass — for Android, floating-surface
 * elevation IS the official thing.
 *
 * Two earlier passes at glass here both failed for reasons that had
 * nothing to do with this platform split: pass 1 painted colour blobs
 * behind the glass "for it to refract", which leaked through the gaps as
 * raw colour; pass 2 gave up on blur everywhere, iOS included. Neither
 * problem applies here — the tab bar and hero row always float over real
 * scrolling content, so there's nothing extra to paint in, and iOS keeps
 * its real material this time.
 */
function GlassPanel({ radius: r, style, children }) {
  if (Platform.OS === "ios") {
    return (
      <View style={[{ borderRadius: r, overflow: "hidden", borderWidth: 1, borderColor: colors.borderDefault }, style]}>
        <BlurView intensity={80} tint={isLightTheme() ? "systemChromeMaterialLight" : "systemThinMaterialDark"} style={StyleSheet.absoluteFillObject} />
        {/* One real highlight, not a painted gradient wash — a hairline
            catching light along the top edge is what an actual glass rim
            looks like; a soft gradient over the whole surface just reads
            as "an effect" rather than a material. */}
        <View style={styles.tabBarSheen} />
        {children}
      </View>
    );
  }
  return (
    <View style={[{ borderRadius: r, backgroundColor: colors.surfaceCardSolid, borderWidth: 1, borderColor: colors.borderDefault }, shadow.sheet, style]}>
      {children}
    </View>
  );
}

export function TabBar({ navigation, active }) {
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === active));
  const [slotW, setSlotW] = useState(0);
  const slide = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    // Spring, not timing: the slight overshoot is what sells it as a
    // physical object being flicked between slots.
    Animated.spring(slide, { toValue: activeIndex, useNativeDriver: true, speed: 18, bounciness: 7 }).start();
  }, [activeIndex]);

  return (
    <View style={styles.tabBarWrap}>
      <GlassPanel radius={999} style={{ height: 64 }}>
        <View style={{ flexDirection: "row", alignItems: "center", height: "100%", paddingHorizontal: 12 }} onLayout={(e) => setSlotW((e.nativeEvent.layout.width - 24) / TABS.length)}>
          {slotW > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.tabPill, { width: slotW, transform: [{ translateX: Animated.multiply(slide, slotW) }], overflow: "hidden" }]}
            >
              {Platform.OS === "ios" ? (
                <BlurView intensity={40} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { borderRadius: 999, backgroundColor: colors.surfaceRaised }]} />
              )}
            </Animated.View>
          )}

          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <Pressable key={t.key} onPress={() => navigation.navigate(t.key)} style={styles.tabItem} hitSlop={8}>
                <Feather name={t.icon} size={20} color={isActive ? colors.textPrimary : colors.iconMuted} />
              </Pressable>
            );
          })}
        </View>
      </GlassPanel>
    </View>
  );
}

// Home hero action buttons (Deposit / Send / Receive / …) — same real
// per-platform material as the tab bar, via the same GlassPanel.
export function GlassAction({ icon, label, onPress, size = 58 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = (to) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => press(0.9)}
      onPressOut={() => press(1)}
      style={{ alignItems: "center", gap: 8 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <GlassPanel radius={size / 2} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
          <Feather name={icon} size={22} color={colors.textPrimary} />
        </GlassPanel>
      </Animated.View>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function PriceRow({ symbol, name, price, changePct, holding, iconUrl, currency = "usd", onPress }) {
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
        <Text style={[styles.rowTitle, { fontFamily: fonts.mono }]}>{formatMoney(price ?? 0, currency)}</Text>
        <Text style={{ fontSize: 12, marginTop: 2, fontFamily: fonts.mono, color: up ? colors.up : colors.down }}>{up ? "+" : ""}{(changePct ?? 0).toFixed(2)}%</Text>
      </View>
    </Pressable>
  );
}

function SheetBody({ title, children }) {
  const enter = useEnterAnimation({ fromY: 60 });
  return (
    <Animated.View style={[styles.sheetBody, enter]}>
      <BlurView intensity={50} tint={isLightTheme() ? "light" : "dark"} style={StyleSheet.absoluteFillObject} />
      <View style={styles.sheetHandle} />
      {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
      {/* maxHeight + overflow:hidden on the sheet clips anything past 75% of
          the screen instead of scrolling it — content that runs long
          (a card form plus its errors, a QR scanner plus its copy) was
          silently losing its bottom half, buttons included. Scrollable by
          default now; keyboardShouldPersistTaps so a tap on a button below
          the fold isn't eaten by the scroll view dismissing the keyboard first. */}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </Animated.View>
  );
}
export function Sheet({ open, onClose, title, children }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      {open && <SheetBody title={title}>{children}</SheetBody>}
    </Modal>
  );
}

function ResultCard({ tone, title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  const tint = tone === "success" ? colors.up : colors.down;
  const enter = useEnterAnimation({ fromY: 24 });
  return (
    <Animated.View style={[styles.resultCard, enter]}>
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
  );
}
export function ResultDialog({ tone = "success", title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.resultBackdrop}>
        <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFillObject} />
        <ResultCard tone={tone} title={title} message={message} primaryLabel={primaryLabel} onPrimary={onPrimary} secondaryLabel={secondaryLabel} onSecondary={onSecondary} />
      </View>
    </Modal>
  );
}

export { colors, spacing, radius, gradients, fonts, shadow };

// Built through a factory rather than declared once, because a
// StyleSheet.create at module scope snapshots colour values at import time
// and would keep the dark palette forever after a theme switch. `styles` is
// reassigned by the onThemeChange subscription below; components read
// `styles.x` during render, so they pick up the new sheet on the re-render
// that the theme change triggers.
const makeStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceScreen },
  body: { flex: 1, padding: spacing.xl },
  // Bumped from 48: the stock tab bar (see MainTabs.jsx) sits with
  // position:"absolute" on iOS — React Navigation's own docs call this out
  // explicitly as needing extra scroll clearance, since an absolutely
  // positioned bar no longer reserves its own layout space the way a
  // docked one does, and a translucent bar over unpadded content would
  // hide the last row or two of every tab screen behind it.
  scrollBody: { padding: spacing.xl, paddingBottom: 110 },

  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  headerBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  backPill: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.overlayWeak, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "left", color: colors.textPrimary, fontSize: 17, fontFamily: fonts.medium, letterSpacing: -0.2 },

  // Every primary/secondary action button in the Figma file is a full pill
  // (borderRadius = height/2), not a rounded rectangle — confirmed on
  // Welcome, Login and Signup's CTAs alike.
  button: { borderRadius: radius.pill, height: 50, paddingHorizontal: spacing.xl, alignItems: "center", justifyContent: "center", overflow: "hidden", ...shadow.cta },
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

  // Filter chips on Market are subtle outlines, not green fills — active
  // just gets a faint white fill + stronger border, confirmed against the
  // Market frame (311:181-188).
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderSubtle, marginRight: 8 },
  chipActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.borderDefault },
  chipLabel: { color: colors.textTertiary, fontSize: 12.5, fontFamily: fonts.medium },
  chipLabelActive: { color: colors.textPrimary },

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

  // NOTE: the tab bar's own surface (background/border/shadow) is now
  // built entirely by GlassPanel above — it branches per-platform, which a
  // single static style entry can't do. Nothing here provides that fill.
  tabBarWrap: { position: "absolute", left: 20, right: 20, bottom: 26 },
  tabItem: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", gap: 4 },
  // A glass rim highlight is a light reflection, not a themed border — it
  // has to stay a light line even on the light theme's surface, so this is
  // a fixed white rather than a `colors.x` token (which would go dark on
  // light theme and stop reading as a highlight at all).
  tabBarSheen: {
    position: "absolute", top: 0, left: 16, right: 16, height: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  // Background intentionally omitted — GlassAction/TabBar set it inline per
  // platform (a translucent BlurView on iOS, a solid fill on Android), and
  // a base fill here would sit as an opaque layer directly behind the iOS
  // blur, defeating its translucency.
  tabPill: {
    position: "absolute", left: 12, top: 8, bottom: 8, borderRadius: 999,
  },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheetBody: { position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden", backgroundColor: colors.sheetBg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, paddingTop: spacing.md, maxHeight: "75%", borderTopWidth: 1, borderColor: colors.borderSubtle },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.md },
  sheetTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: fonts.semibold, marginBottom: spacing.md },

  resultBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  resultCard: { alignItems: "center", width: "100%" },
  resultIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  resultTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.semibold },
  resultMessage: { color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, maxWidth: 280 },
});

let styles = makeStyles();
// Rebuild the sheet whenever the palette swaps. The re-render that shows
// the new styles comes from ThemeProvider bumping its context value.
onThemeChange(() => { styles = makeStyles(); });
