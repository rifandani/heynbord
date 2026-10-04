import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { SoundName } from "@/features/battle/battle-audio";
import {
  playSound,
  setSoundEnabled,
  unlockAudio,
} from "@/features/battle/battle-audio";

/** The smallest Web Audio fake that the sound code needs. */
const fakeParam = () => ({
  exponentialRampToValueAtTime: vi.fn(),
  setValueAtTime: vi.fn(),
  value: 0,
});

const fakeNode = () => ({
  buffer: null,
  connect: <T>(next: T): T => next,
  frequency: fakeParam(),
  gain: fakeParam(),
  start: vi.fn(),
  stop: vi.fn(),
  type: "",
});

const counter = { oscillators: 0 };

const fakeBuffer = (_channels: number, length: number) => ({
  getChannelData: () => new Float32Array(length),
});

const fakeOscillator = () => {
  counter.oscillators += 1;
  return fakeNode();
};

/** `new AudioContext()` gives this fake. Its members are fields, not methods. */
class FakeAudioContext {
  state = "suspended";
  readonly currentTime = 0;
  readonly sampleRate = 1000;
  readonly destination = fakeNode();
  readonly createGain = fakeNode;
  readonly createBiquadFilter = fakeNode;
  readonly createBufferSource = fakeNode;
  readonly createBuffer = fakeBuffer;
  readonly createOscillator = fakeOscillator;
  readonly resume = () => {
    this.state = "running";
    return Promise.resolve();
  };
}

const SOUNDS: readonly SoundName[] = [
  "select",
  "summon",
  "step",
  "melee",
  "ranged",
  "hit",
  "crit",
  "block",
  "fire",
  "frost",
  "holy",
  "death",
  "heal",
  "ready",
  "turn",
  "victory",
  "defeat",
];

describe("playSound", () => {
  beforeAll(() => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("is quiet before a user gesture unlocks the audio", () => {
    playSound("hit");
    expect(counter.oscillators).toBe(0);
  });

  it("plays every Battle sound after unlock, and respects the off switch and the gap", () => {
    unlockAudio();
    unlockAudio();
    for (const name of SOUNDS) {
      playSound(name);
    }
    const played = counter.oscillators;
    expect(played).toBeGreaterThan(0);
    // The same sound again in the same instant is dropped.
    playSound("hit");
    expect(counter.oscillators).toBe(played);
    setSoundEnabled(false);
    playSound("victory", 0);
    expect(counter.oscillators).toBe(played);
    setSoundEnabled(true);
  });
});
