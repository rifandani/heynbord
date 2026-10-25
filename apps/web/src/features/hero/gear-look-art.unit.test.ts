import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { CosmeticId } from "@workspace/rules";
import { BAZAAR_COSMETICS, GEAR_SLOTS } from "@workspace/rules";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  gearIconArt,
  gearLookArt,
  hasGearLookArt,
  UNPAINTED_GEAR_LOOK_ART,
} from "./gear-look-art";
import { heroArt } from "./hero-art";

const PUBLIC = new URL("../../../public/", import.meta.url);
const GEAR_LOOKS = new URL("gear-looks/", PUBLIC);

/** The Gear looks of the Bazaar, in catalog order (Economy 3.5). */
const looks = BAZAAR_COSMETICS.filter((item) => item.family === "gearLook");

/** The painted icons of all Gear looks, as paths under `public/`. */
const paintedIcons = (): readonly string[] =>
  looks.flatMap((item) =>
    GEAR_SLOTS.map((slot) => gearLookArt(item.id, slot)).filter(
      (art): art is string => art !== null
    )
  );

describe("Gear look art (Gear Look Concepts 2)", () => {
  it("has one entry for each Gear look", () => {
    for (const item of looks) {
      expect(
        hasGearLookArt(item.id) || UNPAINTED_GEAR_LOOK_ART.has(item.id),
        item.id
      ).toBe(true);
    }
  });

  it("marks only Gear looks as unpainted", () => {
    const ids = new Set(looks.map((item) => item.id));
    for (const id of UNPAINTED_GEAR_LOOK_ART) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("has a 256 × 256 WebP icon for each Gear item of each painted look", async () => {
    const lines = await Promise.all(
      paintedIcons().map(async (art) => {
        const file = fileURLToPath(new URL(art.slice(1), PUBLIC));
        if (!existsSync(file)) {
          return `${art} missing`;
        }
        const { format, width, height, hasAlpha } =
          await sharp(file).metadata();
        return `${art} ${format} ${width} × ${height}${hasAlpha ? "" : " opaque"}`;
      })
    );
    expect(lines.filter((line) => !line.endsWith(" webp 256 × 256"))).toEqual(
      []
    );
  });

  it("has no file that no Gear look uses", () => {
    if (!existsSync(GEAR_LOOKS)) {
      return;
    }
    const used = new Set(paintedIcons().map((art) => art.slice(1)));
    const files = readdirSync(GEAR_LOOKS, { recursive: true })
      .map((file) => `gear-looks/${String(file)}`)
      .filter((file) => file.endsWith(".webp"));
    expect(files.filter((file) => !used.has(file))).toEqual([]);
  });
});

describe("gearIconArt (web ADR-0013)", () => {
  it("shows the Standard kit when no Gear look is Active", () => {
    for (const slot of GEAR_SLOTS) {
      expect(gearIconArt(null, slot)).toBe(heroArt(slot));
    }
  });

  it("shows the icons of a painted look, and the Standard kit for an unpainted one", () => {
    for (const item of looks) {
      for (const slot of GEAR_SLOTS) {
        expect(gearIconArt(item.id, slot)).toBe(
          hasGearLookArt(item.id) ? gearLookArt(item.id, slot) : heroArt(slot)
        );
      }
    }
  });

  it("shows the Standard kit for a look that is marked unpainted", () => {
    // SAFETY: the set is a `Set` at run time. The test removes its entry again.
    const unpainted = UNPAINTED_GEAR_LOOK_ART as Set<CosmeticId>;
    unpainted.add("gearLook.copperRim");
    try {
      expect(gearLookArt("gearLook.copperRim", "armor")).toBeNull();
      expect(hasGearLookArt("gearLook.copperRim")).toBe(false);
      expect(gearIconArt("gearLook.copperRim", "armor")).toBe(heroArt("armor"));
    } finally {
      unpainted.delete("gearLook.copperRim");
    }
    expect(gearLookArt("gearLook.copperRim", "armor")).toBe(
      "/gear-looks/copper-rim/armor.webp"
    );
  });

  it("has no icons for a Cosmetic that is not a Gear look", () => {
    expect(gearLookArt("heroPortrait.dawnGaze", "weapon")).toBeNull();
    expect(gearIconArt("heroPortrait.dawnGaze", "weapon")).toBe(
      heroArt("weapon")
    );
  });
});
