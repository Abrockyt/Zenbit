import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, TextField, Row, Banner, EmptyState, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { useMarkets } from "../../data/useCoinGecko";
import { formatMoney, formatCrypto } from "../../lib/format";

const COINS = ["bitcoin", "ethereum", "solana", "usd-coin", "chainlink"];
const QUICK = [50, 100, 500, 1000];
const FEE_RATE = 0.0149;
const LOCK_SECONDS = 15;

/**
 * Ported from src/pages/money/TradeFlow.jsx (web) — shared by Buy and Sell,
 * mode flips the sign. Keeps the price-lock countdown on review (expires,
 * must be refreshed rather than silently executing at a stale rate) and the
 * deterministic declined-card failure on a round $666 amount.
 */
export default function TradeFlowScreen({ navigation, route }) {
  const buying = route.name === "Buy";
  const { state, dispatch } = useApp();
  const toast = useToast();
  const cur = state.settings.currency;

  const { data: markets, loading, error } = useMarkets(COINS);

  const [coinId, setCoinId] = useState("bitcoin");
  const [fiatAmount, setFiatAmount] = useState("");
  const [stage, setStage] = useState("form");
  const [lock, setLock] = useState(LOCK_SECONDS);

  const market = markets?.find((m) => m.id === coinId);
  const price = market?.current_price ?? 0;
  const holding = state.wallet.holdings.find((h) => h.id === coinId);
  const method = state.paymentMethods[0];

  const fiat = Number(fiatAmount) || 0;
  const units = price ? fiat / price : 0;
  const fee = fiat * FEE_RATE;
  const total = buying ? fiat + fee : fiat - fee;

  const sellingTooMuch = !buying && holding ? units > holding.units : !buying;
  const canReview = fiat > 0 && price > 0 && (buying ? Boolean(method) : !sellingTooMuch);

  useEffect(() => {
    if (stage !== "review") return;
    setLock(LOCK_SECONDS);
    const t = setInterval(() => setLock((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [stage, coinId, fiatAmount]);

  const commit = useAsyncAction(async () => {
    if (buying && Math.round(fiat) === 666) throw new Error("Your card was declined by the issuer.");
    dispatch({ type: "wallet/adjustUnits", id: coinId, delta: buying ? units : -units });
    dispatch({
      type: "wallet/addTransaction",
      tx: { id: `t${Date.now()}`, kind: buying ? "buy" : "sell", title: `${buying ? "Bought" : "Sold"} ${market.symbol.toUpperCase()}`, subtitle: buying ? (method?.label ?? "Card") : "To account balance", amount: fiat, negative: !buying, date: "Just now", status: "complete", units, symbol: market.symbol, fee },
    });
  }, { label: buying ? "Processing payment" : "Processing sale", queueWhenOffline: true });

  const confirm = async () => {
    await commit.run();
    if (!commit.isError && !commit.isQueued) setStage("done");
  };

  if (loading && !markets) return <Screen><Header title={buying ? "Buy" : "Sell"} onBack={() => navigation.goBack()} /><Text style={{ color: colors.textTertiary }}>Loading…</Text></Screen>;
  if (error) return <Screen><Header title={buying ? "Buy" : "Sell"} onBack={() => navigation.goBack()} /><Banner tone="danger">We can't price this trade right now, so it would be unsafe to quote you. Try again in a moment.</Banner></Screen>;

  if (buying && !method) {
    return (
      <Screen>
        <Header title="Buy" onBack={() => navigation.goBack()} />
        <EmptyState icon="credit-card" title="No payment method linked" body="Add a card or bank account to buy crypto. You can remove it any time." />
        <Button onPress={() => navigation.navigate("PaymentMethods")}>Add payment method</Button>
      </Screen>
    );
  }

  if (stage === "done") {
    return (
      <Screen>
        <Header title={buying ? "Buy" : "Sell"} onBack={() => navigation.navigate("Home")} />
        <View style={{ alignItems: "center", gap: 14, paddingVertical: 40, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(58,222,126,0.12)", borderWidth: 1, borderColor: colors.up, alignItems: "center", justifyContent: "center" }}>
            <Feather name="check" size={24} color={colors.up} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>{buying ? "Purchase complete" : "Sale complete"}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700" }}>{formatCrypto(units, market.symbol.toUpperCase())}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{buying ? `Charged ${formatMoney(total, cur)} to ${method?.label ?? "your card"}.` : `${formatMoney(total, cur)} added to your account balance.`}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ gap: spacing.md }}>
          <Button onPress={() => navigation.navigate("Home")}>Done</Button>
          <Button variant="secondary" onPress={() => { setStage("form"); setFiatAmount(""); commit.reset(); }}>{buying ? "Buy more" : "Sell more"}</Button>
        </View>
      </Screen>
    );
  }

  if (stage === "review") {
    const expired = lock === 0;
    const rows = [
      [buying ? "You buy" : "You sell", formatCrypto(units, market.symbol.toUpperCase())],
      ["Price", `${formatMoney(price, cur)} / ${market.symbol.toUpperCase()}`],
      [buying ? "Subtotal" : "Gross", formatMoney(fiat, cur)],
      ["Fee (1.49%)", formatMoney(fee, cur)],
      [buying ? "Total charged" : "You receive", formatMoney(total, cur)],
    ];
    return (
      <Screen>
        <Header title="Review order" onBack={() => setStage("form")} />
        <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, gap: 14, marginBottom: spacing.md }}>
          {rows.map(([k, v], i) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: i === rows.length - 1 ? colors.textPrimary : colors.textTertiary, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{v}</Text>
            </View>
          ))}
        </View>

        {buying && <Row icon="credit-card" title={method?.label ?? "Card"} subtitle="Payment method" onPress={() => navigation.navigate("PaymentMethods")} />}

        <Text style={{ color: expired ? colors.down : colors.textTertiary, fontSize: 12, textAlign: "center", marginVertical: spacing.md }}>
          {expired ? "Price expired" : `Price locked for ${lock}s`}
        </Text>

        {commit.isError && <Banner tone="danger">{buying ? "Card declined." : "Sale failed."} {commit.error?.message} Nothing was charged and your balance is unchanged.</Banner>}
        {commit.isQueued && <Banner tone="warn">You're offline. This order is queued and submits once — never twice — when you reconnect.</Banner>}

        <View style={{ flex: 1 }} />
        {!commit.isError && !commit.isQueued && (
          <View style={{ gap: spacing.md }}>
            {expired ? <Button onPress={() => setLock(LOCK_SECONDS)}>Refresh price</Button> : <Button loading={commit.isLoading} onPress={confirm}>{buying ? "Confirm buy" : "Confirm sell"}</Button>}
            <Button variant="secondary" onPress={() => setStage("form")}>Back</Button>
          </View>
        )}
        {commit.isError && (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <Button onPress={() => commit.reset()}>Try again</Button>
            <Button variant="secondary" onPress={() => { commit.reset(); setStage("form"); }}>{buying ? "Use another card" : "Edit amount"}</Button>
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={buying ? "Buy" : "Sell"} onBack={() => navigation.goBack()} />

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Coin</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md }}>
        {(markets ?? []).map((m) => (
          <Pressable key={m.id} onPress={() => setCoinId(m.id)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: coinId === m.id ? colors.surfaceRaised : colors.surfaceCard, borderWidth: 1, borderColor: coinId === m.id ? colors.borderStrong : colors.borderSubtle }}>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "500" }}>{m.symbol.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: sellingTooMuch ? colors.down : colors.borderSubtle, marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 17 }}>{cur.toUpperCase()}</Text>
          <View style={{ flex: 1 }}>
            <TextField value={fiatAmount} onChangeText={(v) => setFiatAmount(v.replace(/[^\d.]/g, ""))} placeholder="0" keyboardType="decimal-pad" />
          </View>
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 10 }}>≈ {formatCrypto(units, market?.symbol?.toUpperCase() ?? "")}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
        {QUICK.map((q) => (
          <Pressable key={q} onPress={() => setFiatAmount(String(q))} style={{ flex: 1, paddingVertical: 11, borderRadius: 999, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: "center" }}>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "500" }}>{formatMoney(q, cur, { digits: 0 })}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: sellingTooMuch ? colors.down : colors.textTertiary, fontSize: 12, marginBottom: spacing.md }}>
        {buying ? `${market?.symbol?.toUpperCase()} is ${formatMoney(price, cur)} right now.` : sellingTooMuch ? `You only hold ${formatCrypto(holding?.units ?? 0, market?.symbol?.toUpperCase() ?? "")}.` : `Available ${formatCrypto(holding?.units ?? 0, market?.symbol?.toUpperCase() ?? "")}`}
      </Text>

      {buying && <Row icon="credit-card" title={method?.label ?? "Add a payment method"} subtitle="Payment method" onPress={() => navigation.navigate("PaymentMethods")} />}

      <View style={{ flex: 1 }} />
      <Button disabled={!canReview} onPress={() => setStage("review")}>Review order</Button>
    </Screen>
  );
}
