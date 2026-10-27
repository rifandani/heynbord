/** The focus order within the document or an open dialog (web ADR-0015). */

const FOCUSABLE =
  'a[href], area[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]';

const available = (element: HTMLElement): boolean => {
  if (
    element.tabIndex < 0 ||
    element.matches(':disabled, [aria-disabled="true"]') ||
    element.closest('[hidden], [inert], [aria-hidden="true"]')
  ) {
    return false;
  }
  for (
    let parent: Element | null = element;
    parent;
    parent = parent.parentElement
  ) {
    const style = getComputedStyle(parent);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse"
    ) {
      return false;
    }
  }
  return [...element.getClientRects()].some(
    (rect) => rect.width > 0 && rect.height > 0
  );
};

/** Available controls in Tab order. A positive tabindex comes before zero. */
export const focusables = (scope: Document | Element): readonly HTMLElement[] =>
  [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter(available)
    .toSorted((a, b) => {
      if (a.tabIndex === b.tabIndex) {
        return 0;
      }
      if (a.tabIndex === 0) {
        return 1;
      }
      if (b.tabIndex === 0) {
        return -1;
      }
      return a.tabIndex - b.tabIndex;
    });

/** Wrap within the scope. Focus outside it enters at the first or last control. */
export const nextFocusable = (
  scope: Document | Element,
  current: Element | null,
  step: -1 | 1
): HTMLElement | null => {
  const elements = focusables(scope);
  const order: readonly Element[] = elements;
  const index = current ? order.indexOf(current) : -1;
  const next =
    index === -1
      ? step === 1
        ? 0
        : elements.length - 1
      : (index + step + elements.length) % elements.length;
  return elements[next] ?? null;
};
