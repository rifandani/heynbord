import { describe, expect, it, vi } from "vitest";

import { ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { getStarterDeck } from "../content/decks";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import type { DeckEntry, RankId } from "../content/schema";
import { UNLOCK_LEVELS } from "../content/unlocks";
import { CRAFT_ESSENCE, EXTRACT_ESSENCE } from "../content/workshop";
import { newProfile } from "./new-profile";
import { discoveredCards } from "./packs";
import type { DeckSlot, Profile } from "./schema";
import {
  combine,
  combineCopies,
  craft,
  craftCopy,
  decksUsingCopy,
  extract,
  extractCopy,
} from "./workshop";

/** A test card with Base Rank Legendary: no v1 card has one, so it has no Craft cost. */
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

  it("is null for a card without a Craft cost", () => {
    const collection: Collection = [
      { cardId: LEGENDARY_BASE, rank: "legendary", copies: 1 },
    ];
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
