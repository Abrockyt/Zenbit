import { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, colors, spacing, radius } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";

const REJECTION = "The document photo was too blurry to read the expiry date.";

// Pending -> approved | rejected, with a resubmit path. Resolves on its own
// so the pending state is real rather than a dead end: first attempt in a
// session is rejected, the resubmit approves — mirroring a real review queue.
export default function KycStatusScreen({ navigation, route }) {
  const next = route.params?.next ?? "Home";
  const { state, dispatch } = useApp();
  const toast = useToast();
  const status = state.kyc.status;
  const [elapsed, setElapsed] = useState(0);
  const attempted = useRef(false);

  useEffect(() => {
    if (status !== "pending") return;
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    const timer = setTimeout(() => {
      if (!attempted.current) {
        attempted.current = true;
        dispatch({ type: "kyc/reject", reason: REJECTION });
      } else {
        dispatch({ type: "kyc/approve" });
      }
    }, 3200);
    return () => { clearInterval(tick); clearTimeout(timer); };
  }, [status]);

  if (status === "unverified") {
    return (
      <Screen>
        <Header title="Identity" />
        <Button onPress={() => navigation.navigate("KycIntro", { next })}>Start verification</Button>
      </Screen>
    );
  }

  const view = {
    pending: { icon: "refresh-cw", tint: colors.warn, title: "Reviewing your documents", body: "This usually takes under two minutes. You can leave this screen — we'll notify you when it's done." },
    approved: { icon: "check", tint: colors.up, title: "Identity verified", body: "Buy, Sell and the Zenbit card are unlocked." },
    rejected: { icon: "alert-triangle", tint: colors.down, title: "Document rejected", body: state.kyc.rejectionReason ?? REJECTION },
  }[status];

  return (
    <Screen>
      <Header title="Identity" onBack={() => navigation.navigate(next)} />
      <View style={{ alignItems: "center", gap: 14, paddingVertical: 40, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: view.tint + "20", borderWidth: 1, borderColor: view.tint }}>
          <Feather name={view.icon} size={24} color={view.tint} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "600" }}>{view.title}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", maxWidth: 280 }}>{view.body}</Text>
        {status === "pending" && <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{elapsed}s elapsed</Text>}
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ gap: spacing.md }}>
        {status === "approved" && (
          <Button onPress={() => { toast("Identity verified."); navigation.replace(next); }}>Continue</Button>
        )}
        {status === "rejected" && (
          <>
            <Button onPress={() => { dispatch({ type: "kyc/reset" }); navigation.replace("KycDocuments", { next }); }}>Retake and resubmit</Button>
            <Button variant="secondary" onPress={() => toast("Support will email you within one business day.")}>Contact support</Button>
          </>
        )}
        {status === "pending" && <Button variant="secondary" onPress={() => navigation.navigate(next)}>Leave and come back later</Button>}
      </View>
    </Screen>
  );
}
