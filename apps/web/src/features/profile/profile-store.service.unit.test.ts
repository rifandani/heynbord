import { describe, expect, it } from "@effect/vitest";
import { newProfile } from "@workspace/rules";
import { Deferred, Effect, Exit, Ref, Result, Schedule, Stream } from "effect";
import { KeyValueStore } from "effect/persistence";

import { ProfileStore } from "@/features/profile/profile-store.service";

const withStore = <A, E>(effect: Effect.Effect<A, E, ProfileStore>) =>
  effect.pipe(
    Effect.provide(ProfileStore.layer),
    Effect.provide(KeyValueStore.layerMemory)
  );

describe("ProfileStore", () => {
  const retrySchedule = Schedule.recurs(2).pipe(
    Schedule.setInputType<KeyValueStore.KeyValueStoreError>()
  );

  it.effect("loads null with no record, then the saved Profile", () =>
    withStore(
      Effect.gen(function* () {
        const store = yield* ProfileStore;

        expect(yield* store.saved()).toBeUndefined();
        expect(yield* store.load()).toEqual(Result.succeed(null));

        const profile = { ...newProfile(7), coin: 180 };
        yield* store.save(profile);
        yield* store.saved();

        expect(yield* store.load()).toEqual(Result.succeed(profile));
      })
    )
  );

  it.effect("writes one Profile at a time, and the newest Profile last", () =>
    Effect.gen(function* () {
      const base = yield* KeyValueStore.KeyValueStore;
      const started = yield* Deferred.make<unknown>();
      const gate = yield* Deferred.make<unknown>();
      const writes = yield* Ref.make<readonly number[]>([]);
      const store = KeyValueStore.make({
        ...base,
        set: (key, value) =>
          Effect.gen(function* () {
            yield* Deferred.done(started, Exit.void).pipe(Effect.ignore);
            yield* Deferred.await(gate);
            yield* base.set(key, value);
            if (value instanceof Uint8Array) {
              return;
            }
            // SAFETY: `profileRecord` writes the Profile as JSON, so `coin` is a number.
            const { coin } = JSON.parse(value) as { readonly coin: number };
            yield* Ref.update(writes, (all) => [...all, coin]);
          }),
      });

      yield* Effect.gen(function* () {
        const profileStore = yield* ProfileStore;

        yield* profileStore.save({ ...newProfile(1), coin: 1 });
        yield* Deferred.await(started);
        yield* profileStore.save({ ...newProfile(1), coin: 2 });
        yield* profileStore.save({ ...newProfile(1), coin: 3 });
        yield* Deferred.done(gate, Exit.void);
        yield* profileStore.saved();

        expect(yield* Ref.get(writes)).toEqual([1, 3]);
      }).pipe(
        Effect.provide(ProfileStore.layer),
        Effect.provideService(KeyValueStore.KeyValueStore, store)
      );
    }).pipe(Effect.provide(KeyValueStore.layerMemory))
  );

  it.effect("retries a failed save, then writes it", () =>
    Effect.gen(function* () {
      const base = yield* KeyValueStore.KeyValueStore;
      const attempts = yield* Ref.make(0);
      const store = KeyValueStore.make({
        ...base,
        set: (key, value) =>
          Effect.gen(function* () {
            const attempt = yield* Ref.updateAndGet(attempts, (n) => n + 1);
            if (attempt <= 2) {
              return yield* Effect.fail(
                new KeyValueStore.KeyValueStoreError({
                  message: "quota",
                  method: "set",
                })
              );
            }
            yield* base.set(key, value);
          }),
      });

      yield* Effect.gen(function* () {
        const profileStore = yield* ProfileStore;
        const profile = { ...newProfile(2), coin: 12 };

        yield* profileStore.save(profile);
        yield* profileStore.saved();

        expect(yield* Ref.get(attempts)).toBe(3);
        expect(yield* profileStore.load()).toEqual(Result.succeed(profile));
      }).pipe(
        Effect.provide(ProfileStore.layerWith({ retrySchedule })),
        Effect.provideService(KeyValueStore.KeyValueStore, store)
      );
    }).pipe(Effect.provide(KeyValueStore.layerMemory))
  );

  it.effect("reports a save that still fails, and keeps the queue", () =>
    Effect.gen(function* () {
      const base = yield* KeyValueStore.KeyValueStore;
      const attempts = yield* Ref.make(0);
      const store = KeyValueStore.make({
        ...base,
        set: () =>
          Effect.gen(function* () {
            yield* Ref.update(attempts, (n) => n + 1);
            return yield* Effect.fail(
              new KeyValueStore.KeyValueStoreError({
                message: "quota",
                method: "set",
              })
            );
          }),
      });

      yield* Effect.gen(function* () {
        const profileStore = yield* ProfileStore;

        yield* profileStore.save({ ...newProfile(3), coin: 1 });
        yield* profileStore.saved();

        expect(yield* Ref.get(attempts)).toBe(3);
        const errors = yield* profileStore.errors.pipe(
          Stream.take(1),
          Stream.runCollect
        );
        expect(errors.length).toBe(1);
      }).pipe(
        Effect.provide(ProfileStore.layerWith({ retrySchedule })),
        Effect.provideService(KeyValueStore.KeyValueStore, store)
      );
    }).pipe(Effect.provide(KeyValueStore.layerMemory))
  );
});
