import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Screen, Header, TextField, IconButton, Avatar, EmptyState, Banner, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { relativeTime } from "../../lib/time";

export default function ConversationScreen({ navigation, route }) {
  const { id } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [text, setText] = useState("");
  const thread = state.chat.threads.find((t) => t.id === id);
  const queuedHere = state.chat.queued.filter((q) => q.threadId === id);

  useEffect(() => {
    if (!state.network.online || state.chat.queued.length === 0) return;
    state.chat.queued.forEach((q) => {
      dispatch({ type: "chat/send", threadId: q.threadId, message: { id: `m${Date.now()}${Math.random().toString(16).slice(2, 5)}`, from: "me", body: q.body, at: Date.now() } });
    });
    dispatch({ type: "chat/flushQueue" });
    toast("Back online — queued messages sent.");
  }, [state.network.online]);

  const send = useAsyncAction(async ({ body }) => {
    if (body.trim() === "fail") throw new Error("The message didn't reach them.");
    dispatch({ type: "chat/send", threadId: id, message: { id: `m${Date.now()}`, from: "me", body: body.trim(), at: Date.now() } });
  }, { label: "Sending message" });

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    if (!state.network.online) {
      dispatch({ type: "chat/queue", item: { threadId: id, body, at: Date.now() } });
      setText("");
      return;
    }
    await send.run({ body });
    if (!send.isError) setText("");
  };

  if (!thread) {
    return (
      <Screen>
        <Header title="Messages" onBack={() => navigation.goBack()} />
        <EmptyState icon="inbox" title="Conversation not found" body="It may have been deleted." />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title={thread.with.name} onBack={() => navigation.goBack()} right={<Avatar initials={thread.with.initials} size={30} />} />

      <View style={{ flex: 1, justifyContent: "flex-end", gap: 8, paddingHorizontal: spacing.xl }}>
        {thread.messages.length === 0 && queuedHere.length === 0 && <EmptyState icon="message-circle" title="No messages yet" body={`Say something to ${thread.with.name.split(" ")[0]}.`} />}

        {thread.messages.map((m) => {
          const mine = m.from === "me";
          return (
            <View key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <View style={{ paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20, backgroundColor: mine ? "#fff" : colors.surfaceCard, borderWidth: mine ? 0 : 1, borderColor: colors.borderSubtle }}>
                <Text style={{ color: mine ? "#03150c" : colors.textPrimary, fontSize: 13 }}>{m.body}</Text>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 3, textAlign: mine ? "right" : "left" }}>{relativeTime(m.at)}</Text>
            </View>
          );
        })}

        {queuedHere.map((q, i) => (
          <View key={i} style={{ alignSelf: "flex-end", maxWidth: "78%", opacity: 0.55 }}>
            <View style={{ paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong, borderStyle: "dashed" }}>
              <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{q.body}</Text>
            </View>
            <Text style={{ color: colors.warn, fontSize: 11, marginTop: 3, textAlign: "right" }}>Queued — sends when you reconnect</Text>
          </View>
        ))}
      </View>

      {send.isError && <View style={{ paddingHorizontal: spacing.xl }}><Banner tone="danger">Message failed to send. {send.error?.message}</Banner></View>}

      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", padding: spacing.xl }}>
        <View style={{ flex: 1 }}>
          <TextField value={text} onChangeText={setText} placeholder="Message" />
        </View>
        <IconButton icon="send" onPress={submit} />
      </View>
    </Screen>
  );
}
