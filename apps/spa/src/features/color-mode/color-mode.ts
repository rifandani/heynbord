import { Schema } from "effect";

/** Color mode the user can pick - `auto` follows the OS preference. */
export const ColorMode = Schema.Literals(["auto", "light", "dark"]);
export type ColorMode = typeof ColorMode.Type;

/** A color mode with `auto` resolved: the class on `<html>`. */
export type AppliedColorMode = Exclude<ColorMode, "auto">;

/** Key the picked color mode is persisted under in `localStorage`, as JSON. */
export const COLOR_MODE_STORAGE_KEY = "app-color-mode";
