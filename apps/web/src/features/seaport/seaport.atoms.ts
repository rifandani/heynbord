import { Atom } from "effect/reactivity";

import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";
import { destinations } from "@/features/seaport/seaport";

/** The berth of the Seaport ship in the Profile (ADR-0053). */
export const seaportAtom = Atom.make((get) => get(profileAtom).seaport);

/** The Destination list for the Player level. */
export const destinationsAtom = Atom.make((get) =>
  destinations(get(playerLevelAtom))
);
