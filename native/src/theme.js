// RN equivalent of src/styles/tokens.css — same values, flattened out of
// CSS custom properties into a plain JS object since RN has no CSS vars.
export const colors = {
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
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

// Matches src/styles/tokens.css's --grad-screen / --grad-card / --grad-bank-card.
export const gradients = {
  screen: ["#26332F", "#000000"],
  card: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.025)"],
  glass: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.02)"],
  bankCard: ["#22322C", "#101A17", "#0A1210"],
  primaryButton: ["#4FF497", "#2FBF69"],
};

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

export const shadow = {
  cta: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  sheet: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 },
  card: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
};
