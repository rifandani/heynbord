import { useAtomValue } from "@effect/atom-react";
import { useSyncExternalStore } from "react";

import { reducedMotionAtom } from "@/features/settings/settings.atoms";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The Player choice, for the modules outside React that ask at the moment of an
 * event. `PlayScreen` keeps it in step with the Settings dialog.
 */
let playerChoice = false;

/** Sets the Player choice for the modules outside React. */
export const setReducedMotionPreference = (reduced: boolean): void => {
  playerChoice = reduced;
};

const systemQuery = (): MediaQueryList | null =>
  typeof window === "undefined" || !("matchMedia" in window)
    ? null
    : window.matchMedia(QUERY);

/**
 * True when the Player or the operating system asks for reduced motion. The
 * scene reads it once, when it mounts.
 */
export const prefersReducedMotion = (): boolean =>
  playerChoice || (systemQuery()?.matches ?? false);

const subscribe = (onChange: () => void) => {
  const query = systemQuery();
  if (!query) {
    return () => {
      // No media query: nothing to stop.
    };
  }
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const systemReducedMotion = (): boolean => systemQuery()?.matches ?? false;

/**
 * The reduced motion choice of the Player, together with the one of the
 * operating system. The scene and the screens follow a change at once.
 */
export const useReducedMotion = (): boolean => {
  const player = useAtomValue(reducedMotionAtom);
  const system = useSyncExternalStore(
    subscribe,
    systemReducedMotion,
    () => false
  );
  return player || system;
};
