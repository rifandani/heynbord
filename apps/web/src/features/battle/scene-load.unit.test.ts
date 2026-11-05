import { afterEach, describe, expect, it, vi } from "vitest";

import { loadShare, loadStep, sceneLoad } from "@/features/battle/scene-load";

const LOAD = {
  started: false,
  opened: 0,
  pending: 0,
  ready: false,
  reveal: 0,
};

afterEach(() => {
  sceneLoad.reset();
});

describe("sceneLoad", () => {
  it("counts the loads that hold the cover", () => {
    sceneLoad.start();
    const first = sceneLoad.hold();
    const second = sceneLoad.hold();
    expect(sceneLoad.get()).toMatchObject({ opened: 2, pending: 2 });
    first();
    expect(sceneLoad.get()).toMatchObject({ opened: 2, pending: 1 });
    second();
    expect(sceneLoad.get()).toMatchObject({ opened: 2, pending: 0 });
  });

  it("ends a load once, also when its release runs again", () => {
    const release = sceneLoad.hold();
    release();
    release();
    expect(sceneLoad.get().pending).toBe(0);
  });

  it("ignores a release from before a reset", () => {
    const release = sceneLoad.hold();
    sceneLoad.reset();
    const listener = vi.fn();
    const unsubscribe = sceneLoad.subscribe(listener);
    release();
    expect(listener).not.toHaveBeenCalled();
    expect(sceneLoad.get()).toMatchObject({ opened: 0, pending: 0 });
    unsubscribe();
  });

  it("counts each reveal, and a reset keeps the count", () => {
    const before = sceneLoad.get().reveal;
    sceneLoad.ready();
    sceneLoad.ready();
    expect(sceneLoad.get()).toMatchObject({
      ready: true,
      reveal: before + 1,
    });
    sceneLoad.reset();
    expect(sceneLoad.get()).toMatchObject({
      started: false,
      ready: false,
      reveal: before + 1,
    });
  });

  it("publishes `start` once", () => {
    const listener = vi.fn();
    const unsubscribe = sceneLoad.subscribe(listener);
    sceneLoad.start();
    sceneLoad.start();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(sceneLoad.get().started).toBe(true);
    unsubscribe();
  });
});

describe("loadShare", () => {
  it("starts with the Battle code", () => {
    expect(loadShare(null, LOAD)).toBeCloseTo(0.06);
  });

  it("grows with the Unit Model files", () => {
    const half = loadShare({ done: 3, total: 6 }, LOAD);
    const all = loadShare({ done: 6, total: 6 }, LOAD);
    expect(half).toBeGreaterThan(0.06);
    expect(all).toBeCloseTo(0.68);
    expect(half).toBeLessThan(all);
  });

  it("grows with the scene loads after the stage starts", () => {
    const started = { ...LOAD, started: true };
    expect(loadShare(null, started)).toBeCloseTo(0.68);
    expect(loadShare(null, { ...started, opened: 4, pending: 2 })).toBeCloseTo(
      0.82
    );
    expect(loadShare(null, { ...started, opened: 4, pending: 0 })).toBeCloseTo(
      0.96
    );
  });

  it("is full when the scene is ready", () => {
    expect(loadShare(null, { ...LOAD, ready: true })).toBe(1);
  });
});

describe("loadStep", () => {
  it("names the Units, then the Board, then Ready", () => {
    expect(loadStep(LOAD)).toBe("units");
    expect(loadStep({ ...LOAD, started: true })).toBe("board");
    expect(loadStep({ ...LOAD, started: true, ready: true })).toBe("ready");
  });
});
