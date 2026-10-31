import type {
  BattleEvent,
  ForgeStones,
  RankId,
  UnopenedPack,
} from "@workspace/rules";
import {
  addCopies,
  getCard,
  legalTargets,
  getStarterDeck,
  STAGES,
} from "@workspace/rules";
import { absurd } from "effect";
import type { AtomRegistry } from "effect/reactivity";

import type {
  BattleOptions,
  BattleSession,
} from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import {
  publishBattle,
  readBattle,
  stageBattle,
} from "@/features/battle/battle-store";
import { applyEvent, heroOf } from "@/features/battle/battle-view";
import {
  focusedTargetAtom,
  inspectedUnitAtom,
  legalTargetsAtom,
  selectedCardAtom,
} from "@/features/battle/battle.atoms";
import { sourceId } from "@/features/battle/card-art";
import { PLAYER_HERO, playerHand } from "@/features/battle/player-hero";
import {
  dungeonBefore,
  playDungeonTurns,
  qaThreeBossDungeon,
  qaTwoBossDungeon,
  qaWeakTwoBossDungeon,
  startDungeon,
} from "@/features/battle/qa-dungeons";
import { playback } from "@/features/battle/scene/playback";
import type { StageResults } from "@/features/campaign/region-map";
import { NEW_PLAYER } from "@/features/profile/profile";
import { profileSaved } from "@/features/profile/profile-store.atoms";
import { profileAtom } from "@/features/profile/profile.atoms";
import type { SweepKind } from "@/features/sweep/sweep";
import { gameScreenAtom } from "@/features/town/town.atoms";

/** The states that QA tools can ask for (director evidence manifest). */
export const QA_STATES = [
  "town",
  "stage-select",
  "campaign-progress",
  "active-play",
  "targeting",
  "resolution",
  "enemy-cast",
  "victory",
  "defeat",
  "dungeon",
  "dungeon-three",
  "dungeon-boss-rule",
  "dungeon-defeat",
  "unit-model",
] as const;
export type QaState = (typeof QA_STATES)[number];

/** The states that start in the middle of their queued events, so that a capture shows them play. */
const PLAYING_STATES: ReadonlySet<QaState> = new Set([
  "resolution",
  "enemy-cast",
  "dungeon-boss-rule",
  "dungeon-defeat",
]);

const playTurns = (session: BattleSession, turns: number): BattleSession => {
  let next = session;
  for (
    let turn = 0;
    turn < turns && next.rules.status !== "finished";
    turn += 1
  ) {
    next = skip(autoPlayTurn(next));
  }
  return next;
};

/** True when the player has a Ready card with a legal target now. */
const canTarget = (session: BattleSession): boolean =>
  session.rules.activeSide === "player" &&
  playerHand(session.rules).some(
    (_, index) => legalTargets(session.rules, PLAYER_HERO, index).length > 0
  );

/** Plays more Turns until the player can select a target, for 8 Turns at most. */
const playUntilTargeting = (session: BattleSession): BattleSession => {
  let next = session;
  for (let turn = 0; turn < 8 && !canTarget(next); turn += 1) {
    next = playTurns(next, 1);
  }
  return next;
};

const playOut = (stageId: string, seed: number): BattleSession => {
  let session = startSession({
    stageId,
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed,
  });
  while (session.rules.status !== "finished") {
    session = skip(autoPlayTurn(session));
  }
  return session;
};

const isEnemyCast = (event: BattleEvent): boolean =>
  event._tag === "CardPlayed" &&
  event.side === "enemy" &&
  getCard(event.card.cardId).kind === "skill";

/** Applies the queued events before the first enemy Skill Card cast, or `null` when no cast is queued. */
const toEnemyCast = (session: BattleSession): BattleSession | null => {
  const index = session.queue.findIndex(isEnemyCast);
  if (index === -1) {
    return null;
  }
  const played = session.queue.slice(0, index);
  return {
    ...session,
    view: played.reduce(applyEvent, session.view),
    log: [...session.log, ...played],
    queue: session.queue.slice(index),
    current: null,
    elapsed: 0,
  };
};

