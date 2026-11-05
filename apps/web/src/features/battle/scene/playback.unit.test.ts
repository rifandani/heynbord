import { getStarterDeck } from "@workspace/rules";
import { afterEach, describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import type { BattleSession } from "@/features/battle/battle-session";
import {
  defeatTime,
  playback,
  playerFallen,
  victoryTime,
} from "@/features/battle/scene/playback";
import { NEW_PLAYER } from "@/features/profile/profile";

const startBattle = (): BattleSession =>
  startSession({
    stageId: "1-1",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed: 1,
  });

const session = startBattle();
const otherBattle = startBattle();

const withPlayerHp = (hp: number): BattleSession => ({
  ...session,
  view: {
    ...session.view,
    sides: {
      ...session.view.sides,
      player: {
        ...session.view.sides.player,
        heroes: session.view.sides.player.heroes.map((hero) => ({
          ...hero,
          hp,
        })),
      },
    },
  },
});

afterEach(() => {
  playback.session = null;
  playback.time = 0;
  playback.live = true;
  playback.victory = null;
  playback.defeat = null;
});

describe("victoryTime", () => {
  it("is null with no victory", () => {
    playback.session = session;
    expect(victoryTime()).toBeNull();
  });

  it("runs on the scene clock at the speed of the victory", () => {
    playback.session = session;
    playback.time = 5;
    playback.victory = { options: session.options, start: 2, speed: 2 };
    expect(victoryTime()).toBe(6);
  });

  it("is null while the Battle Log shows a past moment", () => {
    playback.session = session;
    playback.live = false;
    playback.victory = { options: session.options, start: 2, speed: 1 };
    expect(victoryTime()).toBeNull();
  });

  it("is null for the victory of a different Battle", () => {
    playback.session = session;
    playback.victory = { options: otherBattle.options, start: 2, speed: 1 };
    expect(victoryTime()).toBeNull();
  });
});

describe("defeatTime", () => {
  it("is null with no defeat", () => {
    playback.session = session;
    expect(defeatTime()).toBeNull();
  });

  it("runs on the scene clock", () => {
    playback.session = session;
    playback.time = 5;
    playback.defeat = { options: session.options, start: 2 };
    expect(defeatTime()).toBe(3);
  });

  it("is null while the Battle Log shows a past moment", () => {
    playback.session = session;
    playback.live = false;
    playback.defeat = { options: session.options, start: 2 };
    expect(defeatTime()).toBeNull();
  });

  it("is null for the defeat of a different Battle", () => {
    playback.session = session;
    playback.defeat = { options: otherBattle.options, start: 2 };
    expect(defeatTime()).toBeNull();
  });
});

describe("playerFallen", () => {
  it("is false with no session", () => {
    expect(playerFallen()).toBe(false);
  });

  it("is false while a Player Hero has HP", () => {
    playback.session = withPlayerHp(1);
    expect(playerFallen()).toBe(false);
  });

  it("is true when every Player Hero is at 0 HP", () => {
    playback.session = withPlayerHp(0);
    expect(playerFallen()).toBe(true);
  });

  it("is false while the Player watches a Battle", () => {
    playback.session = { ...withPlayerHp(0), watching: true };
    expect(playerFallen()).toBe(false);
  });

  it("is false while the Battle Log shows a past moment", () => {
    playback.session = withPlayerHp(0);
    playback.live = false;
    expect(playerFallen()).toBe(false);
  });
});
