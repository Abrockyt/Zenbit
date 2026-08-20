import Icon from "./Icon";

// Deterministic accent per person so the same handle always gets the same
// color and a feed of avatars doesn't read as a wall of identical grey
// circles — restrained to the system's own signal/info/warn hues.
const RINGS = [
  ["#3ADE7E", "#132a20"],
  ["#5B8CFF", "#111a30"],
  ["#F5B544", "#2e2312"],
  ["#F2504B", "#2b1414"],
  ["#8B7CF6", "#1c1730"],
  ["#22C5D9", "#0f2426"],
];

function hueFor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return RINGS[h % RINGS.length];
}

export default function Avatar({ size = 38, src, initials, seed, style }) {
  const [accent, base] = hueFor(seed || initials || "zenbit");
  const uiAvatarUrl = src || `https://ui-avatars.com/api/?name=${initials || "ZB"}&background=${base.replace('#','')}&color=fff&rounded=true&bold=true`;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "var(--surface-raised)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flex: "0 0 auto",
        ...style,
      }}
    >
      <img src={uiAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </span>
  );
}
