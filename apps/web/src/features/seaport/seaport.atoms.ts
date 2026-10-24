import type { Expedition } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";
import { cargoOptions } from "@/features/seaport/seaport";

/** The berth of the Seaport ship in the Profile (ADR-0051). */
export const seaportAtom = Atom.make((get) => get(profileAtom).seaport);

/** The Cargo list for the Player level. */
export const cargoOptionsAtom = Atom.make((get) =>
  cargoOptions(get(playerLevelAtom))
);

/**
 * The voyage of the last Dispatch in this session, so that the Seaport
 * screen selects it again after a Collect. It is not saved: a new session
 * starts from the first voyage.
 */
export const lastVoyageAtom = Atom.make<Expedition | null>(null).pipe(
  Atom.keepAlive
);
