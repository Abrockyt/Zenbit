import { MorphIcon } from "morphicons/react";
import * as iconsData from "lucide";

// Wrapper so every glyph comes from one set (Lucide) and inherits token color,
// matching the design system's <Icon name="…"> contract.
//
// A handful of short, friendly names used across the app (swap, card, alert…)
// don't match a real Lucide export — `lucide` has no "Swap" or "Card".
// Icon used to fail silently on those (render nothing), which is why the tab
// bar, error banners and chat glyphs were going invisible. This alias table
// is the fix: it's the single place a short name gets mapped to the real
// Lucide component, so call sites never have to know the difference.
const ALIASES = {
  swap: "ArrowLeftRight",
  card: "CreditCard",
  message: "MessageCircle",
  refresh: "RefreshCw",
  alert: "TriangleAlert",
};

function toPascalCase(name) {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export default function Icon({ name, size = 18, color = "currentColor", strokeWidth = 2, className, style, filled }) {
  const iconData = iconsData[ALIASES[name] ?? toPascalCase(name)];
  if (!iconData) {
    if (import.meta.env.DEV) console.warn(`Icon: no lucide export for name="${name}"`);
    return null;
  }
  return (
    <span className={className} style={{ display: "inline-flex", flex: "0 0 auto", ...style }} aria-hidden="true">
      <MorphIcon
        icon={iconData}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        spring="snappy"
        fill={filled ? color : "none"}
      />
    </span>
  );
}
