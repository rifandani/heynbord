import { useEffect } from "react";

/**
 * Sets an attribute on `body` while the component is in the page, for a CSS
 * rule that must reach content outside the component, such as a dialog or a
 * toast. Use it in place of `body:has()`: the browser checks that selector
 * after each DOM change, and can restyle the full page each time.
 */
export const useBodyMark = (name: `data-${string}`) => {
  useEffect(() => {
    document.body.toggleAttribute(name, true);
    return () => {
      document.body.toggleAttribute(name, false);
    };
  }, [name]);
};
