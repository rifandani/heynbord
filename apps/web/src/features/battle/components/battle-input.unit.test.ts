import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  dialogOpen,
  inDialog,
  isTyping,
} from "@/features/battle/components/battle-input";

class FakeElement extends EventTarget {
  readonly closest = vi.fn<(selector: string) => object | null>(() => null);
  isContentEditable = false;
  tagName = "DIV";
}

const querySelector = vi.fn<(selector: string) => object | null>(() => null);

describe("Battle input helpers", () => {
  beforeAll(() => {
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("Element", FakeElement);
    vi.stubGlobal("document", { querySelector });
  });

  beforeEach(() => {
    querySelector.mockReset();
    querySelector.mockReturnValue(null);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("is not typing for no target, a pointer target or an unknown tag", () => {
    expect(isTyping(null)).toBe(false);
    expect(isTyping(new EventTarget())).toBe(false);
    expect(isTyping(new FakeElement())).toBe(false);
  });

  it("is typing for a text field or a content-editable element", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
      const field = new FakeElement();
      field.tagName = tagName;
      expect(isTyping(field)).toBe(true);
    }
    const editable = new FakeElement();
    editable.isContentEditable = true;
    expect(isTyping(editable)).toBe(true);
  });

  it("reports an open dialog", () => {
    expect(dialogOpen()).toBe(false);
    querySelector.mockReturnValue(new FakeElement());
    expect(dialogOpen()).toBe(true);
    expect(querySelector).toHaveBeenCalledWith('[role="dialog"]');
  });

  it("knows that a key inside a dialog belongs to the dialog", () => {
    const target = new FakeElement();
    expect(inDialog(target)).toBe(false);
    target.closest.mockReturnValue(new FakeElement());
    expect(inDialog(target)).toBe(true);
    expect(target.closest).toHaveBeenCalledWith('[role="dialog"]');
  });

  it("is not in a dialog for no target or a target that is not an element", () => {
    expect(inDialog(null)).toBe(false);
    expect(inDialog(new EventTarget())).toBe(false);
  });
});
