/**
 * The Dungeon Sweep action of the Profile (GDD 4.12, ADR-0039). It is pure:
 * each Dungeon Sweep Ticket gives one repeat-win reward of the Dungeon, with
 * no Battle.
 */
import { DUNGEONS, getDungeon } from "../content/dungeons";
import type { ClassId, DungeonDefinition } from "../content/schema";
import { dungeonOutcomeRewards } from "./dungeon-result";
import type { Profile } from "./schema";
import { applySweepTickets, checkSweepTickets } from "./sweep";
import type { SweepProfile, SweepResult } from "./sweep";

/** A Dungeon Sweep of a Dungeon. */
export interface DungeonSweepInput {
  readonly dungeonId: string;
  /** The Dungeon Sweep Tickets to use, 1 to `MAX_SWEEP_TICKETS`. */
  readonly tickets: number;
  /** The Class of the Active Deck. It sets the Dungeon card pool. */
  readonly classId: ClassId;
}

/** The Profile fields that `applyDungeonSweep` reads and changes. */
type DungeonSweepProfile = SweepProfile & Pick<Profile, "dungeonResults">;

/**
 * Applies a Dungeon Sweep (ADR-0039). Each Dungeon Sweep Ticket gives the
 * rewards of one repeat win of the Dungeon: its Coin, XP and Essence, its card
 * chance, and its Forge Stone chances (ADR-0036, ADR-0037). A Dungeon Sweep
 * always wins, plays no Battle and never adds to the wins of the Dungeon. It
 * throws when the Dungeon has no win, or when the Tickets are not 1 to
 * `MAX_SWEEP_TICKETS`, or are more than the Player has.
 */
export const applyDungeonSweep = <P extends DungeonSweepProfile>(
  profile: P,
  input: DungeonSweepInput,
  dungeons: readonly DungeonDefinition[] = DUNGEONS
): SweepResult<P> => {
  const dungeon = getDungeon(input.dungeonId, dungeons);
  if ((profile.dungeonResults[dungeon.id] ?? 0) < 1) {
    throw new Error(`A Dungeon Sweep needs a win of ${dungeon.id}`);
  }
  checkSweepTickets(input.tickets, profile.dungeonSweepTickets);
  return applySweepTickets(
    profile,
    "dungeonSweepTickets",
    input.tickets,
    (rewardRandomState) =>
      dungeonOutcomeRewards(dungeon, "win", input.classId, rewardRandomState)
  );
};
