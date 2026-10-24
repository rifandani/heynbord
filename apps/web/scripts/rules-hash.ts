import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** The source of `@workspace/rules`: the rules and the content. */
const RULES_SOURCE = path.join(
  import.meta.dirname,
  "../../../packages/rules/src"
);

/** Tests, balance simulations and test fixtures do not change a Battle. */
const isRulesFile = (file: string): boolean =>
  file.endsWith(".ts") &&
  !file.endsWith(".test.ts") &&
  !file
    .split(path.sep)
    .some((part) => [".claude", "simulation", "testing"].includes(part));

/**
 * The hash of the rules and the content, for the Replay Links (web ADR-0011).
 * Each Replay holds it. It is not the git commit, so a deploy that changes
 * only the UI does not change it. 12 hex characters.
 */
export const rulesHash = (source = RULES_SOURCE): string => {
  const hash = createHash("sha256");
  const files = fs
    .readdirSync(source, { recursive: true, encoding: "utf-8" })
    .toSorted();
  for (const file of files) {
    if (!isRulesFile(file)) {
      continue;
    }
    // The same hash on each operating system.
    hash.update(file.split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(source, file)));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
};
