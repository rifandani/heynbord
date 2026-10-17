import { describe, expect, it } from "vitest";

import { createBattle } from "../battle/create-battle";
import { BattleEvent, Command, Target } from "../battle/types";
import type {
  BattleResult,
  BattleSetup,
  BattleState,
  DamageDealer,
  Side,
  UnitState,
} from "../battle/types";
import { isDeckValid } from "../collection/deck-building";
import { ACHIEVEMENTS, getAchievement } from "../content/achievements";
import type { FeatId } from "../content/achievements";
import { copies } from "../content/decks";
import { getDungeon } from "../content/dungeons";
import { getFloor } from "../content/floors";
import { MAX_GEAR_LEVEL } from "../content/gear";
import type { ActivatedKeyword } from "../content/keywords";
import type {
  ClassId,
  DamageType,
  DeckEntry,
  GearLevels,
  RaceId,
  RankId,
} from "../content/schema";
import { getStage } from "../content/stages";
import { TUTORIAL_STAGE_ID } from "../modes/tutorial";
import { NO_GEAR, playOut } from "../simulation/simulate";
import {
  emptyBattle,
  eventsOfType,
  giveHand,
  placeToken,
  placeUnit,
  preventRout,
  run,
} from "../testing/fixtures";
import {
  FEAT_KEYWORDS,
  FOUR_CARDS,
  FULL_ZONE_UNITS,
  LAST_STAND_HP,
  metFeats,
  recordFeats,
  SWIFT_BOSS_TURN,
} from "./feats";
import type { FeatBattle, FeatPlace } from "./feats";
import { newProfile } from "./new-profile";
import type { Profile } from "./schema";

/** 3 copies of each card, in that Rank. */
const threeOf = (rank: RankId, cardIds: readonly string[]): DeckEntry[] =>
  cardIds.flatMap((cardId) => [0, 1, 2].map(() => ({ cardId, rank })));

const stage = (stageId: string): FeatPlace => ({ kind: "stage", stageId });
const dungeon = (dungeonId: string): FeatPlace => ({
  kind: "dungeon",
  dungeonId,
});

/** A normal Stage that is not the Tutorial and not a Boss Stage. */
const NORMAL_STAGE = stage("1-2");
const BOSS_STAGE = stage("1-10");

/** A finished Battle that the Player won, with 20 of 30 Hero HP at Turn 15. */
const wonState = (
  options: {
    readonly hp?: number;
    readonly turnNumber?: number;
    readonly result?: BattleResult | null;
  } = {}
): BattleState => {
  const state = emptyBattle({
    lanes: 3,
    turnNumber: options.turnNumber ?? 15,
    player: { hp: options.hp ?? 20, maxHp: 30 },
  });
  state.status = "finished";
  state.result =
    options.result === undefined
      ? { winner: "player", reason: "heroDefeated" }
      : options.result;
  return state;
};

/** A won Battle in a normal Stage, with a Deck of 2 Races and a Skill Card. */
const battle = (overrides: Partial<FeatBattle> = {}): FeatBattle => ({
  place: NORMAL_STAGE,
  deck: [
    { cardId: "human.militiaRecruit", rank: "common" },
    { cardId: "orc.badlandRunt", rank: "uncommon" },
    { cardId: "warrior.spearThrow", rank: "common" },
  ],
  state: wonState(),
  events: [],
  ...overrides,
});

const meets = (feat: FeatId, overrides: Partial<FeatBattle> = {}) =>
  metFeats(battle(overrides)).includes(feat);

/** A Unit of a Side, for the events of a hand-made log. */
const unitOf = (owner: Side, cardId = "human.militiaRecruit"): UnitState =>
  placeUnit(emptyBattle({ lanes: 3 }), { cardId, owner, position: 0 });

let nextUnitId = 100;
/** A `UnitSummoned` event of a new Unit of the Side. */
const summoned = (owner: Side): BattleEvent => {
  nextUnitId += 1;
  return BattleEvent.UnitSummoned({
    unit: { ...unitOf(owner), id: nextUnitId },
  });
};

