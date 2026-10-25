import type { BattleEvent } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { BattleView } from "@/features/battle/battle-view";
import { hasManyHeroes } from "@/features/battle/battle-view";

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
  | "lightning"
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
  | "revealLegendary"
  | "anvil"
  | "extract"
  | "essenceIn"
  | "gearUp"
  | "claim"
  | "bossDefeated"
  | "frontMoved"
  | "bossRule";

let context: AudioContext | null = null;
let master: GainNode | null = null;
/** The channel of the effects, under the master gain. */
let effects: GainNode | null = null;
/** The channel of the music, under the master gain. */
let music: GainNode | null = null;
let enabled = true;
/** The master volume as a part of 1. */
let volume = 1;
/** The effects volume as a part of 1. */
let effectsVolume = 1;
/** The music volume as a part of 1. */
let musicVolume = 1;
let musicEnabled = true;
const unlockListeners = new Set<() => void>();
const lastPlayed = new Map<SoundName, number>();

/** The master gain at volume 100. */
const FULL_GAIN = 0.35;

/** A volume change to a part of 1, from 0 to 100. */
const partOf = (percent: number): number =>
  Math.min(Math.max(percent, 0), 100) / 100;

/** The ear hears loudness on a curve, so the gain follows the square of the volume. */
const gainOf = (value: number): number => value ** 2;

/** The master gain, with the Sound volume. */
const masterGain = (): number => FULL_GAIN * gainOf(volume);

/**
 * Sets a channel gain. A change applies to the sounds that play now too.
 */
const setChannel = (channel: GainNode | null, target: number): void => {
  if (context && channel) {
    channel.gain.setTargetAtTime(target, context.currentTime, 0.02);
  }
};

/** Creates or resumes the audio context. Call it from a user gesture. */
export const unlockAudio = (): void => {
  if (typeof window === "undefined" || !("AudioContext" in window)) {
    return;
  }
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    effects = context.createGain();
    music = context.createGain();
    master.gain.value = enabled ? masterGain() : 0;
    effects.gain.value = gainOf(effectsVolume);
    music.gain.value = musicEnabled ? gainOf(musicVolume) : 0;
    effects.connect(master);
    music.connect(master);
    master.connect(context.destination);
  }
  if (context.state === "suspended") {
    const audio = context;
    const resumeAndNotify = async (): Promise<void> => {
      await audio.resume();
      for (const listener of unlockListeners) {
        listener();
      }
    };
    void resumeAndNotify();
  } else {
    for (const listener of unlockListeners) {
      listener();
    }
  }
};

/** Registers music work that must start after the Player unlocks audio. */
export const onAudioUnlocked = (listener: () => void): (() => void) => {
  unlockListeners.add(listener);
  return () => unlockListeners.delete(listener);
};

export const setSoundEnabled = (on: boolean): void => {
  enabled = on;
  setChannel(master, enabled ? masterGain() : 0);
};

/** Sets the master volume, 0 to 100. A change applies to the sounds that play now too. */
export const setSoundVolume = (percent: number): void => {
  volume = partOf(percent);
  setChannel(master, masterGain());
};

/** Sets the effects volume, 0 to 100. The master Sound switch stays apart from it. */
export const setEffectsVolume = (percent: number): void => {
  effectsVolume = partOf(percent);
  setChannel(effects, gainOf(effectsVolume));
};

/**
 * Sets the music volume, 0 to 100.
 */
export const setMusicVolume = (percent: number): void => {
  musicVolume = partOf(percent);
  setChannel(music, musicEnabled ? gainOf(musicVolume) : 0);
};

/** Sets the separate music switch. */
export const setMusicEnabled = (on: boolean): void => {
  musicEnabled = on;
  setChannel(music, musicEnabled ? gainOf(musicVolume) : 0);
};

