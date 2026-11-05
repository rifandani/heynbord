/**
 * Prints the card lines that fit the Base Rank Power Budget (ADR-0055) and the
 * pairwise rule. It does not change `cards.ts`.
 *
 * Usage: `bun scripts/rebalance-cards.ts`.
 *
 * A card that already passes keeps its line. A card that fails keeps its
 * shape: the printed Attack and HP scale with the Base Rank bonus (Common
 * ×1.0, Uncommon ×1.25, Rare ×1.4463, Epic ×1.6529, Legendary ×1.7), then the
 * line moves by the fewest Power Points that fit the ±10% band and the
 * pairwise rule.
 */
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  BASE_RANK_BUDGET_BONUS,
  budgetDeviation,
  creaturePower,
  powerBudget,
  SKILL_BUDGET_CAP,
  skillBudgetCheck,
  skillPower,
} from "../src/content/balance";
import { CARDS } from "../src/content/cards";
import { isRankAtLeast, RANKS } from "../src/content/ranks";
import type {
  CardDefinition,
  CreatureCardDefinition,
  RankId,
} from "../src/content/schema";

const MAX_ATTACK = 12;
const MAX_HP = 30;

const powerAtRank = (card: CardDefinition, rank: RankId): number =>
  card.kind === "creature" ? creaturePower(card, rank) : skillPower(card, rank);

const references = new Map<string, number | null>();
for (const kind of ["creature", "skill"] as const) {
  const cards = CARDS.filter((card) => card.kind === kind);
  for (const countdown of new Set(cards.map((card) => card.countdown))) {
    for (const rank of RANKS) {
      const commons = cards.filter(
        (card) => card.countdown === countdown && card.baseRank === "common"
      );
      const power =
        commons.length === 0
          ? powerBudget(countdown, rank)
          : Math.max(...commons.map((card) => powerAtRank(card, rank)));
      references.set(`${kind}|${countdown}|${rank}`, power);
    }
  }
}

const referenceFor = (card: CardDefinition, rank: RankId): number | null =>
  references.get(`${card.kind}|${card.countdown}|${rank}`) ?? null;

const passesPairwise = (card: CreatureCardDefinition): boolean => {
  if (card.baseRank === "common") {
    return true;
  }
  for (const rank of RANKS) {
    if (!isRankAtLeast(rank, card.baseRank)) {
      continue;
    }
    const reference = referenceFor(card, rank);
    if (reference !== null && creaturePower(card, rank) < reference - 1e-9) {
      return false;
    }
  }
  return true;
};

const passes = (card: CreatureCardDefinition): boolean =>
  Math.abs(budgetDeviation(card)) <= 1000 && passesPairwise(card);

interface Line {
  readonly attack: number;
  readonly hp: number;
  readonly power: number;
  readonly deviation: number;
  readonly score: number;
}

const bestLine = (card: CreatureCardDefinition): Line | null => {
  const factor = BASE_RANK_BUDGET_BONUS[card.baseRank];
  const oldAttack = card.attack * factor;
  const oldHp = card.hp * factor;
  const minAttack = card.attack === 0 ? 0 : 1;
  let best: Line | null = null;
  for (let attack = minAttack; attack <= MAX_ATTACK; attack += 1) {
    for (let hp = 1; hp <= MAX_HP; hp += 1) {
      const line = { ...card, attack, hp };
      const power = creaturePower(line);
      const budget = powerBudget(card.countdown, card.baseRank);
      const deviation = ((power - budget) * 10_000) / budget;
      if (Math.abs(deviation) > 1000) {
        continue;
      }
      if (!passesPairwise(line)) {
        continue;
      }
      const score =
        2 * Math.abs(attack - oldAttack) +
        Math.abs(hp - oldHp) +
        Math.abs(deviation) / 200;
      if (best === null || score < best.score) {
        best = { attack, hp, power, deviation, score };
      }
    }
  }
  return best;
};

const creatures = CARDS.filter(
  (card): card is CreatureCardDefinition => card.kind === "creature"
);

const changes: {
  readonly card: CreatureCardDefinition;
  readonly line: Line;
}[] = [];
const noFit: CreatureCardDefinition[] = [];
for (const card of creatures) {
  if (passes(card)) {
    continue;
  }
  const line = bestLine(card);
  if (line === null) {
    noFit.push(card);
    continue;
  }
  changes.push({ card, line });
}

console.log(
  `${changes.length} of ${creatures.length} Creature Cards change; ${noFit.length} have no fit`
);
for (const { card, line } of changes) {
  console.log(
    `${card.id} (${card.baseRank}) ${card.attack}/${card.hp} -> ${line.attack}/${line.hp}  power ${creaturePower(card).toFixed(1)} -> ${line.power.toFixed(1)}  dev ${(budgetDeviation(card) / 100).toFixed(1)}% -> ${(line.deviation / 100).toFixed(1)}%`
  );
}
if (noFit.length > 0) {
  console.log("No fit:");
  for (const card of noFit) {
    console.log(`- ${card.id} (${card.baseRank}) ${card.attack}/${card.hp}`);
  }
}

console.log("\nSkill Cards that fail:");
for (const card of CARDS) {
  if (card.kind !== "skill") {
    continue;
  }
  const check = skillBudgetCheck(card);
  const pair = RANKS.filter(
    (rank) =>
      card.baseRank !== "common" &&
      isRankAtLeast(rank, card.baseRank) &&
      (referenceFor(card, rank) ?? 0) > skillPower(card, rank) + 1e-9
  );
  if (
    check.nearestStep &&
    Math.abs(check.deviation) <= SKILL_BUDGET_CAP &&
    pair.length === 0
  ) {
    continue;
  }
  console.log(
    `${card.id} (${card.baseRank}) power ${check.power.toFixed(1)} budget ${check.budget.toFixed(1)} dev ${(check.deviation / 100).toFixed(1)}% nearest ${check.nearestStep} pairwise ${pair.join(",") || "-"}`
  );
}

if (process.argv.includes("--json")) {
  // mkdtemp creates a 0700 directory with an unpredictable name.
  const dir = await mkdtemp(path.join(tmpdir(), "heynbord-card-lines-"));
  const output = path.join(dir, "card-lines.json");
  await writeFile(
    output,
    JSON.stringify(
      Object.fromEntries(
        changes.map(({ card, line }) => [
          card.id,
          { attack: line.attack, hp: line.hp },
        ])
      ),
      null,
      2
    )
  );
  console.log(`Wrote ${output}`);
}
