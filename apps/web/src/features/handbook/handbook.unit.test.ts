import type { CardDefinition } from "@workspace/rules";
import { CARDS, RANKS } from "@workspace/rules";
import { Predicate } from "effect";
import { describe, expect, it } from "vitest";

import { initI18n } from "@/core/libs/i18n/init";
import type { LanguageMessages } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import type { TextRef } from "@/features/battle/card-text";
import {
  cardText,
  FLAG_KEYWORDS,
  KEYWORDS,
  resolveText,
  unitStatusText,
  VALUE_KEYWORDS,
} from "@/features/battle/card-text";
import { STATUS_ORDER } from "@/features/battle/scene/status-visuals";
import { CLASSES_WITH_CARDS, RACES_WITH_CARDS } from "@/features/deck/deck";
import type { Entry, EntryId, SearchItem } from "@/features/handbook/handbook";
import {
  ALIASED_ENTRIES,
  aliasKey,
  CHAPTER_ICONS,
  chapterEntries,
  CHAPTERS,
  damageEntryId,
  ENTRIES,
  FIRST_ENTRY,
  getEntry,
  keywordEntryId,
  openPlace,
  RANK_TABLE,
  rankTableKeywords,
  searchEntries,
  showChapter,
  showEntry,
  splitAliases,
  statusEntryId,
  toEntryId,
} from "@/features/handbook/handbook";
import type { DiagramId } from "@/features/handbook/handbook-diagrams";
import { DIAGRAMS } from "@/features/handbook/handbook-diagrams";
import { openFromBar, openFromLink } from "@/features/handbook/handbook.atoms";

const catalogs = {
  "en-us": enUS,
  "id-id": idID,
} satisfies Record<string, LanguageMessages>;

type Locale = keyof typeof catalogs;

const LOCALES: readonly Locale[] = ["en-us", "id-id"];

/** A message or a group of messages in a Message Catalog. */
type CatalogNode = LanguageMessages[string];

const isMessage = (node: CatalogNode) =>
  Predicate.isString(node) || Array.isArray(node);

const lookup = (
  catalog: LanguageMessages,
  key: string
): CatalogNode | undefined => {
  let node: CatalogNode | undefined = catalog;
  for (const part of key.split(".")) {
    node = node === undefined || isMessage(node) ? undefined : node[part];
  }
  return node;
};

const keysUnder = (catalog: LanguageMessages, key: string): string[] => {
  const node = lookup(catalog, key);
  return node === undefined || isMessage(node) ? [] : Object.keys(node);
};

const translator = (locale: Locale) => {
  const { t } = initI18n({
    locale,
    fallbackLocale: [],
    translations: catalogs,
  });
  // SAFETY: the keys come from game data, as in `useGameText`.
  return (key: string, args?: Record<string, string | number>) =>
    t(key as never, args as never);
};

const textIn = (locale: Locale) => {
  const translate = translator(locale);
  return (ref: TextRef) => resolveText(translate, ref);
};

const allRefs = (ref: TextRef): TextRef[] => [
  ref,
  ...Object.values(ref.args ?? {}).flatMap((value) =>
    Predicate.isString(value) || Predicate.isNumber(value) ? [] : allRefs(value)
  ),
];

const entryRefs = (entry: Entry): TextRef[] =>
  [entry.name, ...entry.body].flatMap(allRefs);

const searchItems = (locale: Locale): SearchItem[] => {
  const text = textIn(locale);
  const translate = translator(locale);
  return ENTRIES.map((entry) => ({
    id: entry.id,
    name: text(entry.name),
    aliases: ALIASED_ENTRIES.has(entry.id)
      ? splitAliases(translate(aliasKey(entry.id)))
      : [],
  }));
};

