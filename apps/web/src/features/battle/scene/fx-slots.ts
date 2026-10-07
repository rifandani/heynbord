import { FX_ANCHORS } from "@/features/battle/palette";

/**
 * The slot table of the effects atlas, with no `three` import, so the DOM
 * (the Details Panel) can show an atlas icon outside the 3D scene chunk.
 */

/** The width and the height of the effects atlas, in px. */
export const FX_ATLAS_SIZE = 2048;

/** The painted effects atlas (#12), under `public/`. */
export const FX_ATLAS_URL = "/battle/fx-atlas.webp";

/** A rectangle in the atlas, in px from the top left corner. */
export interface FxCell {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * One key image in the effects atlas (web ADR-0009).
 * - `additive` images are light only. `alpha` images can have dark lines.
 * - `code` images are white or light grey, and the code gives the color.
 *   `fixed` images are in full color, with their middle tone on `anchor`.
 */
export type FxSlot = {
  readonly cell: FxCell;
  readonly blend: "additive" | "alpha";
} & (
  | { readonly tint: "code"; readonly anchor: null }
  | { readonly tint: "fixed"; readonly anchor: string }
);

const cell = (x: number, y: number, w: number, h = w): FxCell => ({
  x,
  y,
  w,
  h,
});

const code = (at: FxCell, blend: FxSlot["blend"]): FxSlot => ({
  cell: at,
  blend,
  tint: "code",
  anchor: null,
});

const fixed = (at: FxCell, blend: FxSlot["blend"], anchor: string): FxSlot => ({
  cell: at,
  blend,
  tint: "fixed",
  anchor,
});

/**
 * The slot table of the effects atlas: the source of truth for the code, the
 * placeholders and the pack script of the painted atlas (#12). The code uses
 * only the slot names, so the art can change with no code change. The row at
 * y = 1536 and the rest of the cell at (1536, 1024) are free for new slots.
 */
export const FX_SLOTS = {
  glow: code(cell(0, 0, 512), "additive"),
  burst: code(cell(512, 0, 512), "additive"),
  slash: code(cell(1024, 0, 512), "alpha"),
  flare: fixed(cell(1536, 0, 512), "additive", FX_ANCHORS.holy),
  "rune-ring": code(cell(0, 512, 512), "additive"),
  flame: fixed(cell(512, 512, 512), "additive", FX_ANCHORS.fire),
  vine: fixed(cell(1024, 512, 512), "alpha", FX_ANCHORS.vine),
  chain: fixed(cell(1536, 512, 512), "alpha", FX_ANCHORS.chain),
  shield: fixed(cell(0, 1024, 512), "alpha", FX_ANCHORS.shield),
  spark: code(cell(512, 1024, 256), "additive"),
  ember: fixed(cell(768, 1024, 256), "additive", FX_ANCHORS.fire),
  "frost-shard": fixed(cell(512, 1280, 256), "alpha", FX_ANCHORS.frost),
  "frost-mote": fixed(cell(768, 1280, 256), "alpha", FX_ANCHORS.frost),
  bubble: fixed(cell(1024, 1024, 256), "alpha", FX_ANCHORS.poison),
  drip: fixed(cell(1280, 1024, 256), "alpha", FX_ANCHORS.blood),
  dust: fixed(cell(1024, 1280, 256), "alpha", FX_ANCHORS.dust),
  heal: code(cell(1280, 1280, 256), "additive"),
  trail: code(cell(1536, 1024, 512, 128), "additive"),
  "icon-burn": fixed(cell(1536, 1152, 128), "alpha", FX_ANCHORS.iconBurn),
  "icon-freeze": fixed(cell(1664, 1152, 128), "alpha", FX_ANCHORS.iconFreeze),
  "icon-poison": fixed(cell(1792, 1152, 128), "alpha", FX_ANCHORS.iconPoison),
  "icon-entangle": fixed(
    cell(1920, 1152, 128),
    "alpha",
    FX_ANCHORS.iconEntangle
  ),
  "icon-hobble": fixed(cell(1536, 1280, 128), "alpha", FX_ANCHORS.iconHobble),
  "icon-bleed": fixed(cell(1664, 1280, 128), "alpha", FX_ANCHORS.iconBleed),
} as const satisfies Readonly<Record<string, FxSlot>>;

export type FxSlotName = keyof typeof FX_SLOTS;

/** All slot names, in the order of the table. */
export const fxSlotNames = (): FxSlotName[] =>
  // SAFETY: `FX_SLOTS` is a literal object, so its keys are exactly `FxSlotName`.
  Object.keys(FX_SLOTS) as FxSlotName[];
