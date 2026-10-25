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
  craftTimeline,
  fuseMark,
  fuseOptions,
  fuseRefusal,
  fuseState,
  fuseTimeline,
  isTileReady,
  pruneInputs,
  rankCopies,
  selectedTile,
  shownRank,
  spareCopies,
  stationCounts,
  stationLock,
  STATIONS,
  stationTiles,
  workshopTiles,
} from "@/features/workshop/workshop";

const RECRUIT = "human.militiaRecruit";
const KNIGHT = "human.riverKnight";
const BULWARK = "human.ironBulwark";
const RUNT = "orc.badlandRunt";
const ALDRIC = "human.serAldricStonewall";

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

const COMMON_RECRUIT = { cardId: RECRUIT, rank: "common" } as const;

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
      { rank: "common", copies: 3, used: 0 },
      { rank: "uncommon", copies: 0, used: 0 },
      { rank: "rare", copies: 1, used: 0 },
      { rank: "epic", copies: 0, used: 0 },
      { rank: "legendary", copies: 0, used: 0 },
    ]);
  });

  it("counts the copies that the saved Decks use: the most that one Deck uses", () => {
    const two = { ...DECK, deck: [COMMON_RECRUIT, COMMON_RECRUIT] };
    const one = { ...DECK, id: "deck-2", deck: [COMMON_RECRUIT] };
    const rows = rankCopies(collection, RECRUIT, [two, one]);
    expect(rows[0]).toEqual({ rank: "common", copies: 3, used: 2 });
    expect(spareCopies(rows[0] ?? { copies: 0, used: 0 })).toBe(1);
    // A Deck can use more copies than the Player owns: no spare copy then.
    expect(spareCopies({ copies: 1, used: 2 })).toBe(0);
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

  it("counts the spare copies of all the Ranks", () => {
    const deck = { ...DECK, deck: [COMMON_RECRUIT, COMMON_RECRUIT] };
    const spare = (cardId: string) =>
      workshopTiles(collection, DEFAULT_POOL_FILTER, [deck]).find(
        (tile) => tile.cardId === cardId
      )?.spare;
    // 3 Common copies with 2 in the Deck, and 1 Rare copy.
    expect(spare(RECRUIT)).toBe(2);
    expect(spare(KNIGHT)).toBe(1);
    expect(spare(RUNT)).toBe(0);
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
    expect(emptyGridText([], orc, "combine").key).toBe(
      "workshop.empty.noneFound"
    );
    expect(
      emptyGridText(found, { ...orc, ownership: "notOwned" }, "combine").key
    ).toBe("workshop.empty.allOwned");
    expect(
      emptyGridText(collection, { ...orc, ownership: "owned" }, "combine").key
    ).toBe("workshop.empty.noneOwned");
    expect(emptyGridText(found, orc, "combine", true).key).toBe(
      "workshop.empty.ready.combine"
    );
    expect(emptyGridText([], orc, "extract", true).key).toBe(
      "workshop.empty.noneFound"
    );
    expect(emptyGridText(found, orc, "combine").args).toEqual({
      group: {
        key: "deckBuilder.groups.race",
        args: { race: { key: "races.orc" } },
      },
    });
  });

  it("tells when Craft hides all the cards of the filters: Epic and Legendary cards have no Craft", () => {
    const epic: Collection = [{ cardId: BULWARK, rank: "epic", copies: 1 }];
    const human = {
      ...DEFAULT_POOL_FILTER,
      kind: "creature" as const,
      race: "human" as const,
    };
    expect(emptyGridText(epic, human, "craft").key).toBe(
      "workshop.empty.noCraft"
    );
    expect(emptyGridText(epic, human, "craft", true).key).toBe(
      "workshop.empty.noCraft"
    );
    expect(emptyGridText(epic, human, "extract", true).key).toBe(
      "workshop.empty.ready.extract"
    );
    const legendary: Collection = [
      { cardId: ALDRIC, rank: "legendary", copies: 1 },
    ];
    expect(emptyGridText(legendary, human, "combine").key).toBe(
      "workshop.empty.noCombine"
    );
    expect(emptyGridText(legendary, human, "fuse").key).toBe(
      "workshop.empty.noFuse"
    );
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
  });

  it("has no Craft for an Epic or a Legendary Base Rank card (ADR-0050)", () => {
    expect(craftState(getCard(BULWARK), 30, 5000)).toEqual({ kind: "none" });
    expect(craftState({ baseRank: "legendary" }, 30, 5000)).toEqual({
      kind: "none",
    });
    // The rank reason comes before the level lock: the card has no Craft at any level.
    expect(craftState(getCard(BULWARK), 5, 5000)).toEqual({ kind: "none" });
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

describe("stations", () => {
  const deck = { ...DECK, deck: [COMMON_RECRUIT, COMMON_RECRUIT] };
  const tiles = workshopTiles(collection, DEFAULT_POOL_FILTER, [deck]);
  const tile = (cardId: string) => {
    const found = tiles.find((item) => item.cardId === cardId);
    if (!found) {
      throw new Error(`no tile for ${cardId}`);
    }
    return found;
  };
  const rich = { coin: 0, essence: 1000, level: 30 };

  it("Combine acts on a card with a pair, also when the Coin is short", () => {
    expect(isTileReady(tile(RECRUIT), "combine", rich)).toBe(true);
    expect(isTileReady(tile(KNIGHT), "combine", rich)).toBe(false);
  });

  it("Craft acts on a card when the Craft is open and the Essence is enough", () => {
    expect(isTileReady(tile(RUNT), "craft", rich)).toBe(true);
    expect(isTileReady(tile(RUNT), "craft", { ...rich, essence: 10 })).toBe(
      false
    );
    expect(isTileReady(tile(RUNT), "craft", { ...rich, level: 5 })).toBe(false);
  });

  it("Craft shows no Epic or Legendary Base Rank card (ADR-0050)", () => {
    const withEpic = workshopTiles(
      [...collection, { cardId: BULWARK, rank: "epic", copies: 1 }],
      DEFAULT_POOL_FILTER
    );
    const craft = stationTiles(withEpic, "craft").map((item) => item.cardId);
    expect(withEpic.map((item) => item.cardId)).toContain(BULWARK);
    expect(craft).not.toContain(BULWARK);
    expect(craft).toContain(RECRUIT);
    expect(stationTiles(withEpic, "combine")).toEqual(withEpic);
  });

  it("Combine and Fuse show no Legendary Base Rank card", () => {
    const withLegendary = workshopTiles(
      [...collection, { cardId: ALDRIC, rank: "legendary", copies: 1 }],
      DEFAULT_POOL_FILTER
    );
    const combine = stationTiles(withLegendary, "combine").map(
      (item) => item.cardId
    );
    expect(withLegendary.map((item) => item.cardId)).toContain(ALDRIC);
    expect(combine).not.toContain(ALDRIC);
    expect(combine).toContain(RECRUIT);
    const fuse = stationTiles(withLegendary, "fuse").map((item) => item.cardId);
    expect(fuse).not.toContain(ALDRIC);
    expect(fuse).toContain(RECRUIT);
    expect(
      stationTiles(withLegendary, "extract").map((item) => item.cardId)
    ).toContain(ALDRIC);
  });

  it("Extract acts on a card with a spare copy", () => {
    expect(isTileReady(tile(RECRUIT), "extract", rich)).toBe(true);
    expect(isTileReady(tile(RUNT), "extract", rich)).toBe(false);
  });

  it("counts the cards with a pair, the cards to Craft now, and the spare copies", () => {
    expect(stationCounts(tiles, rich)).toEqual({
      combine: 1,
      craft: 3,
      fuse: 2,
      extract: 3,
    });
    expect(stationCounts(tiles, { ...rich, essence: 0 }).craft).toBe(0);
  });

  it("Fuse acts on a card with a copy below Legendary whose Race has a card to give, from level 6", () => {
    // Recruit: Common and Rare copies, and Human cards of both Ranks are not
    // Discovered. Runt: no copy.
    expect(tile(RECRUIT).fuseRanks).toEqual(["common", "rare"]);
    expect(tile(KNIGHT).fuseRanks).toEqual(["uncommon"]);
    expect(tile(RUNT).fuseRanks).toEqual([]);
    expect(isTileReady(tile(RECRUIT), "fuse", rich)).toBe(true);
    expect(isTileReady(tile(RUNT), "fuse", rich)).toBe(false);
    expect(isTileReady(tile(RECRUIT), "fuse", { ...rich, level: 5 })).toBe(
      false
    );
  });

  it("has the Fuse tab next to Craft", () => {
    expect(STATIONS).toEqual(["combine", "craft", "fuse", "extract"]);
  });

  it("locks the Craft and the Fuse tabs below level 6", () => {
    expect(stationLock("craft", 5)).toBe(6);
    expect(stationLock("fuse", 5)).toBe(6);
    expect(stationLock("craft", 6)).toBeNull();
    expect(stationLock("fuse", 6)).toBeNull();
    expect(stationLock("combine", 1)).toBeNull();
  });
});

describe("craftTimeline", () => {
  it("is the opposite of an Extract: the drops fly in, then the copy forms", () => {
    for (const rank of RANKS) {
      const { dropAt, formAt, formMs, formed } = craftTimeline(rank);
      expect(dropAt).toHaveLength(EXTRACT_MOTION[rank].drops);
      expect(dropAt[0]).toBe(0);
      expect(formMs).toBe(EXTRACT_MOTION[rank].meltMs);
      expect(formed).toBe(formAt + formMs);
      // The last drop leaves before the form line gets to the top.
      expect(dropAt.at(-1) ?? 0).toBeLessThan(formMs);
    }
  });
});

/** A Common copy of the card, as a Fuse input. */
const common = (cardId: string) => ({ cardId, rank: "common" }) as const;

describe("Fuse slots", () => {
  const tiles = workshopTiles(collection, DEFAULT_POOL_FILTER);
  const tile = (cardId: string) => {
    const found = tiles.find((item) => item.cardId === cardId);
    if (!found) {
      throw new Error(`no tile for ${cardId}`);
    }
    return found;
  };

  it("offers each Rank below Legendary with a copy that is not in a slot, before the first copy", () => {
    expect(fuseOptions(tile(RECRUIT), collection, [])).toEqual([
      "common",
      "rare",
    ]);
    expect(fuseOptions(tile(RUNT), collection, [])).toEqual([]);
    const legendary: Collection = [
      { cardId: BULWARK, rank: "legendary", copies: 2 },
    ];
    expect(
      fuseOptions(
        workshopTiles(legendary, DEFAULT_POOL_FILTER)[0] ?? tile(RUNT),
        legendary,
        []
      )
    ).toEqual([]);
  });

  it("offers only the Rank of the first copy after it, while a copy is left and a slot is free", () => {
    const one = [common(RECRUIT)];
    expect(fuseOptions(tile(RECRUIT), collection, one)).toEqual(["common"]);
    expect(fuseOptions(tile(KNIGHT), collection, one)).toEqual([]);
    expect(fuseRefusal(tile(KNIGHT), collection, one)).toBe("rank");
    const full = [common(RECRUIT), common(RECRUIT)];
    expect(fuseOptions(tile(RECRUIT), collection, full)).toEqual([]);
    expect(fuseRefusal(tile(RECRUIT), collection, full)).toBe("full");
    const rare = [{ cardId: RECRUIT, rank: "rare" } as const];
    expect(fuseOptions(tile(RECRUIT), collection, rare)).toEqual([]);
    expect(fuseRefusal(tile(RECRUIT), collection, rare)).toBe("copies");
    expect(fuseRefusal(tile(RUNT), collection, [])).toBe("copies");
  });

  it("refuses a Skill Card after a Creature Card", () => {
    const skills: Collection = [
      ...collection,
      { cardId: "mage.fireball", rank: "common", copies: 2 },
    ];
    const skill = workshopTiles(skills, DEFAULT_POOL_FILTER).find(
      (item) => item.cardId === "mage.fireball"
    );
    expect(skill && fuseRefusal(skill, skills, [common(RECRUIT)])).toBe("kind");
  });

  it("marks the copies that can go in now", () => {
    expect(fuseMark(tile(RECRUIT), collection, [])).toBe(4);
    expect(fuseMark(tile(RECRUIT), collection, [common(RECRUIT)])).toBe(2);
    expect(fuseMark(tile(KNIGHT), collection, [common(RECRUIT)])).toBe(0);
    expect(fuseMark(tile(RUNT), collection, [])).toBe(0);
  });

  it("takes out the copies that the Player does not own any more, and the copies that do not fit", () => {
    const after: Collection = [{ cardId: RECRUIT, rank: "common", copies: 1 }];
    expect(pruneInputs([common(RECRUIT), common(RECRUIT)], after)).toEqual([
      common(RECRUIT),
    ]);
    expect(pruneInputs([common(RECRUIT)], [])).toEqual([]);
  });

  it("tells the state of the Fuse panel", () => {
    const rich = { level: 30, essence: 1000 };
    expect(fuseState(collection, [], { ...rich, level: 5 })).toEqual({
      kind: "locked",
      level: 6,
    });
    expect(fuseState(collection, [], rich)).toEqual({ kind: "empty" });
    expect(fuseState(collection, [common(RECRUIT)], rich)).toMatchObject({
      kind: "filling",
      missing: 1,
      cost: 20,
    });
    const full = [common(RECRUIT), common(RECRUIT)];
    expect(fuseState(collection, full, rich)).toMatchObject({
      kind: "ready",
      cost: 20,
    });
    expect(fuseState(collection, full, { ...rich, essence: 5 })).toMatchObject({
      kind: "essence",
      cost: 20,
      missing: 15,
    });
    const found: Collection = [
      ...collection,
      ...[
        "human.shieldbearer",
        "human.crossbowGuard",
        "human.halberdier",
        "human.townBarricade",
      ].map((cardId) => ({ cardId, rank: "common" as const, copies: 0 })),
    ];
    expect(fuseState(found, full, rich)).toMatchObject({
      kind: "pool",
      groups: ["human"],
    });
  });
});

describe("fuseTimeline", () => {
  it("gathers the copies, sends the Essence in, then turns the card over", () => {
    for (const rank of ["common", "rare", "epic"] as const) {
      const timeline = fuseTimeline(rank, 4);
      expect(timeline.dropAt).toEqual(craftTimeline(rank).dropAt);
      // The last copy gets to the card before the card turns.
      expect(timeline.gatherAt.at(-1) ?? 0).toBeLessThan(timeline.turnAt);
      expect(timeline.turnAt).toBeGreaterThanOrEqual(
        craftTimeline(rank).formed
      );
      expect(timeline.faceAt).toBeGreaterThan(timeline.turnAt);
    }
    expect(fuseTimeline("epic", 4).trembleMs).toBeGreaterThan(0);
    expect(fuseTimeline("common", 2).trembleMs).toBe(0);
  });
});