describe("ENTRIES", () => {
  it("has the 8 Chapters in the order that a new Player learns them, each with Entries", () => {
    expect(CHAPTERS).toEqual([
      "battle",
      "cards",
      "units",
      "keywords",
      "statuses",
      "kinds",
      "ranks",
      "progress",
    ]);
    for (const chapter of CHAPTERS) {
      expect(
        ENTRIES.some((entry) => entry.chapter === chapter),
        chapter
      ).toBe(true);
    }
    expect(ENTRIES.map((entry) => entry.chapter)).toEqual(
      ENTRIES.map((entry) => entry.chapter).toSorted(
        (a, b) => CHAPTERS.indexOf(a) - CHAPTERS.indexOf(b)
      )
    );
    expect(Object.keys(CHAPTER_ICONS)).toEqual([...CHAPTERS]);
  });

  it("starts at Chapter Battle, Entry Board", () => {
    expect(FIRST_ENTRY).toBe("board");
    expect(ENTRIES[0]?.id).toBe("board");
    expect(getEntry(FIRST_ENTRY).chapter).toBe("battle");
  });

  it("gives each Entry one ID and one Chapter, and links only to other Entries", () => {
    const ids = ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of ENTRIES) {
      for (const link of entry.seeAlso) {
        expect(toEntryId(link), `${entry.id} → ${link}`).toBe(link);
        expect(link).not.toBe(entry.id);
      }
    }
    // SAFETY: a wrong ID on purpose, to test the error.
    expect(() => getEntry("keywordNope" as EntryId)).toThrow(/keywordNope/u);
    expect(toEntryId("keywordNope")).toBeNull();
    expect(toEntryId(7)).toBeNull();
  });

  it("has an Entry only for a feature in the game: the Races and Classes that have cards", () => {
    const kinds = ENTRIES.filter((entry) => entry.chapter === "kinds").map(
      (entry) => entry.id
    );
    for (const race of RACES_WITH_CARDS) {
      expect(kinds).toContain(`race${race[0]?.toUpperCase()}${race.slice(1)}`);
    }
    expect(kinds.filter((id) => id.startsWith("race")).length).toBe(
      RACES_WITH_CARDS.length + 1
    );
    expect(kinds.filter((id) => id.startsWith("class")).length).toBe(
      CLASSES_WITH_CARDS.length + 1
    );
    expect(kinds.filter((id) => id.startsWith("role")).length).toBe(7);
  });
});

describe("Entries of Keywords, Statuses and Damage Types", () => {
  it("has an Entry for each Keyword, with the rule key of the Details Panel", () => {
    expect(KEYWORDS).toHaveLength(22);
    for (const card of CARDS) {
      const text = cardText(card.id, card.baseRank);
      if (text.kind !== "creature") {
        continue;
      }
      for (const line of text.keywords) {
        const entry = getEntry(keywordEntryId(line.keyword));
        expect(entry.chapter).toBe("keywords");
        expect(entry.name.key).toBe(line.name.key);
        expect(entry.body.map((ref) => ref.key)).toEqual([line.rule.key]);
      }
    }
    for (const keyword of KEYWORDS) {
      expect(getEntry(keywordEntryId(keyword)).chapter).toBe("keywords");
    }
  });

  it("has an Entry for each Status, with the name and rule keys of the Details Panel", () => {
    const lines = unitStatusText({
      bonusArmor: 0,
      bonusArmorTurns: 0,
      burn: 2,
      frozen: true,
      entangled: true,
      hobbled: 1,
      bleeding: 1,
      poisoned: 3,
      rallyBonus: 0,
      swarmBonus: 0,
      reborn: false,
    });
    expect(lines.map((line) => line.status).toSorted()).toEqual(
      [...STATUS_ORDER].toSorted()
    );
    for (const line of lines) {
      if (
        line.status === "bonusArmor" ||
        line.status === "rallyBonus" ||
        line.status === "swarmBonus" ||
        line.status === "reborn"
      ) {
        continue;
      }
      const entry = getEntry(statusEntryId(line.status));
      expect(entry.chapter).toBe("statuses");
      expect(entry.name.key).toBe(line.name.key);
      expect(entry.body.map((ref) => ref.key)).toEqual([line.rule.key]);
      expect(entry.icon).toEqual({ kind: "status", status: line.status });
    }
  });

  it("gives Fire, Frost and Holy the rule of the Details Panel, and Physical a text of its own", () => {
    for (const card of CARDS) {
      const text = cardText(card.id, card.baseRank);
      if (card.kind === "creature" && text.kind === "creature") {
        expect(
          getEntry(damageEntryId(card.damageType)).body.map((ref) => ref.key)
        ).toEqual(
          text.damageRule
            ? [text.damageRule.key]
            : ["handbook.entries.damagePhysical"]
        );
      }
    }
    for (const damageType of ["fire", "frost", "holy"] as const) {
      expect(getEntry(damageEntryId(damageType)).body).toEqual([
        { key: `keywordRules.${damageType}` },
      ]);
    }
    expect(getEntry("damagePhysical").body).toEqual([
      { key: "handbook.entries.damagePhysical" },
    ]);
  });

  it("shows N for the value of a value Keyword", () => {
    const text = textIn("en-us");
    const charge = getEntry("keywordCharge");
    expect(text(charge.name)).toBe("Charge N");
    expect(text(charge.body[0] ?? charge.name)).toBe(
      "+N Speed in the Turn when you summon this Unit."
    );
    expect(text(getEntry("keywordFlying").name)).toBe("Flying");
    expect(text(getEntry("keywordSwarm").name)).toBe("Swarm N");
    expect(text(getEntry("statusPoison").name)).toBe("Poison N");
    expect(text(getEntry("statusFreeze").name)).toBe("Frozen");
  });
});

