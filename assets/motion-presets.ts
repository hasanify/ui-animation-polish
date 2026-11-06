/**
 * ui-animation-polish — Motion (Framer Motion) presets.
 *
 * Works with `motion/react` (Motion 11+) or `framer-motion` (v10+).
 * Durations are seconds here, because Motion expects seconds.
 *
 * Reduced motion: presets cannot call hooks. Wrap the tree with
 * <MotionConfig reducedMotion="user">, or branch on useReducedMotion()
 * and swap the travel/scale variants for a pure opacity fade.
 */

import type { Transition, Variants } from "motion/react";

export const ease = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  in: [0.55, 0, 1, 0.45] as const,
};

export const duration = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.25,
  page: 0.4,
  exit: 0.16,
};

/** Critically damped spring — no visible overshoot (rule 13). */
export const settle: Transition = { type: "spring", stiffness: 400, damping: 40, bounce: 0 };

/** Press feedback. Pass to whileTap on buttons, cards and rows (rule 4). */
export const press = { scale: 0.97 } as const;

/**
 * Popover/menu anchored to a trigger. Origin must point at the trigger;
 * override it from your positioning library when available (rule 11).
 */
export function popover(origin = "top right") {
  return {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    style: { transformOrigin: origin },
    transition: { duration: duration.base, ease: ease.out },
  };
}

/** Modal/dialog: a gentler scale, still no bounce (rule 10). */
export const modal = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 8 },
  transition: { duration: duration.slow, ease: ease.out },
};

/** Toast: enters with conviction, exits 20% faster (rule 15). */
export const toast = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
  transition: { duration: duration.base, ease: ease.out },
  exitTransition: { duration: duration.exit, ease: ease.in },
};

/**
 * List cascade. Cap the staggered children at ~10; show the rest together (rule 3).
 * <motion.ul variants={listContainer} initial="hidden" animate="show">
 *   <motion.li variants={listItem} />
 */
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
};

/** Badge/counter/status dot arrives just after its parent (rule 6). */
export const detailDelayed: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: duration.fast, delay: 0.05, ease: ease.out } },
};

/** Single confirmation pulse — never loop it (rule 8). */
export const successPulse = {
  scale: [1, 1.06, 1],
  transition: { duration: 0.3, ease: ease.out },
};

/** Icon swap: scale + opacity + a touch of blur, overlapping (rule 18). */
export const iconSwap: Variants = {
  initial: { opacity: 0, scale: 0.6, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.18, ease: ease.out } },
  exit: { opacity: 0, scale: 0.6, filter: "blur(4px)", transition: { duration: 0.14, ease: ease.in } },
};

/**
 * iOS-style rubber band for drag past a limit (rule 19).
 * x = distance past the bound, dimension = max visible travel, tension = 0.55.
 */
export function rubberBand(x: number, dimension: number, tension = 0.55) {
  return (1 - 1 / ((x * tension) / dimension + 1)) * dimension;
}

/** Motion props for a draggable sheet/carousel: 1:1 while held, spring on release (rule 14). */
export const dragPhysics = {
  drag: true,
  dragElastic: 0.2,
  dragMomentum: false,
  transition: settle,
} as const;
