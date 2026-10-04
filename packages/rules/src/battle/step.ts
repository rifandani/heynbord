import { Result } from "effect";

import type { StepContext } from "./context";
import { cloneState } from "./context";
import { playCard } from "./play";
import { legalTargets, sameTarget } from "./targets";
import { endTurn } from "./turn";
import type { BattleEvent, BattleState, Command } from "./types";
import { RuleViolation } from "./types";

export interface StepOutput {
  readonly state: BattleState;
  readonly events: readonly BattleEvent[];
}

const check = (
  state: BattleState,
  command: Command
): RuleViolation | undefined => {
  if (state.phase === "finished") {
    return RuleViolation.BattleFinished();
  }
  if (command._tag === "EndTurn") {
    return undefined;
  }
  const { handIndex, target } = command;
  const card = state.sides[state.activeSide].hand[handIndex];
  if (!card) {
    return RuleViolation.InvalidHandIndex({ handIndex });
  }
  if (card.countdown > 0) {
    return RuleViolation.CardNotReady({ handIndex });
  }
  const legal = legalTargets(state, handIndex).some((candidate) =>
    sameTarget(candidate, target)
  );
  return legal ? undefined : RuleViolation.IllegalTarget({ handIndex, target });
};

/**
 * The only way to change a Battle (technical design 3.1). It is a pure
 * function: it does not change `state`. The same state and the same Command
 * always give the same result. `EndTurn` runs the complete Resolution Phase,
 * the End Step and the next side's Start Step.
 */
export const step = (
  state: BattleState,
  command: Command
): Result.Result<StepOutput, RuleViolation> => {
  const violation = check(state, command);
  if (violation) {
    return Result.fail(violation);
  }
  const next = cloneState(state);
  const random = { state: next.random };
  const ctx: StepContext = { state: next, events: [], random };
  if (command._tag === "PlayCard") {
    playCard(ctx, command.handIndex, command.target);
  } else {
    endTurn(ctx);
  }
  next.random = random.state;
  return Result.succeed({ state: next, events: ctx.events });
};
