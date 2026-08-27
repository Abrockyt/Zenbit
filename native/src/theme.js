// RN equivalent of src/styles/tokens.css — same values, flattened out of
// CSS custom properties into a plain JS object since RN has no CSS vars.
//
// THEMING
// -------
// `colors`, `gradients` and `shadow` are deliberately MUTABLE singletons.
// Around fifty files do `import { colors } from "../theme"` and read
// `colors.textPrimary` inside render, so mutating these objects in place
// (rather than swapping the reference) means every one of those call sites
// picks up a theme change for free, with no import churn.
//
// The one thing that does NOT update for free is `StyleSheet.create(...)`
// evaluated at module scope — it captures values once at import. Modules
// that do that subscribe via `onThemeChange` and rebuild their sheet; see
// kit.jsx. Anything reading colours inline needs nothing.
const darkPalette = {
  black: "#000000",
  ink0: "#040605",
  ink1: "#080B0A",
  ink2: "#0C110F",
  ink3: "#121816",
  ink4: "#1A211E",
  ink5: "#232B28",
  white: "#FFFFFF",

  green950: "#060B09",
  green900: "#0B1512",
  green800: "#12211C",
  green700: "#193029",

  up: "#3ADE7E",
  upDim: "rgba(58,222,126,0.18)",
  down: "#F2504B",
  downDim: "rgba(242,80,75,0.16)",
  warn: "#F5B544",
  info: "#5B8CFF",
  // Muted warm gold — a second accent for premium/status contexts (KYC
  // verified, card, alerts) so the app isn't only green-or-red. Deliberately
  // desaturated against `warn` so the two don't read as the same signal.
  accent: "#C9A227",
  accentDim: "rgba(201,162,39,0.16)",

  coin: {
    eth: "#627EEA", btc: "#F7931A", sol: "#14F195", usdt: "#26A17B",
    usdc: "#2775CA", tron: "#EF0027", doge: "#C2A633", link: "#2A5ADA", xlm: "#7D00FF",
  },

  surfaceApp: "#040605",
  surfaceScreen: "#060B09",
  surfaceCard: "rgba(255,255,255,0.045)",
  surfaceCardSolid: "#0F1614",
  surfaceRaised: "rgba(255,255,255,0.07)",
  surfaceSunken: "rgba(0,0,0,0.35)",

  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.62)",
  textTertiary: "rgba(255,255,255,0.38)",
  textDisabled: "rgba(255,255,255,0.22)",

  borderSubtle: "rgba(255,255,255,0.07)",
  borderDefault: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.22)",

  // Semantic tokens added when the light theme landed. Screens used to
  // hardcode rgba(255,255,255,...) for these, which is invisible on a white
  // page — back-button pills, icon chips and inactive tab icons all
  // disappeared. Anything that used to be "a bit of white over the
  // background" belongs here.
  overlayWeak: "rgba(255,255,255,0.06)",
  overlayMedium: "rgba(255,255,255,0.14)",
  iconMuted: "rgba(255,255,255,0.45)",
  sheetBg: "rgba(15,22,20,0.94)",
  // Text sitting on the bank card, which stays dark in BOTH themes.
  onDark: "#FFFFFF",
  onDarkMuted: "rgba(255,255,255,0.6)",
};

