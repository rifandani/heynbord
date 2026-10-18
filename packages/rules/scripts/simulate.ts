/**
 * Headless Battle simulation (GDD 13). The AI plays both Sides.
 *
 * Usage: `bun run sim [stage | dungeon | floor | matchup | packs | economy | skill-swap] [battles] [--level N] [--gear N] [--packs N] [--check]`.
 * With no mode, it runs `stage`, `dungeon`, `floor`, `matchup` and `packs`, and
 * with `--check` also `economy`. `battles` is 200 by default. With `--check`,
 * it exits with code 1 when a win rate is not on its GDD 13 target or a Pacing
 * target is not on its Economy 4 target (CI uses it). The seeds are fixed, so
 * the same content gives the same result.
 *
 * - `stage`: each Stage with each starter Deck, at the Recommended level of the
 *   Stage and with no Gear (docs/game/14-campaign-stages.md). A Stage with
 *   Expected Gear (ADR-0034) also plays a second row at that Gear. The
 *   Expected Gear comes from the First-try runs of `economy`. `--level N`
 *   plays N levels above the Recommended level, and `--gear N` sets all 4 Gear
 *   slots to N. They measure the win-chance bonuses of `economy` (Economy
 *   7.1), so with them there are no Expected Gear rows.
 *   The first row of each Gear row also shows the 3-Star share of the wins
 *   of all starter Decks with the Star Turn of the Stage, its GDD 13 target,
 *   and the suggested Star Turn (ADR-0047). `--check` fails a share that is
 *   not on target, but not with `--level` or `--gear`.
 * - `dungeon`: each Dungeon with each starter Deck, at the unlock level of the
 *   Dungeon (GDD 13, step 6). The Deck is typical at that level: the starter
 *   Deck and the first-win cards of all Stages below that level. A second row
 *   plays the Expected Gear at that level (ADR-0034). `--level` and `--gear`
 *   work as in `stage`.
 *   `defeated` is the average number of Bosses that the Player Defeated.
 * - `floor`: each Heynspire Floor with each starter Deck, at the Recommended
 *   level of the Floor and with no Gear, then at the Expected Gear of the
 *   Floor (ADR-0034, ADR-0042). The Deck is the expected Deck after all
 *   Stages. A Boss Floor has the target of a Boss Stage. `--level` and
 *   `--gear` work as in `stage`.
 * - `matchup`: each Archetype against each Archetype (docs/game/08-archetypes.md).
 *   `battles` is the number of seeds: each seed plays 2 Battles, one with each
 *   Side first. `--level` (5 by default) and `--gear` (0 by default, for all 4
 *   slots) set both Heroes. Only a pair of two main Archetypes can fail. A pair
 *   with a diagnostic Deck shows "review" when it is not on target.
 *   `noReadyTurns` is the average number of the Archetype's Turns with no Ready
 *   card in the Hand (the Sabotage lock risk, Archetypes 2.2).
 * - `packs`: each Pack, with all cards (Warrior), as a Human Race Pack and as
 *   a Class Pack of each Class with Skill Cards (Economy 3.1, ADR-0027).
 *   `--packs` (10,000 by default) is the number of single Packs for the Rank
 *   rates and the value for each Coin. 100 Players open Packs until they
 *   Discover all cards of each Base Rank. `--check` does not check the Packs.
 * - `economy`: simulated Players of each Play Style from a new Profile to
 *   Player level 30 and the Floor 50 win, with a win chance and a 3-Star
 *   chance for each Battle.
 *   The Players repeat each Stage for 3 Stars and use their Sweep Tickets
 *   (Economy 7.1, ADR-0046). `battles` is the number of seeds for each Play
 *   Style. A play calendar of 1 hour each day sends the ship of the Seaport
 *   between the sessions. It reports the Economy 4 checkpoints, the Stars,
 *   repeat Battles and Sweeps, the Seaport income, and the Heynstone ledger. The Player level targets are on the
 *   First-try run only. `--check` judges each Pacing target that applies to
 *   the Play Style: the median of the Players, the level of the First-try run,
 *   or a share of the Players. A miss of a gated target fails the check. A
 *   miss of a draft target (`draftFor`) shows "review".
 * - `skill-swap`: the swap rule for each Skill Card (Archetypes 3.3). In a
 *   Deck of its Class, 1 more copy of the Skill Card replaces 1 Creature Card
 *   with the same Countdown. The Deck plays Vanguard and Raiders before and
 *   after the swap, with `battles` seeds and the `--level` and `--gear` of
 *   `matchup`. A card passes when each win rate changes by 5 points or less.
 *   `reverse` is the win rate with the Skill Card copy of the Deck replaced by
 *   the Creature Card. `lock` is the share of Battles in which an opponent
 *   Unit skipped 3 or more actions in a row (ADR-0025), before → after.
 *   `points` is the Power Points of the Skill Card against its Power Budget
 *   (ADR-0032), and the `creature` column gives the Power Points of the
 *   Creature Card minus its budget. Like `economy`, it runs only on request,
 *   and `--check` does not check it.
 */
