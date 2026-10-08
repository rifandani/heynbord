import { readFileSync } from "node:fs";
import path from "node:path";

/** The repository root, so the scripts work from any directory. */
export const ROOT = path.join(import.meta.dirname, "../..");

/** The images from ChatGPT, the style reference and the prompts. Git ignores it. */
export const RAW_DIR = path.join(ROOT, "apps/web/art/creature/raw");

/** The source of the art briefs: one entry for each Creature Card and Skill Card. */
export const CONCEPTS = path.join(ROOT, "docs/game/10-card-concepts.md");

/** The setting and the palette of a Race, from the table in 1.1 of the concepts. */
export interface RaceArt {
  readonly race: string;
  readonly name: string;
  readonly identity: string;
  /** The sentences of the section intro that tell the art what to show. */
  readonly artNotes: readonly string[];
  readonly setting: string;
  readonly palette: string;
}

type Rows = readonly (readonly [string, string])[];

/** The art brief of one Creature Card. */
export interface CreatureConcept {
  readonly id: string;
  readonly race: string;
  readonly name: string;
  readonly role: string;
  readonly rank: string;
  readonly damageType: string;
  readonly flavor: string;
  /** The rows of the brief table, in the order of the document. */
  readonly brief: Rows;
  /** The rows of the character sheet, if the card has one. */
  readonly characterSheet: Rows;
}

/** The art brief of one Token. A Token has no Role, no Base Rank and no flavor text. */
export interface TokenConcept {
  readonly id: string;
  /** The Race on the ID line. The art uses the setting and the palette of that Race. */
  readonly race: string;
  readonly name: string;
  readonly damageType: string;
  /** The Keywords after the Damage Type, such as `Swarm 1` or `Flying`. */
  readonly keywords: readonly string[];
  readonly brief: Rows;
}

const REQUIRED_FIELDS = ["Subject", "Pose", "Props", "Setting"] as const;
const DAMAGE_TYPES = new Set(["Physical", "Fire", "Frost", "Holy"]);
const PROVISIONAL = /\s*All values in this section are \*\*provisional\*\*\./u;

/** The cells of a Markdown table row, or `null` for a line that is not a row. */
export const cellsOf = (line: string): string[] | null =>
  line.startsWith("|")
    ? line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim())
    : null;

export const isTableRule = (cells: readonly string[]): boolean =>
  cells.every((cell) => /^:?-+:?$/u.test(cell));

/** The `cardId` file name: `human.kingsCourier` → `kings-courier`. Same rule as `cardIllustration`. */
export const fileOf = (concept: { readonly id: string }): string =>
  concept.id
    .slice(concept.id.indexOf(".") + 1)
    .replaceAll(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);

/** The setting and the palette of each group in the table of 1.1. */
export const settingsOf = (lines: readonly string[]) => {
  const settings = new Map<string, { setting: string; palette: string }>();
  const start = lines.indexOf("### 1.1 Settings");
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("#")) {
      break;
    }
    const cells = cellsOf(line);
    if (cells?.length === 3 && !isTableRule(cells) && cells[0] !== "Group") {
      settings.set(cells[0], { setting: cells[1], palette: cells[2] });
    }
  }
  return settings;
};

/** The races, the Creature Cards and the Tokens of the Card Concepts. */
export interface CreatureArt {
  readonly races: readonly RaceArt[];
  readonly concepts: readonly CreatureConcept[];
  readonly tokens: readonly TokenConcept[];
}

interface Section {
  readonly heading: string;
  readonly lines: readonly string[];
}

/** Splits lines at each heading line. The lines before the first heading have an empty heading. */
export const splitAt = (
  lines: readonly string[],
  isHeading: (line: string) => boolean
): Section[] => {
  const sections: { heading: string; lines: string[] }[] = [
    { heading: "", lines: [] },
  ];
  for (const line of lines) {
    if (isHeading(line)) {
      sections.push({ heading: line, lines: [] });
    } else {
      sections.at(-1)?.lines.push(line);
    }
  }
  return sections;
};

/** The body rows of the 2-column tables in the lines, without the header row. */
export const rowsOf = (lines: readonly string[]): [string, string][] =>
  lines.flatMap<[string, string]>((line, index) => {
    const cells = cellsOf(line);
    const next = cellsOf(lines[index + 1] ?? "");
    const isHeader = next !== null && isTableRule(next);
    return cells?.length === 2 && !isTableRule(cells) && !isHeader
      ? [[cells[0], cells[1]]]
      : [];
  });

