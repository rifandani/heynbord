import type { Profile } from "@workspace/rules";
import { newProfile, recordAchievements } from "@workspace/rules";
import { Atom } from "effect/reactivity";

import { newAchievementsAtom } from "@/features/achievements/achievements.atoms";
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

const savedStateAtom = Atom.make<ProfileState>({ status: "loading" }).pipe(
  Atom.keepAlive
);

/**
 * The saved Profile (technical design 5). It is `loading` until the Profile
 * store answers (`useProfileStore`), which also saves each change. App state,
 * so kept alive.
 *
 * Each write of a Profile (the load, an Import and each change) records the
 * Achievements whose Profile goal or Tally goal the Profile meets now as
 * Completed (Achievements 1.2), and adds them to `newAchievementsAtom`. A
 * write that completes nothing keeps the Profile object that it got, so the
 * record step makes no second write and no extra save.
 */
export const profileStateAtom = Atom.writable(
  (get): ProfileState => get(savedStateAtom),
  (ctx, state: ProfileState) => {
    if (state.status !== "ready") {
      ctx.set(savedStateAtom, state);
      return;
    }
    const recorded = recordAchievements(state.profile);
    ctx.set(
      savedStateAtom,
      recorded.profile === state.profile
        ? state
        : { status: "ready", profile: recorded.profile }
    );
    if (recorded.achievements.length > 0) {
      ctx.set(newAchievementsAtom, [
        ...ctx.get(newAchievementsAtom),
        ...recorded.achievements.map((achievement) => achievement.id),
      ]);
    }
  }
).pipe(Atom.keepAlive);

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
 * in the overlay. A write before the Profile loads does nothing. The
 * Achievements read the saved Profile, so a value that only the overlay has
 * completes no Achievement.
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
