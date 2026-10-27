import { afterEach, describe, expect, it, vi } from "@effect/vitest";
import { server } from "@test/msw";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { http, HttpResponse } from "msw";

import { Audio } from "@/core/audio/audio.service";
import { makeFakeAudio } from "@/core/audio/testing";
import { AppConfig } from "@/core/config/app-config";

const config = AppConfig.of({
  assetBaseUrl: "https://cdn.example.com/",
  title: "Heynbord",
  url: "https://heynbord.com",
});

const layer = Audio.layer.pipe(
  Layer.provide(
    Layer.mergeAll(FetchHttpClient.layer, Layer.succeed(AppConfig, config))
  )
);

const withLayer = Effect.gen(function* () {
  return yield* Audio;
}).pipe(Effect.provide(layer));

const stubAudioContext = (context: AudioContext) => {
  // oxlint-disable-next-line eslint/prefer-arrow-callback -- a constructor cannot be an arrow function
  vi.stubGlobal("AudioContext", function FakeAudioContext() {
    return context;
  });
};

const clearAudioContext = () => {
  Reflect.deleteProperty(globalThis, "AudioContext");
};

afterEach(clearAudioContext);

describe("Audio.layer", () => {
  it.effect("loads a music file over HttpClient and starts the loop", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      stubAudioContext(fake.context);
      server.use(
        http.get(
          "https://cdn.example.com/music/town.ogg",
          () => new HttpResponse(new ArrayBuffer(8))
        )
      );

      const audio = yield* withLayer;
      yield* audio.music("town");

      expect(fake.sources).toHaveLength(1);
    })
  );

  it.effect("does not start a loop when the file fails", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio();
      stubAudioContext(fake.context);
      server.use(
        http.get(
          "https://cdn.example.com/music/town.ogg",
          () => new HttpResponse(null, { status: 404 })
        )
      );

      const audio = yield* withLayer;
      yield* audio.music("town");

      expect(fake.sources).toHaveLength(0);
    })
  );

  it.effect("does not start a loop when the file does not decode", () =>
    Effect.gen(function* () {
      const fake = makeFakeAudio({
        decode: () => Promise.reject(new Error("bad audio")),
      });
      stubAudioContext(fake.context);
      server.use(
        http.get(
          "https://cdn.example.com/music/town.ogg",
          () => new HttpResponse(new ArrayBuffer(8))
        )
      );

      const audio = yield* withLayer;
      yield* audio.music("town");

      expect(fake.sources).toHaveLength(0);
    })
  );

  it.effect("gives a silent service when the AudioContext cannot start", () =>
    Effect.gen(function* () {
      // oxlint-disable-next-line eslint/prefer-arrow-callback -- a constructor cannot be an arrow function
      vi.stubGlobal("AudioContext", function BlockedAudioContext() {
        throw new Error("blocked");
      });

      const audio = yield* withLayer;
      yield* audio.music("town");
    })
  );

  it.effect("gives a silent service when AudioContext is absent", () =>
    Effect.gen(function* () {
      clearAudioContext();

      const audio = yield* withLayer;
      yield* audio.music("town");
    })
  );
});
