import type { BattleState } from "@workspace/rules";
import { getCard } from "@workspace/rules";

/**
 * The path of the card art for a card ID: `human.crossbowGuard` uses
 * `/illustrations/crossbow-guard.jpg`. Each card has one 3:4 portrait image
 * with its background (art direction 5.3).
 */
export const cardIllustration = (cardId: string): string => {
  const name = cardId.slice(cardId.indexOf(".") + 1);
  const file = name.replaceAll(
    /[A-Z]/gu,
    (letter) => `-${letter.toLowerCase()}`
  );
  return `/illustrations/${file}.jpg`;
};

/**
 * The Creature Cards of both Sides in a Battle, each one time: the cards that
 * can put a Unit on the Board, to load their art before the first summon.
 */
export const battleCreatureCards = (state: BattleState): readonly string[] => {
  const cards = new Set<string>();
  for (const side of Object.values(state.sides)) {
    for (const card of [...side.hand, ...side.deck, ...side.graveyard]) {
      cards.add(card.cardId);
    }
  }
  for (const unit of state.units) {
    cards.add(unit.card.cardId);
  }
  return [...cards].filter((cardId) => getCard(cardId).kind === "creature");
};
