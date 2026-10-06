import type { CoinDenomination } from "@workspace/rules";
import type { ComponentType } from "react";

import type { BalanceKind } from "@/features/town/town";

/** The face, rim and mark colors of each icon. Light comes from the upper left. */
const METALS: Readonly<
  Record<CoinDenomination, { face: string; rim: string; mark: string }>
> = {
  gold: { face: "#f2c14e", rim: "#8a5a20", mark: "#fff1b8" },
  silver: { face: "#d9dee6", rim: "#5e6672", mark: "#ffffff" },
  copper: { face: "#d9844a", rim: "#7a3a17", mark: "#f8c49c" },
};

const ESSENCE = { face: "#ff8fb8", rim: "#8f2a55", mark: "#fff6df" };
const HEYNSTONE = { face: "#8c8cff", rim: "#2f2f8f", mark: "#fff6df" };

/** The text color of each denomination letter on a dark plate (AA contrast). */
export const DENOMINATION_TEXT: Readonly<Record<CoinDenomination, string>> = {
  gold: "#f2c14e",
  silver: "#d9dee6",
  copper: "#e9965c",
};

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
  const { face, rim, mark } = METALS[denomination];
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
      fill={ESSENCE.face}
      stroke={ESSENCE.rim}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d={star(13.2, 15.4, 3.6)} fill={ESSENCE.mark} />
    <path
      d="M8.2 13.2c.4-1.6 1.4-3 2.4-4.4"
      fill="none"
      stroke={ESSENCE.mark}
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
      fill={HEYNSTONE.face}
      stroke={HEYNSTONE.rim}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 3.2 4.3 7.6v4.4L12 12Z" fill="#ffffff" fillOpacity="0.28" />
    <path d={star(12, 12.4, 5.4)} fill={HEYNSTONE.mark} />
  </>
);

const ICONS: Readonly<
  Record<
    BalanceKind,
    ComponentType<{ readonly denomination: CoinDenomination }>
  >
> = {
  coin: CoinFace,
  essence: EssenceDrop,
  heynstones: HeynstoneGem,
};

/** The icon of a balance, or of one Coin denomination. Always decorative. */
export const BalanceIcon = ({
  kind,
  denomination = "gold",
  className,
}: {
  readonly kind: BalanceKind;
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
