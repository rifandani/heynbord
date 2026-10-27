import type { Profile } from "@workspace/rules";
import { ImportError, newProfile } from "@workspace/rules";
import { Result } from "effect";
import { KeyValueStore } from "effect/persistence";
import { AtomRegistry } from "effect/reactivity";
/* oxlint-disable promise/prefer-await-to-callbacks -- the runner reports errors with a callback */
import { describe, expect, it } from "vitest";

import {
  profileStoreErrorAtom,
  replaceProfileAtom,
} from "@/features/profile/profile-store.atoms";
import { attachProfileStore } from "@/features/profile/profile-store.attach";
import type { ProfileStoreRunner } from "@/features/profile/profile-store.attach";
import {
  profileAtom,
  profileOverlayAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";

const runner = (
  overrides: Partial<ProfileStoreRunner> = {}
): ProfileStoreRunner => ({
  errors: () => () => {},
  load: () => Promise.resolve(Result.succeed(null)),
  save: () => {},
  ...overrides,
});

const attach = (
  registry: AtomRegistry.AtomRegistry,
  store: ProfileStoreRunner
) =>
  attachProfileStore(registry, store, {
    removeLegacyKeys: () => {},
  });

describe("attachProfileStore", () => {
  it("loads once, then saves each change", async () => {
    const registry = AtomRegistry.make();
    const saves: Profile[] = [];
    let loads = 0;
    const profile = { ...newProfile(5), coin: 20 };
    const attached = attach(
      registry,
      runner({
        load: () => {
          loads += 1;
          return Promise.resolve(Result.succeed(profile));
        },
        save: (next) => saves.push(next),
      })
    );

    await attached.ready;

    expect(loads).toBe(1);
    expect(registry.get(profileStateAtom)).toEqual({
      status: "ready",
      profile,
    });
    expect(saves).toEqual([]);

    const same = { ...profile, coin: 21 };
    registry.set(profileAtom, same);
    expect(saves).toEqual([same]);

    registry.set(profileAtom, same);
    expect(saves).toHaveLength(1);

    registry.set(profileStateAtom, { status: "loading" });
    expect(saves).toHaveLength(1);

    attached.dispose();
    registry.set(profileAtom, { ...profile, coin: 22 });
    expect(saves).toHaveLength(1);
  });

  it("starts a new Player and reports a load that fails", async () => {
    const registry = AtomRegistry.make();
    const saves: Profile[] = [];
    const attached = attach(
      registry,
      runner({
        load: () => Promise.resolve(Result.fail(ImportError.UnreadableFile())),
        save: (next) => saves.push(next),
      })
    );

    await attached.ready;

    expect(registry.get(profileStateAtom).status).toBe("ready");
    expect(saves).toEqual([]);
    expect(registry.get(profileStoreErrorAtom)?.operation).toBe("load");
  });

  it("saves the Profile after the load records an Achievement", async () => {
    const registry = AtomRegistry.make();
    const saves: Profile[] = [];
    const profile = { ...newProfile(9), stageResults: { "1-10": 3 } };
    const attached = attach(
      registry,
      runner({
        load: () => Promise.resolve(Result.succeed(profile)),
        save: (next) => saves.push(next),
      })
    );

    await attached.ready;

    expect(saves).toHaveLength(1);
    expect(saves[0]?.completedAchievements).toContain("campaign.hearthvale");
  });

  it("replaces the Profile and clears the dev overlay", async () => {
    const registry = AtomRegistry.make();
    const saves: Profile[] = [];
    const imported = { ...newProfile(11), coin: 900 };
    const attached = attach(
      registry,
      runner({
        load: () =>
          Promise.resolve(Result.succeed({ ...newProfile(5), coin: 20 })),
        save: (next) => saves.push(next),
      })
    );

    await attached.ready;
    registry.set(profileOverlayAtom, { coin: 99 });
    expect(registry.get(replaceProfileAtom)).toBeNull();
    registry.set(replaceProfileAtom, imported);

    expect(registry.get(profileOverlayAtom)).toBeNull();
    expect(registry.get(profileStateAtom)).toEqual({
      status: "ready",
      profile: imported,
    });
    expect(saves).toEqual([imported]);
  });

  it("reports a failed save and stops after dispose", async () => {
    const registry = AtomRegistry.make();
    let onError:
      | ((error: KeyValueStore.KeyValueStoreError) => void)
      | undefined;
    const capture = (
      callback: (error: KeyValueStore.KeyValueStoreError) => void
    ) => {
      onError = callback;
      return () => {
        onError = undefined;
      };
    };
    const attached = attach(registry, runner({ errors: capture }));

    await attached.ready;
    const error = new KeyValueStore.KeyValueStoreError({
      message: "quota",
      method: "set",
    });
    onError?.(error);

    expect(registry.get(profileStoreErrorAtom)).toEqual({
      cause: error,
      operation: "save",
    });

    attached.dispose();
    expect(onError).toBeUndefined();
  });

  it("ignores a load that finishes after dispose", async () => {
    const registry = AtomRegistry.make();
    const load =
      Promise.withResolvers<Result.Result<Profile | null, ImportError>>();
    const attached = attach(registry, runner({ load: () => load.promise }));

    attached.dispose();
    load.resolve(Result.succeed({ ...newProfile(5), coin: 20 }));
    await load.promise;
    await attached.ready;

    expect(registry.get(profileStateAtom)).toEqual({ status: "loading" });
  });

  it("starts a new Player when the store throws", async () => {
    const registry = AtomRegistry.make();
    const attached = attach(
      registry,
      runner({ load: () => Promise.reject(new Error("blocked")) })
    );

    await attached.ready;

    expect(registry.get(profileStateAtom).status).toBe("ready");
    expect(registry.get(profileStoreErrorAtom)?.operation).toBe("load");
  });

  it("does not load when the Profile is ready", async () => {
    const registry = AtomRegistry.make();
    const profile = { ...newProfile(5), coin: 20 };
    registry.set(profileStateAtom, { status: "ready", profile });
    let loads = 0;
    const attached = attach(
      registry,
      runner({
        load: () => {
          loads += 1;
          return Promise.resolve(Result.succeed(profile));
        },
      })
    );

    await attached.ready;

    expect(loads).toBe(0);
  });
});
