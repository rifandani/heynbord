import type { ImportError, Profile } from "@workspace/rules";
import { Effect } from "effect";
import type { Result } from "effect";
import { KeyValueStore } from "effect/persistence";

import {
  PROFILE_KEY,
  profileRecord,
  readRecord,
} from "@/features/profile/profile";

/**
 * Reads the saved Profile and migrates it (technical design 5): `null` when
 * there is no record, a failure when the record cannot load. It does not
 * change the record.
 */
export const loadProfile: Effect.Effect<
  Result.Result<Profile | null, ImportError>,
  KeyValueStore.KeyValueStoreError,
  KeyValueStore.KeyValueStore
> = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore;
  return readRecord(yield* store.get(PROFILE_KEY));
});

/** Writes the Profile over the saved record. */
export const saveProfile = (
  profile: Profile
): Effect.Effect<
  void,
  KeyValueStore.KeyValueStoreError,
  KeyValueStore.KeyValueStore
> =>
  Effect.gen(function* () {
    const store = yield* KeyValueStore.KeyValueStore;
    yield* store.set(PROFILE_KEY, profileRecord(profile));
  });
