import { BalancePlate } from "@/features/town/components/balance-plate";
import type { Balances } from "@/features/town/town";

import { Variant, VariantGrid } from "../variant";

/** Balances from the Economy document, from a new Player to the widest plate. */
const RANGES: readonly { label: string; balances: Balances }[] = [
  { label: "new Player", balances: { coin: 0, essence: 0, heynstones: 0 } },
  {
    label: "first win of Stage 1-1",
    balances: { coin: 180, essence: 0, heynstones: 0 },
  },
  {
    label: "after a 20-Star chest",
    balances: { coin: 520, essence: 30, heynstones: 150 },
  },
  {
    label: "widest",
    balances: { coin: 9_999_999, essence: 12_400, heynstones: 1700 },
  },
];

/** The Balance Plate of the Town, on the Town sky color. Tab to see a tooltip. */
export const BalancePlateShowcase = () => (
  <VariantGrid>
    {RANGES.map(({ label, balances }) => (
      <Variant key={label} label={label} className="w-full">
        <div className="relative h-16 w-full max-w-xl rounded-lg bg-[#8fd0f5]">
          <BalancePlate balances={balances} />
        </div>
      </Variant>
    ))}
  </VariantGrid>
);