/** A `TokenSummoned` event of a new Token of the Side. */
const tokenSummoned = (owner: Side): BattleEvent => {
  nextUnitId += 1;
  const token = placeToken(emptyBattle({ lanes: 3 }), {
    tokenId: "token.skeleton",
    owner,
    position: 0,
  });
  return BattleEvent.TokenSummoned({
    unit: { ...token, id: nextUnitId },
    sourceUnitId: nextUnitId - 1,
  });
};

/** The ID of the Unit of a `UnitSummoned` or `TokenSummoned` event. */
const idOf = (event: BattleEvent): number => {
  if (event._tag !== "UnitSummoned" && event._tag !== "TokenSummoned") {
    throw new Error("Not a summon");
  }
  return event.unit.id;
};

const unitDealer = (side: Side): DamageDealer => ({
  _tag: "Unit",
  unitId: 1,
  hero: { side, hero: 0 },
});

const heroDealer = (side: Side): DamageDealer => ({
  _tag: "Hero",
  hero: { side, hero: 0 },
});

const damage = (
  damageType: DamageType,
  dealer: DamageDealer | null,
  amount = 2
): BattleEvent =>
  BattleEvent.DamageDealt({
    target: { _tag: "Hero", side: "enemy", hero: 0 },
    amount,
    damageType,
    source: dealer?._tag === "Hero" ? "skill" : "attack",
    dealer,
    crit: false,
    blocked: false,
    trueDamage: false,
    absorbed: 0,
    ward: 0,
    hp: 10,
  });

const cardPlayed = (side: Side): BattleEvent =>
  BattleEvent.CardPlayed({
    side,
    hero: { side, hero: 0 },
    handIndex: 0,
    card: { instanceId: 1, cardId: "human.militiaRecruit", rank: "common" },
    target: { _tag: "Square", lane: 0, position: 0 },
  });

const activated = (keyword: ActivatedKeyword, side: Side): BattleEvent =>
  BattleEvent.KeywordActivated({
    unitId: 1,
    keyword,
    hero: { side, hero: 0 },
  });

/** 10 different Keywords that activate. */
const TEN_KEYWORDS = [
  "charge",
  "entangle",
  "firstStrike",
  "heroic",
  "lastBreath",
  "pivot",
  "poison",
  "rebirth",
  "rally",
  "regenerate",
] as const satisfies readonly ActivatedKeyword[];

