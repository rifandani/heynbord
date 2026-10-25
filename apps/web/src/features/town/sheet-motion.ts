import { cn } from "cn";

/** The size of the sheet when it starts in its source: about the size of an icon. */
const SHEET_FROM_SCALE = 0.16;

/** The tilt of the sheet when it starts, toward the center of the screen. */
const SHEET_FROM_TILT_DEG = 6;

const ORIGIN_PROPERTIES = [
  "--sheet-from-x",
  "--sheet-from-y",
  "--sheet-from-scale",
  "--sheet-from-rotate",
] as const;

/**
 * A parchment sheet (the Settings dialog, the Stage Panel) comes up out of
 * the control that opens it, along a curve: it lifts faster than it moves to
 * the side. The close plays it in reverse, faster. The scale of the sheet
 * would scale a side move in its own transform, so the Modal moves it to the
 * side, and the sheet in it (`group/sheet`) lifts, grows and tilts. With no
 * source, it zooms in from 95% at the center.
 */
export const SHEET_PATH_MOTION = cn(
  "motion-safe:data-[entering]:animate-[settings-sheet-x_460ms_cubic-bezier(0.55,0,0.15,1)_both]",
  "motion-safe:data-[exiting]:animate-[settings-sheet-x_260ms_cubic-bezier(0.55,0,0.15,1)_reverse_both]"
);

export const SHEET_MOTION = cn(
  "motion-safe:group-data-[entering]/sheet:animate-[settings-sheet-y_460ms_cubic-bezier(0.25,0.9,0.35,1)_both,settings-sheet-grow_460ms_cubic-bezier(0.45,0,0.15,1)_both]",
  "motion-safe:group-data-[exiting]/sheet:animate-[settings-sheet-y_260ms_cubic-bezier(0.25,0.9,0.35,1)_reverse_both,settings-sheet-grow_260ms_cubic-bezier(0.45,0,0.15,1)_reverse_both]"
);

/** The text of the sheet shows when the sheet is large enough to read. */
export const SHEET_INK_MOTION = cn(
  "motion-safe:group-data-[entering]/sheet:animate-[settings-sheet-ink_460ms_ease-out_both]",
  "motion-safe:group-data-[exiting]/sheet:animate-[settings-sheet-ink_260ms_ease-out_reverse_both]"
);

/** The scrim fades as the sheet goes back into its source. */
export const SHEET_SCRIM_MOTION =
  "fade-in animate-in duration-200 motion-safe:data-[exiting]:animate-[settings-scrim-out_260ms_ease-in_both] motion-reduce:animate-none";

/**
 * Puts the start of the sheet on the control that opens it. The overlay
 * covers the screen and the sheet is at its center, so the start is the
 * distance from the center of the overlay to the center of the control.
 */
export const placeSheetOrigin = (
  overlay: HTMLElement | null,
  source: Element | null
) => {
  if (!overlay || !source) {
    return;
  }
  const rect = source.getBoundingClientRect();
  const x = rect.left + rect.width / 2 - overlay.clientWidth / 2;
  const y = rect.top + rect.height / 2 - overlay.clientHeight / 2;
  overlay.style.setProperty("--sheet-from-x", `${x}px`);
  overlay.style.setProperty("--sheet-from-y", `${y}px`);
  overlay.style.setProperty("--sheet-from-scale", `${SHEET_FROM_SCALE}`);
  overlay.style.setProperty(
    "--sheet-from-rotate",
    `${-Math.sign(x) * SHEET_FROM_TILT_DEG}deg`
  );
};

/** The sheet goes at the center again: it zooms out to 95% and fades. */
export const clearSheetOrigin = (overlay: HTMLElement | null) => {
  for (const property of ORIGIN_PROPERTIES) {
    overlay?.style.removeProperty(property);
  }
};