describe("the Entries of Summon X and Token", () => {
  it("shows X for the Token of Summon, and links Summon and Token", () => {
    const text = textIn("en-us");
    const summon = getEntry("keywordSummon");
    expect(text(summon.name)).toBe("Summon X");
    expect(text(summon.body[0] ?? summon.name)).toContain(
      "a Token X of the same Rank also appears"
    );
    expect(summon.seeAlso).toContain("token");
    const token = getEntry("token");
    expect(token.chapter).toBe("units");
    expect(text(token.name)).toBe("Token");
    expect(token.seeAlso).toContain("keywordSummon");
    expect(text(getEntry("keywordRebirth").name)).toBe("Rebirth");
    expect(textIn("id-id")(summon.name)).toBe("Panggil X");
  });
});

describe("rankTableKeywords", () => {
  it("finds the Keywords that follow the shared Rank table in the card data", () => {
    expect([...rankTableKeywords(CARDS)].toSorted()).toEqual([
      "bleed",
      "charge",
      "knockback",
    ]);
  });

  it("gives the shared table to those Keywords, and 'See the card' to the other value Keywords", () => {
    const table = rankTableKeywords(CARDS);
    for (const keyword of VALUE_KEYWORDS) {
      expect(getEntry(keywordEntryId(keyword)).value, keyword).toBe(
        table.has(keyword) ? "rankTable" : "card"
      );
    }
    for (const keyword of FLAG_KEYWORDS) {
      expect(getEntry(keywordEntryId(keyword)).value, keyword).toBeUndefined();
    }
    expect(RANK_TABLE).toEqual([
      { rank: "common", value: 1 },
      { rank: "uncommon", value: 1 },
      { rank: "rare", value: 1 },
      { rank: "epic", value: 2 },
      { rank: "legendary", value: 3 },
    ]);
  });

  it("moves a Keyword out of the table when one card gives it another value", () => {
    const charger = CARDS.find(
      (card) => card.kind === "creature" && card.keywords.charge !== undefined
    );
    if (charger?.kind !== "creature") {
      throw new Error("No card has Charge");
    }
    const odd: CardDefinition = {
      ...charger,
      id: "test.oddCharger",
      keywords: { charge: 2 },
    };
    expect(rankTableKeywords([...CARDS, odd]).has("charge")).toBe(false);
    expect(rankTableKeywords([]).size).toBe(0);
  });
});

