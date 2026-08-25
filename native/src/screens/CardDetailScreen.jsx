import { View, Text } from "react-native";
import { Screen, Header, Button, Row, Banner, EmptyState, colors, spacing, radius } from "../ui/kit";
import { useApp, useToast } from "../state/store";
import { formatMoney } from "../lib/format";

export default function CardDetailScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const card = state.card;
  const cardTx = state.wallet.transactions.filter((t) => t.kind === "card");

  if (!card.ordered) {
    return (
      <Screen>
        <Header title="Card" onBack={() => navigation.goBack()} />
        <EmptyState icon="credit-card" title="No card yet" body="Order a Zenbit card to spend your balance anywhere." />
        <Button onPress={() => navigation.navigate("Card")}>Order a card</Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Card details" onBack={() => navigation.goBack()} />

      <View style={{ padding: 24, borderRadius: radius.lg, minHeight: 190, backgroundColor: colors.green800, justifyContent: "space-between", opacity: card.frozen ? 0.5 : 1, marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.textPrimary, fontSize: 12, letterSpacing: 1 }}>ZENBIT PRO</Text>
          {card.frozen && <Text style={{ color: colors.textPrimary, fontSize: 11, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }}>Frozen</Text>}
        </View>
        <View>
          <Text style={{ color: colors.textPrimary, fontSize: 16, letterSpacing: 1 }}>•••• •••• •••• {card.last4}</Text>
          <View style={{ flexDirection: "row", gap: 20, marginTop: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{state.session.user.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{card.expMonth}/{card.expYear}</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: spacing.md }}>
        <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Card balance</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}>{formatMoney(card.balance, "usd")}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg }}>
        <Button style={{ flex: 1 }} onPress={() => navigation.navigate("Buy")}>Top up</Button>
        <Button style={{ flex: 1 }} variant="secondary" onPress={() => { dispatch({ type: card.frozen ? "card/unfreeze" : "card/freeze" }); toast(card.frozen ? "Card unfrozen." : "Card frozen. Payments will decline."); }}>
          {card.frozen ? "Unfreeze" : "Freeze"}
        </Button>
      </View>

      <Row icon="eye" title="Show full number" subtitle="Requires your passcode" onPress={() => toast("Confirm your identity in Settings → Security to reveal card details.")} />
      <Row icon="lock" title="Change PIN" onPress={() => toast("A new PIN was sent to your registered device.")} />
      <Row icon="alert-triangle" title="Report lost or stolen" danger onPress={() => { dispatch({ type: "card/freeze" }); toast("Card frozen and a replacement ordered."); }} />
      <Row icon="message-circle" title="Contact support" onPress={() => toast("Support will reply by email within a day.")} />

      <View style={{ height: spacing.lg }} />
      {cardTx.length === 0 ? (
        <EmptyState icon="credit-card" title="No card spend yet" body="Payments made with this card will show up here." />
      ) : (
        cardTx.map((t) => <Row key={t.id} icon="credit-card" title={t.title} subtitle={t.date} right={<Text style={{ color: colors.textPrimary, fontSize: 13 }}>−{formatMoney(t.amount, "usd")}</Text>} onPress={() => navigation.navigate("TransactionDetail", { id: t.id })} />)
      )}

      <View style={{ marginTop: spacing.lg }}>
        <Banner>Freezing is instant and reversible. Nothing can be spent while the card is frozen.</Banner>
      </View>
    </Screen>
  );
}
