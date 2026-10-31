/** The build inputs that decide whether Hero Models show. */
export const heroModelsEnabled = ({
  release,
  dev,
  preview,
}: {
  readonly release: string | undefined;
  readonly dev: boolean;
  readonly preview: string | undefined;
}): boolean => release === "1" || (dev && preview === "1");

/**
 * Hero Models show in a release build only when `VITE_HERO_MODELS=1` is set.
 * Local review uses the development preview switch. Both are off by default.
 */
export const HERO_MODELS_ENABLED = heroModelsEnabled({
  release: import.meta.env.VITE_HERO_MODELS,
  dev: import.meta.env.DEV,
  preview: import.meta.env.VITE_HERO_MODEL_PREVIEW,
});
