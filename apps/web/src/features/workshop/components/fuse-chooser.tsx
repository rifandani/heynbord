import type { Collection, DeckEntry, RankId } from "@workspace/rules";
import { ownedCopies } from "@workspace/rules";
import { cn } from "cn";
import type { RefObject } from "react";
import {
  Dialog,
  Heading,
  Menu,
  MenuItem,
  Popover,
} from "react-aria-components";

import { RankGems } from "@/core/components/game/rank-gems";
import { useGameText } from "@/features/battle/use-game-text";
import { WORKSHOP_CHOOSER_DROP } from "@/features/workshop/tokens";

/** A card with copies in more than one Rank that can go into a Fuse. */
export interface FuseChoice {
  readonly cardId: string;
  readonly ranks: readonly RankId[];
}

/**
 * The Rank chooser of a Fuse (GDD 7.4): when the first copy of a card can
 * come from more than one Rank, a small plate opens on its tile with the gems,
 * the name and the copies that are not in a slot of each Rank. The arrow keys
 * move, Enter puts the copy in, and Escape closes it.
 */
export const FuseChooser = ({
  choice,
  anchor,
  collection,
  inputs,
  onPick,
  onClose,
}: {
  readonly choice: FuseChoice | null;
  readonly anchor: RefObject<HTMLElement | null>;
  readonly collection: Collection;
  readonly inputs: readonly DeckEntry[];
  readonly onPick: (cardId: string, rank: RankId) => void;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const left = (cardId: string, rank: RankId) =>
    ownedCopies(collection, cardId, rank) -
    inputs.filter((input) => input.cardId === cardId && input.rank === rank)
      .length;
  return (
    <Popover
      triggerRef={anchor}
      isOpen={choice !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      placement="bottom"
      offset={8}
      className={cn(
        "fade-in zoom-in-95 animate-in border-gold-trim/70 bg-night-plate/95 text-cream min-w-[200px] rounded-xl border-2 p-1.5 duration-150 motion-reduce:animate-none",
        WORKSHOP_CHOOSER_DROP
      )}
      data-testid="workshop-fuse-chooser"
    >
      {choice ? (
        <Dialog
          aria-labelledby="workshop-fuse-chooser-title"
          className="outline-none"
        >
          <Heading
            id="workshop-fuse-chooser-title"
            slot="title"
            className="font-display text-gold-light px-2 pt-1 pb-1.5 text-sm font-bold"
          >
            {tr("workshop.chooser.title")}
          </Heading>
          <Menu
            aria-labelledby="workshop-fuse-chooser-title"
            autoFocus="first"
            onAction={(key) => {
              const rank = choice.ranks.find((item) => item === key);
              if (rank) {
                onPick(choice.cardId, rank);
              }
            }}
            className="flex flex-col gap-0.5 outline-none"
          >
            {choice.ranks.map((rank) => (
              <MenuItem
                key={rank}
                id={rank}
                textValue={tr("workshop.chooser.label", {
                  rank: tr(`ranks.${rank}`),
                  name: tr(`cards.${choice.cardId}.name`),
                })}
                className="data-[focus-visible]:ring-focus-cream data-[focused]:bg-cream/10 data-[hovered]:bg-cream/10 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-bold outline-none select-none data-[focus-visible]:ring-2"
                data-testid={`workshop-fuse-choice-${rank}`}
              >
                {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the gem size (em); the gems have no text */}
                <span className="w-[5.6em] text-[10px]" aria-hidden>
                  <RankGems rank={rank} />
                </span>
                <span className="text-cream">{tr(`ranks.${rank}`)}</span>
                <span
                  className="text-cream ml-auto font-black tabular-nums"
                  aria-hidden
                >
                  {tr("workshop.copies", {
                    count: left(choice.cardId, rank),
                  })}
                </span>
              </MenuItem>
            ))}
          </Menu>
        </Dialog>
      ) : null}
    </Popover>
  );
};
