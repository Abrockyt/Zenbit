import { useEffect, useRef } from "react";
import liquidGlass from "./liquid-glass.js";

// React wrapper around the vendored liquid-glass.js (MIT, deepika-builds/liquid-glass)
// — real SVG-displacement refraction on Chromium, frosted-blur fallback on
// Safari/Firefox. Used on the tab bar and screen headers so scrolling content
// visibly bends at the glass edge instead of just sitting under a flat tint.
export function useLiquidGlass(options) {
  const ref = useRef(null);
  const opts = JSON.stringify(options ?? {});

  useEffect(() => {
    if (!ref.current) return undefined;
    const glass = liquidGlass(ref.current, JSON.parse(opts));
    return () => glass.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts]);

  return ref;
}
