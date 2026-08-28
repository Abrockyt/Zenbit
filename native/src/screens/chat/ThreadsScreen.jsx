import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Avatar, TextField, EmptyState, Sheet, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp } from "../../state/store";
import { relativeTime } from "../../lib/time";
import { DIRECTORY_LIST } from "../../data/directory";

/**
 * Direct messages, laid out the way Instagram's inbox is: your handle and a
 * compose action in the header, a pill search field, a "Messages" heading
 * with a Requests link, then borderless full-bleed rows — avatar, name,
 * one-line preview with a "·" separated timestamp, unread shown by weight
 * rather than a badge.
 *
 * No story/notes rail: those belong to a product with an ephemeral posting
 * feature, and inventing one here would be a decorative shell over nothing.
 */

// Compact, chat-style relative time: IG shows "5h", not "5 hours ago".
function shortTime(ts) {
  if (!ts) return "";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

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

  // Real message requests: people who follow you that you have no thread
  // with yet. Not a fabricated counter — tapping through opens a real
  // conversation with that person.
  const requests = useMemo(
    () =>
      state.social.followers.filter(
        (h) => !state.social.following.includes(h) && !state.chat.threads.some((t) => t.with.handle === h)
      ),
    [state.social.followers, state.social.following, state.chat.threads]
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

  const openRequest = (handle) => {
    const p = DIRECTORY_LIST.find((x) => x.handle === handle);
    if (p) openWith(p);
  };

  return (
    <Screen scroll={false} bg="black">
      {/* Header: your own handle, IG-style, with compose on the right. */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Feather name="chevron-left" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 19, fontFamily: fonts.bold }} numberOfLines={1}>
            {state.session.user.name?.split(" ")[0]?.toLowerCase() ?? "you"}
          </Text>
        </View>
        <Pressable onPress={() => setPicking(true)} hitSlop={12}>
          <Feather name="edit" size={21} color={colors.textPrimary} />
        </Pressable>
      </View>

      <TextField value={query} onChangeText={setQuery} placeholder="Search" icon="search" />

      {state.chat.queued.length > 0 && (
        <Text style={{ color: colors.warn, fontSize: 12, marginTop: spacing.sm }}>
          {state.chat.queued.length} message{state.chat.queued.length > 1 ? "s" : ""} waiting to send.
        </Text>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg, marginBottom: spacing.xs }}>
        <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>Messages</Text>
        {requests.length > 0 && (
          <Pressable onPress={() => openRequest(requests[0])} hitSlop={8}>
            <Text style={{ color: colors.info, fontSize: 13.5, fontFamily: fonts.semibold }}>
              Requests ({requests.length})
            </Text>
          </Pressable>
        )}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="message-circle"
          title={query ? "No matches" : "No messages yet"}
          body={query ? "Try a different name or handle." : "Tap the compose icon to message someone."}
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(t) => t.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: t }) => {
            const last = t.messages.at(-1);
            // Unread = they spoke last. IG signals this with weight and a
            // dot rather than a card treatment.
            const unread = last?.from === "them";
            return (
              <Pressable
                onPress={() => navigation.navigate("Conversation", { id: t.id })}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: 13,
                  paddingVertical: 10,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Avatar uri={t.with.avatarUrl} initials={t.with.initials} size={56} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 14.5,
                      fontFamily: unread ? fonts.semibold : fonts.regular,
                    }}
                    numberOfLines={1}
                  >
                    {t.with.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      color: unread ? colors.textPrimary : colors.textTertiary,
                      fontSize: 13.5,
                      marginTop: 3,
                      fontFamily: unread ? fonts.medium : fonts.regular,
                    }}
                  >
                    {last ? `${last.from === "me" ? "You: " : ""}${last.body}` : "No messages yet"}
                    {last ? ` · ${shortTime(last.at)}` : ""}
                  </Text>
                </View>
                {unread ? (
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.info }} />
                ) : (
                  <Feather name="camera" size={20} color={colors.textTertiary} />
                )}
              </Pressable>
            );
          }}
        />
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title="New message">
        <View style={{ gap: spacing.sm }}>
          {pickable.map((p) => (
            <Pressable key={p.handle} onPress={() => openWith(p)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
              <Avatar uri={p.avatarUrl} initials={p.initials} size={44} />
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
