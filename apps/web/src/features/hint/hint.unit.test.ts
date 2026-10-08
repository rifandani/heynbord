import type { BattleEvent, CardInstance } from "@workspace/rules";
import { CARDS } from "@workspace/rules";
import { Predicate } from "effect";
import { describe, expect, it } from "vitest";

import type { LanguageMessages } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import type { HandCardView } from "@/features/battle/battle-view";
import { getEntry } from "@/features/handbook/handbook";
import type { BattleFacts } from "@/features/hint/hint";
import {
  battleHints,
  hasCardOutOfDecks,
  HINT_ENTRY,
  HINTS,
  nextHint,
} from "@/features/hint/hint";

const skillId = CARDS.find((card) => card.kind === "skill")?.id ?? "";
const creatureId = CARDS.find((card) => card.kind === "creature")?.id ?? "";

const handCard = (cardId: string | null, countdown: number): HandCardView => ({
  instanceId: 1,
  cardId,
  rank: cardId === null ? null : "common",
  countdown,
  blocked: false,
});

const recall = (side: "player" | "enemy", success: boolean): BattleEvent => ({
  _tag: "RecallRolled",
  side,
  // SAFETY: the Hints read only the side and the result of a Recall.
  card: { cardId: skillId } as CardInstance,
  success,
});

const facts = (over: Partial<BattleFacts>): BattleFacts => ({
  hand: [],
  log: [],
  tutorial: false,
  ...over,
});

describe("nextHint", () => {
  it("gives the first met Hint that the Player did not see", () => {
    expect(nextHint(["skillCard", "recall"], [])).toBe("skillCard");
    expect(nextHint(["skillCard", "recall"], ["skillCard"])).toBe("recall");
    expect(nextHint(["skillCard"], ["skillCard"])).toBeNull();
    expect(nextHint([], [])).toBeNull();
  });
});

describe("battleHints", () => {
  it("meets the Skill Card Hint with a Ready Skill Card in the Hand", () => {
    expect(battleHints(facts({ hand: [handCard(skillId, 0)] }))).toEqual([
      "skillCard",
    ]);
  });

  it("does not meet it for a Skill Card that is not Ready, or a Ready Creature Card", () => {
    expect(
      battleHints(
        facts({ hand: [handCard(skillId, 2), handCard(creatureId, 0)] })
      )
    ).toEqual([]);
  });

  it("meets the Recall Hint after Recall returned a Skill Card of the Player", () => {
    expect(battleHints(facts({ log: [recall("player", true)] }))).toEqual([
      "recall",
    ]);
    expect(
      battleHints(
        facts({ log: [recall("player", false), recall("enemy", true)] })
      )
    ).toEqual([]);
  });

  it("meets no Hint during the Tutorial", () => {
    expect(
      battleHints(
        facts({
          hand: [handCard(skillId, 0)],
          log: [recall("player", true)],
          tutorial: true,
        })
      )
    ).toEqual([]);
  });
});

describe("hasCardOutOfDecks", () => {
  const owned = [
    { cardId: creatureId, rank: "common", copies: 2 },
    { cardId: skillId, rank: "rare", copies: 1 },
  ] as const;

  it("is false when each owned card is in a Deck", () => {
    expect(
      hasCardOutOfDecks(owned, [
        [{ cardId: creatureId, rank: "common" }],
        [{ cardId: skillId, rank: "rare" }],
      ])
    ).toBe(false);
  });

  it("is true when an owned card and Rank is in no Deck", () => {
    expect(
      hasCardOutOfDecks(owned, [
        [
          { cardId: creatureId, rank: "common" },
          { cardId: creatureId, rank: "common" },
          { cardId: skillId, rank: "common" },
        ],
      ])
    ).toBe(true);
  });
});

/** A message or a group of messages in a Message Catalog. */
type CatalogNode = LanguageMessages[string];

const lookup = (
  catalog: LanguageMessages,
  key: string
): CatalogNode | undefined => {
  let node: CatalogNode | undefined = catalog;
  for (const part of key.split(".")) {
    node =
      node === undefined || Predicate.isString(node) || Array.isArray(node)
        ? undefined
        : node[part];
  }
  return node;
};

describe("the Hint text", () => {
  it("has each key in en-US and id-ID", () => {
    const keys = [
      "hints.label",
      "hints.readMore",
      "hints.close",
      ...HINTS.map((hint) => `hints.${hint}`),
    ];
    for (const catalog of [enUS, idID]) {
      for (const key of keys) {
        expect(
          Predicate.isString(lookup(catalog, key)),
          `${catalog.locale} ${key}`
        ).toBe(true);
      }
    }
  });

  it("opens the Handbook at an Entry that exists", () => {
    for (const hint of HINTS) {
      expect(getEntry(HINT_ENTRY[hint]).id).toBe(HINT_ENTRY[hint]);
    }
  });
});
