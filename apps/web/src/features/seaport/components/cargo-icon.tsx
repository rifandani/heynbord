import type { ExpeditionCargo, ForgeStoneTier } from "@workspace/rules";

import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/**
 * The XP seal: a round seal in the cyan of the XP text, with a rising
 * chevron, lit from the upper left as the coins of the Balance Plate.
 */
const XpSeal = ({ className }: { readonly className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="#9fe7f5"
      stroke="#0e6f86"
      strokeWidth="2"
    />
    <circle
      cx="12"
      cy="12"
      r="6.6"
      fill="none"
      stroke="#0e6f86"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <path
      d="M7.4 14.2 12 9.6l4.6 4.6"
      fill="none"
      stroke="#0b4f61"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.6 10.4A6.6 6.6 0 0 1 10.4 5.6"
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * The icon of a Cargo (Economy 2.8): the gold coin, the XP seal, the Essence
 * drop, or the Forge Stone of `tier`. Always decorative: the Cargo name is
 * next to it, or in the accessible name of its control.
 */
export const CargoIcon = ({
  cargo,
  tier = "epic",
  className,
}: {
  readonly cargo: ExpeditionCargo;
  /** The tier of the Forge Stone that the icon shows. */
  readonly tier?: ForgeStoneTier;
  readonly className?: string;
}) => {
  if (cargo === "forgeStones") {
    return <ForgeStoneIcon tier={tier} className={className} />;
  }
  if (cargo === "xp") {
    return <XpSeal className={className} />;
  }
  return <BalanceIcon kind={cargo} className={className} />;
};
