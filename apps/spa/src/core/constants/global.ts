import metadata from "../../../package.json" with { type: "json" };

export const SERVICE_NAME = metadata.name;

/** Color schema the user can pick - `auto` follows the OS preference. */
export type ColorMode = "auto" | "light" | "dark";
/** Modes passed to `useColorMode`, in the order its cycle callback walks them. */
export const COLOR_MODES: ColorMode[] = ["auto", "light", "dark"];
/** Key the picked color mode is persisted under in `localStorage`. */
export const COLOR_MODE_STORAGE_KEY = "app-color-mode";
