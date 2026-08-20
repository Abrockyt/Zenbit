// Short relative timestamps for feed, chat and activity rows. Clipped and
// factual, matching the design system's voice — "42m", not "42 minutes ago".
export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Absolute, for detail screens where precision matters more than brevity.
export function absoluteTime(ts) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
