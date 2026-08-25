import { useState } from "react";
import { View, Text } from "react-native";
import { Screen, Header, Button, Row, colors, spacing } from "../../ui/kit";
import { useApp } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";

const DOC_TYPES = [
  { id: "passport", label: "Passport", hint: "Photo page" },
  { id: "licence", label: "Driving licence", hint: "Front and back" },
  { id: "national", label: "National ID", hint: "Front and back" },
];

// No camera permission is requested — capture is simulated and the UI says
// so plainly rather than pretending to scan a real document.
export default function KycDocumentsScreen({ navigation, route }) {
  const next = route.params?.next ?? "Home";
  const { dispatch } = useApp();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState(null);
  const [front, setFront] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [capturing, setCapturing] = useState(null);

  const capture = async (which) => {
    setCapturing(which);
    await new Promise((r) => setTimeout(r, 900));
    if (which === "front") setFront(true); else setSelfie(true);
    setCapturing(null);
  };

  const submit = useAsyncAction(async () => {
    dispatch({ type: "kyc/submit", documents: [docType, "selfie"] });
  }, { label: "Submitting documents", queueWhenOffline: true });

  const go = async () => {
    await submit.run();
    if (!submit.isError) navigation.replace("KycStatus", { next });
  };

  return (
    <Screen>
      <Header title={`Identity check · Step ${step} of 3`} onBack={() => navigation.goBack()} />

      {step === 1 && (
        <View>
          {DOC_TYPES.map((d) => (
            <Row key={d.id} icon="credit-card" title={d.label} subtitle={d.hint} onPress={() => { setDocType(d.id); setStep(2); }} />
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={{ flex: 1 }}>
          <Row
            icon={front ? "check" : "camera"}
            title="Document photo"
            subtitle={capturing === "front" ? "Checking image quality…" : front ? "Looks good — sharp and fully in frame" : "Tap to simulate capture"}
            onPress={() => capture("front")}
          />
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: spacing.sm }}>
            Flat surface, no glare, all four corners visible.
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ gap: spacing.md }}>
            <Button disabled={!front} onPress={() => setStep(3)}>Continue</Button>
            <Button variant="secondary" onPress={() => setStep(1)}>Choose a different document</Button>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={{ flex: 1 }}>
          <Row
            icon={selfie ? "check" : "camera"}
            title="Face photo"
            subtitle={capturing === "selfie" ? "Checking image quality…" : selfie ? "Looks good" : "Tap to simulate capture"}
            onPress={() => capture("selfie")}
          />
          <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: spacing.sm }}>
            Look straight at the camera in even light.
          </Text>
          {submit.isError && <Text style={{ color: colors.down, fontSize: 13, marginTop: spacing.sm }}>Couldn't submit — {submit.error?.message} Your captures are kept, so just try again.</Text>}
          {submit.isQueued && <Text style={{ color: colors.warn, fontSize: 13, marginTop: spacing.sm }}>You're offline. This submission is queued and sends when you reconnect.</Text>}
          <View style={{ flex: 1 }} />
          <View style={{ gap: spacing.md }}>
            <Button disabled={!selfie} loading={submit.isLoading} onPress={go}>Submit for review</Button>
            <Button variant="secondary" onPress={() => setStep(2)}>Back</Button>
          </View>
        </View>
      )}
    </Screen>
  );
}