import { ARCHETYPES, MATCHUP_LEVEL } from "../src/content/archetypes";
import { skillBudgetCheck } from "../src/content/balance";
import { CARDS, getCard } from "../src/content/cards";
import { STARTER_DECKS } from "../src/content/decks";
import { DUNGEONS } from "../src/content/dungeons";
import { FLOORS } from "../src/content/floors";
import { FORGE_STONE_TIERS } from "../src/content/forge-stones";
import { PACK_SIZE, PACKS } from "../src/content/packs";
import { RANKS } from "../src/content/ranks";
import { ClassId } from "../src/content/schema";
import type { GearLevels, StageDefinition } from "../src/content/schema";
import { STAGES } from "../src/content/stages";
import { packPool } from "../src/packs/open-pack";
import type { PackPool } from "../src/packs/open-pack";
import {
  CHECKPOINTS,
  expectedFloorGear,
  expectedGear,
  expectedGearAtLevel,
  heynstoneLedger,
  HOURS_AWAY,
  INCOME_KINDS,
  judgePacing,
  MAX_BATTLES,
  MAX_REPEAT_BATTLES,
  METRICS,
  pacingTarget,
  PLAY_MINUTES_PER_DAY,
  PLAY_STYLES,
  REPEAT_METRICS,
  simulateEconomy,
} from "../src/simulation/economy";
import type {
  CheckpointId,
  CheckpointSnapshot,
  Metric,
  PacingTargetId,
  PacingVerdict,
  PlayStyle,
  RangeTarget,
  Spread,
} from "../src/simulation/economy";
import { simulatePack } from "../src/simulation/packs";
import {
  DUNGEON_TARGET,
  floorTarget,
  gatesRelease,
  isOnTarget,
  MATCHUP_TARGET,
  NO_GEAR,
  simulateDungeon,
  simulateFloor,
  simulateMatchup,
  simulateStage,
  stageTarget,
  starTarget,
  suggestStarTurn,
  threeStarShare,
} from "../src/simulation/simulate";
import type {
  MatchupReport,
  StageReport,
  StarTarget,
  WinRateTarget,
} from "../src/simulation/simulate";
import { SWAP_LIMIT, simulateSkillSwap } from "../src/simulation/skill-swap";

const USAGE =
  "Usage: bun run sim [stage | dungeon | floor | matchup | packs | economy | skill-swap] [battles] [--level N] [--gear N] [--packs N] [--check]";

const MODES = [
  "stage",
  "dungeon",
  "floor",
  "matchup",
  "packs",
  "economy",
  "skill-swap",
] as const;
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

/**
 * The economy sim and the swap report are slow, so they run only on request.
 * With no mode, `--check` also runs the economy sim to check the Economy 4
 * targets. The swap report has no `--check`.
 */
const chosenModes = (modes: Mode[], check: boolean): Mode[] =>
  modes.length > 0
    ? modes
    : MODES.filter(
        (mode) => mode !== "skill-swap" && (check || mode !== "economy")
      );

/** The flags of the command line. `level` and `gear` are `undefined` when they are not given. */
interface Flags {
  battles: number;
  level: number | undefined;
  gear: number | undefined;
  packs: number;
  check: boolean;
}

