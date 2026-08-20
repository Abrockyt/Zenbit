import { MorphIcon } from "morphicons/react";
import { Lock, LockOpen } from "lucide"; // icon *data*, not lucide-react components — morphicons needs the data package

// Two-state icon that actually morphs between shapes with spring physics,
// rather than swapping one static glyph for another. Used where a control
// toggles a real before/after state (card freeze/unfreeze) — the motion
// itself communicates the state change, not just the end icon.
export default function MorphIconGlyph({ locked, size = 22, color = "#fff" }) {
  return <MorphIcon icon={locked ? Lock : LockOpen} size={size} color={color} strokeWidth={2} spring="snappy" />;
}
