import { describe, expect, it, vi } from "vitest";

import { ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { getCard } from "../content/cards";
import { getStarterDeck } from "../content/decks";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import type { DeckEntry, RankId } from "../content/schema";
import { UNLOCK_LEVELS } from "../content/unlocks";
import {
  CRAFT_ESSENCE,
  EXTRACT_ESSENCE,
  FUSE_ESSENCE,
} from "../content/workshop";
import { newProfile } from "./new-profile";
import { discoveredCards } from "./packs";
import type { DeckSlot, Profile } from "./schema";
import {
  combine,
  combineCopies,
  craft,
  craftCopy,
  decksUsingCopy,
  decksUsingInputs,
  extract,
  extractCopy,
  fuse,
  fuseChances,
  fusePool,
  fuseRecipe,
} from "./workshop";

/**
 * A test card with Base Rank Legendary: it has no Craft cost, as each Epic or
 * Legendary Base Rank card (ADR-0050).
 */
const LEGENDARY_BASE = "test.legendaryBase";

vi.mock(import("../content/cards"), async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    getCard: (cardId: string) =>
      cardId === "test.legendaryBase"
        ? {
            ...original.getCard("human.ironBulwark"),
            id: cardId,
            baseRank: "legendary" as const,
          }
        : original.getCard(cardId),
  };
});

const RECRUIT = "human.militiaRecruit";
const GUARD = "human.crossbowGuard";
/** Base Rank Uncommon. */
const KNIGHT = "human.riverKnight";
/** Base Rank Rare. */
const COURIER = "human.kingsCourier";
/** Base Rank Epic: like each Epic or Legendary Base Rank card, it has no Craft cost (ADR-0050). */
const BULWARK = "human.ironBulwark";

/** The XP at the start of a Player level. */
const xpAt = (level: number): number => PLAYER_LEVEL_XP[level - 1] ?? 0;

const fresh = newProfile(1);
const VANGUARD = getStarterDeck("vanguard").deck;
const profile = (overrides: Partial<Profile> = {}): Profile => ({
  ...fresh,
  xp: xpAt(UNLOCK_LEVELS.craft),
  coin: 10_000,
  essence: 10_000,
  ...overrides,
});

const entry = (cardId: string, rank: RankId): DeckEntry => ({ cardId, rank });
const slot = (id: string, deck: readonly DeckEntry[]): DeckSlot => ({
  id,
  name: "",
  classId: "warrior",
  deck,
});
const slotDeck = (result: Profile | null, id: string) =>
  result?.deckSlots.find((deckSlot) => deckSlot.id === id)?.deck;

