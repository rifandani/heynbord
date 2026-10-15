import { describe, expect, it } from "vitest";

import { getCard } from "../content/cards";
import {
  DUNGEON_FORGE_STONE_CHANCE,
  DUNGEON_LEGENDARY_FORGE_STONE_CHANCE,
  DUNGEONS,
  dungeonReward,
  getDungeon,
  getDungeonRewards,
} from "../content/dungeons";
import { playerLevelForXp } from "../content/player-levels";
import type { DungeonDefinition } from "../content/schema";
import { applyDungeonResult, dungeonCardPool } from "./dungeon-result";
import type { DungeonResultInput } from "./dungeon-result";
import { newProfile } from "./new-profile";
import { discoveredCards } from "./packs";
import type { Profile } from "./schema";
import { FIRST_PACK, REPEAT_WIN_CARD_CHANCE } from "./stage-result";

const fresh = newProfile(42);
const dungeon1 = getDungeon("dungeon-1");
/** Dungeon 1 as Dungeon `number`, so a test can use the rewards of Dungeons 2 and 3. */
const asDungeon = (number: number): DungeonDefinition => ({
  ...dungeon1,
  id: `dungeon-${number}`,
  number,
});
const ALL_DUNGEONS: readonly DungeonDefinition[] = [
  ...DUNGEONS,
  asDungeon(2),
  asDungeon(3),
];

const win = (
  dungeonId = "dungeon-1",
  classId: DungeonResultInput["classId"] = "warrior"
): DungeonResultInput => ({ dungeonId, won: true, autoPlay: false, classId });
const autoPlayWin = (dungeonId = "dungeon-1"): DungeonResultInput => ({
  ...win(dungeonId),
  autoPlay: true,
});
const loss = (dungeonId = "dungeon-1"): DungeonResultInput => ({
  dungeonId,
  won: false,
  autoPlay: false,
  classId: "warrior",
});
/** A Profile that has won `dungeonId` `wins` times. */
const wonBefore = (
  dungeonId = "dungeon-1",
  wins = 1,
  profile = fresh
): Profile => ({
  ...profile,
  dungeonResults: { ...profile.dungeonResults, [dungeonId]: wins },
});
const apply = (profile: Profile, input: DungeonResultInput) =>
  applyDungeonResult(profile, input, ALL_DUNGEONS);
const copiesOf = (profile: Profile, cardId: string) =>
  profile.collection
    .filter((entry) => entry.cardId === cardId)
    .reduce((sum, entry) => sum + entry.copies, 0);

