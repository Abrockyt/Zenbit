import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Screen, Header, Row, Sheet, Button, TextField, SegmentedControl, EmptyState, Banner, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useMarkets } from "../../data/useCoinGecko";
import { formatMoney } from "../../lib/format";

export default function PriceAlertsScreen({ navigation, route }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const prefill = route.params?.coin;
  const { data: markets, loading, error } = useMarkets(state.watchlist);

  const [open, setOpen] = useState(Boolean(prefill));
  const [coin, setCoin] = useState(prefill ?? state.watchlist[0]);
  const [direction, setDirection] = useState("above");
  const [target, setTarget] = useState("");

  const cur = state.settings.currency;
  const priceOf = (id) => markets?.find((m) => m.id === id)?.current_price ?? null;
  const selectedPrice = priceOf(coin);

  const add = () => {
    const value = Number(target);
    if (!Number.isFinite(value) || value <= 0) return;
    dispatch({ type: "alerts/add", alert: { id: `al${Date.now()}`, coinId: coin, symbol: markets?.find((m) => m.id === coin)?.symbol ?? "", direction, target: value, currency: cur } });
    setOpen(false); setTarget("");
    toast("Price alert set.");
  };

  return (
    <Screen>
      <Header title="Price alerts" onBack={() => navigation.goBack()} right={<Text onPress={() => setOpen(true)} style={{ color: colors.up, fontWeight: "600" }}>Add</Text>} />

      {state.priceAlerts.length === 0 ? (
        <EmptyState icon="trending-up" title="No alerts yet" body="Set a target and Zenbit tells you when a coin crosses it, up or down." />
      ) : (
        state.priceAlerts.map((a) => {
          const now = priceOf(a.coinId);
          const hit = now != null && (a.direction === "above" ? now >= a.target : now <= a.target);
          return (
            <Row
              key={a.id}
              icon={a.direction === "above" ? "trending-up" : "arrow-down"}
              title={`${a.symbol?.toUpperCase() || a.coinId} ${a.direction} ${formatMoney(a.target, a.currency)}`}
              subtitle={now == null ? "Fetching price…" : `Now ${formatMoney(now, cur)}${hit ? " · target reached" : ""}`}
              right={<Text onPress={() => { dispatch({ type: "alerts/remove", id: a.id }); toast("Alert removed."); }} style={{ color: colors.down, fontSize: 12 }}>Remove</Text>}
            />
          );
        })
      )}

      {error && <Banner tone="danger">Price feed unavailable. Your alerts are safe — we just can't show current prices right now.</Banner>}

      <Sheet open={open} onClose={() => setOpen(false)} title="New price alert">
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 8 }}>Coin</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md }}>
          {(markets ?? []).map((m) => (
            <Pressable key={m.id} onPress={() => setCoin(m.id)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: coin === m.id ? colors.surfaceRaised : colors.surfaceCard, borderWidth: 1, borderColor: coin === m.id ? colors.borderStrong : colors.borderSubtle }}>
              <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{m.symbol.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 8 }}>Trigger when price goes</Text>
        <SegmentedControl options={[{ value: "above", label: "Above" }, { value: "below", label: "Below" }]} value={direction} onChange={setDirection} />

        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: spacing.md, marginBottom: 8 }}>
          Target price{selectedPrice != null ? ` · now ${formatMoney(selectedPrice, cur)}` : ""}
        </Text>
        <TextField value={target} onChangeText={(v) => setTarget(v.replace(/[^\d.]/g, ""))} placeholder={selectedPrice != null ? String(Math.round(selectedPrice)) : "0.00"} keyboardType="decimal-pad" />

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button disabled={!target || Number(target) <= 0} onPress={add}>Set alert</Button>
          <Button variant="secondary" onPress={() => setOpen(false)}>Cancel</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
