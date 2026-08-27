import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, Header, Button, colors, spacing, radius } from "../../ui/kit";
import { goTo } from "../../lib/nav";
import { useApp, useToast } from "../../state/store";

const REJECTION = "The document photo was too blurry to read the expiry date.";

// Pending -> approved | rejected, with a resubmit path. Resolves on its own
// so the pending state is real rather than a dead end.
//
// The outcome follows the capture the person actually submitted: a good
// photo is approved, a deliberately-blurry one is rejected with a reason
// that matches. This used to reject everyone's first attempt regardless —
// which meant the capture screen said the photo was sharp and the review
// then rejected it as blurry, making a working app look broken.
export default function KycStatusScreen({ navigation, route }) {
  const next = route.params?.next ?? "Home";
  const { state, dispatch } = useApp();
  const toast = useToast();
  const status = state.kyc.status;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "pending") return;
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    const timer = setTimeout(() => {
      if (state.kyc.quality === "blurry") dispatch({ type: "kyc/reject", reason: REJECTION });
      else dispatch({ type: "kyc/approve" });
    }, 3200);
    return () => { clearInterval(tick); clearTimeout(timer); };
  }, [status, state.kyc.quality]);

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
    <Screen
      footer={
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
          {status === "approved" && (
            <Button onPress={() => { toast("Identity verified."); goTo(navigation, next); }}>Continue</Button>
          )}
          {status === "rejected" && (
            <>
              <Button onPress={() => { dispatch({ type: "kyc/reset" }); navigation.replace("KycDocuments", { next }); }}>Retake and resubmit</Button>
              <Button variant="secondary" onPress={() => toast("Support will email you within one business day.")}>Contact support</Button>
            </>
          )}
          {status === "pending" && <Button variant="secondary" onPress={() => goTo(navigation, next)}>Leave and come back later</Button>}
        </View>
      }
    >
      <Header title="Identity" onBack={() => goTo(navigation, next)} />
      <View style={{ alignItems: "center", gap: 14, paddingVertical: 40, borderRadius: radius.xl, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: view.tint + "20", borderWidth: 1, borderColor: view.tint }}>
          <Feather name={view.icon} size={24} color={view.tint} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "600" }}>{view.title}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", maxWidth: 280 }}>{view.body}</Text>
        {status === "pending" && <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{elapsed}s elapsed</Text>}
      </View>
    </Screen>
  );
}
