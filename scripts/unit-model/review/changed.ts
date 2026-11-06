/**
 * Finds the Unit Models that a pull request changed, and prints their names as
 * a JSON array for the matrix of `.github/workflows/unit-model-review.yml`.
 *
 *   bun unit-model:changed --base HEAD^1
 *
 * A failure of this command must fail the workflow. An empty list is a result,
 * so the command must not give one when it cannot read the changes.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

/** The workflow puts a name in a command, so a name has these characters only. */
const NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";
const SCRIPTS = "scripts/unit-model";
const SPECS = `${SCRIPTS}/specs`;
const PUBLISHED = "apps/web/public/models/units";
const RAW = "apps/web/art/units/raw";
const TURNAROUNDS = "apps/web/art/units/reference";

/**
 * The files of one unit. A change to the kit, a Body Plan or the Clip Library is
 * not here: it changes a model only after a rebuild, and a rebuild changes the
 * Raw Export. Only a unit with a Unit Spec has its Raw Export in git, so a
 * Published Model counts too.
 */
const UNIT_FILES: readonly RegExp[] = [
  new RegExp(`^${SCRIPTS}/(${NAME})\\.py$`, "u"),
  new RegExp(`^${SPECS}/(${NAME})\\.json$`, "u"),
  new RegExp(`^${TURNAROUNDS}/(${NAME})/`, "u"),
  new RegExp(`^${RAW}/(${NAME})\\.glb$`, "u"),
  new RegExp(`^${PUBLISHED}/(${NAME})\\.glb$`, "u"),
];

const unitOf = (file: string): string | undefined =>
  UNIT_FILES.map((pattern) => pattern.exec(file)?.[1]).find(Boolean);

/**
 * The names to review, in name order. A unit with no Unit Spec stays in the list,
 * so its review fails on the missing input. A unit that the pull request removes
 * is not in `units`, and it has nothing to review. A Published Model goes to the
 * game, so this stops on one with a name that the pattern does not read.
 */
export const changedUnits = (
  files: readonly string[],
  units: readonly string[]
): readonly string[] => {
  const unnamed = files.find(
    (file) => file.startsWith(`${PUBLISHED}/`) && !unitOf(file)
  );
  if (unnamed) {
    throw new Error(`${unnamed} has no valid unit name, so it has no review`);
  }
  const present = new Set(units);
  const named = files.flatMap((file) => unitOf(file) ?? []);
  return [...new Set(named)].filter((name) => present.has(name)).toSorted();
};

const namesIn = (folder: string, extension: string): readonly string[] =>
  readdirSync(folder)
    .filter((file) => file.endsWith(extension))
    .map((file) => file.slice(0, -extension.length));

if (import.meta.main) {
  const { values } = parseArgs({ options: { base: { type: "string" } } });
  if (!values.base) {
    throw new Error("Usage: bun unit-model:changed --base <git ref>");
  }
  const root = path.resolve(import.meta.dirname, "../../..");
  // `--no-renames` shows both sides of a move, so that the old name counts too.
  const files = execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", "-z", values.base, "HEAD"],
    { cwd: root, encoding: "utf-8" }
  )
    .split("\0")
    .filter(Boolean);
  const units = [
    ...namesIn(path.join(root, SCRIPTS), ".py"),
    ...namesIn(path.join(root, SPECS), ".json"),
    ...namesIn(path.join(root, PUBLISHED), ".glb"),
  ];
  console.log(JSON.stringify(changedUnits(files, units)));
}
