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
