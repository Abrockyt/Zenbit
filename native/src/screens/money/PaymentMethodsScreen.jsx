import { useState } from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, TextField, Row, Sheet, EmptyState, Banner, colors, spacing, fonts } from "../../ui/kit";
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
  if (/^6(?:011|5)/.test(d)) return "Discover";
  return "Card";
}

// Amex is 4-6-5 and takes a 4-digit CVC; everyone else is 4-4-4-4 with 3.
function brandRules(brand) {
  return brand === "Amex"
    ? { groups: [4, 6, 5], maxDigits: 15, cvcLen: 4, tint: "#2E77BC" }
    : { groups: [4, 4, 4, 4], maxDigits: 16, cvcLen: 3, tint: brand === "Visa" ? "#1A1F71" : brand === "Mastercard" ? "#EB001B" : brand === "Discover" ? "#FF6000" : colors.textTertiary };
}

function formatCard(raw, groups, maxDigits) {
  const d = raw.replace(/\D/g, "").slice(0, maxDigits);
  const out = [];
  let i = 0;
  for (const g of groups) {
    if (i >= d.length) break;
    out.push(d.slice(i, i + g));
    i += g;
  }
  return out.join(" ");
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
  const brand = brandOf(number);
  const rules = brandRules(brand);
  const numberOk = luhnValid(number) && digits.length === rules.maxDigits;
  const expiryOk = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry) && (() => {
    const [mm, yy] = expiry.split("/").map(Number);
    return new Date(2000 + yy, mm, 0) >= new Date();
  })();
  const cvcOk = cvc.length === rules.cvcLen;
  const formOk = numberOk && expiryOk && cvcOk;
  // Only complain about a field once it's been filled to its full length or
  // the form has been submitted — nagging mid-typing is noise, not feedback.
  const numberComplete = digits.length === rules.maxDigits;
  const showNumberErr = (touched || numberComplete) && !numberOk && digits.length > 0;
  const showExpiryErr = (touched || expiry.length === 5) && !expiryOk && expiry.length > 0;
  const showCvcErr = (touched || cvc.length >= rules.cvcLen) && !cvcOk && cvc.length > 0;

  const reset = () => { setNumber(""); setExpiry(""); setCvc(""); setTouched(false); };
  const close = () => { setOpen(false); reset(); };

  const add = () => {
    setTouched(true);
    if (!formOk) return;
    dispatch({ type: "payment/add", method: { id: `pm${Date.now()}`, label: `${brand} •• ${digits.slice(-4)}`, brand, last4: digits.slice(-4), expiry } });
    setOpen(false); reset();
    toast(`${brand} ending ${digits.slice(-4)} linked.`);
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

      <Sheet open={open} onClose={close} title="Add a card">
        <View>
          <TextField
            value={number}
            onChangeText={(v) => setNumber(formatCard(v, rules.groups, rules.maxDigits))}
            placeholder={brand === "Amex" ? "3782 822463 10005" : "4242 4242 4242 4242"}
            keyboardType="number-pad"
          />
          {/* Live brand read-off, so it's obvious the number is being parsed */}
          {digits.length >= 2 && (
            <View style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center", flexDirection: "row", alignItems: "center", gap: 6 }}>
              {numberOk && <Feather name="check-circle" size={15} color={colors.up} />}
              <View style={{ backgroundColor: rules.tint, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: "#fff", fontSize: 10, fontFamily: fonts.semibold }}>{brand.toUpperCase()}</Text>
              </View>
            </View>
          )}
        </View>
        {showNumberErr && (
          <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>
            {numberComplete ? "That card number doesn't check out. Re-read it off the card." : `${brand} numbers are ${rules.maxDigits} digits — ${rules.maxDigits - digits.length} to go.`}
          </Text>
        )}

        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField value={expiry} onChangeText={(v) => { let x = v.replace(/\D/g, "").slice(0, 4); if (x.length > 2) x = `${x.slice(0, 2)}/${x.slice(2)}`; setExpiry(x); }} placeholder="MM/YY" keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField value={cvc} onChangeText={(v) => setCvc(v.replace(/\D/g, "").slice(0, rules.cvcLen))} placeholder={rules.cvcLen === 4 ? "CVC (4)" : "CVC"} keyboardType="number-pad" />
          </View>
        </View>
        {showExpiryErr && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>Expiry must be MM/YY and in the future.</Text>}
        {showCvcErr && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>{brand} security codes are {rules.cvcLen} digits.</Text>}

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button onPress={add} disabled={!formOk}>Link card</Button>
          <Button variant="secondary" onPress={close}>Cancel</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
