import type {
  CardDefinition,
  ClassId,
  DamageType,
  RaceId,
  TokenDefinition,
  TokenKeywords,
} from "@workspace/rules";
import { isRangedRange, keywordRange } from "@workspace/rules";
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

/** A corner of a polygon, with the radius that rounds it. */
type Corner = readonly [x: number, y: number, radius?: number];

/** A closed polygon with each corner rounded by a curve of its radius. */
const roundedPolygon = (corners: readonly Corner[], radius = 3): string => {
  const at = (index: number): Corner =>
    corners[(index + corners.length) % corners.length] ?? [0, 0];
  const toward = (from: Corner, to: Corner, length: number): string => {
    const scale = length / Math.hypot(to[0] - from[0], to[1] - from[1]);
    return `${(from[0] + (to[0] - from[0]) * scale).toFixed(1)} ${(from[1] + (to[1] - from[1]) * scale).toFixed(1)}`;
  };
  const outline = corners
    .map((corner, index) => {
      const round = corner[2] ?? radius;
      return `${index === 0 ? "M" : "L"}${toward(corner, at(index - 1), round)} Q${corner[0].toFixed(1)} ${corner[1].toFixed(1)} ${toward(corner, at(index + 1), round)}`;
    })
    .join(" ");
  return `${outline} Z`;
};

/**
 * Three courses of bricks with offset joints. The sides slope out to a wider
 * base, and the upper-left brick has a broken corner. Each brick is a separate
 * shape, so the mortar is a true gap.
 */
const masonry = (): string => {
  const top = -40;
  const bottom = 41;
  const gap = 8;
  const course = (bottom - top - gap * 2) / 3;
  const side = (y: number) => 40 + (6 * (y - top)) / (bottom - top);
  const courses = [
    { y: top, joints: [0] },
    { y: top + course + gap, joints: [-19, 19] },
    { y: top + (course + gap) * 2, joints: [0] },
  ];
  return courses
    .flatMap(({ y, joints }, row) => {
      const low = y + course;
      const stops = [-1, ...joints, 1];
      return stops.slice(0, -1).map((stop, brick) => {
        const next = stops[brick + 1] ?? 1;
        const left = (at: number) => (stop === -1 ? -side(at) : stop + gap / 2);
        const right = (at: number) => (next === 1 ? side(at) : next - gap / 2);
        const broken = row === 0 && brick === 0;
        return roundedPolygon([
          ...(broken ? ([[-29, y, 1]] as const) : ([[left(y), y]] as const)),
          [right(y), y],
          [right(low), low],
          [left(low), low],
          ...(broken
            ? ([
                [left(y + 10), y + 10, 1],
                [-36, y + 4, 1],
                [-32.5, y + 5.5, 1],
              ] as const)
            : []),
        ]);
      });
    })
    .join(" ");
};

/**
 * Two swords that cross at the center, with their points up: the `sword`
 * glyph turned 40° to each side.
 */
const crossedSwords = (): string => {
  const parts: readonly (readonly (readonly [number, number])[])[] = [
    [
      [0, -50],
      [7, -40],
      [7, 20],
      [-7, 20],
      [-7, -40],
    ],
    [
      [-20, 20],
      [20, 20],
      [20, 27],
      [-20, 27],
    ],
    [
      [-4, 27],
      [4, 27],
      [4, 44],
      [-4, 44],
    ],
  ];
  const turned = (angle: number) =>
    parts
      .map(
        (part) =>
          `${part
            .map(([x, y], index) => {
              const turnedX = x * Math.cos(angle) - y * Math.sin(angle);
              const turnedY = x * Math.sin(angle) + y * Math.cos(angle);
              return `${index === 0 ? "M" : "L"}${turnedX.toFixed(1)} ${turnedY.toFixed(1)}`;
            })
            .join(" ")} Z`
      )
      .join(" ");
  const angle = (40 * Math.PI) / 180;
  return `${turned(angle)} ${turned(-angle)}`;
};

