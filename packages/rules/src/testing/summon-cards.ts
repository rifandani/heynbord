import type { CreatureCardDefinition, Keywords } from "../content/schema";

const caller = (
  id: string,
  keywords: Keywords
): readonly [string, CreatureCardDefinition] => [
  id,
  {
    kind: "creature",
    id,
    race: "undead",
    role: "support",
    baseRank: "common",
    countdown: 2,
    attack: 1,
    hp: 5,
    speed: 1,
    range: 0,
    damageType: "physical",
    keywords,
  },
];

/**
 * Test cards with Summon, with fixed values and Keyword combinations that no
 * v1 card has (Summon with Rebirth, Unique, Sabotage or Wall). A test adds
 * these to the card list with a mock of `getCard`.
 */
export const SUMMON_TEST_CARDS: ReadonlyMap<string, CreatureCardDefinition> =
  new Map([
    caller("test.boneCaller", { summon: "token.skeleton" }),
    caller("test.wispCaller", { summon: "token.restlessWisp" }),
    caller("test.rebornCaller", { summon: "token.skeleton", rebirth: true }),
    caller("test.uniqueCaller", { summon: "token.skeleton", unique: true }),
    caller("test.sabotageCaller", { summon: "token.skeleton", sabotage: 1 }),
    caller("test.wallCaller", { summon: "token.skeleton", wall: true }),
  ]);
