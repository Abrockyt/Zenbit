import { View, Text } from "react-native";
import { Feather } from "../ui/IconCompat";
import { Screen, Header, Button, Row, Banner, EmptyState, colors, spacing, radius } from "../ui/kit";
import { useApp, useToast } from "../state/store";
import { useAsyncAction } from "../state/useAsyncAction";
import { formatMoney, formatCrypto } from "../lib/format";

const KIND_LABEL = { send: "Sent", receive: "Received", swap: "Swapped", buy: "Bought", sell: "Sold", card: "Card payment" };

export default function TransactionDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { state, dispatch } = useApp();
  const toast = useToast();
  const cur = state.settings.currency;
  const tx = state.wallet.transactions.find((t) => t.id === id);

  const speedUp = useAsyncAction(async () => {
    dispatch({ type: "wallet/patchTransaction", id, patch: { status: "complete", subtitle: `${tx.subtitle} · fee bumped` } });
  }, { label: "Bumping fee" });

  const cancel = useAsyncAction(async () => {
    if (tx.units && tx.symbol) {
      const holding = state.wallet.holdings.find((h) => h.symbol === tx.symbol);
      if (holding) dispatch({ type: "wallet/adjustUnits", id: holding.id, delta: tx.units + (tx.fee ?? 0) });
    }
    dispatch({ type: "wallet/patchTransaction", id, patch: { status: "cancelled" } });
  }, { label: "Cancelling transaction" });

  if (!tx) {
    return (
      <Screen>
        <Header title="Transaction" onBack={() => navigation.goBack()} />
        <EmptyState icon="inbox" title="Transaction not found" body="It may have been cleared from this device." />
      </Screen>
    );
  }

  const pending = tx.status === "pending";
  const cancelled = tx.status === "cancelled";
  const tone = cancelled ? colors.textTertiary : tx.negative ? colors.down : colors.up;

  const rows = [
    ["Type", KIND_LABEL[tx.kind] ?? tx.kind],
    ["Detail", tx.subtitle],
    ["When", tx.date],
    tx.fee != null && tx.symbol ? ["Network fee", formatCrypto(tx.fee, tx.symbol.toUpperCase())] : null,
    tx.address ? ["To", `${tx.address.slice(0, 10)}…${tx.address.slice(-8)}`] : null,
  ].filter(Boolean);

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
          {pending && (
            <>
              <Button loading={speedUp.isLoading} onPress={() => speedUp.run().then(() => toast("Fee bumped — this should confirm shortly."))}>Speed up</Button>
              <Button variant="secondary" loading={cancel.isLoading} onPress={() => cancel.run().then(() => toast("Transaction cancelled. Funds returned."))}>Cancel transaction</Button>
            </>
          )}
          <Button variant="secondary" onPress={() => navigation.navigate("RecentActivity")}>Back to activity</Button>
        </View>
      }
    >
      <Header title={KIND_LABEL[tx.kind] ?? "Transaction"} onBack={() => navigation.goBack()} />

      <View style={{ alignItems: "center", gap: 8, paddingVertical: 28, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }}>
          <Feather name={tx.negative ? "arrow-up" : "arrow-down"} size={20} color={tone} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: "700" }}>{tx.negative ? "−" : "+"}{formatMoney(tx.amount, cur)}</Text>
        {tx.units && tx.symbol && <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{formatCrypto(tx.units, tx.symbol.toUpperCase())}</Text>}
        <Text style={{ marginTop: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, fontSize: 12, color: pending ? colors.warn : cancelled ? colors.textTertiary : colors.up, backgroundColor: pending ? "rgba(245,181,68,0.14)" : cancelled ? colors.surfaceRaised : "rgba(58,222,126,0.14)" }}>
          {pending ? "Pending confirmation" : cancelled ? "Cancelled" : "Complete"}
        </Text>
      </View>

      <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, gap: 13, marginBottom: spacing.md }}>
        {rows.map(([k, v]) => (
          <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{k}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13, textAlign: "right", maxWidth: "62%" }}>{v}</Text>
          </View>
        ))}
      </View>

      {(speedUp.isError || cancel.isError) && (
        <View style={{ marginBottom: spacing.md }}>
          <Banner tone="danger">That didn't go through. {(speedUp.error ?? cancel.error)?.message} The transaction is unchanged.</Banner>
        </View>
      )}

    </Screen>
  );
}