export const GLYPHS = {
  shield: "M0 -46 L38 -32 Q38 20 0 48 Q-38 20 -38 -32 Z",
  sword:
    "M0 -50 L9 -38 L9 22 L-9 22 L-9 -38 Z M-26 22 H26 V30 H-26 Z M-5 30 H5 V48 H-5 Z",
  /**
   * A recurve bow on the diagonal with a nocked arrow: the Ranger Class. Fill
   * only: the string and the arrow have cut gaps where they cross, and a
   * stroke closes them.
   */
  bow: "M15.4 -15.4 C14.1 -16.2 10.1 -18.7 7.4 -20.2 C4.7 -21.8 1.9 -23.3 -0.9 -24.7 C-3.7 -26.1 -6.4 -27.6 -9.3 -28.7 C-12.3 -29.8 -15.3 -30.7 -18.4 -31.2 C-21.4 -31.7 -25 -30.9 -27.7 -31.6 C-30.5 -32.3 -33.7 -34.7 -34.9 -35.3 L-34.9 -35.3 C-35.6 -35.7 -38.1 -38 -39.2 -37.7 C-40.3 -37.3 -41.2 -34.1 -41.6 -33.3 L-41.6 -33.3 C-40.9 -32.2 -39.6 -27.9 -37.7 -26.3 C-35.7 -24.7 -31.3 -24.3 -30 -23.9 L-29.9 -23.9 L-15.6 15.6 L-15.6 15.6 L23.9 29.9 L23.9 30 C24.3 31.3 24.7 35.7 26.3 37.7 C27.9 39.6 32.2 40.9 33.3 41.6 L33.3 41.6 C34.1 41.2 37.3 40.3 37.7 39.2 C38 38.1 35.7 35.6 35.3 34.9 L35.3 34.9 C34.7 33.7 32.3 30.5 31.6 27.7 C30.9 25 31.7 21.4 31.2 18.4 C30.7 15.3 29.8 12.3 28.7 9.3 C27.6 6.4 26.1 3.7 24.7 0.9 C23.3 -1.9 21.8 -4.7 20.2 -7.4 C18.7 -10.1 16.2 -14.1 15.4 -15.4 Z M3.5 -3.5 C2.6 -4.7 0.4 -8.7 -1.6 -11 C-3.5 -13.3 -5.7 -15.4 -8.1 -17.2 C-10.6 -18.9 -13.3 -20.4 -16.1 -21.5 C-18.9 -22.6 -23.4 -23.4 -24.9 -23.8 L-25 -23.8 L-12 12 L23.8 25 L23.8 24.9 C23.4 23.4 22.6 18.9 21.5 16.2 C20.4 13.4 19 10.6 17.2 8.2 C15.5 5.8 13.3 3.6 11.1 1.6 C8.8 -0.3 4.8 -2.5 3.6 -3.4 Z M-10.6 5.7 L-1.7 -3.2 L3.2 1.7 L-5.7 10.6 Z M-20.7 15.8 L-27 22.1 L-36.9 23.5 L-46 32.6 L-38.3 33.3 L-40.4 35.5 L-43 38.4 L-37.2 37.2 L-38.4 43 L-35.5 40.4 L-33.3 38.3 L-32.6 46 L-23.5 36.9 L-22.1 27 L-15.8 20.7 Z M15.6 -20.5 L30.9 -35.8 L22.4 -40 L46 -46 L40 -22.4 L35.8 -30.9 L20.5 -15.6 Z",
  /** The arrow from the bow, without the bow: a Ranged Unit. */
  arrow:
    "M-20.7 15.8 L-27 22.1 L-36.9 23.5 L-46 32.6 L-38.3 33.3 L-40.4 35.5 L-43 38.4 L-37.2 37.2 L-38.4 43 L-35.5 40.4 L-33.3 38.3 L-32.6 46 L-23.5 36.9 L-22.1 27 L-15.8 20.7 L20.5 -15.6 L35.8 -30.9 L40 -22.4 L46 -46 L22.4 -40 L30.9 -35.8 L15.6 -20.5 Z",
  wings:
    "M0 10 Q-30 -50 -50 -20 Q-36 -14 -42 6 Q-24 0 -22 22 Q-10 14 0 10 Q30 -50 50 -20 Q36 -14 42 6 Q24 0 22 22 Q10 14 0 10 Z",
  sun: `${circle(0, 0, 20)} ${spokes(28, 44)}`,
  // The supplied wizard hat, in the glyph box. Fill only: a stroke closes the stars.
  hat: "M-34.5 24.92L-19.1 -12.49C-16.05 -19.91 -10.51 -26.02 -3.43 -29.79L22.96 -43.86C25.17 -45.05 27.73 -43.02 27.1 -40.59L20.41 -15C20.21 -14.27 20.12 -13.51 20.12 -12.74C20.12 -11.61 20.34 -10.48 20.77 -9.42L34.5 24.92L-2.71 24.92L-0.59 18.56L6.67 16.14C7.83 15.74 8.62 14.64 8.62 13.4C8.62 12.16 7.83 11.07 6.67 10.67L-0.59 8.25L-3.02 0.99C-3.41 -0.16 -4.51 -0.95 -5.75 -0.95C-6.99 -0.95 -8.09 -0.16 -8.48 1.01L-10.91 8.27L-18.17 10.69C-19.33 11.09 -20.12 12.18 -20.12 13.42C-20.12 14.66 -19.33 15.76 -18.17 16.15L-10.91 18.58L-8.79 24.94L-34.5 24.94ZM4.24 -21.53C4.04 -22.12 3.5 -22.51 2.88 -22.51C2.25 -22.51 1.71 -22.12 1.51 -21.53L0.31 -17.9L-3.32 -16.69C-3.92 -16.5 -4.31 -15.96 -4.31 -15.33C-4.31 -14.7 -3.92 -14.16 -3.32 -13.96L0.31 -12.76L1.51 -9.13C1.71 -8.54 2.25 -8.14 2.88 -8.14C3.5 -8.14 4.04 -8.54 4.24 -9.13L5.44 -12.76L9.07 -13.96C9.67 -14.16 10.06 -14.7 10.06 -15.33C10.06 -15.96 9.67 -16.5 9.07 -16.69L5.44 -17.9ZM-40.25 33.55L40.25 33.55C43.43 33.55 46 36.12 46 39.3C46 42.48 43.43 45.05 40.25 45.05L-40.25 45.05C-43.43 45.05 -46 42.48 -46 39.3C-46 36.12 -43.43 33.55 -40.25 33.55",
  /**
   * A healer wand with a sun head on the diagonal: the Priest Class. The sun is
   * the Priest mark, and the rod keeps it apart from the Holy sun. Fill only:
   * the rays, the grip band and the knob have cut gaps, and a stroke closes them.
   */
  wand: "M-21.1 11.2 L3.1 -11.1 A12.5 12.5 0 1 1 11.1 -3.1 L-11.2 21.1 Z M-25.7 12.2 L-30 16.4 L-16.4 30 L-12.2 25.7 Z M-31.2 20.8 L-38.6 27.6 L-27.6 38.6 L-20.8 31.2 Z M-33.3 33.3 A7.2 7.2 0 1 1 -43.5 43.5 A7.2 7.2 0 1 1 -33.3 33.3 Z M32.5 -9.6 L46 -13.1 L46 -16.9 L32.5 -20.4 Z M24.3 0.5 L31.9 4.2 L34.2 1.9 L30.5 -5.7 Z M9.6 2.5 L13.1 16 L16.9 16 L20.4 2.5 Z M-2.5 -20.4 L-16 -16.9 L-16 -13.1 L-2.5 -9.6 Z M5.7 -30.5 L-1.9 -34.2 L-4.2 -31.9 L-0.5 -24.3 Z M20.4 -32.5 L16.9 -46 L13.1 -46 L9.6 -32.5 Z M30.5 -24.3 L34.2 -31.9 L31.9 -34.2 L24.3 -30.5 Z",
  /** A masonry wall: the Wall Keyword. Fill only: the mortar gaps are cut. */
  wall: masonry(),
  // Exposed (GDD 4.7): a shield that a zigzag crack splits in two.
  brokenShield:
    "M-6 -44 L-38 -32 Q-38 20 -6 46 L-1 24 L-12 8 L0 -8 L-10 -26 Z M6 -44 L38 -32 Q38 20 6 46 L11 24 L0 8 L12 -8 L2 -26 Z",
  // Grounded (GDD 4.7): an arrow that points down onto the ground.
  grounded: "M-8 -46 H8 V4 H26 L0 30 L-26 4 H-8 Z M-44 36 H44 V46 H-44 Z",
  // Onslaught: two swords that cross, for one more action.
  crossedSwords: crossedSwords(),
  // Steadfast (GDD 4.7): the Unit holds firm at 1 HP.
  anchor: `${circle(0, -36, 8)} M0 -28 V40 M-18 -14 H18 M-36 12 Q-34 40 0 40 Q34 40 36 12 M-44 20 L-36 12 L-28 20 M28 20 L36 12 L44 20`,
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
  /** A zigzag bolt: Lightning (ADR-0029) and Paralyzed. */
  bolt: "M10 -46 L-28 6 H-4 L-14 46 L28 -10 H4 L18 -46 Z",
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
  /** The Armor Gear: a breastplate with a ridge and a belt. Filled, so the grooves stay open. */
  breastplate:
    "M-24 -44 L-10 -40 Q0 -28 10 -40 L24 -44 L42 -30 L34 -14 Q30 -10 30 0 V26 Q14 46 0 46 Q-14 46 -30 26 V0 Q-30 -10 -34 -14 L-42 -30 Z M-2.5 -24 H2.5 V9 H-2.5 Z M-27 14 H27 V20 H-27 Z",
  /** The Trinket Gear: an amulet with a gem on a chain. Filled, so the ring stays open. */
  amulet: `M-34 -46 L-21 -46 L-3 -11 L-15 -9 Z M34 -46 L21 -46 L3 -11 L15 -9 Z ${circle(0, 19, 27)} ${circle(0, 19, 13)} M0 9 L9 19 L0 29 L-9 19 Z`,
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
  /**
   * A scroll with a roll at the top and the bottom and three lines of writing:
   * the Battle Log. Fill only: the lines are cut out of the sheet.
   */
  scroll:
    "M-33 -47 H33 A7 7 0 0 1 33 -33 H-33 A7 7 0 0 1 -33 -47 Z M-28 -30 H28 V31 H-28 Z M-18 -19 H18 V-13 H-18 Z M-18 -5 H18 V1 H-18 Z M-18 9 H6 V15 H-18 Z M-33 34 H33 A7 7 0 0 1 33 48 H-33 A7 7 0 0 1 -33 34 Z",
  /**
   * A Sweep Ticket: a ticket stub with a round notch in each end, a line of
   * holes to tear it, and a star. Fill only: the holes and the star are cut.
   */
  ticket:
    "M-40 -28 H40 Q46 -28 46 -22 V-8 A8 8 0 0 0 46 8 V22 Q46 28 40 28 H-40 Q-46 28 -46 22 V8 A8 8 0 0 0 -46 -8 V-22 Q-46 -28 -40 -28 Z M-23 -20 H-17 V-12 H-23 Z M-23 -4 H-17 V4 H-23 Z M-23 12 H-17 V20 H-23 Z M12 -15 L15.8 -5.2 L26.3 -4.6 L18.2 2.1 L20.8 12.1 L12 6.5 L3.2 12.1 L5.8 2.1 L-2.3 -4.6 L8.2 -5.2 Z",
  /** Play in the Battle Log. */
  play: "M-24 -38 L38 0 L-24 38 Z",
  pause: "M-32 -38 H-10 V38 H-32 Z M10 -38 H32 V38 H10 Z",
  /** One Log Entry forward. Mirrored, one back. */
  step: "M-36 -34 L16 0 L-36 34 Z M24 -34 H34 V34 H24 Z",
  lock: "M-0.336 -46.619c-15.83 0 -28.637 12.79 -28.637 28.595V-3.906h9.686v-13.495c0 -10.48 8.49 -18.982 18.951 -18.982c10.462 0 18.952 8.739 18.952 18.982V-3.906h9.686v-14.117c0 -15.402 -12.835 -28.595 -28.638 -28.595ZM-33.368 -0.256c-2.854 4.458 -4.462 9.599 -4.462 14.996c0 17.257 16.596 31.543 37.494 31.543c20.898 0 37.494 -14.286 37.494 -31.543c0 -5.397 -1.613 -10.537 -4.468 -14.996H-33.368ZM-0.391 4.419c4.363 0 7.983 3.504 7.983 7.867c0 3.273 -2.07 6.1 -4.907 7.3l6.391 19.165h-18.823l6.274 -19.165c-2.837 -1.2 -4.791 -4.027 -4.791 -7.3c0 -4.363 3.51 -7.867 7.873 -7.867Z",
} as const;

