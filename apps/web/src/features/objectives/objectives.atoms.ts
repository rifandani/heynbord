import { Atom } from "effect/reactivity";

import {
  objectivesBadge,
  objectivesView,
} from "@/features/objectives/objectives";
import { profileAtom } from "@/features/profile/profile.atoms";

/** True while the Objectives dialog is open. App state, so kept alive. */
export const objectivesOpenAtom = Atom.make(false).pipe(Atom.keepAlive);

/** The tabs, the rows and the Activity bar of the Objectives dialog. */
export const objectivesViewAtom = Atom.make((get) =>
  objectivesView(get(profileAtom))
);

/** The Objectives badge of the Objectives shortcut (24 — Quests 3). */
export const objectivesBadgeAtom = Atom.make((get) =>
  objectivesBadge(get(objectivesViewAtom))
);
