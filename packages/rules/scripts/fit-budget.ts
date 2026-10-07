/**
 * Fits each Creature Card to a linear Power Budget `intercept + slope ×
 * Countdown` (issue #20). It changes only the printed Attack and HP, and it
 * measures them at the Base Rank (ADR-0020). Countdown, Speed, Range, Damage
 * Type and Keywords do not change. A card with Attack 0 keeps Attack 0.
 *
 * Usage: `bun scripts/fit-budget.ts <intercept> <slope>`. It prints the fit of
 * each card. It does not change `cards.ts`.
 *
 * The fit selects the Attack and HP with the power nearest to the budget. All
 * powers within the tolerance are equally near, and of these it selects the
 * Attack-to-HP shape nearest to the current card.
 */
import { creaturePower } from "../src/content/balance";
import { CARDS } from "../src/content/cards";
import { scaleForRank } from "../src/content/ranks";
import type { CreatureCardDefinition } from "../src/content/schema";

export interface LinearBudget {
  readonly intercept: number;
  readonly slope: number;
}

export interface CardFit {
  readonly id: string;
  readonly attack: number;
  readonly hp: number;
  readonly power: number;
  readonly budget: number;
}

const MAX_STAT = 30;

/** A power this near to the budget is a hit: 5% of the budget, and at least 1. */
const tolerance = (budget: number): number => Math.max(1, budget * 0.05);

export const budgetFor = (budget: LinearBudget, countdown: number): number =>
  budget.intercept + budget.slope * countdown;

/** The Attack-to-HP ratio at the Base Rank, as an angle. */
const attackRatio = (
  card: CreatureCardDefinition,
  attack: number,
  hp: number
) =>
  Math.atan2(
    scaleForRank(attack, card.baseRank),
    scaleForRank(hp, card.baseRank)
  );

export const fitCard = (
  card: CreatureCardDefinition,
  budget: LinearBudget
): CardFit => {
  const target = budgetFor(budget, card.countdown);
  const original = attackRatio(card, card.attack, card.hp);
  const maxAttack = card.attack === 0 ? 0 : MAX_STAT;
  const minAttack = card.attack === 0 ? 0 : 1;
  let best: (CardFit & { miss: number; ratioMiss: number }) | undefined;
  for (let attack = minAttack; attack <= maxAttack; attack += 1) {
    for (let hp = 1; hp <= MAX_STAT; hp += 1) {
      const power = creaturePower({ ...card, attack, hp });
      const distance = Math.abs(power - target);
      const miss = Math.max(0, distance - tolerance(target));
      const ratioMiss = Math.abs(attackRatio(card, attack, hp) - original);
      const better =
        !best ||
        miss < best.miss ||
        (miss === best.miss && ratioMiss < best.ratioMiss) ||
        (miss === best.miss &&
          ratioMiss === best.ratioMiss &&
          distance < Math.abs(best.power - target));
      if (better) {
        best = {
          id: card.id,
          attack,
          hp,
          power,
          budget: target,
          miss,
          ratioMiss,
        };
      }
    }
  }
  if (!best) {
    throw new Error(`No fit for ${card.id}`);
  }
  const { miss: _miss, ratioMiss: _ratioMiss, ...fit } = best;
  return fit;
};

export const fitCards = (budget: LinearBudget): CardFit[] =>
  CARDS.flatMap((card) =>
    card.kind === "creature" ? [fitCard(card, budget)] : []
  );

const percent = (power: number, budget: number): string =>
  `${(((power - budget) / budget) * 100).toFixed(1)}%`;

if (import.meta.main) {
  const [intercept, slope] = process.argv.slice(2).map(Number);
  if (
    intercept === undefined ||
    slope === undefined ||
    Number.isNaN(intercept) ||
    Number.isNaN(slope)
  ) {
    console.error("Usage: bun scripts/fit-budget.ts <intercept> <slope>");
    process.exit(1);
  }
  const budget = { intercept, slope };
  const rows = CARDS.flatMap((card) => {
    if (card.kind !== "creature") {
      return [];
    }
    const fit = fitCard(card, budget);
    return [
      {
        card: card.id,
        countdown: card.countdown,
        baseRank: card.baseRank,
        now: `${card.attack}/${card.hp}`,
        fit: `${fit.attack}/${fit.hp}`,
        power: fit.power,
        budget: fit.budget,
        deviation: percent(fit.power, fit.budget),
      },
    ];
  });
  console.table(rows);
}
