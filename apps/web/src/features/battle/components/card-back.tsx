import { useAtomValue } from "@effect/atom-react";
import type { CosmeticId } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";

import { cardBackArt } from "@/features/battle/card-back-art";
import { BRONZE } from "@/features/battle/components/card-frame";
import { HeynbordEmblem } from "@/features/battle/components/heynbord-emblem";
import {
  CARD_ART_WELL_FADE,
  CARD_BACK_LEATHER,
  DROP_EMBLEM,
  EMPTY_CARD_EDGE_FADE,
} from "@/features/battle/tokens";
import { activeCardBackAtom } from "@/features/profile/profile.atoms";

/** The Standard Back, in code: dark leather with a fine diamond tooling. */
const LEATHER = CARD_BACK_LEATHER;

/**
 * The Card Back: the face-down side that all cards share. The size is in `em`
 * like the Card Frame (9em × 12.6em), so the parent font size sets it.
 *
 * `back` is the Cosmetic that the card shows. When it is absent, the card
 * shows the Active Cosmetic of the `cardBack` family. `null` is the Standard
 * Back: the enemy Side never shows the Player's Card Back.
 */
export const CardBack = ({
  className,
  back,
}: {
  readonly className?: string;
  readonly back?: CosmeticId | null;
}) => {
  const active = useAtomValue(activeCardBackAtom);
  const id = back === undefined ? active : back;
  const art = id === null ? null : cardBackArt(id);
  return (
    <span
      className={cn(
        "shadow-bevel relative block h-[12.6em] w-[9em] rounded-[0.85em] p-[0.36em]",
        className
      )}
      style={{ background: BRONZE }}
      data-card-back={id ?? "standard"}
      aria-hidden
    >
      <span className="border-bronze-rim relative flex size-full items-center justify-center overflow-hidden rounded-[0.55em] border-[0.14em]">
        {art === null ? (
          <span className="absolute inset-0" style={{ background: LEATHER }} />
        ) : (
          <img
            src={art}
            alt=""
            draggable={false}
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {/* The inner tooled line. */}
        <span className="border-bronze-rim/55 absolute inset-[0.45em] rounded-[0.35em] border-[0.08em]" />
        <span style={{ filter: DROP_EMBLEM }}>
          <HeynbordEmblem className="relative block w-[4.6em]" />
        </span>
      </span>
    </span>
  );
};

/**
 * An empty place for a card: a dark inset with a faint mark. The mark is the
 * Heynbord emblem if `mark` is not given. It has the height of the Card Frame
 * and the width of its parent.
 */
export const EmptyCardPlace = ({
  className,
  mark,
}: {
  readonly className?: string;
  readonly mark?: ReactNode;
}) => (
  <span
    className={cn(
      "shadow-well flex h-[12.6em] w-full items-center justify-center rounded-[0.85em] border-[0.12em]",
      className
    )}
    style={{
      borderColor: EMPTY_CARD_EDGE_FADE,
      backgroundColor: CARD_ART_WELL_FADE,
    }}
    aria-hidden
  >
    {mark ?? <HeynbordEmblem className="w-[3.6em] opacity-[0.16] grayscale" />}
  </span>
);
