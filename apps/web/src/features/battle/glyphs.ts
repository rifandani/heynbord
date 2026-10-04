import type {
  CardDefinition,
  ClassId,
  RaceId,
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

const sunRays = Array.from({ length: 8 }, (_, ray) => {
  const angle = (ray * Math.PI) / 4;
  const point = (radius: number) =>
    `${(Math.cos(angle) * radius).toFixed(1)} ${(Math.sin(angle) * radius).toFixed(1)}`;
  return `M${point(28)} L${point(44)}`;
}).join(" ");

export const GLYPHS = {
  shield: "M0 -46 L38 -32 Q38 20 0 48 Q-38 20 -38 -32 Z",
  sword:
    "M0 -50 L9 -38 L9 22 L-9 22 L-9 -38 Z M-26 22 H26 V30 H-26 Z M-5 30 H5 V48 H-5 Z",
  bow: "M-14 -46 Q46 0 -14 46 Z M-40 0 L30 0 M30 0 L18 -9 M30 0 L18 9",
  wings:
    "M0 10 Q-30 -50 -50 -20 Q-36 -14 -42 6 Q-24 0 -22 22 Q-10 14 0 10 Q30 -50 50 -20 Q36 -14 42 6 Q24 0 22 22 Q10 14 0 10 Z",
  sun: `${circle(0, 0, 20)} ${sunRays}`,
  paw: [
    circle(0, 18, 22, 18),
    circle(-30, -10, 9, 12),
    circle(-12, -32, 9, 12),
    circle(12, -32, 9, 12),
    circle(30, -10, 9, 12),
  ].join(" "),
  orb: `${circle(0, 4, 30)} M0 -46 L8 -34 L-8 -34 Z ${circle(-10, -6, 6)}`,
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
  wisp: `M0 -46 C24 -22 34 4 30 22 C26 40 12 46 0 46 C-12 46 -26 40 -30 22 C-34 4 -24 -22 0 -46 Z ${circle(-11, 16, 6)} ${circle(11, 16, 6)}`,
  tusks:
    "M-34 42 Q-44 -8 -12 -44 Q-24 2 -14 42 Z M34 42 Q44 -8 12 -44 Q24 2 14 42 Z",
  info: `${circle(0, 0, 44)} ${circle(0, 0, 34)} ${circle(0, -20, 6)} M-6 -6 H6 V26 H-6 Z`,
  snow: "M0 -44 V44 M-38 -22 L38 22 M-38 22 L38 -22 M-10 -34 L0 -24 L10 -34 M-10 34 L0 24 L10 34",
  // The Town Bar shortcuts (GDD 11.4).
  house: "M-40 -2 L0 -40 L40 -2 Z M-30 -2 H30 V42 H-30 Z M-8 42 V16 H8 V42 Z",
  gate: "M-44 -20 H44 V44 H-44 Z M-44 -36 H-28 V-20 H-44 Z M-8 -36 H8 V-20 H-8 Z M28 -36 H44 V-20 H28 Z M-18 44 V6 Q-18 -14 0 -14 Q18 -14 18 6 V44 Z",
  tower:
    "M-16 -30 H16 L22 44 H-22 Z M-22 -30 L0 -50 L22 -30 Z M-5 -14 H5 V2 H-5 Z",
  cave: "M-46 44 Q-46 -36 0 -40 Q46 -36 46 44 Z M-22 44 Q-22 0 0 -4 Q22 0 22 44 Z",
  cards: "M-30 -40 H22 V40 H-30 Z M-20 -48 H36 V30 H28 V-40 H-20 Z",
  anvil:
    "M-44 -24 H30 Q44 -24 44 -12 Q30 -6 22 -6 V10 H12 L22 30 H-22 L-12 10 H-22 V-6 Q-38 -6 -44 -24 Z M-30 30 H30 V42 H-30 Z",
  pack: "M-30 -40 L-20 -46 L-10 -40 L0 -46 L10 -40 L20 -46 L30 -40 V44 H-30 Z M0 -16 L6 -2 L20 -2 L9 7 L13 22 L0 13 L-13 22 L-9 7 L-20 -2 L-6 -2 Z",
  helmet: "M-36 40 V0 Q-36 -44 0 -44 Q36 -44 36 0 V40 H14 V8 H-14 V40 Z",
  banner: `M-30 -46 H30 V40 L0 22 L-30 40 Z ${circle(0, -10, 10)}`,
  tent: "M-46 40 L0 -40 L46 40 Z M-12 40 L0 6 L12 40 Z",
  lock: `M-28 -4 H28 V44 H-28 Z M-18 -4 V-22 Q-18 -42 0 -42 Q18 -42 18 -22 V-4 H8 V-22 Q8 -32 0 -32 Q-8 -32 -8 -22 V-4 Z ${circle(0, 16, 7)}`,
} as const;

export type Glyph = keyof typeof GLYPHS;

const ROLE_GLYPH: Readonly<Record<UnitRole, Glyph>> = {
  frontliner: "shield",
  striker: "sword",
  runner: "paw",
  shooter: "bow",
  support: "sun",
  wall: "brick",
};

const CLASS_GLYPH: Readonly<Record<ClassId, Glyph>> = {
  warrior: "sword",
  ranger: "bow",
  mage: "orb",
  priest: "sun",
};

const RACE_GLYPH: Readonly<Record<RaceId, Glyph>> = {
  human: "crown",
  elf: "leaf",
  undead: "wisp",
  orc: "tusks",
};

export const raceGlyph = (race: RaceId): Glyph => RACE_GLYPH[race];

export const classGlyph = (classId: ClassId): Glyph => CLASS_GLYPH[classId];

/** The icon of a card: its role, wings for Flying, and the effect for a Skill Card. */
export const cardGlyph = (card: CardDefinition): Glyph => {
  if (card.kind === "creature") {
    return card.keywords.flying ? "wings" : ROLE_GLYPH[card.role];
  }
  switch (card.effect.type) {
    case "damageUnit":
    case "damageArea":
    case "damageLane": {
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
