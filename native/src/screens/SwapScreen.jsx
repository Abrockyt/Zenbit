import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, TabBar, TextField, Button, Sheet, ResultDialog, Banner, colors, spacing, radius, gradients, fonts } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp, useToast } from "../state/store";

const PAIR_IDS = ["bitcoin", "ethereum", "solana", "tether", "usd-coin", "chainlink"];

// Glass "You pay / You receive" panels with a floating flip icon between
// them — confirmed against the real Swap frame (318:158), which is
// meaningfully different from a flat form: two large blurred cards, a
// circular direction indicator overlapping both.
const swapStyles = StyleSheet.create({
  panel: { padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, overflow: "hidden", gap: 8 },
  panelLabel: { color: colors.textTertiary, fontSize: 12 },
  panelSub: { color: colors.textTertiary, fontSize: 12 },
  receiveAmount: { color: colors.textPrimary, fontSize: 26, fontFamily: fonts.mono },
  coinPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surfaceRaised, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  coinPillText: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium },
  flipButton: { position: "absolute", top: "50%", left: "50%", marginLeft: -18, marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink3, borderWidth: 3, borderColor: colors.surfaceScreen, alignItems: "center", justifyContent: "center", zIndex: 5 },
});

function KeyValue({ label, value }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
      <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{value}</Text>
    </View>
  );
}

