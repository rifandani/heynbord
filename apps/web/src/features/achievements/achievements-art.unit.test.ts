import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ACHIEVEMENTS_ART_FILE,
  achievementsArt,
  UNPAINTED_ACHIEVEMENTS_ART,
} from "@/features/achievements/achievements-art";
import type { AchievementsArt } from "@/features/achievements/achievements-art";

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

describe("achievementsArt", () => {
  it("uses each painting whose WebP file exists, and the code fallback for the others", () => {
    // SAFETY: the keys of `ACHIEVEMENTS_ART_FILE` are exactly the `AchievementsArt` ids (its Record type).
    for (const art of Object.keys(ACHIEVEMENTS_ART_FILE) as AchievementsArt[]) {
      expect(achievementsArt(art) === null, art).toBe(
        UNPAINTED_ACHIEVEMENTS_ART.has(art)
      );
      expect(publicFile(ACHIEVEMENTS_ART_FILE[art]), art).toBe(
        !UNPAINTED_ACHIEVEMENTS_ART.has(art)
      );
    }
  });
});
