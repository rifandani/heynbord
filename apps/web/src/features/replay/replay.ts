import type {
  BattleEvent,
  BattleState,
  Command,
  DungeonDefinition,
  FloorDefinition,
  PlayerSetup,
  StageDefinition,
} from "@workspace/rules";
import { DUNGEONS, FLOORS, STAGES, step } from "@workspace/rules";
import { Result, Schema } from "effect";

import type {
  BattleOptions,
  BattleSession,
} from "@/features/battle/battle-session";
import { startSession } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import { applyEvent } from "@/features/battle/battle-view";

/** The hash of the rules and the content of this build (`scripts/rules-hash.ts`). */
export const RULES_HASH: string = __RULES_HASH__;

/** The place of a Replay: a Campaign Stage, a Dungeon or a Heynspire Floor, by its id. */
export type ReplayPlace =
  | { readonly _tag: "Stage"; readonly stageId: string }
  | { readonly _tag: "Dungeon"; readonly dungeonId: string }
  | { readonly _tag: "Floor"; readonly floorId: string };

/**
 * A Replay (rules glossary): the Battle seed, the Stage or the Dungeon, the
 * Class, Deck, level and Gear of the Player, and the Commands of the two
 * Sides. `rules` is the hash of the rules that made it: the same Commands can
 * give a different Battle with other rules.
 */
export interface Replay {
  readonly rules: string;
  readonly seed: number;
  readonly place: ReplayPlace;
  readonly player: PlayerSetup;
  readonly commands: readonly Command[];
}

/**
 * The game cannot show a Replay. `broken`: the data of the Replay Link cannot
 * be read, or its Battle does not run. `otherVersion`: other rules made it,
 * because its hash of the rules is not the hash of this build.
 */
export class ReplayRefused extends Schema.TaggedError<ReplayRefused>()(
  "ReplayRefused",
  { reason: Schema.Literals(["broken", "otherVersion"]) }
) {}

const broken = () => new ReplayRefused({ reason: "broken" });

/** The content that a Replay can name. The tests give other content. */
interface ReplayContent {
  readonly stages: readonly StageDefinition[];
  readonly dungeons: readonly DungeonDefinition[];
  readonly floors: readonly FloorDefinition[];
}

const CONTENT: ReplayContent = {
  stages: STAGES,
  dungeons: DUNGEONS,
  floors: FLOORS,
};

/** The place of a Battle, or `null` for a QA Dungeon and other Battles with no Replay. */
const placeOf = (
  options: BattleOptions,
  { stages, dungeons, floors }: ReplayContent
): ReplayPlace | null => {
  if (options.floor) {
    return floors.includes(options.floor)
      ? { _tag: "Floor", floorId: options.floor.id }
      : null;
  }
  if (options.dungeon) {
    // A QA Dungeon can have the id of a real Dungeon with other Bosses.
    return dungeons.includes(options.dungeon)
      ? { _tag: "Dungeon", dungeonId: options.dungeon.id }
      : null;
  }
  return stages.some((stage) => stage.id === options.stageId)
    ? { _tag: "Stage", stageId: options.stageId }
    : null;
};

/**
 * The Replay of a Battle that the Player can share (web ADR-0012): a Stage
 * Battle, a Dungeon Battle or a Floor Battle with a win or a loss. `null` for
 * the Tutorial, an Abandon, a Battle with no result yet, a QA Dungeon, a
 * Battle that the Game Dev Panel changed, and a Replay that the Player watches.
 */
export const replayOf = (
  session: BattleSession,
  content: ReplayContent = CONTENT
): Replay | null => {
  const place = placeOf(session.options, content);
  if (
    place === null ||
    session.rules.result === null ||
    session.tutorial !== null ||
    session.watching ||
    session.devChanged
  ) {
    return null;
  }
  const { options } = session;
  return {
    rules: RULES_HASH,
    seed: options.seed,
    place,
    player: {
      classId: options.deck.classId,
      deck: options.deck.deck,
      level: options.player.level,
      gear: options.player.gear,
    },
    commands: session.commands,
  };
};

/** The options of the Battle of a Replay, or `null` when its Stage, Dungeon or Floor is not in the content. */
const optionsOf = (
  replay: Replay,
  { stages, dungeons, floors }: ReplayContent
): BattleOptions | null => {
  const { place, player, seed } = replay;
  const common = {
    deck: { classId: player.classId, deck: player.deck },
    player: { level: player.level, gear: player.gear },
    seed,
  };
  if (place._tag === "Stage") {
    return stages.some((stage) => stage.id === place.stageId)
      ? { ...common, stageId: place.stageId }
      : null;
  }
  if (place._tag === "Floor") {
    const floor = floors.find((candidate) => candidate.id === place.floorId);
    return floor ? { ...common, stageId: floor.id, floor } : null;
  }
  const dungeon = dungeons.find(
    (candidate) => candidate.id === place.dungeonId
  );
  return dungeon ? { ...common, stageId: dungeon.id, dungeon } : null;
};

/** A Replay that the rules ran again: the view at the start and each Battle Event. */
export interface ReplayRun {
  readonly options: BattleOptions;
  readonly start: BattleView;
  readonly events: readonly BattleEvent[];
  /** The rules state at the end. The Battle has a result. */
  readonly rules: BattleState;
}

/** Each Command in order, or `null` when the rules refuse one. */
const runCommands = (
  rules: BattleState,
  commands: readonly Command[]
): { readonly rules: BattleState; readonly events: BattleEvent[] } | null => {
  let state = rules;
  const events: BattleEvent[] = [];
  for (const command of commands) {
    const output = step(state, command);
    if (Result.isFailure(output)) {
      return null;
    }
    const { state: next, events: stepEvents } = output.success;
    state = next;
    events.push(...stepEvents);
  }
  return { rules: state, events };
};

/**
 * Runs a Replay again with the rules. The rules of this build must have made
 * it (`otherVersion`). A Replay is `broken` when its Stage, Dungeon, Floor or
 * cards are not in the content, when the rules refuse one of its Commands,
 * and when its Battle has no result at the end.
 */
export const runReplay = (
  replay: Replay,
  content: ReplayContent = CONTENT
): Result.Result<ReplayRun, ReplayRefused> => {
  if (replay.rules !== RULES_HASH) {
    return Result.fail(new ReplayRefused({ reason: "otherVersion" }));
  }
  const options = optionsOf(replay, content);
  if (options === null) {
    return Result.fail(broken());
  }
  // An unknown card or a value out of range in the setup throws in the rules.
  const started = Result.try(() => startSession(options));
  if (Result.isFailure(started)) {
    return Result.fail(broken());
  }
  const { rules, start } = started.success;
  const ran = runCommands(rules, replay.commands);
  if (ran === null || ran.rules.result === null) {
    return Result.fail(broken());
  }
  return Result.succeed({
    options,
    start,
    events: ran.events,
    rules: ran.rules,
  });
};

/**
 * The session of Watching a Replay: the full Battle, with each event in the
 * log, so the Battle Log mode shows it. It is never Live: no Command goes to
 * it, and its result writes nothing to the Profile.
 */
export const watchingSession = (run: ReplayRun): BattleSession => {
  const session = startSession(run.options);
  return {
    ...session,
    rules: run.rules,
    view: run.events.reduce(applyEvent, run.start),
    log: run.events,
    watching: true,
  };
};