/**
 * The Hedge Witch of Stage 1-3 casts Skill Cards. Plays Turns until the
 * enemy's Turn holds a cast, and stops just before it, for 12 Turns at most.
 */
const enemyCastBattle = (seed: number): BattleSession => {
  let session = startSession({
    stageId: "1-3",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed,
  });
  for (
    let turn = 0;
    turn < 12 && session.rules.status !== "finished";
    turn += 1
  ) {
    const played = autoPlayTurn(session);
    const cast = toEnemyCast(played);
    if (cast) {
      return cast;
    }
    session = skip(played);
  }
  return session;
};

/**
 * Plays Battles with the AI for both sides until one ends with the wanted
 * winner. Stage 1-1 is easy and the Boss Stage is hard, so the first seeds
 * nearly always match; after 40 seeds it gives the last Battle.
 */
const finishedBattle = (
  seed: number,
  winner: "player" | "enemy",
  stageId = winner === "player" ? "1-1" : "1-10"
): BattleSession => {
  let session = playOut(stageId, seed);
  for (
    let offset = 1;
    offset < 40 && session.rules.result?.winner !== winner;
    offset += 1
  ) {
    session = playOut(stageId, seed + offset);
  }
  return session;
};

/** Plays the Battle of `options` to its end with the AI for both sides. */
const playOutOptions = (options: BattleOptions): BattleSession => {
  let session = startSession(options);
  while (session.rules.status !== "finished") {
    session = skip(autoPlayTurn(session));
  }
  return session;
};

/**
 * Plays the Battle of `options` with the AI for both sides until one ends
 * with the wanted winner: from its seed, then the next seeds, for 80 seeds
 * at most. It keeps the Stage or the Dungeon, the Deck and the Player of the
 * Battle, so that its result is a real result of that Battle.
 */
const finishedFrom = (
  options: BattleOptions,
  winner: "player" | "enemy"
): BattleSession => {
  let session = playOutOptions(options);
  for (
    let offset = 1;
    offset < 80 && session.rules.result?.winner !== winner;
    offset += 1
  ) {
    session = playOutOptions({ ...options, seed: options.seed + offset });
  }
  return session;
};

const WARDEN_SAELITH = "elf.wardenSaelith";

/**
 * QA: a Ranger Deck around Warden Saelith, the first card with a Unit Model
 * (art direction 2.2), so a capture shows her on the Board.
 */
const UNIT_MODEL_DECK: BattleOptions["deck"] = {
  classId: "ranger",
  deck: [
    ...Array.from({ length: 3 }, () => ({
      cardId: WARDEN_SAELITH,
      rank: "legendary" as const,
    })),
    ...Array.from({ length: 3 }, () => ({
      cardId: "elf.brambleDuelist",
      rank: "common" as const,
    })),
    ...Array.from({ length: 3 }, () => ({
      cardId: "elf.fernwingCourier",
      rank: "common" as const,
    })),
    { cardId: "elf.rootboundGuard", rank: "common" },
  ],
};

const hasSaelith = (session: BattleSession): boolean =>
  session.view.units.some(
    (unit) =>
      unit.owner === "player" && sourceId(unit.source) === WARDEN_SAELITH
  );

/**
 * Plays Turns with the AI for both sides until Warden Saelith is on the
 * Board, for 14 Turns at most, from the seed and then the next seeds.
 */
const unitModelBattle = (seed: number): BattleSession => {
  let session = startSession({
    stageId: "1-2",
    deck: UNIT_MODEL_DECK,
    player: NEW_PLAYER,
    seed,
  });
  for (let offset = 0; offset < 20; offset += 1) {
    session = startSession({
      stageId: "1-2",
      deck: UNIT_MODEL_DECK,
      player: NEW_PLAYER,
      seed: seed + offset,
    });
    for (
      let turn = 0;
      turn < 14 && session.rules.status !== "finished";
      turn += 1
    ) {
      if (hasSaelith(session)) {
        return session;
      }
      session = playTurns(session, 1);
    }
  }
  return session;
};

/**
 * QA: Stages 1-1 to 1-9 won with mixed Stars, so the Boss Stage is Open and
 * each Stage of Region 1 can be played.
 */
