import { describe, expect, it } from "vitest";

import {
  createFrameTimes,
  FRAME_SAMPLE_CAP,
  frameDistribution,
  percentile,
  recordFrameTime,
  resetFrameTimes,
} from "@/features/battle/scene/frame-times";

describe("percentile", () => {
  it("takes the nearest rank of a known input", () => {
    const durations = [4, 1, 3, 2];
    expect(percentile(durations, 0.5)).toBe(2);
    expect(percentile(durations, 0.75)).toBe(3);
    expect(percentile(durations, 0.95)).toBe(4);
    expect(percentile(durations, 0.99)).toBe(4);
    // It sorts a copy, so the caller keeps the sample order.
    expect(durations).toEqual([4, 1, 3, 2]);
  });

  it("answers 0 with no sample", () => {
    expect(percentile([], 0.95)).toBe(0);
  });

  it("clamps the rank to one real frame", () => {
    expect(percentile([7], 0.99)).toBe(7);
    expect(percentile([3, 1, 2], 0)).toBe(1);
    expect(percentile([3, 1, 2], 2)).toBe(3);
  });

  it("reads a typed buffer too", () => {
    expect(percentile(Float64Array.from([8, 4, 6]), 0.5)).toBe(6);
  });
});

describe("frameDistribution", () => {
  it("reports the distribution of the samples", () => {
    const times = createFrameTimes(4);
    for (const frameMs of [16, 17, 18, 19]) {
      recordFrameTime(times, frameMs);
    }
    expect(frameDistribution(times)).toEqual({
      // 1000 / 17.5 ms
      meanFps: 57.1,
      p50: 17,
      p95: 19,
      p99: 19,
      worst: 19,
      samples: 4,
      total: 4,
      cap: 4,
      wrapped: false,
    });
  });

  it("drops the oldest frame when the buffer wraps", () => {
    const times = createFrameTimes(3);
    for (const frameMs of [1, 2, 3, 4]) {
      recordFrameTime(times, frameMs);
    }
    // The ring wrote 4 over 1, so the buffer holds 2, 3 and 4.
    expect(frameDistribution(times)).toEqual({
      // 1000 / 3 ms
      meanFps: 333.3,
      p50: 3,
      p95: 4,
      p99: 4,
      worst: 4,
      samples: 3,
      total: 4,
      cap: 3,
      wrapped: true,
    });
  });

  it("reports zeros before the first frame", () => {
    expect(frameDistribution(createFrameTimes())).toEqual({
      meanFps: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      worst: 0,
      samples: 0,
      total: 0,
      cap: FRAME_SAMPLE_CAP,
      wrapped: false,
    });
  });

  it("does not divide by zero when every frame is 0 ms", () => {
    const times = createFrameTimes(2);
    recordFrameTime(times, 0);
    recordFrameTime(times, 0);
    expect(frameDistribution(times).meanFps).toBe(0);
  });

  it("clears every sample on reset", () => {
    const times = createFrameTimes(2);
    recordFrameTime(times, 10);
    recordFrameTime(times, 20);
    recordFrameTime(times, 30);
    resetFrameTimes(times);
    expect(frameDistribution(times)).toEqual({
      meanFps: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      worst: 0,
      samples: 0,
      total: 0,
      cap: 2,
      wrapped: false,
    });
    recordFrameTime(times, 10);
    expect(frameDistribution(times)).toMatchObject({
      samples: 1,
      total: 1,
      worst: 10,
      wrapped: false,
    });
  });
});
