import { describe, expect, it } from "vitest";

import { toasterProps } from "@/features/toast/toast";

describe("toasterProps", () => {
  it("uses the one game theme", () => {
    expect(toasterProps.theme).toBe("dark");
  });

  it("puts the toast on the parchment overlay", () => {
    expect(toasterProps.style).toMatchObject({
      "--normal-bg": "var(--color-overlay)",
      "--normal-text": "var(--color-overlay-fg)",
    });
  });
});
