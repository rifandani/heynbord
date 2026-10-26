import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const param = (value = 0) => ({
  cancelScheduledValues: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  setValueAtTime: vi.fn(),
  value,
});

const gainNode = (value = 1) => ({
  connect: <T>(next: T): T => next,
  gain: param(value),
});

const sourceNode = () => {
  let ended: (() => void) | undefined;
  return {
    addEventListener: vi.fn((type: string, listener: () => void) => {
      if (type === "ended") {
        ended = listener;
      }
    }),
    buffer: null,
    connect: <T>(next: T): T => next,
    end: () => ended?.(),
    loop: false,
    start: vi.fn(),
    stop: vi.fn(),
  };
};

type FakeGain = ReturnType<typeof gainNode>;
type FakeSource = ReturnType<typeof sourceNode>;

const fakeContext = (state = "running") => {
  const sources: FakeSource[] = [];
  const gains: FakeGain[] = [];
  return {
    createBufferSource: vi.fn(() => {
      const source = sourceNode();
      sources.push(source);
      return source;
    }),
    createGain: vi.fn(() => {
      const gain = gainNode();
      gains.push(gain);
      return gain;
    }),
    currentTime: 10,
    decodeAudioData: vi.fn(() => Promise.resolve({ duration: 1 })),
    destination: gainNode(0),
    gains,
    sampleRate: 1000,
    sources,
    state,
  };
};

type FakeContext = ReturnType<typeof fakeContext>;

interface AudioOutput {
  context: FakeContext;
  destination: FakeGain;
}

interface AudioBridge {
  output: AudioOutput | null;
  unlock: (() => void) | null;
  musicOutput: ReturnType<typeof vi.fn>;
  onAudioUnlocked: ReturnType<typeof vi.fn>;
}

const audio = vi.hoisted((): AudioBridge => ({
  musicOutput: vi.fn(),
  onAudioUnlocked: vi.fn(),
  output: null,
  unlock: null,
}));

vi.mock("@/features/battle/battle-audio", () => ({
  musicOutput: audio.musicOutput,
  onAudioUnlocked: audio.onAudioUnlocked,
}));

const fetchMock = vi.fn();

const okResponse = () => ({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  ok: true,
});

const loadPlayer = () => import("@/features/battle/music-player");

const attachContext = (context: FakeContext) => {
  audio.output = { context, destination: context.destination };
};

const deferred = () => Promise.withResolvers<null>();

