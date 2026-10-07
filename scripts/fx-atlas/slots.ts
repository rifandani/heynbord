import { existsSync } from "node:fs";
import path from "node:path";

import type {
  FxCell,
  FxSlotName,
} from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import {
  FX_SLOTS,
  fxSlotNames,
} from "../../apps/web/src/features/battle/scene/fx-atlas.ts";

/** The repository root, so the scripts work from any directory. */
export const ROOT = path.join(import.meta.dirname, "../..");

/** The committed masters: one PNG for each slot, at the size of its cell (#12). */
export const FX_DIR = path.join(ROOT, "apps/web/art/fx");

/** The images from ChatGPT, the style reference, the prompts and the contact sheet. Git ignores it. */
export const RAW_DIR = path.join(FX_DIR, "raw");

export const ATLAS_PATH = path.join(
  ROOT,
  "apps/web/public/battle/fx-atlas.webp"
);

export const masterPath = (name: FxSlotName): string =>
  path.join(FX_DIR, `${name}.png`);

const RAW_EXTENSIONS = ["png", "webp", "jpg", "jpeg"] as const;

/** The raw image of a slot from ChatGPT, or `null` if it is not saved yet. */
export const findRaw = (name: FxSlotName): string | null =>
  RAW_EXTENSIONS.map((extension) =>
    path.join(RAW_DIR, `${name}.${extension}`)
  ).find((file) => existsSync(file)) ?? null;

/** The empty band on each side of an image: the cell size ÷ 16 on each axis (#12). */
export const bandOf = (cell: FxCell) => ({ x: cell.w / 16, y: cell.h / 16 });

/** The background of a generated image. Additive slots are light on black. */
export type Background = "black" | "transparent";

export const hexToRgb = (hex: string): readonly [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  // oxlint-disable-next-line no-bitwise -- unpacks the 3 bytes of a hex color
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export const backgroundOf = (name: FxSlotName): Background =>
  FX_SLOTS[name].blend === "additive" ? "black" : "transparent";

/** The slot names from the command line, or all slots. Fails for an unknown name. */
export const slotsFromArgs = (args: readonly string[]): FxSlotName[] => {
  const names = args.filter((arg) => !arg.startsWith("--"));
  if (names.length === 0) {
    return fxSlotNames();
  }
  const known = new Set<string>(fxSlotNames());
  const unknown = names.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new Error(`Unknown slots: ${unknown.join(", ")}`);
  }
  // SAFETY: each name is in `fxSlotNames()`.
  return names as FxSlotName[];
};