export type Glyph = keyof typeof GLYPHS;

/** Filled artwork. A stroke closes the cutouts. */
export const FILLED_GLYPHS: ReadonlySet<Glyph> = new Set([
  "breastplate",
  "amulet",
  "bow",
  "arrow",
  "hat",
  "wand",
  "warhelm",
  "lock",
  "skillCard",
  "wall",
  "scroll",
  "ticket",
]);

/**
 * How a Unit fights, for the icon on its card and its Board token (ADR-0030):
 * Flying, Wall, Ranged (Range 2 or more) or Melee.
 */
export type UnitIcon = "melee" | "ranged" | "wall" | "flying";

const ICON_GLYPH: Readonly<Record<UnitIcon, Glyph>> = {
  melee: "sword",
  ranged: "arrow",
  wall: "wall",
  flying: "wings",
};

const CLASS_GLYPH: Readonly<Record<ClassId, Glyph>> = {
  warrior: "warhelm",
  ranger: "bow",
  mage: "hat",
  priest: "wand",
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
  lightning: "bolt",
} as const satisfies Readonly<Record<DamageType, Glyph>>;

export const raceGlyph = (race: RaceId): Glyph => RACE_GLYPH[race];

export const unitIcon = (keywords: TokenKeywords): UnitIcon => {
  if (keywords.flying) {
    return "flying";
  }
  if (keywords.wall) {
    return "wall";
  }
  return isRangedRange(keywordRange(keywords)) ? "ranged" : "melee";
};

