import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { focusables, nextFocusable } from "@/core/input/focus";

/** Node has no layout. These controls give the focus rules explicit boxes. */
class Control {
  tabIndex = 0;
  disabled = false;
  ariaDisabled = false;
  hidden = false;
  inert = false;
  ariaHidden = false;
  parentElement: Control | null = null;
  readonly style = { display: "block", visibility: "visible" };
  boxes = [{ width: 20, height: 20 }];

  readonly matches = () => this.disabled || this.ariaDisabled;
  readonly closest = (): Control | null =>
    this.hidden || this.inert || this.ariaHidden
      ? this
      : (this.parentElement?.closest() ?? null);
  readonly getClientRects = () => this.boxes;
}

const element = (control: Control): HTMLElement =>
  // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- SAFETY: this Node fixture implements all DOM reads of the focus module; E2E covers the browser.
  control as unknown as HTMLElement;
const scope = (...controls: readonly Control[]): Element =>
  // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- SAFETY: the Node fixture returns only its own subtree; E2E covers real DOM scopes.
  ({ querySelectorAll: () => controls.map(element) }) as unknown as Element;

describe("scoped focus", () => {
  beforeAll(() => {
    vi.stubGlobal("getComputedStyle", (control: Control) => control.style);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("keeps DOM order forward and backward, and wraps at both ends", () => {
    const first = new Control();
    const middle = new Control();
    const last = new Control();
    const root = scope(first, middle, last);

    expect(focusables(root)).toEqual([first, middle, last]);
    expect(nextFocusable(root, element(first), 1)).toBe(middle);
    expect(nextFocusable(root, element(last), -1)).toBe(middle);
    expect(nextFocusable(root, element(last), 1)).toBe(first);
    expect(nextFocusable(root, element(first), -1)).toBe(last);
  });

  it("enters from outside the dialog at the first or last control", () => {
    const outside = new Control();
    const first = new Control();
    const last = new Control();
    const dialog = scope(first, last);
    // oxlint-disable-next-line anti-slop/no-chained-type-assertions -- SAFETY: Document and Element use the same querySelectorAll fixture boundary.
    const document = scope(outside, first, last) as unknown as Document;

    expect(focusables(document)).toEqual([outside, first, last]);
    expect(focusables(dialog)).not.toContain(outside);
    expect(nextFocusable(dialog, element(outside), 1)).toBe(first);
    expect(nextFocusable(dialog, element(outside), -1)).toBe(last);
    expect(nextFocusable(dialog, null, 1)).toBe(first);
    expect(nextFocusable(dialog, null, -1)).toBe(last);
  });

  it("skips native disabled, aria-disabled and negative tabindex controls", () => {
    const disabled = new Control();
    disabled.disabled = true;
    const ariaDisabled = new Control();
    ariaDisabled.ariaDisabled = true;
    const excluded = new Control();
    excluded.tabIndex = -1;
    const enabled = new Control();

    expect(
      focusables(scope(disabled, ariaDisabled, excluded, enabled))
    ).toEqual([enabled]);
  });

  it("skips hidden, aria-hidden and inert subtrees", () => {
    for (const attribute of ["hidden", "ariaHidden", "inert"] as const) {
      const parent = new Control();
      parent[attribute] = true;
      const child = new Control();
      child.parentElement = parent;
      const visible = new Control();

      expect(focusables(scope(parent, child, visible))).toEqual([visible]);
    }
  });

  it("skips display:none and hidden or collapsed visibility on ancestors", () => {
    for (const [property, value] of [
      ["display", "none"],
      ["visibility", "hidden"],
      ["visibility", "collapse"],
    ] as const) {
      const parent = new Control();
      parent.style[property] = value;
      const child = new Control();
      child.parentElement = parent;
      const visible = new Control();

      expect(focusables(scope(parent, child, visible))).toEqual([visible]);
    }
  });

  it("skips empty, zero-width and zero-height boxes", () => {
    const empty = new Control();
    empty.boxes = [];
    const flat = new Control();
    flat.boxes = [{ width: 20, height: 0 }];
    const narrow = new Control();
    narrow.boxes = [{ width: 0, height: 20 }];
    const visible = new Control();

    expect(focusables(scope(empty, flat, narrow, visible))).toEqual([visible]);
  });

  it("puts positive tabindex controls first and keeps equal values in DOM order", () => {
    const zero = new Control();
    const second = new Control();
    second.tabIndex = 2;
    const first = new Control();
    first.tabIndex = 1;
    const same = new Control();
    same.tabIndex = 1;

    expect(focusables(scope(zero, second, first, same))).toEqual([
      first,
      same,
      second,
      zero,
    ]);
  });

  it("returns null only when no control is available", () => {
    const only = new Control();
    const root = scope(only);
    expect(nextFocusable(root, element(only), 1)).toBe(only);
    expect(nextFocusable(root, element(only), -1)).toBe(only);
    only.disabled = true;
    expect(nextFocusable(root, null, 1)).toBeNull();
    expect(nextFocusable(scope(), null, -1)).toBeNull();
  });
});
