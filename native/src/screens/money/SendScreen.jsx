import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, TextField, Banner, Row, EmptyState, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { useMarkets } from "../../data/useCoinGecko";
import { formatMoney, formatCrypto } from "../../lib/format";

/**
 * Ported from src/pages/money/Send.jsx — the screen the case study centers
 * on. classifyAddress and the review step are unchanged: three-way address
 * validation (invalid / first-time-warn / known), a mandatory review screen
 * before the send button exists, and a deterministic failure path.
 */
function classifyAddress(value, known) {
  const v = value.trim();
  if (!v) return { state: "empty" };
  if (v.startsWith("@")) return v.length > 2 ? { state: "username" } : { state: "invalid", why: "Usernames need at least two characters." };
  if (!/^0x[a-fA-F0-9]{40}$/.test(v)) return { state: "invalid", why: "That isn't a valid wallet address. Ethereum addresses start 0x and have 40 hex characters." };
  if (v.toLowerCase().endsWith("dead")) return { state: "invalid", why: "This address is on a known burn list. Funds sent here cannot be recovered." };
  if (known.includes(v)) return { state: "known" };
  return { state: "firstTime" };
}

export default function SendScreen({ navigation, route }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const cur = state.settings.currency;
  const holdings = state.wallet.holdings;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets } = useMarkets(ids);

  const [assetId, setAssetId] = useState(holdings[0]?.id ?? "ethereum");
  const [address, setAddress] = useState(route.params?.address ?? "");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("form");

  const asset = holdings.find((h) => h.id === assetId);
  const market = markets?.find((m) => m.id === assetId);
  const price = market?.current_price ?? 0;
  const units = Number(amount) || 0;
  const fiat = units * price;
  const available = asset?.units ?? 0;
  const networkFee = 0.0004;

  const known = state.wallet.recentRecipients.map((r) => r.address);
  const addr = classifyAddress(address, known);
  const overBalance = units + networkFee > available;
  const canReview = units > 0 && !overBalance && (addr.state === "known" || addr.state === "firstTime" || addr.state === "username");

  const send = useAsyncAction(async () => {
    dispatch({ type: "wallet/adjustUnits", id: assetId, delta: -(units + networkFee) });
    dispatch({
      type: "wallet/addTransaction",
      tx: {
        id: `t${Date.now()}`, kind: "send", title: `Sent ${asset.symbol.toUpperCase()}`,
        subtitle: `To ${address.slice(0, 6)}…${address.slice(-4)}`, amount: fiat, negative: true, date: "Just now", status: "pending",
        hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0").slice(0, 40)}`, units, symbol: asset.symbol, fee: networkFee, address,
      },
    });
    dispatch({ type: "wallet/addRecipient", recipient: { address, label: addr.state === "username" ? address : null } });
  }, { label: "Broadcasting transaction", queueWhenOffline: true });

  const confirm = async () => {
    await send.run();
    if (!send.isError && !send.isQueued) setStage("done");
  };

  if (!holdings.length) {
    return (
      <Screen>
        <Header title="Send" onBack={() => navigation.goBack()} />
        <EmptyState icon="send" title="Nothing to send yet" body="Fund your wallet, then you can send to any address or Zenbit username." />
        <Button onPress={() => navigation.navigate("Buy")}>Buy crypto</Button>
      </Screen>
    );
  }

  if (stage === "done") {
    return (
      <Screen>
        <Header title="Send" onBack={() => navigation.navigate("Home")} />
        <View style={{ alignItems: "center", gap: 14, paddingVertical: 40, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(58,222,126,0.12)", borderWidth: 1, borderColor: colors.up, alignItems: "center", justifyContent: "center" }}>
            <Feather name="check" size={24} color={colors.up} />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "600" }}>Sent</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "700" }}>{formatCrypto(units, asset.symbol.toUpperCase())}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>To {address.slice(0, 10)}…{address.slice(-6)} · confirming on-chain now.</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ gap: spacing.md }}>
          <Button onPress={() => navigation.navigate("RecentActivity")}>View activity</Button>
          <Button variant="secondary" onPress={() => navigation.navigate("Home")}>Back to home</Button>
        </View>
      </Screen>
    );
  }

  if (stage === "review") {
    const rows = [
      ["Sending", formatCrypto(units, asset.symbol.toUpperCase())],
      ["Value", formatMoney(fiat, cur)],
      ["To", `${address.slice(0, 12)}…${address.slice(-8)}`],
      ["Network fee", formatCrypto(networkFee, asset.symbol.toUpperCase())],
      ["Total debited", formatCrypto(units + networkFee, asset.symbol.toUpperCase())],
    ];
    return (
      <Screen>
        <Header title="Review" onBack={() => setStage("form")} />
        <View style={{ padding: 20, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, gap: 14, marginBottom: spacing.md }}>
          {rows.map(([k, v]) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, textAlign: "right" }}>{v}</Text>
            </View>
          ))}
        </View>

        <Banner tone="danger">Crypto transfers cannot be reversed. If the address is wrong, the funds are gone.</Banner>

        {send.isError && <View style={{ marginTop: spacing.md }}><Banner tone="danger">Transaction failed. {send.error?.message} Your balance is unchanged.</Banner></View>}
        {send.isQueued && <View style={{ marginTop: spacing.md }}><Banner tone="warn">You're offline. This send is queued and goes out once you reconnect — it won't be sent twice.</Banner></View>}

        <View style={{ flex: 1 }} />
        {!send.isError && !send.isQueued && (
          <View style={{ gap: spacing.md }}>
            <Button loading={send.isLoading} onPress={confirm}>Confirm and send</Button>
            <Button variant="secondary" onPress={() => setStage("form")}>Back</Button>
          </View>
        )}
        {send.isError && (
          <View style={{ gap: spacing.md }}>
            <Button onPress={() => send.reset()}>Try again</Button>
            <Button variant="secondary" onPress={() => { send.reset(); setStage("form"); }}>Edit details</Button>
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Send" onBack={() => navigation.goBack()} />

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Asset</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md }}>
        {holdings.map((h) => (
          <Pressable key={h.id} onPress={() => setAssetId(h.id)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: assetId === h.id ? colors.surfaceRaised : colors.surfaceCard, borderWidth: 1, borderColor: assetId === h.id ? colors.borderStrong : colors.borderSubtle }}>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "500" }}>{h.symbol.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>To</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <TextField value={address} onChangeText={setAddress} placeholder="Address or @username" />
        </View>
        <Pressable onPress={() => navigation.navigate("ScanQr")} style={{ width: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center" }}>
          <Feather name="camera" size={19} color={colors.textPrimary} />
        </Pressable>
      </View>

      {addr.state === "invalid" && <Text style={{ color: colors.down, fontSize: 12, marginBottom: spacing.sm }}>{addr.why}</Text>}
      {addr.state === "firstTime" && <Text style={{ color: colors.warn, fontSize: 12, marginBottom: spacing.sm }}>First time sending here. Double-check the last six characters: {address.slice(-6)}</Text>}
      {addr.state === "known" && <Text style={{ color: colors.up, fontSize: 12, marginBottom: spacing.sm }}>You've sent to this address before.</Text>}
      {addr.state === "username" && <Text style={{ color: colors.up, fontSize: 12, marginBottom: spacing.sm }}>Zenbit username — resolves to their deposit address.</Text>}

      {addr.state === "empty" && state.wallet.recentRecipients.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Recent</Text>
          {state.wallet.recentRecipients.map((r) => (
            <Row key={r.address} icon="user" title={r.label ?? `${r.address.slice(0, 10)}…${r.address.slice(-6)}`} onPress={() => setAddress(r.address)} />
          ))}
        </View>
      )}

      <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 6 }}>Amount</Text>
      <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: overBalance ? colors.down : colors.borderSubtle, marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextField value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ""))} placeholder="0.00" keyboardType="decimal-pad" />
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 17 }}>{asset?.symbol?.toUpperCase()}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <Text style={{ color: colors.textTertiary, fontSize: 13 }}>≈ {formatMoney(fiat, cur)}</Text>
          <Text onPress={() => setAmount(String(Math.max(0, available - networkFee)))} style={{ color: colors.up, fontSize: 13, fontWeight: "500" }}>Max</Text>
        </View>
      </View>
      <Text style={{ color: overBalance ? colors.down : colors.textTertiary, fontSize: 12, marginBottom: spacing.md }}>
        {overBalance ? `Insufficient funds. You have ${formatCrypto(available, asset.symbol.toUpperCase())}, and the network fee is ${networkFee} ${asset.symbol.toUpperCase()}.` : `Available ${formatCrypto(available, asset.symbol.toUpperCase())}`}
      </Text>

      <View style={{ flex: 1 }} />
      <Button disabled={!canReview} onPress={() => setStage("review")}>Review send</Button>
    </Screen>
  );
}
