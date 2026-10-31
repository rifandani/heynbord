import { createBattle, getStage } from "@workspace/rules";

import { musicTrackFor } from "@/core/audio/music-catalog";
import { STING_FILES, TRACK_FILES } from "@/core/audio/music-files";
import { battlePaintingFor } from "@/features/battle/battle-painting";
import { boardSkinArt } from "@/features/battle/board-skin-art";
import {
  battleModelCopies,
  battleUnitSources,
  cardIllustration,
  sourceId,
  unitIllustration,
} from "@/features/battle/card-art";
import { cardBackArt } from "@/features/battle/card-back-art";
import { FX_ATLAS_URL } from "@/features/battle/scene/fx-slots";
import { requireUnitModel } from "@/features/battle/scene/unit-models";
import { heroModelUrl } from "@/features/hero/hero-model-assets";
import {
  heroPortraitArt,
  STANDARD_HERO_PORTRAIT,
} from "@/features/hero/hero-portrait-art";

import type { BattleBudgetConfig } from "./battle-budget-config";

export interface BudgetAsset {
  readonly url: string;
  readonly category: string;
}

/** Same rules state, source set, selectors and catalogs as Battle loading. */
export const battleBudgetAssets = (config: BattleBudgetConfig) => {
  const stage = getStage(config.stageId);
  const { state } = createBattle({
    seed: 169,
    stage,
    player: {
      ...config.deck,
      level: config.level,
      gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
    },
  });
  const sources = battleUnitSources(state);
  const models = sources.map(sourceId);
  const files = new Map<string, BudgetAsset>();
  const add = (url: string | null | undefined, category: string) => {
    if (url && !files.has(url)) {
      files.set(url, { url, category });
    }
  };
  add(battlePaintingFor(stage.region), "painting");
  add(FX_ATLAS_URL, "effects");
  if (config.cosmetics.boardSkin) {
    add(boardSkinArt(config.cosmetics.boardSkin), "board skin");
  }
  if (config.cosmetics.cardBack) {
    add(cardBackArt(config.cosmetics.cardBack), "card back");
  }
  for (const id of battleModelCopies(state)) {
    add(cardIllustration(id), "original card art");
  }
  for (const source of sources) {
    add(unitIllustration(source), "original card/Token art");
  }
  for (const id of models) {
    add(requireUnitModel(id).url, "Unit Model");
  }
  if (config.features.heroModel && config.appearance.portrait === null) {
    add(STANDARD_HERO_PORTRAIT, "Hero portrait");
  }
  if (config.appearance.portrait) {
    add(heroPortraitArt(config.appearance.portrait), "Hero portrait");
  }
  const heroAssets: string[] = [];
  if (config.features.heroModel) {
    const url = heroModelUrl(config.appearance);
    add(url, "Hero appearance");
    heroAssets.push(url);
  }
  add(`/music/${TRACK_FILES[musicTrackFor(stage, true)]}`, "music");
  // Result branches are mutually exclusive. The runner selects the larger file.
  const stings = Object.values(STING_FILES).map((file) => `/music/${file}`);
  return {
    files: [...files.values()].toSorted((a, b) => a.url.localeCompare(b.url)),
    stings,
    models,
    heroAssets,
  };
};
