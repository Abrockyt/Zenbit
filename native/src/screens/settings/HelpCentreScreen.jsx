import { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { Feather } from "../../ui/IconCompat";
import { Screen, Header, TextField, colors, spacing, radius, fonts } from "../../ui/kit";

// Was a dead toast in ProfileScreen ("Support will reply by email within a
// day.") with no real screen behind it — same class of bug as the other
// orphaned/no-op controls fixed elsewhere. This is a real FAQ list, and
// every answer describes something the app actually does (checked against
// the real screens/behaviour, not written from a generic support-page
// template) rather than invented policy.
const FAQS = [
  {
    q: "Where's my recovery phrase, and can Zenbit get it back for me?",
    a: "It's shown once, during wallet creation (tap to reveal, then \"I've saved it\"), and never again after that. Zenbit doesn't store it anywhere — that's what self-custody means. If it's lost, the wallet it protects is unrecoverable. Write it down somewhere offline and durable.",
  },
  {
    q: "Why do I need to verify my identity?",
    a: "Buying, selling and ordering the Zenbit card all require identity verification (KYC) — it's a document photo plus a selfie, usually reviewed automatically in under two minutes. Sending, receiving and swapping don't require it.",
  },
  {
    q: "My verification was rejected. What now?",
    a: "The status screen tells you why (usually a blurry or partially-cropped document photo). Tap \"Retake and resubmit\" to try again with a new photo, or \"Contact support\" if it keeps failing.",
  },
  {
    q: "What fee does Zenbit take?",
    a: "Buying and selling carry a 1.49% Zenbit fee, shown as its own line on the review screen before you confirm — never hidden in the total. Swaps carry a separate, smaller network fee that goes to the blockchain, not to Zenbit.",
  },
  {
    q: "Why did the price change between review and confirming?",
    a: "Buy and sell quotes are locked for a short countdown shown on the review screen. If it expires before you confirm, tap \"Refresh price\" to lock in the current rate — nothing is charged at an expired price.",
  },
  {
    q: "I sent crypto to the wrong address. Can I get it back?",
    a: "No — this is stated on the Terms screen during setup and again on the send review step: broadcast transactions can't be reversed. Always double-check the address, or better, scan a QR code instead of typing one.",
  },
  {
    q: "How do I change my display currency?",
    a: "Tap the currency pill next to your balance on Home, or go to Settings → Display currency. Zenbit supports USD, INR, GBP, EUR, JPY, AUD, CAD and AED, each formatted the way that currency is actually written (INR shows lakhs and crores, for example).",
  },
  {
    q: "How do I freeze my card?",
    a: "Card tab → Freeze. Payments decline immediately. Unfreeze the same way, any time — nothing about the card number or linked account changes.",
  },
  {
    q: "Face ID isn't available for me — what are my options?",
    a: "If your device doesn't support it, or you haven't enrolled a face in your system settings, the setup screen tells you which and lets you continue with just a passcode. You can add Face ID later once it's set up on the device.",
  },
  {
    q: "The app locked me out after too many passcode attempts. Now what?",
    a: "There's a cooldown period shown on screen. Once it passes you can try again, or restore the wallet from your recovery phrase on a fresh install if you can't wait or don't remember the passcode.",
  },
  {
    q: "Prices look stale or the market screen says it can't refresh.",
    a: "That's a rate-limited or offline price feed, not lost data — your holdings and balances are untouched. A \"Try again\" button appears wherever this happens, and Zenbit automatically retries in the background too.",
  },
  {
    q: "How do I mute, block or report someone on the social feed?",
    a: "Open their profile or tap the ⋯ on one of their posts. Muting hides their posts from your feed without them knowing; blocking also stops them messaging you; reporting sends it to the Reports list in Settings, which you can track from there.",
  },
];

function FaqRow({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={{ backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.lg, padding: 16, marginBottom: spacing.sm }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14.5, fontFamily: fonts.medium }}>{item.q}</Text>
        <Feather name={open ? "chevron-down" : "chevron-right"} size={16} color={colors.textTertiary} />
      </View>
      {open && (
        <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20, marginTop: 10 }}>{item.a}</Text>
      )}
    </Pressable>
  );
}

export default function HelpCentreScreen({ navigation }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <Screen scroll={false}>
      <Header title="Help centre" onBack={() => navigation.goBack()} />
      <TextField value={query} onChangeText={setQuery} placeholder="Search help articles" />
      <FlatList
        style={{ flex: 1, marginTop: spacing.md }}
        data={filtered}
        keyExtractor={(item) => item.q}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <FaqRow item={item} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
            <Feather name="search" size={22} color={colors.textTertiary} />
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: fonts.medium }}>No matching articles</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: "center", maxWidth: 260 }}>
              Try a different word, or contact support directly below.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Pressable
            onPress={() => navigation.navigate("Reports")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16, marginTop: spacing.sm }}
          >
            <Feather name="mail" size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13.5, fontFamily: fonts.medium }}>
              Still stuck? Contact support — replies within one business day.
            </Text>
          </Pressable>
        }
      />
    </Screen>
  );
}
