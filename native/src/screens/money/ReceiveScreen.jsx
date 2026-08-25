import { useState } from "react";
import { View, Text } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";
import { Screen, Header, Button, SegmentedControl, Banner, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

const NETWORKS = [
  { value: "ethereum", label: "Ethereum", symbol: "ETH" },
  { value: "solana", label: "Solana", symbol: "SOL" },
  { value: "bitcoin", label: "Bitcoin", symbol: "BTC" },
];

// Deterministic block pattern from the address, so the code is stable per
// address and looks like a real QR without pretending to be scannable data.
function pattern(seed) {
  const cells = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 21 * 21; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h >>> 16) % 100 < 46);
  }
  return cells;
}

export default function ReceiveScreen({ navigation }) {
  const { state } = useApp();
  const toast = useToast();
  const [network, setNetwork] = useState("ethereum");
  const address = state.wallet.address;
  const net = NETWORKS.find((n) => n.value === network);
  const cells = pattern(address + network);

  const copy = async () => { await Clipboard.setStringAsync(address); toast("Address copied."); };
  const share = async () => { try { await Share.share({ message: address }); } catch {} };

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
          <Button onPress={copy}>Copy address</Button>
          <Button variant="secondary" onPress={share}>Share</Button>
        </View>
      }
    >
      <Header title="Receive" onBack={() => navigation.goBack()} />
      <SegmentedControl options={NETWORKS.map((n) => ({ value: n.value, label: n.label }))} value={network} onChange={setNetwork} />

      <View style={{ alignItems: "center", gap: 16, padding: 24, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, marginTop: spacing.lg, marginBottom: spacing.lg }}>
        <View style={{ width: 188, height: 188, padding: 12, borderRadius: radius.sm, backgroundColor: "#fff", flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((on, i) => (
            <View key={i} style={{ width: `${100 / 21}%`, height: `${100 / 21}%`, backgroundColor: on ? "#050807" : "transparent" }} />
          ))}
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 12, textAlign: "center", maxWidth: 240 }}>{address}</Text>
      </View>

      <Banner tone="warn">Only send {net.symbol} and {net.label} tokens to this address. Anything on another network will be lost.</Banner>

    </Screen>
  );
}
