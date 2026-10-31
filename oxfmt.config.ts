import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    "**/apps/web/src/routeTree.gen.ts",
    "**/apps/*/src/core/components/ui/**",
    // Vendored decoder binaries (Basis universal/KTX2) ship byte for byte.
    "**/apps/web/public/decoders/**",
    "**/.agents",
    "**/.claude",
    "**/.cursor",
    "**/.repos",
    "**/repos",
    "**/.impeccable",
    "**/docs",
    // QA output (reports and captures) that the Battle bot playtest writes.
    "**/apps/web/artifacts",
  ],
});
