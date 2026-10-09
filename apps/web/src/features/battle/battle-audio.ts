import type { BattleEvent } from "@workspace/rules";
import { getCard } from "@workspace/rules";

/**
 * Battle sounds made with Web Audio (art direction 7.2): short tones and
 * filtered noise, so no audio file loads. The context starts only after a user
 * gesture, as browsers require.
 */
export type SoundName =
  | "select"
  | "summon"
  | "cast"
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
  | "defeat"
  | "packTear"
  | "cardFlip"
  | "revealRare"
  | "revealEpic"
  | "revealLegendary";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
/** The volume as a part of 1. */
let volume = 1;
const lastPlayed = new Map<SoundName, number>();

/** The master gain at volume 100. */
const FULL_GAIN = 0.35;

/** The ear hears loudness on a curve, so the gain follows the square of the volume. */
const masterGain = () => FULL_GAIN * volume ** 2;

/** Creates or resumes the audio context. Call it from a user gesture. */
export const unlockAudio = (): void => {
  if (typeof window === "undefined" || !("AudioContext" in window)) {
    return;
  }
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = masterGain();
    master.connect(context.destination);
  }
  if (context.state === "suspended") {
    void context.resume();
  }
};

export const setSoundEnabled = (on: boolean): void => {
  enabled = on;
};

/** Sets the volume, 0 to 100. A change applies to the sounds that play now too. */
export const setSoundVolume = (percent: number): void => {
  volume = Math.min(Math.max(percent, 0), 100) / 100;
  if (context && master) {
    master.gain.setTargetAtTime(masterGain(), context.currentTime, 0.02);
  }
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
  // A rising shimmer while the Hero gathers a spell.
  cast: () => {
    tone(440, 0.42, { type: "sine", slideTo: 1320, gain: 0.12 });
    tone(660, 0.36, {
      type: "triangle",
      delay: 0.1,
      slideTo: 1760,
      gain: 0.07,
    });
    noise(0.3, 2600, 0.06);
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
  // The Packs screen: the paper of a Pack tears, then a card turns over.
  packTear: () => {
    noise(0.28, 3200, 0.22);
    noise(0.16, 1400, 0.12);
  },
  cardFlip: () => noise(0.07, 2400, 0.14),
  // The chime of a revealed card grows with its Rank.
  revealRare: () => {
    tone(784, 0.22, { type: "sine", gain: 0.14 });
    tone(1175, 0.3, { type: "sine", delay: 0.08, gain: 0.1 });
  },
  revealEpic: () => {
    for (const [index, note] of [659, 831, 988, 1319].entries()) {
      tone(note, 0.32, { type: "sine", delay: index * 0.07, gain: 0.13 });
    }
  },
  revealLegendary: () => {
    for (const [index, note] of [523, 659, 784, 1046, 1319, 1568].entries()) {
      tone(note, 0.5, { type: "sine", delay: index * 0.075, gain: 0.14 });
    }
    tone(2093, 0.9, { type: "sine", delay: 0.45, slideTo: 2637, gain: 0.05 });
    noise(0.6, 5200, 0.05);
  },
};

/** Plays a sound. The same sound plays at most once in `minGap` ms, so speed ×2 stays clear (art direction 7.3). */
export const playSound = (name: SoundName, minGap = 50): void => {
  if (!enabled || volume === 0 || !context || context.state !== "running") {
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
    case "CardPlayed": {
      return getCard(event.card.cardId).kind === "skill" ? "cast" : null;
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
