/**
 * The controller map of the Battle (web ADR-0015). A press becomes the same
 * `BattleKeyCommand` that a key gives, so the Battle has one command path. The
 * map reads the position of a button, never its label.
 */

import type { PadControl, PadPress } from "@/core/input/gamepad";
import type { BattleKeyCommand } from "@/features/battle/components/battle-keys";

/** A Battle command from the pad. */
const command = (
  action: BattleKeyCommand["action"],
  step: 1 | -1 = 1
): BattleKeyCommand => ({ action, step, source: "pad" });

/**
 * The Battle command of each control. `select` has none. L1 opens the Battle
 * Log in Live, and goes one Turn back in the open Battle Log; R1 goes one Turn
 * forward there.
 */
const COMMANDS: Readonly<Record<PadControl, BattleKeyCommand | null>> = {
  up: command("focusTarget", -1),
  down: command("focusTarget", 1),
  left: command("moveSelection", -1),
  right: command("moveSelection", 1),
  south: command("play"),
  east: command("cancel"),
  west: command("inspect"),
  north: command("handbook"),
  l1: command("battleLog", -1),
  r1: command("battleLog", 1),
  l2: command("skip"),
  r2: command("endTurn"),
  start: command("controlsGuide"),
  select: null,
};

/** The Battle command of a pad press, or `null` when the control has none. */
export const padBattleCommand = (press: PadPress): BattleKeyCommand | null =>
  COMMANDS[press.control];
