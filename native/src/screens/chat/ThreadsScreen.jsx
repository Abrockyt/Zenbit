import { View, Text, FlatList } from "react-native";
import { Screen, Header, Avatar, EmptyState, colors, spacing, radius } from "../../ui/kit";
import { useApp } from "../../state/store";
import { relativeTime } from "../../lib/time";

export default function ThreadsScreen({ navigation }) {
  const { state } = useApp();
  const threads = state.chat.threads
    .filter((t) => !state.social.blocked.includes(t.with.handle))
    .slice()
    .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));

  return (
    <Screen scroll={false}>
      <Header title="Messages" onBack={() => navigation.goBack()} />
      {state.chat.queued.length > 0 && <Text style={{ color: colors.warn, fontSize: 12, marginBottom: spacing.sm }}>{state.chat.queued.length} message{state.chat.queued.length > 1 ? "s" : ""} waiting to send.</Text>}

      {threads.length === 0 ? (
        <EmptyState icon="message-circle" title="No conversations yet" body="Message someone from their profile to start a thread." />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          renderItem={({ item: t }) => {
            const last = t.messages.at(-1);
            const theirTurn = last?.from === "them";
            return (
              <View onTouchEnd={() => navigation.navigate("Conversation", { id: t.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.sm }}>
                <Avatar initials={t.with.initials} />
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
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
