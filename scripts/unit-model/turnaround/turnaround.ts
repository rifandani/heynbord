import { readFileSync } from "node:fs";
import path from "node:path";

import type {
  CreatureConcept,
  RaceArt,
  TokenConcept,
} from "../../creature-art/concepts.ts";
import { fileOf, readConcepts, ROOT } from "../../creature-art/concepts.ts";

/** The approved WebP files and the records. Git keeps this folder. */
export const REFERENCE_DIR = path.join(ROOT, "apps/web/art/units/reference");

/** The prompts and the source PNG files. Git ignores this folder. */
export const RAW_DIR = path.join(ROOT, "apps/web/art/units/raw/turnaround");

/** The size of a card WebP, so that 98 Turnarounds stay small in the repository. */
export const VIEW_SIZE = { width: 600, height: 800 } as const;

/** The detail sheet is the fifth view: the glossary makes it part of a Turnaround. */
export const VIEWS = [
  "front",
  "three-quarter",
  "side",
  "back",
  "details",
] as const;

export type View = (typeof VIEWS)[number];

const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** The record of one Turnaround, in `<name>/turnaround.json`. */
export interface TurnaroundRecord {
  readonly id: string;
  /** The card painting, from the repository root. */
  readonly source: string;
  /** The file of each view, in the same folder as the record. */
  readonly views: Readonly<Record<View, string>>;
  /** The person who approves lists the props, with the words of the Props row. */
  readonly props: readonly string[];
  readonly approval: {
    readonly status: ApprovalStatus;
    readonly by: string;
    readonly date: string;
    readonly notes: string;
  };
}

/** One Unit Model and the card that it comes from. */
export interface TurnaroundUnit {
  /** The file name of the Unit Model, such as `warden-saelith`. */
  readonly name: string;
  /** The folder of the card painting: a Race, or `token`. */
  readonly folder: string;
  readonly race: RaceArt;
  readonly concept: CreatureConcept | TokenConcept;
}

const raceOf = (races: readonly RaceArt[], id: string, race: string) => {
  const found = races.find((each) => each.race === race);
  if (!found) {
    throw new Error(`${id}: no Race ${race}`);
  }
  return found;
};

/** All Unit Models: each Creature Card and each Token has one. */
export const unitsOf = (): readonly TurnaroundUnit[] => {
  const { races, concepts, tokens } = readConcepts();
  return [
    ...concepts.map((concept) => ({ concept, folder: concept.race })),
    ...tokens.map((concept) => ({ concept, folder: "token" })),
  ].map(({ concept, folder }) => ({
    name: fileOf(concept),
    folder,
    race: raceOf(races, concept.id, concept.race),
    concept,
  }));
};

export const sourceOf = (unit: TurnaroundUnit): string =>
  `apps/web/public/creature/${unit.folder}/${unit.name}.webp`;

/** The text of the Props row of a card. */
export const propsRowOf = (unit: TurnaroundUnit): string =>
  unit.concept.brief.find(([field]) => field === "Props")?.[1] ?? "";

/** The record of a Turnaround that no person has approved. */
export const pendingRecordOf = (unit: TurnaroundUnit): TurnaroundRecord => ({
  id: unit.name,
  source: sourceOf(unit),
  views: {
    front: "front.webp",
    "three-quarter": "three-quarter.webp",
    side: "side.webp",
    back: "back.webp",
    details: "details.webp",
  },
  props: [],
  approval: { status: "pending", by: "", date: "", notes: "" },
});

const isComplete = (record: Partial<TurnaroundRecord>): boolean =>
  record.views !== undefined &&
  Array.isArray(record.props) &&
  APPROVAL_STATUSES.some((status) => status === record.approval?.status);

/** The record in a file. A missing or an incomplete record gives `undefined`. */
export const readRecord = (file: string): TurnaroundRecord | undefined => {
  try {
    // SAFETY: `isComplete` checks the fields that the gate reads. A person edits
    // this file, so it can be wrong, and the gate must report that and not stop.
    const record = JSON.parse(readFileSync(file, "utf-8")) as TurnaroundRecord;
    return isComplete(record) ? record : undefined;
  } catch {
    return undefined;
  }
};
