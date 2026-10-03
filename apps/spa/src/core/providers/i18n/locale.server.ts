import {
  getCookie,
  getRequestHeader,
  setCookie,
} from "@tanstack/react-start/server";

import type { LocaleDictLanguage } from "@/core/libs/i18n/init";

import { LOCALE_COOKIE, resolveLocale } from "./locale";

// Server-only: reads and writes the current request. Import protection fails
// the build if client code imports a `*.server.*` file; reach these through
// the server functions in `locale.functions.ts`.

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const readRequestLocale = () =>
  resolveLocale({
    acceptLanguage: getRequestHeader("accept-language"),
    cookie: getCookie(LOCALE_COOKIE),
  });

export const writeLocaleCookie = (locale: LocaleDictLanguage) => {
  setCookie(LOCALE_COOKIE, locale, {
    httpOnly: true,
    maxAge: ONE_YEAR_IN_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });
};