describe("the Message Catalogs", () => {
  it("have each key that an Entry uses, in en-US and id-ID", () => {
    const keys = new Set<string>();
    for (const entry of ENTRIES) {
      for (const ref of entryRefs(entry)) {
        keys.add(ref.key);
      }
      if (ALIASED_ENTRIES.has(entry.id)) {
        keys.add(aliasKey(entry.id));
      }
    }
    for (const chapter of CHAPTERS) {
      keys.add(`handbook.chapter.${chapter}.name`);
      keys.add(`handbook.chapter.${chapter}.short`);
    }
    for (const locale of LOCALES) {
      for (const key of keys) {
        const node = lookup(catalogs[locale], key);
        expect(node !== undefined && isMessage(node), `${locale} ${key}`).toBe(
          true
        );
      }
    }
  });

  it("have no Handbook text that no Entry uses", () => {
    const ids = new Set<string>(ENTRIES.map((entry) => entry.id));
    for (const locale of LOCALES) {
      const catalog = catalogs[locale];
      for (const id of keysUnder(catalog, "handbook.aliases")) {
        const entry = toEntryId(id);
        expect(
          entry !== null && ALIASED_ENTRIES.has(entry),
          `${locale} alias ${id}`
        ).toBe(true);
      }
      for (const group of ["names", "entries"]) {
        for (const id of keysUnder(catalog, `handbook.${group}`)) {
          // The Races and Classes that have no cards yet keep their text.
          const later = /^(?:race|class)[A-Z]/u.test(id);
          expect(ids.has(id) || later, `${locale} ${group} ${id}`).toBe(true);
        }
      }
      expect(keysUnder(catalog, "handbook.names")).toEqual(
        keysUnder(catalogs["en-us"], "handbook.names")
      );
      expect(keysUnder(catalog, "handbook.entries")).toEqual(
        keysUnder(catalogs["en-us"], "handbook.entries")
      );
      expect(keysUnder(catalog, "handbook.aliases")).toEqual(
        keysUnder(catalogs["en-us"], "handbook.aliases")
      );
    }
  });

  it("give each Entry a different name in each Locale, so that the list is clear", () => {
    for (const locale of LOCALES) {
      const text = textIn(locale);
      const byChapter = new Map<string, Set<string>>();
      for (const entry of ENTRIES) {
        const names = byChapter.get(entry.chapter) ?? new Set();
        const name = text(entry.name);
        expect(names.has(name), `${locale} ${name}`).toBe(false);
        names.add(name);
        byChapter.set(entry.chapter, names);
      }
    }
  });

  it("put the values of the rules into the text", () => {
    const text = textIn("en-us");
    const body = (id: EntryId) =>
      getEntry(id)
        .body.map((ref) => text(ref))
        .join(" ");
    expect(body("handLimit")).toContain("8 cards at most");
    expect(body("summonZone")).toContain("Columns 1 to 3");
    expect(body("summonZone")).toContain("Columns 4 and 5");
    expect(body("suddenDeath")).toContain("From Turn 20");
    expect(body("recall")).toContain("from 10% at Common to 50% at Legendary");
    expect(body("rankCommon")).toContain("baseline for the Attack and HP");
    expect(body("rankCommon")).toContain(
      "1 Rank Gems on the frame. Attack and HP ×1. Skill Card Recall: 10%."
    );
    expect(body("rankRare")).toContain("Rare sits in the middle");
    expect(body("rankRare")).toContain(
      "3 Rank Gems on the frame. Attack and HP ×1.45. Skill Card Recall: 30%."
    );
    expect(
      getEntry("rankRare")
        .body.map((ref) => textIn("id-id")(ref))
        .join("")
    ).toContain("×1,45");
  });
});

const nameIn = (locale: Locale) => {
  const text = textIn(locale);
  return (entry: Entry) => text(entry.name);
};

describe("chapterEntries", () => {
  it("lists the Keywords as an index, in the order of their names in the Locale", () => {
    for (const locale of LOCALES) {
      const names = chapterEntries("keywords", nameIn(locale), locale).map(
        nameIn(locale)
      );
      expect(names).toHaveLength(22);
      expect(names).toEqual(
        names.toSorted((a, b) => a.localeCompare(b, locale))
      );
    }
    expect(chapterEntries("keywords", nameIn("en-us"), "en-us")[0]?.id).toBe(
      "keywordArmor"
    );
  });

  it("keeps the learning order in the other Chapters", () => {
    expect(
      chapterEntries("battle", nameIn("en-us"), "en-us")
        .slice(0, 3)
        .map((entry) => entry.id)
    ).toEqual(["board", "lane", "square"]);
    expect(
      chapterEntries("ranks", nameIn("id-id"), "id-id").map((entry) => entry.id)
    ).toEqual([
      "rank",
      ...RANKS.map((rank) => `rank${rank[0]?.toUpperCase()}${rank.slice(1)}`),
      "rankGems",
    ]);
  });
});

