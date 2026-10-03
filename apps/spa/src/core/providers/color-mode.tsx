import { useColorMode, useMediaQuery } from "@reactuses/core";
import { ScriptOnce } from "@tanstack/react-router";

import { COLOR_MODE_STORAGE_KEY, COLOR_MODES } from "@/core/constants/global";

/**
 * The server cannot see the picked color mode (it lives in `localStorage`), so
 * this inline script sets the `<html>` class before first paint. Without it, an
 * SSR page flashes light before hydration in dark mode.
 */
export const ColorModeScript = () => (
  <ScriptOnce>
    {`try{var m=localStorage.getItem(${JSON.stringify(COLOR_MODE_STORAGE_KEY)});var d=m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"dark":"light")}catch(e){}`}
  </ScriptOnce>
);

/**
 * Sole owner of the color-mode class on `<html>` after hydration. The root
 * route never unmounts, so the class is never torn down by `useColorMode`'s
 * cleanup; everywhere else reads the persisted mode straight from storage.
 */
export const ColorModeSync = () => {
  // Explicit server default: `usePreferredDark` has none, so SSR warns.
  const preferredDark = useMediaQuery("(prefers-color-scheme: dark)", false);
  useColorMode({
    defaultValue: "auto",
    modes: COLOR_MODES,
    // `auto` has no class of its own - it borrows whichever one the system prefers
    modeClassNames: {
      auto: preferredDark ? "dark" : "light",
      dark: "dark",
      light: "light",
    },
    storageKey: COLOR_MODE_STORAGE_KEY,
  });
  return null;
};