const QA_STAGE_RESULTS: StageResults = {
  "1-1": 3,
  "1-2": 3,
  "1-3": 2,
  "1-4": 3,
  "1-5": 1,
  "1-6": 2,
  "1-7": 3,
  "1-8": 2,
  "1-9": 1,
};

/**
 * Builds a real game state with the real game functions. The bot playtest
 * also plays with real input, so these hooks cannot hide broken controls.
 */
export const buildQaState = (
  state: QaState,
  seed: number
): BattleSession | null => {
  switch (state) {
    case "town":
    case "stage-select":
    case "campaign-progress": {
      return null;
    }
    case "active-play":
    case "targeting":
    case "resolution": {
      const session = playTurns(
        startSession({
          stageId: "1-2",
          deck: getStarterDeck("raiders"),
          player: NEW_PLAYER,
          seed,
        }),
        4
      );
      if (state === "targeting") {
        return playUntilTargeting(session);
      }
      // A Resolution Phase in the middle of its animation.
      return state === "resolution" ? autoPlayTurn(session) : session;
    }
    case "enemy-cast": {
      return enemyCastBattle(seed);
    }
    case "victory": {
      return finishedBattle(seed, "player");
    }
    case "dungeon": {
      return playDungeonTurns(startDungeon(qaTwoBossDungeon(), seed), 3);
    }
    case "dungeon-three": {
      return playDungeonTurns(startDungeon(qaThreeBossDungeon(), seed), 3);
    }
    case "dungeon-boss-rule": {
      return dungeonBefore(
        startDungeon(qaWeakTwoBossDungeon(), seed),
        (event) => event._tag === "BossRuleActivated"
      );
    }
    case "dungeon-defeat": {
      return dungeonBefore(
        startDungeon(qaWeakTwoBossDungeon(), seed),
        (event) => event._tag === "HeroDefeated"
      );
    }
    case "defeat": {
      return finishedBattle(seed, "enemy");
    }
    case "unit-model": {
      return unitModelBattle(seed);
    }
    default: {
      return absurd(state);
    }
  }
};

/**
 * Installs `window.__THREE_GAME_TEST_HOOKS__`. With `initialState` (from
 * `?state=<name>`), it opens that state at once, so a canvas inspector that
 * waits for the canvas can start. Returns the function that removes the hooks.
 */
