import type { AtomRegistry } from "effect/reactivity";

import type { BattleSession } from "@/features/battle/battle-session";
import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { playback } from "@/features/battle/scene/playback";

/**
 * The one writer of the Battle session atom. The scene clock is separate: the
 * frame driver stages it ahead and publishes only on an event edge.
 */
export const publishBattle = (
  registry: AtomRegistry.AtomRegistry,
  session: BattleSession | null
): void => {
  registry.set(battleSessionAtom, session);
};

/** The published Battle session. */
export const readBattle = (
  registry: AtomRegistry.AtomRegistry
): BattleSession | null => registry.get(battleSessionAtom);

/**
 * The session that the scene clock shows: ahead of the atom by at most one
 * event. A read does not publish.
 */
export const stagedBattle = (): BattleSession | null => playback.session;

/** Moves the scene clock to a session that is not published yet. */
export const stageBattle = (session: BattleSession | null): void => {
  playback.session = session;
};
