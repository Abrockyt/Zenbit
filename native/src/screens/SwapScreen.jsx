import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Screen, TabBar, TextField, Button, Sheet, ResultDialog, Banner, colors, spacing, radius } from "../ui/kit";
import { useMarkets } from "../data/useCoinGecko";
import { useApp, useToast } from "../state/store";

const PAIR_IDS = ["bitcoin", "ethereum", "solana", "tether", "usd-coin", "chainlink"];

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
    <Screen footer={<TabBar navigation={navigation} active="Swap" />}>
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "600", marginBottom: spacing.lg }}>Swap tokens</Text>

      {error ? (
        <Banner tone="danger">Price feed unavailable — we can't quote a swap without live prices right now.</Banner>
      ) : (
        <View>
          <Pressable onPress={() => setPicking("from")} style={{ padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.sm }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>You pay · {fromSym.toUpperCase()}</Text>
            <TextField value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
          </Pressable>
          <Pressable onPress={() => setPicking("to")} style={{ padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: spacing.md }}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>You receive · {toSym.toUpperCase()}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 20, marginTop: 6 }}>{receiveAmount ? receiveAmount.toFixed(6) : "0"}</Text>
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md }}>
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
