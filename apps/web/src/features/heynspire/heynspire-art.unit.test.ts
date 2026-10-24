import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  HEYNSPIRE_ART_FILE,
  heynspireArt,
  UNPAINTED_HEYNSPIRE_ART,
} from "@/features/heynspire/heynspire-art";
import type { HeynspireArt } from "@/features/heynspire/heynspire-art";

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

describe("heynspireArt", () => {
  it("uses each painting whose WebP file exists, and the fallback for the others", () => {
    // SAFETY: the keys of `HEYNSPIRE_ART_FILE` are exactly the `HeynspireArt` ids (its Record type).
    for (const art of Object.keys(HEYNSPIRE_ART_FILE) as HeynspireArt[]) {
      expect(heynspireArt(art) === null, art).toBe(
        UNPAINTED_HEYNSPIRE_ART.has(art)
      );
      expect(publicFile(HEYNSPIRE_ART_FILE[art]), art).toBe(
        !UNPAINTED_HEYNSPIRE_ART.has(art)
      );
    }
  });

  it("shows the fallback for an art that is marked unpainted", () => {
    // SAFETY: the set is a `Set` at run time. The test removes its entry again.
    const unpainted = UNPAINTED_HEYNSPIRE_ART as Set<HeynspireArt>;
    unpainted.add("sky");
    try {
      expect(heynspireArt("sky")).toBeNull();
      expect(heynspireArt("storey")).toBe(HEYNSPIRE_ART_FILE.storey);
    } finally {
      unpainted.delete("sky");
    }
    expect(heynspireArt("sky")).toBe(HEYNSPIRE_ART_FILE.sky);
  });
});
