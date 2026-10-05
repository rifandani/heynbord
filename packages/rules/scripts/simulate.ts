/**
 * Headless Battle simulation (GDD 13). The AI plays both Sides.
 *
 * Usage: `bun run sim [stage | matchup] [battles] [--level N] [--gear N] [--check]`.
 * With no mode, it runs both modes. `battles` is 200 by default. With
 * `--check`, it exits with code 1 when a win rate is not on its GDD 13 target
 * (CI uses it). The seeds are fixed, so the same content gives the same result.
 *
 * - `stage`: each Stage with each starter Deck, at the Recommended level of the
 *   Stage and with no Gear (docs/game/14-campaign-stages.md).
 * - `matchup`: each Archetype against each Archetype (docs/game/08-archetypes.md).
 *   `battles` is the number of seeds: each seed plays 2 Battles, one with each
 *   Side first. `--level` (5 by default) and `--gear` (0 by default, for all 4
 *   slots) set both Heroes.
 */
import { ARCHETYPES, MATCHUP_LEVEL } from "../src/content/archetypes";
import { STARTER_DECKS } from "../src/content/decks";
import { STAGES } from "../src/content/stages";
import {
  isOnTarget,
  MATCHUP_TARGET,
  simulateMatchup,
  simulateStage,
  stageTarget,
} from "../src/simulation/simulate";
import type { WinRateTarget } from "../src/simulation/simulate";

const USAGE =
  "Usage: bun run sim [stage | matchup] [battles] [--level N] [--gear N] [--check]";

const MODES = ["stage", "matchup"] as const;
type Mode = (typeof MODES)[number];

const isMode = (value: string): value is Mode =>
  MODES.some((mode) => mode === value);

const fail = (message: string): never => {
  console.error(`${message}\n${USAGE}`);
  process.exit(1);
};

const integer = (value: string | undefined, name: string, minimum: number) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum) {
    return fail(`${name} must be an integer of ${minimum} or more: ${value}`);
  }
  return number;
};

const chosenModes = (modes: Mode[]): Mode[] =>
  modes.length > 0 ? modes : [...MODES];

const readFlag = (
  arg: string,
  rest: string[],
  parsed: { level: number; gear: number; check: boolean }
): boolean => {
  if (arg === "--level") {
    parsed.level = integer(rest.shift(), "--level", 1);
    return true;
  }
  if (arg === "--gear") {
    parsed.gear = integer(rest.shift(), "--gear", 0);
    return true;
  }
  if (arg === "--check") {
    parsed.check = true;
    return true;
  }
  return false;
};

const parseArgs = (args: readonly string[]) => {
  const modes: Mode[] = [];
  const parsed = {
    battles: 200,
    level: MATCHUP_LEVEL,
    gear: 0,
    check: false,
  };
  const rest = [...args];
  for (let arg = rest.shift(); arg !== undefined; arg = rest.shift()) {
    if (readFlag(arg, rest, parsed)) {
      continue;
    }
    if (isMode(arg)) {
      modes.push(arg);
      continue;
    }
    parsed.battles = integer(arg, "battles", 1);
  }
  return {
    modes: chosenModes(modes),
    battles: parsed.battles,
    level: parsed.level,
    gear: parsed.gear,
    check: parsed.check,
  };
};

const percent = (rate: number, digits = 0) =>
  `${(rate * 100).toFixed(digits)}%`;

const { modes, battles, level, gear, check } = parseArgs(process.argv.slice(2));

/** The win rates that are not on target. */
const misses: string[] = [];

/** Records a miss, and returns the text for the `target` column. */
const judge = (name: string, rate: number, target: WinRateTarget): string => {
  const range = `${percent(target.min)}–${percent(target.max)}`;
  if (isOnTarget(rate, target)) {
    return range;
  }
  misses.push(`${name}: ${percent(rate, 1)}, target ${range}`);
  return `${range} MISS`;
};

if (modes.includes("stage")) {
  console.log(`Stages: ${battles} Battles each, Recommended level, no Gear`);
  console.table(
    STAGES.flatMap((stage) =>
      STARTER_DECKS.map((deck) => {
        const report = simulateStage(stage, deck, battles);
        return {
          stage: report.stageId,
          level: stage.recommendedLevel,
          deck: report.deckId,
          winRate: percent(report.winRate),
          avgTurn: report.averageTurn.toFixed(1),
          avgStars: report.averageStars.toFixed(2),
          target: judge(
            `Stage ${report.stageId} with ${report.deckId}`,
            report.winRate,
            stageTarget(stage)
          ),
        };
      })
    )
  );
}

if (modes.includes("matchup")) {
  const options = {
    seeds: battles,
    level,
    gear: { weapon: gear, armor: gear, trinket: gear, banner: gear },
  };
  console.log(
    `Matchups: ${battles * 2} Battles each, level ${level}, Gear ${gear}`
  );
  console.table(
    ARCHETYPES.flatMap((archetype) =>
      ARCHETYPES.map((opponent) => {
        const report = simulateMatchup(archetype, opponent, options);
        return {
          archetype: report.archetypeId,
          opponent: report.opponentId,
          winRate: percent(report.winRate, 1),
          firstSideWinRate: percent(report.firstSideWinRate, 1),
          avgTurn: report.averageTurn.toFixed(1),
          // A mirror Matchup is always 50%: it has no target.
          target:
            archetype.id === opponent.id
              ? "mirror"
              : judge(
                  `Matchup ${report.archetypeId} against ${report.opponentId}`,
                  report.winRate,
                  MATCHUP_TARGET
                ),
        };
      })
    )
  );
}

if (check && misses.length > 0) {
  console.error(
    `${misses.length} win rates are not on their GDD 13 target:\n${misses.map((miss) => `- ${miss}`).join("\n")}`
  );
  process.exit(1);
}
