/**
 * The swap rule for Skill Cards (Archetypes 3.3, issue #56). A Skill Card has
 * no Power Budget, so a Matchup measures it against a Creature Card with the
 * same Countdown: put 1 more copy of the Skill Card in a Deck of its Class in
 * place of 1 Creature Card, and compare the win rates against Vanguard and
 * Raiders. The card passes when each win rate changes by 5 points or less.
 */
import { ARCHETYPES } from "../content/archetypes";
import { getCard } from "../content/cards";
import { deckCountdown, MAX_COPIES } from "../content/decks";
import type {
  Archetype,
  ClassId,
  DeckEntry,
  SkillCardDefinition,
} from "../content/schema";
import { simulateMatchup } from "./simulate";
import type { MatchupOptions, MatchupReport } from "./simulate";

/** The Deck of each Class that gets the swap. */
const SWAP_DECKS: Readonly<Record<ClassId, string>> = {
  warrior: "vanguardFull",
  mage: "raidersFull",
  ranger: "thornwatch",
  priest: "wildHunt",
};

/** The opponents of the swap: the two release-gated Archetypes. */
const SWAP_OPPONENTS: readonly string[] = ["vanguard", "raiders"];

/** The largest change of a win rate that passes, from 0 to 1. */
export const SWAP_LIMIT = 0.05;

const archetypeOf = (id: string): Archetype => {
  const archetype = ARCHETYPES.find((each) => each.id === id);
  if (!archetype) {
    throw new Error(`Unknown Archetype: ${id}`);
  }
  return archetype;
};

/** The swap Deck of a Skill Card, before the swap. */
const swapDeckOf = (skill: SkillCardDefinition): Archetype =>
  archetypeOf(SWAP_DECKS[skill.class]);

const countOf = (deck: readonly DeckEntry[], cardId: string) =>
  deck.filter((entry) => entry.cardId === cardId).length;

const distance = (entry: DeckEntry, countdown: number) =>
  Math.abs(getCard(entry.cardId).countdown - countdown);

/**
 * The Creature Card that the swap takes out. It is a melee Unit (Range 0): a
 * Range 3 Shooter is worth much more than other Creature Cards with the same
 * Countdown in the Matchups (Archetypes 3.3), so no Skill Card can pass against
 * it. It has the same Countdown as the Skill Card, or the nearest one. Of two nearest Countdowns, the higher one
 * wins, so that the Deck Countdown does not go up. Of the cards with that
 * Countdown, the card with the most copies wins, so that the Deck keeps one;
 * then the first in Deck order.
 */
export const swappedCreature = (
  deck: readonly DeckEntry[],
  skill: SkillCardDefinition
): DeckEntry => {
  const creatures = deck.filter((entry) => {
    const card = getCard(entry.cardId);
    return card.kind === "creature" && card.range === 0;
  });
  const [first] = creatures;
  if (first === undefined) {
    throw new Error(`The swap Deck of ${skill.id} has no melee Creature Card`);
  }
  return creatures.reduce((best, entry) => {
    const order =
      distance(entry, skill.countdown) - distance(best, skill.countdown) ||
      getCard(best.cardId).countdown - getCard(entry.cardId).countdown ||
      countOf(deck, best.cardId) - countOf(deck, entry.cardId);
    return order < 0 ? entry : best;
  }, first);
};

/** `deck` with its first copy of `out` replaced by `replacement`. */
const replaceFirst = (
  deck: readonly DeckEntry[],
  out: string,
  replacement: DeckEntry
): DeckEntry[] => {
  const index = deck.findIndex((entry) => entry.cardId === out);
  return deck.map((entry, at) => (at === index ? replacement : entry));
};

export interface SkillSwap {
  readonly skillId: string;
  /** The swap Deck before the swap. */
  readonly base: Archetype;
  /** The Creature Card that the swap takes out of `base`. */
  readonly creature: DeckEntry;
  /** True when the Creature Card has the same Countdown as the Skill Card. */
  readonly sameCountdown: boolean;
  /** `base` with 1 more Skill Card copy in place of the Creature Card. */
  readonly swapped: Archetype;
  /**
   * `base` with its Skill Card copy replaced by 1 more copy of the Creature
   * Card. It measures the copy that is already in the Deck. It is `null` when
   * `base` has no copy of the Skill Card, or 3 copies of the Creature Card.
   */
  readonly reverse: Archetype | null;
}

