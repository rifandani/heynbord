import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { BAZAAR_COSMETICS } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { heroModelUrl } from "@/features/hero/hero-model-assets";

const ROOT = path.resolve(import.meta.dirname, "../../../../..");
const MODELS = path.join(ROOT, "apps/web/public/models/heroes");
/** The accepted complete-appearance ceiling, before HTTP compression. */
const APPEARANCE_CEILING = 10_000_000;

interface SizeReport {
  readonly totalBytes: number;
  readonly minBytes: number;
  readonly maxBytes: number;
  readonly rows: readonly {
    readonly file: string;
    readonly bytes: number;
  }[];
}

const report: SizeReport = JSON.parse(
  readFileSync(
    path.join(ROOT, "docs/game/hero-model-sizes-2026-10-31.json"),
    "utf-8"
  )
);

const portraits = [
  null,
  ...BAZAAR_COSMETICS.filter((item) => item.family === "heroPortrait").map(
    (item) => item.id
  ),
];
const gearLooks = [
  null,
  ...BAZAAR_COSMETICS.filter((item) => item.family === "gearLook").map(
    (item) => item.id
  ),
];

/** The one published GLB of each catalog appearance. */
const appearances = portraits.flatMap((portrait) =>
  gearLooks.map((gearLook) => heroModelUrl({ portrait, gearLook }))
);
const files = appearances
  .map((url) => path.basename(url))
  .toSorted((a, b) => a.localeCompare(b));

describe("published Hero Model budget", () => {
  it("publishes exactly the 56 portrait/Gear appearances", () => {
    const published = readdirSync(MODELS)
      .filter((file) => file.endsWith(".glb"))
      .toSorted((a, b) => a.localeCompare(b));
    expect(files).toHaveLength(56);
    expect(published).toEqual(files);
  });

  it.each(files)("%s stays within the complete-appearance ceiling", (file) => {
    // Each appearance is one self-contained GLB, so shared files count once.
    const bytes = readFileSync(path.join(MODELS, file)).byteLength;
    expect(bytes).toBeGreaterThan(0);
    expect(bytes).toBeLessThanOrEqual(APPEARANCE_CEILING);
  });

  it("matches the committed per-appearance size report", () => {
    expect(report.rows).toHaveLength(56);
    const sizes = report.rows.map((row) => {
      const bytes = readFileSync(path.join(MODELS, row.file)).byteLength;
      expect(row.bytes).toBe(bytes);
      return bytes;
    });
    expect(report.totalBytes).toBe(
      sizes.reduce((sum, bytes) => sum + bytes, 0)
    );
    expect(report.minBytes).toBe(Math.min(...sizes));
    expect(report.maxBytes).toBe(Math.max(...sizes));
  });
});
