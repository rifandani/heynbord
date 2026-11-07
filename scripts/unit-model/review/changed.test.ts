import { describe, expect, test } from "bun:test";

import { changedUnits } from "./changed.ts";

const UNITS = ["bone-rampart", "skeleton", "tusk-brute", "warden-saelith"];

describe("changedUnits", () => {
  test.each([
    ["a build script", "scripts/unit-model/warden-saelith.py"],
    ["a build script with a one-word name", "scripts/unit-model/skeleton.py"],
    ["a Unit Spec", "scripts/unit-model/specs/warden-saelith.json"],
    ["a Turnaround", "apps/web/art/units/reference/warden-saelith/front.webp"],
    ["a Raw Export", "apps/web/art/units/raw/warden-saelith.glb"],
    ["a Published Model", "apps/web/public/models/units/warden-saelith.glb"],
  ])("finds the unit of %s", (_label, file) => {
    const [name] = file.match(/warden-saelith|skeleton/u) ?? [];
    expect(changedUnits([file], UNITS)).toEqual([name]);
  });

  test("gives each unit one time, in name order", () => {
    expect(
      changedUnits(
        [
          "scripts/unit-model/warden-saelith.py",
          "scripts/unit-model/specs/warden-saelith.json",
          "scripts/unit-model/bone-rampart.py",
        ],
        UNITS
      )
    ).toEqual(["bone-rampart", "warden-saelith"]);
  });

  test("keeps a changed unit that has no Unit Spec, so that the review fails on it", () => {
    expect(changedUnits(["scripts/unit-model/tusk-brute.py"], UNITS)).toEqual([
      "tusk-brute",
    ]);
  });

  test("keeps a unit whose Unit Spec the pull request removes", () => {
    expect(
      changedUnits(["scripts/unit-model/specs/tusk-brute.json"], UNITS)
    ).toEqual(["tusk-brute"]);
  });

  test("ignores a unit that the pull request removes in full", () => {
    expect(
      changedUnits(
        [
          "scripts/unit-model/old-unit.py",
          "apps/web/public/models/units/old-unit.glb",
        ],
        UNITS
      )
    ).toEqual([]);
  });

  test.each([
    ["a test", "scripts/unit-model/test_clip_library.py"],
    ["a guide", "scripts/unit-model/README.md"],
    ["a Python cache", "scripts/unit-model/__pycache__/skeleton.pyc"],
    ["a review script", "scripts/unit-model/review/gates.ts"],
    ["the kit", "scripts/unit-model/unit_model_kit.py"],
    ["a Body Plan", "scripts/unit-model/body_plans/biped_medium.py"],
    ["a file of the game", "apps/web/src/main.tsx"],
    ["an ignored prompt", "apps/web/art/units/raw/turnaround/x/prompts.md"],
  ])("ignores %s", (_label, file) => {
    expect(changedUnits([file], UNITS)).toEqual([]);
  });

  test("stops on a Published Model with a name that it cannot review", () => {
    expect(() =>
      changedUnits(["apps/web/public/models/units/Bad_name.glb"], UNITS)
    ).toThrow("Bad_name.glb");
  });

  test("does not read a name that a shell could run", () => {
    expect(
      changedUnits(
        ["scripts/unit-model/$(touch pwned).py"],
        [...UNITS, "$(touch pwned)"]
      )
    ).toEqual([]);
  });
});
