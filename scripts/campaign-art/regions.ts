import { readFileSync } from "node:fs";
import path from "node:path";

import {
  cellsOf,
  isTableRule,
  ROOT,
  rowsOf,
  splitAt,
} from "../creature-art/concepts.ts";

/** The images from ChatGPT, the reference images and the prompts. Git ignores it. */
export const RAW_DIR = path.join(ROOT, "apps/web/art/campaign/raw");

/** The source of the Region Map briefs and the clearing positions. */
const REGION_CONCEPTS = path.join(ROOT, "docs/game/12-region-concepts.md");

/** The source of the Battle Painting briefs. */
const BATTLEFIELD_CONCEPTS = path.join(
  ROOT,
  "docs/game/13-battlefield-concepts.md"
);

/** A point in the 1600 × 900 box of the Region Map. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The landmark of one Stage, next to its clearing. */
export interface Landmark {
  readonly stage: number;
  /** The Stage name, if the brief gives it. */
  readonly name: string | null;
  readonly look: string;
}

/** The art brief of one Region. */
export interface RegionArt {
  /** The file name: `The Hollow Marches` → `hollow-marches`. */
  readonly slug: string;
  readonly name: string;
  /** The rows of the Region Map brief, in the order of the document. */
  readonly brief: readonly (readonly [string, string])[];
  /** The landmarks of the Stages before the Boss Stage, in Stage order. */
  readonly landmarks: readonly Landmark[];
  /** The rows of the Battle Painting brief, or `null` while it has none. */
  readonly battle: readonly (readonly [string, string])[] | null;
}

/** The Regions and the target clearing centers of the Region Maps. */
export interface CampaignArt {
  readonly regions: readonly RegionArt[];
  /** The target center of each clearing (1.1), in Stage order. */
  readonly clearings: readonly Point[];
}

const MAP_FIELDS = [
  "Place",
  "Trail",
  "Landmarks",
  "Boss landmark",
  "Palette",
  "Humor note",
  "Time and weather",
] as const;

const BATTLE_FIELDS = [
  "Place",
  "Ground",
  "Edges",
  "Palette",
  "Time and weather",
] as const;

/** Rules for the game team and links to other documents. They have no use in a prompt. */
const DOC_NOTES =
  /\s*No single Race color is the main color\.|\s*\((?:art direction|GDD|see) [^)]*\)/gu;

/** The text of a brief field, or an error when the brief does not have it. */
export const fieldOf = (
  rows: RegionArt["brief"],
  field: string,
  where: string
): string => {
  const row = rows.find(([name]) => name === field);
  if (!row) {
    throw new Error(`${where}: the brief has no ${field}`);
  }
  return row[1].replaceAll(DOC_NOTES, "");
};

const requireFields = (
  rows: RegionArt["brief"],
  fields: readonly string[],
  where: string
) => {
  for (const field of fields) {
    fieldOf(rows, field, where);
  }
};

/** The lines of the section with this heading, up to the next heading. */
const sectionOf = (lines: readonly string[], heading: string): string[] => {
  const start = lines.indexOf(heading);
  if (start === -1) {
    throw new Error(`${REGION_CONCEPTS}: no "${heading}"`);
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("#"));
  return end === -1 ? rest : rest.slice(0, end);
};

const POINT = /^(?<x>\d+), (?<y>\d+)$/u;

/** The clearing centers of the 4-column table in 1.1. */
const clearingsOf = (lines: readonly string[]): Point[] => {
  const centers = new Map<number, Point>();
  for (const line of sectionOf(lines, "### 1.1 Positions on the painting")) {
    const cells = cellsOf(line);
    if (cells?.length !== 4 || isTableRule(cells)) {
      continue;
    }
    for (const [clearing, center] of [cells.slice(0, 2), cells.slice(2)]) {
      const point = POINT.exec(center)?.groups;
      const number = /^(?<number>\d+)/u.exec(clearing)?.groups?.number;
      if (point && number) {
        centers.set(Number(number), { x: Number(point.x), y: Number(point.y) });
      }
    }
  }
  return [...centers].toSorted(([a], [b]) => a - b).map(([, center]) => center);
};

const LANDMARK = /^(?<stage>\d+) (?<text>.+)$/u;

/** `1 The Muddy Ford: a shallow ford` or `1 a forest gate`. */
const landmarksOf = (row: string, where: string): Landmark[] =>
  row.split(" · ").map((part) => {
    const groups = LANDMARK.exec(part.trim())?.groups;
    if (!groups) {
      throw new Error(`${where}: "${part}" is not "<Stage> <landmark>"`);
    }
    const colon = groups.text.indexOf(": ");
    return {
      stage: Number(groups.stage),
      name: colon === -1 ? null : groups.text.slice(0, colon),
      look: colon === -1 ? groups.text : groups.text.slice(colon + 2),
    };
  });

const slugOf = (name: string): string =>
  name.replace(/^The /u, "").toLowerCase().replaceAll(" ", "-");

/** The Battle Painting briefs of 13, by Region name. */
const battleBriefs = (): Map<string, [string, string][]> => {
  const lines = readFileSync(BATTLEFIELD_CONCEPTS, "utf-8").split("\n");
  const briefs = new Map<string, [string, string][]>();
  for (const section of splitAt(lines, (line) => line.startsWith("### "))) {
    const name = /^### 1\.\d+ (?<name>.+)$/u.exec(section.heading)?.groups
      ?.name;
    const rows = rowsOf(section.lines);
    if (name && rows.some(([field]) => field === "Ground")) {
      requireFields(rows, BATTLE_FIELDS, `${name} in ${BATTLEFIELD_CONCEPTS}`);
      briefs.set(name, rows);
    }
  }
  return briefs;
};

/**
 * Reads the Regions of section 2 and the clearing centers of 1.1 of the
 * Region Concepts, and the Battle Painting briefs of the Battlefield Concepts.
 * Fails when an entry does not have the fields that a prompt needs.
 */
export const readCampaign = (): CampaignArt => {
  const lines = readFileSync(REGION_CONCEPTS, "utf-8").split("\n");
  const clearings = clearingsOf(lines);
  const battles = battleBriefs();
  const regions = splitAt(lines, (line) => line.startsWith("### "))
    .flatMap((section) => {
      const name = /^### 2\.\d+ (?<name>.+)$/u.exec(section.heading)?.groups
        ?.name;
      return name ? [{ name, rows: rowsOf(section.lines) }] : [];
    })
    .map(({ name, rows }): RegionArt => {
      const where = `${name} in ${REGION_CONCEPTS}`;
      requireFields(rows, MAP_FIELDS, where);
      const landmarks = landmarksOf(fieldOf(rows, "Landmarks", where), where);
      if (landmarks.length !== clearings.length - 1) {
        throw new Error(
          `${where}: ${landmarks.length} landmarks for ${clearings.length} clearings (the last clearing is the Boss)`
        );
      }
      return {
        slug: slugOf(name),
        name,
        brief: rows,
        landmarks,
        battle: battles.get(name) ?? null,
      };
    });
  return { regions, clearings };
};
