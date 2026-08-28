import { useEffect, useRef, useState } from "react";
import { Animated, View, Text, Pressable, Easing } from "react-native";
import { Feather } from "./IconCompat";
import { colors, spacing, radius, fonts } from "../theme";

/**
 * The one place the app talks about connection health.
 *
 * The guiding rule: **a hiccup we are already handling is not an error.**
 * CoinGecko's free tier rate-limits routinely, and the data layer already
 * absorbs that (cached values, exponential backoff, automatic retry). The
 * previous UI still shouted about it — red "Reconnecting…" text and a
 * "Couldn't refresh" warning — so a working, self-healing app read as
 * broken. Nothing here is red unless the person actually has no data.
 *
 * Four states, deliberately ordered by how much they interrupt:
 *   fresh     - say nothing loud; just when it last updated
 *   updating  - a spinning dot; no words about failure
 *   stale     - amber, factual, and says when it will retry itself
 *   empty     - the only state that gets a real error treatment
 */

// Breathing dot — motion is what communicates "working on it" without
// needing the word "error" anywhere.
function PulseDot({ color, animate }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!animate) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate]);

  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: pulse }} />;
}

function useNow(active) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
}

function ago(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

/**
 * Inline one-liner for screens that already show data. Never blocks
 * content, never uses the error colour while values are on screen.
 */
export function SyncStatus({ lastSuccessAt, error, refreshing, retryAt, onRetry, style }) {
  useNow(true);

  const stale = !!error;
  const waiting = retryAt && Date.now() < retryAt;
  const secondsToRetry = waiting ? Math.ceil((retryAt - Date.now()) / 1000) : 0;

  if (!stale) {
    if (!lastSuccessAt && !refreshing) return null;
    return (
      <View style={[{ flexDirection: "row", alignItems: "center", gap: 6 }, style]}>
        <PulseDot color={refreshing ? colors.info : colors.up} animate={refreshing} />
        <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>
          {refreshing ? "Updating…" : `Updated ${ago(lastSuccessAt)}`}
        </Text>
      </View>
    );
  }

  // Degraded, but there are still real numbers on screen. Amber, quiet, and
  // explicit that it recovers on its own — the person doesn't have to do
  // anything, so don't imply they do.
  //
  // One line, one fact at a time — this used to concatenate "paused · last
  // updated Xs ago · retrying in Ns" into a single run, which was too long
  // for the row, wrapped onto a second line, and pushed the retry button
  // down into the middle of the wrapped text instead of sitting beside it.
  // "Retrying in Ns" already implies staleness, so the two are redundant;
  // showing whichever one is more useful right now is enough.
  const message = refreshing
    ? "Reconnecting…"
    : waiting
      ? `Prices paused · retrying in ${secondsToRetry}s`
      : lastSuccessAt
        ? `Prices paused · updated ${ago(lastSuccessAt)}`
        : "Prices paused";

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 6 }, style]}>
      <PulseDot color={colors.warn} animate={refreshing} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: colors.textTertiary, fontSize: 11.5, flex: 1 }}>
        {message}
      </Text>
      {onRetry && !refreshing && (
        <Pressable
          onPress={onRetry}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 24, height: 24, borderRadius: 12,
            alignItems: "center", justifyContent: "center",
            backgroundColor: colors.surfaceRaised,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Feather name="refresh-cw" size={12} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

/**
 * Full-screen state for when there is genuinely nothing to show. Still
 * avoids blaming the person or implying data loss — it explains what
 * happened, that it retries by itself, and offers a manual nudge.
 */
export function SyncEmptyState({ error, refreshing, retryAt, onRetry, title, body }) {
  useNow(true);

  const rateLimited = String(error).includes("429") || /rate limit/i.test(String(error));
  const waiting = retryAt && Date.now() < retryAt;
  const secondsToRetry = waiting ? Math.ceil((retryAt - Date.now()) / 1000) : 0;

  return (
    <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
      <View
        style={{
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1, borderColor: colors.borderSubtle,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Feather name={rateLimited ? "clock" : "wifi-off"} size={21} color={colors.textSecondary} />
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: 15.5, fontFamily: fonts.semibold }}>
        {title ?? (rateLimited ? "Catching our breath" : "Can't reach the price feed")}
      </Text>

      <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 19 }}>
        {body ??
          (rateLimited
            ? "The free price feed limits how often we can ask. Your balances are safe — prices come back on their own."
            : "Your wallet and balances are safe. We'll keep trying in the background.")}
      </Text>

      {/* A live countdown turns dead waiting into something legible, and
          proves the app is still working on it. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 }}>
        <PulseDot color={refreshing ? colors.info : colors.warn} animate />
        <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
          {refreshing ? "Trying now…" : waiting ? `Retrying in ${secondsToRetry}s` : "Retrying shortly"}
        </Text>
      </View>

      {onRetry && !refreshing && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8,
            paddingVertical: 10, paddingHorizontal: 18, borderRadius: radius.pill,
            backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderDefault,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Feather name="refresh-cw" size={13} color={colors.textPrimary} />
          <Text style={{ color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium }}>Try now</Text>
        </Pressable>
      )}
    </View>
  );
}
