/**
 * Fits the smallest Base Rank bonus table for the Creature Cards that passes
 * the pairwise rule (ADR-0055). The Skill Cards use the same table and the
 * content test; a Skill Card with no main amount stays a written exception.
 * It prints the table and the cards that have no fit within the ±10% band. It
 * does not change `balance.ts` or `cards.ts`.
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
import { creaturePower, powerBudget } from "../src/content/balance";
import { CARDS } from "../src/content/cards";
import { isRankAtLeast, RANKS } from "../src/content/ranks";
import type { CreatureCardDefinition, RankId } from "../src/content/schema";

/** The Attack and HP limits of the card schema. */
const MAX_ATTACK = 12;
const MAX_HP = 30;

/** The budget before the Base Rank bonus (ADR-0021). */
const baseBudget = (countdown: number): number =>
  powerBudget(countdown, "common");

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

/** True when the line passes the pairwise rule at every playable Rank. */
const passesPairwise = (line: CreatureCardDefinition): boolean => {
  for (const rank of RANKS) {
    if (!isRankAtLeast(rank, line.baseRank)) {
      continue;
    }
    const ref = references.get(`${line.countdown}|${rank}`);
    const minimum = ref?.power ?? powerBudget(line.countdown, rank);
    if (creaturePower(line, rank) < minimum - 1e-9) {
      return false;
    }
  }
  return true;
};

/** True when some stat line of `card` is within the band at `bonus` and passes the pairwise rule. */
const fitsAt = (card: CreatureCardDefinition, bonus: number): boolean => {
  const target = baseBudget(card.countdown) * bonus;
  const maxAttack = card.attack === 0 ? 0 : MAX_ATTACK;
  const minAttack = card.attack === 0 ? 0 : 1;
  for (let attack = minAttack; attack <= maxAttack; attack += 1) {
    for (let hp = 1; hp <= MAX_HP; hp += 1) {
      const line = { ...card, attack, hp };
      const power = creaturePower(line, card.baseRank);
      if (Math.abs(power - target) > target * 0.1 + 1e-9) {
        continue;
      }
      if (passesPairwise(line)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * The smallest bonus where some legal stat line of `card` is within the
 * ±10% band and passes the pairwise rule. The band gives one interval for each
 * line: `power / (1.1 × budget)` to `power / (0.9 × budget)`.
 */
const smallestBonusFor = (card: CreatureCardDefinition): number => {
  const budget = baseBudget(card.countdown);
  const maxAttack = card.attack === 0 ? 0 : MAX_ATTACK;
  const minAttack = card.attack === 0 ? 0 : 1;
  let min = Number.POSITIVE_INFINITY;
  for (let attack = minAttack; attack <= maxAttack; attack += 1) {
    for (let hp = 1; hp <= MAX_HP; hp += 1) {
      const line = { ...card, attack, hp };
      if (!passesPairwise(line)) {
        continue;
      }
      const power = creaturePower(line, card.baseRank);
      min = Math.min(min, power / (1.1 * budget));
    }
  }
  return min;
};

const smallestBonus = (baseRank: RankId): number => {
  const cards = creatures.filter((card) => card.baseRank === baseRank);
  // A smaller bonus fails the card with the highest lower bound.
  return Math.max(...cards.map(smallestBonusFor));
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
console.log(
  "ADR-0055 uses ×1.7 for Legendary: the fit is below Epic, and the bonus must not fall as the Base Rank rises."
);

const noFit = creatures.filter(
  (card) =>
    card.baseRank !== "common" && !fitsAt(card, table[card.baseRank] ?? 1)
);
if (noFit.length > 0) {
  console.log("No fit within the ±10% band and the pairwise rule:");
  for (const card of noFit) {
    console.log(`- ${card.id}`);
  }
}
