import { getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  advanceBattleLog,
  canPlayLog,
  openBattleLog,
  pauseBattleLog,
  playBattleLog,
  selectLogEntry,
  setBattleLogSpeed,
  stepBattleLog,
} from "@/features/battle/battle-log-session";
import type { BattleSession } from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
  tick,
} from "@/features/battle/battle-session";

const played = (turns: number): BattleSession => {
  let session = startSession({
    stageId: "1-3",
    deck: getStarterDeck("vanguard"),
    player: { level: 3, gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 } },
    seed: 4,
  });
  for (let turn = 0; turn < turns; turn += 1) {
    session = skip(autoPlayTurn(session));
  }
  return session;
};

describe("the Battle Log state", () => {
  const live = played(4);

  it("opens at the last Log Entry, which is the Live view", () => {
    const log = openBattleLog(live);
    expect(log.selected).toBe(log.book.entries.length - 1);
    expect(log.shown.view).toEqual(live.view);
    expect(log.playing).toBe(false);
  });

  it("is view only: the rules state stays the same, and no Tutorial plays", () => {
    const log = stepBattleLog(openBattleLog(live), -1, true);
    expect(log.shown.rules).toBe(live.rules);
    expect(log.shown.tutorial).toBeNull();
    expect(log.shown.queue).toEqual([]);
  });

  it("shows the Battle at the end of the selected Log Entry", () => {
    const log = selectLogEntry(openBattleLog(live), 2);
    expect(log.selected).toBe(2);
    expect(log.shown.view).toBe(log.book.views[2]);
    expect(selectLogEntry(log, 9999)).toBe(log);
  });

  it("plays the next Log Entries with the scene clock and stops after the last one", () => {
    let log = playBattleLog(selectLogEntry(openBattleLog(live), 0));
    expect(log.playing).toBe(true);
    let { selected } = log;
    for (let frame = 0; frame < 20_000 && log.playing; frame += 1) {
      log = advanceBattleLog(log, tick(log.shown, 100));
      expect(log.selected).toBeGreaterThanOrEqual(selected);
      ({ selected } = log);
    }
    expect(log.playing).toBe(false);
    expect(log.selected).toBe(log.book.entries.length - 1);
    expect(log.shown.view).toEqual(live.view);
    expect(canPlayLog(log)).toBe(false);
    expect(playBattleLog(log)).toBe(log);
  });

  it("pauses at the end of the Log Entry that plays", () => {
    let log = playBattleLog(selectLogEntry(openBattleLog(live), 0));
    for (let frame = 0; frame < 30; frame += 1) {
      log = advanceBattleLog(log, tick(log.shown, 100));
    }
    const paused = pauseBattleLog(log);
    expect(paused.playing).toBe(false);
    expect(paused.selected).toBe(log.selected);
    expect(paused.shown.view).toBe(paused.book.views[paused.selected]);
    expect(paused.shown.current).toBeNull();
  });

  it("keeps the Speed of the Play", () => {
    const log = setBattleLogSpeed(openBattleLog(live), 2);
    expect(log.shown.speed).toBe(2);
  });

  it("opens with no Log Entry at the start of a Battle", () => {
    const log = openBattleLog(played(0));
    expect(log.selected).toBe(-1);
    expect(log.book.entries).toEqual([]);
    expect(stepBattleLog(log, 1, false)).toBe(log);
    expect(canPlayLog(log)).toBe(false);
  });
});