const readFlag = (arg: string, rest: string[], parsed: Flags): boolean => {
  if (arg === "--level") {
    parsed.level = integer(rest.shift(), "--level", 0);
    return true;
  }
  if (arg === "--gear") {
    parsed.gear = integer(rest.shift(), "--gear", 0);
    return true;
  }
  if (arg === "--packs") {
    parsed.packs = integer(rest.shift(), "--packs", 1);
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
  const parsed: Flags = {
    battles: 200,
    level: undefined,
    gear: undefined,
    packs: 10_000,
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
    modes: chosenModes(modes, parsed.check),
    battles: parsed.battles,
    level: parsed.level,
    gear: parsed.gear,
    packs: parsed.packs,
    check: parsed.check,
  };
};

const percent = (rate: number, digits = 0) =>
  `${(rate * 100).toFixed(digits)}%`;

const { modes, battles, level, gear, packs, check } = parseArgs(
  process.argv.slice(2)
);

/** The win rates, 3-Star shares and Pacing targets that are not on target. */
const misses: string[] = [];

/**
 * Returns the text for the `target` column. A miss of a gated target fails the
 * check. A miss of a target that does not gate release is for review.
 */
const judge = (
  name: string,
  rate: number,
  target: WinRateTarget,
  gated = true
): string => {
  const range = `${percent(target.min)}–${percent(target.max)}`;
  if (isOnTarget(rate, target)) {
    return range;
  }
  if (!gated) {
    return `${range} review`;
  }
  misses.push(`${name}: ${percent(rate, 1)}, target ${range}`);
  return `${range} MISS`;
};

const gearOf = (gearLevel = 0): GearLevels => ({
  weapon: gearLevel,
  armor: gearLevel,
  trinket: gearLevel,
  banner: gearLevel,
});

/** Gear as weapon / armor / trinket / banner: "2/1/1/1". */
const gearText = (levels: GearLevels) =>
  `${levels.weapon}/${levels.armor}/${levels.trinket}/${levels.banner}`;

const hasGear = (levels: GearLevels) => gearText(levels) !== gearText(NO_GEAR);

/** The wins of the reports of one Gear row, as one report. */
const pooledWins = (reports: readonly StageReport[]) => ({
  wins: reports.reduce((sum, report) => sum + report.wins, 0),
  highHpWinTurns: reports.flatMap((report) => report.highHpWinTurns),
});

/**
 * The 3-Star cells of a Gear row (ADR-0047): the 3-Star share with the Star
 * Turn of the Stage, its target, and the suggested Star Turn. When `gated`,
 * a share that is not on target fails the check, as a win rate does.
 */
const starCells = (
  stage: StageDefinition,
  rowName: string,
  wins: Pick<StageReport, "wins" | "highHpWinTurns">,
  target: StarTarget,
  suggested: number | null,
  gated: boolean
) => {
  const share = threeStarShare(wins, stage.starTurn);
  const range =
    target.max >= 1
      ? `≥ ${percent(target.min)}`
      : `${percent(target.min)}–${percent(target.max)}`;
  const onTarget = isOnTarget(share, target);
  if (!onTarget && gated) {
    misses.push(
      `Stage ${stage.id}, ${rowName}: 3 Stars ${percent(share, 1)} of the wins at Star Turn ${stage.starTurn}, target ${range}`
    );
  }
  return {
    starTurn: stage.starTurn,
    threeStars: percent(share),
    starTarget: `${range}${onTarget ? "" : gated ? " MISS" : " review"}`,
    // A target with only a lower limit has no suggestion.
    suggested:
      suggested === null || suggested === stage.starTurn
        ? `${suggested ?? "—"}`
        : `${suggested} (${percent(threeStarShare(wins, suggested))})`,
  };
};

/** The 3-Star cells of the other Decks of a Gear row: empty. */
const NO_STAR_CELLS = {
  starTurn: "",
  threeStars: "",
  starTarget: "",
  suggested: "",
} as const;

if (modes.includes("stage")) {
  const levelsAbove = level ?? 0;
  // `--level` and `--gear` measure a bonus, so they play only one Gear row.
  const expected =
    level === undefined && gear === undefined ? expectedGear() : null;
  console.log(
    `Stages: ${battles} Battles each, Recommended level + ${levelsAbove}, Gear ${gear ?? 0}${expected === null ? "" : ", then the Expected Gear (ADR-0034)"}`
  );
  console.table(
    STAGES.flatMap((stage) => {
      const stageGear = expected?.get(stage.id) ?? NO_GEAR;
      const rows: { gear: GearLevels; expected: boolean }[] = [
        { gear: gearOf(gear), expected: false },
        ...(hasGear(stageGear) ? [{ gear: stageGear, expected: true }] : []),
      ];
      const played = rows.map((row) => {
        const reports = STARTER_DECKS.map((deck) =>
          simulateStage(stage, deck, battles, { levelsAbove, gear: row.gear })
        );
        return {
          ...row,
          name: `Gear ${gearText(row.gear)}${row.expected ? " (Expected Gear)" : ""}`,
          reports,
          // The 3-Star share of a row counts the wins of all starter Decks.
          wins: pooledWins(reports),
        };
      });
      const target = starTarget(stage);
      const suggested = suggestStarTurn(
        played.map((row) => row.wins),
        target
      );
      return played.flatMap((row) => {
        const stars = starCells(
          stage,
          row.name,
          row.wins,
          target,
          suggested,
          // `--level` and `--gear` are not the setup of the 3-Star target.
          expected !== null
        );
        return row.reports.map((report, deckIndex) => ({
          stage: report.stageId,
          level: stage.recommendedLevel + levelsAbove,
          gear: `${gearText(row.gear)}${row.expected ? " expected" : ""}`,
          deck: report.deckId,
          winRate: percent(report.winRate),
          avgTurn: report.averageTurn.toFixed(1),
          avgStars: report.averageStars.toFixed(2),
          target: judge(
            `Stage ${report.stageId} with ${report.deckId}, ${row.name}`,
            report.winRate,
            stageTarget(stage)
          ),
          // The 3-Star cells are for the row, so they show on its first Deck.
          ...(deckIndex === 0 ? stars : NO_STAR_CELLS),
        }));
      });
    })
  );
}

if (modes.includes("dungeon")) {
  const levelsAbove = level ?? 0;
  // `--level` and `--gear` measure a bonus, so they play only one Gear row.
  const expected = level === undefined && gear === undefined;
  console.log(
    `Dungeons: ${battles} Battles each, unlock level + ${levelsAbove}, Gear ${gear ?? 0}${expected ? ", then the Expected Gear at the unlock level (ADR-0034)" : ""}`
  );
  console.table(
    DUNGEONS.flatMap((dungeon) => {
      const dungeonGear = expected
        ? expectedGearAtLevel(dungeon.unlockLevel)
        : NO_GEAR;
      const rows: { gear: GearLevels; expected: boolean }[] = [
        { gear: gearOf(gear), expected: false },
        ...(hasGear(dungeonGear)
          ? [{ gear: dungeonGear, expected: true }]
          : []),
      ];
      return rows.flatMap((row) =>
        STARTER_DECKS.map((deck) => {
          const report = simulateDungeon(dungeon, deck, battles, {
            levelsAbove,
            gear: row.gear,
          });
          return {
            dungeon: report.dungeonId,
            level: dungeon.unlockLevel + levelsAbove,
            gear: `${gearText(row.gear)}${row.expected ? " expected" : ""}`,
            deck: report.deckId,
            winRate: percent(report.winRate),
            avgTurn: report.averageTurn.toFixed(1),
            defeated: report.averageDefeated.toFixed(2),
            target: judge(
              `Dungeon ${report.dungeonId} with ${report.deckId}, Gear ${gearText(row.gear)}${row.expected ? " (Expected Gear)" : ""}`,
              report.winRate,
              DUNGEON_TARGET
            ),
          };
        })
      );
    })
  );
}

if (modes.includes("floor")) {
  const levelsAbove = level ?? 0;
  // `--level` and `--gear` measure a bonus, so they play only one Gear row.
  const expected =
    level === undefined && gear === undefined ? expectedFloorGear() : null;
  console.log(
    `Floors: ${battles} Battles each, Recommended level + ${levelsAbove}, Gear ${gear ?? 0}${expected === null ? "" : ", then the Expected Gear (ADR-0034)"}`
  );
  console.table(
    FLOORS.flatMap((floor) => {
      const floorGear = expected?.[floor.number - 1] ?? NO_GEAR;
      const rows: { gear: GearLevels; expected: boolean }[] = [
        { gear: gearOf(gear), expected: false },
        ...(hasGear(floorGear) ? [{ gear: floorGear, expected: true }] : []),
      ];
      return rows.flatMap((row) =>
        STARTER_DECKS.map((deck) => {
          const report = simulateFloor(floor, deck, battles, {
            levelsAbove,
            gear: row.gear,
          });
          return {
            floor: report.floorId,
            enemy: floor.enemy.id,
            level: floor.recommendedLevel + levelsAbove,
            gear: `${gearText(row.gear)}${row.expected ? " expected" : ""}`,
            deck: report.deckId,
            winRate: percent(report.winRate),
            avgTurn: report.averageTurn.toFixed(1),
            target: judge(
              `Floor ${report.floorId} with ${report.deckId}, Gear ${gearText(row.gear)}${row.expected ? " (Expected Gear)" : ""}`,
              report.winRate,
              floorTarget(floor)
            ),
          };
        })
      );
    })
  );
}

if (modes.includes("matchup")) {
  const matchupLevel = level ?? MATCHUP_LEVEL;
  if (matchupLevel < 1) {
    fail(`--level must be an integer of 1 or more: ${matchupLevel}`);
  }
  const options = { seeds: battles, level: matchupLevel, gear: gearOf(gear) };
  console.log(
    `Matchups: ${battles * 2} Battles each, level ${matchupLevel}, Gear ${gear ?? 0}`
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
          noReadyTurns: report.noReadyTurns.toFixed(1),
          // A mirror Matchup is always 50%: it has no target.
          target:
            archetype.id === opponent.id
              ? "mirror"
              : judge(
                  `Matchup ${report.archetypeId} against ${report.opponentId}`,
                  report.winRate,
                  MATCHUP_TARGET,
                  gatesRelease(archetype, opponent)
                ),
        };
      })
    )
  );
}

