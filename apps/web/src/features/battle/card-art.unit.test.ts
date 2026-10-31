import { existsSync, readdirSync, readFileSync } from "node:fs";

import {
  CARDS,
  chooseCommand,
  getCard,
  getStarterDeck,
  step,
  TOKENS,
} from "@workspace/rules";
import type { BattleState, TokenId } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import {
  battleModelCopies,
  battleUnitSources,
  cardIllustration,
  sourceId,
  hasCardArt,
  hasTokenArt,
  tokenIllustration,
  unitIllustration,
} from "@/features/battle/card-art";
import { NEW_PLAYER } from "@/features/profile/profile";

// SAFETY: `TOKENS` is a record with a key for each Token ID, and no other key.
const TOKEN_IDS = Object.keys(TOKENS) as TokenId[];

const inPublic = (file: string) =>
  existsSync(new URL(`../../../public${file}`, import.meta.url));

describe("cardIllustration", () => {
  it("puts the kebab-case card name in the folder of its Race or Class", () => {
    expect(cardIllustration("human.crossbowGuard")).toBe(
      "/creature/human/crossbow-guard.webp"
    );
    expect(cardIllustration("orc.warchiefGrukka")).toBe(
      "/creature/orc/warchief-grukka.webp"
    );
    expect(cardIllustration("elf.lethielFirstGardener")).toBe(
      "/creature/elf/lethiel-first-gardener.webp"
    );
    expect(cardIllustration("mage.fireball")).toBe(
      "/skills/mage/fireball.webp"
    );
  });
});

describe("tokenIllustration", () => {
  it("puts the kebab-case Token name in the Token folder", () => {
    expect(tokenIllustration("token.skeleton")).toBe(
      "/creature/token/skeleton.webp"
    );
    expect(tokenIllustration("token.restlessWisp")).toBe(
      "/creature/token/restless-wisp.webp"
    );
  });
});

describe("unitIllustration", () => {
  it("uses the card art of a Card Unit and the Token art of a Token Unit", () => {
    expect(
      unitIllustration({ _tag: "Card", cardId: "undead.lanternWidow" })
    ).toBe("/creature/undead/lantern-widow.webp");
    expect(
      unitIllustration({ _tag: "Token", tokenId: "token.restlessWisp" })
    ).toBe("/creature/token/restless-wisp.webp");
  });
});

describe("hasCardArt", () => {
  it("has art for the Human, Orc, Undead, Goblin, Elf and Feral cards and the Skill Cards", () => {
    expect(hasCardArt("human.crossbowGuard")).toBe(true);
    expect(hasCardArt("undead.sirOdoLastTaxman")).toBe(true);
    expect(hasCardArt("goblin.ankleSnatcher")).toBe(true);
    expect(hasCardArt("elf.lethielFirstGardener")).toBe(true);
    expect(hasCardArt("mage.fireball")).toBe(true);
    expect(hasCardArt("ranger.longShot")).toBe(true);
    expect(hasCardArt("priest.sanctuary")).toBe(true);
    expect(hasCardArt("feral.caveBear")).toBe(true);
    expect(hasCardArt("warrior.shoulderCharge")).toBe(true);
    expect(hasCardArt("priest.prayerOfHealing")).toBe(true);
    expect(hasCardArt("ranger.rainOfArrows")).toBe(true);
  });

  it("has art for Hunter's Focus", () => {
    expect(hasCardArt("ranger.huntersFocus")).toBe(true);
  });

  it("has art for the Rare and Epic Priest Skill Cards (#62)", () => {
    expect(hasCardArt("priest.cleanse")).toBe(true);
    expect(hasCardArt("priest.unbrokenVow")).toBe(true);
    expect(hasCardArt("priest.aegisOfDawn")).toBe(true);
  });

  it("has art for the Rare and Epic Warrior Skill Cards (#64)", () => {
    expect(hasCardArt("warrior.callToArms")).toBe(true);
    expect(hasCardArt("warrior.exposeWeakness")).toBe(true);
    expect(hasCardArt("warrior.onslaught")).toBe(true);
  });

  it("has art for the Lightning and Field Effect Mage Skill Cards (#66)", () => {
    for (const cardId of [
      "mage.spark",
      "mage.arcLightning",
      "mage.wildfire",
      "mage.thunderstorm",
      "mage.blizzard",
    ]) {
      expect(hasCardArt(cardId), cardId).toBe(true);
    }
  });

  it("has a file in public/ for each card with art", () => {
    const missing = CARDS.filter((card) => hasCardArt(card.id))
      .map((card) => cardIllustration(card.id))
      .filter((file) => !inPublic(file));
    expect(missing).toEqual([]);
  });
});

describe("hasTokenArt", () => {
  it("has art for each v1 Token, with a file in public/", () => {
    expect(TOKEN_IDS.filter((tokenId) => !hasTokenArt(tokenId))).toEqual([]);
    expect(
      TOKEN_IDS.map(tokenIllustration).filter((file) => !inPublic(file))
    ).toEqual([]);
  });
});

/** A width or a height in the WebP header has 14 bits. */
const FOURTEEN_BITS = 0x40_00;

/**
 * The width and height of a WebP file, from its header. The first chunk is
 * `VP8 ` (lossy), `VP8L` (lossless) or `VP8X` (extended).
 */