/** The shared Web Audio context and the music channel, or null before unlock. */
export const musicOutput = (): {
  readonly context: AudioContext;
  readonly destination: GainNode;
} | null => (context && music ? { context, destination: music } : null);

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
  if (!context || !effects) {
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
  oscillator.connect(gain).connect(effects);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

const noise = (duration: number, frequency: number, gain = 0.35): void => {
  if (!context || !effects) {
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
  source.connect(filter).connect(level).connect(effects);
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
  // A short crack: bright noise and a buzz that falls fast.
  lightning: () => {
    noise(0.08, 5200, 0.35);
    tone(2400, 0.14, { type: "sawtooth", slideTo: 600, gain: 0.07 });
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
  // A Boss falls (ADR-0009): a low fall, then a dull drop on the ground.
  bossDefeated: () => {
    tone(220, 0.5, { type: "sawtooth", slideTo: 70, gain: 0.13 });
    noise(0.25, 260, 0.28);
  },
  // A Front moves: a short march of two low steps.
  frontMoved: () => {
    noise(0.07, 420, 0.16);
    tone(196, 0.12, { delay: 0.14, type: "square", gain: 0.07 });
  },
  // A Boss Rule activates (ADR-0038): a war horn rises.
  bossRule: () => {
    tone(196, 0.32, { type: "sawtooth", slideTo: 294, gain: 0.1 });
    tone(392, 0.24, { delay: 0.12, type: "square", gain: 0.06 });
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
  // The Workshop: a hammer on the anvil. A short hit, then a bright metal ring
  // with partials that are not in tune, as a struck bar of iron.
  anvil: () => {
    noise(0.05, 3400, 0.3);
    tone(1180, 0.55, { type: "sine", gain: 0.16 });
    tone(2730, 0.32, { type: "sine", gain: 0.07 });
    tone(4410, 0.18, { type: "sine", gain: 0.04 });
    tone(240, 0.1, { type: "square", gain: 0.06 });
  },
  // The Workshop: an Extract. A soft hiss as the copy melts, and a pour of
  // light that rises: the opposite of the anvil.
  extract: () => {
    noise(0.38, 1900, 0.09);
    tone(330, 0.34, { type: "sine", slideTo: 990, gain: 0.13 });
    tone(495, 0.3, { type: "sine", delay: 0.09, slideTo: 1485, gain: 0.07 });
  },
  // The Workshop: the Essence drops get to the Essence balance. A small glass
  // note, as a drop in a vial.
  essenceIn: () => {
    tone(1568, 0.2, { type: "sine", gain: 0.08 });
    tone(2349, 0.26, { type: "sine", delay: 0.05, gain: 0.05 });
  },
  // The Hero screen: a Gear upgrade. A lighter strike of the same iron, then a
  // second, higher ring a moment later: one level up.
  gearUp: () => {
    noise(0.04, 3000, 0.22);
    tone(1180, 0.4, { type: "sine", gain: 0.12 });
    tone(2730, 0.22, { type: "sine", gain: 0.05 });
    tone(1568, 0.45, { type: "sine", delay: 0.09, gain: 0.1 });
  },
  // The Achievements screen: a claimed reward gets to its balance. Two bright
  // bell notes that go up, as a coin in a full purse.
  claim: () => {
    tone(1319, 0.22, { type: "triangle", gain: 0.1 });
    tone(1976, 0.34, { type: "sine", delay: 0.07, gain: 0.08 });
  },
};

/** Plays a sound. The same sound plays at most once in `minGap` ms, so speed ×2 stays clear (art direction 7.3). */
export const playSound = (name: SoundName, minGap = 50): void => {
  if (
    !enabled ||
    volume === 0 ||
    effectsVolume === 0 ||
    !context ||
    context.state !== "running"
  ) {
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
const damageSound = (
  event: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>
): SoundName => {
  if (event.source === "burn") {
    return "fire";
  }
  if (event.crit) {
    return "crit";
  }
  // A Ward that absorbs the full hit sounds like a Block: no damage goes in.
  if (event.blocked || (event.amount === 0 && event.absorbed > 0)) {
    return "block";
  }
  return event.damageType === "physical" ? "hit" : event.damageType;
};

/**
 * The sound of a Defeated Hero, a Front move or a Boss Rule. In a Stage, the
 * Battle ends on the defeat, so only the victory or defeat sound plays.
 */
const heroSound = (
  event: BattleEvent,
  view: BattleView | undefined
): SoundName | null => {
  switch (event._tag) {
    case "HeroDefeated": {
      return view && hasManyHeroes(view, event.hero.side)
        ? "bossDefeated"
        : null;
    }
    case "FrontMoved": {
      return "frontMoved";
    }
    case "BossRuleActivated": {
      return "bossRule";
    }
    default: {
      return null;
    }
  }
};

export const eventSound = (
  event: BattleEvent,
  view?: BattleView
): SoundName | null => {
  switch (event._tag) {
    case "HeroDefeated":
    case "FrontMoved":
    case "BossRuleActivated": {
      return heroSound(event, view);
    }
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
      return damageSound(event);
    }
    case "UnitDied": {
      return "death";
    }
    // Steadfast stops a lethal hit, as a Block stops half of one.
    case "SteadfastHeld": {
      return "block";
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
