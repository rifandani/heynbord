import type { Texture } from "three";
import { CanvasTexture, SRGBColorSpace } from "three";

import { loadBattleImage } from "@/features/battle/battle-preload";
import {
  FX_ATLAS_SIZE,
  FX_ATLAS_URL,
  FX_SLOTS,
  fxSlotNames,
  UNPAINTED_SLOTS,
} from "@/features/battle/scene/fx-slots";
import { fxPlaceholderAtlas } from "@/features/battle/scene/textures";

export type {
  FxCell,
  FxSlot,
  FxSlotName,
} from "@/features/battle/scene/fx-slots";
export {
  FX_ATLAS_SIZE,
  FX_SLOTS,
  fxSlotIcon,
  fxSlotNames,
  fxSlotUv,
} from "@/features/battle/scene/fx-slots";

/**
 * True when `FX_ATLAS_URL` is in `public/`. Until then the effects use the
 * canvas placeholders, with no request for the missing file.
 */
const FX_ATLAS_PAINTED = true;

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

/**
 * The painted atlas with the placeholders of the slots that it does not have
 * yet (`UNPAINTED_SLOTS`) drawn over their empty cells.
 */
const withPlaceholders = (
  painted: HTMLImageElement,
  placeholders: HTMLCanvasElement
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = painted.naturalWidth;
  canvas.height = painted.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return canvas;
  }
  context.drawImage(painted, 0, 0);
  const to = canvas.width / FX_ATLAS_SIZE;
  const from = placeholders.width / FX_ATLAS_SIZE;
  for (const name of UNPAINTED_SLOTS) {
    const { x, y, w, h } = FX_SLOTS[name].cell;
    context.drawImage(
      placeholders,
      x * from,
      y * from,
      w * from,
      h * from,
      x * to,
      y * to,
      w * to,
      h * to
    );
  }
  return canvas;
};

const loadPainted = async (placeholders: HTMLCanvasElement) => {
  let painted: HTMLImageElement;
  try {
    painted = await loadBattleImage(FX_ATLAS_URL);
  } catch {
    // The effects keep the placeholders.
    return;
  }
  const image = withPlaceholders(painted, placeholders);
  const texture = new CanvasTexture(image);
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
    void loadPainted(image);
  }
  return atlas;
};
