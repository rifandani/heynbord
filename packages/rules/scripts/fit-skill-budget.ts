/**
 * Fits the Skill Card rates to the swap rule (issue #50, ADR-0032). It
 * prints the rates, the Damage Type points and the Recall weight, and the
 * value of each card. It does not change `balance.ts`.
 *
 * Usage: `bun scripts/fit-skill-budget.ts [seeds] [--cache <file>]`. `seeds`
 * is 1000 by default, as in `bun run sim skill-swap 1000`. With `--cache`, the
 * script reads the sim results from the file when it exists, and else writes
 * them to it. A content change makes the file old: delete it.
 *
 * 1. Calibration. In each swap Deck, one Creature Card gets −4 HP and +4 HP.
 *    The change of the win rate for each Power Point is the calibration of
 *    that Deck against each opponent. The script changes the card only in
 *    memory, and it puts the old HP back. The card is not in Vanguard or
 *    Raiders, so the opponent does not change.
 * 2. Swap. `simulateSkillSwap` for each Skill Card.
 * 3. Value. The value of a Skill Card is the Power Budget of its Countdown,
 *    plus the deviation of the removed Creature Card from its budget, plus the
 *    swap delta in Power Points (the mean of the two opponents). Thus a delta
 *    of 0 against a Creature Card at its budget is a card at its budget.
 * 4. Fit. Least squares of `skillPower` against the value, for each Recall
 *    weight from 0 to 3. A rate is never below 0. The flat points of the
 *    extra parts do not change.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { Schema } from "effect";

import { ARCHETYPES, MATCHUP_LEVEL } from "../src/content/archetypes";
import {
  creaturePower,
  powerBudget,
  RECALL_WEIGHT,
  SKILL_DAMAGE_TYPE_POINTS,
  SKILL_RATES,
  skillBudgetCheck,
  skillPowerTerms,
} from "../src/content/balance";
import type { SkillRate } from "../src/content/balance";
import { CARDS, getCard } from "../src/content/cards";
import { recallChance } from "../src/content/ranks";
import type {
  Archetype,
  DamageType,
  SkillCardDefinition,
} from "../src/content/schema";
import { NO_GEAR, simulateMatchup } from "../src/simulation/simulate";
import type { MatchupReport } from "../src/simulation/simulate";
import { simulateSkillSwap } from "../src/simulation/skill-swap";

const OPPONENTS = ["vanguard", "raiders"] as const;

/** The calibration card of each swap Deck. */
const CALIBRATION: readonly (readonly [string, string])[] = [
  ["vanguardFull", "human.bridgePikeman"],
  ["raidersFull", "orc.tuskBrute"],
  ["thornwatch", "elf.rootboundGuard"],
  ["wildHunt", "feral.caveBear"],
];

const HP_STEP = 4;

const archetypeOf = (id: string): Archetype => {
  const archetype = ARCHETYPES.find((each) => each.id === id);
  if (!archetype) {
    throw new Error(`Unknown Archetype: ${id}`);
  }
  return archetype;
};

const USAGE = "Usage: bun scripts/fit-skill-budget.ts [seeds] [--cache <file>]";

const parseArgs = (args: readonly string[]) => {
  const rest = [...args];
  let seeds = 1000;
  let cache: string | undefined;
  for (let arg = rest.shift(); arg !== undefined; arg = rest.shift()) {
    if (arg === "--cache") {
      cache = rest.shift();
    } else {
      seeds = Number(arg);
    }
  }
  if (
    !Number.isInteger(seeds) ||
    seeds < 1 ||
    (args.includes("--cache") && !cache)
  ) {
    console.error(USAGE);
    process.exit(1);
  }
  return { seeds, cache };
};

const { seeds, cache: cacheFile } = parseArgs(process.argv.slice(2));
const options = { seeds, level: MATCHUP_LEVEL, gear: NO_GEAR };

/** The sim results that the fit uses. The cache file has this shape. */
const SimResults = Schema.Struct({
  seeds: Schema.Number,
  /** Win-rate change for each Power Point, for each Deck and opponent. */
  calibration: Schema.Record(Schema.String, Schema.Array(Schema.Number)),
  swaps: Schema.Record(
    Schema.String,
    Schema.Struct({
      deckId: Schema.String,
      creatureId: Schema.String,
      creatureDeviation: Schema.Number,
      /** The win-rate change against each opponent, from 0 to 1. */
      changes: Schema.Array(Schema.Number),
    })
  ),
});
type SimResults = typeof SimResults.Type;

