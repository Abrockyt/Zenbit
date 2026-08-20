import { useState } from "react";
import { Screen, Cta, SectionLabel } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import SegmentedControl from "../../components/forms/SegmentedControl";
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

export default function Receive() {
  const { state } = useApp();
  const toast = useToast();
  const [network, setNetwork] = useState("ethereum");
  const address = state.wallet.address;
  const net = NETWORKS.find((n) => n.value === network);
  const cells = pattern(address + network);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast("Address copied.");
    } catch {
      toast("Couldn't copy — select the address and copy manually.", "down");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Zenbit address", text: address });
        return;
      } catch {
        /* user dismissed the share sheet */
      }
    }
    copy();
  };

  return (
    <Screen title="Receive">
      <SectionLabel>Network</SectionLabel>
      <SegmentedControl options={NETWORKS} value={network} onChange={setNetwork} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        <div
          aria-label="Wallet address QR code"
          role="img"
          style={{
            width: 188, height: 188, padding: 12, borderRadius: "var(--radius-sm)", background: "#fff",
            display: "grid", gridTemplateColumns: "repeat(21, 1fr)", gridTemplateRows: "repeat(21, 1fr)", gap: 1,
          }}
        >
          {cells.map((on, i) => (
            <span key={i} style={{ background: on ? "#050807" : "transparent", borderRadius: 0.5 }} />
          ))}
        </div>

        <p className="zb-mono" style={{ margin: 0, color: "#fff", fontSize: 12, textAlign: "center", wordBreak: "break-all", maxWidth: 240 }}>
          {address}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "rgba(245,181,68,.08)", border: "1px solid rgba(245,181,68,.22)" }}>
        <Icon name="alert" size={16} color="var(--warn-500)" />
        <p className="zb-caption" style={{ margin: 0, color: "var(--text-secondary)" }}>
          Only send {net.symbol} and {net.label} tokens to this address. Anything on another network will be lost.
        </p>
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <Cta onClick={copy}>Copy address</Cta>
        <Cta variant="secondary" onClick={share}>Share</Cta>
      </div>
    </Screen>
  );
}