describe("metFeats (Achievements 2.4)", () => {
  it.each([
    ["onlyHuman", "human.shieldbearer", "elf.brambleDuelist"],
    ["onlyElf", "elf.brambleDuelist", "human.shieldbearer"],
    ["onlyUndead", "undead.rattleknife", "orc.badlandRunt"],
    ["onlyOrc", "orc.badlandRunt", "goblin.fuseRunner"],
    ["onlyGoblin", "goblin.fuseRunner", "feral.caveBear"],
    ["onlyFeral", "feral.caveBear", "undead.rattleknife"],
  ] as const)(
    "%s: a Deck whose Creature Cards are all of the Race, in a Boss Stage or a Dungeon",
    (feat, raceCard, otherCard) => {
      const deck = [
        { cardId: raceCard, rank: "common" },
        { cardId: raceCard, rank: "legendary" },
        // A Skill Card has no Race, so it does not break the rule.
        { cardId: "warrior.spearThrow", rank: "common" },
      ] as const;
      expect(meets(feat, { place: BOSS_STAGE, deck })).toBe(true);
      expect(meets(feat, { place: dungeon("dungeon-2"), deck })).toBe(true);
      expect(meets(feat, { place: NORMAL_STAGE, deck })).toBe(false);
      expect(
        meets(feat, {
          place: BOSS_STAGE,
          deck: [...deck, { cardId: otherCard, rank: "common" }],
        })
      ).toBe(false);
    }
  );

  it("a Race Feat needs at least 1 Creature Card in the Deck", () => {
    const deck = [{ cardId: "warrior.spearThrow", rank: "common" }] as const;
    expect(
      metFeats(battle({ place: BOSS_STAGE, deck })).filter((feat) =>
        feat.startsWith("only")
      )
    ).toEqual([]);
  });

  it("a Race Feat reads the Deck, not the Units that the Battle summons", () => {
    const deck = threeOf("common", ["undead.graveBellTender"]);
    // The Tokens and the Units of a Boss Rule are not in the Deck.
    const events = [tokenSummoned("player"), summoned("player")];
    expect(meets("onlyUndead", { place: BOSS_STAGE, deck, events })).toBe(true);
  });

  it("creaturesOnly: no Skill Card in the Deck, in a Boss Stage or a Dungeon", () => {
    const deck = threeOf("rare", ["human.shieldbearer", "orc.badlandRunt"]);
    expect(meets("creaturesOnly", { place: dungeon("dungeon-1"), deck })).toBe(
      true
    );
    expect(meets("creaturesOnly", { place: NORMAL_STAGE, deck })).toBe(false);
    expect(
      meets("creaturesOnly", {
        place: dungeon("dungeon-1"),
        deck: [...deck, { cardId: "warrior.spearThrow", rank: "common" }],
      })
    ).toBe(false);
  });

  it("commonOnly: only Common copies, in a Boss Stage of Region 3 or later", () => {
    const deck = threeOf("common", ["human.shieldbearer", "warrior.cleave"]);
    expect(meets("commonOnly", { place: stage("3-10"), deck })).toBe(true);
    expect(meets("commonOnly", { place: stage("5-10"), deck })).toBe(true);
    expect(meets("commonOnly", { place: stage("2-10"), deck })).toBe(false);
    expect(meets("commonOnly", { place: stage("3-9"), deck })).toBe(false);
    expect(meets("commonOnly", { place: dungeon("dungeon-3"), deck })).toBe(
      false
    );
    expect(
      meets("commonOnly", {
        place: stage("3-10"),
        deck: [...deck, { cardId: "orc.badlandRunt", rank: "uncommon" }],
      })
    ).toBe(false);
  });

  it("untouched: a Boss Stage with the Hero at full HP", () => {
    const full = wonState({ hp: 30 });
    expect(meets("untouched", { place: BOSS_STAGE, state: full })).toBe(true);
    expect(meets("untouched", { place: NORMAL_STAGE, state: full })).toBe(
      false
    );
    expect(
      meets("untouched", { place: BOSS_STAGE, state: wonState({ hp: 29 }) })
    ).toBe(false);
  });

  it("swiftBoss: a Boss Stage before Turn 10", () => {
    const swift = wonState({ turnNumber: SWIFT_BOSS_TURN - 1 });
    expect(meets("swiftBoss", { place: BOSS_STAGE, state: swift })).toBe(true);
    expect(meets("swiftBoss", { place: NORMAL_STAGE, state: swift })).toBe(
      false
    );
    expect(
      meets("swiftBoss", {
        place: BOSS_STAGE,
        state: wonState({ turnNumber: SWIFT_BOSS_TURN }),
      })
    ).toBe(false);
  });

  it("lastStand: the Hero at 3 HP or less, in any place", () => {
    const low = wonState({ hp: LAST_STAND_HP });
    expect(meets("lastStand", { state: low })).toBe(true);
    expect(
      meets("lastStand", { place: { kind: "floor", floor: 7 }, state: low })
    ).toBe(true);
    expect(meets("lastStand", { state: wonState({ hp: 1 }) })).toBe(true);
    expect(
      meets("lastStand", { state: wonState({ hp: LAST_STAND_HP + 1 }) })
    ).toBe(false);
  });

  it("rout: the enemy Side is Routed", () => {
    const routed = wonState({ result: { winner: "player", reason: "routed" } });
    expect(meets("rout", { state: routed })).toBe(true);
    expect(meets("rout")).toBe(false);
    expect(
      meets("rout", {
        state: wonState({ result: { winner: "player", reason: "turnLimit" } }),
      })
    ).toBe(false);
  });

  it("fullZone: 9 Units of the Player's Side on the Board at the same time, Tokens too", () => {
    const first = summoned("player");
    const eight = [
      first,
      ...Array.from({ length: FULL_ZONE_UNITS - 3 }, () => summoned("player")),
      tokenSummoned("player"),
    ];
    expect(meets("fullZone", { events: [...eight, summoned("player")] })).toBe(
      true
    );
    // Enemy Units do not count.
    expect(meets("fullZone", { events: [...eight, summoned("enemy")] })).toBe(
      false
    );
    // A death or a removal before the 9th summon leaves 8 on the Board.
    for (const leave of [BattleEvent.UnitDied, BattleEvent.UnitRemoved]) {
      expect(
        meets("fullZone", {
          events: [
            ...eight,
            leave({ unitId: idOf(first) }),
            summoned("player"),
          ],
        })
      ).toBe(false);
    }
    // Rebirth keeps the Unit on the Board.
    expect(
      meets("fullZone", {
        events: [
          ...eight,
          BattleEvent.UnitReborn({
            unitId: idOf(first),
            hp: 1,
          }),
          summoned("player"),
        ],
      })
    ).toBe(true);
  });

  it("allDamageTypes: damage of all 5 Damage Types from the Player's Units and Skill Cards", () => {
    const four = [
      damage("physical", unitDealer("player")),
      damage("fire", heroDealer("player")),
      damage("frost", unitDealer("player")),
      damage("holy", heroDealer("player")),
    ];
    expect(
      meets("allDamageTypes", {
        events: [...four, damage("lightning", heroDealer("player"))],
      })
    ).toBe(true);
    expect(meets("allDamageTypes", { events: four })).toBe(false);
    // Damage of the enemy, damage with no dealer (Burn, Poison) and no damage do not count.
    for (const other of [
      damage("lightning", unitDealer("enemy")),
      damage("lightning", null),
      damage("lightning", heroDealer("player"), 0),
    ]) {
      expect(meets("allDamageTypes", { events: [...four, other] })).toBe(false);
    }
  });

  it("fourCards: 4 cards of the Player's Side in one Turn", () => {
    const three = Array.from({ length: FOUR_CARDS - 1 }, () =>
      cardPlayed("player")
    );
    expect(
      meets("fourCards", { events: [...three, cardPlayed("player")] })
    ).toBe(true);
    expect(
      meets("fourCards", {
        events: [
          ...three,
          BattleEvent.TurnStarted({ side: "enemy", turnNumber: 1 }),
          cardPlayed("enemy"),
          BattleEvent.TurnStarted({ side: "player", turnNumber: 2 }),
          cardPlayed("player"),
        ],
      })
    ).toBe(false);
  });

  it("keywords: 10 different Keywords of the Player's Units activate", () => {
    expect(TEN_KEYWORDS).toHaveLength(FEAT_KEYWORDS);
    const nine = TEN_KEYWORDS.slice(0, -1).map((each) =>
      activated(each, "player")
    );
    expect(
      meets("keywords", {
        events: [...nine, activated("regenerate", "player")],
      })
    ).toBe(true);
    expect(
      meets("keywords", { events: [...nine, activated("charge", "player")] })
    ).toBe(false);
    expect(
      meets("keywords", { events: [...nine, activated("regenerate", "enemy")] })
    ).toBe(false);
  });

  it("noLosses: a Dungeon where no Unit of the Player's Side dies", () => {
    const place = dungeon("dungeon-1");
    const mine = summoned("player");
    const token = tokenSummoned("player");
    const theirs = summoned("enemy");
    const base = [mine, token, theirs];
    expect(
      meets("noLosses", {
        place,
        events: [
          ...base,
          BattleEvent.UnitDied({ unitId: idOf(theirs) }),
          BattleEvent.UnitRemoved({ unitId: idOf(mine) }),
        ],
      })
    ).toBe(true);
    expect(meets("noLosses", { place: BOSS_STAGE, events: base })).toBe(false);
    expect(
      meets("noLosses", {
        place,
        events: [...base, BattleEvent.UnitDied({ unitId: idOf(token) })],
      })
    ).toBe(false);
    // A death with Rebirth is a death too.
    expect(
      meets("noLosses", {
        place,
        events: [
          ...base,
          BattleEvent.UnitReborn({ unitId: idOf(mine), hp: 1 }),
        ],
      })
    ).toBe(false);
  });

  it("noLosses reads the engine events: a Rebirth death sends UnitReborn and no UnitDied, and the second death sends UnitDied", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["undead.coffinLancer", 0]]);
    // Attack 5 − Bulwark 1: each attack deals 4 damage to the Coffin Lancer (5 HP).
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 3,
      attack: 5,
      hp: 50,
      maxHp: 50,
    });
    preventRout(state);
    let out = run(
      state,
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 2 }),
      })
    );
    const events = [...out.events];
    for (let turn = 0; turn < 10; turn += 1) {
      if (eventsOfType(events, "UnitDied").length > 0) {
        break;
      }
      preventRout(out.state);
      out = run(out.state, Command.EndTurn());
      events.push(...out.events);
    }
    const [lancer] = eventsOfType(events, "UnitSummoned");
    const id = lancer?.unit.id;
    expect(lancer?.unit.owner).toBe("player");
    expect(
      events.flatMap((event) =>
        event._tag === "UnitReborn" || event._tag === "UnitDied"
          ? [`${event._tag}:${event.unitId}`]
          : []
      )
    ).toEqual([`UnitReborn:${id}`, `UnitDied:${id}`]);
    const reborn = events.findIndex((event) => event._tag === "UnitReborn");
    const place = dungeon("dungeon-1");
    expect(meets("noLosses", { place, events: events.slice(0, reborn) })).toBe(
      true
    );
    expect(
      meets("noLosses", { place, events: events.slice(0, reborn + 1) })
    ).toBe(false);
  });

  it("untouchedVault: Dungeon 3 with the Hero at full HP", () => {
    const full = wonState({ hp: 30 });
    expect(
      meets("untouchedVault", { place: dungeon("dungeon-3"), state: full })
    ).toBe(true);
    expect(
      meets("untouchedVault", { place: dungeon("dungeon-2"), state: full })
    ).toBe(false);
    expect(
      meets("untouchedVault", {
        place: dungeon("dungeon-3"),
        state: wonState({ hp: 29 }),
      })
    ).toBe(false);
  });

  it("a loss, an unfinished Battle and a place that is not in the game complete nothing", () => {
    const all: Partial<FeatBattle> = {
      place: BOSS_STAGE,
      deck: threeOf("common", ["human.shieldbearer"]),
      state: wonState({ hp: 30, turnNumber: 2 }),
    };
    expect(metFeats(battle(all))).toEqual([
      "onlyHuman",
      "creaturesOnly",
      "untouched",
      "swiftBoss",
    ]);
    const lost = wonState({
      hp: 30,
      turnNumber: 2,
      result: { winner: "enemy", reason: "routed" },
    });
    expect(metFeats(battle({ ...all, state: lost }))).toEqual([]);
    const ongoing = wonState({ hp: 30, turnNumber: 2, result: null });
    expect(metFeats(battle({ ...all, state: ongoing }))).toEqual([]);
    for (const place of [
      stage("qa-1"),
      dungeon("qa-dungeon"),
      { kind: "floor", floor: 51 } as const,
    ]) {
      expect(metFeats(battle({ ...all, place }))).toEqual([]);
    }
  });
});

