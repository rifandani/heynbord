import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    "**/apps/web/src/routeTree.gen.ts",
    "**/apps/*/src/core/components/ui/**",
    "**/.agents",
    "**/.claude",
    "**/.cursor",
    "**/.repos",
    "**/repos",
    "**/.impeccable",
    "**/docs",
    // QA output (reports and captures) that the Battle bot playtest writes.
    "**/apps/web/artifacts",
    // Scratch scripts of a debugging session; they are not part of the app.
    "**/.tmp-*.ts",
  ],
});
