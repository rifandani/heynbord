import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { LOCALES } from "./locale";
import { readRequestLocale, writeLocaleCookie } from "./locale.server";

/** The Locale the server renders in: cookie, then `Accept-Language`. */
export const getRequestLocale = createServerFn({ method: "GET" }).handler(() =>
  readRequestLocale()
);

/** Persists the picked Locale so the next server render uses it. */
export const persistLocale = createServerFn({ method: "POST" })
  .validator(z.object({ locale: z.enum(LOCALES) }))
  .handler(({ data }) => {
    writeLocaleCookie(data.locale);
  });
