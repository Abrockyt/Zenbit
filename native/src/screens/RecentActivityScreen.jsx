import { View } from "react-native";
import { Screen, Header, SectionHeader, Row, EmptyState } from "../ui/kit";
import { useApp } from "../state/store";

const KIND_ICON = { send: "arrow-up-right", receive: "arrow-down-left", swap: "repeat", buy: "plus-circle", sell: "minus-circle", card: "credit-card" };

function groupByDay(items) {
  const groups = {};
  for (const t of items) {
    const day = t.date.split(",")[0];
    (groups[day] ||= []).push(t);
  }
  return groups;
}

export default function RecentActivityScreen({ navigation }) {
  const { state } = useApp();
  const groups = groupByDay(state.wallet.transactions);

  return (
    <Screen>
      <Header title="Recent Activity" onBack={() => navigation.goBack()} />
      {state.wallet.transactions.length === 0 ? (
        <EmptyState icon="clock" title="No activity yet" body="Sends, swaps, buys and card spend will show up here." />
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <View key={day}>
            <SectionHeader title={day} />
            {items.map((t) => (
              <Row
                key={t.id}
                icon={KIND_ICON[t.kind]}
                title={t.title}
                subtitle={t.subtitle}
                right={undefined}
                onPress={() => navigation.navigate("TransactionDetail", { id: t.id })}
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
