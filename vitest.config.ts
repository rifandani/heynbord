import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest 5 clears mock history before each test by default.
    // Several unit files assert side effects from module init or `beforeAll` (MSW).
    clearMocks: false,
    pool: "threads",
    isolate: false,
    fileParallelism: true,
    css: false,
    passWithNoTests: false,
    projects: ["apps/web", "packages/rules"],
    // `coverage` is root-only (it sits in Vitest's `NonProjectOptions`), so it cannot be split across the `defineProject` configs.
    // Consequence: `--project <name> --coverage` measures this global `include` list against a partial run and reports every other project at 0%. Always run the whole suite (`bun test:unit:cov`).
    //
    // Scope rationale, the Logic Seam convention, and the threshold policy live in docs/adr/0001-unit-tests-are-pure-module-logic.md.
    coverage: {
      provider: "v8",
      // Opt-in only. Enabling by default would tax every watch run and every focused `--project` run; the `unit` CI job opts in via `--coverage`.
      enabled: false,
      reportOnFailure: true,
      reporter: ["text", ["text-summary", { file: "summary.txt" }], "html"],
      // Deliberately not `./coverage` itself, whose root is reserved for fallow's
      // runtime sidecar traces. Feeding fallow test coverage would make it report the
      // ADR-sanctioned untested layers as dead code. Test reports live in named
      // subdirectories instead — `coverage/vitest` here, `coverage/stryker` for
      // mutation output (ADR-0003).
      reportsDirectory: "./coverage/vitest",
      // Floor, not a target, and deliberately *below* the measured baseline. Enforced per file (`perFile: true`), so one thinly covered module cannot hide behind the rest of the suite.
      // The suite only clears 100 because the repo is boilerplate-sized; pinning the floor there would fail CI on the first partially covered file added to `include`, which is ordinary work, not a regression. 90 leaves room for that while still catching a real slide. Lowering it needs a reason in the commit.
      thresholds: {
        perFile: true,
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
      // This allowlist is the definition of business logic: layers whose modules are pure enough to unit test.
      // Untested files only appear in the report when matched here, so a new logic-bearing folder must be added.
      include: [
        "apps/web/src/**/{actions,apis,config,constants,http,libs,middlewares,observability,runtime,services,utils}/**/*.{ts,tsx}",
        "apps/web/src/**/*-store.{ts,tsx}",
        // Feature modules: pure domain functions, Effect services and atoms.
        // Components (`.tsx`) are E2E territory.
        "apps/web/src/features/**/*.ts",
        // The game rules are pure module logic (ADR-0006).
        "packages/rules/src/**/*.ts",
      ],
      exclude: [
        "**/*.unit.test.ts",
        "**/*.d.ts",
        "**/types.ts",
        // Test setup helpers for the rules package.
        "packages/rules/src/testing/**",
        // all constants
        "apps/*/src/**/constants/**",
        "packages/*/src/**/constants/**",
        // Pure schema modules — declarations only, no functions. ADR-0001 puts
        // "plain schema shapes" out of test scope, but leaving them in `include` gave
        // them a free 100%: importing a schema file executes every line, so such a file
        // scored 100% statements/branches/lines with no test file in existence.
        // Mutation testing is what exposed it (9.09%, ADR-0003). Excluded so the
        // coverage figure means something. Modules that mix schemas with functions
        // (`api-error.ts`, `locale.ts`, `color-mode.ts`) stay in — their functions are tested.
        "apps/web/src/core/libs/i18n/locales/**",
        // Framework seams (the Logic Seam convention, ADR-0001): `createServerFn`
        // transports, the server runtime that reads TanStack's request, the
        // startup binding of `import.meta.env`, the atom runtimes (layer wiring
        // only: a test that imports an atom runs every line), and React hooks.
        // Their logic lives in tested siblings (`server-fn.ts`, `server-request.ts`,
        // `app-config.ts`, `*.service.ts`, `*.atoms.ts`).
        "**/*.functions.ts",
        "**/*.server.ts",
        "apps/web/src/core/config/env.ts",
        "apps/web/src/core/runtime/client.ts",
        "apps/web/src/features/**/use-*.ts",
        // Rendering seams: they draw the procedural art on a 2D canvas, or load
        // the painted effects atlas into a texture. The canvas inspector
        // captures and the E2E bot playtest cover them (ADR-0001). The slot
        // math of the atlas is in its tested sibling `fx-slots.ts`.
        "apps/web/src/features/battle/scene/textures.ts",
        "apps/web/src/features/battle/scene/fx-atlas.ts",
        // Browser seam: it only reads `window.matchMedia`.
        "apps/web/src/features/battle/scene/reduced-motion.ts",
        // Declaration-only modules: no function and no branch, so an import
        // gives them a free 100% (the 2026-10-24 amendment of ADR-0001): Tailwind
        // class strings, an empty registry, and atoms that only hold a value.
        "apps/web/src/features/battle/components/reward-plate.ts",
        "apps/web/src/features/battle/scene/unit-anchors.ts",
        "apps/web/src/features/dungeons/dungeons.atoms.ts",
        "apps/web/src/features/heynspire/heynspire.atoms.ts",
      ],
    },
  },
});
