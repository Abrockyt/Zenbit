import { View, Text, Pressable, Image } from "react-native";
import { Feather } from "../ui/IconCompat";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, TabBar, IconButton, SectionHeader, Row, Button, Banner, Skeleton, colors, spacing, radius, gradients, fonts } from "../ui/kit";
import { account } from "../data/mockWallet";
import { useApp, useToast } from "../state/store";
import { formatMoney } from "../lib/format";
import { useBootReady } from "../state/useBootReady";

// EMV chip. Real chips are a gold contact plate divided into distinct pads —
// the pad grid is the detail that makes a rendered card read as a card
// rather than a rounded rectangle with numbers on it. Drawn with a gradient
// plus hairline dividers; no image asset needed.
function EmvChip({ frozen }) {
  const line = { position: "absolute", backgroundColor: "rgba(90,72,20,0.55)" };
  return (
    <View style={{ width: 42, height: 32, borderRadius: 6, overflow: "hidden", opacity: frozen ? 0.5 : 1 }}>
      <LinearGradient
        colors={frozen ? ["#8A8A8A", "#B8B8B8", "#8A8A8A"] : ["#C9A227", "#EFD98A", "#B8912A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
      {/* Contact pads: two horizontal splits, one vertical, plus the
          centre island — the standard ISO-7816 pad layout. */}
      <View style={[line, { left: 0, right: 0, top: 10, height: 1 }]} />
      <View style={[line, { left: 0, right: 0, top: 21, height: 1 }]} />
      <View style={[line, { top: 0, bottom: 0, left: 14, width: 1 }]} />
      <View style={[line, { top: 10, height: 11, left: 14, width: 14, backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(90,72,20,0.55)" }]} />
    </View>
  );
}

// Contactless mark — four nested arcs. Feather has no NFC glyph, so it's
// built from concentric circles clipped to their right quarter, which is
// what the real symbol is.
function ContactlessMark({ frozen }) {
  const tint = frozen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)";
  return (
    <View style={{ width: 20, height: 26, justifyContent: "center", overflow: "hidden" }}>
      {[7, 12, 17, 22].map((size, i) => (
        <View
          key={size}
          style={{
            position: "absolute",
            left: -size / 2,
            top: 13 - size / 2,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.6,
            borderColor: tint,
            opacity: 1 - i * 0.12,
          }}
        />
      ))}
    </View>
  );
}

// Zenbit's own network mark — two interlocking rings, deliberately generic
// so it reads as "a card network" without imitating any real trademark.
function NetworkMark({ frozen }) {
  const o = frozen ? 0.35 : 1;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `rgba(58,222,126,${0.85 * o})` }} />
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `rgba(255,255,255,${0.55 * o})`, marginLeft: -9 }} />
    </View>
  );
}

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
  // Nothing here comes from a network fetch, so without a deliberate beat
  // the whole screen — balance, card art, transaction list — just snapped
  // into place with no loading treatment at all, unlike every other tab
  // which has a real skeleton tied to an actual fetch.
  const ready = useBootReady();

  if (!ready) {
    return (
      <Screen>
        <Skeleton width={70} height={22} style={{ marginBottom: spacing.lg }} />
        <Skeleton width={140} height={13} style={{ marginBottom: 8 }} />
        <Skeleton width={190} height={30} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={200} radius={radius.xl} style={{ marginBottom: spacing.lg }} />
        <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg }}>
          <Skeleton width={64} height={64} radius={32} />
          <Skeleton width={64} height={64} radius={32} />
          <Skeleton width={64} height={64} radius={32} />
        </View>
        <Skeleton width={120} height={13} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="100%" height={52} radius={radius.md} style={{ marginBottom: spacing.sm }} />
        <Skeleton width="100%" height={52} radius={radius.md} />
      </Screen>
    );
  }

  const order = () => {
    dispatch({ type: "card/order" });
    toast("Card ordered.");
    setTimeout(() => {
      dispatch({ type: "card/activated", balance: 0 });
      toast("Card activated.");
    }, 2400);
  };

  return (
    <Screen>
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

          <View style={{ borderRadius: radius.xl, overflow: "hidden", opacity: card.frozen ? 0.55 : 1, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderDefault }}>
            <LinearGradient colors={gradients.bankCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ aspectRatio: 1.586, padding: 20, justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Image source={require("../../assets/icon.png")} style={{ width: 26, height: 26, borderRadius: 7 }} />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, letterSpacing: 1, fontFamily: fonts.medium }}>ZENBIT PRO</Text>
              </View>
              {/* Chip + contactless sit together on the left, mid-card —
                  where they physically are on a real card. */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <EmvChip frozen={card.frozen} />
                <ContactlessMark frozen={card.frozen} />
              </View>

              <View>
                <Text style={{ color: "#fff", fontSize: 17, letterSpacing: 2, fontFamily: fonts.mono }}>•••• •••• •••• {card.last4}</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 7.5, letterSpacing: 0.8, marginBottom: 2 }}>CARDHOLDER</Text>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, letterSpacing: 0.5 }}>{account.name.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 7.5, letterSpacing: 0.8, marginBottom: 2 }}>EXPIRES</Text>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: fonts.mono }}>{card.expMonth}/{card.expYear}</Text>
                  </View>
                  <NetworkMark frozen={card.frozen} />
                </View>
              </View>
            </LinearGradient>
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