describe("combine (GDD 7.4)", () => {
  it("changes 2 copies into 1 copy of the next Rank for its Coin", () => {
    const result = combine(profile({ coin: 60 }), RECRUIT, "common");
    expect(result?.coin).toBe(10);
    expect(ownedCopies(result?.collection ?? [], RECRUIT, "common")).toBe(0);
    expect(ownedCopies(result?.collection ?? [], RECRUIT, "uncommon")).toBe(1);
  });

  it("adds 1 to the combines Tally (Achievements 1.5)", () => {
    expect(combine(profile(), RECRUIT, "common")?.tallies.combines).toBe(1);
  });

  it("keeps the entry with 0 copies, so the card stays Discovered", () => {
    const result = combine(profile(), RECRUIT, "common");
    expect(result?.collection).toContainEqual({
      cardId: RECRUIT,
      rank: "common",
      copies: 0,
    });
    expect(result?.collection.at(-1)).toEqual({
      cardId: RECRUIT,
      rank: "uncommon",
      copies: 1,
    });
  });

  it("costs the Coin of the target Rank", () => {
    const collection: Collection = [
      { cardId: COURIER, rank: "epic", copies: 2 },
    ];
    const result = combine(profile({ collection }), COURIER, "epic");
    expect(result?.coin).toBe(10_000 - 3200);
    expect(ownedCopies(result?.collection ?? [], COURIER, "legendary")).toBe(1);
  });

  it("is null below the unlock level", () => {
    const xp = xpAt(UNLOCK_LEVELS.combine) - 1;
    expect(combine(profile({ xp }), RECRUIT, "common")).toBeNull();
    expect(combine(profile({ xp: xp + 1 }), RECRUIT, "common")).not.toBeNull();
  });

  it("is null for a Legendary copy", () => {
    const collection: Collection = [
      { cardId: COURIER, rank: "legendary", copies: 2 },
    ];
    expect(combine(profile({ collection }), COURIER, "legendary")).toBeNull();
  });

  it("is null with fewer than 2 copies in the Rank", () => {
    expect(combine(profile(), "warrior.spearThrow", "uncommon")).toBeNull();
    expect(combine(profile(), COURIER, "rare")).toBeNull();
  });

  it("is null without enough Coin", () => {
    expect(combine(profile({ coin: 49 }), RECRUIT, "common")).toBeNull();
    expect(combine(profile({ coin: 50 }), RECRUIT, "common")?.coin).toBe(0);
  });

  it("puts the new-Rank copy in place of 2 old-Rank entries in one Deck", () => {
    const result = combine(profile(), RECRUIT, "common");
    expect(slotDeck(result, "vanguard")).toEqual([
      entry(RECRUIT, "uncommon"),
      ...VANGUARD.slice(2),
    ]);
  });

  it("changes the entries in each Deck that uses the old-Rank copies", () => {
    const decks = [
      slot("a", [entry(GUARD, "common"), entry(RECRUIT, "common")]),
      slot("b", [entry(RECRUIT, "common"), entry(GUARD, "common")]),
      slot("c", [entry(RECRUIT, "common"), entry(RECRUIT, "common")]),
    ];
    const collection = (copies: number): Collection => [
      { cardId: RECRUIT, rank: "common", copies },
      { cardId: GUARD, rank: "common", copies: 3 },
    ];
    // 2 copies: no Common copy stays, so each Deck uses the Uncommon copy.
    const result = combine(
      profile({ collection: collection(2), deckSlots: decks }),
      RECRUIT,
      "common"
    );
    expect(result?.deckSlots.map((deckSlot) => deckSlot.deck)).toEqual([
      [entry(GUARD, "common"), entry(RECRUIT, "uncommon")],
      [entry(RECRUIT, "uncommon"), entry(GUARD, "common")],
      [entry(RECRUIT, "uncommon")],
    ]);
    // 3 copies: 1 Common copy stays, so only Deck C changes.
    const start = profile({ collection: collection(3), deckSlots: decks });
    const partial = combine(start, RECRUIT, "common");
    expect(partial?.deckSlots[0]).toBe(start.deckSlots[0]);
    expect(partial?.deckSlots[1]).toBe(start.deckSlots[1]);
    expect(slotDeck(partial, "c")).toEqual([
      entry(RECRUIT, "common"),
      entry(RECRUIT, "uncommon"),
    ]);
  });

  it("adds no new-Rank entry to a Deck that uses all new-Rank copies", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "common", copies: 2 },
      { cardId: RECRUIT, rank: "uncommon", copies: 1 },
    ];
    const deck = [
      entry(RECRUIT, "uncommon"),
      entry(RECRUIT, "common"),
      entry(GUARD, "common"),
      entry(RECRUIT, "common"),
    ];
    const start = profile({ collection, deckSlots: [slot("a", deck)] });
    // 2 Uncommon copies after the Combine: the Deck can use 1 more.
    expect(slotDeck(combine(start, RECRUIT, "common"), "a")).toEqual([
      entry(RECRUIT, "uncommon"),
      entry(RECRUIT, "uncommon"),
      entry(GUARD, "common"),
    ]);
    const full = profile({
      collection,
      deckSlots: [slot("a", [...deck, entry(RECRUIT, "uncommon")])],
    });
    // The Deck has 4 Recruits before: not valid, but the count does not go up.
    expect(slotDeck(combine(full, RECRUIT, "common"), "a")).toEqual([
      entry(RECRUIT, "uncommon"),
      entry(GUARD, "common"),
      entry(RECRUIT, "uncommon"),
    ]);
  });

  it("changes nothing else in the Profile", () => {
    const start = profile();
    const result = combine(start, RECRUIT, "common");
    const changed = { coin: 0, collection: [], deckSlots: [], tallies: null };
    expect({ ...result, ...changed }).toEqual({ ...start, ...changed });
  });
});

