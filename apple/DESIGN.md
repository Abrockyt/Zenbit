# Zenbit — Native Apple Redesign (UPI payments + Zen AI)

Native SwiftUI rebuild of Zenbit as a **UPI payments app** (GPay / Paytm / super.money category) for
**iPhone, iPhone foldable ("Duo"), iPad and Apple Watch**, designed to feel like Apple built it.

- Code: `apple/` (XcodeGen project → `ZenbitPay.xcodeproj`), iOS 26 / watchOS 26, Swift + SwiftUI only.
- The original React/Expo app in `native/` and the web app in `src/` are untouched.

---

## 1. Research inputs

| Source | What we took from it |
|---|---|
| *Laws of UX* (Jon Yablonski) — all 10 laws + "Design principles" and ethics chapters | Rationale for every screen (see §5) and our principles (§2). Ethics chapter → no dark patterns: no fake urgency, no pre-ticked upsells, scam warnings instead of friction-free collect requests. |
| Apple HIG — **Materials** | Liquid Glass only on the *control/navigation layer* (tab bar, toolbars, close buttons, composer, toasts). Content cards are solid surfaces. Used sparingly. |
| Apple HIG — **Color** | One colour = one meaning: green means *action/brand*, so received money is shown with a "+" sign, not in green. Every custom colour has light, dark **and increased-contrast** variants. Never colour alone for status (icon + text). |
| Apple HIG — **Generative AI** | Keep people in control; label AI; set expectations with suggested prompts; on-device for privacy; non-AI fallback; minimise hallucination risk by scoping the model. |
| Apple HIG — **Apple Pay** | Payee name + total together; cohesive in-app flow (no hand-offs); always end on a confirmation/receipt page with status and reference. |
| Apple Intelligence / Siri visual language (press coverage) | The edge glow signals *"AI is working"* → our glow appears only while Zen AI is thinking, never as decoration. |
| Liquid Glass open-source references (Apple Landmarks sample, LiquidGlassReference, LiquidGlassSwiftUI) | Glass on navigation layer only, group related glass, respect Reduce Transparency, rely on system components (TabView, toolbars) for free behaviour. |
| Apple Cash / Wallet | Restraint: one hero object per screen, glossy tactile money object (our 3D coin), quick confirmation animation. |
| GPay / PhonePe / Paytm / super.money (Jakob's law) | Familiar structure: Scan & Pay first, people grid, payee → amount → PIN → receipt, collect requests on Home, UPI Lite, bank-name verification. |

## 2. Design principles (book ch. 11: principles must be actionable)

1. **Money first, everything else second.** Pay and Scan are reachable in one tap from anywhere.
2. **The system carries the complexity** (Tesler). Limits, banking-name lookup, duplicate detection and category tagging are automatic.
3. **Calm by default, delightful at the end** (Peak–End). Quiet screens; the celebration is saved for the moment money lands.
4. **AI drafts, people decide.** Zen AI never moves money; it prepares the normal flow.
5. **Never colour alone, never motion alone.** Every state has an icon and words; Reduce Motion has a full alternative.

## 3. Visual system

**Colour hierarchy** (as briefed):
- Light: **white** canvas (dominant) → **green** actions → **black** text and hero card.
- Dark: **black** canvas (dominant) → the **same green** → **white** text.

| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | `#FFFFFF` | `#000000` | Page background |
| surface | `#F3F6F4` | `#101312` | Cards on canvas |
| ink | `#0B0D0C` | `#FFFFFF` | Primary text |
| green | `#00C46A` | `#00C46A` | Fills with **black** label (9.1:1) |
| greenInk | `#00804A` | `#1FD67F` | Green *text* (5.0:1 on white, 9.1:1 on black) |
| greenSoft | `#E4F8EE` | `#0A2618` | Icon squircles, AI chips |

- **Type:** SF Pro (system) everywhere, **SF Pro Rounded** for amounts, monospaced digits, Dynamic Type text styles.
- **Spacing:** 4 pt base, 8 pt grid; 20 pt screen margins; 44 pt minimum targets; 54 pt primary buttons.
- **Shape:** continuous ("squircle") corners: 12 / 16 / 22 / 30.
- **Icons:** SF Symbols, semibold, small scale, hierarchical rendering, on soft-green squircles.
- **Motion tokens:** snappy (0.28 s), standard (0.42 s), hero (0.62 s, slight bounce), island (0.5 s).
- **3D:** a real SceneKit PBR coin (procedural, no assets) on Welcome, Done and the Home balance card. A 2.5D SwiftUI coin flies during payments and appears on the watch. Blender wasn't needed: procedural SceneKit keeps the app small, themable and interactive (you can flick the coin).

## 4. Information architecture and navigation

```
Onboarding: Welcome ─▶ Phone ─▶ OTP ─▶ Link bank ─▶ Set UPI PIN ─▶ Done
                                                              │
Tab bar (Liquid Glass; sidebar on iPad):                      ▼
 ├─ Home ── Scan ▸ ScanView ─┐   People ▸ PayFlow   Requests ▸ PayFlow / Block
 │          Notifications    │   Recent ▸ TransactionDetail   Insight ▸ Zen AI
 ├─ Activity ── search, filters ▸ TransactionDetail ▸ Pay again / Share / Report
 ├─ Zen AI ── prompt ▸ cards ▸ PayFlow (prefilled) | Split requests
 ├─ Profile ── My QR · Bank accounts · UPI Lite · Autopay · Face ID · Appearance · Simulator · Design notes · Sign out
 └─ Pay (search role) ── name / phone / UPI ID ▸ verify ▸ PayFlow
PayFlow (full screen): Amount ─▶ [warnings] ─▶ UPI PIN (or UPI Lite) ─▶ Journey animation ─▶ Receipt
```

Entry points into PayFlow: people grid, Pay search, QR scan, `upi://pay` deep link, request card, AI card, Activity "Pay again", bill chip.

## 5. Screen-by-screen rationale

| Screen | Decisions → law / guideline |
|---|---|
| **Welcome** | Real 3D coin + soft mesh gradient (Aesthetic-Usability). One primary CTA (Hick). Auto-advancing value props that stop once the person swipes. |
| **Phone / OTP** | 4-step progress (Goal-gradient). Accepts `+91`, spaces and paste (Postel). OTP autofill from Messages, 30 s resend timer, wrong-code shake. |
| **Link bank** | Bank discovery is automatic from the phone number (Tesler). |
| **Set PIN** | Enter + confirm; mismatch resets with shake and explanation. |
| **Home** | Hero balance card (hidden until PIN, auto-hides after 30 s). Four primary actions (Hick, Pareto), with Scan & Pay the only filled tile (Von Restorff). People grid in the thumb zone (Fitts). Collect requests with scam detection. Weekly AI insight, labelled. |
| **Amount** | Familiar layout (Jakob). Big rounded amount with numeric transitions. Banking name shown (trust). AI "Usually ₹250" chip fills but never sends. Inline errors explain *why* Pay is disabled. Account picker includes UPI Lite. |
| **Warnings** | Duplicate (same payee and amount within 10 min) and first-time ≥ ₹10,000 are soft and dismissible: people stay in control. |
| **UPI PIN** | Payee and amount repeated (Apple Pay HIG). Feedback under 400 ms (Doherty). 3 wrong attempts → lock with live countdown. |
| **Journey + receipt** | Peak–End (see §7). Receipt: status badge, UPI Ref (copy), To, From, time, Share, Done, plus an optional "Split this". |
| **Activity** | Grouped by day (Common region). Search by name, note, amount or ref (Postel). Chip filters. Swipe: Pay again. Context menu: copy ref, pay, share. |
| **Detail** | Status timeline (started → debited → credited) and copyable IDs. Dispute reasons via confirmation dialog. |
| **Zen AI** | Suggested prompts (HIG), on-device badge, labelled answers, action cards, thumbs feedback, disclaimer. Glow only while thinking. |
| **Profile** | Settings mental model (Jakob), chunked (Miller). Asks only for an optional email: name and phone come from bank KYC (data minimisation). |

The same rationale is browsable in-app: **Profile ▸ Design notes**.

## 6. Edge cases handled

**Amount input:** leading zeros, double decimal, more than 2 paise digits, more than 6 integer digits (all rejected with a haptic) · zero amount · over balance · over ₹1,00,000 per transaction · daily limit reached or remaining · merchant fixed-amount QR (locked) · UPI Lite only ≤ ₹500 and ≤ Lite balance.

**Payee:** contact not on UPI (Invite instead of Pay) · new UPI ID or phone verified before paying · malformed UPI ID hint · block and report.

**Risk:** duplicate payment warning · first-time large payment warning · "you won money, enter PIN" collect-request scam flagged and blockable · AI safety review.

**PIN:** wrong PIN (attempts left) · lockout with countdown · forgot PIN.

**Network / bank** (simulated): success · recipient bank down (failed, no debit, retry) · timeout (Processing → auto-completes after 15 s with toast and haptic; copy tells people *not* to pay again; auto-reversal in 48 h) · slow network (4 s).

**Flow:** the payment sheet can't be swiped away mid-flight · app lock (Face ID) on backgrounding hides the app-switcher snapshot · deep links `upi://pay?...` · invalid QR · QR from Photos · no camera (Simulator samples).

**Accessibility:** Dynamic Type styles · VoiceOver labels on every custom control · Reduce Motion alternatives · Increase Contrast colours · no colour-only states.

**Try them:** Profile ▸ Demo ▸ Bank simulator, or in *Realistic* mode pay **₹404** (bank down) or **₹504** (processing). Demo UPI PIN is **1234** (or whatever you set during onboarding).

## 7. Signature animation spec — "money to the person"

| t (s) | What happens |
|---|---|
| 0.00 | PIN accepted → soft haptic. A black capsule **grows out of the Dynamic Island** (spring 0.5 s), like a Live Activity, showing the payee avatar, "Paying ₹250" and a spinner. The status bar steps aside. |
| 0–0.9+ | A rupee coin hovers lower-right (gentle ±38° sway, never edge-on) while the bank responds. Minimum 0.9 s, so success feels deliberate (Doherty / perceived value). |
| +0.95 | The coin flies on a Bézier arc **right → left** into the avatar inside the island, with a 7-coin trail (Paytm-rocket energy, Apple restraint). |
| landing | Avatar ring turns green, a checkmark appears, success haptic. Failure: the coin stalls at the apex and drops, red ring, error haptic. Pending: amber clock. |
| +1.0 | The island **collapses back into the Dynamic Island** (the Apple Music minimise motion), while the receipt springs up and the check draws itself. |
| Reduce Motion | No flight: island fades in, receipt cross-fades. |

On devices without a Dynamic Island (iPad), the capsule emerges from the top edge instead.

## 8. Platforms

- **iPhone:** primary target, portrait, tab bar minimises on scroll.
- **iPad:** the same `TabView` becomes a sidebar (`.sidebarAdaptable`). Home uses a centred 680 pt column in portrait and two columns at ≥ 980 pt. Activity is list + detail side by side. PayFlow is centred at 480 pt.
- **iPhone foldable ("Duo"):** all layouts key off size class and *measured width*, not device model. Folded behaves like iPhone; unfolded switches to the iPad layouts at the same breakpoints. Xcode 26.6 has no foldable simulator, so this was verified with iPhone and iPad simulators as stand-ins.
- **Apple Watch:** glance and receive. Hidden balance (tap to reveal), receive QR, request via Digital Crown, recent activity with status, and a **custom long-look notification** (`PAYMENT_RECEIVED`) with "Say thanks" and "View receipt" actions. Sending money stays on iPhone (PIN entry, error risk). Test with `PushPayloads/payment_received.apns`.

## 9. Measuring success ("outcome metrics")

**HEART framework**

| | Signal | Metric | Target |
|---|---|---|---|
| Happiness | Post-payment micro-survey, AI thumbs | CSAT; AI 👍 rate | ≥ 4.5/5; ≥ 80 % |
| Engagement | Payments per active user | weekly payments / WAU | ↑ |
| Adoption | Zen AI, UPI Lite, Scan | % of WAU using each | AI ≥ 25 % |
| Retention | Returning payers | D30 retention | ≥ 60 % |
| Task success | Funnel below | pay completion; time-to-pay | ≥ 97 %; ≤ 8 s for repeat payee |

**Payment funnel events** (already instrumented via `Analytics.track`):
`pay_flow_start(source)` → `amount_confirmed(warnings, lite)` → `pin_ok` / `pin_wrong` → `payment_result(status)` · plus `scan_ok`, `scan_invalid`, `ai_prompt`, `ai_suggestion_used`, `ai_feedback`, `copy(field)`, `request_sent`, `onboarding_step`.

**Quality guardrails:** taps-to-pay for a repeat payee ≤ 4 · PIN feedback < 400 ms · 120 fps with no hitches during the journey (check with Instruments ▸ Animation Hitches) · wrong-payee disputes ↓ · duplicate-warning "cancel" rate (the share of warnings that were real) · crash-free sessions ≥ 99.8 %.

## 10. Running it

```bash
cd apple && xcodegen generate && open ZenbitPay.xcodeproj
```

Schemes: **ZenbitPay** (iPhone and iPad) and **ZenbitWatch**. SwiftUI `#Preview`s are on every main view.

Debug launch arguments (for reviews and screenshots): `-ZBScreen home|history|ai|profile|pay|amount|pin|success|failure|pending|onboarding` and `-ZBAppearance light|dark`.

## 11. Not done yet / next

- Real UPI/NPCI integration via a PSP bank SDK (everything here is simulated).
- Live Activity and Dynamic Island widget for payments in flight (needs a widget extension).
- Watch complications (WidgetKit) and iPhone ↔ Watch sync via WatchConnectivity.
- Contacts permission (currently sample contacts) and real camera testing on device.
- Localisation (Hindi and other regional languages) and RTL review.
- Usability testing with 5–8 people per round to validate the metrics above.

---

## 12. v2: reference-driven pass (user-supplied inspiration)

**Sources:** two pills.design clips ("Add Money Screen – Fintech App" / Vael, and "Spendable Add Money Screen"), an onboarding reference (orbit of people plus a notifications permission screen), and GPay's Home and Pay screens (via Mobbin).

| Reference pattern | Where it lives now |
|---|---|
| Orbit of rounded-square portraits around a hero face, black pill CTA | `OnboardingHero.swift › OrbitStep`: two counter-rotating rings, staggered spring pop-in, gentle bob |
| Phone mock with notifications sliding in, floating faces, "Turn on notifications / Another time" | `NotifyStep`: real `UNUserNotificationCenter` request, three cards animate in sequence with soft haptics |
| GPay Home: illustrated hero with QR (left) and profile (right), 4 action tiles, People grid with "More", Businesses, "New payment" FAB | `HomeView` + `HomeHero`: SwiftUI-drawn city/hills scene (day, and night with stars and lit windows), parallax and stretch, a 3D coin as the sun, Liquid Glass controls, People grid with photos that expands in place, glass FAB that condenses to "+" on scroll |
| GPay Pay screen: "Paying NAME", shield + registered name, phone, big amount, note pill, bank row | `AmountStage` header and account row |
| Spendable: fanned, shuffling disc stack; sheet height morphing between states | `GetPaidSheet` + `FanStack` (perspective fan that loops; detents animate menu → QR → request) |
| Vael: swipe-to-confirm | `SlideToConfirm`: thumb-following fill, shimmering hint, success haptic, VoiceOver activate action |
| Vael: rising colour glow + mono-caps "PROCESSING" → "CONFIRMED" | `PaymentJourneyView › GlowBloom` + `StatusTicker` (green bloom on success, red on failure, amber when pending) |
| Vael: result card comes into focus, balance counts up | Receipt `FocusIn` transition (blur + scale + fade) and an eased count-up of the amount |

**Colour/UI consistency:** neutral CTAs are now **ink pills** (black in light, white in dark), as in the onboarding reference. **Green fills are reserved for money actions** (Pay, Scan & Pay, slide-to-pay, New payment), which keeps one colour = one meaning.

**Contact photos:** `Shared/People.xcassets`, used by iPhone, iPad and Watch. *Riya* is a realistic Higgsfield (Soul 2) portrait. The rest are randomuser.me placeholders (128 px, demo-only). Regenerate them all with Higgsfield (≈0.12 credits each) before any release, and keep the names and faces consistent.

---

## 13. v3: rewards, revenue, Instagram-style navigation, simpler Zen AI

### Paying
- **Tap to pay** (the slider was removed at the user's request). The Pay button shows a Face ID glyph when the payment qualifies.
- **Face ID payments:** NPCI's on-device biometric authentication for UPI covers payments up to ₹5,000. Face ID → pay; cancel or failure → UPI PIN. Larger payments always use the PIN. Toggle: Profile ▸ Security ▸ Pay with Face ID.
- **Animation, "cash → Dynamic Island":**
  1. A green banknote card counts the amount up while the aurora breathes and "● PROCESSING PAYMENT" pulses.
  2. On success the card squashes (anticipation), then rockets straight up with an exhaust plume and a coin trail.
  3. As it rises it shrinks and turns black until it *is* the Dynamic Island, like Apple Music minimising.
  4. The island blooms into an expanded Live Activity (photo, Paid, amount, ✓, "now playing" bars).
  5. It settles into a compact pill while the receipt comes into focus.
  6. Failure: the card loses thrust, drops back and shakes red. Pending: amber, held.

### Rewards (super.money-style), `Features/Rewards`
- **0.5% cashback on every successful payment** (minimum ₹0.10), shown right on the receipt at the peak moment.
- **Scratch cards** for payments of ₹500 or more, revealed by actually scratching (Canvas mask).
- **Earn more:** refer a friend (₹250 when they make their first payment), first split (up to ₹100), pay 3 bills (₹50), turn on UPI Lite (₹25), pay at 5 new shops (scratch card).
- **Vouchers** with copyable codes.
- **Rewards history:** every line states its source ("Paid ₹340 to Blue Tokai Coffee", "Arjun Nair made his first payment").
- **Ethics:** rules are stated plainly, with no countdown pressure or "spend more to unlock" mechanics.

### Revenue model (what pays for 0.5% cashback)
| Stream | Where in the app | Notes |
|---|---|---|
| **Sponsored offers** | Home ▸ "Offers for you" (always labelled *Sponsored*) | CPM/CPC from brands; never styled as payments or system UI |
| **Credit on UPI** | Sponsored card "Pre-approved credit line" | Lending partner origination fee + interchange on UPI credit (the main earner for super.money-style apps) |
| **Bill payments & recharges** | Home ▸ "Recharge & pay bills" grid, due-bill nudge | Biller commission (BBPS) per transaction |
| **Merchant MDR** | RuPay credit card on UPI, merchant QR | MDR applies to credit-on-UPI and RuPay credit; P2P stays free |
| **Merchant subscriptions** | Businesses section, future "Zenbit for Business" | Soundbox/QR rental, settlement dashboards |
| **Digital gold / insurance distribution** | Sponsored cards | Distribution commission |
| **Brand-funded vouchers** | Rewards ▸ Vouchers | Brands fund the discount; Zenbit earns a placement fee, offsetting cashback cost |

Guardrails: ads never appear inside the pay flow or receipt; no ad ever uses green "Pay" styling (Von Restorff stays honest); the cap is one sponsored module per screen.

### Navigation
- iPhone: an **Instagram-style minimal floating bar**. Icons only; outline → filled with a bounce; a sliding highlight pill; Zen AI is the live orb; Profile is the person's photo; Pay is a paper plane ("send").
- iPad and unfolded foldables keep the system sidebar.
- **Back buttons** on every tab root (they return to the previous tab), on pushed pages (system back), on Amount (chevron) and on the UPI PIN screen (chevron).

### Zen AI
- **At rest:** an animated wavy orb (`ZenOrb`: four rippling blobs, specular highlight, energy-driven), "Hi Aarav", one line of copy, three suggestions. Nothing else on screen.
- **Generating:** the content blurs, the aurora breathes up from the bottom, the orb speeds up, and a mono status line reads "● ANALYSING YOUR PAYMENTS" (or "PREPARING IT FOR YOU", "CHECKING FOR RISKS"). It holds for ≥ 1.5 s so it reads as a moment.
- **Answers** stream word by word, then their card fades in. Charts grow from zero.
- **Composer:** docked, solid surface with a 1 pt border, a strong placeholder, and a green border when focused. It sits above the floating tab bar and is legible in light and dark.

---

## 14. v4: brand discipline, ads that read as ads, 3D card, Zen AI voice

### Brand: 60 / 30 / 10
- **60%:** canvas (white / true black). **30%:** greys (`surface`, `hairline`, `inkSecondary`) and ink. **10%:** brand green.
- Green is now only on: the floating **Scan & pay** button, money-moving primaries (Pay, Redeem, Review & pay), the coin, the top bar in charts, small accents (sparkles, "+₹" amounts, tags).
- The app-wide tint changed from green to **ink**, so back chevrons, toggles and links are neutral. Action tiles are white or black circles with ink icons. The hero illustration is grey with green only on the trees and the coin. The rewards card is ink, not green.

### Navigation
- Home · History · **Search** (center, ink circle) · Zen AI (live orb) · Profile (photo).
- **Auto-minimize** like iOS 26 `tabBarMinimizeBehavior(.onScrollDown)`: scroll down → a small pill (current tab) plus a separate search circle; scroll up or tap the pill → the full bar returns. `MinimizesTabBar` modifier is applied to Home, History, Search and Profile.
- Home's "New payment" pill became a **floating scanner** ("Scan & pay" → round when scrolled).

### Advertising (labelled, varied, never brand-green)
| Unit | Placement |
|---|---|
| Native ad (art tile + "Ad" tag, brand, headline, CTA) | Top of Notifications; "Next for you" carousel (labelled Sponsored) |
| 2-up product promos with 3D art + "Ad" tag | "More for you" |
| In-house campaign hero (real end date, live countdown) | "Cashback week" on Home |
| Referral banners | "Gift ₹21 to a friend", Rewards tiles |
| Notification promos | Tagged "Only for you" / "Due soon" / "Sponsored" with ⋯ → Mute / Not interested |

Ads use their own colours and art (`AdArt`: layered SF Symbol, gloss and floor shadow) so they're distinguishable from product UI. They never appear in the pay flow or receipt.

### Zenbit Card (3D)
`Card3DView` is SceneKit: an extruded rounded rect (ISO card ratio), clear-coat paint over a PBR base, a metal edge, and image-based lighting with soft-box streaks that sweep as the card sways. The face and back are rendered from SwiftUI (`CardFaceArt`) via `ImageRenderer`. Drag tilts it and it springs back. Changing the bank flips it edge-on and swaps the design. Partner banks are fictional.

### Rewards (super.money structure)
Lifetime cashback card (Redeemed/expired, Redeemable, **Redeem** → bank with a confirmation step), "Get 1% extra" strip → Card, "More rewards for you" tiles, scratch cards, **Coupons** sheet, and a cashback history that names every source plus the 6-month expiry rule. **Invite & earn:** "Refer & earn ₹700", How it works (+₹100 / +₹500 / +₹100), contact search with Invite buttons, "Invite via WhatsApp" + share.

### Zen AI: voice and behaviour
Research basis: Google Conversation Design (be concise, use contractions, keep the focus on the user), Intuit's AI voice and tone (voice is stable, tone adapts), Cloudscape gen-AI loading states and follow-up patterns, Apple HIG Generative AI.

Voice rules:
1. **Answer first.** "You've spent ₹24,308.50 this month." No preamble.
2. **Human, not chummy.** Contractions, plain words, at most one light touch ("A quiet one!", "Nice.").
3. **Exact numbers, never invented.** Every figure comes from real transactions; the model only parses intent.
4. **Name the next step and the safety net.** "Nothing moves until you confirm."
5. **Calm on risk.** "Please don't pay again – it'll settle or come back within 48 hours."
6. **Admit misunderstanding** and show an example instead of guessing.
7. **Offer 1–3 follow-ups** ("Compare with last month", "Where can I save?").

Behaviour fixes (the reported glitches):
- **No blur:** thinking now happens inline (big orb, mono status, shimmer lines) with the aurora behind.
- **Clean hand-off:** the thinking row leaves *before* the answer arrives, so they never overlap.
- **No reflow:** streaming reveals the formatted `AttributedString`, so bold text no longer jumps when typing finishes.
- **Stop button** while streaming; a hard scroll-edge under the title; time-aware greeting; a card title that no longer truncates.

---

## 15. v5: Apple's tab bar, pixel motion, bank switcher, demo Face ID

- **Tab bar = system iOS 26** (`TabView` + `.tabBarMinimizeBehavior(.onScrollDown)`), behaving exactly like Apple Music. Search uses the system `.search` role, so it's a plain circle on the right with no highlight.
- **Ad slot:** `tabViewBottomAccessory` (Music's mini-player slot) shows a rotating sponsored offer. When the bar minimizes, it moves inline between the tab and Search. It's off on Zen AI (iOS 26.1+). Zen AI hides the tab bar entirely, Siri-style.
- **Motion reference (coupon → pixels → total):**
  - Payment done: the ink cash card counts up, then **dissolves left → right into iridescent pixels** that stream along an S-curve into the Dynamic Island. The island opens as they land, then settles into the compact pill while the receipt focuses in. Failure doesn't dissolve: money never left, so the card shakes red. (`DissolveStream`, one Canvas, about 760 particles.)
  - Zen AI: `PixelOrb` (≈460 square pixels on a rotating 3D sphere; bursts when thinking), a Siri-style `EdgeGlow` while working, answers **materialize** in place (the full layout from frame one, with a 12-character fade tail), and suggestions are plain rows.
- **Ads:** no faux-3D art. Typographic creatives in each brand's own colours (FD "8.5%", "BLR ✈ DEL from ₹3,499", a Tiffin & Co. stripe banner with code). The Cashback week banner was removed. "More for you" now sits right under People.
- **Scam request:** neutral card, one amber line, and Ignore / Block. No red block or border.
- **Bank switcher** (`AccountSwitcher`): swipe up/down or tap ▲▼; position dots show there's more than one account. Used for Pay from, Check balance and UPI Lite. **Check balance:** pick the bank → PIN or Face ID → balance counts up; switching bank asks again (each check is authorized separately).
- **Face ID demo** (`Biometrics`): a real Face ID prompt on enrolled devices; otherwise a system-style HUD (scan → tick) in its own window above every sheet. Used for paying (≤ ₹5,000), Check balance and app lock.

---

## 16. v6: real Live Activity, Siri-style AI, sign-up, rewards without scratch cards

- **Real Dynamic Island:** a widget extension (`LiveActivity/`, ActivityKit) shows the payment in the system Dynamic Island and on the Lock Screen (leave the app mid-payment, or lock the phone). While Zenbit itself is open iOS never shows an app's own island, so the in-app island is a matching overlay, now exactly aligned to the hardware (126 × 37 pt, 14 pt from the top; it peeked out by ~3 pt before).
- **Done:** the receipt shrinks into the island → the island tucks back → Home slides up with a confirming toast. Nothing from the journey screen flashes back.
- **Tab bar:** system iOS 26 bar. Home · History · Rewards · Profile + Search. Smaller medium-weight glyphs, a readable label under every icon, indigo selection (so green stays for money), the Music-style minimize on scroll. No ad strip. Zen AI moved to the top bar next to the bell, and Rewards to a gift icon.
- **Home:** Requests first (and the section disappears when empty), People, More for you, calm scam card (one amber line, Ignore / Block), larger spacing. The Scan & pay button animates width with the label clipped, so text never spills while scrolling.
- **Bank picker:** a standard iOS menu row (Apple Pay pattern) with a ⌃⌄ glyph and "2 accounts"; replaces the drag switcher. The Pay screen is compacted so the chips are no longer hidden behind it.
- **Sign-up (Google Pay structure):** Continue with Google / Apple (simulated, creates nothing) / phone → mobile number → OTP → pick bank (search + list) → SIM-verification steps → choose account → PIN.
- **Every ad and notification opens a real page:** OfferPage (flights, food with code, earbuds, gold, insurance), a Fixed Deposit page with a live calculator (quarterly compounding) and Face ID confirm, a bill-pay page, receipt, Invite & earn, a safety guide.
- **Rewards:** light summary card; scratch cards replaced by tap-to-open surprise cards (cash / coupon / "better luck next time"); **redeem celebration** with a cheering emoji, coin shower and a count-up; coupons are added to the Coupons sheet.
- **Zen AI (Siri-style, no green):** blue → violet → pink → orange aurora, pixel orb in the same spectrum, a gradient greeting, a gradient composer border when focused, ink buttons. Full-screen with a close button.
- **Known limitation:** the Live Activity extension needs its own provisioning profile; Xcode must be signed in to create it.

## 17. Home hero (Apple art language)
The cartoon city was replaced with the way Apple makes hero art (Wallet, Apple Cash, iOS 26 wallpapers): a slowly breathing **MeshGradient** (pearl / ice-blue / lilac / peach in light; indigo-plum in dark), three **frosted-glass forms** drifting at different depths, and one hero object, the 3D coin. The bottom dissolves into the canvas. Layers move at different speeds while scrolling and don't move on overscroll.

**Device builds without the Live Activity:** if Xcode's command line has no Apple ID session, `project-device.yml` (generated from `project.yml` minus the widget extension) builds a signed app for the phone: `xcodegen generate --spec project-device.yml`, then build the `ZenbitPayDevice` project's `ZenbitPay` scheme. The full project (`ZenbitPay.xcodeproj`) includes the Live Activity and signs fine from the Xcode window.

## 18. Home hero (final): illustrated scene
Replaced the abstract mesh/glass hero with a flat, pastel illustration in the spirit of the Google Pay hero, drawn entirely in SwiftUI (`HomeHero.swift`): a soft mesh-gradient sky, a sun glow, drifting clouds, birds, a skyline with an India Gate–style arch and a domed pavilion, pastel hills, trees, two people on a picnic mat (one pays and a "+₹50" chip floats up every ~4.5 s, one waves) and a child flying a kite whose string follows the wind. Nine depth layers drift at different speeds while scrolling. The nearest hill is the page colour, so the content grows out of the scene. Green appears only on the trees.

## 19. v7: island that reads like iOS, sound, calmer Home, loading states
- **Island (payment done):** the pixel card streams into the island, which widens **around the sensor cutout** – ₹ amount on the left, a circle that draws itself and then ticks on the right – holds, then shrinks back into the hardware island with a calm, overdamped spring. No avatar, no name, no music bars. Content can never sit in the middle: the physical cutout covers that region (it hid the amount before). Phones without an island get a centred pill. Pending shows a clock, failure shows a ✕.
- **Sound:** synthesised "ding-ding" for success (E6 → A6 with a soft overtone), a gentle tone for pending, two falling notes for failure (`Sounds.swift`). It respects the silent switch (`.ambient`) and mixes with other audio. No audio assets.
- **Receipt:** rows have real vertical padding; the card is roomier.
- **Requests:** none on a fresh install. After the first successful payment a request arrives (~2.5 s later) and stays. The scam-pattern "Rewards Desk" request moved to Notifications with a "Looks like a scam" tag and a review page (Block & report / Ignore).
- **Loading:** returning users see a wireframe of Home (outlined blocks, soft light sweep) for ~1.1 s on launch; pages (offers, FD, rewards, notifications, card…) show a wireframe for ~0.55 s before fading in.

## 20. Ads with media, iPad and Watch
- **`AdMedia`** is the picture layer of every ad (offer page, Tiffin banner, flights card, native ad thumbnails). Photos named `ad-<offer>` in `Shared/Ads.xcassets` are used when present (Ken-Burns zoom + scrim); otherwise animated scenes: a plane gliding through drifting clouds with a contrail, rising bokeh and steam around a takeaway bag, a rotating light ring behind earbuds, shimmering stacked gold coins, pulsing rings around a shield. See `AD_PHOTOS.md` for the photo prompts.
- **iPad:** two-column Home, the hero scene lives in a centred column so the people stay readable, chips no longer spill into the next column, History is list + detail, Zen AI is full-screen. There is no foldable-iPhone simulator in Xcode, so that size is covered by the iPad and iPhone layouts (everything keys off width, not device).
- **Watch:** restyled to the new brand – soft-indigo accent, white action buttons, violet-black gradient, no green chrome.

## 21. v8: iPhone + Watch focus, Watch ↔ iPhone connection, Watch redesign, new icon
- **Scope:** iPad is dropped (payments aren't an iPad use case): the app is iPhone-only (`TARGETED_DEVICE_FAMILY: 1`) plus the Watch app. Foldable iPhones ("Duo"): there is no simulator, so layouts key off width (compact class) and are verified on iPhone sizes; the unfolded layout is the 680 pt centred column.
- **Connection (`Shared/Connectivity/WatchLink.swift`, WatchConnectivity):** (1) the watch shows a 6-digit code and asks the phone to connect; (2) the phone shows "Connect Apple Watch?" with the same code – approve with Face ID – or the person types the code into Profile ▸ Apple Watch; (3) the watch accepts an approval only for the code it is showing; (4) the phone pushes a small snapshot (name, UPI ID, balance, last 8 payments) after every payment and on "Sync now". Codes expire after 5 minutes and refresh themselves. Either side can disconnect. Nothing that can move money is ever sent to the watch.
- **iPhone:** Profile ▸ Apple Watch (steps, manual code entry, status, sync, disconnect) and a global approval sheet.
- **Watch UI:** follows the supplied reference – a light page, a pastel mesh card (periwinkle → lilac → ice, slowly breathing) with a label, the UPI ID, one huge balance (hidden until tapped, re-hides after 8 s) and a small green delta pill, then pill buttons with a round white icon on the left (Receive, Request). Welcome → Pairing → "Connected ✓" → Home. A soft band behind the (always white) system clock keeps it readable.
- **Icon:** a new 1024 px app icon for iPhone and Watch: indigo–violet mesh, a glass coin ring, a bold ₹ and the pixel-dust trail from the payment animation.
- **Device builds:** `project-device.yml` builds the iPhone app signed on a free account (no Watch, no Live Activity). The full `ZenbitPay.xcodeproj` (Watch + Live Activity) signs from the Xcode window.

## 22. v9: exact Dynamic Island on every iPhone, new payment sounds, widgets
- **Island fit, measured, not guessed.** Each iOS 26 iPhone simulator was booted on a white screen and the hardware island's pixels scanned. All islands are 125 × 36.67 pt and centred; the top offset differs: **11.33 pt** (14 Pro/Pro Max, 15 family, 16/16 Plus), **14 pt** (16 Pro/Pro Max, 17, 17 Pro/Pro Max), **20 pt** (Air); 16e/17e have a notch. The overlay previously used 14 pt everywhere, so on an iPhone 16 it sat 2.67 pt below the real island – the "duplicate island". Verified on an iPhone 16 simulator: at rest the black area equals the hardware island exactly (x 402–776, y 34–143 px); it widens sideways from the same top/bottom edges and tucks back in.
- **Why not the system island while paying:** iOS never shows an app's own Live Activity in the Dynamic Island while that app is frontmost. Zenbit starts a real Live Activity (`LiveActivity/`) so the payment shows in the system island as soon as you leave the app and on the Lock Screen; inside the app the exactly-fitted overlay does the expansion.
- **Sounds** (`iOS/Resources/Sounds`): `zen_whoosh` (Kenney CC0 `maximize_005` + a synthesised air sweep, ~1 s, timed to the pixel stream and cut as it enters the island), `zen_success` (warm two-note ding: Kenney `confirmation_004` + `glass_001` a fifth up, soft body + room reverb – the UPI "payment done" feel), `zen_success_bright` (crisp ding). Played on the tick, not before. Profile ▸ Preferences ▸ Payment sound: Chime / Bright / Off (previews on change). Credits in `CREDITS.md`.
- **Widgets** (`LiveActivity/Widget/ZenbitWidgets.swift`), actions first, numbers second, never a balance: Scan & pay (small, Lock Screen circle), Quick pay (medium: 4 favourites with photos + Scan, My QR), Cashback (small, Lock Screen inline), Spending (medium with 7-day chart, Lock Screen rectangle), Payments (large: Scan/Receive/Rewards + latest 4), and a **Control Center** "Scan & pay" button. Every tap opens `zenbit://scan | receive | rewards | history | pay/<name>`. Data is sample data until an App Group is added.

## Final round (26 Nov)
- **Payment island:** during a successful payment the island opens into a large card (screen width minus 22 pt, 134 pt tall): 64 pt portrait, "Sending to <name>" over a 32 pt amount, and a 46 pt spinner. When the money lands the spinner becomes a green disc with a tick, the caption changes to "Sent to", and the payment sound plays. Order: island opens, 0.9 s later the card streams into it, then the tick. The Live Activity uses the same row.
- **Widgets in Clear / Tinted mode:** iOS flattens colours to one tint and keeps only opacity, so widgets switch to white-at-set-opacity (`WTone`), keep portraits in full colour (`widgetAccentedRenderingMode(.fullColor)`), and use larger, heavier text.
