import type { Collection, DeckSlot } from "@workspace/rules";
import { combinePath, getCard, RANKS } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { DEFAULT_POOL_FILTER } from "@/features/deck/deck";
import {
  cardRanks,
  combineFocusAfter,
  combineState,
  craftState,
  EXTRACT_MOTION,
  emptyGridText,
  extractNeedsConfirm,
  extractTimeline,
  legendaryPath,
  rankCopies,
  selectedTile,
  shownRank,
  workshopTiles,
} from "@/features/workshop/workshop";

const RECRUIT = "human.militiaRecruit";
const KNIGHT = "human.riverKnight";
const BULWARK = "human.ironBulwark";
const RUNT = "orc.badlandRunt";

const collection: Collection = [
  { cardId: RECRUIT, rank: "common", copies: 3 },
  { cardId: RECRUIT, rank: "rare", copies: 1 },
  { cardId: KNIGHT, rank: "uncommon", copies: 1 },
  // Discovered, with 0 copies after an Extract.
  { cardId: RUNT, rank: "common", copies: 0 },
];

const DECK: DeckSlot = {
  id: "deck-1",
  name: "",
  classId: "warrior",
  deck: [],
};

describe("cardRanks", () => {
  it("goes from the Base Rank to Legendary", () => {
    expect(cardRanks(getCard(RECRUIT))).toEqual([
      "common",
      "uncommon",
      "rare",
      "epic",
      "legendary",
    ]);
    expect(cardRanks(getCard(BULWARK))).toEqual(["epic", "legendary"]);
  });
});

describe("rankCopies and shownRank", () => {
  it("has a row for each Rank of the card, with 0 for a Rank with no entry", () => {
    expect(rankCopies(collection, RECRUIT)).toEqual([
      { rank: "common", copies: 3 },
      { rank: "uncommon", copies: 0 },
      { rank: "rare", copies: 1 },
      { rank: "epic", copies: 0 },
      { rank: "legendary", copies: 0 },
    ]);
  });

  it("shows the highest Rank with a copy, else the Base Rank", () => {
    expect(shownRank(rankCopies(collection, RECRUIT))).toBe("rare");
    expect(shownRank(rankCopies(collection, RUNT))).toBe("common");
    expect(shownRank(rankCopies([], BULWARK))).toBe("epic");
  });
});

const ids = (ownership: "owned" | "notOwned") =>
  workshopTiles(collection, { ...DEFAULT_POOL_FILTER, ownership }).map(
    (tile) => tile.cardId
  );

describe("workshopTiles", () => {
  it("has one tile for each Discovered card, also with 0 copies, in Countdown order", () => {
    const tiles = workshopTiles(collection, DEFAULT_POOL_FILTER);
    expect(tiles.map((tile) => tile.cardId).toSorted()).toEqual(
      [KNIGHT, RECRUIT, RUNT].toSorted()
    );
    const countdowns = tiles.map((tile) => getCard(tile.cardId).countdown);
    expect(countdowns).toEqual(countdowns.toSorted((a, b) => a - b));
  });

  it("marks a tile with a pair below Legendary", () => {
    const tiles = workshopTiles(collection, DEFAULT_POOL_FILTER);
    const pair = (cardId: string) =>
      tiles.find((tile) => tile.cardId === cardId)?.pairReady;
    expect(pair(RECRUIT)).toBe(true);
    expect(pair(KNIGHT)).toBe(false);
    expect(
      workshopTiles(
        [{ cardId: BULWARK, rank: "legendary", copies: 2 }],
        DEFAULT_POOL_FILTER
      )[0]?.pairReady
    ).toBe(false);
  });

  it("filters owned cards and cards with 0 copies", () => {
    expect(ids("owned").toSorted()).toEqual([KNIGHT, RECRUIT].toSorted());
    expect(ids("notOwned")).toEqual([RUNT]);
  });

  it("applies the kind and Race filters of the Deck builder", () => {
    expect(
      workshopTiles(collection, {
        ...DEFAULT_POOL_FILTER,
        kind: "creature",
        race: "orc",
      }).map((tile) => tile.cardId)
    ).toEqual([RUNT]);
    expect(
      workshopTiles(collection, { ...DEFAULT_POOL_FILTER, kind: "skill" })
    ).toEqual([]);
  });
});

describe("selectedTile", () => {
  const tiles = workshopTiles(collection, DEFAULT_POOL_FILTER);

  it("keeps the selected card while it is in the grid, else selects the first card", () => {
    expect(selectedTile(tiles, KNIGHT)?.cardId).toBe(KNIGHT);
    expect(selectedTile(tiles, BULWARK)).toBe(tiles[0]);
    expect(selectedTile(tiles, null)).toBe(tiles[0]);
    expect(selectedTile([], KNIGHT)).toBeNull();
  });
});

describe("emptyGridText", () => {
  it("tells if no card was found, or if the Ownership filter keeps none", () => {
    const orc = {
      ...DEFAULT_POOL_FILTER,
      kind: "creature" as const,
      race: "orc" as const,
    };
    const found: Collection = [{ cardId: RUNT, rank: "common", copies: 2 }];
    expect(emptyGridText([], orc).key).toBe("workshop.empty.noneFound");
    expect(emptyGridText(found, { ...orc, ownership: "notOwned" }).key).toBe(
      "workshop.empty.allOwned"
    );
    expect(emptyGridText(collection, { ...orc, ownership: "owned" }).key).toBe(
      "workshop.empty.noneOwned"
    );
    expect(emptyGridText(found, orc).args).toEqual({
      group: {
        key: "deckBuilder.groups.race",
        args: { race: { key: "races.orc" } },
      },
    });
  });
});

