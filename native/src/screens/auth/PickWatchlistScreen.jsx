import { useState } from "react";
import { View, Text, Image, Pressable, FlatList } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, Button, SkeletonList, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useMarkets } from "../../data/useCoinGecko";

// Personalized dashboards correlate with satisfaction (see the
// zenbit-crypto-app-ux-research memory) — folding this into signup means
// Home's watchlist has real, user-chosen content from the first session
// instead of either an empty tab or a fixed default nobody picked.
//
// Reused post-signup too (Home's "pick coins" empty-state CTA passes
// route.params.mode === "edit"), where it edits the existing watchlist in
// place and returns instead of continuing the signup stack.
export default function PickWatchlistScreen({ navigation, route }) {
  const editing = route.params?.mode === "edit";
  const { state, dispatch } = useApp();
  const toast = useToast();
  const { data: markets, loading, error, refetch } = useMarkets(null);
  const [picked, setPicked] = useState(() => new Set(editing ? state.watchlist : []));

  function toggle(id) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function finish() {
    dispatch({ type: "watchlist/set", ids: Array.from(picked) });
    if (editing) {
      toast(picked.size ? `Tracking ${picked.size} coin${picked.size === 1 ? "" : "s"}.` : "Watchlist cleared.");
      navigation.goBack();
    } else {
      navigation.navigate("FaceId");
    }
  }

  function skip() {
    if (editing) {
      navigation.goBack();
      return;
    }
    // Explicit, not just "leave whatever was there" — a skipped pick should
    // mean a genuinely empty watchlist (matching the fresh-$0-balance
    // signup), not silently keeping whatever the pre-signup default was.
    dispatch({ type: "watchlist/set", ids: [] });
    navigation.navigate("FaceId");
  }

  return (
    <Screen
      scroll={false}
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm }}>
          <Button onPress={finish}>{picked.size ? `Continue (${picked.size})` : "Continue"}</Button>
          {!editing && <Button variant="secondary" onPress={skip}>Skip for now</Button>}
        </View>
      }
    >
      <Header title="" onBack={editing ? () => navigation.goBack() : undefined} />
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>
        {editing ? "Edit your watchlist" : "Which coins interest you?"}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, marginBottom: spacing.lg }}>
        Pick a few to track on your home screen. You can change this any time.
      </Text>

      {error && !markets?.length ? (
        <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
          <Feather name="wifi-off" size={24} color={colors.textTertiary} />
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>Couldn't load coins</Text>
          <View style={{ marginTop: 6, minWidth: 150 }}>
            <Button onPress={refetch}>Try again</Button>
          </View>
        </View>
      ) : loading && !markets?.length ? (
        <SkeletonList count={8} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={markets}
          keyExtractor={(c) => c.id}
          renderItem={({ item: c }) => {
            const active = picked.has(c.id);
            return (
              <Pressable
                onPress={() => toggle(c.id)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
              >
                {c.image ? (
                  <Image source={{ uri: c.image }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceRaised }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>{c.name}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{c.symbol?.toUpperCase()}</Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? colors.up : "transparent",
                    borderWidth: active ? 0 : 1.5,
                    borderColor: colors.borderDefault,
                  }}
                >
                  {active && <Feather name="check" size={13} color={colors.ink0} />}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
