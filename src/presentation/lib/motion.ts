/**
 * Motion presets — the ONLY place easing curves and durations are written for
 * motion/react code. Feature components import presets; they never hand-write
 * curves (MASTER §5, Emil Kowalski standards).
 *
 * CSS transitions keep using the tokens in globals.css
 * (--motion-*, --ease-out/--ease-in-out/--ease-drawer).
 */

/** Enter/exit — confident arrival. cubic-bezier(0.23, 1, 0.32, 1). */
export const easeOut = [0.23, 1, 0.32, 1] as const;
/** On-screen move/morph. cubic-bezier(0.77, 0, 0.175, 1). */
export const easeInOut = [0.77, 0, 0.175, 1] as const;

export const durations = {
  press: 0.14,
  fast: 0.15,
  base: 0.2,
  modal: 0.25,
  slow: 0.3,
  drawer: 0.5,
} as const;

/** Mount entrance: fade + 12px rise. For occasional surfaces, never 100+/day chrome. */
export const enter = {
  initial: { opacity: 0, transform: "translateY(12px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: durations.slow, ease: easeOut },
} as const;

/** Scroll-into-view reveal (marketing surfaces only — never the app shell). */
export const reveal = {
  initial: { opacity: 0, transform: "translateY(16px)" },
  whileInView: { opacity: 1, transform: "translateY(0px)" },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: durations.slow, ease: easeOut },
} as const;

/** List container + item pair: 50ms stagger, 8px rise, never blocking input. */
export const staggerList = {
  container: {
    initial: "hidden",
    animate: "show",
    variants: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  },
  item: {
    variants: {
      hidden: { opacity: 0, transform: "translateY(8px)" },
      show: {
        opacity: 1,
        transform: "translateY(0px)",
        transition: { duration: durations.base, ease: easeOut },
      },
    },
  },
} as const;

/** Dialog panel: 250ms, scale from 0.96 (never scale(0)), backdrop shares timing. */
export const modal = {
  initial: { opacity: 0, transform: "scale(0.96)" },
  animate: { opacity: 1, transform: "scale(1)" },
  exit: { opacity: 0, transform: "scale(0.98)" },
  transition: { duration: durations.modal, ease: easeOut },
} as const;

/** Bottom sheet / drawer: % translate, drawer curve. */
export const drawer = {
  initial: { transform: "translateY(100%)" },
  animate: { transform: "translateY(0%)" },
  exit: { transform: "translateY(100%)" },
  transition: { duration: durations.drawer, ease: [0.32, 0.72, 0, 1] },
} as const;

/** Spring for genuinely spatial gestures only — fintech default is bounce 0. */
export const spring = { type: "spring", duration: 0.5, bounce: 0 } as const;