/** The ID line, the brief and the subsections of a Creature Card or a Token. */
const entryOf = (section: Section) => {
  const name =
    /^### \d+\.\d+ (?<name>.+?)(?: \(draft\))?$/u.exec(section.heading)?.groups
      ?.name ?? section.heading;
  const where = `${name} in ${CONCEPTS}`;
  const header =
    section.lines.find((line) => line.startsWith("`"))?.split(" · ") ?? [];
  const id = /^`(?<id>[a-z]+\.[A-Za-z]+)`$/u.exec(header[0] ?? "")?.groups?.id;
  const damageIndex = header.findIndex((part) => DAMAGE_TYPES.has(part));
  if (!id || damageIndex === -1) {
    throw new Error(`${where}: no card ID line or Damage Type`);
  }
  const [main, ...subsections] = splitAt(section.lines, (line) =>
    line.startsWith("#### ")
  );
  const brief = rowsOf(main.lines);
  const fields = new Set(brief.map(([field]) => field));
  const missing = REQUIRED_FIELDS.filter((field) => !fields.has(field));
  if (missing.length > 0) {
    throw new Error(`${where}: the brief has no ${missing.join(", ")}`);
  }
  return { id, name, where, header, damageIndex, brief, subsections };
};

const conceptOf = (section: Section): CreatureConcept => {
  const { id, name, where, header, damageIndex, brief, subsections } =
    entryOf(section);
  const flavor = section.lines.find((line) => line.startsWith("> "));
  if (!flavor) {
    throw new Error(`${where}: no flavor text`);
  }
  return {
    id,
    race: id.slice(0, id.indexOf(".")),
    name,
    role: header[1],
    rank: header[2],
    damageType: header[damageIndex],
    flavor: flavor.slice(2).trim(),
    brief,
    characterSheet: subsections
      .filter((sub) => sub.heading.includes("Character sheet"))
      .flatMap((sub) => rowsOf(sub.lines)),
  };
};

/** A Token. Its ID line is `` `token.<name>` · <Race> · <range> · <Damage Type> · <Keywords> ``. */
const tokenOf = (section: Section): TokenConcept => {
  const { id, name, header, damageIndex, brief } = entryOf(section);
  return {
    id,
    race: header[1].toLowerCase(),
    name,
    damageType: header[damageIndex],
    keywords: header.slice(damageIndex + 1),
    brief,
  };
};

const raceOf = (
  name: string,
  intro: readonly string[],
  settings: ReturnType<typeof settingsOf>
): RaceArt => {
  const setting = settings.get(name);
  const [identity = "", ...rest] = intro.filter((line) => line.trim());
  if (!setting || !identity.startsWith("Identity: ")) {
    throw new Error(`${name}: no setting in 1.1 or no Identity line`);
  }
  return {
    race: name.toLowerCase(),
    name,
    identity: identity.slice("Identity: ".length).replace(PROVISIONAL, ""),
    artNotes: rest
      .flatMap((paragraph) => paragraph.split(/(?<=\.)\s+/u))
      .filter((sentence) => /\b(?:figure|art)\b/u.test(sentence)),
    ...setting,
  };
};

/**
 * Reads the Races and the Creature Cards from sections 2 to 7 of the Card
 * Concepts, and the Tokens from section 8. Fails when an entry does not have
 * the fields that a prompt needs.
 */
export const readConcepts = (): CreatureArt => {
  const lines = readFileSync(CONCEPTS, "utf-8").split("\n");
  const settings = settingsOf(lines);
  const races: RaceArt[] = [];
  const concepts: CreatureConcept[] = [];
  const tokens: TokenConcept[] = [];
  for (const section of splitAt(lines, (line) => line.startsWith("## "))) {
    const race = /^## \d+\. (?<race>\w+) Creature Cards$/u.exec(section.heading)
      ?.groups?.race;
    if (race) {
      const [intro, ...cards] = splitAt(section.lines, (line) =>
        line.startsWith("### ")
      );
      races.push(raceOf(race, intro.lines, settings));
      concepts.push(...cards.map(conceptOf));
    } else if (/^## \d+\. Tokens$/u.test(section.heading)) {
      const [, ...cards] = splitAt(section.lines, (line) =>
        line.startsWith("### ")
      );
      tokens.push(...cards.map(tokenOf));
    }
  }
  const known = new Set(races.map((race) => race.race));
  const orphans = tokens.filter((token) => !known.has(token.race));
  if (orphans.length > 0) {
    throw new Error(
      `${CONCEPTS}: no Race for the Tokens ${orphans.map((token) => token.id).join(", ")}`
    );
  }
  return { races, concepts, tokens };
};
