import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, TabBar, IconButton, SectionHeader, Row, Button, Banner, colors, spacing, radius } from "../ui/kit";
import { account } from "../data/mockWallet";
import { useApp, useToast } from "../state/store";
import { formatMoney } from "../lib/format";

// Same icon-circle + label pattern as Home's action row (confirmed against
// the Card frame 319:205) — not text-label buttons side by side.
function CardAction({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 8, flex: 1 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon} size={19} color={colors.textPrimary} />
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

export default function CardScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const card = state.card;
  const cardTx = state.wallet.transactions.filter((t) => t.kind === "card");

  const order = () => {
    dispatch({ type: "card/order" });
    toast("Card ordered.");
    setTimeout(() => {
      dispatch({ type: "card/activated", balance: 0 });
      toast("Card activated.");
    }, 2400);
  };

  return (
    <Screen footer={<TabBar navigation={navigation} active="Card" />}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600" }}>Card</Text>
        <IconButton icon="settings" onPress={() => navigation.navigate("Settings")} />
      </View>

      {!card.ordered && (
        <View style={{ alignItems: "center", gap: spacing.md, paddingVertical: 32 }}>
          <Feather name="credit-card" size={28} color={colors.textTertiary} />
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}>No card yet</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", paddingHorizontal: 20 }}>
            Order a Zenbit card to spend your balance anywhere. It arrives virtually straight away.
          </Text>
          <Button onPress={order}>Order a card</Button>
        </View>
      )}

      {card.ordered && card.activating && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Activating your card…</Text>
        </View>
      )}

      {card.ordered && !card.activating && (
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Card balance</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 4, marginBottom: spacing.md }}>{formatMoney(card.balance, "usd")}</Text>

          <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: colors.green800, opacity: card.frozen ? 0.5 : 1, marginBottom: spacing.md }}>
            <Text style={{ color: colors.textPrimary, fontSize: 12, letterSpacing: 1 }}>ZENBIT PRO</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, letterSpacing: 1, marginTop: 24 }}>•••• •••• •••• {card.last4}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>{account.name} · {card.expMonth}/{card.expYear}</Text>
          </View>

          <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
            <CardAction icon="plus" label="Top up" onPress={() => navigation.navigate("Buy")} />
            <CardAction
              icon={card.frozen ? "unlock" : "lock"}
              label={card.frozen ? "Unfreeze" : "Freeze"}
              onPress={() => { dispatch({ type: card.frozen ? "card/unfreeze" : "card/freeze" }); toast(card.frozen ? "Card unfrozen." : "Card frozen. Payments will decline."); }}
            />
            <CardAction icon="eye" label="Details" onPress={() => navigation.navigate("CardDetail")} />
            <CardAction icon="settings" label="Settings" onPress={() => navigation.navigate("Settings")} />
          </View>

          {card.frozen && <Banner tone="danger">This card is frozen — payments will be declined until you unfreeze it.</Banner>}
          {card.balance === 0 && !card.frozen && <Banner tone="warn">Card balance is empty. Top up before spending, or payments will decline.</Banner>}

          <View style={{ height: spacing.lg }} />
          <SectionHeader title="Card transactions" action="View all" onAction={() => navigation.navigate("RecentActivity")} />
          {cardTx.length ? (
            cardTx.map((t) => <Row key={t.id} icon="credit-card" title={t.title} subtitle={t.date} onPress={() => navigation.navigate("TransactionDetail", { id: t.id })} />)
          ) : (
            <Text style={{ color: colors.textTertiary, fontSize: 13, paddingVertical: 16 }}>No card transactions yet.</Text>
          )}
        </View>
      )}
    </Screen>
  );
}