describe("searchEntries", () => {
  it("finds an Entry by its name in the current Locale", () => {
    const hits = searchEntries("countdown", searchItems("en-us"));
    expect(hits[0]).toEqual({ id: "countdown", alias: null });
    expect(hits.map((hit) => hit.id)).toContain("countdownLimit");
    expect(searchEntries("hitung", searchItems("id-id"))[0]).toEqual({
      id: "countdown",
      alias: null,
    });
  });

  it("finds an Entry by the words of other games, and says which alias matched", () => {
    expect(searchEntries("mana", searchItems("en-us"))).toEqual([
      { id: "countdown", alias: "mana" },
      { id: "countdownLimit", alias: "mana cap" },
    ]);
    expect(searchEntries("rarity", searchItems("en-us"))).toEqual([
      { id: "rank", alias: "rarity" },
    ]);
    expect(searchEntries("Spell", searchItems("en-us"))[0]).toEqual({
      id: "skillCard",
      alias: "spell",
    });
    expect(searchEntries("minion", searchItems("en-us"))[0]).toEqual({
      id: "creatureCard",
      alias: "minion card",
    });
    expect(searchEntries("debuff", searchItems("id-id"))).toEqual([
      { id: "status", alias: "debuff" },
    ]);
    expect(searchEntries("biaya", searchItems("id-id"))[0]).toEqual({
      id: "countdown",
      alias: "biaya",
    });
  });

  it("puts a name match before an alias match, and a word start before a match in a word", () => {
    const items: SearchItem[] = [
      { id: "lane", name: "Lane", aliases: ["mana"] },
      { id: "square", name: "Remana", aliases: [] },
      { id: "column", name: "Mana Column", aliases: [] },
    ];
    expect(searchEntries("mana", items).map((hit) => hit.id)).toEqual([
      "column",
      "square",
      "lane",
    ]);
  });

  it("ignores case, accents and extra spaces, and finds nothing for an empty search", () => {
    const items: SearchItem[] = [
      { id: "board", name: "Énergie Board", aliases: ["big   field"] },
    ];
    expect(searchEntries("  energie ", items)).toEqual([
      { id: "board", alias: null },
    ]);
    expect(searchEntries("BIG FIELD", items)).toEqual([
      { id: "board", alias: "big   field" },
    ]);
    expect(searchEntries("   ", items)).toEqual([]);
    expect(searchEntries("zzz", searchItems("en-us"))).toEqual([]);
  });

  it("reads a list of aliases from one string", () => {
    expect(splitAliases("mana, cost ,, cooldown")).toEqual([
      "mana",
      "cost",
      "cooldown",
    ]);
  });
});

describe("the place in the Handbook", () => {
  it("opens at the list from the bars, and at the Entry page from a link", () => {
    expect(openPlace(openFromBar("statusBurn"))).toEqual({
      chapter: "statuses",
      entry: "statusBurn",
      page: "list",
    });
    expect(openPlace(openFromLink("keywordCharge"))).toEqual({
      chapter: "keywords",
      entry: "keywordCharge",
      page: "entry",
    });
  });

  it("opens the page of an Entry from the list, a search result or a link", () => {
    expect(showEntry("coin")).toEqual({
      chapter: "progress",
      entry: "coin",
      page: "entry",
    });
  });

  it("keeps the open Entry when its Chapter tab is selected, else opens the first Entry", () => {
    const place = showEntry("lane");
    expect(showChapter(place, "battle", "board")).toEqual({
      chapter: "battle",
      entry: "lane",
      page: "list",
    });
    expect(showChapter(place, "ranks", "rank")).toEqual({
      chapter: "ranks",
      entry: "rank",
      page: "list",
    });
  });
});

describe("DIAGRAMS", () => {
  const diagramIds: DiagramId[] = [
    "summonZone",
    "front",
    "movement",
    "flying",
    "knockback",
    "trample",
    "pivot",
    "wall",
    "ranged",
    "firstStrike",
  ];

  it("belongs to about 10 Entries, one Entry each", () => {
    expect(Object.keys(DIAGRAMS).toSorted()).toEqual(diagramIds.toSorted());
    for (const id of diagramIds) {
      expect(
        ENTRIES.filter((entry) => entry.diagram === id).map(
          (entry) => entry.id
        ),
        id
      ).toHaveLength(1);
    }
  });

  it("keeps each Unit, arrow and tint on the strip, with one Unit in a Square", () => {
    for (const id of diagramIds) {
      const { lanes, columns, units, arrows, zones } = DIAGRAMS[id];
      const squares = new Set<string>();
      for (const unit of units) {
        expect(unit.lane, id).toBeGreaterThanOrEqual(0);
        expect(unit.lane, id).toBeLessThan(lanes);
        expect(unit.column, id).toBeGreaterThanOrEqual(1);
        expect(unit.column, id).toBeLessThanOrEqual(columns);
        const square = `${unit.lane}:${unit.column}`;
        expect(squares.has(square), `${id} ${square}`).toBe(false);
        squares.add(square);
      }
      for (const arrow of arrows) {
        expect(arrow.lane, id).toBeLessThan(lanes);
        for (const end of [arrow.from, arrow.to]) {
          expect(end, id).toBeGreaterThanOrEqual(0);
          expect(end, id).toBeLessThanOrEqual(columns + 1);
        }
        expect(arrow.from, id).not.toBe(arrow.to);
      }
      for (const zone of zones) {
        expect(zone.from, id).toBeGreaterThanOrEqual(1);
        expect(zone.to, id).toBeLessThanOrEqual(columns);
      }
    }
  });
});
