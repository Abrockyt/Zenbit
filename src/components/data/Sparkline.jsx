import { useId, useMemo } from "react";

// One chart style, per the design system: filled area, 1.75px pale mint line,
// gradient fading to zero. No axes, no gridlines, no tooltips, no dots.
export default function Sparkline({ points = [], width = 350, height = 140, tone = "up" }) {
  const id = useId();
  const stroke = tone === "down" ? "var(--down-500)" : "#CBE8DC";

  const path = useMemo(() => {
    if (!points.length) return { line: "", area: "" };
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const stepX = width / (points.length - 1 || 1);
    const coords = points.map((p, i) => {
      const x = i * stepX;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return [x, y];
    });
    const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [points, width, height]);

  if (!points.length) {
    return <div style={{ width, height }} />;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
          <stop offset="55%" stopColor={stroke} stopOpacity="0.1" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#grad-${id})`} stroke="none" />
      <path d={path.line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
