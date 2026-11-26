# Zenbit · Figma file plan

## Status (2026-11-26)
Built in https://www.figma.com/design/krbWrsbpPXzNV9TtVSxwva/Zenbit-new (old content removed). The Figma plan is Starter, so there are 3 pages and groups are Sections:
- **Page 1 · Design System**: Cover, Foundations (colour/spacing/radius variables, text + effect styles) and Components + 04 · Patterns (Sheet, List row, Search field, Empty state, Banner). Components (Button, Chip, Dial-pad key, PIN dots, OTP box, Step bar, Summary tile, Request card, Reward wallet card, Reward bar, Coupon ticket, Transaction row, Tab bar, Toast, Loading blocks), all native component sets with variants.
- **Page 2 · iPhone App**: 40 screens in 8 sections (Onboarding, Home & Pay, Activity, Rewards, Zen AI, Profile & Watch link, Loading, Edge cases), each with a title and caption.
- **Page 3 · Watch, Widgets & Motion**: 9 Watch screens, 8 widget stills (real widget views rendered at iPhone sizes) with a widget table, and a Motion & Sound table.
- Screens are the real simulator captures (framed PNGs), not redrawn layers: a native redraw did not match the built app, so the images are the source of truth.

**Not done yet**
- Live Activity / Dynamic Island still beyond the existing "Island confirmed" screen.
- Wrong-PIN lockout and OTP-error screens (never captured).
- Font is Inter standing in for SF Pro.

Until then the pieces are ready to drop in by hand:

- `tokens/zenbit.tokens.json` - colours, spacing, radii, type, motion in **Tokens Studio** format.
- `screens/` - one folder per Figma section, framed 1378 × 2746 PNGs (iPhone) - drag onto the page.
- `../recordings/` - 60 fps framed videos for each flow (iPhone + Apple Watch).

## Pages (in order)

| # | Page | What lives there |
|---|------|------------------|
| 01 | **Cover & Read me** | Logo (glass Z + flat black Z), version, status legend, page index, how to use the system. |
| 02 | **Foundations** | Colour (brand, neutral, status, illustration, rewards partner colours, Watch) · type scale (SF Pro / SF Pro Rounded) · spacing 4-pt grid · radii (continuous) · sizes (44 pt target) · motion springs · sound list · iconography (SF Symbols, 18 pt tab icons). |
| 03 | **Components** | Buttons (black ink, green primary, secondary, glass pill, Scan pill) · dial-pad key · PIN dots · OTP boxes · step bar · segmented Create/Confirm · chips · summary tiles · request card (corner art) · reward wallet stack card · reward bar · scratch foil card · coupon ticket · bank logo chip · merchant tile · account switcher · tab bar (expanded, minimised + ad) · toast · skeleton blocks · ZSpinner · Zenbit mark (glass, dark glass). Each as a component set with variants (default / pressed / disabled / selected / error). |
| 04 | **Patterns** | Sheets (approval, duplicate payment, redeem-to), list rows (transaction, bank, contact), empty states, search, error banners. |
| 05 | **iPhone · Onboarding** | Welcome → notifications → sign-in (phone / Apple) → phone → verify OTP → bank → create + confirm PIN → all set. |
| 06 | **iPhone · Home & Pay** | Home (hero, actions, requests, people, ads) · pay (amount, PIN, processing, dissolve into island, receipt) · balance · get paid · offers · notifications. |
| 07 | **iPhone · Activity** | History list, filters, summary tiles, transaction detail, dispute. |
| 08 | **iPhone · Rewards** | Balance + Redeem, wallet stack (collapsed / expanded), redeem-to bank, sending loader → success, surprise cards, scratch sheet, coupons list + ticket detail. |
| 09 | **iPhone · Zen AI** | Intro, thinking, answer + chart, composer. Monochrome. |
| 10 | **iPhone · Profile & Watch link** | Profile, bank accounts, payment sound, Apple Watch connect (steps, code entry, approval sheet). |
| 11 | **Loading** | Launch (white + Z) · app wireframe · page wireframe · circular loader (payment, PIN, OTP, bank link) · redeem sending. |
| 12 | **Edge cases** | Insufficient funds (declined after PIN, no balance shown), payment failed (bank down), processing/pending, duplicate-payment warning, Face ID prompt, wrong PIN / lockout, OTP error. |
| 13 | **Apple Watch** | Welcome → pairing code → Connected → Home · Receive QR · Request (Digital Crown) · Ask Zen (idle / thinking / answer) · payment-received alert. Flat black page, light cards. |
| 14 | **Widgets & Live Activity** | Scan & pay (S + Lock Screen circle) · Quick pay (M) · Cashback (S + inline) · Spending (M + rectangular) · Payments (L) · Control Center button · Dynamic Island / Lock Screen payment. |
| 15 | **Motion & Sound** | Launch, island expand/close, scratch, redeem coins, tick; sound list with source/credit. |

## Notes for whoever builds it
- Money is **green**, actions are **black**, chrome is **greenDeep** when selected; the AI is strictly **black / white**.
- Balances are never shown before paying; insufficient funds appears only after the PIN.
- Brand logos on the screens are trademarks used for a concept; credits in `apple/Shared/Brands-CREDITS.md`.
