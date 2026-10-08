import { useId } from "react";

import { FILLED_GLYPHS, GLYPHS, roleGlyph } from "@/features/battle/glyphs";
import type { Glyph } from "@/features/battle/glyphs";
import type {
  Diagram,
  DiagramArrow,
  DiagramSide,
  DiagramUnit,
  DiagramZone,
} from "@/features/handbook/handbook-diagrams";

/** The size of a Square, the space between Squares, and the place of each Hero. */
const SQUARE = 40;
const GAP = 4;
const LANE_GAP = 8;
const HERO = 34;
const PAD = 6;
/** The space above the top Lane for the arcs of Flying and of a hit. */
const SKY = 26;

const INK = "#2a1d12";
/** The token colors of a Side: the player gold and the enemy red (DESIGN.md, Side). */
interface SideColors {
  readonly face: string;
  readonly rim: string;
  readonly mark: string;
}

const SIDE: Readonly<Record<DiagramSide, SideColors>> = {
  player: { face: "#f2c14e", rim: "#7a5310", mark: "#2a1a05" },
  enemy: { face: "#d9463b", rim: "#6b1610", mark: "#fff6df" },
};

/** The tint of a zone. Columns that only a Wall can use have a hatch. */
const zoneFill = (zone: DiagramZone, hatch: string): string => {
  if (zone.kind === "extra") {
    return `url(#${hatch})`;
  }
  if (zone.kind === "range") {
    return "rgba(255,243,209,0.95)";
  }
  return zone.side === "player"
    ? "rgba(255,215,90,0.55)"
    : "rgba(217,70,59,0.3)";
};

const columnX = (column: number) =>
  PAD + HERO + GAP + (column - 1) * (SQUARE + GAP) + SQUARE / 2;

const laneY = (lane: number) => SKY + lane * (SQUARE + LANE_GAP) + SQUARE / 2;

/** The x of an arrow end: column 0 and the column after the last are the Heroes. */
const endX = (column: number, columns: number) => {
  if (column <= 0) {
    return PAD + HERO / 2;
  }
  if (column > columns) {
    return columnX(columns) + SQUARE / 2 + GAP + HERO / 2;
  }
  return columnX(column);
};

const Squares = ({ diagram }: { readonly diagram: Diagram }) => (
  <>
    {Array.from({ length: diagram.lanes }, (_, lane) =>
      Array.from({ length: diagram.columns }, (__, index) => (
        <rect
          key={`${lane}:${index}`}
          x={columnX(index + 1) - SQUARE / 2}
          y={laneY(lane) - SQUARE / 2}
          width={SQUARE}
          height={SQUARE}
          rx={5}
          fill="#ead9b4"
          stroke="#c9b48c"
          strokeWidth={1.5}
        />
      ))
    )}
  </>
);

const Zones = ({
  diagram,
  hatch,
}: {
  readonly diagram: Diagram;
  /** The hatch of the Columns that only a Wall can use. */
  readonly hatch: string;
}) => (
  <>
    {diagram.zones.flatMap((zone) =>
      Array.from({ length: diagram.lanes }, (_, lane) => (
        <rect
          key={`${zone.kind}:${zone.from}:${lane}`}
          x={columnX(zone.from) - SQUARE / 2}
          y={laneY(lane) - SQUARE / 2}
          width={(zone.to - zone.from) * (SQUARE + GAP) + SQUARE}
          height={SQUARE}
          rx={5}
          fill={zoneFill(zone, hatch)}
          stroke={zone.kind === "range" ? INK : "none"}
          strokeDasharray={zone.kind === "range" ? "4 4" : undefined}
          strokeOpacity={0.55}
          strokeWidth={1.5}
        />
      ))
    )}
  </>
);

