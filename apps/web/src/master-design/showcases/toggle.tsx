import { Toggle } from "@/core/components/ui/toggle";

import { Variant, VariantGrid } from "../variant";

export const ToggleShowcase = () => (
  <VariantGrid>
    <Variant label="outline">
      <Toggle defaultSelected intent="outline">
        Outline
      </Toggle>
    </Variant>

    <Variant label="plain">
      <Toggle intent="plain">Plain</Toggle>
    </Variant>
    <Variant label="on parchment">
      <div className="paper-surface bg-overlay text-overlay-fg border-frame-wood shadow-lift flex gap-2 rounded-2xl border-4 p-3">
        <Toggle defaultSelected intent="outline">
          Speed ×2
        </Toggle>
        <Toggle intent="outline">Sound</Toggle>
      </div>
    </Variant>
  </VariantGrid>
);
