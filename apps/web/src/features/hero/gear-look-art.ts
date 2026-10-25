import type { CosmeticId, GearSlot } from "@workspace/rules";

import { heroArt } from "@/features/hero/hero-art";

/**
 * The folder of each Gear look (Economy 3.5, Gear Look Concepts 2): 4 WebP
 * icons of 256 × 256 in `public/gear-looks/<file>/`, one for each Gear item
 * and named after its slot. The Hero screen shows them on the Gear plates in
 * place of the Standard kit (web ADR-0013).
 */
const GEAR_LOOK_ART_DIR: Partial<Record<CosmeticId, string>> = {
  "gearLook.copperRim": "/gear-looks/copper-rim",
  "gearLook.ironVine": "/gear-looks/iron-vine",
  "gearLook.stagLeather": "/gear-looks/stag-leather",
  "gearLook.goldInlay": "/gear-looks/gold-inlay",
  "gearLook.moonstone": "/gear-looks/moonstone",
  "gearLook.royalPlate": "/gear-looks/royal-plate",
};

/**
 * The Gear looks that a person has not painted yet. Each one shows the
 * Standard kit, and the Bazaar does not offer it. Remove an ID when its 4
 * WebP files are in `public/gear-looks/`: a unit test checks the files.
 */
export const UNPAINTED_GEAR_LOOK_ART: ReadonlySet<CosmeticId> =
  new Set<CosmeticId>();

/** The painted icon of one Gear item in a Gear look, or `null` while the look is not painted. */
export const gearLookArt = (id: CosmeticId, slot: GearSlot): string | null => {
  const dir = UNPAINTED_GEAR_LOOK_ART.has(id)
    ? undefined
    : GEAR_LOOK_ART_DIR[id];
  return dir === undefined ? null : `${dir}/${slot}.webp`;
};

/** True when the 4 icons of the Gear look are painted. */
export const hasGearLookArt = (id: CosmeticId): boolean =>
  gearLookArt(id, "weapon") !== null;

/**
 * The icon of a Gear item in a look: the icon of the Gear look, or the
 * Standard kit icon for `null` and for a look with no painted icons. It is
 * `null` while the Standard kit icon shows its code fallback.
 */
export const gearIconArt = (
  look: CosmeticId | null,
  slot: GearSlot
): string | null =>
  (look === null ? null : gearLookArt(look, slot)) ?? heroArt(slot);