export const iconGlyph = (icon: UnitIcon): Glyph => ICON_GLYPH[icon];

export const classGlyph = (classId: ClassId): Glyph => CLASS_GLYPH[classId];

/** The icon of a card: how its Unit fights, and the effect for a Skill Card. */
export const cardGlyph = (card: CardDefinition): Glyph => {
  if (card.kind === "creature") {
    return ICON_GLYPH[unitIcon(card.keywords)];
  }
  if (card.effect.type === "damageHero") {
    return "crossedSwords";
  }
  // Each damage effect shows its Damage Type.
  if ("damageType" in card.effect) {
    return DAMAGE_GLYPH[card.effect.damageType];
  }
  switch (card.effect.type) {
    case "healUnit":
    case "healLane": {
      return "heart";
    }
    case "cleanseUnit": {
      return "heart";
    }
    case "wardUnit":
    case "wardLane":
    case "laneBulwark": {
      return "shield";
    }
    case "steadfastUnit": {
      return "anchor";
    }
    case "exposeUnit": {
      return "brokenShield";
    }
    case "laneAttack": {
      return "horn";
    }
    case "unitAttackRange": {
      return "range";
    }
    case "laneExtraAction": {
      return "crossedSwords";
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
 * The icon of a Token: wings for Flying, else its Race (Card Concepts 8).
 */
export const tokenGlyph = (token: TokenDefinition): Glyph =>
  token.keywords.flying ? "wings" : RACE_GLYPH[token.race];
