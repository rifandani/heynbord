import type { BattleEvent, CardInstance } from "@workspace/rules";
import { CARDS } from "@workspace/rules";
import { Predicate } from "effect";
import { describe, expect, it } from "vitest";

import type { LanguageMessages } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import type { HandCardView } from "@/features/battle/battle-view";
import { KEY_GUIDE } from "@/features/battle/components/battle-keys";
import { getEntry } from "@/features/handbook/handbook";
import type { BattleFacts } from "@/features/hint/hint";
import {
  battleHints,
  hasCardOutOfDecks,
  HINT_TARGET,
  HINTS,
  isBattleLogHintMet,
  isSweepHintMet,
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
  hero: 0,
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

describe("isBattleLogHintMet", () => {
  it("meets the Battle Log Hint at a loss after the Tutorial", () => {
    for (const reason of ["heroDefeated", "turnLimit", "routed"] as const) {
      expect(
        isBattleLogHintMet({
          result: { winner: "enemy", reason },
          tutorial: false,
        })
      ).toBe(true);
    }
  });

  it("does not meet it at a win", () => {
    expect(
      isBattleLogHintMet({
        result: { winner: "player", reason: "heroDefeated" },
        tutorial: false,
      })
    ).toBe(false);
  });

  it("does not meet it at a loss in the Tutorial", () => {
    expect(
      isBattleLogHintMet({
        result: { winner: "enemy", reason: "heroDefeated" },
        tutorial: true,
      })
    ).toBe(false);
  });

  it("shows one time: not again after the Player saw it", () => {
    expect(nextHint(["battleLog"], [])).toBe("battleLog");
    expect(nextHint(["battleLog"], ["battleLog"])).toBeNull();
  });
});

describe("isSweepHintMet", () => {
  it("meets the Sweep Hint on a Stage with 3 best Stars", () => {
    expect(isSweepHintMet(3)).toBe(true);
  });

  it("does not meet it on a Stage with 0 to 2 best Stars", () => {
    for (const stars of [0, 1, 2]) {
      expect(isSweepHintMet(stars)).toBe(false);
    }
  });

  it("opens the Sweep Entry, and shows one time", () => {
    expect(HINT_TARGET.sweep).toEqual({ _tag: "Entry", entry: "sweep" });
    expect(nextHint(["sweep"], [])).toBe("sweep");
    expect(nextHint(["sweep"], ["sweep"])).toBeNull();
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

  it("opens the Handbook at an Entry, or the Key Guide at a line, that exists", () => {
    const lines = KEY_GUIDE.map((line) => line.action);
    for (const hint of HINTS) {
      const target = HINT_TARGET[hint];
      if (target._tag === "Entry") {
        expect(getEntry(target.entry).id).toBe(target.entry);
      } else {
        expect(lines).toContain(target.line);
      }
    }
  });

  it("opens the Key Guide at the Battle Log key for the Battle Log Hint", () => {
    expect(HINT_TARGET.battleLog).toEqual({
      _tag: "KeyGuide",
      line: "battleLog",
    });
    expect(KEY_GUIDE.find((line) => line.action === "battleLog")?.keys).toEqual(
      ["L"]
    );
  });
});
