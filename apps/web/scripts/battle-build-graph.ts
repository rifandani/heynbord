import type { Plugin } from "vite";

/** Record actual emitted dependencies; chunk hashes and manual splitting can change. */
export const battleBuildGraph = (): Plugin => {
  let configuration = {
    mode: "",
    base: "",
    e2e: "",
  };
  return {
    name: "battle-budget-graph",
    apply: "build",
    configResolved(config) {
      configuration = {
        mode: config.mode,
        base: config.base,
        e2e: String(config.env.VITE_E2E ?? ""),
      };
    },
    generateBundle(_options, bundle) {
      if (this.environment?.name !== "client") {
        return;
      }
      const graph = Object.fromEntries(
        Object.values(bundle).flatMap((item) => {
          if (item.type !== "chunk") {
            return [];
          }
          const modules = Object.keys(item.modules).map((id) =>
            id.replaceAll("\\", "/")
          );
          return [
            [
              item.fileName,
              {
                imports: item.imports,
                dynamicImports: item.dynamicImports,
                play: modules.some((id) => id.endsWith("/src/routes/play.tsx")),
                battle: modules.some((id) =>
                  id.endsWith("/features/battle/components/battle-stage.tsx")
                ),
                hero: modules.some((id) =>
                  id.endsWith("/features/battle/scene/hero-model-body.tsx")
                ),
              },
            ],
          ];
        })
      );
      this.emitFile({
        type: "asset",
        fileName: "battle-build-configuration.json",
        source: JSON.stringify(configuration, null, 2),
      });
      this.emitFile({
        type: "asset",
        fileName: "battle-build-graph.json",
        source: JSON.stringify(graph, null, 2),
      });
    },
  };
};