describe("recordFeats (Achievements 1.3)", () => {
  /** A Profile that won the Tutorial Stage. */
  const player: Profile = {
    ...newProfile(7),
    stageResults: { [TUTORIAL_STAGE_ID]: 3 },
  };
  const lastStand = battle({ state: wonState({ hp: 1 }) });

  it("records each Feat that the Battle meets as Completed", () => {
    const routed = battle({
      state: wonState({
        hp: 2,
        result: { winner: "player", reason: "routed" },
      }),
    });
    const record = recordFeats(player, routed);
    expect(record.achievements.map((each) => each.id)).toEqual([
      "feat.lastStand",
      "feat.rout",
    ]);
    expect(record.profile.completedAchievements).toEqual([
      "feat.lastStand",
      "feat.rout",
    ]);
    expect(record.profile.stageResults).toBe(player.stageResults);
  });

  it("completes a Feat one time: a repeat win of a Completed or Claimed Feat gives back the same Profile", () => {
    for (const done of [
      { ...player, completedAchievements: ["feat.lastStand"] },
      {
        ...player,
        completedAchievements: ["feat.lastStand"],
        claimedAchievements: ["feat.lastStand"],
      },
    ]) {
      const record = recordFeats(done, lastStand);
      expect(record.achievements).toEqual([]);
      expect(record.profile).toBe(done);
    }
  });

  it("gives back the same Profile for a loss", () => {
    const lost = battle({
      state: wonState({
        hp: 1,
        result: { winner: "enemy", reason: "heroDefeated" },
      }),
    });
    expect(recordFeats(player, lost).profile).toBe(player);
  });

  it("completes nothing in the Tutorial: Stage 1-1 before its first win", () => {
    const tutorial = battle({ ...lastStand, place: stage(TUTORIAL_STAGE_ID) });
    const fresh = newProfile(7);
    expect(recordFeats(fresh, tutorial).profile).toBe(fresh);
    expect(recordFeats(player, tutorial).achievements).toEqual([
      getAchievement("feat.lastStand"),
    ]);
  });
});

