import { ResourceIcon } from "@/core/components/game/resource-icon";
import { ResourcePlate } from "@/core/components/game/resource-plate";
import type { ResourceItem } from "@/core/components/game/resource-plate";

import { Variant, VariantGrid } from "../variant";

const coin: ResourceItem = {
  id: "coin",
  name: "Coin",
  use: "Buys Packs, Deck slots and Workshop actions.",
  icon: <ResourceIcon kind="coin" className="size-5" />,
  value: "12,470",
  spoken: "12,470 Coin",
};

const plate = (items: readonly ResourceItem[], label = "Balances") => (
  <ResourcePlate items={items} label={label} />
);

/**
 * The resource plate: the night plate that holds a balance or a price. The
 * game uses it for Coin, Essence and Heynstones; a landing page can show one
 * resource, or a price on parchment.
 */
export const GameResourcePlateShowcase = () => (
  <div className="flex flex-col gap-6">
    <VariantGrid>
      <Variant label="one resource" className="w-full max-w-sm">
        <div className="bg-battle-meadow relative h-20 w-full rounded-xl">
          {plate([coin])}
        </div>
      </Variant>
      <Variant label="a price (not a balance)" className="w-full max-w-sm">
        <div className="bg-town-sky relative h-20 w-full rounded-xl">
          {plate(
            [
              {
                ...coin,
                id: "price",
                name: "Price",
                value: "1,200",
                spoken: "1,200 Coin",
                use: undefined,
              },
            ],
            "Price"
          )}
        </div>
      </Variant>
      <Variant label="three resources" className="w-full max-w-lg">
        <div className="bg-shop relative h-20 w-full rounded-xl">
          {plate([
            coin,
            {
              id: "essence",
              name: "Essence",
              use: "Crafts and Fuses cards.",
              icon: <ResourceIcon kind="essence" className="size-5" />,
              value: "320",
              spoken: "320 Essence",
            },
            {
              id: "heynstones",
              name: "Heynstones",
              use: "Opens the Heynspire floors.",
              icon: <ResourceIcon kind="heynstones" className="size-5" />,
              value: "18",
              spoken: "18 Heynstones",
            },
          ])}
        </div>
      </Variant>
      <Variant label="on parchment" className="w-full max-w-sm">
        <div className="bg-parchment border-frame-wood relative h-20 w-full rounded-xl border-4">
          {plate([coin])}
        </div>
      </Variant>
    </VariantGrid>
    <p className="text-muted-fg text-xs">
      Hover, focus or a tap shows what the resource pays for. The plate is
      information, so it has no press, no glow and no gold fill.
    </p>
  </div>
);