const poolName = (pool: PackPool) => {
  switch (pool.kind) {
    case "all": {
      return "all (warrior)";
    }
    case "race": {
      return `race: ${pool.race}`;
    }
    case "class": {
      return `class: ${pool.classId}`;
    }
    default: {
      return pool satisfies never;
    }
  }
};

if (modes.includes("packs")) {
  // A Class with no Skill Cards cannot be a Class Pack.
  const classPools: readonly PackPool[] = ClassId.literals.flatMap((classId) =>
    CARDS.some((card) => card.kind === "skill" && card.class === classId)
      ? [{ kind: "class", classId }]
      : []
  );
  const pools: readonly PackPool[] = [
    { kind: "all" },
    { kind: "race", race: "human" },
    ...classPools,
  ];
  const reports = PACKS.flatMap((pack) =>
    pools.map((pool) =>
      simulatePack(pack.id, { packs, players: 100, pool, classId: "warrior" })
    )
  );
  console.log(`Packs: ${packs} single Packs each`);
  console.table(
    reports.map((report) => ({
      pack: report.packId,
      pool: poolName(report.pool),
      ...Object.fromEntries(
        RANKS.map((rank) => [rank, percent(report.rankRates[rank], 2)])
      ),
      guarantee: percent(report.guaranteeRate, 2),
      valuePerPack: report.valuePerPack.toFixed(2),
      valuePer100Coin: report.valuePer100Coin.toFixed(2),
      tenPackValuePer100Coin: report.tenPackValuePer100Coin.toFixed(2),
    }))
  );
  console.log(
    "Packs to Discover all cards of each Base Rank: mean of 100 Players"
  );
  console.table(
    reports.map((report) => ({
      pack: report.packId,
      pool: poolName(report.pool),
      ...Object.fromEntries(
        RANKS.map((rank) => [
          rank,
          report.packsToDiscover[rank]?.toFixed(1) ?? "—",
        ])
      ),
      all: report.packsToDiscoverAll.toFixed(1),
    }))
  );
  console.log("Legendary Skill Card copies in 100 Royal Class Packs: mean");
  console.table(
    reports.flatMap((report) => {
      if (report.packId !== "royal" || report.pool.kind !== "class") {
        return [];
      }
      const copies = report.rankRates.legendary * PACK_SIZE * 100;
      return [
        {
          pool: poolName(report.pool),
          skillCards: packPool(report.pool, "warrior").length,
          legendaryCopies: copies.toFixed(1),
          legendaryCopiesPerCard: (
            copies / packPool(report.pool, "warrior").length
          ).toFixed(1),
        },
      ];
    })
  );
}

