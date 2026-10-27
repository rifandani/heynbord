import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { Audio, DEFAULT_MIX } from "@/core/audio/audio.service";
import { fakeLoad, makeFakeAudio } from "@/core/audio/testing";

const withAudio = (fake: ReturnType<typeof makeFakeAudio>) =>
  Audio.layerWith({ context: fake.context, load: fakeLoad() });

const service = Effect.gen(function* () {
  return yield* Audio;
});

describe("Audio", () => {
  it.effect("plays a sound on the effects channel", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.play("select");

      // The master, effects and music gains, then the gain of the tone.
      expect(fake.gains).toHaveLength(4);
    })
  );

  it.effect("plays the same sound at most once in the min gap", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.play("select");
      yield* audio.play("select");

      expect(fake.gains).toHaveLength(4);
    })
  );

  it.effect("does not play when the Sound switch is off", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.setMix({ ...DEFAULT_MIX, soundOn: false });
      yield* audio.play("select");

      expect(fake.gains).toHaveLength(3);
    })
  );

  it.effect("does not play when the effects volume is 0", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.setMix({ ...DEFAULT_MIX, effectsVolume: 0 });
      yield* audio.play("select");

      expect(fake.gains).toHaveLength(3);
    })
  );

  it.effect("applies the Mix to the three channels", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.setMix({
        ...DEFAULT_MIX,
        effectsVolume: 25,
        musicOn: false,
        musicVolume: 40,
        soundOn: false,
        soundVolume: 50,
      });

      expect(fake.gains[0]?.gain.value).toBe(0);
      expect(fake.gains[1]?.gain.value).toBe(0.0625);
      expect(fake.gains[2]?.gain.value).toBe(0);
    })
  );

  it.effect("clamps a volume outside 0 to 100", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.setMix({
        ...DEFAULT_MIX,
        effectsVolume: 150,
        musicVolume: -10,
        soundVolume: 150,
      });

      expect(fake.gains[1]?.gain.value).toBe(1);
      expect(fake.gains[2]?.gain.value).toBe(0);
    })
  );

  it.effect("gives a silent service with no AudioContext", () =>
    Effect.gen(function* () {
      const audio = yield* service.pipe(
        Effect.provide(Audio.layerWith({ context: null, load: fakeLoad() }))
      );

      yield* audio.play("select");
      yield* audio.music("town");
      yield* audio.sting("victory");
      yield* audio.setMix(DEFAULT_MIX);
      yield* audio.unlock();
    })
  );

  it.effect("waits for unlock, then starts the requested track", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio({ state: "suspended" });
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.music("town");
      expect(fake.sources).toHaveLength(0);

      yield* audio.unlock();
      expect(fake.sources).toHaveLength(1);
    })
  );

  it.effect("keeps playing silence when the context cannot resume", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio({
        resume: () => Promise.reject(new Error("blocked")),
        state: "suspended",
      });
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.unlock();

      expect(fake.sources).toHaveLength(0);
    })
  );

  it.effect("does nothing on unlock when the context already runs", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      const audio = yield* service.pipe(Effect.provide(withAudio(fake)));

      yield* audio.unlock();

      expect(fake.sources).toHaveLength(0);
    })
  );
});
