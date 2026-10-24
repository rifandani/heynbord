import type { CoinDenomination } from "@workspace/rules";
import type { ComponentType } from "react";

import { COIN_METALS, ESSENCE_METAL, HEYNSTONE_METAL } from "./tokens";

/** The three resources that the Balance Plate shows. */
export type ResourceKind = "coin" | "essence" | "heynstones";

/** A four-point star, the mark of the Heynbord emblem, at (x, y). */
const star = (x: number, y: number, r: number) => {
  const w = r * 0.28;
  return `M${x} ${y - r}L${x + w} ${y - w}L${x + r} ${y}L${x + w} ${y + w}L${x} ${y + r}L${x - w} ${y + w}L${x - r} ${y}L${x - w} ${y - w}Z`;
};

const CoinFace = ({
  denomination,
}: {
  readonly denomination: CoinDenomination;
}) => {
  const { face, rim, mark } = COIN_METALS[denomination];
  return (
    <>
      <circle cx="12" cy="12" r="10" fill={face} stroke={rim} strokeWidth="2" />
      <circle
        cx="12"
        cy="12"
        r="6.6"
        fill="none"
        stroke={rim}
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <path d={star(12, 12, 4.4)} fill={rim} />
      <path
        d="M5.6 10.4A6.6 6.6 0 0 1 10.4 5.6"
        fill="none"
        stroke={mark}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  );
};

/** A drop of light with a small sparkle. */
const EssenceDrop = () => (
  <>
    <path
      d="M12 2.2C9.4 6.2 5 10.6 5 15a7 7 0 0 0 14 0c0-4.4-4.4-8.8-7-12.8Z"
      fill={ESSENCE_METAL.face}
      stroke={ESSENCE_METAL.rim}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d={star(13.2, 15.4, 3.6)} fill={ESSENCE_METAL.mark} />
    <path
      d="M8.2 13.2c.4-1.6 1.4-3 2.4-4.4"
      fill="none"
      stroke={ESSENCE_METAL.mark}
      strokeOpacity="0.8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </>
);

/** A cut stone in the hexagon of the Heynbord emblem, with its star. */
const HeynstoneGem = () => (
  <>
    <path
      d="M12 2 20.7 7v10L12 22l-8.7-5V7Z"
      fill={HEYNSTONE_METAL.face}
      stroke={HEYNSTONE_METAL.rim}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 3.2 4.3 7.6v4.4L12 12Z" fill="white" fillOpacity="0.28" />
    <path d={star(12, 12.4, 5.4)} fill={HEYNSTONE_METAL.mark} />
  </>
);

const ICONS: Readonly<
  Record<
    ResourceKind,
    ComponentType<{ readonly denomination: CoinDenomination }>
  >
> = {
  coin: CoinFace,
  essence: EssenceDrop,
  heynstones: HeynstoneGem,
};

/** The icon of a resource, or of one Coin denomination. Always decorative. */
export const ResourceIcon = ({
  kind,
  denomination = "gold",
  className,
}: {
  readonly kind: ResourceKind;
  readonly denomination?: CoinDenomination;
  readonly className?: string;
}) => {
  const Icon = ICONS[kind];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <Icon denomination={denomination} />
    </svg>
  );
};
