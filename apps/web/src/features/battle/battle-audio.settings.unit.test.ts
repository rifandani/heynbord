import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const fakeParam = () => ({
  cancelScheduledValues: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
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

const gains: ReturnType<typeof fakeNode>[] = [];
const contexts: FakeAudioContext[] = [];

const createGainNode = (): ReturnType<typeof fakeNode> => {
  const node = fakeNode();
  gains.push(node);
  return node;
};

class FakeAudioContext {
  state = "suspended";
  currentTime = 0;
  readonly destination = fakeNode();
  readonly createGain = createGainNode;
  readonly resume = () => {
    this.state = "running";
    return Promise.resolve();
  };

  constructor() {
    contexts.push(this);
  }
}

describe("audio settings", () => {
  beforeEach(() => {
    vi.resetModules();
    gains.length = 0;
    contexts.length = 0;
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
  });

  afterAll(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("starts muted when Sound and music are off, then follows the switches", async () => {
    const audio = await import("@/features/battle/battle-audio");
    const heard: string[] = [];
    const unsubscribe = audio.onAudioUnlocked(() => heard.push("unlock"));

    audio.setSoundEnabled(false);
    audio.setMusicEnabled(false);
    expect(audio.musicOutput()).toBeNull();
    audio.unlockAudio();

    expect(contexts).toHaveLength(1);
    const [master, effects, music] = gains;
    expect(master?.gain.value).toBe(0);
    expect(effects?.gain.value).toBe(1);
    expect(music?.gain.value).toBe(0);
    expect(audio.musicOutput()).not.toBeNull();

    audio.setMusicVolume(40);
    expect(music?.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.02);
    audio.setMusicEnabled(true);
    expect(music?.gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.4 ** 2,
      0,
      0.02
    );
    audio.setMusicVolume(50);
    expect(music?.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.25, 0, 0.02);
    audio.setMusicEnabled(false);
    expect(music?.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.02);

    await vi.waitFor(() => expect(heard).toEqual(["unlock"]));
    audio.unlockAudio();
    expect(heard).toEqual(["unlock", "unlock"]);
    unsubscribe();
    audio.unlockAudio();
    expect(heard).toEqual(["unlock", "unlock"]);

    audio.setSoundEnabled(true);
    expect(master?.gain.setTargetAtTime).toHaveBeenLastCalledWith(
      0.35,
      0,
      0.02
    );
  });
});
