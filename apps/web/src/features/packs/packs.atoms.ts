import type { PackState, UnopenedPack } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import { profileAtom } from "@/features/profile/profile.atoms";

/** The Pack state of the Profile: the Pack Guarantee counters and the Pack random state. */
export const packStateAtom = Atom.make(
  (get): PackState => get(profileAtom).packState
);

/** The Packs that the Player got as rewards and has not opened yet (Economy 3.1). */
export const unopenedPacksAtom = Atom.make(
  (get): readonly UnopenedPack[] => get(profileAtom).unopenedPacks
);
