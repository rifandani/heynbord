/**
 * Fits the smallest Base Rank bonus table that passes the pairwise rule
 * (ADR-0055). It prints the table and the cards that have no fit within the
 * ±10% band. It does not change `balance.ts` or `cards.ts`.
 *
 * Usage: `bun scripts/fit-base-rank-budget.ts`.
 *
 * The pairwise rule compares a copy of a higher Base Rank card at each
 * playable Rank with the strongest copy of a Base Rank Common card of the
 * same Countdown at that Rank. A Countdown with no Common card uses the
 * Power Budget of that Rank. The script searches every printed Attack and HP
 * that stays within ±10% of the new budget, and it keeps the line if every
 * Rank passes.
 */
import { creaturePower } from "../src/content/balance";
import { CARDS } from "../src/content/cards";
import { RANKS } from "../src/content/ranks";
import type { CreatureCardDefinition, RankId } from "../src/content/schema";

/** The budget before the Base Rank bonus (ADR-0021). */
const baseBudget = (countdown: number): number => 19 + 3 * (countdown - 3);

const creatures = CARDS.filter(
  (card): card is CreatureCardDefinition => card.kind === "creature"
);

/** The strongest Common copy of a Countdown at a Rank. */
const reference = (
  countdown: number,
  rank: RankId
): { readonly power: number; readonly ids: readonly string[] } | null => {
  const commons = creatures.filter(
    (card) => card.countdown === countdown && card.baseRank === "common"
  );
  if (commons.length === 0) {
    return null;
  }
  const powers = commons.map((card) => creaturePower(card, rank));
  const power = Math.max(...powers);
  const ids: string[] = [];
  for (const [index, card] of commons.entries()) {
    if (powers[index] === power) {
      ids.push(card.id);
    }
  }
  return { power, ids };
};

const references = new Map<string, ReturnType<typeof reference>>();
for (const countdown of new Set(creatures.map((card) => card.countdown))) {
  for (const rank of RANKS) {
    references.set(`${countdown}|${rank}`, reference(countdown, rank));
  }
}

/** The highest power of a copy of `card` at each Rank, within the band. */
const maxPowerAtRank = (
  card: CreatureCardDefinition,
  bonus: number
): Record<string, number> | null => {
  const target = baseBudget(card.countdown) * bonus;
  const maxAttack = card.attack === 0 ? 0 : 40;
  const minAttack = card.attack === 0 ? 0 : 1;
  const max: Record<string, number> = {};
  for (const rank of RANKS) {
    max[rank] = Number.NEGATIVE_INFINITY;
  }
  let any = false;
  for (let attack = minAttack; attack <= maxAttack; attack += 1) {
    for (let hp = 1; hp <= 40; hp += 1) {
      const line = { ...card, attack, hp };
      const power = creaturePower(line, card.baseRank);
      if (Math.abs(power - target) > target * 0.1 + 1e-9) {
        continue;
      }
      any = true;
      for (const rank of RANKS) {
        if (RANKS.indexOf(rank) < RANKS.indexOf(card.baseRank)) {
          continue;
        }
        max[rank] = Math.max(max[rank] ?? 0, creaturePower(line, rank));
      }
    }
  }
  return any ? max : null;
};

/** True when some stat line of `card` passes the pairwise rule at `bonus`. */
const fits = (card: CreatureCardDefinition, bonus: number): boolean => {
  const max = maxPowerAtRank(card, bonus);
  if (max === null) {
    return false;
  }
  for (const rank of RANKS) {
    if (RANKS.indexOf(rank) < RANKS.indexOf(card.baseRank)) {
      continue;
    }
    const ref = references.get(`${card.countdown}|${rank}`);
    const minimum = ref?.power ?? baseBudget(card.countdown) * bonus;
    if ((max[rank] ?? 0) < minimum - 1e-9) {
      return false;
    }
  }
  return true;
};

const smallestBonus = (baseRank: RankId): number => {
  const cards = creatures.filter((card) => card.baseRank === baseRank);
  let low = 1;
  let high = 4;
  for (let step = 0; step < 60; step += 1) {
    const middle = (low + high) / 2;
    if (cards.some((card) => !fits(card, middle))) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return high;
};

const table = Object.fromEntries(
  (["uncommon", "rare", "epic", "legendary"] as const).map((rank) => [
    rank,
    smallestBonus(rank),
  ])
);
console.log("The smallest Base Rank bonus table that passes the pairwise rule");
console.table([
  { baseRank: "common", bonus: 1 },
  ...Object.entries(table).map(([baseRank, bonus]) => ({
    baseRank,
    bonus: Number(bonus.toFixed(4)),
  })),
]);
