/**
 * The sounds of the game, made with Web Audio (art direction 7.2): short tones
 * and filtered noise, so no audio file loads. The module takes the context and
 * the effects channel, so a test can build it with a fake context.
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

/** The context and the effects channel that a sound plays on. */
export interface SoundOutput {
  readonly context: AudioContext;
  readonly destination: AudioNode;
}

/**
 * The sound of each `SoundName`, on one output. Build it once for each Audio
 * context: the map closes over the context and the effects channel.
 */
export const makeSounds = (
  output: SoundOutput
): Readonly<Record<SoundName, () => void>> => {
  const { context, destination } = output;

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
    oscillator.connect(gain).connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  const noise = (duration: number, frequency: number, gain = 0.35): void => {
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
    source.connect(filter).connect(level).connect(destination);
    source.start();
  };

  return {
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
    ranged: () =>
      tone(900, 0.16, { type: "sawtooth", slideTo: 300, gain: 0.08 }),
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
};
