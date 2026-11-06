import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

import { ROOT } from "../../creature-art/concepts.ts";
import contracts from "../source-contracts.json";
import { promptFileOf, setupPromptOf, viewPromptOf } from "./prompts.ts";
import { sourceOf, unitsOf, VIEWS } from "./turnaround.ts";

const units = unitsOf();
const unit = (name: string) => {
  const found = units.find((each) => each.name === name);
  if (!found) {
    throw new Error(name);
  }
  return found;
};

describe("the Turnaround prompts", () => {
  test("cover each Unit Model and its card painting", () => {
    expect(units.map(({ name }) => `${name}.glb`).toSorted()).toEqual(
      Object.keys(contracts).toSorted()
    );
    expect(
      units.filter((each) => !existsSync(path.join(ROOT, sourceOf(each))))
    ).toEqual([]);
  });

  test("give one prompt and one file name for each of the 5 views", () => {
    const file = promptFileOf(unit("warden-saelith"));

    for (const view of VIEWS) {
      expect(file).toContain(`## ${view} → save as \`${view}.png\``);
    }
    expect(file).toContain(sourceOf(unit("warden-saelith")));
  });

  test("advance to the right only in the three-quarter view", () => {
    const advancing = VIEWS.filter((view) =>
      viewPromptOf(view).includes("advances to the right")
    );

    expect(advancing).toEqual(["three-quarter"]);
    expect(setupPromptOf(unit("warden-saelith"))).not.toContain(
      "advances to the right"
    );
  });

  test("define the front of a fortification", () => {
    expect(viewPromptOf("front")).toContain(
      "A fortification shows its blocking face to the viewer, and its base is on the ground."
    );
  });

  test("leave out the scene of the card", () => {
    const setup = setupPromptOf(unit("bone-rampart"));

    expect(setup).not.toContain("Setting:");
    expect(setup).not.toContain("Pose:");
    expect(setup).toContain("Props: Rusted shields");
  });

  test("use the character sheet of a card that has one", () => {
    const withSheet = units.find(
      ({ concept }) =>
        "characterSheet" in concept && concept.characterSheet.length > 0
    );

    expect(withSheet && setupPromptOf(withSheet)).toContain("Character sheet:");
  });
});
