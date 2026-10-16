import type { Target as TargetType } from "@workspace/rules";
import {
  ClassId,
  Command,
  DeckEntry,
  MAX_GEAR_LEVEL,
  Target,
} from "@workspace/rules";
import { Effect, Result, Schema } from "effect";
import { Base64Url } from "effect/encoding";

import type { Replay, ReplayPlace, ReplayRun } from "@/features/replay/replay";
import { ReplayRefused, runReplay } from "@/features/replay/replay";

/**
 * The format of the data of a Replay Link. It is not the hash of the rules.
 * Each shared link is a public contract: a new format must still read the
 * old links, or refuse them clearly (web ADR-0012). The "floor" place came
 * later in format 1: it only adds to what format 1 reads.
 */
export const REPLAY_FORMAT = 1;

/** The data after `#replay=` in the URL fragment of a Replay Link. */
const FRAGMENT = "#replay=";

/** Longer data is not from a Replay Link, so the game does not inflate it. */
const MAX_DATA_LENGTH = 200_000;

const GearLevel = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: MAX_GEAR_LEVEL })
);

/**
 * A Replay in the link. A Command is a short list of integers:
 * `[]` is End Turn, and `[hero, handIndex, ...target]` is a card play.
 */
const ReplayData = Schema.Struct({
  rules: Schema.String,
  seed: Schema.Int,
  place: Schema.Tuple([
    Schema.Literals(["stage", "dungeon", "floor"]),
    Schema.NonEmptyString,
  ]),
  classId: ClassId,
  deck: Schema.Array(DeckEntry),
  level: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  gear: Schema.Struct({
    weapon: GearLevel,
    armor: GearLevel,
    trinket: GearLevel,
    banner: GearLevel,
  }),
  commands: Schema.Array(
    Schema.Array(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)))
  ),
});
type ReplayData = typeof ReplayData.Type;

const ReplayJson = Schema.fromJsonString(ReplayData);
const encodeJson = Schema.encodeSync(ReplayJson);
const decodeJson = Schema.decodeUnknownResult(ReplayJson);

/** The order of the Sides and of the Target kinds in the link. */
const SIDES = ["player", "enemy"] as const;

const targetToData = (target: TargetType): number[] =>
  Target.$match(target, {
    NoTarget: () => [0],
    Lane: ({ lane }) => [1, lane],
    Square: ({ lane, position }) => [2, lane, position],
    Hero: ({ side, hero }) => [3, SIDES.indexOf(side), hero],
  });

const targetFromData = (
  kind: number | undefined,
  values: readonly number[]
): TargetType | null => {
  const [first = -1, second = -1] = values;
  const side = SIDES[first];
  switch (`${kind}/${values.length}`) {
    case "0/0": {
      return Target.NoTarget();
    }
    case "1/1": {
      return Target.Lane({ lane: first });
    }
    case "2/2": {
      return Target.Square({ lane: first, position: second });
    }
    case "3/2": {
      return side ? Target.Hero({ side, hero: second }) : null;
    }
    default: {
      return null;
    }
  }
};

const commandToData = (command: Command): number[] =>
  command._tag === "EndTurn"
    ? []
    : [command.hero, command.handIndex, ...targetToData(command.target)];

const commandFromData = (data: readonly number[]): Command | null => {
  if (data.length === 0) {
    return Command.EndTurn();
  }
  const [hero = -1, handIndex = -1, kind, ...values] = data;
  const target = targetFromData(kind, values);
  return target && data.length >= 3
    ? Command.PlayCard({ hero, handIndex, target })
    : null;
};

const placeToData = (place: ReplayPlace): ReplayData["place"] => {
  if (place._tag === "Stage") {
    return ["stage", place.stageId];
  }
  if (place._tag === "Dungeon") {
    return ["dungeon", place.dungeonId];
  }
  return ["floor", place.floorId];
};

