import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, Row, SectionLabel, StateBlock, Cta } from "../../components/screen/Screen";
import Icon from "../../components/core/Icon";
import { useApp, useToast } from "../../state/store";
import { dur, ease, scrimTransition } from "../../lib/motion";

// Luhn, so an obviously fake number is rejected before it can be "linked".
function luhnValid(num) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function brandOf(num) {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "Card";
}

export default function PaymentMethods() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [touched, setTouched] = useState(false);

  const digits = number.replace(/\D/g, "");
  const numberOk = luhnValid(number);
  const expiryOk = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry) && (() => {
    const [mm, yy] = expiry.split("/").map(Number);
    const end = new Date(2000 + yy, mm, 0);
    return end >= new Date();
  })();
  const cvcOk = /^\d{3,4}$/.test(cvc);
  const formOk = numberOk && expiryOk && cvcOk;

  const add = () => {
    setTouched(true);
    if (!formOk) return;
    dispatch({
      type: "payment/add",
      method: { id: `pm${Date.now()}`, label: `${brandOf(number)} •• ${digits.slice(-4)}`, brand: brandOf(number), last4: digits.slice(-4), expiry },
    });
    setOpen(false);
    setNumber("");
    setExpiry("");
    setCvc("");
    setTouched(false);
    toast("Payment method added.");
  };

  const fieldStyle = (ok) => ({
    width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: "var(--radius-sm)",
    background: "var(--surface-card)",
    border: `1px solid ${touched && !ok ? "var(--down-500)" : "var(--border-default)"}`,
    color: "#fff", font: "400 15px/1 var(--font-mono)",
  });

  return (
    <Screen
      title="Payment methods"
      trailing={
        <button onClick={() => setOpen(true)} aria-label="Add payment method" style={{ padding: "9px 14px", borderRadius: 999, background: "#fff", border: "none", color: "var(--ink-1)", font: "500 13px/1 var(--font-core)" }}>
          Add
        </button>
      }
    >
      {state.paymentMethods.length === 0 ? (
        <StateBlock kind="empty" title="No payment method linked" body="Add a card to buy crypto. Zenbit never stores the full number on your device." actionLabel="Add a card" onAction={() => setOpen(true)} />
      ) : (
        <>
          <SectionLabel>Linked</SectionLabel>
          {state.paymentMethods.map((m, i) => (
            <Row
              key={m.id}
              icon="card"
              label={m.label}
              hint={`Expires ${m.expiry}${i === 0 ? " · default" : ""}`}
              trailing={
                <button
                  onClick={() => {
                    dispatch({ type: "payment/remove", id: m.id });
                    toast("Payment method removed.");
                  }}
                  style={{ padding: "8px 14px", borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-default)", color: "var(--down-500)", font: "500 13px/1 var(--font-core)" }}
                >
                  Remove
                </button>
              }
            />
          ))}
        </>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: "var(--radius-md)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
        <Icon name="lock" size={16} color="var(--text-tertiary)" />
        <p className="zb-caption" style={{ margin: 0, color: "var(--text-tertiary)" }}>
          This is a demo build — card details are validated locally and never sent anywhere. Don't enter a real card.
        </p>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button {...scrimTransition} onClick={() => setOpen(false)} aria-label="Dismiss" style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(6px)", border: "none", zIndex: 40 }} />
            <motion.div
              initial={{ y: 460 }}
              animate={{ y: 0 }}
              exit={{ y: 460 }}
              transition={{ duration: dur.slow, ease: ease.emphasis }}
              role="dialog"
              aria-label="Add a card"
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 41,
                padding: "24px 20px 34px", borderRadius: "32px 32px 0 0",
                background: "var(--surface-card-solid)", borderTop: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              <p className="zb-title-3" style={{ margin: 0, color: "#fff" }}>Add a card</p>

              <input
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                aria-label="Card number"
                style={fieldStyle(numberOk)}
              />
              {touched && !numberOk && <p className="zb-caption" role="alert" style={{ margin: "-6px 0 0", color: "var(--down-500)" }}>That card number doesn't check out. Re-read it off the card.</p>}

              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={expiry}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                    setExpiry(v);
                  }}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  aria-label="Expiry date"
                  style={fieldStyle(expiryOk)}
                />
                <input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="CVC"
                  inputMode="numeric"
                  aria-label="Security code"
                  style={fieldStyle(cvcOk)}
                />
              </div>
              {touched && !expiryOk && <p className="zb-caption" role="alert" style={{ margin: "-6px 0 0", color: "var(--down-500)" }}>Expiry must be MM/YY and in the future.</p>}
              {touched && expiryOk && !cvcOk && <p className="zb-caption" role="alert" style={{ margin: "-6px 0 0", color: "var(--down-500)" }}>The security code is three digits, or four on Amex.</p>}

              <Cta onClick={add}>Link card</Cta>
              <Cta variant="secondary" onClick={() => setOpen(false)}>Cancel</Cta>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
