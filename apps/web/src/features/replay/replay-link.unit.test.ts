import { describe, expect, it } from "@effect/vitest";
import { Command, getDungeon, getStarterDeck, Target } from "@workspace/rules";
import { Effect, Exit } from "effect";
import { Base64Url } from "effect/encoding";

import type { BattleSession } from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import { startDungeon } from "@/features/battle/qa-dungeons";
import { NEW_PLAYER } from "@/features/profile/profile";
import type { Replay } from "@/features/replay/replay";
import { replayOf, RULES_HASH } from "@/features/replay/replay";
import {
  decodeReplay,
  encodeReplay,
  openReplay,
  REPLAY_FORMAT,
  replayDataOf,
  replayLink,
} from "@/features/replay/replay-link";

const playOut = (session: BattleSession): BattleSession => {
  let next = session;
  while (next.rules.status !== "finished") {
    next = skip(autoPlayTurn(next));
  }
  return next;
};

const stageBattle = playOut(
  startSession({
    stageId: "1-2",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed: 11,
  })
);

const replayFrom = (session: BattleSession): Replay => {
  const replay = replayOf(session);
  if (!replay) {
    throw new Error("The Battle has no Replay");
  }
  return replay;
};

/** A Replay with one Command for each kind of Target, and End Turn. */
const eachTarget: Replay = {
  rules: RULES_HASH,
  seed: 3,
  place: { _tag: "Dungeon", dungeonId: "dungeon-2" },
  player: {
    classId: "mage",
    deck: [{ cardId: "a", rank: "rare" }],
    level: 12,
    gear: { weapon: 1, armor: 2, trinket: 3, banner: 25 },
  },
  commands: [
    Command.PlayCard({ hero: 0, handIndex: 1, target: Target.NoTarget() }),
    Command.PlayCard({
      hero: 0,
      handIndex: 0,
      target: Target.Lane({ lane: 2 }),
    }),
    Command.PlayCard({
      hero: 1,
      handIndex: 3,
      target: Target.Square({ lane: 1, position: 4 }),
    }),
    Command.PlayCard({
      hero: 0,
      handIndex: 2,
      target: Target.Hero({ side: "enemy", hero: 2 }),
    }),
    Command.EndTurn(),
  ],
};

/** The data of a Replay Link with `json` as its content. */
const dataOf = (json: string, format = REPLAY_FORMAT) =>
  Effect.promise(async () => {
    const stream = new Blob([json])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    return `${format}.${Base64Url.encode(bytes)}`;
  });

const reasonOf = (data: string) =>
  decodeReplay(data).pipe(
    Effect.exit,
    Effect.map((exit) =>
      Exit.isFailure(exit) && exit.cause.reasons[0]?._tag === "Fail"
        ? exit.cause.reasons[0].error.reason
        : null
    )
  );

describe("encodeReplay and decodeReplay", () => {
  it.effect("give back the same Replay of a Stage Battle", () =>
    Effect.gen(function* () {
      const replay = replayFrom(stageBattle);
      const data = yield* encodeReplay(replay);
      expect(data.startsWith(`${REPLAY_FORMAT}.`)).toBe(true);
      // URL-safe: the data goes into the URL fragment as it is.
      expect(data).toMatch(/^[\w.-]+$/u);
      expect(yield* decodeReplay(data)).toEqual(replay);
    })
  );

  it.effect("give back each kind of Target and a Dungeon by its id", () =>
    Effect.gen(function* () {
      const data = yield* encodeReplay(eachTarget);
      expect(yield* decodeReplay(data)).toEqual(eachTarget);
    })
  );

  it.effect("give back a Heynspire Floor by its id", () =>
    Effect.gen(function* () {
      const replay: Replay = {
        ...eachTarget,
        place: { _tag: "Floor", floorId: "floor-50" },
      };
      expect(yield* decodeReplay(yield* encodeReplay(replay))).toEqual(replay);
    })
  );

  it.effect("keep the link of a long Battle short enough for a chat app", () =>
    Effect.gen(function* () {
      const battle = playOut(startDungeon(getDungeon("dungeon-3"), 9));
      const replay = replayFrom(battle);
      const link = replayLink(
        "https://heynbord.com",
        yield* encodeReplay(replay)
      );
      // A Dungeon Battle of 3 Bosses has many Commands. The link stays under
      // 4,000 characters, a safe length for a URL in a chat message.
      expect(replay.commands.length).toBeGreaterThan(40);
      expect(link.length).toBeLessThan(4000);
    })
  );
});

describe("a broken Replay Link", () => {
  it.effect("is broken when the data is not a Replay", () =>
    Effect.gen(function* () {
      expect(yield* reasonOf("")).toBe("broken");
      expect(yield* reasonOf("no-format")).toBe("broken");
      expect(yield* reasonOf("1.%%%")).toBe("broken");
      // Base64 that does not inflate.
      expect(yield* reasonOf("1.AAAA")).toBe("broken");
      expect(yield* reasonOf(yield* dataOf("not json"))).toBe("broken");
      expect(yield* reasonOf(yield* dataOf('{"rules":"x"}'))).toBe("broken");
    })
  );

  it.effect("is broken when a Command is not a Command", () =>
    Effect.gen(function* () {
      const data = yield* encodeReplay(eachTarget);
      const replay = yield* decodeReplay(data);
      const json = JSON.stringify({
        rules: replay.rules,
        seed: replay.seed,
        place: ["dungeon", "dungeon-2"],
        classId: "mage",
        deck: replay.player.deck,
        level: 12,
        gear: replay.player.gear,
        commands: [[0, 1, 9]],
      });
      expect(yield* reasonOf(yield* dataOf(json))).toBe("broken");
      const badSide = json.replace("[[0,1,9]]", "[[0,1,3,4,0]]");
      expect(yield* reasonOf(yield* dataOf(badSide))).toBe("broken");
      const short = json.replace("[[0,1,9]]", "[[0,1]]");
      expect(yield* reasonOf(yield* dataOf(short))).toBe("broken");
    })
  );

  it.effect("is from another version of the game with another format", () =>
    Effect.gen(function* () {
      expect(yield* reasonOf(yield* dataOf("{}", REPLAY_FORMAT + 1))).toBe(
        "otherVersion"
      );
    })
  );
});

describe("openReplay", () => {
  it.effect("runs the Replay of a link with the rules", () =>
    Effect.gen(function* () {
      const data = yield* encodeReplay(replayFrom(stageBattle));
      const run = yield* openReplay(data);
      expect(run.events).toEqual(stageBattle.log);
    })
  );

  it.effect("refuses a link with another hash of the rules", () =>
    Effect.gen(function* () {
      const data = yield* encodeReplay({
        ...replayFrom(stageBattle),
        rules: "older-rules",
      });
      const exit = yield* Effect.exit(openReplay(data));
      expect(exit).toEqual(
        Exit.fail(expect.objectContaining({ reason: "otherVersion" }))
      );
    })
  );
});

describe("replayLink and replayDataOf", () => {
  it("put the data into the fragment of the Play route, and read it back", () => {
    const link = replayLink("https://heynbord.com", "1.abc");
    expect(link).toBe("https://heynbord.com/play#replay=1.abc");
    expect(replayDataOf(new URL(link).hash)).toBe("1.abc");
    expect(replayDataOf("#other")).toBeNull();
    expect(replayDataOf("")).toBeNull();
  });
});
