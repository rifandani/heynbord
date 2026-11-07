import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("globals.css", import.meta.url), "utf-8");

describe("globals.css", () => {
  it("has no `body:has()` rule, which restyles the page on each DOM change", () => {
    // `useBodyMark` gives the same condition with no cost.
    expect(css.match(/^(?:html|body|:root):has\(/gmu)).toBeNull();
  });
});
