/**
 * BuildOra motion language.
 *
 * One source of truth for easing, duration, and reusable Framer Motion variants so
 * every screen feels coherent: fast, smooth, premium — never flashy. Components should
 * pair these with `useReducedMotion()` (Framer respects it automatically for transforms,
 * and the `<Reveal>`/`<Stagger>` wrappers in components/ui guard explicitly).
 */

// Premium easing curves.
export const ease = [0.22, 1, 0.36, 1]; // easeOutExpo-ish — confident settle
export const easeSoft = [0.16, 1, 0.3, 1];
export const easeInOut = [0.65, 0, 0.35, 1];

export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.5,
  slower: 0.8
};

// --- Core entrance variants ---------------------------------------------------
export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease } }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.slow, ease } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: duration.base, ease } }
};

export const fadeLeft = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: duration.slow, ease } }
};

export const fadeRight = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: duration.slow, ease } }
};

// --- Orchestration ------------------------------------------------------------
export const staggerContainer = (stagger = 0.07, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } }
});

// Standard whileInView config for scroll reveals.
export const inViewport = { once: true, margin: "0px 0px -12% 0px" };

// --- Page transitions ---------------------------------------------------------
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.base, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast, ease: easeInOut } }
};

// --- Interaction presets ------------------------------------------------------
export const hoverLift = {
  rest: { y: 0 },
  hover: { y: -4, transition: { duration: duration.base, ease } }
};

export const tapScale = { scale: 0.98 };

// Spring used for shared-layout indicators (tabs, nav pills).
export const layoutSpring = { type: "spring", stiffness: 380, damping: 32 };

// Convenience for one-off motion props.
export const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: inViewport,
  transition: { duration: duration.slow, ease, delay }
});
