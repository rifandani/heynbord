import type {
  CardDefinition,
  ClassId,
  DamageType,
  RaceId,
  TokenDefinition,
  UnitRole,
} from "@workspace/rules";
import { absurd } from "effect";

/**
 * Flat icons with the same line width (art direction 6), as SVG path data in a
 * `-50 -50 100 100` box. The HUD draws them as SVG, and the scene textures draw
 * the same paths with `Path2D`.
 */
const circle = (x: number, y: number, rx: number, ry = rx): string =>
  `M${x + rx} ${y} A${rx} ${ry} 0 1 1 ${x - rx} ${y} A${rx} ${ry} 0 1 1 ${x + rx} ${y} Z`;

/** The point at `radius` from the center, in the direction of `angle`. */
const point = (angle: number, radius: number): string =>
  `${(Math.cos(angle) * radius).toFixed(1)} ${(Math.sin(angle) * radius).toFixed(1)}`;

/** 8 lines out from the center, from `inner` to `outer`: sun rays. */
const spokes = (inner: number, outer: number): string =>
  Array.from({ length: 8 }, (_, spoke) => {
    const angle = (spoke * Math.PI) / 4;
    return `M${point(angle, inner)} L${point(angle, outer)}`;
  }).join(" ");

/** A gear of 8 square teeth with a hole, and no tooth at the upper right: Goblin junk. */
const brokenCog = (): string => {
  const body = 31;
  const tip = 44;
  const teeth = 8;
  const missing = 1;
  const root = Math.asin(8 / body);
  const crest = Math.asin(6.5 / tip);
  const outline = Array.from({ length: teeth }, (_, tooth) => {
    const angle = (tooth * 2 * Math.PI) / teeth - Math.PI / 2;
    const next = angle + (2 * Math.PI) / teeth - root;
    const crown =
      tooth === missing
        ? ""
        : ` L${point(angle - crest, tip)} L${point(angle + crest, tip)} L${point(angle + root, body)}`;
    return `${tooth === 0 ? `M${point(angle - root, body)}` : ""}${crown} A${body} ${body} 0 0 1 ${point(next, body)}`;
  }).join("");
  return `${outline} Z ${circle(0, 0, 14)}`;
};

/** One tusk: a wide root at the bottom that curves up, with the tip turned to the center. */
const tusk = (side: 1 | -1): string => {
  const x = (value: number) => value * side;
  return `M${x(-14)} 42 C${x(-20)} 16 ${x(-22)} -14 ${x(-6)} -42 C${x(-34)} -30 ${x(-48)} 0 ${x(-42)} 42 Q${x(-28)} 48 ${x(-14)} 42 Z`;
};

/** One claw mark from the upper right to the lower left: a round top that tapers to a point. */
const slash = (x: number, top: number, bottom: number): string => {
  const half = 7.5;
  const lean = 14;
  const middle = (top + bottom) / 2;
  return `M${x + lean - half} ${top} Q${x - 1.5} ${middle - 4} ${x - lean} ${bottom} Q${x + 12} ${middle + 2} ${x + lean + half} ${top} A${half} ${half} 0 0 0 ${x + lean - half} ${top} Z`;
};