const range = (target: RangeTarget, format: (value: number) => string) => {
  if (target.min !== null && target.max !== null) {
    return target.min === target.max
      ? format(target.min)
      : `${format(target.min)}–${format(target.max)}`;
  }
  return target.min === null
    ? `≤ ${format(target.max ?? 0)}`
    : `≥ ${format(target.min)}`;
};

const METRIC_FORMAT: Readonly<Record<Metric, (value: number) => string>> = {
  battles: (value) => value.toFixed(0),
  hours: (value) => value.toFixed(1),
  level: (value) => value.toFixed(0),
  packsOpened: (value) => value.toFixed(0),
  discoveredShare: (value) => percent(value),
  epicCopies: (value) => value.toFixed(0),
  legendaryCopies: (value) => value.toFixed(0),
  meanGear: (value) => value.toFixed(1),
  lowestGear: (value) => value.toFixed(0),
  coin: (value) => value.toFixed(0),
};

/** The format of the value of each Pacing target. A share has 1 decimal. */
const PACING_FORMAT: Readonly<
  Record<PacingTargetId, (value: number) => string>
> = {
  hours: METRIC_FORMAT.hours,
  level: METRIC_FORMAT.level,
  packsOpened: METRIC_FORMAT.packsOpened,
  firstCombine: (value) => percent(value, 1),
  epicCopies: METRIC_FORMAT.epicCopies,
  discoveredShare: (value) => percent(value, 1),
  legendaryCopies: METRIC_FORMAT.legendaryCopies,
  lowestGear: METRIC_FORMAT.lowestGear,
  level30BeforeFloor50: (value) => percent(value, 1),
};

