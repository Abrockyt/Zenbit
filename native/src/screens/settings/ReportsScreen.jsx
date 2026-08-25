import { useState } from "react";
import { View, Text } from "react-native";
import { Screen, Header, Row, Sheet, Button, TextField, EmptyState, colors, spacing } from "../../ui/kit";
import { useApp, useToast } from "../../state/store";
import { useAsyncAction } from "../../state/useAsyncAction";
import { relativeTime } from "../../lib/time";

const REASONS = ["Spam or scam", "Impersonation", "Harassment", "Financial advice / manipulation", "Something else"];

export default function ReportsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");

  const file = useAsyncAction(async () => {
    dispatch({ type: "social/report", report: { id: `rep${Date.now()}`, target: "Zenbit Pro", kind: "problem", reason, detail: detail.trim(), at: Date.now(), status: "received" } });
  }, { label: "Filing report", queueWhenOffline: true });

  const submit = async () => {
    await file.run();
    if (!file.isError) { setOpen(false); setDetail(""); toast("Report received. We'll follow up by email."); }
  };

  return (
    <Screen>
      <Header title="Report & safety" onBack={() => navigation.goBack()} right={<Text onPress={() => setOpen(true)} style={{ color: colors.up, fontWeight: "600" }}>Report</Text>} />

      {state.social.reports.length === 0 ? (
        <EmptyState icon="alert-triangle" title="No reports filed" body="Reports you file from a post, a profile, or here will show up in this list." />
      ) : (
        state.social.reports.slice().reverse().map((r) => (
          <Row key={r.id} icon="alert-triangle" title={r.kind === "problem" ? r.reason : `Reported ${r.target.startsWith("@") ? r.target : `@${r.target}`}`} subtitle={`${r.reason}${r.detail ? ` · ${r.detail}` : ""} · ${relativeTime(r.at)}`} right={<Text style={{ color: r.status === "received" ? colors.warn : colors.up, fontSize: 12 }}>{r.status === "received" ? "Received" : "Reviewed"}</Text>} />
        ))
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Report a problem">
        <View style={{ gap: 6, marginBottom: spacing.md }}>
          {REASONS.map((r) => (
            <Text key={r} onPress={() => setReason(r)} style={{ padding: 13, borderRadius: 8, backgroundColor: reason === r ? colors.surfaceRaised : colors.surfaceCard, borderWidth: 1, borderColor: reason === r ? colors.borderStrong : colors.borderSubtle, color: colors.textPrimary }}>{r}</Text>
          ))}
        </View>
        <TextField value={detail} onChangeText={setDetail} placeholder="Anything else we should know? (optional)" multiline />
        {file.isError && <Text style={{ color: colors.down, fontSize: 12, marginTop: 6 }}>Couldn't file that report. {file.error?.message}</Text>}
        {file.isQueued && <Text style={{ color: colors.warn, fontSize: 12, marginTop: 6 }}>You're offline. This report is queued and sends when you reconnect.</Text>}
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button loading={file.isLoading} onPress={submit}>Send report</Button>
          <Button variant="secondary" onPress={() => setOpen(false)}>Cancel</Button>
        </View>
      </Sheet>
    </Screen>
  );
}