/** Win-rate change for each Power Point, for each Deck and opponent. */
const calibrate = (deckId: string, cardId: string) => {
  const card = getCard(cardId);
  if (card.kind !== "creature") {
    throw new Error(`${cardId} is not a Creature Card`);
  }
  for (const opponentId of OPPONENTS) {
    if (archetypeOf(opponentId).deck.some((entry) => entry.cardId === cardId)) {
      throw new Error(`${opponentId} has ${cardId}`);
    }
  }
  const { hp } = card;
  const at = (change: number) => {
    Object.assign(card, { hp: hp + change });
    const power = creaturePower(card);
    const rates = OPPONENTS.map(
      (opponentId) =>
        simulateMatchup(archetypeOf(deckId), archetypeOf(opponentId), options)
          .winRate
    );
    Object.assign(card, { hp });
    return { power, rates };
  };
  const low = at(-HP_STEP);
  const high = at(HP_STEP);
  return OPPONENTS.map(
    (_, index) =>
      ((high.rates[index] ?? 0) - (low.rates[index] ?? 0)) /
      (high.power - low.power)
  );
};

const skills = CARDS.filter(
  (card): card is SkillCardDefinition => card.kind === "skill"
);

const simulate = (): SimResults => {
  const calibration = Object.fromEntries(
    CALIBRATION.map(([deckId, cardId]) => [deckId, calibrate(deckId, cardId)])
  );
  const cache = new Map<string, MatchupReport>();
  const swaps = Object.fromEntries(
    skills.map((skill) => {
      const report = simulateSkillSwap(skill, options, cache);
      return [
        skill.id,
        {
          deckId: report.deckId,
          creatureId: report.creatureId,
          creatureDeviation: report.creatureDeviation,
          changes: report.results.map((result) => result.after - result.before),
        },
      ];
    })
  );
  return { seeds, calibration, swaps };
};

const readCache = (file: string): SimResults | null =>
  existsSync(file)
    ? Schema.decodeUnknownSync(SimResults)(
        JSON.parse(readFileSync(file, "utf-8"))
      )
    : null;

const cached = cacheFile === undefined ? null : readCache(cacheFile);
const results = cached ?? simulate();
if (cacheFile !== undefined && cached === null) {
  writeFileSync(cacheFile, JSON.stringify(results, null, 2));
}

console.log(
  `Calibration: win-rate points for each Power Point (${results.seeds} seeds${cached ? ", from the cache" : ""})`
);
console.table(
  CALIBRATION.map(([deckId, cardId]) => ({
    deck: deckId,
    card: cardId,
    ...Object.fromEntries(
      OPPONENTS.map((opponentId, index) => [
        opponentId,
        ((results.calibration[deckId]?.[index] ?? 0) * 100).toFixed(2),
      ])
    ),
  }))
);

const values = skills.map((skill) => {
  const swap = results.swaps[skill.id];
  if (!swap) {
    throw new Error(`The cache has no swap for ${skill.id}: delete it`);
  }
  const slopes = results.calibration[swap.deckId] ?? [];
  const deltas = swap.changes.map(
    (change, index) => change / (slopes[index] ?? 1)
  );
  const delta = deltas.reduce((sum, each) => sum + each, 0) / deltas.length;
  return {
    skill,
    swap,
    value: powerBudget(skill.countdown) + swap.creatureDeviation + delta,
  };
});

const RATE_KEYS = Object.keys(SKILL_RATES).filter(
  (key): key is SkillRate => key in SKILL_RATES
);
const TYPE_KEYS: readonly DamageType[] = ["fire", "frost", "holy", "lightning"];
const columns = RATE_KEYS.length + TYPE_KEYS.length;

/** The row of the design matrix and the flat points of a card. */
const rowOf = (skill: SkillCardDefinition) => {
  const terms = skillPowerTerms(skill.effect, skill.baseRank);
  const row = Array.from({ length: columns }, () => 0);
  for (const [rate, amount] of terms.rates) {
    row[RATE_KEYS.indexOf(rate)] = (row[RATE_KEYS.indexOf(rate)] ?? 0) + amount;
  }
  if (terms.damageType !== null && terms.damageType !== "physical") {
    row[RATE_KEYS.length + TYPE_KEYS.indexOf(terms.damageType)] = 1;
  }
  return { row, flat: terms.flat };
};

/** Solves `a × x = b` with Gaussian elimination and a small ridge. */
const solve = (a: number[][], b: number[]): number[] => {
  const size = b.length;
  const m = a.map((row, index) => [...row, b[index] ?? 0]);
  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(m[row]?.[col] ?? 0) > Math.abs(m[pivot]?.[col] ?? 0)) {
        pivot = row;
      }
    }
    [m[col], m[pivot]] = [m[pivot] ?? [], m[col] ?? []];
    const lead = m[col]?.[col] ?? 0;
    for (let row = 0; row < size; row += 1) {
      const factor = (m[row]?.[col] ?? 0) / lead;
      if (row !== col && factor !== 0) {
        m[row] = (m[row] ?? []).map(
          (value, at) => value - factor * (m[col]?.[at] ?? 0)
        );
      }
    }
  }
  return m.map((row, index) => (row[size] ?? 0) / (row[index] ?? 1));
};

