import { useAtomValue } from "@effect/atom-react";
import { useSyncExternalStore } from "react";

import { TOWN_BAR_HEIGHT } from "@/features/town/town";
import { townBarCollapsedAtom } from "@/features/town/town.atoms";

const SHORT_SCREEN = "(max-height: 500px)";

/** The minimum of `max(4px, env(safe-area-inset-bottom))` in the styles. */
const MIN_INSET = 4;

interface BarViewport {
  readonly short: boolean;
  /** The bottom safe-area inset, with the 4px minimum of the shelf. */
  readonly inset: number;
  /** The bottom safe-area inset alone, for the stowed bar, which has no shelf. */
  readonly rawInset: number;
}

let probe: HTMLDivElement | null = null;
let safeInset: number | null = null;

/** Adds the hidden element that reports the bottom safe-area inset. */
const createProbe = (): HTMLDivElement => {
  const element = document.createElement("div");
  element.style.cssText =
    "position:fixed;bottom:0;left:0;height:0;width:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom)";
  document.body.append(element);
  return element;
};

/** The inset that the probe reports, or 0 when it is not a number. */
const insetOf = (element: HTMLDivElement): number => {
  const value = Number(getComputedStyle(element).paddingBottom);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

/** The safe-area inset at the bottom, as the CSS shelf reserves it. */
const readSafeInset = (): number => {
  if (safeInset !== null) {
    return safeInset;
  }
  if (typeof document === "undefined") {
    return 0;
  }
  probe ??= createProbe();
  safeInset = insetOf(probe);
  return safeInset;
};

let lastKey = "";
let snapshot: BarViewport = {
  short: false,
  inset: MIN_INSET,
  rawInset: 0,
};

const getSnapshot = (): BarViewport => {
  const short = window.matchMedia(SHORT_SCREEN).matches;
  const rawInset = readSafeInset();
  const inset = Math.max(MIN_INSET, rawInset);
  const key = `${short ? 1 : 0}:${inset}:${rawInset}`;
  if (key !== lastKey) {
    lastKey = key;
    snapshot = { short, inset, rawInset };
  }
  return snapshot;
};

const getServerSnapshot = (): BarViewport => snapshot;

const subscribe = (onChange: () => void) => {
  const update = () => {
    safeInset = null;
    onChange();
  };
  const media = window.matchMedia(SHORT_SCREEN);
  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);
  media.addEventListener("change", update);
  return () => {
    window.removeEventListener("resize", update);
    window.removeEventListener("orientationchange", update);
    media.removeEventListener("change", update);
  };
};

/**
 * The height of the Town Bar for the screens that measure in JavaScript (the
 * Campaign map), including the safe-area inset. It reads the target size, not
 * the height in the middle of the stow motion, so the map fits its final frame
 * at once and the moving shelf reveals it. A stowed bar has no shelf, so only
 * the safe-area inset is left.
 */
export const useTownBarHeight = (): number => {
  const collapsed = useAtomValue(townBarCollapsedAtom);
  const viewport = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  if (collapsed) {
    return TOWN_BAR_HEIGHT.collapsed + viewport.rawInset;
  }
  const base = viewport.short
    ? TOWN_BAR_HEIGHT.expandedShort
    : TOWN_BAR_HEIGHT.expanded;
  return base + viewport.inset;
};
