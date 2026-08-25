import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Avatar, TextField, IconButton, EmptyState, Sheet, colors, spacing, radius } from "../../ui/kit";
import { useApp } from "../../state/store";
import { relativeTime } from "../../lib/time";
import { DIRECTORY_LIST } from "../../data/directory";

export default function ThreadsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);

  const threads = state.chat.threads
    .filter((t) => !state.social.blocked.includes(t.with.handle))
    .slice()
    .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.with.name.toLowerCase().includes(q) || t.with.handle.toLowerCase().includes(q));
  }, [threads, query]);

  const pickable = useMemo(
    () => DIRECTORY_LIST.filter((p) => !state.social.blocked.includes(p.handle)),
    [state.social.blocked]
  );

  const openWith = (person) => {
    const existing = state.chat.threads.find((t) => t.with.handle === person.handle);
    if (existing) {
      navigation.navigate("Conversation", { id: existing.id });
    } else {
      const thread = { id: `th${Date.now()}`, with: { handle: person.handle, name: person.name, initials: person.initials, avatarUrl: person.avatarUrl }, messages: [] };
      dispatch({ type: "chat/startThread", thread });
      navigation.navigate("Conversation", { id: thread.id });
    }
    setPicking(false);
  };

  return (
    <Screen scroll={false}>
      <Header title="Messages" onBack={() => navigation.goBack()} right={<IconButton icon="edit" onPress={() => setPicking(true)} />} />
      {state.chat.queued.length > 0 && <Text style={{ color: colors.warn, fontSize: 12, marginBottom: spacing.sm }}>{state.chat.queued.length} message{state.chat.queued.length > 1 ? "s" : ""} waiting to send.</Text>}

      <TextField value={query} onChangeText={setQuery} placeholder="Search conversations" icon="search" />
      <View style={{ height: spacing.md }} />

      {filtered.length === 0 ? (
        <EmptyState
          icon="message-circle"
          title={query ? "No matches" : "No conversations yet"}
          body={query ? "Try a different name or handle." : "Tap the compose icon to message someone."}
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={({ item: t }) => {
            const last = t.messages.at(-1);
            const theirTurn = last?.from === "them";
            return (
              <Pressable onPress={() => navigation.navigate("Conversation", { id: t.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.sm }}>
                <Avatar uri={t.with.avatarUrl} initials={t.with.initials} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{t.with.name}</Text>
                    {last && <Text style={{ color: colors.textTertiary, fontSize: 11 }}>{relativeTime(last.at)}</Text>}
                  </View>
                  <Text numberOfLines={1} style={{ color: theirTurn ? colors.textPrimary : colors.textTertiary, fontSize: 13, marginTop: 2 }}>
                    {last ? `${last.from === "me" ? "You: " : ""}${last.body}` : "No messages yet"}
                  </Text>
                </View>
                {theirTurn && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.up }} />}
              </Pressable>
            );
          }}
        />
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title="New message">
        <View style={{ gap: spacing.sm }}>
          {pickable.map((p) => (
            <Pressable key={p.handle} onPress={() => openWith(p)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
              <Avatar uri={p.avatarUrl} initials={p.initials} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{p.name}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12 }}>@{p.handle}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}
