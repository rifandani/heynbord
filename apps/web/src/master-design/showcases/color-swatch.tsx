import { RANK_COLORS } from "@/core/components/game/tokens";
import { ColorSwatch } from "@/core/components/ui/color-swatch";

import { Variant, VariantGrid } from "../variant";

export const ColorSwatchShowcase = () => (
  <VariantGrid>
    <Variant label={RANK_COLORS.rare}>
      <ColorSwatch color={RANK_COLORS.rare} />
    </Variant>
    <Variant label={RANK_COLORS.uncommon}>
      <ColorSwatch color={RANK_COLORS.uncommon} />
    </Variant>
  </VariantGrid>
);