/** The scratch Decks of the swap for one Skill Card. */
export const skillSwap = (skill: SkillCardDefinition): SkillSwap => {
  const base = swapDeckOf(skill);
  if (countOf(base.deck, skill.id) >= MAX_COPIES) {
    throw new Error(
      `${base.id} already has ${MAX_COPIES} copies of ${skill.id}`
    );
  }
  const creature = swappedCreature(base.deck, skill);
  const skillCopy = { cardId: skill.id, rank: skill.baseRank };
  const hasReverse =
    countOf(base.deck, skill.id) > 0 &&
    countOf(base.deck, creature.cardId) < MAX_COPIES;
  return {
    skillId: skill.id,
    base,
    creature,
    sameCountdown: getCard(creature.cardId).countdown === skill.countdown,
    swapped: {
      ...base,
      id: `${base.id}+${skill.id}`,
      deck: replaceFirst(base.deck, creature.cardId, skillCopy),
    },
    reverse: hasReverse
      ? {
          ...base,
          id: `${base.id}-${skill.id}`,
          deck: replaceFirst(base.deck, skill.id, creature),
        }
      : null,
  };
};

/** The win rates of a swap against one opponent, from 0 to 1. */
export interface SwapResult {
  readonly opponentId: string;
  readonly before: number;
  readonly after: number;
  /** The win rate of the reverse Deck, or `null` when it has none. */
  readonly reverse: number | null;
  /** True when `after` is within `SWAP_LIMIT` of `before`. */
  readonly pass: boolean;
  /**
   * The lock rate of the Deck before and after the swap (ADR-0025): the share
   * of Battles in which an opponent Unit skipped 3 or more actions in a row.
   */
  readonly lockBefore: number;
  readonly lockAfter: number;
}

export interface SkillSwapReport {
  readonly skillId: string;
  readonly deckId: string;
  readonly creatureId: string;
  readonly sameCountdown: boolean;
  /** The Deck Countdown after the swap minus before it. */
  readonly countdownChange: number;
  readonly results: readonly SwapResult[];
  /** True when each result passes. */
  readonly pass: boolean;
}

/**
 * True when `after` is within `SWAP_LIMIT` of `before`. A win rate is a count
 * of `battles`, so the check counts Battles and has no rounding error.
 */
export const isSwapPass = (before: number, after: number, battles: number) =>
  Math.abs(Math.round((after - before) * battles)) <=
  Math.round(SWAP_LIMIT * battles);

/**
 * The swap report of one Skill Card. `cache` keeps the win rates of each base
 * Deck, so that the cards of one Class play the base Matchups one time.
 */
export const simulateSkillSwap = (
  skill: SkillCardDefinition,
  options: MatchupOptions,
  cache = new Map<string, MatchupReport>()
): SkillSwapReport => {
  const swap = skillSwap(skill);
  const matchup = (deck: Archetype, opponentId: string) =>
    simulateMatchup(deck, archetypeOf(opponentId), options);
  const results = SWAP_OPPONENTS.map((opponentId): SwapResult => {
    const key = `${swap.base.id}:${opponentId}`;
    const before = cache.get(key) ?? matchup(swap.base, opponentId);
    cache.set(key, before);
    const after = matchup(swap.swapped, opponentId);
    return {
      opponentId,
      before: before.winRate,
      after: after.winRate,
      reverse: swap.reverse ? matchup(swap.reverse, opponentId).winRate : null,
      pass: isSwapPass(before.winRate, after.winRate, options.seeds * 2),
      lockBefore: before.lockRate,
      lockAfter: after.lockRate,
    };
  });
  return {
    skillId: skill.id,
    deckId: swap.base.id,
    creatureId: swap.creature.cardId,
    sameCountdown: swap.sameCountdown,
    countdownChange:
      deckCountdown(swap.swapped.deck) - deckCountdown(swap.base.deck),
    results,
    pass: results.every((result) => result.pass),
  };
};