describe("applyDungeonResult: Coin, XP and Essence (Economy 2.4)", () => {
  it("gives × 3 Coin, × 2 XP, the first-win card and 1 win on a first win", () => {
    const { profile, rewards } = apply(fresh, win());
    expect(rewards.outcome).toBe("firstWin");
    expect([rewards.coin, rewards.xp, rewards.essence]).toEqual([600, 280, 0]);
    expect([profile.coin, profile.xp, profile.essence]).toEqual([600, 280, 0]);
    expect(profile.dungeonResults).toEqual({ "dungeon-1": 1 });
    expect(rewards.card).toMatchObject(dungeon1.firstWinCard);
    expect(rewards.card?.isNew).toBe(true);
    expect(copiesOf(profile, dungeon1.firstWinCard.cardId)).toBe(
      copiesOf(fresh, dungeon1.firstWinCard.cardId) + 1
    );
  });

  it("gives the win values on a repeat win and adds 1 to the wins", () => {
    const { profile, rewards } = apply(wonBefore("dungeon-1", 4), win());
    expect(rewards.outcome).toBe("win");
    expect([rewards.coin, rewards.xp, rewards.essence]).toEqual([200, 140, 0]);
    expect(profile.dungeonResults).toEqual({ "dungeon-1": 5 });
  });

  it("gives 10% Coin and 25% XP on a loss, and no card, win or random roll", () => {
    for (const before of [fresh, wonBefore("dungeon-1", 2)]) {
      const { profile, rewards } = apply(before, loss());
      expect(rewards.outcome).toBe("loss");
      expect([rewards.coin, rewards.xp, rewards.essence]).toEqual([20, 35, 0]);
      expect(rewards.card).toBeNull();
      expect(profile.dungeonResults).toBe(before.dungeonResults);
      expect(profile.collection).toBe(before.collection);
      expect(profile.rewardRandomState).toBe(before.rewardRandomState);
    }
  });

  it("uses the values of Dungeon 2", () => {
    expect(apply(fresh, win("dungeon-2")).rewards).toMatchObject({
      coin: 900,
      xp: 400,
      essence: 0,
    });
  });

  it("gives Essence in place of XP in Dungeon 3, and 100 Essence for its first win", () => {
    const first = apply({ ...fresh, essence: 7 }, win("dungeon-3"));
    expect(first.rewards).toMatchObject({ coin: 1200, xp: 0, essence: 100 });
    expect(first.profile.essence).toBe(107);
    expect(first.profile.xp).toBe(fresh.xp);
    expect(apply(first.profile, win("dungeon-3")).rewards).toMatchObject({
      coin: 400,
      xp: 0,
      essence: 15,
    });
    expect(apply(fresh, loss("dungeon-3")).rewards).toMatchObject(
      dungeonReward(getDungeonRewards(3), "loss")
    );
  });

  it("gives the values of dungeonReward for each Dungeon and outcome", () => {
    for (const number of [1, 2, 3]) {
      const dungeonId = `dungeon-${number}`;
      const definition = getDungeonRewards(number);
      for (const [profile, input, outcome] of [
        [fresh, win(dungeonId), "firstWin"],
        [wonBefore(dungeonId), win(dungeonId), "win"],
        [fresh, loss(dungeonId), "loss"],
      ] as const) {
        const { rewards } = apply(profile, input);
        expect(rewards.outcome).toBe(outcome);
        expect(rewards).toMatchObject(dungeonReward(definition, outcome));
      }
    }
  });

  it("gives no Stars and no Heynstones", () => {
    const before = { ...fresh, heynstones: 9, stageResults: { "1-1": 3 } };
    for (const input of [win(), loss()]) {
      const { profile } = apply(before, input);
      expect(profile.stageResults).toBe(before.stageResults);
      expect(profile.heynstones).toBe(9);
    }
    expect(
      apply(wonBefore("dungeon-1", 1, before), win()).profile
    ).toMatchObject({ stageResults: before.stageResults, heynstones: 9 });
  });

  it("rejects an unknown Dungeon", () => {
    expect(() => apply(fresh, win("dungeon-9"))).toThrow(/Unknown Dungeon/u);
    expect(() => applyDungeonResult(fresh, win("dungeon-3"))).toThrow(
      /Unknown Dungeon/u
    );
  });
});

describe("applyDungeonResult: Sweep Tickets (ADR-0035)", () => {
  it("adds 2 Sweep Tickets on a first win and on a repeat win that the Player plays", () => {
    const first = apply(fresh, win());
    expect(first.rewards.sweepTickets).toBe(2);
    expect(first.profile.sweepTickets).toBe(2);
    const repeat = apply(first.profile, win());
    expect(repeat.rewards.sweepTickets).toBe(2);
    expect(repeat.profile.sweepTickets).toBe(4);
  });

  it("adds no Sweep Tickets on an Auto-play win, but gives the other rewards", () => {
    const before = wonBefore("dungeon-1", 1, { ...fresh, sweepTickets: 3 });
    const { profile, rewards } = apply(before, autoPlayWin());
    expect(rewards.sweepTickets).toBe(0);
    expect(profile.sweepTickets).toBe(3);
    expect(rewards).toMatchObject({ outcome: "win", coin: 200, xp: 140 });
    expect(profile.dungeonResults).toEqual({ "dungeon-1": 2 });
  });

  it("adds no Sweep Tickets on a loss", () => {
    const { profile, rewards } = apply({ ...fresh, sweepTickets: 3 }, loss());
    expect(rewards.sweepTickets).toBe(0);
    expect(profile.sweepTickets).toBe(3);
  });
});