/** A real Battle: a fixed seed, and the AI makes the Commands of both Sides. */
interface FeatFixture {
  readonly feat: FeatId;
  readonly place: FeatPlace;
  readonly classId: ClassId;
  readonly deck: readonly DeckEntry[];
  readonly level: number;
  readonly gear: GearLevels;
  readonly seed: number;
}

const MAX_GEAR: GearLevels = {
  weapon: MAX_GEAR_LEVEL,
  armor: MAX_GEAR_LEVEL,
  trinket: MAX_GEAR_LEVEL,
  banner: MAX_GEAR_LEVEL,
};

/** 5 Creature Cards of each Race: 15 copies, the minimum Deck at level 30. */
const RACE_CARDS: Readonly<Record<RaceId, readonly string[]>> = {
  human: [
    "human.militiaRecruit",
    "human.shieldbearer",
    "human.crossbowGuard",
    "human.halberdier",
    "human.riverKnight",
  ],
  elf: [
    "elf.brambleDuelist",
    "elf.fernwingCourier",
    "elf.thornlineArcher",
    "elf.amberwingDart",
    "elf.canopyVinewarden",
  ],
  undead: [
    "undead.graveyardDrudge",
    "undead.rattleknife",
    "undead.coffinLancer",
    "undead.winterMaw",
    "undead.paleGalloper",
  ],
  orc: [
    "orc.badlandRunt",
    "orc.scrapRaider",
    "orc.howlingCharger",
    "orc.skyreaver",
    "orc.tuskBrute",
  ],
  goblin: [
    "goblin.ankleSnatcher",
    "goblin.fuseRunner",
    "goblin.junkSlinger",
    "goblin.bombLobber",
    "goblin.junkWalker",
  ],
  feral: [
    "feral.bristlebackBoar",
    "feral.frostfangLynx",
    "feral.caveBear",
    "feral.cragRhino",
    "feral.avalancheYeti",
  ],
};

