import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CONCEPTS,
  ROOT,
  rowsOf,
  settingsOf,
  splitAt,
} from "../creature-art/concepts.ts";

/** The images from ChatGPT, the style reference and the prompts. Git ignores it. */
export const RAW_DIR = path.join(ROOT, "apps/web/art/skills/raw");

/** The Class of a group of Skill Cards, with the Skill Card row of 1.1. */
export interface ClassArt {
  /** The folder name: `warrior`. Same as the `cardId` prefix. */
  readonly className: string;
  readonly name: string;
  readonly identity: string;
  readonly setting: string;
  readonly palette: string;
}

/** The art brief of one Skill Card. */
export interface SkillConcept {
  readonly id: string;
  readonly className: string;
  readonly name: string;
  readonly rank: string;
  readonly target: string;
  readonly effect: string;
  readonly flavor: string;
  /** The rows of the brief table, in the order of the document. */
  readonly brief: readonly (readonly [string, string])[];
}

const REQUIRED_FIELDS = [
  "Effect subject",
  "Partial figure",
  "Action",
  "Setting",
  "Palette",
] as const;

const conceptOf = (heading: string, lines: readonly string[]): SkillConcept => {
  const name = /^### \d+\.\d+ (?<name>.+)$/u.exec(heading)?.groups?.name;
  const where = `${name ?? heading} in ${CONCEPTS}`;
  // `warrior.warDrums` · Warrior · Common · Countdown 2 · No target · Effect.
  const header = lines.find((line) => line.startsWith("`"))?.split(" · ") ?? [];
  const id = /^`(?<id>[a-z]+\.[A-Za-z]+)`$/u.exec(header[0] ?? "")?.groups?.id;
  const flavor = lines.find((line) => line.startsWith("> "));
  if (!name || !id || header.length < 6 || !flavor) {
    throw new Error(`${where}: no card ID line or flavor text`);
  }
  const brief = rowsOf(lines);
  const fields = new Set(brief.map(([field]) => field));
  const missing = REQUIRED_FIELDS.filter((field) => !fields.has(field));
  if (missing.length > 0) {
    throw new Error(`${where}: the brief has no ${missing.join(", ")}`);
  }
  return {
    id,
    className: id.slice(0, id.indexOf(".")),
    name,
    rank: header[2],
    target: header[4],
    effect: header.slice(5).join(" · "),
    flavor: flavor.slice(2).trim(),
    brief,
  };
};

/** The Classes and the Skill Cards of the Card Concepts. */
export interface SkillArt {
  readonly classes: readonly ClassArt[];
  readonly concepts: readonly SkillConcept[];
}

/**
 * Reads the Classes and the Skill Cards from the `<Class> Skill Cards`
 * sections of the Card Concepts. Fails when an entry does not have the fields
 * that a prompt needs.
 */
export const readSkills = (): SkillArt => {
  const lines = readFileSync(CONCEPTS, "utf-8").split("\n");
  const setting = settingsOf(lines).get("Skill Cards");
  if (!setting) {
    throw new Error(`${CONCEPTS}: no Skill Cards row in 1.1`);
  }
  const classes: ClassArt[] = [];
  const concepts: SkillConcept[] = [];
  for (const section of splitAt(lines, (line) => line.startsWith("## "))) {
    const name = /^## \d+\. (?<name>\w+) Skill Cards$/u.exec(section.heading)
      ?.groups?.name;
    if (name) {
      const [intro, ...cards] = splitAt(section.lines, (line) =>
        line.startsWith("### ")
      );
      const identity = intro.lines.find((line) =>
        line.startsWith("Identity: ")
      );
      if (!identity) {
        throw new Error(`${name} in ${CONCEPTS}: no Identity line`);
      }
      classes.push({
        className: name.toLowerCase(),
        name,
        identity: identity.slice("Identity: ".length),
        ...setting,
      });
      concepts.push(
        ...cards.map((card) => conceptOf(card.heading, card.lines))
      );
    }
  }
  return { classes, concepts };
};
