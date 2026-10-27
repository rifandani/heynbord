import { getStarterDeck } from "@workspace/rules";
import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import {
  publishBattle,
  readBattle,
  stageBattle,
  stagedBattle,
} from "@/features/battle/battle-store";
import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { NEW_PLAYER } from "@/features/profile/profile";

const session = () =>
  startSession({
    stageId: "1-1",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed: 1,
  });

describe("battle store", () => {
  it("publishes and reads the session atom", () => {
    const registry = AtomRegistry.make();
    const battle = session();

    publishBattle(registry, battle);
    expect(registry.get(battleSessionAtom)).toBe(battle);
    expect(readBattle(registry)).toBe(battle);

    publishBattle(registry, null);
    expect(readBattle(registry)).toBeNull();
  });

  it("stages the scene clock without publishing", () => {
    const registry = AtomRegistry.make();
    const battle = session();

    stageBattle(battle);
    expect(stagedBattle()).toBe(battle);
    expect(readBattle(registry)).toBeNull();

    stageBattle(null);
    expect(stagedBattle()).toBeNull();
  });
});
