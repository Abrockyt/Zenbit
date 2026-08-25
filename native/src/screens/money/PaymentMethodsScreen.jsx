import { useState } from "react";
import { View, Text } from "react-native";
import { Screen, Header, Button, TextField, Row, Sheet, EmptyState, Banner, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

// Luhn check, so an obviously fake number is rejected before it can be
// "linked" — same validation as the web version.
function luhnValid(num) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0, double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d; double = !double;
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

export default function PaymentMethodsScreen({ navigation }) {
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
    return new Date(2000 + yy, mm, 0) >= new Date();
  })();
  const cvcOk = /^\d{3,4}$/.test(cvc);
  const formOk = numberOk && expiryOk && cvcOk;

  const add = () => {
    setTouched(true);
    if (!formOk) return;
    dispatch({ type: "payment/add", method: { id: `pm${Date.now()}`, label: `${brandOf(number)} •• ${digits.slice(-4)}`, brand: brandOf(number), last4: digits.slice(-4), expiry } });
    setOpen(false); setNumber(""); setExpiry(""); setCvc(""); setTouched(false);
    toast("Payment method added.");
  };

  return (
    <Screen>
      <Header title="Payment methods" onBack={() => navigation.goBack()} right={<Text onPress={() => setOpen(true)} style={{ color: colors.up, fontWeight: "600" }}>Add</Text>} />

      {state.paymentMethods.length === 0 ? (
        <EmptyState icon="credit-card" title="No payment method linked" body="Add a card to buy crypto. Zenbit never stores the full number on your device." />
      ) : (
        state.paymentMethods.map((m, i) => (
          <Row
            key={m.id}
            icon="credit-card"
            title={m.label}
            subtitle={`Expires ${m.expiry}${i === 0 ? " · default" : ""}`}
            right={<Text onPress={() => { dispatch({ type: "payment/remove", id: m.id }); toast("Payment method removed."); }} style={{ color: colors.down, fontSize: 13 }}>Remove</Text>}
          />
        ))
      )}

      <View style={{ marginTop: spacing.md }}>
        <Banner>This is a demo build — card details are validated locally and never sent anywhere. Don't enter a real card.</Banner>
      </View>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add a card">
        <TextField value={number} onChangeText={(v) => setNumber(v.replace(/[^\d ]/g, "").slice(0, 19))} placeholder="4242 4242 4242 4242" keyboardType="number-pad" />
        {touched && !numberOk && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>That card number doesn't check out. Re-read it off the card.</Text>}

        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField value={expiry} onChangeText={(v) => { let x = v.replace(/\D/g, "").slice(0, 4); if (x.length > 2) x = `${x.slice(0, 2)}/${x.slice(2)}`; setExpiry(x); }} placeholder="MM/YY" keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField value={cvc} onChangeText={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))} placeholder="CVC" keyboardType="number-pad" />
          </View>
        </View>
        {touched && !expiryOk && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>Expiry must be MM/YY and in the future.</Text>}
        {touched && expiryOk && !cvcOk && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>The security code is three digits, or four on Amex.</Text>}

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button onPress={add}>Link card</Button>
          <Button variant="secondary" onPress={() => setOpen(false)}>Cancel</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