/**
 * The line of a Pacing target miss: the checkpoint, the target, the Play
 * Style, the value and the target.
 */
const pacingMiss = (verdict: PacingVerdict) => {
  const format = PACING_FORMAT[verdict.target];
  const run = verdict.target === "level" ? " (First-try run)" : "";
  const value = verdict.value === null ? "not reached" : format(verdict.value);
  return `Economy ${verdict.checkpoint}, ${verdict.target}${run}, ${verdict.playStyle}: ${value}, target ${range(verdict.range, format)}`;
};

/**
 * The Economy 4 target of a metric at a checkpoint for a Play Style, or ""
 * when it has none.
 */
const metricTarget = (
  id: CheckpointId,
  playStyle: PlayStyle,
  metric: Metric
): string => {
  const target = pacingTarget(id, playStyle);
  const format = METRIC_FORMAT[metric];
  switch (metric) {
    case "level": {
      return target.level === undefined ? "" : format(target.level);
    }
    case "hours":
    case "packsOpened":
    case "discoveredShare":
    case "epicCopies":
    case "legendaryCopies":
    case "lowestGear": {
      const value = target[metric];
      return value === undefined ? "" : range(value, format);
    }
    default: {
      return "";
    }
  }
};

/** A spread as "median (10th–90th percentile)". */
const spreadWith = (format: (value: number) => string, spread: Spread) =>
  `${format(spread.median)} (${format(spread.p10)}–${format(spread.p90)})`;

const spreadText = (metric: Metric, spread: Spread) =>
  spreadWith(METRIC_FORMAT[metric], spread);

/** " MISS" or " review" after a target that is not on target, else "". */
const missMark = (verdict: PacingVerdict | undefined) => {
  if (verdict === undefined || verdict.onTarget) {
    return "";
  }
  return verdict.gated ? " MISS" : " review";
};

/** A cell with the value and its target: "6 (6–7) → 6". */
const withTarget = (
  id: CheckpointId,
  playStyle: PlayStyle,
  metric: Metric,
  value: string,
  verdict?: PacingVerdict
) => {
  const target = metricTarget(id, playStyle, metric);
  return target === "" ? value : `${value} → ${target}${missMark(verdict)}`;
};

/**
 * The verdict of a target at a checkpoint, or `undefined` when it is not
 * judged. A metric with no Pacing target has no verdict.
 */
type VerdictOf = (
  id: CheckpointId,
  target: PacingTargetId | Metric
) => PacingVerdict | undefined;

/**
 * The Player level targets are for the First-try run (ADR-0046). A repeating
 * Player has a higher level, so the medians show no level target.
 */
const medianCell = (
  id: CheckpointId,
  playStyle: PlayStyle,
  metric: Metric,
  spread: Spread,
  verdictOf: VerdictOf
) => {
  const text = spreadText(metric, spread);
  return metric === "level"
    ? text
    : withTarget(id, playStyle, metric, text, verdictOf(id, metric));
};

const firstTryRow = (
  id: CheckpointId,
  playStyle: PlayStyle,
  snap: CheckpointSnapshot | null,
  verdictOf: VerdictOf
) =>
  snap === null
    ? { checkpoint: id, reached: `no${missMark(verdictOf(id, "level"))}` }
    : {
        checkpoint: id,
        ...Object.fromEntries(
          METRICS.map((metric) => [
            metric,
            withTarget(
              id,
              playStyle,
              metric,
              METRIC_FORMAT[metric](snap[metric]),
              // Only the level targets are judged on the First-try run.
              metric === "level" ? verdictOf(id, metric) : undefined
            ),
          ])
        ),
        combines: snap.combines,
        forgeStones: FORGE_STONE_TIERS.map(
          (tier) => snap.forgeStones[tier]
        ).join("/"),
      };

