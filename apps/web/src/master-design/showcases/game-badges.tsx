import { CountToken } from "@/core/components/game/count-token";
import { ResourceIcon } from "@/core/components/game/resource-icon";

import { Variant, VariantGrid } from "../variant";

/**
 * The small marks of the game: a count token and the resource icons. Rank
 * Gems have their own entry, because they carry the Rank of a card.
 */
export const GameBadgesShowcase = () => (
  <div className="flex flex-col gap-8">
    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Count token</h4>
      <div className="bg-night-plate border-gold-trim/40 flex flex-wrap items-center gap-4 rounded-2xl border-2 p-5">
        <VariantGrid>
          {(["sm", "md", "lg"] as const).map((size) => (
            <Variant key={size} label={size}>
              <CountToken count={3} size={size} />
            </Variant>
          ))}
          <Variant label="above max">
            <CountToken count={120} />
          </Variant>
          <Variant label="on gold">
            <span className="bg-gold rounded-lg p-2">
              <CountToken count={7} tone="ink" />
            </span>
          </Variant>
          <Variant label="zero (hidden)">
            <span className="text-cream-dim text-xs">not rendered</span>
          </Variant>
        </VariantGrid>
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Resources</h4>
      <div className="bg-night-plate border-gold-trim/40 flex flex-wrap items-center gap-6 rounded-2xl border-2 p-5">
        <Variant label="Coin · Gold">
          <ResourceIcon kind="coin" className="size-8" />
        </Variant>
        <Variant label="Coin · Silver">
          <ResourceIcon kind="coin" denomination="silver" className="size-8" />
        </Variant>
        <Variant label="Coin · Copper">
          <ResourceIcon kind="coin" denomination="copper" className="size-8" />
        </Variant>
        <Variant label="Essence">
          <ResourceIcon kind="essence" className="size-8" />
        </Variant>
        <Variant label="Heynstone">
          <ResourceIcon kind="heynstones" className="size-8" />
        </Variant>
      </div>
    </section>
  </div>
);
