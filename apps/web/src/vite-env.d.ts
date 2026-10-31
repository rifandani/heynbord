/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />

interface ImportMetaEnv {
  // prefixed with "VITE_" -> exposed to our Vite-processed code
  readonly VITE_APP_TITLE: string | undefined;
  readonly VITE_APP_URL: string | undefined;
  // Set to "true" by playwright's webServer to keep devtools out of E2E runs
  readonly VITE_E2E: "true" | "false" | undefined;
  readonly VITE_HERO_MODELS: "1" | undefined;
  readonly VITE_HERO_MODEL_PREVIEW: "1" | undefined;
  // Injected by portless (envPrefix includes PORTLESS_)
  readonly PORTLESS_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** The hash of the rules and the content of this build (`scripts/rules-hash.ts`). */
declare const __RULES_HASH__: string;
