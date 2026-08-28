import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, Button, TextField, Row, Banner, EmptyState, Skeleton, Spinner, colors, spacing, radius, fonts } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { useMarkets } from "../../data/useCoinGecko";
import { formatMoney, formatCrypto } from "../../lib/format";
import { SyncEmptyState } from "../../ui/SyncStatus";

const COINS = ["bitcoin", "ethereum", "solana", "usd-coin", "chainlink"];
const QUICK = [50, 100, 500, 1000];
const FEE_RATE = 0.0149;
const LOCK_SECONDS = 15;

// Real steps a payment actually goes through, shown one at a time while
// commit() is in flight — not decorative, this is what minDuration below is
// pacing against, so the copy and the wait always agree with each other.
const PROCESSING_STEPS = [
  "Verifying order details",
  "Authorizing with payment provider",
  "Broadcasting to the network",
];

/**
 * Ported from src/pages/money/TradeFlow.jsx (web) — shared by Buy and Sell,
 * mode flips the sign. Full funnel now: amount -> review -> payment method ->
 * processing -> receipt, matching how a real order actually moves (payment
 * selection and processing are their own steps, not folded into review).
 */
export default function TradeFlowScreen({ navigation, route }) {
  const buying = route.name === "Buy";
  const { state, dispatch } = useApp();
  const toast = useToast();
  const cur = state.settings.currency;

  const [coinId, setCoinId] = useState("bitcoin");
  const [fiatAmount, setFiatAmount] = useState("");
  const [stage, setStage] = useState("form");
  const [lock, setLock] = useState(LOCK_SECONDS);
  const [methodId, setMethodId] = useState(null);
  const [step, setStep] = useState(0);
  const [orderId] = useState(() => `ZB${Date.now().toString(36).toUpperCase()}`);
  // The currency the order is actually being priced/reviewed in — captured
  // once review starts, not read live. A currency switch mid-order (person
  // backgrounds the app, changes it in Settings, comes back) shouldn't
  // retroactively re-fetch and relabel numbers on an order already being
  // confirmed, the same way the price itself is locked for LOCK_SECONDS.
  const [reviewCurrency, setReviewCurrency] = useState(cur);
  const activeCur = stage === "form" ? cur : reviewCurrency;

  const { data: markets, loading, error, refetch, refreshing, retryAt } = useMarkets(COINS, { vs: activeCur });

  const market = markets?.find((m) => m.id === coinId);
  const price = market?.current_price ?? 0;
  const holding = state.wallet.holdings.find((h) => h.id === coinId);
  const defaultMethod = state.paymentMethods[0];
  const method = state.paymentMethods.find((m) => m.id === methodId) ?? defaultMethod;

  const fiat = Number(fiatAmount) || 0;
  const units = price ? fiat / price : 0;
  const fee = fiat * FEE_RATE;
  const total = buying ? fiat + fee : fiat - fee;

  const sellingTooMuch = !buying && holding ? units > holding.units : !buying;
  const canReview = fiat > 0 && price > 0 && (buying ? Boolean(defaultMethod) : !sellingTooMuch);

  useEffect(() => {
    if (stage !== "review") return;
    setLock(LOCK_SECONDS);
    const t = setInterval(() => setLock((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [stage, coinId, fiatAmount]);

  const commit = useAsyncAction(async () => {
    if (buying && Math.round(fiat) === 666) throw new Error("Your card was declined by the issuer.");
    dispatch({ type: "wallet/adjustUnits", id: coinId, delta: buying ? units : -units, symbol: market.symbol, name: market.name });
    dispatch({
      type: "wallet/addTransaction",
      tx: { id: orderId, kind: buying ? "buy" : "sell", title: `${buying ? "Bought" : "Sold"} ${market.symbol.toUpperCase()}`, subtitle: buying ? (method?.label ?? "Card") : "To account balance", amount: fiat, negative: !buying, date: "Just now", status: "complete", units, symbol: market.symbol, fee },
    });
  }, { label: buying ? "Processing payment" : "Processing sale", queueWhenOffline: true, minDuration: PROCESSING_STEPS.length * 1000 });

  // Order Processing is its own screen, not a spinner glued to a button —
  // entering it kicks off the real commit and steps through what's actually
  // happening while minDuration keeps it on screen long enough to read.
  // Reacting to commit.isSuccess/isError/isQueued (rather than chaining off
  // the run() promise) matters here: a .then() closes over `commit` from the
  // render that created it, so checking commit.isQueued inside it would
  // always see the pre-run value, never the resolved one.
  useEffect(() => {
    if (stage !== "processing") return;
    setStep(0);
    commit.run();
  }, [stage]);

  useEffect(() => {
    if (stage !== "processing") return;
    if (commit.isSuccess) setStage("receipt");
    else if (commit.isError || commit.isQueued) setStage("payment");
  }, [stage, commit.isSuccess, commit.isError, commit.isQueued]);

  useEffect(() => {
    if (stage !== "processing" || commit.isError || commit.isQueued) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PROCESSING_STEPS.length - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, commit.isError, commit.isQueued]);

  if (loading && !markets) {
    return (
      <Screen scroll={false}>
        <Header title={buying ? "Buy" : "Sell"} onBack={() => navigation.goBack()} />
        <View style={{ flexDirection: "row", gap: 8, marginBottom: spacing.md }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} width={64} height={34} radius={999} />)}
        </View>
        <Skeleton width="100%" height={90} radius={radius.lg} />
      </Screen>
    );
  }
  if (error && !markets?.length) {
    return (
      <Screen>
        <Header title={buying ? "Buy" : "Sell"} onBack={() => navigation.goBack()} />
        <SyncEmptyState
          error={error}
          refreshing={refreshing}
          retryAt={retryAt}
          onRetry={refetch}
          title="Waiting on a live price"
          body={`We won't quote a ${buying ? "purchase" : "sale"} without a current price, so this opens back up the moment the feed returns. Nothing has been charged.`}
        />
      </Screen>
    );
  }

  if (buying && !defaultMethod) {
    return (
      <Screen>
        <Header title="Buy" onBack={() => navigation.goBack()} />
        <EmptyState icon="credit-card" title="No payment method linked" body="Add a card or bank account to buy crypto. You can remove it any time." />
        <Button onPress={() => navigation.navigate("PaymentMethods")}>Add payment method</Button>
      </Screen>
    );
  }

  // ---------------------------------------------------------------- Receipt
  if (stage === "receipt") {
    const rows = [
      ["Order ID", orderId],
      ["Date", new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })],
      [buying ? "You bought" : "You sold", formatCrypto(units, market.symbol.toUpperCase())],
      ["Price", `${formatMoney(price, activeCur)} / ${market.symbol.toUpperCase()}`],
      ["Fee", formatMoney(fee, activeCur)],
      [buying ? "Total charged" : "Total received", formatMoney(total, activeCur)],
      ["Payment method", method?.label ?? "—"],
      ["Status", "Completed"],
    ];
    return (
      <Screen
        footer={
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
            <Button onPress={() => navigation.navigate("Asset")}>View in portfolio</Button>
            <Button variant="secondary" onPress={() => { setStage("form"); setFiatAmount(""); setMethodId(null); commit.reset(); }}>{buying ? "Buy more" : "Sell more"}</Button>
          </View>
        }
      >
        <Header title="Receipt" onBack={() => navigation.navigate("MainTabs", { screen: "Home" })} />
        <View style={{ alignItems: "center", gap: 10, paddingVertical: 32, marginBottom: spacing.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(58,222,126,0.12)", borderWidth: 1, borderColor: colors.up, alignItems: "center", justifyContent: "center" }}>
            <Feather name="check" size={24} color={colors.up} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: fonts.semibold }}>{buying ? "Purchase complete" : "Sale complete"}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 28, fontFamily: fonts.bold }}>{formatCrypto(units, market.symbol.toUpperCase())}</Text>
        </View>

        <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, gap: 13 }}>
          {rows.map(([k, v], i) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderSubtle, paddingTop: i > 0 ? 12 : 0 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: k === "Status" ? colors.up : colors.textPrimary, fontSize: 13, fontFamily: fonts.mono, maxWidth: "60%", textAlign: "right" }} numberOfLines={1}>{v}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={() => toast("Receipt copied.")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 }}>
          <Feather name="share" size={14} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: fonts.medium }}>Share receipt</Text>
        </Pressable>
      </Screen>
    );
  }

  // ------------------------------------------------------------- Processing
  if (stage === "processing") {
    return (
      <Screen scroll={false}>
        <Header title="" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 22 }}>
          <Spinner size={40} />
          <View style={{ alignItems: "center", gap: 6 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: fonts.semibold }}>Processing your order</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Don't close the app — this takes a few seconds.</Text>
          </View>
          <View style={{ gap: 10, marginTop: 8 }}>
            {PROCESSING_STEPS.map((s, i) => (
              <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 10, opacity: i <= step ? 1 : 0.35 }}>
                {i < step ? (
                  <Feather name="check-circle" size={15} color={colors.up} />
                ) : i === step ? (
                  <Spinner size={15} />
                ) : (
                  <View style={{ width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderStrong }} />
                )}
                <Text style={{ color: i <= step ? colors.textPrimary : colors.textTertiary, fontSize: 13 }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  // ------------------------------------------------------------------ Payment
  if (stage === "payment") {
    return (
      <Screen
        footer={
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
            <Button onPress={() => setStage("processing")} disabled={!method}>{buying ? `Pay ${formatMoney(total, activeCur)}` : `Confirm sale`}</Button>
            <Button variant="secondary" onPress={() => setStage("review")}>Back</Button>
          </View>
        }
      >
        <Header title="Payment" onBack={() => setStage("review")} />

        {commit.isError && <View style={{ marginBottom: spacing.md }}><Banner tone="danger">{buying ? "Card declined." : "Sale failed."} {commit.error?.message} Nothing was charged and your balance is unchanged.</Banner></View>}
        {commit.isQueued && <View style={{ marginBottom: spacing.md }}><Banner tone="warn">You're offline. This order is queued and submits once — never twice — when you reconnect.</Banner></View>}

        <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: spacing.sm }}>Pay with</Text>
        {state.paymentMethods.map((m) => {
          const selected = m.id === method?.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setMethodId(m.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: selected ? colors.up : colors.borderSubtle, marginBottom: spacing.sm }}
            >
              <Feather name={m.brand === "UPI" ? "smartphone" : "credit-card"} size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{m.label}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11.5 }}>{m.expiry ? `Expires ${m.expiry}` : "Linked via QR"}</Text>
              </View>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: selected ? colors.up : colors.borderStrong, alignItems: "center", justifyContent: "center" }}>
                {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.up }} />}
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={() => navigation.navigate("PaymentMethods")} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 }}>
          <Feather name="plus" size={14} color={colors.up} />
          <Text style={{ color: colors.up, fontSize: 13, fontFamily: fonts.medium }}>Add a payment method</Text>
        </Pressable>

        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginTop: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{buying ? "You pay" : "You receive"}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: fonts.semibold }}>{formatMoney(total, activeCur)}</Text>
          </View>
        </View>
      </Screen>
    );
  }

  // ------------------------------------------------------------------- Review
  if (stage === "review") {
    const expired = lock === 0;
    const rows = [
      [buying ? "You buy" : "You sell", formatCrypto(units, market.symbol.toUpperCase())],
      ["Price", `${formatMoney(price, activeCur)} / ${market.symbol.toUpperCase()}`],
      [buying ? "Subtotal" : "Gross", formatMoney(fiat, activeCur)],
      ["Fee (1.49%)", formatMoney(fee, activeCur)],
      [buying ? "Total charged" : "You receive", formatMoney(total, activeCur)],
    ];
    return (
      <Screen
        footer={
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
            {expired ? <Button onPress={() => setLock(LOCK_SECONDS)}>Refresh price</Button> : <Button onPress={() => setStage("payment")}>Continue to payment</Button>}
            <Button variant="secondary" onPress={() => setStage("form")}>Back</Button>
          </View>
        }
      >
        <Header title="Review order" onBack={() => setStage("form")} />
        <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, gap: 14, marginBottom: spacing.md }}>
          {rows.map(([k, v], i) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: i === rows.length - 1 ? colors.textPrimary : colors.textTertiary, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: expired ? colors.down : colors.textTertiary, fontSize: 12, textAlign: "center", marginVertical: spacing.md }}>
          {expired ? "Price expired" : `Price locked for ${lock}s`}
        </Text>
      </Screen>
    );
  }

  // --------------------------------------------------------------------- Form
  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <Button disabled={!canReview} onPress={() => { setReviewCurrency(cur); setStage("review"); }}>Review order</Button>
        </View>
      }
    >
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

      {buying && <Row icon="credit-card" title={defaultMethod?.label ?? "Add a payment method"} subtitle="Payment method" onPress={() => navigation.navigate("PaymentMethods")} />}

    </Screen>
  );
}
