import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { Screen, Header, TextField, IconButton, colors, spacing, radius } from "../ui/kit";

export default function AiChatScreen({ navigation }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "ai", text: "Hi Aarav. I'm Zen, your AI co-pilot — I track your portfolio and the markets. How can I help?" },
    { id: 2, from: "me", text: "Is now a good time to buy ETH?" },
    { id: 3, from: "ai", text: "ETH is up 3.5% and reclaimed its 200-day average. RSI is 58 — room to run, not overbought. Your ETH is 28% of the book; adding keeps you diversified. I'd scale in rather than all at once." },
  ]);

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), from: "me", text: text.trim() }]);
    setText("");
    setTimeout(() => setMessages((m) => [...m, { id: Date.now() + 1, from: "ai", text: "I'm analyzing the latest market data to give you an updated recommendation." }]), 1000);
  };

  return (
    <Screen scroll={false}>
      <Header title="Zen AI" onBack={() => navigation.goBack()} />
      <FlatList
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ gap: 10, paddingBottom: spacing.md }}
        renderItem={({ item: m }) => (
          <View style={{ flexDirection: "row", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
            <View style={{ maxWidth: "80%", padding: 14, borderRadius: radius.lg, backgroundColor: m.from === "me" ? colors.green700 : colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 19 }}>{m.text}</Text>
            </View>
          </View>
        )}
      />
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", paddingTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <TextField value={text} onChangeText={setText} placeholder="Ask Zen anything..." />
        </View>
        <IconButton icon="arrow-up" onPress={send} />
      </View>
    </Screen>
  );
}
