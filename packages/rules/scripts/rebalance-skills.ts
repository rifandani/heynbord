/**
 * Prints the Skill Card values that fit the Base Rank Power Budget (ADR-0055)
 * and the pairwise rule. It does not change `cards.ts`.
 *
 * Usage: `bun scripts/rebalance-skills.ts [--json]`.
 *
 * A Common card is fitted first: its main amount is the nearest value to its
 * new budget, within the ±25% cap. A higher Base Rank card then fits its main
 * amount to the budget and to the power of the strongest Common copy at each
 * playable Rank. A card with no main amount stays a written exception.
 */
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  powerBudget,
  SKILL_BUDGET_CAP,
  skillBudgetCheck,
  skillPower,
} from "../src/content/balance";
import { CARDS } from "../src/content/cards";
import { isRankAtLeast, RANKS, skillAmountForRank } from "../src/content/ranks";
import type {
  RankId,
  SkillAmount,
  SkillCardDefinition,
  SkillEffect,
} from "../src/content/schema";

/** The field that holds the main amount of each skill effect. */
const MAIN_FIELD: Record<SkillEffect["type"], string | null> = {
  damageUnit: "amount",
  damageArea: "amount",
  damageLane: "amount",
  damageEntangle: "amount",
  damagePush: "amount",
  damageKnockback: "amount",
  damageBleed: "amount",
  damagePoison: "poison",
  damageGround: "amount",
  damageLaneEntangle: "amount",
  damageByAttack: null,
  damageLaneBulwark: "amount",
  damageLaneHeal: "amount",
  damageUnitHero: "amount",
  damageArc: "amount",
  damageRandom: "amount",
  fieldEffect: "amount",
  damageHero: "amount",
  healUnit: "heal",
  healLane: "heal",
  cleanseUnit: "heal",
  wardUnit: "ward",
  wardLane: "ward",
  steadfastUnit: null,
  exposeUnit: "exposed",
  laneAttack: "attack",
  unitAttackRange: "attack",
  laneExtraAction: null,
  laneBulwark: "bulwark",
  lowerCountdown: "amount",
};

const mainAmountOf = (card: SkillCardDefinition): SkillAmount | null => {
  const field = MAIN_FIELD[card.effect.type];
  /* v8 ignore next -- @preserve */
  if (field === null) {
    return null;
  }
  const effect: object = card.effect;
  // SAFETY: `MAIN_FIELD` names a field of the effect of this type, and each
  // such field holds a `SkillAmount`.
  return (effect as Record<string, SkillAmount>)[field] ?? null;
};

const isTable = (value: SkillAmount): value is Exclude<SkillAmount, number> =>
  typeof value !== "number";

/** `value` scaled by `factor`, at least 1, with `base` at the Base Rank. */
const scaledTable = (
  value: SkillAmount,
  factor: number,
  baseRank: RankId,
  base: number
): SkillAmount => {
  if (!isTable(value)) {
    return base;
  }
  const table = { ...value };
  for (const rank of RANKS) {
    const old = table[rank];
    if (old === undefined) {
      continue;
    }
    table[rank] =
      rank === baseRank
        ? base
        : Math.max(1, Math.min(30, Math.round(old * factor)));
  }
  table[baseRank] = base;
  return table;
};

const withMain = (
  card: SkillCardDefinition,
  value: number
): SkillCardDefinition => {
  const field = MAIN_FIELD[card.effect.type];
  const old = mainAmountOf(card);
  /* v8 ignore next -- @preserve */
  if (field === null || old === null) {
    return card;
  }
  const oldBase = skillAmountForRank(old, card.baseRank);
  const factor = value / oldBase;
  // SAFETY: `field` is the main-amount field of this effect type, and
  // `scaledTable` returns the type that the field holds.
  return {
    ...card,
    effect: {
      ...card.effect,
      [field]: scaledTable(old, factor, card.baseRank, value),
    } as SkillEffect,
  };
};

const powerAtRank = (card: SkillCardDefinition, rank: RankId): number =>
  skillPower(card, rank);

const skills = CARDS.filter(
  (card): card is SkillCardDefinition => card.kind === "skill"
);

const references = new Map<string, number | null>();
const rebuildReferences = () => {
  references.clear();
  for (const countdown of new Set(skills.map((card) => card.countdown))) {
    for (const rank of RANKS) {
      const commons = skills.filter(
        (card) => card.countdown === countdown && card.baseRank === "common"
      );
      const power =
        commons.length === 0
          ? powerBudget(countdown, rank)
          : Math.max(...commons.map((card) => powerAtRank(card, rank)));
      references.set(`${countdown}|${rank}`, power);
    }
  }
};

