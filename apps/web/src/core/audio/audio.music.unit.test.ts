import { describe, expect, it } from "@effect/vitest";
import { Deferred, Effect, Fiber } from "effect";

import { Audio } from "@/core/audio/audio.service";
import { fakeLoad, makeFakeAudio } from "@/core/audio/testing";

const withAudio = (fake: ReturnType<typeof makeFakeAudio>) =>
  Audio.layerWith({ context: fake.context, load: fakeLoad() });

const service = Effect.gen(function* () {
  return yield* Audio;
});

describe("Audio music", () => {
  it.effect("starts one loop", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.music("town");

      expect(fake.sources).toHaveLength(1);
    })
  );

  it.effect("keeps the loop that already plays", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.music("town");
      yield* audio.music("town");

      expect(fake.sources).toHaveLength(1);
    })
  );

  it.effect("fades the old loop when the track changes", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.music("town");
      yield* audio.music("workshop");

      expect(fake.sources).toHaveLength(2);
      expect(
        fake.gains[3]?.gain.calls.some(
          (call) => call.kind === "linear" && call.value === 0
        )
      ).toBe(true);
    })
  );

  it.effect("ducks the loop for a sting, then restores it", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.music("town");
      yield* audio.sting("victory");

      expect(fake.sources).toHaveLength(2);
      expect(
        fake.gains[3]?.gain.calls.some(
          (call) => call.kind === "linear" && call.value === 0
        )
      ).toBe(true);

      fake.sources[1]?.end();

      expect(
        fake.gains[3]?.gain.calls.some(
          (call) => call.kind === "linear" && call.value === 1
        )
      ).toBe(true);
    })
  );

  it.effect("does not start a loop that did not load", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(
        Effect.provide(
          Audio.layerWith({
            context: fake.context,
            load: () => Effect.succeed(null),
          })
        )
      );

      yield* audio.music("town");

      expect(fake.sources).toHaveLength(0);
    })
  );

  it.effect("does not play a sting that did not load", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(
        Effect.provide(
          Audio.layerWith({
            context: fake.context,
            load: () => Effect.succeed(null),
          })
        )
      );

      yield* audio.sting("victory");

      expect(fake.sources).toHaveLength(0);
    })
  );

  it.effect("stops the old sting, and restores the loop after the newest", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.music("town");
      yield* audio.sting("victory");
      yield* audio.sting("defeat");

      expect(fake.sources).toHaveLength(3);

      fake.sources[1]?.end();
      fake.sources[2]?.end();

      expect(
        fake.gains[3]?.gain.calls.some(
          (call) => call.kind === "linear" && call.value === 1
        )
      ).toBe(true);
    })
  );

  it.effect("plays a sting over silence, and restores nothing", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.sting("victory");
      expect(fake.sources).toHaveLength(1);

      fake.sources[0]?.end();
    })
  );

  it.effect("starts a loop under a sting at gain 0", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.sting("victory");
      yield* audio.music("town");

      expect(fake.sources).toHaveLength(2);
      // Master, effects and music, then the sting, then the loop.
      expect(
        fake.gains[4]?.gain.calls.some(
          (call) => call.kind === "linear" && call.value === 0
        )
      ).toBe(true);
    })
  );

  it.effect("does not start a track that a newer request replaced", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const gate = yield* Deferred.make<null>();
      const base = fakeLoad();
      const audio = yield* service.pipe(
        Effect.provide(
          Audio.layerWith({
            context: fake.context,
            load: (url) =>
              Deferred.await(gate).pipe(Effect.flatMap(() => base(url))),
          })
        )
      );

      const first = yield* audio.music("town").pipe(Effect.forkScoped);
      yield* Effect.yieldNow;
      const second = yield* audio.music("workshop").pipe(Effect.forkScoped);
      yield* Effect.yieldNow;

      yield* Deferred.succeed(gate, null);
      yield* Fiber.join(first);
      yield* Fiber.join(second);

      expect(fake.sources).toHaveLength(1);
    })
  );
});
