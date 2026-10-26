import { RANK_COLORS } from "@/core/components/game/tokens";
import { ColorSwatch } from "@/core/components/ui/color-swatch";
import {
  ColorSwatchPicker,
  ColorSwatchPickerItem,
} from "@/core/components/ui/color-swatch-picker";

import { Variant } from "../variant";

export const ColorSwatchPickerShowcase = () => (
  <Variant label="default">
    <ColorSwatchPicker defaultValue={RANK_COLORS.rare}>
      <ColorSwatchPickerItem color={RANK_COLORS.rare}>
        <ColorSwatch />
      </ColorSwatchPickerItem>
      <ColorSwatchPickerItem color={RANK_COLORS.uncommon}>
        <ColorSwatch />
      </ColorSwatchPickerItem>
      <ColorSwatchPickerItem color={RANK_COLORS.legendary}>
        <ColorSwatch />
      </ColorSwatchPickerItem>
      <ColorSwatchPickerItem color={RANK_COLORS.epic}>
        <ColorSwatch />
      </ColorSwatchPickerItem>
    </ColorSwatchPicker>
  </Variant>
);
