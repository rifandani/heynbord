import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  DUNGEON_ART_FILE,
  dungeonArt,
  UNPAINTED_DUNGEON_ART,
} from "@/features/dungeons/dungeon-art";
import type { DungeonArt } from "@/features/dungeons/dungeon-art";

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

describe("dungeonArt", () => {
  it("uses each painting whose WebP file exists, and the code fallback for the others", () => {
    // SAFETY: the keys of `DUNGEON_ART_FILE` are exactly the `DungeonArt` ids (its Record type).
    for (const art of Object.keys(DUNGEON_ART_FILE) as DungeonArt[]) {
      expect(dungeonArt(art) === null, art).toBe(
        UNPAINTED_DUNGEON_ART.has(art)
      );
      expect(publicFile(DUNGEON_ART_FILE[art]), art).toBe(
        !UNPAINTED_DUNGEON_ART.has(art)
      );
    }
  });
});
