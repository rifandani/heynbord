import type { BattleState, TokenId } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { UnitSourceView } from "@/features/battle/battle-view";

/** The file name of an ID: `human.crossbowGuard` is `crossbow-guard`. */
const fileName = (id: string): string =>
  id
    .slice(id.indexOf(".") + 1)
    .replaceAll(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);

/**
 * The path of the card art for a card ID. A Creature Card is in the folder of
 * its Race and a Skill Card is in the folder of its Class:
 * `human.crossbowGuard` uses `/creature/human/crossbow-guard.webp` and
 * `mage.fireball` uses `/skills/mage/fireball.webp`. Each card has one 3:4
 * portrait image with its background (art direction 5.3).
 */
export const cardIllustration = (cardId: string): string => {
  const card = getCard(cardId);
  const folder =
    card.kind === "creature" ? `creature/${card.race}` : `skills/${card.class}`;
  return `/${folder}/${fileName(cardId)}.webp`;
};

/**
 * The path of the art of a Token. All Tokens are in one folder:
 * `token.restlessWisp` uses `/creature/token/restless-wisp.webp`. A Token has
 * one 3:4 portrait image with its background, as a card has.
 */
export const tokenIllustration = (tokenId: TokenId): string =>
  `/creature/token/${fileName(tokenId)}.webp`;

/**
 * The Tokens that have their art. The other Tokens show their Race emblem.
 * Add a Token here when its art is in `public/`.
 */
const TOKENS_WITH_ART: ReadonlySet<TokenId> = new Set<TokenId>([
  "token.skeleton",
  "token.restlessWisp",
]);

/** Whether the art of a Token exists (see `tokenIllustration`). */
export const hasTokenArt = (tokenId: TokenId): boolean =>
  TOKENS_WITH_ART.has(tokenId);

/**
 * The Races and Classes that have their card art. The other cards show their
 * emblem in the art window, so the game does not ask for an image that does
 * not exist. Add a Race or Class here when its art is in `public/`.
 */
const RACES_AND_CLASSES_WITH_ART: ReadonlySet<string> = new Set([
  "human",
  "orc",
  "elf",
  "undead",
  "goblin",
  "feral",
  "warrior",
  "mage",
]);

/** Whether the art of a card exists (see `cardIllustration`). */
export const hasCardArt = (cardId: string): boolean => {
  const card = getCard(cardId);
  return RACES_AND_CLASSES_WITH_ART.has(
    card.kind === "creature" ? card.race : card.class
  );
};

/** The ID of the card or the Token of a Unit. Each one is a key for its art. */
export const sourceId = (source: UnitSourceView): string =>
  source._tag === "Card" ? source.cardId : source.tokenId;

/** The path of the art of a Unit: its card art, or its Token art. */
export const unitIllustration = (source: UnitSourceView): string =>
  source._tag === "Card"
    ? cardIllustration(source.cardId)
    : tokenIllustration(source.tokenId);

/**
 * The Creature Cards of both Sides in a Battle, and the Tokens that they can
 * summon, each one time: all that can put a Unit on the Board, to load their
 * art before the first summon.
 */
export const battleUnitSources = (
  state: BattleState
): readonly UnitSourceView[] => {
  const cards = new Set<string>();
  for (const side of Object.values(state.sides)) {
    for (const card of [...side.hand, ...side.deck, ...side.graveyard]) {
      cards.add(card.cardId);
    }
  }
  const tokens = new Set<TokenId>();
  for (const unit of state.units) {
    if (unit.source._tag === "Card") {
      cards.add(unit.source.card.cardId);
    } else {
      tokens.add(unit.source.tokenId);
    }
  }
  const creatures = [...cards].flatMap((cardId) => {
    const card = getCard(cardId);
    return card.kind === "creature" ? [card] : [];
  });
  for (const card of creatures) {
    if (card.keywords.summon) {
      tokens.add(card.keywords.summon);
    }
  }
  return [
    ...creatures.map((card): UnitSourceView => ({
      _tag: "Card",
      cardId: card.id,
    })),
    ...[...tokens].map((tokenId): UnitSourceView => ({
      _tag: "Token",
      tokenId,
    })),
  ];
};
