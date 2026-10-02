import { createEnv } from "@t3-oss/env-core";
import { vite } from "@t3-oss/env-core/presets-zod";
import { z } from "zod";

const portlessUrl = import.meta.env.PORTLESS_URL || undefined;

export const ENV = createEnv({
  client: {
    VITE_APP_TITLE: z.string().min(1),
    VITE_APP_URL: z.url(),
  },
  clientPrefix: "VITE_",
  extends: [vite()],
  runtimeEnv: {
    VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
    VITE_APP_URL: portlessUrl ?? import.meta.env.VITE_APP_URL,
  },
});
