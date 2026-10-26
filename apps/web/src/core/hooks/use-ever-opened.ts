import { useState } from "react";

/**
 * True after `open` was true at least once, and stays true. It keeps a lazy
 * dialog in the page after its first open, so it can play its close animation
 * without loading its chunk on the first render (issue 139).
 *
 * It adjusts state during render, the React pattern for derived state that
 * must not lose a value.
 */
export const useEverOpened = (open: boolean): boolean => {
  const [opened, setOpened] = useState(open);
  if (open && !opened) {
    setOpened(true);
  }
  return opened;
};