const webpSize = (file: Buffer): readonly [number, number] => {
  const chunk = file.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return [
      file.readUInt16LE(26) % FOURTEEN_BITS,
      file.readUInt16LE(28) % FOURTEEN_BITS,
    ];
  }
  if (chunk === "VP8L") {
    const bits = file.readUInt32LE(21);
    return [
      (bits % FOURTEEN_BITS) + 1,
      (Math.floor(bits / FOURTEEN_BITS) % FOURTEEN_BITS) + 1,
    ];
  }
  return [file.readUIntLE(24, 3) + 1, file.readUIntLE(27, 3) + 1];
};

describe("card art files", () => {
  it("are all 600 × 800 (art direction 5.3)", () => {
    const wrong = ["creature", "skills"].flatMap((folder) => {
      const root = new URL(`../../../public/${folder}/`, import.meta.url);
      return readdirSync(root, { recursive: true, encoding: "utf-8" })
        .filter((path) => path.endsWith(".webp"))
        .map((path) => {
          const [width, height] = webpSize(readFileSync(new URL(path, root)));
          return `${folder}/${path} ${width} × ${height}`;
        })
        .filter((line) => !line.endsWith(" 600 × 800"));
    });
    expect(wrong).toEqual([]);
  });
});

/** True when a Token Unit is on the Board. */
const hasToken = (current: BattleState) =>
  current.units.some((unit) => unit.source._tag === "Token");

describe("battleUnitSources", () => {
  it("lists each Creature Card of both Sides one time, and no Skill Card", () => {
    const { rules } = startSession({
      stageId: "1-1",
      deck: getStarterDeck("vanguard"),
      player: NEW_PLAYER,
      seed: 7,
    });
    const sources = battleUnitSources(rules);
    const cards = sources.flatMap((source) =>
      source._tag === "Card" ? [source.cardId] : []
    );
    expect(cards.length).toBeGreaterThan(0);
    expect(new Set(cards).size).toBe(cards.length);
    for (const cardId of cards) {
      expect(getCard(cardId).kind).toBe("creature");
    }
  });

  it("adds each Token that a Creature Card can summon, one time", () => {
    const { rules } = startSession({
      stageId: "1-1",
      player: NEW_PLAYER,
      deck: {
        classId: "warrior",
        deck: [
          { cardId: "undead.hushbow", rank: "common" },
          { cardId: "undead.graveBellTender", rank: "common" },
          { cardId: "undead.lanternWidow", rank: "rare" },
        ],
      },
      seed: 7,
    });
    const tokens = battleUnitSources(rules).flatMap((source) =>
      source._tag === "Token" ? [source.tokenId] : []
    );
    expect(tokens.toSorted()).toEqual(["token.restlessWisp", "token.skeleton"]);
  });

  it("adds the Card and the Token of each Unit on the Board", () => {
    let state: BattleState = startSession({
      stageId: "1-1",
      player: NEW_PLAYER,
      deck: {
        classId: "warrior",
        deck: Array.from({ length: 4 }, () => [
          { cardId: "undead.hushbow", rank: "common" as const },
          { cardId: "undead.graveBellTender", rank: "common" as const },
        ]).flat(),
      },
      seed: 7,
    }).rules;
    while (state.status !== "finished" && !hasToken(state)) {
      ({ state } = Result.getOrThrow(step(state, chooseCommand(state))));
    }
    expect(hasToken(state)).toBe(true);
    // The Hand, the Deck and the Graveyard do not have the cards of the Units.
    const onBoard = state.units.map((unit) =>
      unit.source._tag === "Card"
        ? unit.source.card.cardId
        : unit.source.tokenId
    );
    const listed = battleUnitSources({
      ...state,
      sides: {
        player: {
          ...state.sides.player,
          heroes: state.sides.player.heroes.map((hero) => ({
            ...hero,
            hand: [],
            deck: [],
            graveyard: [],
          })),
        },
        enemy: {
          ...state.sides.enemy,
          heroes: state.sides.enemy.heroes.map((hero) => ({
            ...hero,
            hand: [],
            deck: [],
            graveyard: [],
          })),
        },
      },
    }).map(sourceId);
    for (const id of onBoard) {
      expect(listed).toContain(id);
    }
  });
});

describe("sourceId", () => {
  it("gives the card ID of a Card Unit and the Token ID of a Token Unit", () => {
    expect(sourceId({ _tag: "Card", cardId: "undead.hushbow" })).toBe(
      "undead.hushbow"
    );
    expect(sourceId({ _tag: "Token", tokenId: "token.skeleton" })).toBe(
      "token.skeleton"
    );
  });
});

describe("Battle model copy counts", () => {
  it("counts every Deck entry and every start Unit once", () => {
    const deck = getStarterDeck("vanguard");
    const session = startSession({
      stageId: "1-10",
      deck,
      player: NEW_PLAYER,
      seed: 7,
    });
    const cards = battleModelCopies(session.rules);
    const allCards = Object.values(session.rules.sides).flatMap((side) =>
      side.heroes.flatMap((hero) => [
        ...hero.hand,
        ...hero.deck,
        ...hero.graveyard,
      ])
    );
    const startUnits = session.rules.units.filter(
      (unit) => unit.source._tag === "Card"
    );
    expect(cards.length).toBe(allCards.length + startUnits.length);
    expect(startUnits.length).toBeGreaterThan(0);
    for (const unit of startUnits) {
      if (unit.source._tag === "Card") {
        const id = unit.source.card.cardId;
        expect(cards.filter((cardId) => cardId === id)).toHaveLength(
          allCards.filter((card) => card.cardId === id).length +
            startUnits.filter(
              (start) =>
                start.source._tag === "Card" && start.source.card.cardId === id
            ).length
        );
      }
    }
    expect(
      cards.filter((id) => id === "human.crossbowGuard").length
    ).toBeGreaterThanOrEqual(3);
  });
});
