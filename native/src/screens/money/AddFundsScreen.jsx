import { Screen, Header, Row } from "../../ui/kit";

export default function AddFundsScreen({ navigation }) {
  return (
    <Screen>
      <Header title="Add Funds" onBack={() => navigation.goBack()} />
      <Row icon="briefcase" title="Bank Transfer" subtitle="Free · 1-3 days" onPress={() => navigation.navigate("PaymentMethods")} />
      <Row icon="credit-card" title="Debit / Credit Card" subtitle="Instant · 2% fee" onPress={() => navigation.navigate("PaymentMethods")} />
      <Row icon="arrow-down" title="Crypto Deposit" subtitle="Receive from another wallet" onPress={() => navigation.navigate("Receive")} />
    </Screen>
  );
}