describe("music player", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    audio.output = null;
    audio.unlock = null;
    audio.musicOutput.mockImplementation(() => audio.output);
    audio.onAudioUnlocked.mockImplementation((listener: () => void) => {
      audio.unlock = listener;
      return () => {
        audio.unlock = null;
      };
    });
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing before the audio unlocks", async () => {
    const player = await loadPlayer();
    expect(audio.unlock).toBeTypeOf("function");
    audio.unlock?.();
    player.playMusicTrack("town");
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("waits for the first Player gesture, then starts the requested loop", async () => {
    const player = await loadPlayer();
    const context = fakeContext();
    player.playMusicTrack("town");
    attachContext(context);
    audio.unlock?.();
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
    const [source] = context.sources;
    const [gain] = context.gains;
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("music/town.ogg")
    );
    expect(source?.loop).toBe(true);
    expect(source?.start).toHaveBeenCalledWith(10);
    expect(gain?.gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
    expect(gain?.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 11.25);
  });

  it("does not start a track while the audio context does not run", async () => {
    const player = await loadPlayer();
    const context = fakeContext("suspended");
    attachContext(context);
    player.playMusicTrack("town");
    await Promise.resolve();
    expect(context.createBufferSource).not.toHaveBeenCalled();
    context.state = "running";
    audio.unlock?.();
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
  });

  it("does not restart the loop of the current track", async () => {
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    player.playMusicTrack("town");
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
    player.playMusicTrack("town");
    await Promise.resolve();
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fades the old loop when a new track starts", async () => {
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    player.playMusicTrack("town");
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
    player.playMusicTrack("boss");
    await vi.waitFor(() => expect(context.sources).toHaveLength(2));
    const [town, boss] = context.sources;
    const [townGain] = context.gains;
    expect(town?.stop).toHaveBeenCalledWith(11.3);
    expect(townGain?.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0,
      11.25
    );
    expect(boss?.start).toHaveBeenCalledWith(10);
  });

  it("drops a track that the Player leaves while it loads", async () => {
    const gate = deferred();
    fetchMock.mockImplementation(() => gate.promise.then(okResponse));
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    player.playMusicTrack("town");
    player.playMusicTrack("boss");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    gate.resolve(null);
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("music/boss.ogg")
    );
  });

  it("drops a track when the audio context stops while it loads", async () => {
    const gate = deferred();
    fetchMock.mockImplementation(() => gate.promise.then(okResponse));
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    player.playMusicTrack("town");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    context.state = "suspended";
    gate.resolve(null);
    await vi.waitFor(() =>
      expect(context.decodeAudioData).toHaveBeenCalledTimes(1)
    );
    expect(context.sources).toHaveLength(0);
  });

  it("starts one loop when two requests race for the same track", async () => {
    const gate = deferred();
    fetchMock.mockImplementation(() => gate.promise.then(okResponse));
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    player.playMusicTrack("town");
    player.playMusicTrack("town");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    gate.resolve(null);
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
    expect(context.sources).toHaveLength(1);
  });

  it("is quiet for a sting before the audio unlocks and while it does not run", async () => {
    const player = await loadPlayer();
    await player.playMusicSting("victory");
    const context = fakeContext("suspended");
    attachContext(context);
    await player.playMusicSting("victory");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops a sting whose file does not load", async () => {
    fetchMock.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      ok: false,
    });
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    await player.playMusicSting("victory");
    expect(context.createBufferSource).not.toHaveBeenCalled();
  });

  it("drops a sting when the audio context stops while it loads", async () => {
    const gate = deferred();
    fetchMock.mockImplementation(() => gate.promise.then(okResponse));
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    const pending = player.playMusicSting("victory");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    context.state = "suspended";
    gate.resolve(null);
    await pending;
    expect(context.sources).toHaveLength(0);
  });

  it("ducks the loop under a sting, then brings it back", async () => {
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    player.playMusicTrack("town");
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
    const [loop] = context.sources;
    const [loopGain] = context.gains;
    await player.playMusicSting("victory");
    const [, sting] = context.sources;
    const [, stingGain] = context.gains;
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("music/victory.ogg")
    );
    expect(loopGain?.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0,
      10.18
    );
    expect(stingGain?.gain.setValueAtTime).toHaveBeenCalledWith(0.72, 10);
    expect(sting?.start).toHaveBeenCalledWith(10.18);
    sting?.end();
    expect(loopGain?.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 10);
    expect(loopGain?.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      1,
      10.18
    );
    expect(loop?.stop).not.toHaveBeenCalled();
  });

  it("plays a sting with no loop under it", async () => {
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    await player.playMusicSting("victory");
    expect(context.sources).toHaveLength(1);
    const [sting] = context.sources;
    sting?.end();
  });

  it("replaces a sting that is still playing", async () => {
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    await player.playMusicSting("victory");
    const [first] = context.sources;
    first?.stop.mockImplementation(() => {
      throw new Error("The sting has ended");
    });
    await player.playMusicSting("defeat");
    expect(first?.stop).toHaveBeenCalledWith(10);
    expect(context.sources).toHaveLength(2);
    // The ended handler of the replaced sting must not restore the loop.
    first?.end();
    expect(context.sources).toHaveLength(2);
  });

  it("starts a new loop in silence while a sting plays", async () => {
    const player = await loadPlayer();
    const context = fakeContext();
    attachContext(context);
    await player.playMusicSting("victory");
    const [sting] = context.sources;
    player.playMusicTrack("town");
    await vi.waitFor(() => expect(context.sources).toHaveLength(2));
    const [, loopGain] = context.gains;
    expect(loopGain?.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0,
      11.25
    );
    sting?.end();
    expect(loopGain?.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      1,
      10.18
    );
  });
});