/** A strong Player: level 30, all Gear at the maximum level, Legendary copies. */
const strong = (
  feat: FeatId,
  place: FeatPlace,
  deck: readonly DeckEntry[],
  seed: number,
  classId: ClassId = "warrior"
): FeatFixture => ({
  feat,
  place,
  classId,
  deck,
  level: 30,
  gear: MAX_GEAR,
  seed,
});

const raceFixture = (feat: FeatId, race: RaceId): FeatFixture =>
  strong(feat, BOSS_STAGE, threeOf("legendary", RACE_CARDS[race]), 1);

/** For each Feat, one real Battle that completes it (Achievements 3). */
const FIXTURES: readonly FeatFixture[] = [
  raceFixture("onlyHuman", "human"),
  raceFixture("onlyElf", "elf"),
  raceFixture("onlyUndead", "undead"),
  raceFixture("onlyOrc", "orc"),
  raceFixture("onlyGoblin", "goblin"),
  raceFixture("onlyFeral", "feral"),
  raceFixture("creaturesOnly", "elf"),
  strong("commonOnly", stage("3-10"), threeOf("common", RACE_CARDS.human), 54),
  raceFixture("untouched", "orc"),
  strong(
    "swiftBoss",
    BOSS_STAGE,
    threeOf("legendary", [
      "ranger.longShot",
      "ranger.harryingShot",
      "ranger.quickShot",
      "orc.skyreaver",
      "elf.amberwingDart",
    ]),
    2,
    "ranger"
  ),
  {
    feat: "lastStand",
    place: BOSS_STAGE,
    classId: "warrior",
    deck: threeOf("common", RACE_CARDS.feral),
    level: 20,
    gear: NO_GEAR,
    seed: 203,
  },
  strong("rout", BOSS_STAGE, threeOf("legendary", RACE_CARDS.goblin), 6),
  strong("fullZone", BOSS_STAGE, threeOf("legendary", RACE_CARDS.undead), 1),
  strong(
    "allDamageTypes",
    BOSS_STAGE,
    threeOf("legendary", [
      "mage.spark",
      "mage.fireball",
      "mage.frostBolt",
      "human.dawnCleric",
      "orc.badlandRunt",
    ]),
    1,
    "mage"
  ),
  strong(
    "fourCards",
    BOSS_STAGE,
    threeOf("legendary", [
      "orc.badlandRunt",
      "goblin.fuseRunner",
      "undead.rattleknife",
      "warrior.warDrums",
      "warrior.onslaught",
    ]),
    2
  ),
  strong(
    "keywords",
    stage("3-10"),
    (
      [
        ["human.shieldbearer", 2],
        ["human.halberdier", 2],
        ["human.riverKnight", 2],
        ["human.gateWarden", 1],
        ["human.bannerChaplain", 2],
        ["human.dawnCleric", 2],
        ["orc.scrapRaider", 2],
        ["elf.canopyVinewarden", 1],
        ["elf.acornTender", 2],
        ["undead.coffinLancer", 2],
        ["undead.graveyardDrudge", 2],
        ["undead.hushbow", 2],
        ["goblin.ankleSnatcher", 2],
        ["goblin.tunnelSaboteur", 2],
        ["feral.bristlebackBoar", 2],
        ["feral.frostfangLynx", 2],
      ] as const
    ).flatMap(([cardId, count]) => copies(count, cardId, "legendary")),
    26
  ),
  strong(
    "noLosses",
    dungeon("dungeon-1"),
    threeOf("legendary", [
      "priest.sanctuary",
      "priest.blessingOfLight",
      "priest.unbrokenVow",
      "feral.woollyMammoth",
      "feral.caveTroll",
    ]),
    3,
    "priest"
  ),
  strong(
    "untouchedVault",
    dungeon("dungeon-3"),
    threeOf("legendary", RACE_CARDS.feral),
    1
  ),
];

