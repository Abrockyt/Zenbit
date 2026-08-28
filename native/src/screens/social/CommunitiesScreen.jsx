import { useState, useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, TextField, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { COMMUNITIES } from "../../data/communities";
import { compactCount } from "./PostCard";

// Discovery directory for communities, with real join/leave state.
export default function CommunitiesScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [query, setQuery] = useState("");

  const joined = state.social.communities;
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMUNITIES;
    return COMMUNITIES.filter((c) => c.name.toLowerCase().includes(q) || c.about.toLowerCase().includes(q));
  }, [query]);

  const toggle = (c) => {
    dispatch({ type: "social/toggleCommunity", id: c.id });
    toast(joined.includes(c.id) ? `Left ${c.name}.` : `Joined ${c.name}.`);
  };

  return (
    <Screen bg="black">
      <Header title="Communities" onBack={() => navigation.goBack()} />
      <TextField value={query} onChangeText={setQuery} placeholder="Search communities" icon="search" />
      <View style={{ height: spacing.md }} />

      {list.length === 0 && (
        <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", paddingVertical: 20 }}>
          Nothing matches "{query}".
        </Text>
      )}

      {list.map((c) => {
        const isJoined = joined.includes(c.id);
        return (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate("Community", { id: c.id })}
            style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}
          >
            <Image source={{ uri: c.banner }} style={{ width: "100%", height: 92, backgroundColor: colors.surfaceRaised }} />
            <View style={{ padding: 14, backgroundColor: colors.surfaceCard, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                {c.icon ? (
                  <Image source={{ uri: c.icon }} style={{ width: 26, height: 26, borderRadius: 13 }} />
                ) : (
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="users" size={12} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14.5, fontFamily: fonts.semibold }}>{c.name}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>
                    {compactCount(c.members)} members · {compactCount(c.online)} online
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggle(c)}
                  style={{
                    paddingVertical: 7, paddingHorizontal: 15, borderRadius: 999,
                    backgroundColor: isJoined ? "transparent" : colors.textPrimary,
                    borderWidth: isJoined ? 1 : 0, borderColor: colors.borderStrong,
                  }}
                >
                  <Text style={{ color: isJoined ? colors.textPrimary : colors.ink0, fontSize: 12.5, fontFamily: fonts.semibold }}>
                    {isJoined ? "Joined" : "Join"}
                  </Text>
                </Pressable>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>{c.about}</Text>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}