// Deterministic failure ("999") preserved from the web version so the
// error + recovery path is reachable on demand, not by chance.
export default function SwapScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const { data: markets, loading, error } = useMarkets(PAIR_IDS);

  const [fromSym, setFromSym] = useState("usdc");
  const [toSym, setToSym] = useState("sol");
  const [amount, setAmount] = useState("500");
  const [picking, setPicking] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState(null);

  const coinOf = (sym) => markets?.find((m) => m.symbol === sym);
  const holdingOf = (sym) => state.wallet.holdings.find((h) => h.symbol === sym);
  const fromPrice = coinOf(fromSym)?.current_price ?? 0;
  const toPrice = coinOf(toSym)?.current_price ?? 0;
  const rate = toPrice ? fromPrice / toPrice : 0;
  const amountNum = parseFloat(amount) || 0;
  const receiveAmount = rate ? amountNum * rate : 0;
  const fee = amountNum * 0.003;

  const fromHolding = holdingOf(fromSym);
  const availableUnits = fromHolding?.units ?? 0;
  const availableValue = availableUnits * fromPrice;
  const insufficient = fromPrice > 0 && amountNum * fromPrice > availableValue + 0.01;

  function submit() {
    setConfirming(false);
    setStatus("sending");
    setTimeout(() => {
      if (amount.trim() === "999") { setStatus("error"); return; }
      if (fromHolding) dispatch({ type: "wallet/adjustUnits", id: fromHolding.id, delta: -amountNum });
      const toHolding = holdingOf(toSym);
      if (toHolding) dispatch({ type: "wallet/adjustUnits", id: toHolding.id, delta: receiveAmount });
      dispatch({
        type: "wallet/addTransaction",
        tx: { id: `t${Date.now()}`, kind: "swap", title: `Swapped ${fromSym.toUpperCase()} → ${toSym.toUpperCase()}`, subtitle: `Rate 1 ${fromSym.toUpperCase()} ≈ ${rate.toFixed(4)} ${toSym.toUpperCase()}`, amount: amountNum * fromPrice, negative: true, date: "Just now", status: "complete" },
      });
      setStatus("success");
    }, 1400);
  }

  const pickerList = (markets ?? []).filter((m) => m.symbol !== (picking === "from" ? toSym : fromSym));

  if (status === "sending") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceScreen, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <ActivityIndicator color={colors.up} />
        <Text style={{ color: colors.textSecondary }}>Finding the best rate…</Text>
      </View>
    );
  }
  if (status === "success") {
    return <ResultDialog tone="success" title="Swap sent!" message={`${receiveAmount.toFixed(4)} ${toSym.toUpperCase()} is on its way to your wallet.`} primaryLabel="Done" onPrimary={() => { toast("Swap complete."); navigation.navigate("Home"); }} />;
  }
  if (status === "error") {
    return <ResultDialog tone="error" title="Swap failed" message="Slippage moved past your limit. Try again or adjust your slippage tolerance." primaryLabel="Try again" onPrimary={() => setStatus(null)} secondaryLabel="Cancel" onSecondary={() => navigation.navigate("Home")} />;
  }

  return (
    <Screen>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600", marginBottom: spacing.lg }}>Swap tokens</Text>

      {error ? (
        <Banner tone="danger">Price feed unavailable — we can't quote a swap without live prices right now.</Banner>
      ) : (
        <View>
          <View style={{ position: "relative" }}>
            <View style={[swapStyles.panel, { marginBottom: 8 }]}>
              <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFillObject} />
              <Text style={swapStyles.panelLabel}>You pay</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <TextField value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
                </View>
                <Pressable onPress={() => setPicking("from")} style={swapStyles.coinPill}>
                  <Text style={swapStyles.coinPillText}>{fromSym.toUpperCase()}</Text>
                  <Feather name="chevron-down" size={14} color={colors.textSecondary} />
                </Pressable>
              </View>
              <Text style={swapStyles.panelSub}>≈ ${(amountNum * fromPrice).toFixed(2)}</Text>
            </View>

            <View style={swapStyles.flipButton}>
              <Feather name="arrow-down" size={18} color={colors.textPrimary} />
            </View>

            <View style={[swapStyles.panel, { marginTop: 0 }]}>
              <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
              <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFillObject} />
              <Text style={swapStyles.panelLabel}>You receive</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={swapStyles.receiveAmount}>{receiveAmount ? receiveAmount.toFixed(6) : "0"}</Text>
                <Pressable onPress={() => setPicking("to")} style={swapStyles.coinPill}>
                  <Text style={swapStyles.coinPillText}>{toSym.toUpperCase()}</Text>
                  <Feather name="chevron-down" size={14} color={colors.textSecondary} />
                </Pressable>
              </View>
              <Text style={swapStyles.panelSub}>≈ ${(receiveAmount * toPrice).toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md, marginBottom: spacing.md }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Available {availableUnits.toLocaleString("en-US", { maximumFractionDigits: 6 })} {fromSym.toUpperCase()}</Text>
            {fromHolding && <Text onPress={() => setAmount(String(Math.floor(availableUnits * fromPrice * 100) / 100))} style={{ color: colors.up, fontSize: 12 }}>Max</Text>}
          </View>

          <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceCard, marginBottom: spacing.md }}>
            <KeyValue label="Rate" value={loading && !markets ? "Finding rate…" : rate ? `1 ${fromSym.toUpperCase()} ≈ ${rate.toFixed(6)} ${toSym.toUpperCase()}` : "Unavailable"} />
            <KeyValue label="Network fee" value={`$${fee.toFixed(2)}`} />
            <KeyValue label="Slippage tolerance" value="0.5%" />
          </View>

          {insufficient && <Banner tone="danger">Not enough {fromSym.toUpperCase()}. You have {availableUnits.toLocaleString("en-US", { maximumFractionDigits: 6 })}.</Banner>}

          <View style={{ height: spacing.md }} />
          <Button disabled={!amountNum || insufficient || !rate || loading} onPress={() => setConfirming(true)}>
            {loading && !markets ? "Loading prices…" : "Approve Swap"}
          </Button>
        </View>
      )}

      <Sheet open={!!picking} onClose={() => setPicking(null)} title={picking === "from" ? "Pay with" : "Receive"}>
        {pickerList.map((m) => (
          <Pressable key={m.id} onPress={() => { if (picking === "from") setFromSym(m.symbol); else setToSym(m.symbol); setPicking(null); }} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{m.name}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{m.symbol.toUpperCase()}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>${m.current_price?.toLocaleString()}</Text>
          </Pressable>
        ))}
      </Sheet>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Confirm swap">
        <KeyValue label="You pay" value={`${amount} ${fromSym.toUpperCase()}`} />
        <KeyValue label="You receive" value={`${receiveAmount.toFixed(6)} ${toSym.toUpperCase()}`} />
        <KeyValue label="Rate" value={`1 ${fromSym.toUpperCase()} ≈ ${rate.toFixed(6)} ${toSym.toUpperCase()}`} />
        <KeyValue label="Network fee" value={`$${fee.toFixed(2)}`} />
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button onPress={submit}>Confirm</Button>
          <Button variant="secondary" onPress={() => setConfirming(false)}>Cancel</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