/** A glyph of the shared set at a point of the strip. */
const GlyphPath = ({
  glyph,
  cx,
  cy,
  size,
  color,
}: {
  readonly glyph: Glyph;
  readonly cx: number;
  readonly cy: number;
  readonly size: number;
  readonly color: string;
}) => {
  const filled = FILLED_GLYPHS.has(glyph);
  return (
    <path
      d={GLYPHS[glyph]}
      transform={`translate(${cx} ${cy}) scale(${size / 108})`}
      fill={color}
      fillRule="evenodd"
      stroke={filled ? "none" : color}
      strokeWidth={filled ? 0 : 6}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
};

/** A Hero at the end of all Lanes: a plate in the color of its Side, with a crown. */
const Hero = ({
  side,
  diagram,
}: {
  readonly side: DiagramSide;
  readonly diagram: Diagram;
}) => {
  const top = laneY(0) - SQUARE / 2;
  const height = laneY(diagram.lanes - 1) + SQUARE / 2 - top;
  const x =
    side === "player"
      ? PAD
      : endX(diagram.columns + 1, diagram.columns) - HERO / 2;
  const colors = SIDE[side];
  return (
    <g>
      <rect
        x={x}
        y={top}
        width={HERO}
        height={height}
        rx={8}
        fill={colors.face}
        stroke={colors.rim}
        strokeWidth={2.5}
      />
      <GlyphPath
        glyph="crown"
        cx={x + HERO / 2}
        cy={top + height / 2}
        size={22}
        color={colors.mark}
      />
    </g>
  );
};

const unitGlyph = (unit: DiagramUnit): Glyph =>
  unit.role === "flying" ? "wings" : roleGlyph(unit.role);

/** A Unit as a round token in the color of its Side, with its Role icon. */
const Unit = ({ unit }: { readonly unit: DiagramUnit }) => {
  const cx = columnX(unit.column);
  const cy = laneY(unit.lane);
  const colors = SIDE[unit.side];
  return (
    <g opacity={unit.falls ? 0.55 : 1}>
      <circle cx={cx} cy={cy + 2} r={15} fill="rgba(0,0,0,0.3)" />
      <circle
        cx={cx}
        cy={cy}
        r={15}
        fill={colors.face}
        stroke={colors.rim}
        strokeWidth={2.5}
      />
      <GlyphPath
        glyph={unitGlyph(unit)}
        cx={cx}
        cy={cy}
        size={19}
        color={colors.mark}
      />
      {unit.falls ? (
        <path
          d={`M${cx - 11} ${cy - 11} L${cx + 11} ${cy + 11} M${cx + 11} ${cy - 11} L${cx - 11} ${cy + 11}`}
          stroke="#6b1610"
          strokeWidth={4}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
};

/** An enemy hit is an arc under the Units. */
const arrowBelow = (arrow: DiagramArrow) =>
  arrow.side === "enemy" && arrow.kind === "attack";

/** The path of an arrow: a line under the Units, or an arc over them. */
const arrowPath = (arrow: DiagramArrow, columns: number) => {
  const x1 = endX(arrow.from, columns);
  const x2 = endX(arrow.to, columns);
  const y = laneY(arrow.lane);
  const toward = Math.sign(x2 - x1);
  switch (arrow.kind) {
    case "move":
    case "blocked": {
      const low = y + SQUARE / 2 - 5;
      return `M${x1} ${low} L${x2 - toward * 6} ${low}`;
    }
    case "push": {
      const low = y + SQUARE / 2 - 5;
      return `M${x1 + toward * 10} ${low} L${x2 - toward * 4} ${low}`;
    }
    default: {
      // A hit or a flight: an arc from one Unit to the other. An enemy hit
      // goes under the Units, so that it never covers a hit of the player.
      const up = arrowBelow(arrow) ? -1 : 1;
      const lift = arrow.kind === "fly" ? SQUARE * 0.95 : SQUARE * 0.7;
      const start = x1 + toward * 6;
      const end = x2 - toward * 6;
      const edge = y - up * 14;
      return `M${start} ${edge} Q${(start + end) / 2} ${edge - up * lift} ${end} ${edge - up * 2}`;
    }
  }
};

const ARROW_COLOR: Readonly<
  Record<DiagramArrow["kind"], (side: DiagramSide) => string>
> = {
  move: () => INK,
  blocked: () => INK,
  summon: () => INK,
  fly: () => INK,
  attack: (side) => SIDE[side].rim,
  push: (side) => SIDE[side].rim,
  spill: (side) => SIDE[side].rim,
};

const DASHED: ReadonlySet<DiagramArrow["kind"]> = new Set([
  "summon",
  "spill",
  "fly",
]);

/** The end of a blocked Movement: a short bar across the Lane. */
const Bar = ({
  arrow,
  columns,
}: {
  readonly arrow: DiagramArrow;
  readonly columns: number;
}) => {
  const x = endX(arrow.to, columns) + Math.sign(arrow.from - arrow.to) * 4;
  const y = laneY(arrow.lane) + SQUARE / 2 - 5;
  return (
    <path
      d={`M${x} ${y - 7} L${x} ${y + 7}`}
      stroke={INK}
      strokeWidth={3.5}
      strokeLinecap="round"
    />
  );
};

/** The arrows that put a Unit in another Square. */
const MOVES: ReadonlySet<DiagramArrow["kind"]> = new Set([
  "move",
  "fly",
  "push",
  "blocked",
]);

/** A Unit that moves or is pushed: a dashed ring in the Square where it stops. */
const Ghost = ({ arrow }: { readonly arrow: DiagramArrow }) => (
  <circle
    cx={columnX(arrow.to)}
    cy={laneY(arrow.lane)}
    r={15}
    fill="none"
    stroke={INK}
    strokeOpacity={0.6}
    strokeWidth={2}
    strokeDasharray="4 3"
  />
);

const Arrow = ({
  arrow,
  columns,
  marker,
}: {
  readonly arrow: DiagramArrow;
  readonly columns: number;
  readonly marker: (color: string) => string;
}) => {
  const color = ARROW_COLOR[arrow.kind](arrow.side);
  return (
    <g opacity={arrow.faint ? 0.4 : 1}>
      {MOVES.has(arrow.kind) ? <Ghost arrow={arrow} /> : null}
      <path
        d={arrowPath(arrow, columns)}
        fill="none"
        stroke={color}
        strokeWidth={arrow.kind === "push" ? 4 : 3}
        strokeLinecap="round"
        strokeDasharray={
          DASHED.has(arrow.kind) || arrow.faint ? "6 5" : undefined
        }
        markerEnd={
          arrow.kind === "blocked" ? undefined : `url(#${marker(color)})`
        }
      />
      {arrow.kind === "blocked" ? (
        <Bar arrow={arrow} columns={columns} />
      ) : null}
    </g>
  );
};

const ARROW_COLORS = [INK, SIDE.player.rim, SIDE.enemy.rim];

/**
 * A Lane strip diagram (issue #25): Squares, Units as Role icons, and arrows,
 * drawn in code. It has no text, so it works in each Locale; the Entry text
 * explains it, and a screen reader skips it.
 */
export const LaneStrip = ({ diagram }: { readonly diagram: Diagram }) => {
  const id = useId().replaceAll(":", "");
  const marker = (color: string) => `${id}-head-${ARROW_COLORS.indexOf(color)}`;
  const width = endX(diagram.columns + 1, diagram.columns) + HERO / 2 + PAD;
  const below = diagram.arrows.some(arrowBelow) ? SKY : 0;
  const height = laneY(diagram.lanes - 1) + SQUARE / 2 + PAD + below;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      aria-hidden
      data-testid="handbook-diagram"
    >
      <defs>
        {ARROW_COLORS.map((color, index) => (
          <marker
            key={color}
            id={`${id}-head-${index}`}
            viewBox="0 0 10 10"
            refX={6}
            refY={5}
            markerWidth={4}
            markerHeight={4}
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill={color} />
          </marker>
        ))}
        <pattern
          id={`${id}-extra`}
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={8} height={8} fill="rgba(255,215,90,0.22)" />
          <rect width={3} height={8} fill="rgba(226,169,59,0.55)" />
        </pattern>
      </defs>
      <Squares diagram={diagram} />
      <Zones diagram={diagram} hatch={`${id}-extra`} />
      <Hero side="player" diagram={diagram} />
      <Hero side="enemy" diagram={diagram} />
      {diagram.units.map((unit) => (
        <Unit key={`${unit.lane}:${unit.column}`} unit={unit} />
      ))}
      {diagram.arrows.map((arrow) => (
        <Arrow
          key={`${arrow.kind}:${arrow.lane}:${arrow.from}:${arrow.to}`}
          arrow={arrow}
          columns={diagram.columns}
          marker={marker}
        />
      ))}
    </svg>
  );
};
