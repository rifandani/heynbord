import type { Collection, DeckEntry, RankId } from "@workspace/rules";
import { ownedCopies } from "@workspace/rules";
import type { RefObject } from "react";
import {
  Dialog,
  Heading,
  Menu,
  MenuItem,
  Popover,
} from "react-aria-components";

import { RankGems } from "@/features/battle/components/card-frame";
import { RANK_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";

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
      className="fade-in zoom-in-95 animate-in min-w-[200px] rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 p-1.5 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45),0_12px_28px_rgba(0,0,0,0.5)] duration-150 motion-reduce:animate-none"
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
            className="font-display px-2 pt-1 pb-1.5 text-sm font-bold text-[#ffe08a]"
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
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-bold outline-none select-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[#fff2a8] data-[focused]:bg-[#fff6df]/10 data-[hovered]:bg-[#fff6df]/10"
                data-testid={`workshop-fuse-choice-${rank}`}
              >
                {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the gem size (em); the gems have no text */}
                <span className="w-[5.6em] text-[10px]" aria-hidden>
                  <RankGems rank={rank} />
                </span>
                <span style={{ color: RANK_COLORS[rank] }}>
                  {tr(`ranks.${rank}`)}
                </span>
                <span
                  className="ml-auto font-black text-[#fff6df] tabular-nums"
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
