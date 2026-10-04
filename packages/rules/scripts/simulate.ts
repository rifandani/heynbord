/**
 * Headless Battle simulation (GDD 13). The AI plays both sides (Auto-play for
 * the player). Prints the player's win rate, average Turn number and Stars for
 * each Stage and starter Deck. Usage: `bun run sim [battles]`.
 */
import { Result } from "effect";

import { chooseCommand } from "../src/ai/choose-command";
import { createBattle } from "../src/battle/create-battle";
import { starsFor } from "../src/battle/stars";
import { step } from "../src/battle/step";
import { getStarterDeck, STARTER_DECKS } from "../src/content/decks";
import { STAGES } from "../src/content/stages";

const battles = Number(process.argv[2] ?? 200);
const gear = { weapon: 3, armor: 3, trinket: 3, banner: 3 };

type BattleState = ReturnType<typeof createBattle>["state"];
type Stage = (typeof STAGES)[number];
type StarterDeck = (typeof STARTER_DECKS)[number];

/** The AI plays both sides until the Battle ends. */
const playOut = (start: BattleState): BattleState => {
  let state = start;
  while (state.phase !== "finished") {
    const result = step(state, chooseCommand(state));
    if (Result.isFailure(result)) {
      throw new Error(result.failure._tag);
    }
    ({ state } = result.success);
  }
  return state;
};

const simulate = (stage: Stage, starter: StarterDeck) => {
  const deck = getStarterDeck(starter.id);
  let wins = 0;
  let turns = 0;
  let stars = 0;
  for (let seed = 1; seed <= battles; seed += 1) {
    const state = playOut(
      createBattle({
        seed,
        stage,
        player: { classId: deck.classId, deck: deck.deck, level: 10, gear },
      }).state
    );
    wins += state.result?.winner === "player" ? 1 : 0;
    turns += state.turnNumber;
    stars += starsFor(state);
  }
  return {
    stage: stage.id,
    deck: starter.id,
    winRate: `${Math.round((wins * 100) / battles)}%`,
    avgTurn: (turns / battles).toFixed(1),
    avgStars: (stars / battles).toFixed(2),
  };
};

const rows = STAGES.flatMap((stage) =>
  STARTER_DECKS.map((starter) => simulate(stage, starter))
);

console.table(rows);
