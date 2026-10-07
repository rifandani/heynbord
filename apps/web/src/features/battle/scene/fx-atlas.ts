import type { Texture } from "three";
import { SRGBColorSpace, Texture as ImageTexture } from "three";

import { FX_ANCHORS } from "@/features/battle/palette";
import type { BadgeIcon } from "@/features/battle/scene/textures";
import { fxPlaceholderAtlas } from "@/features/battle/scene/textures";

/** The width and the height of the effects atlas, in px. */
export const FX_ATLAS_SIZE = 2048;

/** The painted effects atlas (#12), under `public/`. */
const FX_ATLAS_URL = "/battle/fx-atlas.webp";

/**
 * True when `FX_ATLAS_URL` is in `public/`. Until then the effects use the
 * canvas placeholders, with no request for the missing file.
 */
const FX_ATLAS_PAINTED = false;

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

/** A rectangle in texture space: 0 to 1, with V up from the bottom (`flipY`). */
export interface FxUv {
  readonly u: number;
  readonly v: number;
  readonly width: number;
  readonly height: number;
}

/** The UV rectangle of a slot in the atlas texture. */
export const fxSlotUv = (name: FxSlotName): FxUv => {
  const { x, y, w, h } = FX_SLOTS[name].cell;
  return {
    u: x / FX_ATLAS_SIZE,
    v: 1 - (y + h) / FX_ATLAS_SIZE,
    width: w / FX_ATLAS_SIZE,
    height: h / FX_ATLAS_SIZE,
  };
};

/** The atlas that the effects use now: the placeholders, then the painted atlas. */
export interface FxAtlas {
  readonly image: HTMLCanvasElement | HTMLImageElement;
  readonly texture: Texture;
  /** It changes when the painted atlas replaces the placeholders. */
  readonly version: number;
}

let atlas: FxAtlas | undefined;

const atlasListeners = new Set<() => void>();

/**
 * Calls `listener` when the painted atlas replaces the placeholders, so a
 * Status Badge draws its icons again. Returns the function that stops it.
 */
export const subscribeFxAtlas = (listener: () => void): (() => void) => {
  atlasListeners.add(listener);
  return () => {
    atlasListeners.delete(listener);
  };
};

const loadPainted = async () => {
  const image = new Image();
  image.decoding = "async";
  image.src = FX_ATLAS_URL;
  try {
    await image.decode();
  } catch {
    // The effects keep the placeholders.
    return;
  }
  const texture = new ImageTexture(image);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  atlas = { image, texture, version: (atlas?.version ?? 0) + 1 };
  for (const listener of atlasListeners) {
    listener();
  }
};

/**
 * The effects atlas. The first call draws the placeholders and starts the
 * load of the painted atlas, once for the Battle. The UV rectangles are the
 * same for both, because the placeholders use the same slot table.
 */
export const fxAtlas = (): FxAtlas => {
  if (atlas) {
    return atlas;
  }
  const texture = fxPlaceholderAtlas(
    fxSlotNames().map((name) => ({ name, cell: FX_SLOTS[name].cell })),
    FX_ATLAS_SIZE
  );
  // SAFETY: `fxPlaceholderAtlas` draws on a canvas element.
  const image = texture.image as HTMLCanvasElement;
  atlas = { image, texture, version: 0 };
  if (FX_ATLAS_PAINTED) {
    void loadPainted();
  }
  return atlas;
};

/** The image and the cell of a slot in the atlas now, in px of that image. */
export const fxSlotIcon = (current: FxAtlas, name: FxSlotName): BadgeIcon => {
  const { x, y, w } = FX_SLOTS[name].cell;
  const scale = current.image.width / FX_ATLAS_SIZE;
  return { image: current.image, x: x * scale, y: y * scale, size: w * scale };
};
