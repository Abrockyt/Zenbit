// Motion tokens mirrored from tokens/effects.css — framer-motion needs numbers,
// not CSS var strings, so this is the JS-side source of truth for durations/eases.
export const ease = {
  standard: [0.22, 0.61, 0.36, 1],
  emphasis: [0.16, 1, 0.3, 1],
};

export const dur = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
};

// Screen push/pop — fade + slight slide, no bounce.
export const screenTransition = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: dur.slow, ease: ease.standard },
};

// Bottom sheet enter/exit.
export const sheetTransition = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { duration: dur.slow, ease: ease.emphasis },
};

export const scrimTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: dur.base, ease: ease.standard },
};

// Tab / toggle / tint changes.
export const tapScale = { scale: 0.97 };

export const listStagger = {
  show: { transition: { staggerChildren: 0.035 } },
};

export const listItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.standard } },
};