export const GLYPHS = {
  shield: "M0 -46 L38 -32 Q38 20 0 48 Q-38 20 -38 -32 Z",
  sword:
    "M0 -50 L9 -38 L9 22 L-9 22 L-9 -38 Z M-26 22 H26 V30 H-26 Z M-5 30 H5 V48 H-5 Z",
  bow: "M-14 -46 Q46 0 -14 46 Z M-40 0 L30 0 M30 0 L18 -9 M30 0 L18 9",
  wings:
    "M0 10 Q-30 -50 -50 -20 Q-36 -14 -42 6 Q-24 0 -22 22 Q-10 14 0 10 Q30 -50 50 -20 Q36 -14 42 6 Q24 0 22 22 Q10 14 0 10 Z",
  sun: `${circle(0, 0, 20)} ${spokes(28, 44)}`,
  paw: [
    circle(0, 18, 22, 18),
    circle(-30, -10, 9, 12),
    circle(-12, -32, 9, 12),
    circle(12, -32, 9, 12),
    circle(30, -10, 9, 12),
  ].join(" "),
  // The supplied wizard hat, in the glyph box. Fill only: a stroke closes the stars.
  hat: "M-34.5 24.92L-19.1 -12.49C-16.05 -19.91 -10.51 -26.02 -3.43 -29.79L22.96 -43.86C25.17 -45.05 27.73 -43.02 27.1 -40.59L20.41 -15C20.21 -14.27 20.12 -13.51 20.12 -12.74C20.12 -11.61 20.34 -10.48 20.77 -9.42L34.5 24.92L-2.71 24.92L-0.59 18.56L6.67 16.14C7.83 15.74 8.62 14.64 8.62 13.4C8.62 12.16 7.83 11.07 6.67 10.67L-0.59 8.25L-3.02 0.99C-3.41 -0.16 -4.51 -0.95 -5.75 -0.95C-6.99 -0.95 -8.09 -0.16 -8.48 1.01L-10.91 8.27L-18.17 10.69C-19.33 11.09 -20.12 12.18 -20.12 13.42C-20.12 14.66 -19.33 15.76 -18.17 16.15L-10.91 18.58L-8.79 24.94L-34.5 24.94ZM4.24 -21.53C4.04 -22.12 3.5 -22.51 2.88 -22.51C2.25 -22.51 1.71 -22.12 1.51 -21.53L0.31 -17.9L-3.32 -16.69C-3.92 -16.5 -4.31 -15.96 -4.31 -15.33C-4.31 -14.7 -3.92 -14.16 -3.32 -13.96L0.31 -12.76L1.51 -9.13C1.71 -8.54 2.25 -8.14 2.88 -8.14C3.5 -8.14 4.04 -8.54 4.24 -9.13L5.44 -12.76L9.07 -13.96C9.67 -14.16 10.06 -14.7 10.06 -15.33C10.06 -15.96 9.67 -16.5 9.07 -16.69L5.44 -17.9ZM-40.25 33.55L40.25 33.55C43.43 33.55 46 36.12 46 39.3C46 42.48 43.43 45.05 40.25 45.05L-40.25 45.05C-43.43 45.05 -46 42.48 -46 39.3C-46 36.12 -43.43 33.55 -40.25 33.55",
  brick: "M-44 -30 H44 V30 H-44 Z M-44 0 H44 M0 -30 V0 M-22 0 V30 M22 0 V30",
  heart:
    "M0 -14 C0 -40 -40 -40 -40 -12 C-40 10 0 26 0 42 C0 26 40 10 40 -12 C40 -40 0 -40 0 -14 Z",
  speed: "M-34 -28 L-4 0 L-34 28 M2 -28 L32 0 L2 28",
  range: `${circle(0, 0, 38)} ${circle(0, 0, 20)} ${circle(0, 0, 4)}`,
  flame:
    "M0 46 C-30 46 -36 18 -22 -4 C-16 8 -8 10 -6 4 C-10 -20 4 -38 14 -46 C12 -26 36 -14 34 14 C32 36 18 46 0 46 Z",
  sound:
    "M-40 -14 H-18 L10 -38 V38 L-18 14 H-40 Z M22 -20 Q36 0 22 20 M30 -32 Q52 0 30 32",
  mute: "M-40 -14 H-18 L10 -38 V38 L-18 14 H-40 Z M22 -18 L46 18 M46 -18 L22 18",
  hourglass:
    "M-32 -46 H32 V-36 H-32 Z M-32 36 H32 V46 H-32 Z M-24 -36 H24 Q24 -14 6 0 Q24 14 24 36 H-24 Q-24 14 -6 0 Q-24 -14 -24 -36 Z",
  crown:
    "M-40 26 L-44 -26 L-20 0 L0 -38 L20 0 L44 -26 L40 26 Z M-40 34 H40 V44 H-40 Z",
  leaf: "M-34 34 Q-46 -34 42 -42 Q34 38 -34 34 Z M-34 34 L-46 46",
  /** Two tusks that rise from the jaw: Orc. */
  tusks: `${tusk(1)} ${tusk(-1)}`,
  /** A broken cog: Goblin. */
  cog: brokenCog(),
  /** Three claw marks, the middle one longest: Feral. */
  slashes: [slash(-30, -30, 38), slash(-2, -38, 44), slash(26, -34, 32)].join(
    " "
  ),
  /**
   * A friendly skull: Undead. Two round eyes, a nose, and two slits that make
   * three teeth in the jaw. The holes are wide, because the stroke closes them.
   */
  skull: [
    "M-31 14 C-46 4 -46 -46 0 -46 C46 -46 46 4 31 14 Q22 16 22 22 V36 Q22 44 14 44 H-14 Q-22 44 -22 36 V22 Q-22 16 -31 14 Z",
    circle(-16, -8, 13, 14),
    circle(16, -8, 13, 14),
    "M0 4 L9 17 Q0 21 -9 17 Z",
    "M-15 29 A6 6 0 0 1 -3 29 V35 A6 6 0 0 1 -15 35 Z",
    "M3 29 A6 6 0 0 1 15 29 V35 A6 6 0 0 1 3 35 Z",
  ].join(" "),
  /** A curled vine with a leaf: Entangled. */
  vine: "M-40 44 C-40 10 -4 22 -4 -4 C-4 -30 -32 -30 -32 -12 C-32 0 -16 0 -16 -10 M-4 -4 C6 -28 26 -36 40 -40 M14 -22 Q36 -18 38 2 Q16 0 14 -22 Z",
  info: `${circle(0, 0, 44)} ${circle(0, 0, 34)} ${circle(0, -20, 6)} M-6 -6 H6 V26 H-6 Z`,
  snow: "M0 -44 V44 M-38 -22 L38 22 M-38 22 L38 -22 M-10 -34 L0 -24 L10 -34 M-10 34 L0 24 L10 34",
  // The Town Bar shortcuts (GDD 11.4).
  house: "M-40 -2 L0 -40 L40 -2 Z M-30 -2 H30 V42 H-30 Z M-8 42 V16 H8 V42 Z",
  gate: "M-44 -20 H44 V44 H-44 Z M-44 -36 H-28 V-20 H-44 Z M-8 -36 H8 V-20 H-8 Z M28 -36 H44 V-20 H28 Z M-18 44 V6 Q-18 -14 0 -14 Q18 -14 18 6 V44 Z",
  tower:
    "M-16 -30 H16 L22 44 H-22 Z M-22 -30 L0 -50 L22 -30 Z M-5 -14 H5 V2 H-5 Z",
  cave: "M-46 44 Q-46 -36 0 -40 Q46 -36 46 44 Z M-22 44 Q-22 0 0 -4 Q22 0 22 44 Z",
  cards: "M-30 -40 H22 V40 H-30 Z M-20 -48 H36 V30 H28 V-40 H-20 Z",
  /**
   * A Skill Card: a 3:4 card with the arched art window of a Skill Card and a
   * spark in it.
   */
  skillCard:
    "M-26 -46 H26 Q34 -46 34 -38 V38 Q34 46 26 46 H-26 Q-34 46 -34 38 V-38 Q-34 -46 -26 -46 Z M-24 34 V-10 Q-24 -36 0 -36 Q24 -36 24 -10 V34 Z M0 -18 L5 -3 L16 2 L5 7 L0 22 L-5 7 L-16 2 L-5 -3 Z",
  anvil:
    "M-44 -24 H30 Q44 -24 44 -12 Q30 -6 22 -6 V10 H12 L22 30 H-22 L-12 10 H-22 V-6 Q-38 -6 -44 -24 Z M-30 30 H30 V42 H-30 Z",
  pack: "M-30 -40 L-20 -46 L-10 -40 L0 -46 L10 -40 L20 -46 L30 -40 V44 H-30 Z M0 -16 L6 -2 L20 -2 L9 7 L13 22 L0 13 L-13 22 L-9 7 L-20 -2 L-6 -2 Z",
  helmet: "M-36 40 V0 Q-36 -44 0 -44 Q36 -44 36 0 V40 H14 V8 H-14 V40 Z",
  // The supplied crossed swords, in the glyph box. Fill only: a stroke closes the gaps.
  // The Physical Damage Type uses the sword.
  warhelm:
    "M-46.14 -47.18C-34.51 -25.25 -18.31 -7.66 -0.78 9.99L-0.07 10.72L-0.05 10.71C4.21 14.99 8.55 19.29 12.91 23.65C9.23 26.54 5.3 29.16 1.21 31.52L6.78 37.1L20.2 23.68C28.47 29.07 35.1 36.11 40.53 44.34L46.01 38.86C37.72 33.49 30.44 27.1 25.31 18.57L38.77 5.11L33.2 -0.46C31.03 3.8 28.43 7.74 25.49 11.37C16.92 2.82 8.6 -5.4 0.07 -13.14C0.03 -13.17 -0.01 -13.22 -0.06 -13.26C-14.14 -26.03 -28.81 -37.52 -46.14 -47.18ZM46.02 -47.18C29.8 -38.14 15.92 -27.5 2.67 -15.7L7.12 -11.49L18.22 -22.59L20.8 -20.01L9.78 -8.99L14.58 -4.46C26.65 -17.53 37.55 -31.2 46.02 -47.18ZM-18.34 -22.59L20.83 16.58A78.71 78.71 0 0 1 18.21 19.12L-20.92 -20.01ZM-33.32 -0.46L-38.89 5.11L-25.43 18.57C-30.56 27.1 -37.84 33.49 -46.13 38.86L-40.65 44.34C-35.22 36.11 -28.59 29.07 -20.32 23.68L-6.9 37.1L-1.32 31.52C-5.42 29.16 -9.35 26.54 -13.03 23.65C-9.54 20.17 -6.08 16.73 -2.65 13.31L-7.5 8.29L-18.34 19.13C-19.23 18.3 -20.1 17.44 -20.95 16.58L-10.04 5.67L-14.83 0.71C-18.4 4.2 -21.98 7.76 -25.6 11.38C-28.55 7.75 -31.15 3.81 -33.32 -0.46Z",
  banner: `M-30 -46 H30 V40 L0 22 L-30 40 Z ${circle(0, -10, 10)}`,
  /**
   * A war horn that sounds the start of a Battle: the Handbook Battle Chapter.
   * Two gaps cut it into the body, a band and the rim of the bell.
   */
  horn: "M-45 29 Q-14 36 7 21 L-5 8 Q-17 26 -45 26 Z M17 12 Q24 4 32 -9 L3 -19 Q3 -8 0 0 Z M40 -20 Q41 -21 45 -28 A37 37 0 0 0 0 -36 Q1 -32 1 -29 Z",
  tent: "M-46 40 L0 -40 L46 40 Z M-12 40 L0 6 L12 40 Z",
  // A done mark: the active Deck.
  check: "M-44 0 L-29 -15 L-12 2 L29 -39 L44 -24 L-12 32 Z",
  /** An arrow that turns back: Recall sends the card back to the Hand. */
  recall:
    "M-46 -14 L-20 -40 V-22 H14 A30 30 0 0 1 14 38 H-14 V22 H14 A14 14 0 0 0 14 -6 H-20 V12 Z",
  /**
   * An open book: the Handbook, until its painted Town Bar icon exists. The
   * two pages stay apart, because the stroke closes a smaller gap.
   */
  book: "M-7 -30 Q-24 -42 -46 -36 V34 Q-24 28 -7 38 Z M7 -30 Q24 -42 46 -36 V34 Q24 28 7 38 Z",
  lock: "M-0.336 -46.619c-15.83 0 -28.637 12.79 -28.637 28.595V-3.906h9.686v-13.495c0 -10.48 8.49 -18.982 18.951 -18.982c10.462 0 18.952 8.739 18.952 18.982V-3.906h9.686v-14.117c0 -15.402 -12.835 -28.595 -28.638 -28.595ZM-33.368 -0.256c-2.854 4.458 -4.462 9.599 -4.462 14.996c0 17.257 16.596 31.543 37.494 31.543c20.898 0 37.494 -14.286 37.494 -31.543c0 -5.397 -1.613 -10.537 -4.468 -14.996H-33.368ZM-0.391 4.419c4.363 0 7.983 3.504 7.983 7.867c0 3.273 -2.07 6.1 -4.907 7.3l6.391 19.165h-18.823l6.274 -19.165c-2.837 -1.2 -4.791 -4.027 -4.791 -7.3c0 -4.363 3.51 -7.867 7.873 -7.867Z",
} as const;

