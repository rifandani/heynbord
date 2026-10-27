import type { Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";
import { Deferred, Effect, Layer, Schedule } from "effect";
import { KeyValueStore } from "effect/persistence";
import { Atom, AtomRegistry } from "effect/reactivity";
import { describe, expect, it, vi } from "vitest";

import { PROFILE_KEY, profileRecord } from "@/features/profile/profile";
import {
  makeProfileStoreAtoms,
  profileSaved,
  profileStoreErrorAtom,
  replaceProfileAtom,
} from "@/features/profile/profile-store.atoms";
import type { ProfileStoreAtoms } from "@/features/profile/profile-store.atoms";
import { ProfileStore } from "@/features/profile/profile-store.service";
import { startProfileStore } from "@/features/profile/profile-store.start";
import {
  profileAtom,
  profileOverlayAtom,
  profileStateAtom,
} from "@/features/profile/profile.atoms";

/** A retry schedule with no retry, so a failed save reports at once. */
const noRetry = Schedule.recurs(0).pipe(
  Schedule.setInputType<KeyValueStore.KeyValueStoreError>()
);

interface TestStore {
  readonly store: KeyValueStore.KeyValueStore;
  readonly writes: string[];
  readonly reads: () => number;
  readonly setGetFail: (fail: boolean) => void;
  readonly setSetFail: (fail: boolean) => void;
}

/** A memory store that records its writes and can fail a read or a write. */
const makeStore = (): TestStore => {
  const memory = Effect.runSync(
    Effect.gen(function* () {
      return yield* KeyValueStore.KeyValueStore;
    }).pipe(Effect.provide(KeyValueStore.layerMemory))
  );
  const writes: string[] = [];
  let reads = 0;
  let getFail = false;
  let setFail = false;
  const store = KeyValueStore.make({
    ...memory,
    get: (key) => {
      reads += 1;
      return getFail
        ? Effect.fail(
            new KeyValueStore.KeyValueStoreError({
              message: "blocked",
              method: "get",
            })
          )
        : memory.get(key);
    },
    set: (key, value) => {
      if (setFail) {
        return Effect.fail(
          new KeyValueStore.KeyValueStoreError({
            message: "quota",
            method: "set",
          })
        );
      }
      if (!(value instanceof Uint8Array)) {
        writes.push(value);
      }
      return memory.set(key, value);
    },
  });
  return {
    reads: () => reads,
    setGetFail: (fail) => {
      getFail = fail;
    },
    setSetFail: (fail) => {
      setFail = fail;
    },
    store,
    writes,
  };
};

const runtimeFor = (
  store: KeyValueStore.KeyValueStore,
  retrySchedule = noRetry
) =>
  Atom.runtime(
    ProfileStore.layerWith({ retrySchedule }).pipe(
      Layer.provide(Layer.succeed(KeyValueStore.KeyValueStore, store))
    )
  );

const start = (registry: AtomRegistry.AtomRegistry, atoms: ProfileStoreAtoms) =>
  startProfileStore(registry, atoms, {
    removeLegacyKeys: () => {},
  });

const seed = async (store: KeyValueStore.KeyValueStore, profile: Profile) => {
  await Effect.runPromise(store.set(PROFILE_KEY, profileRecord(profile)));
};

/** Waits for the Profile write queue, then returns. */
const waitSaved = (
  registry: AtomRegistry.AtomRegistry,
  atoms: ProfileStoreAtoms
) => {
  registry.set(atoms.saved, Atom.Reset);
  registry.set(atoms.saved, undefined);
  return Effect.runPromise(AtomRegistry.getResult(registry, atoms.saved));
};

describe("startProfileStore", () => {
  it("loads once, then saves each change", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    const profile = { ...newProfile(5), coin: 20 };
    await seed(test.store, profile);
    test.writes.length = 0;
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    const started = start(registry, atoms);

    await started.ready;

    expect(test.reads()).toBe(1);
    expect(registry.get(profileStateAtom)).toEqual({
      status: "ready",
      profile,
    });
    expect(test.writes).toEqual([]);

    const next = { ...profile, coin: 21 };
    registry.set(profileAtom, next);
    await waitSaved(registry, atoms);
    expect(test.writes).toHaveLength(1);
    expect(JSON.parse(test.writes[0] ?? "{}")).toMatchObject({ coin: 21 });

    registry.set(profileAtom, next);
    await waitSaved(registry, atoms);
    expect(test.writes).toHaveLength(1);

    registry.set(profileStateAtom, { status: "loading" });
    await waitSaved(registry, atoms);
    expect(test.writes).toHaveLength(1);

    started.dispose();
    registry.set(profileAtom, { ...profile, coin: 22 });
    await waitSaved(registry, atoms);
    expect(test.writes).toHaveLength(1);

    registry.dispose();
  });

  it("starts a new Player and reports a load that fails", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    await Effect.runPromise(test.store.set(PROFILE_KEY, "not json"));
    test.writes.length = 0;
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    const started = start(registry, atoms);

    await started.ready;

    expect(registry.get(profileStateAtom).status).toBe("ready");
    expect(test.writes).toEqual([]);
    expect(registry.get(profileStoreErrorAtom)?.operation).toBe("load");

    registry.dispose();
  });

  it("saves the Profile after the load records an Achievement", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    const profile = { ...newProfile(9), stageResults: { "1-10": 3 } };
    await seed(test.store, profile);
    test.writes.length = 0;
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    const started = start(registry, atoms);

    await started.ready;

    expect(test.writes).toHaveLength(1);
    expect(JSON.parse(test.writes[0] ?? "{}").completedAchievements).toContain(
      "campaign.hearthvale"
    );

    registry.dispose();
  });

  it("replaces the Profile and clears the dev overlay", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    await seed(test.store, { ...newProfile(5), coin: 20 });
    test.writes.length = 0;
    const imported = { ...newProfile(11), coin: 900 };
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    const started = start(registry, atoms);

    await started.ready;
    registry.set(profileOverlayAtom, { coin: 99 });
    expect(registry.get(replaceProfileAtom)).toBeNull();
    registry.set(replaceProfileAtom, imported);
    await waitSaved(registry, atoms);

    expect(registry.get(profileOverlayAtom)).toBeNull();
    expect(registry.get(profileStateAtom)).toEqual({
      status: "ready",
      profile: imported,
    });
    expect(test.writes).toHaveLength(1);
    expect(JSON.parse(test.writes[0] ?? "{}")).toMatchObject({ coin: 900 });

    registry.dispose();
  });

  it("reports a failed save", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    const loaded = { ...newProfile(5), coin: 20 };
    await seed(test.store, loaded);
    test.writes.length = 0;
    test.setSetFail(true);
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    const started = start(registry, atoms);

    await started.ready;
    registry.set(profileAtom, { ...loaded, coin: 21 });
    const error = await Effect.runPromise(
      AtomRegistry.getResult(registry, atoms.errors)
    );

    expect(error).toBeInstanceOf(KeyValueStore.KeyValueStoreError);
    await vi.waitFor(() => {
      expect(registry.get(profileStoreErrorAtom)?.operation).toBe("save");
    });

    started.dispose();
    registry.dispose();
  });

  it("starts a new Player when the store fails", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    test.setGetFail(true);
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    const started = start(registry, atoms);

    await started.ready;

    expect(registry.get(profileStateAtom).status).toBe("ready");
    expect(registry.get(profileStoreErrorAtom)?.operation).toBe("load");

    registry.dispose();
  });

  it("does not load when the Profile is ready", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    const profile = { ...newProfile(5), coin: 20 };
    registry.set(profileStateAtom, { status: "ready", profile });
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    const started = start(registry, atoms);

    await started.ready;

    expect(test.reads()).toBe(0);

    registry.dispose();
  });

  it("does not wait for a write without IndexedDB", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));

    await expect(profileSaved(registry, atoms)).resolves.toBeUndefined();

    registry.dispose();
  });

  it("waits for the write queue with IndexedDB", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    const atoms = makeProfileStoreAtoms(runtimeFor(test.store));
    vi.stubGlobal("window", { indexedDB: {} });

    try {
      await expect(profileSaved(registry, atoms)).resolves.toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
      registry.dispose();
    }
  });

  it("ignores a load that finishes after dispose", async () => {
    const registry = AtomRegistry.make();
    const test = makeStore();
    const profile = { ...newProfile(5), coin: 20 };
    const startedGet = Effect.runSync(Deferred.make<boolean>());
    const gate = Effect.runSync(Deferred.make<string | undefined>());
    const atoms = makeProfileStoreAtoms(
      Atom.runtime(
        ProfileStore.layerWith({ retrySchedule: noRetry }).pipe(
          Layer.provide(
            Layer.succeed(KeyValueStore.KeyValueStore, {
              ...test.store,
              get: () =>
                Effect.gen(function* () {
                  yield* Deferred.succeed(startedGet, true);
                  return yield* Deferred.await(gate);
                }),
            })
          )
        )
      )
    );
    const started = start(registry, atoms);

    await Effect.runPromise(Deferred.await(startedGet));
    started.dispose();
    Effect.runSync(Deferred.succeed(gate, profileRecord(profile)));
    await Effect.runPromise(AtomRegistry.getResult(registry, atoms.load));

    expect(registry.get(profileStateAtom)).toEqual({ status: "loading" });

    registry.dispose();
  });
});
