import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import {
  makeRequestSnapshot,
  ServerRequest,
} from "@/core/runtime/server-request";
import {
  persistLocaleCookie,
  readRequestLocale,
} from "@/features/i18n/locale-cookie";

const request = (init: {
  cookies?: Record<string, string>;
  acceptLanguage?: string;
}) =>
  makeRequestSnapshot({
    cookies: init.cookies ?? {},
    headers: new Headers(
      init.acceptLanguage ? { "accept-language": init.acceptLanguage } : {}
    ),
  });

describe("readRequestLocale", () => {
  it.effect("uses the persisted Locale over Accept-Language", () =>
    Effect.gen(function* () {
      const { service } = request({
        acceptLanguage: "en-US",
        cookies: { "app-locale": "id-id" },
      });

      const locale = yield* readRequestLocale.pipe(
        Effect.provideService(ServerRequest, service)
      );

      expect(locale).toBe("id-id");
    })
  );

  it.effect("uses Accept-Language when no Locale is persisted", () =>
    Effect.gen(function* () {
      const { service } = request({ acceptLanguage: "id-ID,en;q=0.5" });

      const locale = yield* readRequestLocale.pipe(
        Effect.provideService(ServerRequest, service)
      );

      expect(locale).toBe("id-id");
    })
  );
});

describe("persistLocaleCookie", () => {
  it.effect("sets a long-lived cookie that scripts cannot read", () =>
    Effect.gen(function* () {
      const { cookieWrites, service } = request({});

      yield* persistLocaleCookie("id-id").pipe(
        Effect.provideService(ServerRequest, service)
      );

      expect(cookieWrites).toEqual([
        {
          name: "app-locale",
          options: {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
            sameSite: "lax",
            secure: false,
          },
          value: "id-id",
        },
      ]);
    })
  );
});
