/**
 * The helpers that tell Player input from typing and from dialog input. They
 * live apart from the Battle UI, because the Play screen reads them too.
 */

/** True when the event target takes text, so a key is not a game key. */
export const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** True while a dialog is open, for example the Deck book over a screen. */
export const dialogOpen = (): boolean =>
  document.querySelector('[role="dialog"]') !== null;

/** A key in an open dialog (the Abandon confirm, the result) is for that dialog. */
export const inDialog = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('[role="dialog"]') !== null;