describe("combineState", () => {
  it("is ready with 2 copies and the Coin of the next Rank", () => {
    expect(combineState({ rank: "common", copies: 2 }, 50)).toEqual({
      kind: "ready",
      to: "uncommon",
      coin: 50,
    });
  });

  it("asks for 2 copies first, then for the Coin that is missing", () => {
    expect(combineState({ rank: "rare", copies: 1 }, 10_000)).toEqual({
      kind: "copies",
      to: "epic",
      coin: 800,
    });
    expect(combineState({ rank: "epic", copies: 2 }, 3000)).toEqual({
      kind: "coin",
      to: "legendary",
      coin: 3200,
      missing: 200,
    });
  });

  it("has no Combine for Legendary", () => {
    expect(combineState({ rank: "legendary", copies: 4 }, 10_000)).toBeNull();
  });
});

describe("craftState", () => {
  const common = getCard(RECRUIT);

  it("is locked below level 6", () => {
    expect(craftState(common, 5, 1000)).toEqual({ kind: "locked", level: 6 });
  });

  it("asks for the Essence that is missing", () => {
    expect(craftState(common, 6, 25)).toEqual({
      kind: "essence",
      cost: 40,
      missing: 15,
    });
    expect(craftState(common, 6, 40)).toEqual({ kind: "ready", cost: 40 });
    expect(craftState(getCard(BULWARK), 30, 5000)).toEqual({
      kind: "ready",
      cost: 1400,
    });
  });

  it("has no Craft for a card with no Craft cost", () => {
    expect(craftState({ baseRank: "legendary" }, 30, 10_000)).toEqual({
      kind: "none",
    });
  });
});

describe("extractNeedsConfirm", () => {
  it("asks when a saved Deck uses the copy, or for Epic and Legendary copies", () => {
    expect(extractNeedsConfirm("common", [])).toBe(false);
    expect(extractNeedsConfirm("rare", [])).toBe(false);
    expect(extractNeedsConfirm("common", [DECK])).toBe(true);
    expect(extractNeedsConfirm("epic", [])).toBe(true);
    expect(extractNeedsConfirm("legendary", [])).toBe(true);
  });
});

describe("legendaryPath", () => {
  it("counts each copy as Base Rank copies", () => {
    // 3 Common + 1 Rare = 3 + 4 = 7 of 16 Common copies.
    const path = legendaryPath(rankCopies(collection, RECRUIT));
    expect(path).toMatchObject({
      base: "common",
      value: 7,
      target: 16,
      copies: 9,
      complete: false,
    });
  });

  it("needs the Coin of the full path less the path Coin of each copy above the Base Rank", () => {
    const full = combinePath("common", "legendary").coin;
    expect(legendaryPath(rankCopies([], RECRUIT)).coin).toBe(full);
    // The Rare copy already paid its path from Common: 2 × 50 + 200.
    expect(legendaryPath(rankCopies(collection, RECRUIT)).coin).toBe(
      full - 300
    );
  });

  it("is exact: the Coin of the Combines that make one Legendary copy", () => {
    // 1 Rare + 1 Uncommon + 3 Common, then 7 more Common copies: 10 Common
    // → 5 Uncommon (250), 6 Uncommon → 3 Rare (600), 4 Rare → 2 Epic
    // (1,600), 2 Epic → 1 Legendary (3,200).
    const copies = rankCopies(
      [
        { cardId: RECRUIT, rank: "common", copies: 3 },
        { cardId: RECRUIT, rank: "uncommon", copies: 1 },
        { cardId: RECRUIT, rank: "rare", copies: 1 },
      ],
      RECRUIT
    );
    expect(legendaryPath(copies)).toMatchObject({ copies: 7, coin: 5650 });
  });

  it("is complete with enough copies, or a Legendary copy", () => {
    expect(
      legendaryPath(
        rankCopies([{ cardId: RECRUIT, rank: "rare", copies: 5 }], RECRUIT)
      )
    ).toMatchObject({ value: 16, copies: 0, coin: 0, complete: true });
    expect(
      legendaryPath(
        rankCopies([{ cardId: BULWARK, rank: "legendary", copies: 1 }], BULWARK)
      )
    ).toMatchObject({ base: "epic", target: 2, complete: true });
  });
});

describe("combineFocusAfter", () => {
  it("stays on the same Combine while it is ready, else goes to the next rung", () => {
    const rungs = [
      { rank: "common" as const, ready: false },
      { rank: "uncommon" as const, ready: true },
      { rank: "rare" as const, ready: false },
    ];
    expect(combineFocusAfter(rungs, "uncommon")).toBe("uncommon");
    expect(combineFocusAfter(rungs, "common")).toBe("uncommon");
    expect(combineFocusAfter(rungs, "rare")).toBeNull();
  });
});

describe("extractTimeline", () => {
  it("gives a higher Rank more drops and a longer Extract", () => {
    const timelines = RANKS.map((rank) => extractTimeline(rank));
    for (const [index, timeline] of timelines.entries()) {
      const before = timelines[index - 1];
      if (before) {
        expect(timeline.dropAt.length).toBeGreaterThan(before.dropAt.length);
        expect(timeline.lastArrival).toBeGreaterThan(before.lastArrival);
      }
    }
  });

  it("melts after the tremble and the lift, and lets each drop leave in order", () => {
    const timeline = extractTimeline("legendary");
    expect(timeline.liftAt).toBe(EXTRACT_MOTION.legendary.trembleMs);
    expect(timeline.dropAt[0]).toBe(timeline.meltAt);
    expect(timeline.dropAt).toEqual(timeline.dropAt.toSorted((a, b) => a - b));
    expect(timeline.dropAt.at(-1)).toBeLessThan(
      timeline.meltAt + EXTRACT_MOTION.legendary.meltMs
    );
    expect(extractTimeline("common").liftAt).toBe(0);
  });
});