const RIDGE = 1e-6;

/** The rows of the fit for one Recall weight. */
const rowsFor = (weight: number) =>
  values.map(({ skill, value }) => {
    const multiplier = 1 + (weight * recallChance(skill.baseRank)) / 10_000;
    const { row, flat } = rowOf(skill);
    return { row, multiplier, flat, value };
  });

type FitRow = ReturnType<typeof rowsFor>[number];

const powerOf = (row: FitRow, beta: readonly number[]) =>
  row.multiplier *
  (row.row.reduce((sum, x, index) => sum + x * (beta[index] ?? 0), 0) +
    row.flat);

/**
 * Least squares of `power` against `value` with the columns in `free`. The
 * other columns are 0.
 */
const leastSquares = (rows: readonly FitRow[], free: readonly number[]) => {
  const normal = free.map((i) =>
    free.map(
      (j) =>
        rows.reduce(
          (sum, { row, multiplier }) =>
            sum + (row[i] ?? 0) * (row[j] ?? 0) * multiplier ** 2,
          0
        ) + (i === j ? RIDGE : 0)
    )
  );
  const right = free.map((i) =>
    rows.reduce(
      (sum, { row, multiplier, flat, value }) =>
        sum + (row[i] ?? 0) * (value / multiplier - flat) * multiplier ** 2,
      0
    )
  );
  const solved = solve(normal, right);
  const beta = Array.from({ length: columns }, () => 0);
  for (const [index, column] of free.entries()) {
    beta[column] = solved[index] ?? 0;
  }
  return beta;
};

/** The fit with the columns in `free`. A column below 0 leaves `free`, and the fit runs again. */
const fitFree = (
  rows: readonly FitRow[],
  free: readonly number[]
): number[] => {
  const beta = leastSquares(rows, free);
  const positive = free.filter((column) => (beta[column] ?? 0) >= 0);
  return positive.length === free.length ? beta : fitFree(rows, positive);
};

/** The fit for one Recall weight. */
const fitFor = (weight: number) => {
  const rows = rowsFor(weight);
  const beta = fitFree(
    rows,
    Array.from({ length: columns }, (_, index) => index)
  );
  const error = rows.reduce(
    (sum, row) => sum + (powerOf(row, beta) - row.value) ** 2,
    0
  );
  return { weight, beta, error, rows };
};

const weights = Array.from({ length: 31 }, (_, index) => index / 10);
const fits = weights.map(fitFor);
const best = fits.reduce((a, b) => (b.error < a.error ? b : a));

console.log("RMS error of the fit for each Recall weight");
console.table(
  fits.flatMap((fit, index) =>
    index % 5 === 0
      ? [
          {
            weight: fit.weight,
            rms: Math.sqrt(fit.error / values.length).toFixed(2),
          },
        ]
      : []
  )
);

console.log(
  `Fit: Recall weight ${best.weight} (now ${RECALL_WEIGHT}), RMS error ${Math.sqrt(best.error / values.length).toFixed(2)} Power Points`
);
console.table([
  ...RATE_KEYS.map((key, index) => ({
    rate: key,
    now: SKILL_RATES[key],
    fit: (best.beta[index] ?? 0).toFixed(2),
  })),
  ...TYPE_KEYS.map((key, index) => ({
    rate: `damageType.${key}`,
    now: SKILL_DAMAGE_TYPE_POINTS[key],
    fit: (best.beta[RATE_KEYS.length + index] ?? 0).toFixed(2),
  })),
]);

const signed = (value: number, digits = 1) =>
  `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;

console.log(
  "Each Skill Card: value in the sim, power with the fit, and power with the current rates"
);
console.table(
  values.map(({ skill, swap, value }, index) => {
    const check = skillBudgetCheck(skill);
    const row = best.rows[index];
    return {
      skill: skill.id,
      budget: powerBudget(skill.countdown),
      creature: `${swap.creatureId} (${signed(swap.creatureDeviation, 0)})`,
      change: swap.changes.map((change) => signed(change * 100)).join(" / "),
      value: value.toFixed(1),
      fit: row ? powerOf(row, best.beta).toFixed(1) : "—",
      power: check.power.toFixed(1),
      deviation: `${signed(check.deviation / 100)}%`,
      nearestStep: check.nearestStep ? "yes" : "NO",
    };
  })
);
