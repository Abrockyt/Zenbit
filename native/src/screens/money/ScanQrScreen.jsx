import { View, Text } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, Button, colors, spacing, radius } from "../../ui/kit";

// A real camera permission prompt would be dishonest in a demo that can't
// scan, so this is an explicitly simulated viewfinder, same as the web app.
const SAMPLE = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

export default function ScanQrScreen({ navigation }) {
  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
          <Button onPress={() => navigation.navigate("Send", { address: SAMPLE })}>Simulate a scan</Button>
          <Button variant="secondary" onPress={() => navigation.navigate("Send")}>Enter the address instead</Button>
        </View>
      }
    >
      <Header title="Scan to send" onBack={() => navigation.goBack()} />
      <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: "center", marginBottom: spacing.md }}>Simulated — no camera is used</Text>

      <View style={{ aspectRatio: 1, borderRadius: radius.xl, backgroundColor: colors.ink2, borderWidth: 1, borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
        <Feather name="maximize" size={44} color="rgba(255,255,255,0.14)" />
      </View>

      <Text style={{ color: colors.textTertiary, fontSize: 13, textAlign: "center", marginBottom: spacing.lg }}>
        Point at a wallet QR code. Zenbit reads the address and the amount if the code includes one.
      </Text>

    </Screen>
  );
}
