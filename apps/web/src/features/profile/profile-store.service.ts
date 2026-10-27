import type { ImportError, Profile } from "@workspace/rules";
import {
  Context,
  Deferred,
  Effect,
  Exit,
  Layer,
  Option,
  PubSub,
  Ref,
  Schedule,
  Stream,
} from "effect";
import type { Result } from "effect";
import { KeyValueStore } from "effect/persistence";

import {
  PROFILE_KEY,
  profileRecord,
  readRecord,
} from "@/features/profile/profile";

/** The retry policy of one save of the Profile. */
type RetrySchedule = Schedule.Schedule<
  unknown,
  KeyValueStore.KeyValueStoreError
>;

/** The pending Profile and the drain that writes it. */
interface SaveState {
  readonly drain: Option.Option<Deferred.Deferred<unknown>>;
  readonly pending: Option.Option<Profile>;
}

/** Two retries over a short backoff. A save is idempotent: it writes a full snapshot. */
const retrySchedule: RetrySchedule = Schedule.exponential("50 millis").pipe(
  Schedule.upTo({ times: 2 }),
  Schedule.setInputType<KeyValueStore.KeyValueStoreError>()
);

/**
 * The saved Profile: one write at a time, and the newest waiting Profile
 * replaces the older waiting one (technical design 5). A failed write is
 * published on `errors` and does not stop the queue.
 */
export class ProfileStore extends Context.Service<
  ProfileStore,
  {
    /** Reads and migrates the record. It does not change it. */
    readonly load: () => Effect.Effect<
      Result.Result<Profile | null, ImportError>,
      KeyValueStore.KeyValueStoreError
    >;
    /** Queues a full snapshot. The newest queued snapshot wins. */
    readonly save: (profile: Profile) => Effect.Effect<void>;
    /** Resolves when no write is waiting or running. */
    readonly saved: () => Effect.Effect<void>;
    /** The failed writes, after their retries. */
    readonly errors: Stream.Stream<KeyValueStore.KeyValueStoreError>;
  }
>()("@heynbord/web/ProfileStore") {
  static readonly layer = ProfileStore.layerWith({ retrySchedule });

  static layerWith(options: { readonly retrySchedule: RetrySchedule }) {
    return Layer.effect(
      ProfileStore,
      Effect.gen(function* () {
        const store = yield* KeyValueStore.KeyValueStore;
        const scope = yield* Effect.scope;
        const errors =
          yield* PubSub.unbounded<KeyValueStore.KeyValueStoreError>({
            replay: 1,
          });
        yield* Effect.addFinalizer(() => PubSub.shutdown(errors));

        const state = yield* Ref.make<SaveState>({
          drain: Option.none(),
          pending: Option.none(),
        });

        const publishError = (error: KeyValueStore.KeyValueStoreError) =>
          PubSub.publish(errors, error);

        const write = (profile: Profile) =>
          store
            .set(PROFILE_KEY, profileRecord(profile))
            .pipe(
              Effect.retry(options.retrySchedule),
              Effect.tapError(publishError)
            );

        const drainLoop = Effect.gen(function* () {
          while (true) {
            const next = yield* Ref.modify(state, (current) =>
              Option.isSome(current.pending)
                ? ([
                    current.pending,
                    { ...current, pending: Option.none() },
                  ] as const)
                : ([
                    Option.none<Profile>(),
                    { ...current, drain: Option.none() },
                  ] as const)
            );
            if (Option.isNone(next)) {
              return;
            }
            yield* write(next.value).pipe(Effect.ignore);
          }
        });

        const kick = Effect.gen(function* () {
          const drain = yield* Deferred.make<unknown>();
          const claimed = yield* Ref.modify(state, (current) =>
            Option.isSome(current.drain)
              ? ([false, current] as const)
              : ([true, { ...current, drain: Option.some(drain) }] as const)
          );
          if (!claimed) {
            return;
          }
          yield* drainLoop.pipe(
            Effect.ensuring(
              Deferred.done(drain, Exit.void).pipe(Effect.ignore)
            ),
            Effect.forkIn(scope)
          );
        });

        const load = Effect.fn("ProfileStore.load")(function* () {
          return readRecord(yield* store.get(PROFILE_KEY));
        });

        const save = Effect.fn("ProfileStore.save")(function* (
          profile: Profile
        ) {
          yield* Ref.update(state, (current) => ({
            ...current,
            pending: Option.some(profile),
          }));
          yield* kick;
        });

        const saved = Effect.fn("ProfileStore.saved")(function* () {
          const current = yield* Ref.get(state);
          if (Option.isSome(current.drain)) {
            yield* Deferred.await(current.drain.value);
          }
        });

        return ProfileStore.of({
          errors: Stream.fromPubSub(errors),
          load,
          save,
          saved,
        });
      })
    );
  }
}
