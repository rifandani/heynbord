import { CountToken } from "@/core/components/game/count-token";
import {
  GameButton,
  GameCloseButton,
  GameIconButton,
} from "@/core/components/game/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";

import { Variant, VariantGrid } from "../variant";

const INTENTS = ["gold", "wood", "ghost"] as const;
const SIZES = ["sm", "md", "lg"] as const;

/**
 * The action pieces of the Design System. Gold is the one main action of a
 * panel; wood is every other action; ghost is a small HUD control over the
 * Board. Hover, press, focus and disabled behave the same on every screen.
 */
export const GameButtonsShowcase = () => (
  <div className="flex flex-col gap-8">
    <div className="bg-night-plate border-gold-trim/40 flex flex-col gap-6 rounded-2xl border-2 p-6">
      <VariantGrid>
        {INTENTS.map((intent) => (
          <Variant key={intent} label={intent}>
            <GameButton intent={intent}>Continue</GameButton>
          </Variant>
        ))}
      </VariantGrid>

      <VariantGrid>
        {SIZES.map((size) => (
          <Variant key={size} label={size}>
            <GameButton intent="gold" size={size}>
              Start Battle
            </GameButton>
          </Variant>
        ))}
      </VariantGrid>

      <VariantGrid>
        <Variant label="icon">
          <GameIconButton aria-label="Lock">
            <GlyphIcon glyph="lock" className="size-5" />
          </GameIconButton>
        </Variant>
        <Variant label="close (on parchment)">
          <span className="bg-parchment inline-flex rounded-lg p-2">
            <GameCloseButton label="Close">
              <span aria-hidden className="text-xl leading-none">
                ×
              </span>
            </GameCloseButton>
          </span>
        </Variant>
        <Variant label="disabled">
          <GameButton isDisabled>Not yet</GameButton>
        </Variant>
        <Variant label="with a count">
          <GameButton intent="gold">
            Claim all
            <CountToken count={3} size="lg" tone="ink" />
          </GameButton>
        </Variant>
      </VariantGrid>
    </div>

    <p className="text-muted-fg text-xs">
      Tab into the row to see the 4px <code>focus-cream</code> ring. The press
      drops the piece by 1px and shortens the drop.
    </p>
  </div>
);
