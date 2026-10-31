import { describe, expect, it, vi } from "vitest";

import { modelProgress } from "@/features/battle/battle-model-progress";

describe("modelProgress", () => {
  it("is null while no preload runs", () => {
    modelProgress.end();
    expect(modelProgress.get()).toBeNull();
  });

  it("publishes the count as the preload steps", () => {
    const listener = vi.fn();
    const unsubscribe = modelProgress.subscribe(listener);
    modelProgress.begin(2);
    expect(modelProgress.get()).toEqual({ done: 0, total: 2 });
    modelProgress.step();
    expect(modelProgress.get()).toEqual({ done: 1, total: 2 });
    modelProgress.end();
    expect(modelProgress.get()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it("stops notifying a listener after it unsubscribes", () => {
    const listener = vi.fn();
    const unsubscribe = modelProgress.subscribe(listener);
    unsubscribe();
    modelProgress.begin(1);
    expect(listener).not.toHaveBeenCalled();
    modelProgress.end();
  });
});
