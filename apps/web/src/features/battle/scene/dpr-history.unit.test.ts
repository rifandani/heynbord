import { describe, expect, it } from "vitest";

import {
  createDprHistory,
  dprReport,
  recordDprChange,
  resetDprChanges,
} from "@/features/battle/scene/dpr-history";

describe("dpr history", () => {
  it("records each change with its time", () => {
    const history = createDprHistory(3, 2);
    recordDprChange(history, 1, 1200);
    recordDprChange(history, 2, 2600);
    expect(dprReport(history)).toEqual({
      native: 3,
      current: 2,
      changes: [
        { at: 1200, from: 2, to: 1 },
        { at: 2600, from: 1, to: 2 },
      ],
    });
  });

  it("ignores the same value again", () => {
    const history = createDprHistory(2, 2);
    recordDprChange(history, 2, 500);
    expect(history.changes).toEqual([]);
  });

  it("clears the changes and keeps the current DPR as the baseline", () => {
    const history = createDprHistory(3, 2);
    recordDprChange(history, 1, 500);
    resetDprChanges(history);
    expect(dprReport(history)).toEqual({
      native: 3,
      current: 1,
      changes: [],
    });
    recordDprChange(history, 2, 50);
    expect(history.changes).toEqual([{ at: 50, from: 1, to: 2 }]);
  });

  it("returns a copy that the caller cannot change", () => {
    const history = createDprHistory(2, 2);
    recordDprChange(history, 1, 100);
    const report = dprReport(history);
    expect(report.changes).not.toBe(history.changes);
    expect(report.changes[0]).not.toBe(history.changes[0]);
  });
});
