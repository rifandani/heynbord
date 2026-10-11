import type { Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import type {
  BattlePlayer,
  ProfileOverlay,
  ProfileState,
} from "@/features/profile/profile";
import {
  applyOverlay,
  battlePlayer,
  playerLevel,
  splitOverlay,
} from "@/features/profile/profile";

/**
 * The saved Profile (technical design 5). It is `loading` until the Profile
 * store answers (`useProfileStore`), which also saves each change. App state,
 * so kept alive.
 */
export const profileStateAtom = Atom.make<ProfileState>({
  status: "loading",
}).pipe(Atom.keepAlive);

/** The values of the Game Dev Panel over the Profile, or `null`. They are not saved into it. */
export const profileOverlayAtom = Atom.make<ProfileOverlay | null>(null).pipe(
  Atom.keepAlive
);

/** True after the Profile store answered. Until then, the Town shows no balances and opens no Building. */
export const profileReadyAtom = Atom.make(
  (get) => get(profileStateAtom).status === "ready"
);

/** What the screens show before the Profile store answers. */
const NOT_LOADED = newProfile(0);

/**
 * The Profile that the screens show: the saved Profile with the dev overlay
 * on it. A write changes the saved Profile, and a field of the overlay stays
 * in the overlay. A write before the Profile loads does nothing.
 */
export const profileAtom = Atom.writable(
  (get): Profile => {
    const state = get(profileStateAtom);
    return applyOverlay(
      state.status === "ready" ? state.profile : NOT_LOADED,
      get(profileOverlayAtom)
    );
  },
  (ctx, shown: Profile) => {
    const state = ctx.get(profileStateAtom);
    if (state.status !== "ready") {
      return;
    }
    const next = splitOverlay(
      shown,
      state.profile,
      ctx.get(profileOverlayAtom)
    );
    ctx.set(profileOverlayAtom, next.overlay);
    ctx.set(profileStateAtom, { status: "ready", profile: next.saved });
  }
).pipe(Atom.keepAlive);

/** The Player level, from the Profile XP. */
export const playerLevelAtom = Atom.make((get) =>
  playerLevel(get(profileAtom))
);

/** The Player level and the Gear that a Battle uses. */
export const battlePlayerAtom = Atom.make((get): BattlePlayer =>
  battlePlayer(get(profileAtom))
);
