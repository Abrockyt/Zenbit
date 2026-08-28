import { useEffect, useRef } from "react";
import { Animated, View, Text, Pressable, Easing } from "react-native";
import { Feather } from "./IconCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius, fonts } from "../theme";
import { useApp } from "../state/store";

const ICONS = { success: "check-circle", danger: "alert-circle", warn: "alert-triangle", neutral: "info" };
const TINTS = { success: "up", danger: "down", warn: "warn", neutral: "info" };

function ToastRow({ toast, onDismiss }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
  }, []);

  const tone = TINTS[toast.tone] ?? "info";
  const tint = colors[tone];

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.lg,
          backgroundColor: colors.surfaceCardSolid, borderWidth: 1, borderColor: colors.borderDefault,
          marginTop: spacing.sm, marginHorizontal: spacing.lg,
          shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 8,
        }}
      >
        <Feather name={ICONS[toast.tone] ?? "info"} size={16} color={tint} />
        <Text style={{ color: colors.textPrimary, fontSize: 13.5, flex: 1, fontFamily: fonts.medium }}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Renders `state.toasts`.
 *
 * useToast() has always dispatched `toast/push` (and auto-dismissed itself
 * after 3s), but nothing in the app ever read `state.toasts` back out —
 * every toast() call across every screen was pushing into state that no
 * component consumed. Every "Reported.", "Muted.", "Copied.", "Following
 * @x." confirmation in the whole app has been silently invisible; this is
 * the missing other half.
 *
 * Mounted once above the navigator (see App.tsx) so a toast fired from any
 * screen — including ones stacked deep in the social section — surfaces in
 * the same place instead of needing a host on every individual screen.
 */
export default function ToastHost() {
  const { state, dispatch } = useApp();
  const insets = useSafeAreaInsets();

  if (!state.toasts.length) return null;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", top: insets.top + 4, left: 0, right: 0, zIndex: 999 }}>
      {state.toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={() => dispatch({ type: "toast/dismiss", id: t.id })} />
      ))}
    </View>
  );
}
