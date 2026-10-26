import { cn } from "cn";

/**
 * The color and the blur of every Heynbord scrim: a 55% black wash with a 2px
 * blur (DESIGN.md, Parchment dialog). The placement is separate, so the
 * catalog can show the scrim of a scene without opening a dialog.
 *
 * It lives apart from `game-dialog.tsx`, so a screen that needs only the scrim
 * (the Settings dialog, the Deck book) does not load the parchment dialog.
 */
export const GAME_SCRIM_TINT = "bg-black/55 backdrop-blur-[2px]";

/**
 * The scrim of every Heynbord overlay: the one place that says how the game
 * darkens what is behind a dialog. The Deck book, the Handbook, the Settings
 * dialog and the Stage Panel use it too, so only one scrim exists in the game.
 * A consumer that needs another layer or no scrim changes the class with `cn`.
 */
export const GAME_SCRIM = cn(
  "fixed inset-0 z-[60] flex items-center justify-center p-4 [@media(max-height:500px)]:p-2",
  GAME_SCRIM_TINT
);
