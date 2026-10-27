/* oxlint-disable anti-slop/no-chained-type-assertions, anti-slop/require-safety-comment-for-type-assertion -- the fake implements only the members that the Audio service reads */
import { Effect } from "effect";

/** A recorded gain ramp call. */
export interface GainCall {
  readonly kind: "cancel" | "exponential" | "linear" | "set" | "target";
  readonly time: number;
  readonly value: number;
}

export interface FakeParam {
  readonly calls: GainCall[];
  cancelScheduledValues: (time: number) => void;
  exponentialRampToValueAtTime: (value: number, time: number) => void;
  linearRampToValueAtTime: (value: number, time: number) => void;
  setTargetAtTime: (value: number, time: number, constant: number) => void;
  setValueAtTime: (value: number, time: number) => void;
  value: number;
}

export interface FakeGain {
  readonly gain: FakeParam;
  connect: <T>(next: T) => T;
}

export interface FakeSource {
  addEventListener: (type: string, listener: () => void) => void;
  buffer: AudioBuffer | null;
  connect: <T>(next: T) => T;
  end: () => void;
  loop: boolean;
  start: (time?: number) => void;
  stop: (time?: number) => void;
}

interface FakeOscillator {
  connect: <T>(next: T) => T;
  frequency: FakeParam;
  start: (time?: number) => void;
  stop: (time?: number) => void;
  type: string;
}

interface FakeFilter {
  connect: <T>(next: T) => T;
  frequency: FakeParam;
  type: string;
}

const makeParam = (value = 0): FakeParam => {
  const calls: GainCall[] = [];
  const param: FakeParam = {
    calls,
    cancelScheduledValues: (time) => {
      calls.push({ kind: "cancel", time, value: param.value });
    },
    exponentialRampToValueAtTime: (next, time) => {
      calls.push({ kind: "exponential", time, value: next });
      param.value = next;
    },
    linearRampToValueAtTime: (next, time) => {
      calls.push({ kind: "linear", time, value: next });
      param.value = next;
    },
    setTargetAtTime: (next, time) => {
      calls.push({ kind: "target", time, value: next });
      param.value = next;
    },
    setValueAtTime: (next, time) => {
      calls.push({ kind: "set", time, value: next });
      param.value = next;
    },
    value,
  };
  return param;
};

const gainNode = (): FakeGain => {
  const node: FakeGain = {
    connect: <T>(next: T): T => next,
    gain: makeParam(1),
  };
  return node;
};

const sourceNode = (): FakeSource => {
  let ended: (() => void) | undefined;
  return {
    addEventListener: (type, listener) => {
      if (type === "ended") {
        ended = listener;
      }
    },
    buffer: null,
    connect: <T>(next: T): T => next,
    end: () => ended?.(),
    loop: false,
    start: () => {
      // A fake source starts at once.
    },
    stop: () => {
      // A fake source stops at once.
    },
  };
};

const oscillatorNode = (): FakeOscillator => ({
  connect: <T>(next: T): T => next,
  frequency: makeParam(0),
  start: () => {
    // A fake oscillator starts at once.
  },
  stop: () => {
    // A fake oscillator stops at once.
  },
  type: "",
});

const filterNode = (): FakeFilter => ({
  connect: <T>(next: T): T => next,
  frequency: makeParam(0),
  type: "",
});

const audioBuffer = (length = 8): AudioBuffer =>
  ({
    duration: 1,
    getChannelData: () => new Float32Array(length),
  }) as unknown as AudioBuffer;

export interface FakeAudio {
  readonly context: AudioContext;
  readonly gains: FakeGain[];
  readonly sources: FakeSource[];
}

/**
 * A fake Web Audio context for the Audio service tests. The first three gains
 * are the master, effects and music channels; the later ones are per sound,
 * per loop and per sting.
 */
export const makeFakeAudio = (
  options: {
    readonly decode?: () => Promise<AudioBuffer>;
    readonly resume?: () => Promise<void>;
    readonly state?: AudioContextState;
  } = {}
): FakeAudio => {
  const gains: FakeGain[] = [];
  const sources: FakeSource[] = [];
  const context = {
    currentTime: 10,
    decodeAudioData: options.decode ?? (() => Promise.resolve(audioBuffer())),
    destination: gainNode(),
    createBiquadFilter: filterNode,
    createBuffer: (_channels: number, length: number) => audioBuffer(length),
    createBufferSource: () => {
      const source = sourceNode();
      sources.push(source);
      return source;
    },
    createGain: () => {
      const gain = gainNode();
      gains.push(gain);
      return gain;
    },
    createOscillator: oscillatorNode,
    resume:
      options.resume ??
      (() => {
        context.state = "running";
        return Promise.resolve();
      }),
    sampleRate: 1000,
    state: options.state ?? "running",
  };
  return {
    context: context as unknown as AudioContext,
    gains,
    sources,
  };
};

/** A loader that gives one decoded buffer for every URL. */
export const fakeLoad =
  (
    buffer: AudioBuffer | null = audioBuffer()
  ): ((url: string) => Effect.Effect<AudioBuffer | null>) =>
  () =>
    Effect.succeed(buffer);