const placeFromData = ([kind, id]: ReplayData["place"]): ReplayPlace => {
  if (kind === "stage") {
    return { _tag: "Stage", stageId: id };
  }
  if (kind === "dungeon") {
    return { _tag: "Dungeon", dungeonId: id };
  }
  return { _tag: "Floor", floorId: id };
};

const toData = (replay: Replay): ReplayData => ({
  rules: replay.rules,
  seed: replay.seed,
  place: placeToData(replay.place),
  classId: replay.player.classId,
  deck: replay.player.deck,
  level: replay.player.level,
  gear: replay.player.gear,
  commands: replay.commands.map(commandToData),
});

const fromData = (data: ReplayData): Replay | null => {
  const commands: Command[] = [];
  for (const each of data.commands) {
    const command = commandFromData(each);
    if (!command) {
      return null;
    }
    commands.push(command);
  }
  return {
    rules: data.rules,
    seed: data.seed,
    place: placeFromData(data.place),
    player: {
      classId: data.classId,
      deck: data.deck,
      level: data.level,
      gear: data.gear,
    },
    commands,
  };
};

/** Runs the bytes through a compression stream of the browser. */
const transform = async (
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream
): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(stream)
    ).arrayBuffer()
  );

const broken = () => new ReplayRefused({ reason: "broken" });

/**
 * The data of a Replay Link: the format, a dot, then the Replay as JSON,
 * compressed and in URL-safe Base64.
 */
export const encodeReplay = (replay: Replay): Effect.Effect<string> =>
  Effect.promise(() =>
    transform(
      new TextEncoder().encode(encodeJson(toData(replay))),
      new CompressionStream("deflate-raw")
    )
  ).pipe(Effect.map((bytes) => `${REPLAY_FORMAT}.${Base64Url.encode(bytes)}`));

/** The format of the data, or `null` when the data has no format. */
const formatOf = (data: string): number | null => {
  const match = /^(?<format>\d{1,4})\./u.exec(data);
  return match?.groups?.format === undefined
    ? null
    : Number(match.groups.format);
};

/**
 * Reads the data of a Replay Link. The data of another format is from
 * another version of the game. Data that does not decode is broken.
 */
export const decodeReplay = (
  data: string
): Effect.Effect<Replay, ReplayRefused> =>
  Effect.gen(function* () {
    const format = formatOf(data);
    if (format === null || data.length > MAX_DATA_LENGTH) {
      return yield* broken();
    }
    if (format !== REPLAY_FORMAT) {
      return yield* new ReplayRefused({ reason: "otherVersion" });
    }
    const bytes = yield* Effect.fromResult(
      Base64Url.decode(data.slice(data.indexOf(".") + 1))
    ).pipe(Effect.mapError(broken));
    const json = yield* Effect.tryPromise({
      try: () =>
        transform(
          new Uint8Array(bytes),
          new DecompressionStream("deflate-raw")
        ).then((inflated) => new TextDecoder().decode(inflated)),
      catch: broken,
    });
    const decoded = decodeJson(json);
    const replay = Result.isSuccess(decoded) ? fromData(decoded.success) : null;
    return replay ?? (yield* broken());
  });

/**
 * Reads the data of a Replay Link and runs the Replay with the rules of this
 * build, for Watching a Replay.
 */
export const openReplay = (
  data: string
): Effect.Effect<ReplayRun, ReplayRefused> =>
  decodeReplay(data).pipe(
    Effect.flatMap((replay) => Effect.fromResult(runReplay(replay)))
  );

/** The Replay Link of `data`: the Play route, with the data in the fragment. */
export const replayLink = (origin: string, data: string): string =>
  `${origin}/play${FRAGMENT}${data}`;

/** The data of a Replay Link in a URL fragment, or `null` when the fragment is not a Replay Link. */
export const replayDataOf = (hash: string): string | null =>
  hash.startsWith(FRAGMENT) ? hash.slice(FRAGMENT.length) : null;