const setupOf = (fixture: FeatFixture): BattleSetup => {
  const { place, seed } = fixture;
  const player = {
    classId: fixture.classId,
    deck: fixture.deck,
    level: fixture.level,
    gear: fixture.gear,
  };
  switch (place.kind) {
    case "stage": {
      return { seed, stage: getStage(place.stageId), player };
    }
    case "dungeon": {
      return { seed, dungeon: getDungeon(place.dungeonId), player };
    }
    case "floor": {
      return { seed, floor: getFloor(place.floor), player };
    }
    default: {
      throw new Error("Unknown place");
    }
  }
};

/** Plays the Battle of the fixture to its end, with all its Battle Events. */
const play = (fixture: FeatFixture): FeatBattle => {
  const start = createBattle(setupOf(fixture));
  const events = [...start.events];
  const state = playOut(start.state, undefined, undefined, (stepEvents) => {
    events.push(...stepEvents);
  });
  return { place: fixture.place, deck: fixture.deck, state, events };
};

describe("each Feat can be done (Achievements 3)", () => {
  it("has a real Battle for each Feat of the list", () => {
    const feats = ACHIEVEMENTS.flatMap((achievement) =>
      achievement.goal.kind === "feat" ? [achievement.goal.feat] : []
    );
    expect(FIXTURES.map((fixture) => fixture.feat).toSorted()).toEqual(
      feats.toSorted()
    );
  });

  it.each(FIXTURES.map((fixture) => [fixture.feat, fixture] as const))(
    "%s: a real Battle with a valid Deck completes it",
    (feat, fixture) => {
      const collection = fixture.deck.map((entry) => ({ ...entry, copies: 3 }));
      expect(
        isDeckValid({
          deck: fixture.deck,
          classId: fixture.classId,
          level: fixture.level,
          collection,
        })
      ).toBe(true);
      const played = play(fixture);
      expect(played.state.result?.winner).toBe("player");
      expect(metFeats(played)).toContain(feat);
    }
  );
});
