import { describe, expect, it, vi } from "@effect/vitest";
import { Deferred, Effect, Fiber } from "effect";

import { Audio, DEFAULT_MIX } from "@/core/audio/audio.service";
import { fakeLoad, makeFakeAudio } from "@/core/audio/testing";

const FILES = [
  { url: "/story/music.mp3", bus: "music" },
  { url: "/story/river.mp3", bus: "effects" },
] as const;

const service = Effect.gen(function* () {
  return yield* Audio;
});

describe("presentation audio ownership", () => {
  it.effect(
    "stops the screen loop, applies the Mix to both channels, and restores the latest loop on exit",
    () =>
      Effect.gen(function* () {
        const fake = makeFakeAudio();
        const audio = yield* service.pipe(
          Effect.provide(
            Audio.layerWith({ context: fake.context, load: fakeLoad() })
          )
        );
        yield* audio.music("town");
        const [loop] = fake.sources;
        if (!loop) {
          throw new Error("No screen loop");
        }
        const stop = vi.spyOn(loop, "stop");
        yield* audio.presentation(FILES);
        expect(stop).toHaveBeenCalled();
        expect(fake.sources).toHaveLength(3);
        yield* audio.setMix({
          ...DEFAULT_MIX,
          musicOn: false,
          effectsVolume: 50,
        });
        expect(fake.gains[1]?.gain.value).toBe(0.25);
        expect(fake.gains[2]?.gain.value).toBe(0);
        yield* audio.music("hero");
        expect(fake.sources).toHaveLength(3);
        const stops = fake.sources
          .slice(1)
          .map((source) => vi.spyOn(source, "stop"));
        yield* audio.presentation(null);
        for (const stopped of stops) {
          expect(stopped).toHaveBeenCalled();
        }
        expect(fake.sources).toHaveLength(4);
      })
  );

  it.effect("does not start files that finish loading after exit", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const gate = yield* Deferred.make<null>();
      const audio = yield* service.pipe(
        Effect.provide(
          Audio.layerWith({
            context: fake.context,
            load: (url) =>
              Deferred.await(gate).pipe(Effect.flatMap(() => fakeLoad()(url))),
          })
        )
      );
      const loading = yield* audio.presentation(FILES).pipe(Effect.forkScoped);
      yield* Effect.yieldNow;
      yield* audio.presentation(null);
      yield* Deferred.succeed(gate, null);
      yield* Fiber.join(loading);
      expect(fake.sources).toHaveLength(0);
    })
  );

  it.effect(
    "does not duplicate loading files when the next gesture unlocks audio",
    () =>
      Effect.gen(function* () {
        const fake = makeFakeAudio();
        const gate = yield* Deferred.make<null>();
        const audio = yield* service.pipe(
          Effect.provide(
            Audio.layerWith({
              context: fake.context,
              load: (url) =>
                Deferred.await(gate).pipe(
                  Effect.flatMap(() => fakeLoad()(url))
                ),
            })
          )
        );
        const loading = yield* audio
          .presentation(FILES)
          .pipe(Effect.forkScoped);
        yield* Effect.yieldNow;
        yield* audio.unlock();
        yield* Deferred.succeed(gate, null);
        yield* Fiber.join(loading);
        expect(fake.sources).toHaveLength(2);
      })
  );

  it.effect(
    "cancels a paper cue that is loading when the Player leaves its moment",
    () =>
      Effect.gen(function* () {
        const fake = makeFakeAudio();
        const gate = yield* Deferred.make<null>();
        const audio = yield* service.pipe(
          Effect.provide(
            Audio.layerWith({
              context: fake.context,
              load: (url) =>
                url.includes("paper")
                  ? Deferred.await(gate).pipe(
                      Effect.flatMap(() => fakeLoad()(url))
                    )
                  : fakeLoad()(url),
            })
          )
        );
        yield* audio.presentation(FILES);
        const cue = yield* audio
          .cue([{ url: "/story/paper.mp3", bus: "effects", delaySeconds: 0.5 }])
          .pipe(Effect.forkScoped);
        yield* Effect.yieldNow;
        yield* audio.cue(null);
        yield* Deferred.succeed(gate, null);
        yield* Fiber.join(cue);
        expect(fake.sources).toHaveLength(2);
      })
  );

  it.effect("plays every cue of a moment and stops them all on the next", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(
        Effect.provide(
          Audio.layerWith({ context: fake.context, load: fakeLoad() })
        )
      );
      yield* audio.presentation(FILES);
      yield* audio.cue([
        { url: "/story/thunder.mp3", bus: "effects", delaySeconds: 2.85 },
        { url: "/story/drum.mp3", bus: "effects", delaySeconds: 3.05 },
      ]);
      expect(fake.sources).toHaveLength(4);
      const stops = fake.sources
        .slice(2)
        .map((source) => vi.spyOn(source, "stop"));
      yield* audio.cue(null);
      for (const stopped of stops) {
        expect(stopped).toHaveBeenCalled();
      }
    })
  );

  it.effect(
    "plays the available effects when music fails, and remains usable with no AudioContext",
    () =>
      Effect.gen(function* () {
        const fake = makeFakeAudio();
        const audio = yield* service.pipe(
          Effect.provide(
            Audio.layerWith({
              context: fake.context,
              load: (url) =>
                url.includes("music") ? Effect.succeed(null) : fakeLoad()(url),
            })
          )
        );
        yield* audio.presentation(FILES);
        expect(fake.sources).toHaveLength(1);
        yield* audio.presentation(null);
        const silent = yield* service.pipe(
          Effect.provide(Audio.layerWith({ context: null, load: fakeLoad() }))
        );
        yield* silent.presentation(FILES);
        yield* silent.cue([{ url: "/paper.mp3", bus: "effects" }]);
        yield* silent.presentation(null);
      })
  );
});
