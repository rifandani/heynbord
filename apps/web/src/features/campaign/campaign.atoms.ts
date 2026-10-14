import { newestUnlockedRegion } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import type { StageResults } from "@/features/campaign/region-map";
import { profileAtom } from "@/features/profile/profile.atoms";

/** The best Stars of each won Stage, from the Profile. */
export const stageResultsAtom = Atom.make(
  (get): StageResults => get(profileAtom).stageResults
);

/**
 * The Open Stage that the Campaign showed last. When a win opens a new Stage,
 * its marker wakes up once.
 */
export const seenOpenStageAtom = Atom.make<string | null>(null).pipe(
  Atom.keepAlive
);

/**
 * The Region that the Player opened with the Region arrows, or that the last
 * Battle was in. `null` means the newest unlocked Region: the Town Gate sets
 * it (GDD 11.5). App state, so kept alive.
 */
export const chosenRegionAtom = Atom.make<number | null>(null).pipe(
  Atom.keepAlive
);

/** The Region that the Campaign screen shows. */
export const campaignRegionAtom = Atom.make(
  (get): number =>
    get(chosenRegionAtom) ?? newestUnlockedRegion(get(stageResultsAtom))
);
