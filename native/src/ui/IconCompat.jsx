import { Feather as RealFeather, Ionicons } from "@expo/vector-icons";

/**
 * Drop-in replacement for @expo/vector-icons' Feather component — same
 * `name`/`size`/`color` props, same JSX everywhere it's used — but renders
 * Ionicons' outline set instead wherever there's a solid visual match.
 *
 * Feather reads as a generic cross-platform icon set; Ionicons' "-outline"
 * variants are drawn to match iOS's own system icon language (closely
 * mirroring SF Symbols' line weight and shapes), which is what actually
 * makes the app's icons read as "iOS" the way the real NativeTabs bar's SF
 * Symbols already do. SF Symbols themselves are iOS-only and can't be used
 * as a normal cross-platform RN icon component (only the tab bar's native
 * `sf=` prop can render them), so Ionicons' outline set is the closest
 * cross-platform stand-in — same look and shape language, works everywhere.
 *
 * Every call site keeps calling <Feather name="bell" .../> completely
 * unchanged; only the import source moved. A name with no entry below
 * falls back to the real Feather glyph instead of rendering blank, so a
 * gap in this table degrades gracefully rather than breaking anything.
 */
const MAP = {
  "alert-triangle": "warning-outline",
  "arrow-down": "arrow-down",
  "arrow-up": "arrow-up",
  "bar-chart-2": "bar-chart-outline",
  bell: "notifications-outline",
  bookmark: "bookmark-outline",
  briefcase: "briefcase-outline",
  camera: "camera-outline",
  check: "checkmark",
  "check-circle": "checkmark-circle-outline",
  "chevron-down": "chevron-down",
  "chevron-left": "chevron-back",
  "chevron-right": "chevron-forward",
  clock: "time-outline",
  "credit-card": "card-outline",
  "edit-2": "create-outline",
  "edit-3": "create-outline",
  edit: "create-outline",
  eye: "eye-outline",
  flag: "flag-outline",
  heart: "heart-outline",
  "help-circle": "help-circle-outline",
  home: "home-outline",
  lock: "lock-closed-outline",
  "log-out": "log-out-outline",
  mail: "mail-outline",
  maximize: "expand-outline",
  "message-circle": "chatbubble-outline",
  "message-square": "chatbox-outline",
  "more-horizontal": "ellipsis-horizontal",
  plus: "add",
  "plus-circle": "add-circle-outline",
  "refresh-cw": "refresh-outline",
  repeat: "repeat-outline",
  search: "search-outline",
  send: "send-outline",
  settings: "settings-outline",
  share: "share-outline",
  shield: "shield-checkmark-outline",
  slash: "ban-outline",
  smile: "happy-outline",
  star: "star-outline",
  "trending-up": "trending-up-outline",
  user: "person-outline",
  "user-x": "person-remove-outline",
  users: "people-outline",
  x: "close",
};

export function Feather({ name, ...props }) {
  const ionName = MAP[name];
  if (ionName) return <Ionicons name={ionName} {...props} />;
  return <RealFeather name={name} {...props} />;
}
