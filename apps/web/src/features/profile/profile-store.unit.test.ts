import { describe, expect, it } from "@effect/vitest";
import { newProfile } from "@workspace/rules";
import { Effect, Result } from "effect";
import { KeyValueStore } from "effect/persistence";

import { PROFILE_KEY } from "@/features/profile/profile";
import { loadProfile, saveProfile } from "@/features/profile/profile-store";

describe("Profile store", () => {
  it.effect("loads null with no record, then the saved Profile", () =>
    Effect.gen(function* () {
      expect(yield* loadProfile).toEqual(Result.succeed(null));
      const profile = { ...newProfile(7), coin: 180 };
      yield* saveProfile(profile);
      expect(yield* loadProfile).toEqual(Result.succeed(profile));
    }).pipe(Effect.provide(KeyValueStore.layerMemory))
  );

  it.effect("keeps a record that does not load", () =>
    Effect.gen(function* () {
      const store = yield* KeyValueStore.KeyValueStore;
      yield* store.set(PROFILE_KEY, "{broken");
      const loaded = yield* loadProfile;
      expect(Result.isFailure(loaded) && loaded.failure._tag).toBe(
        "UnreadableFile"
      );
      expect(yield* store.get(PROFILE_KEY)).toBe("{broken");
    }).pipe(Effect.provide(KeyValueStore.layerMemory))
  );
});