if (modes.includes("economy")) {
  console.log(
    `Economy: ${battles} Players for each Play Style, to level 30 and the Floor 50 win, or ${MAX_BATTLES} Battles. Cells: median (10th–90th percentile) → target`
  );
  for (const playStyle of PLAY_STYLES) {
    const report = simulateEconomy(playStyle, { seeds: battles });
    const verdicts = judgePacing(report);
    for (const verdict of verdicts) {
      if (!verdict.onTarget && verdict.gated) {
        misses.push(pacingMiss(verdict));
      }
    }
    const verdictOf: VerdictOf = (id, target) =>
      verdicts.find(
        (verdict) => verdict.checkpoint === id && verdict.target === target
      );
    console.log(`\nPlay Style: ${playStyle}`);
    console.table(
      CHECKPOINTS.map((id) => {
        const summary = report.checkpoints[id];
        const firstCombine = pacingTarget(id, playStyle).firstCombine === true;
        return {
          checkpoint: id,
          reached: `${summary.reached}/${report.seeds}`,
          ...Object.fromEntries(
            METRICS.map((metric) => [
              metric,
              summary.metrics === null
                ? "—"
                : medianCell(
                    id,
                    playStyle,
                    metric,
                    summary.metrics[metric],
                    verdictOf
                  ),
            ])
          ),
          combined: `${percent(summary.combinedShare)}${firstCombine ? ` → 100%${missMark(verdictOf(id, "firstCombine"))}` : ""}`,
        };
      })
    );
    console.log(
      "Forge Stones that the Players did not use (ADR-0038). Cells: median (10th–90th percentile)"
    );
    console.table(
      CHECKPOINTS.map((id) => {
        const { forgeStones } = report.checkpoints[id];
        return {
          checkpoint: id,
          ...Object.fromEntries(
            FORGE_STONE_TIERS.map((tier) => [
              tier,
              forgeStones === null
                ? "—"
                : spreadWith((value) => value.toFixed(0), forgeStones[tier]),
            ])
          ),
        };
      })
    );
    console.log(
      "Stars, repeat Battles and Sweeps. Cells: median (10th–90th percentile). capped: the Stages at the repeat cap with fewer than 3 Stars. Tickets: used / not used"
    );
    console.table(
      CHECKPOINTS.map((id) => {
        const { repeats } = report.checkpoints[id];
        return {
          checkpoint: id,
          ...Object.fromEntries(
            REPEAT_METRICS.map((metric) => [
              metric,
              repeats === null
                ? "—"
                : spreadWith((value) => value.toFixed(0), repeats[metric]),
            ])
          ),
        };
      })
    );
    console.log(
      "Seaport income (Economy 2.8). Cells: median (10th–90th percentile), then the median share of the income of that kind from all sources"
    );
    console.table(
      CHECKPOINTS.map((id) => {
        const { seaport } = report.checkpoints[id];
        return {
          checkpoint: id,
          ...Object.fromEntries(
            INCOME_KINDS.map((kind) => [
              kind,
              seaport === null
                ? "—"
                : `${spreadWith((value) => value.toFixed(0), seaport[kind].amount)}, ${percent(seaport[kind].share.median)}`,
            ])
          ),
        };
      })
    );
    console.log(
      `Stuck Players (below level 30 or without the Floor 50 win after ${MAX_BATTLES} Battles): ${report.stuck}/${report.seeds}`
    );
    const early = pacingTarget("level30", playStyle).level30BeforeFloor50;
    console.log(
      `Players at level 30 before the Floor 50 win: ${report.level30BeforeFloor50}/${report.seeds} (${percent(report.level30BeforeFloor50 / report.seeds)})${early === undefined ? "" : ` → ${range(early, percent)}${missMark(verdictOf("level30", "level30BeforeFloor50"))}`}`
    );
    console.log(
      `Players at the repeat cap (${MAX_REPEAT_BATTLES} repeat Battles of a Stage with fewer than 3 Stars): ${report.capped}/${report.seeds}`
    );
    console.log(
      `First-try run of ${playStyle} (win chance 100%, 2 Stars for each win, no repeat Battles and no Sweeps). The level targets are on this run:`
    );
    console.table(
      CHECKPOINTS.map((id) =>
        firstTryRow(id, playStyle, report.firstTry.checkpoints[id], verdictOf)
      )
    );
  }
  console.log(
    "\nPacks of each Play Style: collector merchant (royal after Region 2), upgrader peddler, balanced merchant."
  );
  console.log(
    `Play calendar: ${PLAY_MINUTES_PER_DAY} minutes of play each day, then ${HOURS_AWAY} hours away, so the hours are also the days. Each Player Dispatches the best Expedition of its level at the end of a session and Collects it at the start of the first session after the ship is back. The First-try run sends no ship.`
  );
  const ledger = heynstoneLedger();
  console.log("\nHeynstone ledger (one-time sources, Economy 2.6)");
  console.table([
    ...ledger.sources.map((source) => ({
      source: source.id,
      count: source.count,
      heynstones: source.heynstones,
      estimate: source.estimate ? "yes" : "",
    })),
    { source: "total", count: "", heynstones: ledger.total, estimate: "" },
  ]);
  console.log(
    `Total: ${ledger.total} of the Bazaar catalog cost ${ledger.catalog}: ${percent(ledger.catalogShare)}`
  );
  console.log(
    "\nAchievements: after each Battle, the Player claims each Completed Profile goal and Tally goal at once and gets its Coin and Essence. The Achievement Heynstones are in the ledger, not in the sim."
  );
  console.log(
    "Not in the sim: Feats (the sim plays no Battle, and no Feat gives Coin or Essence), Dungeon 3 (the sim plays only the Dungeons that give XP) and the first-win cards of Dungeons."
  );
}

