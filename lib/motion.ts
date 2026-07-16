/**
 * ArtEffect's deliberately small motion vocabulary. Keeping these values in
 * one place prevents individual pages from drifting into different rhythms.
 */
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const sectionReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.65, ease: MOTION_EASE }
} as const;

export const heroReveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.72, ease: MOTION_EASE }
} as const;
