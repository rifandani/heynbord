import type { BattleState } from "@workspace/rules";
import { getCard } from "@workspace/rules";

/**
 * The path of the card art for a card ID. A Creature Card is in the folder of
 * its Race and a Skill Card is in the folder of its Class:
 * `human.crossbowGuard` uses `/creature/human/crossbow-guard.webp` and
 * `mage.fireball` uses `/skills/mage/fireball.webp`. Each card has one 3:4
 * portrait image with its background (art direction 5.3).
 */
export const cardIllustration = (cardId: string): string => {
  const card = getCard(cardId);
  const name = cardId.slice(cardId.indexOf(".") + 1);
  const file = name.replaceAll(
    /[A-Z]/gu,
    (letter) => `-${letter.toLowerCase()}`
  );
  const folder =
    card.kind === "creature" ? `creature/${card.race}` : `skills/${card.class}`;
  return `/${folder}/${file}.webp`;
};

/**
 * The Races and Classes that have their card art. The other cards show their
 * emblem in the art window, so the game does not ask for an image that does
 * not exist. Add a Race or Class here when its art is in `public/`.
 */
const RACES_AND_CLASSES_WITH_ART: ReadonlySet<string> = new Set([
  "human",
  "orc",
  "elf",
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
    if (unit.source._tag === "Card") {
      cards.add(unit.source.card.cardId);
    }
  }
  return [...cards].filter((cardId) => getCard(cardId).kind === "creature");
};