describe("extract (GDD 7.4)", () => {
  it("changes 1 copy into the Essence of its Rank", () => {
    for (const rank of ["common", "rare", "legendary"] as const) {
      const collection: Collection = [{ cardId: GUARD, rank, copies: 2 }];
      const result = extract(profile({ essence: 7, collection }), GUARD, rank);
      expect(result?.essence).toBe(7 + EXTRACT_ESSENCE[rank]);
      expect(result?.collection).toEqual([{ cardId: GUARD, rank, copies: 1 }]);
    }
  });

  it("is null below the unlock level", () => {
    const xp = xpAt(UNLOCK_LEVELS.extract) - 1;
    expect(extract(profile({ xp }), GUARD, "common")).toBeNull();
    expect(extract(profile({ xp: xp + 1 }), GUARD, "common")).not.toBeNull();
  });

  it("is null without a copy in the Rank", () => {
    expect(extract(profile(), GUARD, "uncommon")).toBeNull();
    expect(extract(profile(), COURIER, "rare")).toBeNull();
  });

  it("takes the last entry out of each Deck that uses the copy", () => {
    const start = profile({
      deckSlots: [
        ...fresh.deckSlots,
        slot("guards", [
          entry(GUARD, "common"),
          entry(KNIGHT, "uncommon"),
          entry(GUARD, "common"),
        ]),
        slot("one", [entry(GUARD, "common")]),
      ],
    });
    // 3 copies: the Vanguard uses 3, "guards" 2, "one" 1.
    const result = extract(start, GUARD, "common");
    expect(slotDeck(result, "vanguard")).toEqual(VANGUARD.toSpliced(4, 1));
    expect(result?.deckSlots[1]).toBe(start.deckSlots[1]);
    expect(result?.deckSlots[3]).toBe(start.deckSlots[3]);
    expect(result?.deckSlots[4]).toBe(start.deckSlots[4]);
    const twice = extract(result ?? start, GUARD, "common");
    expect(slotDeck(twice, "guards")).toEqual([
      entry(GUARD, "common"),
      entry(KNIGHT, "uncommon"),
    ]);
    expect(slotDeck(twice, "one")).toEqual([entry(GUARD, "common")]);
  });

  it("can take the last copy: the Deck gets too few cards and the card stays Discovered", () => {
    const start = profile({ essence: 0 });
    const result = extract(start, "warrior.spearThrow", "uncommon");
    expect(slotDeck(result, "vanguard")).toEqual(VANGUARD.slice(0, -1));
    expect(result?.collection).toContainEqual({
      cardId: "warrior.spearThrow",
      rank: "uncommon",
      copies: 0,
    });
    expect(discoveredCards(result?.collection ?? [])).toContain(
      "warrior.spearThrow"
    );
    // 15 Essence: not enough for a Craft yet.
    expect(craft(result ?? start, "warrior.spearThrow")).toBeNull();
    const crafted = craft(
      { ...(result ?? start), essence: CRAFT_ESSENCE.uncommon ?? 0 },
      "warrior.spearThrow"
    );
    expect(crafted?.essence).toBe(0);
    expect(
      ownedCopies(crafted?.collection ?? [], "warrior.spearThrow", "uncommon")
    ).toBe(1);
  });

  it("changes nothing else in the Profile", () => {
    const start = profile();
    const result = extract(start, GUARD, "common");
    expect({
      ...result,
      essence: 0,
      collection: [],
      deckSlots: [],
    }).toEqual({ ...start, essence: 0, collection: [], deckSlots: [] });
  });
});