export const installTestHooks = (
  registry: AtomRegistry.AtomRegistry,
  initialState: string | null = null
): (() => void) => {
  let seed = 42;
  const hooks = {
    states: QA_STATES,
    seed: (value: number) => {
      seed = value;
    },
    setPausedForScreenshot: (paused: boolean) => {
      playback.paused = paused;
    },
    /** Sets the Coin of the Profile, in Copper, so that a test can buy Packs. */
    setCoin: (copper: number) => {
      registry.set(profileAtom, { ...registry.get(profileAtom), coin: copper });
    },
    /** Adds an Unopened Pack to the Profile, as a reward does. */
    giveUnopenedPack: (pack: UnopenedPack) => {
      const profile = registry.get(profileAtom);
      registry.set(profileAtom, {
        ...profile,
        unopenedPacks: [...profile.unopenedPacks, pack],
      });
    },
    /** Sets the Essence of the Profile, so that a test can Craft. */
    setEssence: (essence: number) => {
      registry.set(profileAtom, { ...registry.get(profileAtom), essence });
    },
    /** Adds copies of a card in one Rank to the Collection, as a Pack does. */
    giveCopies: (cardId: string, rank: RankId, count: number) => {
      const profile = registry.get(profileAtom);
      registry.set(profileAtom, {
        ...profile,
        collection: addCopies(
          profile.collection,
          Array.from({ length: count }, () => ({ cardId, rank }))
        ),
      });
    },
    /** Sets the Sweep Tickets of `kind` of the Profile, so that a test can Sweep. */
    setSweepTickets: (kind: SweepKind, tickets: number) => {
      registry.set(profileAtom, {
        ...registry.get(profileAtom),
        [kind === "campaign" ? "campaignSweepTickets" : "dungeonSweepTickets"]:
          tickets,
      });
    },
    /** Sets the win count of each Dungeon, so that a test can open a won Dungeon. */
    setDungeonResults: (dungeonResults: Readonly<Record<string, number>>) => {
      registry.set(profileAtom, {
        ...registry.get(profileAtom),
        dungeonResults,
      });
    },
    /**
     * Wins all Campaign Stages with 3 Stars, so Heynspire is open, and sets
     * the won Floors (0 to 50), so that a test can climb Heynspire.
     */
    openHeynspire: (floorsWon: number) => {
      registry.set(profileAtom, {
        ...registry.get(profileAtom),
        stageResults: Object.fromEntries(STAGES.map((stage) => [stage.id, 3])),
        heynspireFloorsWon: floorsWon,
      });
    },
    /** Sets the Forge Stones of the Profile, so that a test can upgrade Gear. */
    setForgeStones: (forgeStones: ForgeStones) => {
      registry.set(profileAtom, {
        ...registry.get(profileAtom),
        forgeStones,
      });
    },
    /** Sets the XP of the Profile, so that a test can reach a Player level. */
    setXp: (xp: number) => {
      registry.set(profileAtom, { ...registry.get(profileAtom), xp });
    },
    /**
     * Shows the result of a won Battle of `stageId`, played by the AI for
     * both sides, as the `victory` state does for Stage 1-1.
     */
    winStage: (stageId: string) => {
      stageBattle(null);
      registry.set(selectedCardAtom, null);
      registry.set(inspectedUnitAtom, null);
      publishBattle(registry, finishedBattle(seed, "player", stageId));
      registry.set(gameScreenAtom, "campaign");
    },
    /**
     * Ends the Battle that shows now with `winner`, played by the AI for both
     * sides, so that a test can reach the result of a Battle that a screen
     * started (for example a Dungeon) in a short time. The screen stays.
     */
    finishBattle: (winner: "player" | "enemy") => {
      const live = readBattle(registry);
      if (!live) {
        throw new Error("No Battle to finish");
      }
      stageBattle(null);
      registry.set(selectedCardAtom, null);
      registry.set(inspectedUnitAtom, null);
      publishBattle(registry, finishedFrom(live.options, winner));
    },
    /** Resolves when the Profile is in IndexedDB, so that a test can reload. */
    profileSaved: () => profileSaved(registry),
    setState: (name: string) => {
      const known = QA_STATES.find((candidate) => candidate === name);
      if (!known) {
        throw new Error(`Unknown QA state: ${name}`);
      }
      const session = buildQaState(known, seed);
      if (known !== "town") {
        const profile = registry.get(profileAtom);
        registry.set(profileAtom, {
          ...profile,
          seenStoryScenes: [
            ...new Set([
              ...profile.seenStoryScenes,
              "region-1-opening",
              "region-1-boss",
              "region-1-ending",
            ]),
          ],
        });
      }
      if (known === "campaign-progress") {
        registry.set(profileAtom, {
          ...registry.get(profileAtom),
          stageResults: QA_STAGE_RESULTS,
        });
      }
      stageBattle(null);
      registry.set(selectedCardAtom, null);
      registry.set(inspectedUnitAtom, null);
      publishBattle(registry, session);
      // A Battle and its result go back to the Campaign (GDD 11.4).
      registry.set(gameScreenAtom, known === "town" ? "town" : "campaign");
      if (PLAYING_STATES.has(known) && session) {
        // Start the first queued events, so the capture shows Units in action.
        stageBattle(session);
      }
      if (known === "targeting" && session) {
        const ready = heroOf(session.view, "player").hand.findIndex(
          (card, index) => {
            registry.set(selectedCardAtom, index);
            return (
              card.countdown === 0 && registry.get(legalTargetsAtom).length > 0
            );
          }
        );
        registry.set(selectedCardAtom, ready === -1 ? null : ready);
        registry.set(focusedTargetAtom, 0);
      }
      return { state: known };
    },
  };
  Reflect.set(window, "__THREE_GAME_TEST_HOOKS__", hooks);
  if (initialState) {
    hooks.setState(initialState);
  }
  return () => {
    Reflect.deleteProperty(window, "__THREE_GAME_TEST_HOOKS__");
  };
};