export type Glyph = keyof typeof GLYPHS;

/** Filled artwork. A stroke closes the cutouts. */
export const FILLED_GLYPHS: ReadonlySet<Glyph> = new Set([
  "hat",
  "warhelm",
  "lock",
  "skillCard",
]);

const ROLE_GLYPH: Readonly<Record<UnitRole, Glyph>> = {
  frontliner: "shield",
  striker: "sword",
  runner: "paw",
  shooter: "bow",
  support: "sun",
  wall: "brick",
};

const CLASS_GLYPH: Readonly<Record<ClassId, Glyph>> = {
  warrior: "warhelm",
  ranger: "bow",
  mage: "hat",
  priest: "sun",
};

const RACE_GLYPH: Readonly<Record<RaceId, Glyph>> = {
  human: "crown",
  elf: "leaf",
  undead: "skull",
  orc: "tusks",
  goblin: "cog",
  feral: "slashes",
};

/** The icon of each Damage Type, next to its color (GDD 11.3). */
export const DAMAGE_GLYPH = {
  physical: "sword",
  fire: "flame",
  frost: "snow",
  holy: "sun",
} as const satisfies Readonly<Record<DamageType, Glyph>>;

export const raceGlyph = (race: RaceId): Glyph => RACE_GLYPH[race];

export const roleGlyph = (role: UnitRole): Glyph => ROLE_GLYPH[role];

export const classGlyph = (classId: ClassId): Glyph => CLASS_GLYPH[classId];

/** The icon of a card: its role, wings for Flying, and the effect for a Skill Card. */
export const cardGlyph = (card: CardDefinition): Glyph => {
  if (card.kind === "creature") {
    return card.keywords.flying ? "wings" : ROLE_GLYPH[card.role];
  }
  switch (card.effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane":
    case "damageEntangle":
    case "damagePush":
    case "damageHero": {
      return card.effect.damageType === "frost"
        ? "snow"
        : card.effect.damageType === "fire"
          ? "flame"
          : "sword";
    }
    case "laneArmor": {
      return "shield";
    }
    case "lowerCountdown": {
      return "speed";
    }
    default: {
      return absurd(card.effect);
    }
  }
};

/**
 * The icon of a Token: wings for Flying, else its Race. A Token has no role
 * (Card Concepts 8).
 */
export const tokenGlyph = (token: TokenDefinition): Glyph =>
  token.keywords.flying ? "wings" : RACE_GLYPH[token.race];