/** A change of a win rate in percentage points, with its sign: "+2.5". */
const points = (change: number) => {
  const text = (change * 100).toFixed(1);
  return change > 0 ? `+${text}` : text;
};

/** The Power Points of a Skill Card against its budget (ADR-0032). */
const pointsOf = (skillId: string) => {
  const card = getCard(skillId);
  if (card.kind !== "skill") {
    return "—";
  }
  const budget = skillBudgetCheck(card);
  return `${budget.power.toFixed(1)} / ${budget.budget}${budget.nearestStep ? "" : " off step"}`;
};

const signedPoints = (value: number) => (value > 0 ? `+${value}` : `${value}`);

if (modes.includes("skill-swap")) {
  const matchupLevel = level ?? MATCHUP_LEVEL;
  if (matchupLevel < 1) {
    fail(`--level must be an integer of 1 or more: ${matchupLevel}`);
  }
  const options = { seeds: battles, level: matchupLevel, gear: gearOf(gear) };
  console.log(
    `Skill swap: ${battles * 2} Battles each, level ${matchupLevel}, Gear ${gear ?? 0}. Pass: each change is ±${(SWAP_LIMIT * 100).toFixed(1)} points or less`
  );
  const cache = new Map<string, MatchupReport>();
  const reports = CARDS.flatMap((card) =>
    card.kind === "skill" ? [simulateSkillSwap(card, options, cache)] : []
  );
  console.table(
    reports.flatMap((report) =>
      report.results.map((result) => ({
        skill: report.skillId,
        points: pointsOf(report.skillId),
        deck: report.deckId,
        creature: `${report.creatureId} (${signedPoints(report.creatureDeviation)} points${report.sameCountdown ? "" : `, nearest Countdown, Deck Countdown ${signedPoints(report.countdownChange)}`})`,
        opponent: result.opponentId,
        before: percent(result.before, 1),
        after: percent(result.after, 1),
        change: points(result.after - result.before),
        reverse:
          result.reverse === null
            ? "—"
            : `${percent(result.reverse, 1)} (${points(result.reverse - result.before)})`,
        lock: `${percent(result.lockBefore, 1)} → ${percent(result.lockAfter, 1)}`,
        result: result.pass ? "pass" : "FAIL",
      }))
    )
  );
  const failed = reports.filter((report) => !report.pass);
  console.log(
    `${reports.length - failed.length} of ${reports.length} Skill Cards pass${failed.length > 0 ? `. Fail: ${failed.map((report) => report.skillId).join(", ")}` : ""}`
  );
}

if (check && misses.length > 0) {
  console.error(
    `${misses.length} win rates, 3-Star shares or Pacing targets are not on their GDD 13 or Economy 4 target:\n${misses.map((miss) => `- ${miss}`).join("\n")}`
  );
  process.exit(1);
}
