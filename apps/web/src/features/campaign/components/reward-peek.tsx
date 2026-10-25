import type { RefObject } from "react";
import { Popover } from "react-aria-components";

import { CardDetails } from "@/features/battle/components/card-details";
import type { Peek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";

/**
 * The Card Details of a reward card: hover after a short delay, keyboard
 * focus, or a long press, as in the Deck builder. They open beside the card,
 * out of the panel, so that the scroll of the panel never cuts them.
 */
export const useRewardPeek = ({
  placement,
  testId,
  offset = 12,
}: {
  readonly placement: "right" | "left" | "top";
  readonly testId: string;
  /** The space between the card and its Card Details, in px. */
  readonly offset?: number;
}) => {
  const { peek, bind, hide } = useCardPeek();
  const details = (target: Peek, anchor: RefObject<HTMLElement | null>) =>
    peek && isSamePeek(peek, target) ? (
      <Popover
        triggerRef={anchor}
        isOpen
        isNonModal
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        placement={placement}
        offset={offset}
        className="fade-in animate-in pointer-events-none duration-150 motion-reduce:animate-none"
        data-testid={testId}
      >
        <CardDetails cardId={target.cardId} rank={target.rank} />
      </Popover>
    ) : null;
  return { bind, details };
};

/** The ring of a reward card button with keyboard focus. */
export const PEEK_BUTTON =
  "cursor-default rounded-[0.85em] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]";
