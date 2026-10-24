import { describe, expect, it } from "vitest";

import { lossShare } from "./loss-reward";

describe("lossShare (ADR-0041)", () => {
  it("gives nothing when the enemy Heroes lost no HP", () => {
    expect(lossShare(10, { lost: 0, total: 30 })).toBe(0);
  });

  it("gives the full loss reward when the enemy Heroes lost all HP", () => {
    expect(lossShare(10, { lost: 30, total: 30 })).toBe(10);
  });

  it("gives the share of the lost HP, rounded down", () => {
    expect(lossShare(10, { lost: 15, total: 30 })).toBe(5);
    expect(lossShare(10, { lost: 10, total: 30 })).toBe(3);
    expect(lossShare(6, { lost: 29, total: 30 })).toBe(5);
  });

  it("keeps the lost HP from 0 to the total", () => {
    expect(lossShare(10, { lost: 45, total: 30 })).toBe(10);
    expect(lossShare(10, { lost: -5, total: 30 })).toBe(0);
  });

  it("gives nothing when the enemy Heroes have no HP", () => {
    expect(lossShare(10, { lost: 0, total: 0 })).toBe(0);
  });
});