/** Repeat wins of `dungeonId` in a row. Returns the rewards of each win. */
const repeatWins = (
  dungeonId: string,
  count: number,
  classId: DungeonResultInput["classId"] = "warrior"
) => {
  const all = [];
  let profile = wonBefore(dungeonId);
  for (let index = 0; index < count; index += 1) {
    const result = apply(profile, win(dungeonId, classId));
    all.push(result.rewards);
    ({ profile } = result);
  }
  return { rewards: all, profile };
};

describe("applyDungeonResult: Forge Stones (Economy 2.4, ADR-0038, ADR-0039)", () => {
  it("gives 3 Forge Stones of the tier of the Dungeon on a first win", () => {
    for (const [number, tier] of [
      [1, "uncommon"],
      [2, "rare"],
    ] as const) {
      const { profile, rewards } = apply(fresh, win(`dungeon-${number}`));
      expect(rewards.forgeStones).toEqual([{ tier, count: 3 }]);
      expect(profile.forgeStones).toEqual({ ...fresh.forgeStones, [tier]: 3 });
    }
  });

  it("gives 3 Epic and 1 Legendary Forge Stone on the first win of Dungeon 3", () => {
    const { profile, rewards } = apply(fresh, win("dungeon-3"));
    expect(rewards.forgeStones).toEqual([
      { tier: "epic", count: 3 },
      { tier: "legendary", count: 1 },
    ]);
    expect(profile.forgeStones).toEqual({
      ...fresh.forgeStones,
      epic: 3,
      legendary: 1,
    });
  });

  it("gives no Forge Stones on a loss", () => {
    for (const number of [1, 2, 3]) {
      const before = wonBefore(`dungeon-${number}`);
      const { profile, rewards } = apply(before, loss(`dungeon-${number}`));
      expect(rewards.forgeStones).toEqual([]);
      expect(profile.forgeStones).toEqual(before.forgeStones);
    }
  });

  it("gives 1 Forge Stone of the tier of the Dungeon on about 25% of repeat wins", () => {
    const REPEATS = 10_000;
    const { rewards, profile } = repeatWins("dungeon-1", REPEATS);
    const hits = rewards.filter((reward) => reward.forgeStones.length > 0);
    for (const reward of hits) {
      expect(reward.forgeStones).toEqual([{ tier: "uncommon", count: 1 }]);
    }
    expect(DUNGEON_FORGE_STONE_CHANCE).toBe(2500);
    expect(hits.length / REPEATS).toBeGreaterThan(0.23);
    expect(hits.length / REPEATS).toBeLessThan(0.27);
    expect(profile.forgeStones).toEqual({
      ...fresh.forgeStones,
      uncommon: hits.length,
    });
  });

  it("rolls the Epic and the Legendary Forge Stone of a Dungeon 3 repeat win separately", () => {
    const REPEATS = 10_000;
    const { rewards } = repeatWins("dungeon-3", REPEATS);
    const count = (tier: string) =>
      rewards.filter((reward) =>
        reward.forgeStones.some(
          (stones) => stones.tier === tier && stones.count === 1
        )
      ).length;
    const both = rewards.filter(
      (reward) => reward.forgeStones.length === 2
    ).length;
    expect(DUNGEON_LEGENDARY_FORGE_STONE_CHANCE).toBe(1000);
    expect(count("epic") / REPEATS).toBeGreaterThan(0.23);
    expect(count("epic") / REPEATS).toBeLessThan(0.27);
    expect(count("legendary") / REPEATS).toBeGreaterThan(0.085);
    expect(count("legendary") / REPEATS).toBeLessThan(0.115);
    // Separate rolls: about 25% × 10% of the wins give both.
    expect(both / REPEATS).toBeGreaterThan(0.018);
    expect(both / REPEATS).toBeLessThan(0.032);
  });
});

