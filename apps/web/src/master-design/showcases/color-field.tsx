import { RANK_COLORS } from "@/core/components/game/tokens";
import { ColorField } from "@/core/components/ui/color-field";
import { Label } from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";

import { Variant } from "../variant";

export const ColorFieldShowcase = () => (
  <Variant label="default">
    <ColorField className="w-64" defaultValue={RANK_COLORS.rare}>
      <Label>Brand</Label>
      <Input />
    </ColorField>
  </Variant>
);