// Designed rather than inverted. Two things matter on white that don't on
// black: the semantic colours have to actually pass as readable (the dark
// theme's #3ADE7E green is near-invisible on white, so light gets a deeper
// #0F9D58), and separation has to come from borders and shadow instead of
// a lighter fill, since "raised" can't mean "brighter" when the page is
// already the brightest thing on screen.
const lightPalette = {
  black: "#000000",
  ink0: "#FFFFFF",
  ink1: "#FBFCFB",
  ink2: "#F4F6F5",
  ink3: "#EDF0EE",
  ink4: "#E2E7E4",
  ink5: "#D4DBD8",
  white: "#FFFFFF",

  green950: "#F4F7F5",
  green900: "#E8EFEA",
  green800: "#D8E4DC",
  green700: "#C2D4C8",

  up: "#0F9D58",
  upDim: "rgba(15,157,88,0.12)",
  down: "#D93A35",
  downDim: "rgba(217,58,53,0.10)",
  warn: "#B7791F",
  info: "#2563EB",
  accent: "#A17C1A",
  accentDim: "rgba(161,124,26,0.12)",

  // Brand marks stay as-is — a coin's colour is its identity, not a theme
  // decision, and these all read fine on both grounds.
  coin: {
    eth: "#627EEA", btc: "#F7931A", sol: "#0FBF74", usdt: "#26A17B",
    usdc: "#2775CA", tron: "#EF0027", doge: "#B8952B", link: "#2A5ADA", xlm: "#6D00E0",
  },

  surfaceApp: "#FFFFFF",
  surfaceScreen: "#F6F8F7",
  // Solid white cards on a faintly tinted page: the dark theme gets depth
  // from translucent white over black, which has no light-mode equivalent —
  // a translucent black just looks like dirt.
  surfaceCard: "#FFFFFF",
  surfaceCardSolid: "#FFFFFF",
  surfaceRaised: "#EDF1EF",
  surfaceSunken: "rgba(0,0,0,0.04)",

  textPrimary: "#0D1512",
  textSecondary: "rgba(13,21,18,0.66)",
  textTertiary: "rgba(13,21,18,0.45)",
  textDisabled: "rgba(13,21,18,0.26)",

  borderSubtle: "rgba(13,21,18,0.07)",
  borderDefault: "rgba(13,21,18,0.13)",
  borderStrong: "rgba(13,21,18,0.26)",

  overlayWeak: "rgba(13,21,18,0.05)",
  overlayMedium: "rgba(13,21,18,0.08)",
  // Not a light grey: an inactive tab icon still has to be legible, and
  // 45%-black on white is roughly the same perceived weight as 45%-white
  // on black.
  iconMuted: "rgba(13,21,18,0.42)",
  sheetBg: "#FFFFFF",
  // Unchanged between themes — the bank card is dark in both.
  onDark: "#FFFFFF",
  onDarkMuted: "rgba(255,255,255,0.6)",
};

// The live palette every screen reads from. Mutated in place by setTheme().
export const colors = { ...darkPalette };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

// Matches src/styles/tokens.css's --grad-screen / --grad-card / --grad-bank-card.
const darkGradients = {
  screen: ["#26332F", "#000000"],
  card: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.025)"],
  glass: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.02)"],
  bankCard: ["#22322C", "#101A17", "#0A1210"],
  primaryButton: ["#4FF497", "#2FBF69"],
};

const lightGradients = {
  screen: ["#FFFFFF", "#EEF3F0"],
  card: ["rgba(255,255,255,1)", "rgba(250,252,251,1)"],
  glass: ["rgba(255,255,255,0.75)", "rgba(255,255,255,0.45)"],
  // The card itself stays dark in both themes — a physical bank card is a
  // dark object, and a white-on-white card would vanish into the page.
  bankCard: ["#22322C", "#101A17", "#0A1210"],
  primaryButton: ["#17B364", "#0B8347"],
};

export const gradients = { ...darkGradients };

// Loaded via @expo-google-fonts/* in App.tsx — names match the web app's
// --font-core (Hanken Grotesk) and --font-mono (Geist Mono).
export const fonts = {
  regular: "HankenGrotesk_400Regular",
  medium: "HankenGrotesk_500Medium",
  semibold: "HankenGrotesk_600SemiBold",
  bold: "HankenGrotesk_700Bold",
  mono: "GeistMono_500Medium",
  display: "ChakraPetch_600SemiBold",
};

const darkShadow = {
  cta: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  sheet: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 },
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
};

// Light mode leans on shadow much harder than dark does — it's the main way
// a white card separates from a near-white page, where dark mode can just
// use a lighter fill. Kept soft and low-opacity so it reads as elevation
// rather than as a drop shadow effect.
const lightShadow = {
  cta: { shadowColor: "#0D1512", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 14, elevation: 6 },
  sheet: { shadowColor: "#0D1512", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 22, elevation: 12 },
  card: { shadowColor: "#0D1512", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2 },
};

export const shadow = { ...darkShadow };

// ------------------------------------------------------------- theme switch

let mode = "dark";
const listeners = new Set();

export function getThemeMode() {
  return mode;
}

export function isLightTheme() {
  return mode === "light";
}

/**
 * Subscribe to theme changes. Only needed by modules that snapshot colours
 * into a `StyleSheet.create(...)` at import time — everything reading
 * `colors.x` inline updates on the next render without doing anything.
 * Returns an unsubscribe function.
 */
export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setTheme(next) {
  if (next === mode) return;
  mode = next;
  const light = next === "light";
  // Mutate in place, never reassign: every module holds a reference to
  // these exact objects.
  Object.assign(colors, light ? lightPalette : darkPalette);
  Object.assign(gradients, light ? lightGradients : darkGradients);
  Object.assign(shadow, light ? lightShadow : darkShadow);
  listeners.forEach((fn) => fn());
}