describe("craft (GDD 7.4)", () => {
  it("changes Essence into 1 copy in the Base Rank", () => {
    const result = craft(profile({ essence: 450 }), GUARD);
    expect(result?.essence).toBe(450 - 40);
    expect(ownedCopies(result?.collection ?? [], GUARD, "common")).toBe(4);
    expect(result?.tallies.crafts).toBe(1);
  });

  it("adds a new entry when the Player owns the card only in other Ranks", () => {
    const collection: Collection = [
      { cardId: COURIER, rank: "epic", copies: 1 },
    ];
    const result = craft(profile({ collection, essence: 400 }), COURIER);
    expect(result).toEqual(
      profile({
        essence: 0,
        collection: [
          ...collection,
          { cardId: COURIER, rank: "rare", copies: 1 },
        ],
        tallies: { ...fresh.tallies, crafts: 1 },
      })
    );
  });

  it("is null below the unlock level", () => {
    const xp = xpAt(UNLOCK_LEVELS.craft) - 1;
    expect(craft(profile({ xp }), GUARD)).toBeNull();
    expect(craft(profile({ xp: xp + 1 }), GUARD)).not.toBeNull();
  });

  it("is null for a card that is not Discovered", () => {
    expect(craft(profile(), COURIER)).toBeNull();
  });

  it("is null for an Epic or a Legendary Base Rank card: they have no Craft cost (ADR-0050)", () => {
    const collection: Collection = [
      { cardId: BULWARK, rank: "epic", copies: 1 },
      { cardId: LEGENDARY_BASE, rank: "legendary", copies: 1 },
    ];
    expect(craft(profile({ collection }), BULWARK)).toBeNull();
    expect(craft(profile({ collection }), LEGENDARY_BASE)).toBeNull();
  });

  it("is null without enough Essence", () => {
    expect(craft(profile({ essence: 119 }), KNIGHT)).toBeNull();
    expect(craft(profile({ essence: 120 }), KNIGHT)?.essence).toBe(0);
  });
});

describe("decksUsingCopy", () => {
  it("gives the Deck Slots that use more copies than stay after an Extract", () => {
    const start = profile({
      deckSlots: [
        ...fresh.deckSlots,
        slot("two", [entry(GUARD, "common"), entry(GUARD, "common")]),
      ],
    });
    // 3 copies: the Vanguard uses 3, "two" uses 2.
    expect(
      decksUsingCopy(start, GUARD, "common").map((deckSlot) => deckSlot.id)
    ).toEqual(["vanguard"]);
    const after = extract(start, GUARD, "common") ?? start;
    expect(
      decksUsingCopy(after, GUARD, "common").map((deckSlot) => deckSlot.id)
    ).toEqual(["vanguard", "two"]);
  });

  it("gives no Deck Slot when a copy stays free or the Player owns none", () => {
    const collection: Collection = [
      { cardId: GUARD, rank: "common", copies: 4 },
    ];
    expect(decksUsingCopy(profile({ collection }), GUARD, "common")).toEqual(
      []
    );
    expect(decksUsingCopy(profile(), GUARD, "rare")).toEqual([]);
  });
});

describe("the Collection rules", () => {
  it("are the Collection part of the actions, without level, Coin or Essence", () => {
    const { collection } = fresh;
    expect(combineCopies(collection, RECRUIT, "common")).toEqual(
      combine(profile(), RECRUIT, "common")?.collection
    );
    expect(extractCopy(collection, GUARD, "common")).toEqual(
      extract(profile(), GUARD, "common")?.collection
    );
    expect(craftCopy(collection, GUARD)).toEqual(
      craft(profile(), GUARD)?.collection
    );
    expect(craftCopy(collection, LEGENDARY_BASE)).toBeNull();
    expect(extractCopy(collection, GUARD, "rare")).toBeNull();
    expect(combineCopies(collection, KNIGHT, "legendary")).toBeNull();
  });
});

/** `count` copies of the card in the Rank, as Fuse inputs. */
const copies = (cardId: string, rank: RankId, count = 1) =>
  Array.from({ length: count }, () => entry(cardId, rank));
/** A Profile with only `collection` and one empty saved Deck. */
const fuseProfile = (
  collection: Collection,
  overrides: Partial<Profile> = {}
): Profile =>
  profile({ collection, deckSlots: [slot("empty", [])], ...overrides });

