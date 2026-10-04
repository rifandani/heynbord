import type { BattleEvent } from "@workspace/rules";

/**
 * Battle sounds made with Web Audio (art direction 7.2): short tones and
 * filtered noise, so no audio file loads. The context starts only after a user
 * gesture, as browsers require.
 */
export type SoundName =
  | "select"
  | "summon"
  | "step"
  | "melee"
  | "ranged"
  | "hit"
  | "crit"
  | "block"
  | "fire"
  | "frost"
  | "holy"
  | "death"
  | "heal"
  | "ready"
  | "turn"
  | "victory"
  | "defeat";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
const lastPlayed = new Map<SoundName, number>();

/** Creates or resumes the audio context. Call it from a user gesture. */
export const unlockAudio = (): void => {
  if (typeof window === "undefined" || !("AudioContext" in window)) {
    return;
  }
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.35;
    master.connect(context.destination);
  }
  if (context.state === "suspended") {
    void context.resume();
  }
};

export const setSoundEnabled = (on: boolean): void => {
  enabled = on;
};

const tone = (
  frequency: number,
  duration: number,
  options: {
    readonly type?: OscillatorType;
    readonly gain?: number;
    readonly slideTo?: number;
    readonly delay?: number;
  } = {}
): void => {
  if (!context || !master) {
    return;
  }
  const start = context.currentTime + (options.delay ?? 0);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = options.type ?? "triangle";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (options.slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(
      options.slideTo,
      start + duration
    );
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.gain ?? 0.4, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(master);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

const noise = (duration: number, frequency: number, gain = 0.35): void => {
  if (!context || !master) {
    return;
  }
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  const level = context.createGain();
  level.gain.value = gain;
  source.connect(filter).connect(level).connect(master);
  source.start();
};

const SOUNDS: Readonly<Record<SoundName, () => void>> = {
  select: () => tone(660, 0.07, { gain: 0.15 }),
  summon: () => {
    tone(392, 0.18, { slideTo: 784, gain: 0.25 });
    tone(587, 0.2, { delay: 0.06, gain: 0.15 });
  },
  step: () => noise(0.05, 500, 0.12),
  melee: () => noise(0.12, 1800, 0.3),
  ranged: () => tone(900, 0.16, { type: "sawtooth", slideTo: 300, gain: 0.08 }),
  hit: () => {
    noise(0.1, 900, 0.35);
    tone(140, 0.12, { type: "square", gain: 0.12 });
  },
  crit: () => {
    noise(0.18, 1200, 0.5);
    tone(110, 0.25, { type: "square", slideTo: 60, gain: 0.25 });
  },
  block: () => tone(1500, 0.18, { type: "square", gain: 0.1, slideTo: 1300 }),
  fire: () => noise(0.3, 400, 0.3),
  frost: () => tone(1800, 0.25, { type: "sine", gain: 0.15, slideTo: 2400 }),
  holy: () => {
    tone(880, 0.3, { type: "sine", gain: 0.15 });
    tone(1320, 0.3, { type: "sine", gain: 0.1 });
  },
  death: () => tone(300, 0.35, { type: "sawtooth", slideTo: 80, gain: 0.12 }),
  heal: () => tone(523, 0.25, { type: "sine", gain: 0.15, slideTo: 784 }),
  ready: () => tone(1046, 0.1, { type: "sine", gain: 0.12 }),
  turn: () => {
    tone(523, 0.12, { gain: 0.15 });
    tone(784, 0.16, { delay: 0.1, gain: 0.15 });
  },
  victory: () => {
    for (const [index, note] of [523, 659, 784, 1046].entries()) {
      tone(note, 0.3, { delay: index * 0.12, gain: 0.2 });
    }
  },
  defeat: () => {
    for (const [index, note] of [392, 349, 311, 262].entries()) {
      tone(note, 0.35, { delay: index * 0.16, gain: 0.18, type: "sine" });
    }
  },
};

/** Plays a sound. The same sound plays at most once in `minGap` ms, so speed ×2 stays clear (art direction 7.3). */
export const playSound = (name: SoundName, minGap = 50): void => {
  if (!enabled || !context || context.state !== "running") {
    return;
  }
  const now = context.currentTime * 1000;
  if (now - (lastPlayed.get(name) ?? -Infinity) < minGap) {
    return;
  }
  lastPlayed.set(name, now);
  SOUNDS[name]();
};

/** The sound of a Battle Event, if it has one. */
export const eventSound = (event: BattleEvent): SoundName | null => {
  switch (event._tag) {
    case "UnitSummoned": {
      return "summon";
    }
    case "UnitMoved": {
      return "step";
    }
    case "UnitAttacked": {
      return event.ranged ? "ranged" : "melee";
    }
    case "DamageDealt": {
      if (event.source === "burn") {
        return "fire";
      }
      if (event.crit) {
        return "crit";
      }
      if (event.blocked) {
        return "block";
      }
      return event.damageType === "physical" ? "hit" : event.damageType;
    }
    case "UnitDied": {
      return "death";
    }
    case "UnitHealed": {
      return "heal";
    }
    case "TurnStarted": {
      return "turn";
    }
    case "BattleEnded": {
      return event.result.winner === "player" ? "victory" : "defeat";
    }
    default: {
      return null;
    }
  }
};
