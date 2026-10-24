import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { SoundName } from "@/features/battle/battle-audio";
import {
  playSound,
  setSoundEnabled,
  setSoundVolume,
  unlockAudio,
} from "@/features/battle/battle-audio";

/** The smallest Web Audio fake that the sound code needs. */
const fakeParam = () => ({
  exponentialRampToValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
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

type FakeNode = ReturnType<typeof fakeNode>;

/** The gain nodes that the fake context made. The first one is the master gain. */
const gains: FakeNode[] = [];

/** The nodes that the fake context made: tones are oscillators, noise is a buffer source. */
const made = { oscillators: 0, noises: 0 };

const fakeBuffer = (_channels: number, length: number) => ({
  getChannelData: () => new Float32Array(length),
});

const fakeOscillator = () => {
  made.oscillators += 1;
  return fakeNode();
};

const fakeNoise = () => {
  made.noises += 1;
  return fakeNode();
};

const fakeGain = () => {
  const node = fakeNode();
  gains.push(node);
  return node;
};

/** Each fake context that `new AudioContext()` made. */
const contexts: { state: string; currentTime: number }[] = [];

/** `new AudioContext()` gives this fake. Its members are fields, not methods. */
class FakeAudioContext {
  state = "suspended";
  /** The time in seconds. A test moves it forward. */
  currentTime = 0;
  readonly sampleRate = 1000;
  readonly destination = fakeNode();
  readonly createGain = fakeGain;
  readonly createBiquadFilter = fakeNode;
  readonly createBufferSource = fakeNoise;
  readonly createBuffer = fakeBuffer;
  readonly createOscillator = fakeOscillator;
  readonly resume = () => {
    this.state = "running";
    return Promise.resolve();
  };

  constructor() {
    contexts.push(this);
  }
}

/** The fake context of the module. */
const created = () => {
  const [context] = contexts;
  if (!context) {
    throw new Error("No audio context");
  }
  return context;
};

/** The tones and the noises that one sound makes. */
const nodesOf = (name: SoundName) => {
  const before = { oscillators: made.oscillators, noises: made.noises };
  playSound(name, 0);
  return {
    tones: made.oscillators - before.oscillators,
    noises: made.noises - before.noises,
  };
};

/** Each sound, with the count of its tones and noises. */
const SOUNDS: Readonly<
  Record<SoundName, { readonly tones: number; readonly noises: number }>
> = {
  select: { tones: 1, noises: 0 },
  summon: { tones: 2, noises: 0 },
  cast: { tones: 2, noises: 1 },
  step: { tones: 0, noises: 1 },
  melee: { tones: 0, noises: 1 },
  ranged: { tones: 1, noises: 0 },
  hit: { tones: 1, noises: 1 },
  crit: { tones: 1, noises: 1 },
  block: { tones: 1, noises: 0 },
  fire: { tones: 0, noises: 1 },
  frost: { tones: 1, noises: 0 },
  holy: { tones: 2, noises: 0 },
  lightning: { tones: 1, noises: 1 },
  death: { tones: 1, noises: 0 },
  heal: { tones: 1, noises: 0 },
  ready: { tones: 1, noises: 0 },
  turn: { tones: 2, noises: 0 },
  victory: { tones: 4, noises: 0 },
  defeat: { tones: 4, noises: 0 },
  bossDefeated: { tones: 1, noises: 1 },
  frontMoved: { tones: 1, noises: 1 },
  bossRule: { tones: 2, noises: 0 },
  packTear: { tones: 0, noises: 2 },
  cardFlip: { tones: 0, noises: 1 },
  revealRare: { tones: 2, noises: 0 },
  revealEpic: { tones: 4, noises: 0 },
  revealLegendary: { tones: 7, noises: 1 },
  anvil: { tones: 4, noises: 1 },
  extract: { tones: 2, noises: 1 },
  essenceIn: { tones: 2, noises: 0 },
  gearUp: { tones: 3, noises: 1 },
  claim: { tones: 2, noises: 0 },
};

const isSoundName = (name: string): name is SoundName => name in SOUNDS;

describe("unlockAudio with no Web Audio", () => {
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("makes no audio context when there is no window or no AudioContext", () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    unlockAudio();
    vi.stubGlobal("window", {});
    unlockAudio();
    expect(contexts).toHaveLength(0);
  });
});

describe("playSound", () => {
  beforeAll(() => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
  });

  afterAll(() => {
    // Other test files share this module: stop the fake context, so that no
    // later sound plays, and set the switch and the volume back.
    for (const context of contexts) {
      context.state = "closed";
    }
    setSoundEnabled(true);
    setSoundVolume(100);
    vi.unstubAllGlobals();
  });

  it("is quiet before a user gesture unlocks the audio", () => {
    // A volume change before the unlock only sets the start volume.
    setSoundVolume(50);
    playSound("hit");
    expect(made.oscillators).toBe(0);
    expect(made.noises).toBe(0);
  });

  it("makes one context, with the master gain on the square of the volume", () => {
    unlockAudio();
    unlockAudio();
    expect(contexts).toHaveLength(1);
    expect(created().state).toBe("running");
    const [master] = gains;
    expect(master?.gain.value).toBeCloseTo(0.35 * 0.5 ** 2);
    setSoundVolume(150);
    expect(master?.gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.35,
      0,
      0.02
    );
    setSoundVolume(-10);
    expect(master?.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.02);
    setSoundVolume(100);
  });

  it("makes the tones and the noises of each sound", () => {
    for (const [name, nodes] of Object.entries(SOUNDS)) {
      if (!isSoundName(name)) {
        throw new Error(`Not a sound: ${name}`);
      }
      expect({ name, ...nodesOf(name) }).toEqual({ name, ...nodes });
    }
  });

  it("plays the same sound at most once in the gap", () => {
    const context = created();
    context.currentTime = 10;
    expect(nodesOf("select").tones).toBe(1);
    // The same sound again in the same instant is dropped by the default gap.
    const played = made.oscillators;
    playSound("select");
    expect(made.oscillators).toBe(played);
    // A different sound has its own gap.
    playSound("ready");
    expect(made.oscillators).toBe(played + 1);
    // 60 ms later, the default gap of 50 ms is done, but a gap of 100 ms is not.
    context.currentTime = 10.06;
    playSound("select", 100);
    expect(made.oscillators).toBe(played + 1);
    playSound("select");
    expect(made.oscillators).toBe(played + 2);
  });

  it("respects the off switch", () => {
    const played = made.oscillators;
    setSoundEnabled(false);
    playSound("victory", 0);
    expect(made.oscillators).toBe(played);
    setSoundEnabled(true);
    playSound("victory", 0);
    expect(made.oscillators).toBe(played + 4);
  });

  it("is quiet at volume 0, and plays again above it", () => {
    const played = made.oscillators;
    setSoundVolume(0);
    playSound("victory", 0);
    expect(made.oscillators).toBe(played);
    setSoundVolume(40);
    playSound("victory", 0);
    expect(made.oscillators).toBeGreaterThan(played);
    setSoundVolume(100);
  });

  it("is quiet when the context does not run", () => {
    const context = created();
    const played = made.oscillators;
    context.state = "suspended";
    playSound("victory", 0);
    expect(made.oscillators).toBe(played);
    // A new user gesture resumes it.
    unlockAudio();
    playSound("victory", 0);
    expect(made.oscillators).toBe(played + 4);
  });
});
