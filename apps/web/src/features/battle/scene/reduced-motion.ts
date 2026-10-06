/** True when the Player asks for reduced motion. The scene reads it once, when it mounts. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