describe("applyDungeonResult: the repeat-win card (Economy 2.4)", () => {
  const REPEATS = 10_000;

  it("gives a card on about 20% of repeat wins", () => {
    const { rewards } = repeatWins("dungeon-1", REPEATS);
    const cards = rewards.filter((reward) => reward.card !== null);
    expect(REPEAT_WIN_CARD_CHANCE).toBe(2000);
    expect(cards.length / REPEATS).toBeGreaterThan(0.18);
    expect(cards.length / REPEATS).toBeLessThan(0.22);
  });

  it("gives each card of the Dungeon card pool with the same chance, in its Base Rank", () => {
    const pool = dungeonCardPool(dungeon1, "ranger");
    const counts = new Map(pool.map((cardId) => [cardId, 0]));
    const { rewards } = repeatWins("dungeon-1", 40_000, "ranger");
    let hits = 0;
    for (const { card } of rewards) {
      if (card) {
        hits += 1;
        expect(card.rank).toBe(getCard(card.cardId).baseRank);
        counts.set(card.cardId, (counts.get(card.cardId) ?? 0) + 1);
      }
    }
    expect([...counts.keys()]).toEqual(pool);
    const expected = hits / pool.length;
    for (const [cardId, count] of counts) {
      expect(count / expected, cardId).toBeGreaterThan(0.85);
      expect(count / expected, cardId).toBeLessThan(1.15);
    }
  });

  it("never gives a Skill Card of another Class", () => {
    const { rewards } = repeatWins("dungeon-1", 2000, "warrior");
    for (const { card } of rewards) {
      if (card) {
        expect(getCard(card.cardId).kind, card.cardId).toBe("creature");
      }
    }
  });

  it("gives the same rewards from the same Profile", () => {
    const before = wonBefore();
    expect(apply(before, win())).toEqual(apply(before, win()));
  });

  it("moves the reward random state forward on a miss too", () => {
    let profile = wonBefore();
    for (let index = 0; index < 20; index += 1) {
      const result = apply(profile, win());
      expect(result.profile.rewardRandomState).not.toBe(
        profile.rewardRandomState
      );
      ({ profile } = result);
    }
  });
});

describe("dungeonCardPool", () => {
  it("has the different cards of the Decks of all Bosses, without Skill Cards of another Class", () => {
    const creatures = [
      "goblin.grandGearjammer",
      "orc.bonestakePalisade",
      "goblin.junkBarricade",
      "goblin.scrapPlateGuard",
      "goblin.fuseRunner",
      "orc.scrapRaider",
      "elf.fernwingCourier",
      "elf.rootboundGuard",
      "elf.acornTender",
      "goblin.ankleSnatcher",
      "goblin.junkSlinger",
    ];
    expect(dungeonCardPool(dungeon1, "warrior")).toEqual(creatures);
    expect(dungeonCardPool(dungeon1, "mage")).toEqual(creatures);
    expect(dungeonCardPool(dungeon1, "ranger")).toEqual([
      ...creatures,
      "ranger.quickShot",
    ]);
  });

  it("does not have the cards of the Boss Rules", () => {
    expect(dungeonCardPool(dungeon1, "warrior")).not.toContain(
      "orc.mesaPitFighter"
    );
  });
});

describe("applyDungeonResult: level up (GDD 7.1)", () => {
  it("gives the level before and after, and the First Pack at the Packs unlock", () => {
    const { rewards, profile } = apply({ ...fresh, xp: 100 }, win());
    expect(rewards.levelBefore).toBe(1);
    expect(rewards.levelAfter).toBe(playerLevelForXp(380));
    expect(rewards.unopenedPacks).toEqual([FIRST_PACK]);
    expect(profile.unopenedPacks).toEqual([FIRST_PACK]);
    const second = apply(profile, win());
    expect(second.rewards.unopenedPacks).toEqual([]);
    expect(second.profile.unopenedPacks).toEqual([FIRST_PACK]);
  });

  it("marks the card as not new when the Player has Discovered it", () => {
    const { cardId } = dungeon1.firstWinCard;
    expect(discoveredCards(fresh.collection).has(cardId)).toBe(false);
    const owned: Profile = {
      ...fresh,
      collection: [...fresh.collection, { cardId, rank: "common", copies: 1 }],
    };
    expect(apply(owned, win()).rewards.card?.isNew).toBe(false);
  });
});
