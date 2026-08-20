import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, Cta, StateBlock, SectionLabel, Row } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import CoinIcon from "../../components/data/CoinIcon";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { useMarkets } from "../../data/useCoinGecko";
import { formatMoney, formatCrypto } from "../../lib/format";
import { dur, ease } from "../../lib/motion";

// Address validation is the point of this screen. The flow diagram calls for
// three outcomes: valid, valid-but-first-time (warn), invalid (block).
function classifyAddress(value, known) {
  const v = value.trim();
  if (!v) return { state: "empty" };
  if (v.startsWith("@")) {
    return v.length > 2 ? { state: "username" } : { state: "invalid", why: "Usernames need at least two characters." };
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(v)) {
    return { state: "invalid", why: "That isn't a valid wallet address. Ethereum addresses start 0x and have 40 hex characters." };
  }
  // A deliberate, discoverable failure so the error path is reachable on demand.
  if (v.toLowerCase().endsWith("dead")) {
    return { state: "invalid", why: "This address is on a known burn list. Funds sent here cannot be recovered." };
  }
  if (known.includes(v)) return { state: "known" };
  return { state: "firstTime" };
}

export default function Send() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const cur = state.settings.currency;

  const holdings = state.wallet.holdings;
  const ids = useMemo(() => holdings.map((h) => h.id), [holdings]);
  const { data: markets } = useMarkets(ids, { vs: cur });

  const [assetId, setAssetId] = useState(holdings[0]?.id ?? "ethereum");
  const [address, setAddress] = useState(location.state?.address ?? "");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("form"); // form | review | done

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

  const send = useAsyncAction(
    async () => {
      dispatch({ type: "wallet/adjustUnits", id: assetId, delta: -(units + networkFee) });
      dispatch({
        type: "wallet/addTransaction",
        tx: {
          id: `t${Date.now()}`,
          kind: "send",
          title: `Sent ${asset.symbol.toUpperCase()}`,
          subtitle: `To ${address.slice(0, 6)}…${address.slice(-4)}`,
          amount: fiat,
          negative: true,
          date: "Just now",
          status: "pending",
          hash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0").slice(0, 40)}`,
          units,
          symbol: asset.symbol,
          fee: networkFee,
          address,
        },
      });
      dispatch({ type: "wallet/addRecipient", recipient: { address, label: addr.state === "username" ? address : null } });
    },
    { label: "Broadcasting transaction", queueWhenOffline: true }
  );

  const confirm = async () => {
    await send.run();
    if (!send.isError && !send.isQueued) setStage("done");
  };

  if (!holdings.length) {
    return (
      <Screen title="Send">
        <StateBlock kind="empty" title="Nothing to send yet" body="Fund your wallet, then you can send to any address or Zenbit username." actionLabel="Buy crypto" onAction={() => navigate("/buy")} />
      </Screen>
    );
  }

  if (stage === "done") {
    return (
      <Screen title="Send" onBack={() => navigate("/home")}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "40px 20px", borderRadius: "var(--radius-xl)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <motion.span initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: dur.base, ease: ease.standard }} style={{ width: 56, height: 56, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(58,222,126,.12)", border: "1px solid var(--up-500)" }}>
            <Icon name="check" size={24} color="var(--up-500)" />
          </motion.span>
          <p className="zb-title-2" style={{ margin: 0, color: "#fff" }}>Sent</p>
          <p className="zb-balance" style={{ margin: 0, color: "#fff" }}>{formatCrypto(units, asset.symbol.toUpperCase())}</p>
          <p className="zb-body-sm" style={{ margin: 0, color: "var(--text-secondary)" }}>
            To {address.slice(0, 10)}…{address.slice(-6)} · confirming on-chain now.
          </p>
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <Cta onClick={() => navigate("/activity")}>View activity</Cta>
          <Cta variant="secondary" onClick={() => navigate("/home")}>Back to home</Cta>
        </div>
      </Screen>
    );
  }

  if (stage === "review") {
    return (
      <Screen title="Review" subtitle="Check this carefully" onBack={() => setStage("form")}>
        <div style={{ padding: 20, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["Sending", formatCrypto(units, asset.symbol.toUpperCase())],
            ["Value", formatMoney(fiat, cur)],
            ["To", `${address.slice(0, 12)}…${address.slice(-8)}`],
            ["Network fee", formatCrypto(networkFee, asset.symbol.toUpperCase())],
            ["Total debited", formatCrypto(units + networkFee, asset.symbol.toUpperCase())],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="zb-body-sm" style={{ color: "var(--text-tertiary)" }}>{k}</span>
              <span className="zb-body-sm zb-tabular" style={{ color: "#fff", textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "rgba(242,80,75,.08)", border: "1px solid rgba(242,80,75,.22)" }}>
          <Icon name="alert" size={16} color="var(--down-500)" />
          <p className="zb-caption" style={{ margin: 0, color: "var(--text-secondary)" }}>
            Crypto transfers cannot be reversed. If the address is wrong, the funds are gone.
          </p>
        </div>

        {send.isError && (
          <StateBlock kind="error" title="Transaction failed" body={`${send.error?.message} Your balance is unchanged.`} actionLabel="Try again" onAction={() => send.reset()} secondaryLabel="Edit details" onSecondary={() => { send.reset(); setStage("form"); }} />
        )}
        {send.isQueued && (
          <StateBlock kind="empty" title="Queued" body="You're offline. This send is queued and goes out once you reconnect — it won't be sent twice." actionLabel="Back to home" onAction={() => navigate("/home")} />
        )}

        {!send.isError && !send.isQueued && (
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {state.settings.appLock.requireOnSensitive && fiat > 1000 && (
              <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)", textAlign: "center" }}>
                Large send — you'll be asked to confirm your identity.
              </p>
            )}
            <Cta busy={send.isLoading} onClick={confirm}>Confirm and send</Cta>
            <Cta variant="secondary" onClick={() => setStage("form")}>Back</Cta>
          </div>
        )}
      </Screen>
    );
  }

  return (
    <Screen title="Send">
      <SectionLabel>Asset</SectionLabel>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {holdings.map((h) => (
          <button
            key={h.id}
            onClick={() => setAssetId(h.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto", padding: "9px 14px", borderRadius: 999,
              background: assetId === h.id ? "var(--surface-raised)" : "var(--surface-card)",
              border: `1px solid ${assetId === h.id ? "var(--border-strong)" : "var(--border-subtle)"}`,
              color: "#fff", font: "500 13px/1 var(--font-core)",
            }}
          >
            <CoinIcon symbol={h.symbol} size={18} />
            {h.symbol.toUpperCase()}
          </button>
        ))}
      </div>

      <SectionLabel>To</SectionLabel>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address or @username"
          aria-label="Recipient address or username"
          style={{
            flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: "var(--radius-sm)",
            background: "var(--surface-card)",
            border: `1px solid ${addr.state === "invalid" ? "var(--down-500)" : "var(--border-default)"}`,
            color: "#fff", font: "400 14px/1 var(--font-mono)",
          }}
        />
        <button onClick={() => navigate("/send/scan")} aria-label="Scan a QR code" style={{ width: 48, borderRadius: "var(--radius-sm)", background: "var(--surface-raised)", border: "1px solid var(--border-default)", display: "grid", placeItems: "center" }}>
          <Icon name="qr-code" size={19} />
        </button>
      </div>

      {addr.state === "invalid" && (
        <p className="zb-caption" role="alert" style={{ margin: 0, color: "var(--down-500)" }}>{addr.why}</p>
      )}
      {addr.state === "firstTime" && (
        <p className="zb-caption" style={{ margin: 0, color: "var(--warn-500)" }}>
          First time sending here. Double-check the last six characters: <span className="zb-mono">{address.slice(-6)}</span>
        </p>
      )}
      {addr.state === "known" && (
        <p className="zb-caption" style={{ margin: 0, color: "var(--up-500)" }}>You've sent to this address before.</p>
      )}
      {addr.state === "username" && (
        <p className="zb-caption" style={{ margin: 0, color: "var(--up-500)" }}>Zenbit username — resolves to their deposit address.</p>
      )}

      {state.wallet.recentRecipients.length > 0 && addr.state === "empty" && (
        <>
          <SectionLabel>Recent</SectionLabel>
          {state.wallet.recentRecipients.map((r) => (
            <Row key={r.address} icon="user" label={r.label ?? `${r.address.slice(0, 10)}…${r.address.slice(-6)}`} onClick={() => setAddress(r.address)} />
          ))}
        </>
      )}
      {state.wallet.recentRecipients.length === 0 && addr.state === "empty" && (
        <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>No recent recipients.</p>
      )}

      <SectionLabel>Amount</SectionLabel>
      <div style={{ padding: 18, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: `1px solid ${overBalance ? "var(--down-500)" : "var(--border-subtle)"}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            aria-label={`Amount in ${asset?.symbol?.toUpperCase() ?? ""}`}
            style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "#fff", font: "500 30px/1 var(--font-core)", fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}
          />
          <span className="zb-title-3" style={{ color: "var(--text-tertiary)" }}>{asset?.symbol?.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span className="zb-body-sm zb-tabular" style={{ color: "var(--text-tertiary)" }}>≈ {formatMoney(fiat, cur)}</span>
          <button
            onClick={() => setAmount(String(Math.max(0, available - networkFee)))}
            style={{ background: "none", border: "none", color: "var(--up-500)", font: "500 13px/1 var(--font-core)" }}
          >
            Max
          </button>
        </div>
      </div>
      <p className="zb-caption zb-tabular" style={{ margin: 0, color: overBalance ? "var(--down-500)" : "var(--text-tertiary)" }}>
        {overBalance
          ? `Insufficient funds. You have ${formatCrypto(available, asset.symbol.toUpperCase())}, and the network fee is ${networkFee} ${asset.symbol.toUpperCase()}.`
          : `Available ${formatCrypto(available, asset.symbol.toUpperCase())}`}
      </p>

      <div style={{ marginTop: "auto" }}>
        <Cta disabled={!canReview} onClick={() => setStage("review")}>Review send</Cta>
      </div>
    </Screen>
  );
}