const pairwiseRank = (card: SkillCardDefinition): RankId | null => {
  for (const rank of RANKS) {
    if (!isRankAtLeast(rank, card.baseRank)) {
      continue;
    }
    const reference = references.get(`${card.countdown}|${rank}`);
    if (
      reference !== null &&
      reference !== undefined &&
      powerAtRank(card, rank) < reference - 1e-9
    ) {
      return rank;
    }
  }
  return null;
};

const passesBudget = (card: SkillCardDefinition): boolean => {
  const check = skillBudgetCheck(card);
  return check.nearestStep && Math.abs(check.deviation) <= SKILL_BUDGET_CAP;
};

const fits = (card: SkillCardDefinition): boolean =>
  passesBudget(card) &&
  (card.baseRank === "common" || pairwiseRank(card) === null);

const oldValue = (card: SkillCardDefinition): number => {
  const amount = mainAmountOf(card);
  return amount === null ? 0 : skillAmountForRank(amount, card.baseRank);
};

const fitted = new Map<string, SkillCardDefinition>();
const failures: SkillCardDefinition[] = [];

const fit = (card: SkillCardDefinition): void => {
  if (MAIN_FIELD[card.effect.type] === null) {
    if (!fits(card)) {
      failures.push(card);
    }
    return;
  }
  if (fits(card)) {
    fitted.set(card.id, card);
    return;
  }
  const current = oldValue(card);
  let best: {
    readonly card: SkillCardDefinition;
    readonly score: number;
  } | null = null;
  for (let value = 1; value <= 30; value += 1) {
    const candidate = withMain(card, value);
    if (!fits(candidate)) {
      continue;
    }
    const check = skillBudgetCheck(candidate);
    const score =
      Math.abs(value - current) * 10 +
      Math.abs(check.deviation) / 1000 +
      (check.nearestStep ? 0 : 100);
    if (best === null || score < best.score) {
      best = { card: candidate, score };
    }
  }
  if (best === null) {
    failures.push(card);
    return;
  }
  fitted.set(card.id, best.card);
};

for (const rank of RANKS) {
  for (const card of skills.filter((each) => each.baseRank === rank)) {
    fit(card);
  }
  // Replace the references with the fitted Common cards before the next Rank.
  rebuildReferences();
  for (const [id, card] of fitted) {
    const index = skills.findIndex((each) => each.id === id);
    if (index !== -1) {
      skills[index] = card;
    }
  }
  rebuildReferences();
}

const allOld = CARDS.filter(
  (card): card is SkillCardDefinition => card.kind === "skill"
);
const oldById = new Map(allOld.map((card) => [card.id, card]));
console.log(
  `${allOld.length} Skill Cards: ${failures.length} stay exceptions, ${allOld.length - failures.length} pass`
);
for (const card of failures) {
  const check = skillBudgetCheck(card);
  console.log(
    `EXCEPTION ${card.id} (${card.baseRank}) dev ${(check.deviation / 100).toFixed(1)}% nearest ${check.nearestStep} pairwise ${pairwiseRank(card) ?? "-"}`
  );
}
console.log("\nNew values:");
for (const card of fitted.values()) {
  const before = oldById.get(card.id);
  if (!before) {
    continue;
  }
  const oldAmount = mainAmountOf(before);
  const newAmount = mainAmountOf(card);
  if (JSON.stringify(oldAmount) === JSON.stringify(newAmount)) {
    continue;
  }
  const check = skillBudgetCheck(card);
  console.log(
    `${card.id} (${card.baseRank}) ${JSON.stringify(oldAmount)} -> ${JSON.stringify(newAmount)}  dev ${(check.deviation / 100).toFixed(1)}%`
  );
}

if (process.argv.includes("--json")) {
  // mkdtemp creates a 0700 directory with an unpredictable name.
  const dir = await mkdtemp(path.join(tmpdir(), "heynbord-skill-lines-"));
  const output = path.join(dir, "skill-lines.json");
  await writeFile(
    output,
    JSON.stringify(
      Object.fromEntries(
        [...fitted.values()].map((card) => [card.id, mainAmountOf(card)])
      ),
      null,
      2
    )
  );
  console.log(`Wrote ${output}`);
}