describe("fuse (GDD 7.4, ADR-0049)", () => {
  const SHIELDBEARER = "human.shieldbearer";
  const BARRICADE = "human.townBarricade";
  const ELF_GUARD = "elf.rootboundGuard";
  const ELF_RARES = [
    "elf.amberwingDart",
    "elf.elderreedDartmaster",
    "elf.seedwindShepherd",
  ];
  const HUMAN_RARES = [COURIER, "human.paviseArbalist", "human.dawnReliquary"];

  it("changes 2 Common copies and 20 Essence into 1 copy of a Card that is not Discovered", () => {
    const start = fuseProfile(
      [
        { cardId: RECRUIT, rank: "common", copies: 1 },
        { cardId: GUARD, rank: "common", copies: 1 },
      ],
      { essence: 25 }
    );
    const result = fuse(start, [
      entry(RECRUIT, "common"),
      entry(GUARD, "common"),
    ]);
    expect(result?.profile.essence).toBe(5);
    expect([SHIELDBEARER, BARRICADE, "human.halberdier"]).toContain(
      result?.cardId
    );
    const cardId = result?.cardId ?? "";
    expect(discoveredCards(start.collection)).not.toContain(cardId);
    expect(
      ownedCopies(result?.profile.collection ?? [], cardId, "common")
    ).toBe(1);
    expect(
      ownedCopies(result?.profile.collection ?? [], RECRUIT, "common")
    ).toBe(0);
    expect(result?.profile.tallies.fuses).toBe(1);
  });

  it("needs exactly 2, 2, 3 or 4 copies for Common, Uncommon, Rare or Epic", () => {
    const counts = { common: 2, uncommon: 2, rare: 3, epic: 4 } as const;
    for (const [rank, count] of Object.entries(counts)) {
      // SAFETY: the keys of `counts` are Ranks.
      const fuseRank = rank as RankId;
      const start = fuseProfile([
        { cardId: RECRUIT, rank: fuseRank, copies: 5 },
      ]);
      for (const inputs of [count - 1, count + 1]) {
        expect(
          fuse(start, copies(RECRUIT, fuseRank, inputs)),
          `${rank} × ${inputs}`
        ).toBeNull();
      }
      expect(
        fuse(start, copies(RECRUIT, fuseRank, count)),
        `${rank} × ${count}`
      ).not.toBeNull();
      expect(fuseRecipe(copies(RECRUIT, fuseRank))).toEqual({
        rank,
        kind: "creature",
        copies: count,
      });
    }
  });

  it("refuses copies of mixed Ranks", () => {
    const start = fuseProfile([
      { cardId: RECRUIT, rank: "common", copies: 1 },
      { cardId: RECRUIT, rank: "uncommon", copies: 1 },
    ]);
    const inputs = [entry(RECRUIT, "common"), entry(RECRUIT, "uncommon")];
    expect(fuseRecipe(inputs)).toBeNull();
    expect(fuse(start, inputs)).toBeNull();
  });

  it("refuses a mix of Creature Cards and Skill Cards", () => {
    const start = fuseProfile([
      { cardId: RECRUIT, rank: "common", copies: 1 },
      { cardId: "warrior.spearThrow", rank: "common", copies: 1 },
    ]);
    const inputs = [
      entry(RECRUIT, "common"),
      entry("warrior.spearThrow", "common"),
    ];
    expect(fuseRecipe(inputs)).toBeNull();
    expect(fuse(start, inputs)).toBeNull();
  });

  it("refuses a Legendary copy", () => {
    const start = fuseProfile([
      { cardId: RECRUIT, rank: "legendary", copies: 6 },
    ]);
    for (const count of [2, 3, 4, 5]) {
      expect(fuse(start, copies(RECRUIT, "legendary", count))).toBeNull();
    }
    expect(fuseRecipe(copies(RECRUIT, "legendary"))).toBeNull();
  });

  it("refuses more copies than the Player owns", () => {
    const start = fuseProfile([{ cardId: RECRUIT, rank: "common", copies: 1 }]);
    expect(fuse(start, copies(RECRUIT, "common", 2))).toBeNull();
  });

  it("counts a Combined copy at its copy Rank, not its Base Rank", () => {
    const start = fuseProfile([{ cardId: RECRUIT, rank: "rare", copies: 3 }]);
    expect(fusePool(start.collection, copies(RECRUIT, "rare"))).toEqual(
      HUMAN_RARES
    );
    const result = fuse(start, copies(RECRUIT, "rare", 3));
    expect(HUMAN_RARES).toContain(result?.cardId);
    expect(getCard(result?.cardId ?? "").baseRank).toBe("rare");
    expect(
      ownedCopies(
        result?.profile.collection ?? [],
        result?.cardId ?? "",
        "rare"
      )
    ).toBe(1);
    expect(result?.profile.essence).toBe(10_000 - FUSE_ESSENCE.rare);
  });

  it("gives each input copy one share for its Race", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "rare", copies: 2 },
      { cardId: ELF_GUARD, rank: "rare", copies: 1 },
    ];
    const inputs = [...copies(RECRUIT, "rare", 2), entry(ELF_GUARD, "rare")];
    expect(fuseChances(collection, inputs)).toEqual([
      { group: "human", inputs: 2, shares: 2, total: 3, cards: HUMAN_RARES },
      { group: "elf", inputs: 1, shares: 1, total: 3, cards: ELF_RARES },
    ]);
  });

  it("gives no share to a Race with no Card in the Fuse pool: the other shares grow", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "rare", copies: 2 },
      { cardId: ELF_GUARD, rank: "rare", copies: 1 },
      ...ELF_RARES.map((cardId) => ({
        cardId,
        rank: "rare" as const,
        copies: 0,
      })),
    ];
    const inputs = [...copies(RECRUIT, "rare", 2), entry(ELF_GUARD, "rare")];
    expect(fuseChances(collection, inputs)).toEqual([
      { group: "human", inputs: 2, shares: 2, total: 2, cards: HUMAN_RARES },
      { group: "elf", inputs: 1, shares: 0, total: 2, cards: [] },
    ]);
    for (let seed = 0; seed < 20; seed += 1) {
      const result = fuse(
        fuseProfile(collection, { rewardRandomState: seed }),
        inputs
      );
      expect(HUMAN_RARES).toContain(result?.cardId);
    }
  });

  it("is null when the Fuse pool is empty", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "rare", copies: 3 },
      ...HUMAN_RARES.map((cardId) => ({
        cardId,
        rank: "rare" as const,
        copies: 0,
      })),
    ];
    const inputs = copies(RECRUIT, "rare", 3);
    expect(fusePool(collection, inputs)).toEqual([]);
    expect(fuse(fuseProfile(collection), inputs)).toBeNull();
  });

  it("is null without enough Essence", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "common", copies: 2 },
    ];
    const inputs = copies(RECRUIT, "common", 2);
    expect(fuse(fuseProfile(collection, { essence: 19 }), inputs)).toBeNull();
    expect(
      fuse(fuseProfile(collection, { essence: 20 }), inputs)?.profile.essence
    ).toBe(0);
  });

  it("is null below the unlock level", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "common", copies: 2 },
    ];
    const inputs = copies(RECRUIT, "common", 2);
    const xp = xpAt(UNLOCK_LEVELS.fuse) - 1;
    expect(fuse(fuseProfile(collection, { xp }), inputs)).toBeNull();
    expect(
      fuse(fuseProfile(collection, { xp: xp + 1 }), inputs)
    ).not.toBeNull();
  });

  it("never gives a Specialist or a Card that was Discovered before", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "epic", copies: 4 },
      { cardId: ELF_GUARD, rank: "epic", copies: 4 },
    ];
    for (let seed = 0; seed < 40; seed += 1) {
      for (const inputs of [
        copies(RECRUIT, "epic", 4),
        [...copies(RECRUIT, "epic", 2), ...copies(ELF_GUARD, "epic", 2)],
      ]) {
        const result = fuse(
          fuseProfile(collection, { rewardRandomState: seed }),
          inputs
        );
        const card = getCard(result?.cardId ?? "");
        expect(card.baseRank).toBe("epic");
        expect(discoveredCards(collection)).not.toContain(card.id);
      }
    }
  });

  it("uses Skill Cards of the Class of each input copy", () => {
    const collection: Collection = [
      { cardId: "warrior.spearThrow", rank: "common", copies: 1 },
      { cardId: "mage.fireball", rank: "common", copies: 1 },
    ];
    const inputs = [
      entry("warrior.spearThrow", "common"),
      entry("mage.fireball", "common"),
    ];
    expect(fuseRecipe(inputs)?.kind).toBe("skill");
    expect(fusePool(collection, inputs)).toEqual([
      "warrior.shieldWall",
      "warrior.shoulderCharge",
      "warrior.shieldBash",
      "mage.frostBolt",
      "mage.frostShards",
      "mage.spark",
    ]);
  });

  it("gives the same Card for the same random state, and moves the state forward", () => {
    const collection: Collection = [
      { cardId: RECRUIT, rank: "rare", copies: 2 },
      { cardId: ELF_GUARD, rank: "rare", copies: 1 },
    ];
    const inputs = [...copies(RECRUIT, "rare", 2), entry(ELF_GUARD, "rare")];
    const seen = new Set<string>();
    for (let seed = 0; seed < 40; seed += 1) {
      const start = fuseProfile(collection, { rewardRandomState: seed });
      const first = fuse(start, inputs);
      expect(fuse(start, inputs)).toEqual(first);
      expect(first?.profile.rewardRandomState).not.toBe(seed);
      seen.add(first?.cardId ?? "");
    }
    // Both Races come up, and more than one Card of each.
    expect(seen.size).toBeGreaterThan(3);
    expect([...seen].some((cardId) => ELF_RARES.includes(cardId))).toBe(true);
  });

  it("can use the last copy of a Card: the Card stays Discovered", () => {
    const start = fuseProfile([{ cardId: RECRUIT, rank: "common", copies: 2 }]);
    const result = fuse(start, copies(RECRUIT, "common", 2));
    expect(result?.profile.collection).toContainEqual({
      cardId: RECRUIT,
      rank: "common",
      copies: 0,
    });
    expect(discoveredCards(result?.profile.collection ?? [])).toContain(
      RECRUIT
    );
  });

  it("takes the input copies out of each saved Deck that uses them", () => {
    // The Starter Collection: 2 Recruits, both in the Vanguard.
    const start = profile();
    const inputs = [entry(RECRUIT, "common"), entry(RECRUIT, "common")];
    expect(
      decksUsingInputs(start, inputs).map((deckSlot) => deckSlot.id)
    ).toEqual(["vanguard"]);
    const result = fuse(start, inputs);
    expect(slotDeck(result?.profile ?? null, "vanguard")).toEqual(
      VANGUARD.slice(2)
    );
    expect(result?.profile.deckSlots[1]).toBe(start.deckSlots[1]);
  });

  it("names no saved Deck when the input copies are spare", () => {
    const start = fuseProfile([{ cardId: GUARD, rank: "common", copies: 4 }], {
      deckSlots: [slot("a", copies(GUARD, "common", 2))],
    });
    expect(decksUsingInputs(start, copies(GUARD, "common", 2))).toEqual([]);
    expect(
      decksUsingInputs(start, copies(GUARD, "common", 3)).map(
        (deckSlot) => deckSlot.id
      )
    ).toEqual(["a"]);
    expect(decksUsingInputs(start, copies(GUARD, "common", 5))).toEqual([]);
  });

  it("changes nothing else in the Profile", () => {
    const start = profile();
    const result = fuse(start, copies(RECRUIT, "common", 2));
    const changed = {
      essence: 0,
      collection: [],
      deckSlots: [],
      tallies: null,
      rewardRandomState: 0,
    };
    expect({ ...result?.profile, ...changed }).toEqual({
      ...start,
      ...changed,
    });
  });
});
