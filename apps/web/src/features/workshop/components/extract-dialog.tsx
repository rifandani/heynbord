import type { DeckSlot, RankId } from "@workspace/rules";
import { EXTRACT_ESSENCE } from "@workspace/rules";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import { GameButton } from "@/features/battle/components/game-button";
import { useGameText } from "@/features/battle/use-game-text";
import { defaultSlotName } from "@/features/deck/deck";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/** The copy that the Player wants to Extract, and the saved Decks that use it. */
export interface ExtractRequest {
  readonly cardId: string;
  readonly rank: RankId;
  readonly decks: readonly DeckSlot[];
}

/**
 * The confirmation of an Extract (GDD 7.4): a parchment dialog. It names each
 * saved Deck that uses the copy, and it tells that an Epic or a Legendary copy
 * costs much to get again. Keep takes the focus, because the Player cannot
 * undo an Extract; Extract is gold.
 */
export const ExtractDialog = ({
  request,
  slots,
  onKeep,
  onExtract,
}: {
  readonly request: ExtractRequest | null;
  /** All the Deck slots, for the default name and number of a Deck. */
  readonly slots: readonly DeckSlot[];
  readonly onKeep: () => void;
  readonly onExtract: (request: ExtractRequest) => void;
}) => {
  const { tr, text } = useGameText();
  const { format } = useCoinFormat();
  const deckName = (slot: DeckSlot) =>
    slot.name ||
    text(
      defaultSlotName(
        slot,
        slots.findIndex((item) => item.id === slot.id)
      )
    );
  return (
    <ModalOverlay
      isOpen={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          onKeep();
        }
      }}
      isDismissable
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
    >
      <Modal className="fade-in zoom-in-95 animate-in w-[min(420px,94vw)] rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] p-5 text-center text-[#2a1d12] shadow-2xl duration-200 motion-reduce:animate-none [@media(max-height:500px)]:p-3">
        {/* A pressed button goes down 1px. The bottom padding keeps it in
            the scroll box, so no scrollbar comes and moves the buttons. */}
        <Dialog
          className="-mb-1 max-h-[calc(100dvh-3rem)] overflow-y-auto pb-1 outline-none"
          data-testid="extract-dialog"
        >
          {request ? (
            <>
              <Heading
                slot="title"
                className="font-display text-2xl font-black [@media(max-height:500px)]:text-xl"
              >
                {tr("workshop.extractDialog.title")}
              </Heading>
              <p className="mt-2 text-sm text-[#5b4632] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-xs">
                {tr("workshop.extractDialog.text")}
              </p>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-base font-black [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
                <BalanceIcon kind="essence" className="size-5 shrink-0" />
                {tr("workshop.extractDialog.gain", {
                  essence: format(EXTRACT_ESSENCE[request.rank]),
                })}
              </p>
              {request.decks.length > 0 ? (
                <div
                  className="mt-3 rounded-lg border-2 border-[#c9b48c] bg-[#ead9b4] px-3 py-2 text-left text-sm [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs"
                  data-testid="extract-dialog-decks"
                >
                  <p className="font-semibold text-[#5b4632]">
                    {tr("workshop.extractDialog.decks")}
                  </p>
                  <ul className="mt-1 list-disc pl-5 font-bold">
                    {request.decks.map((slot) => (
                      <li key={slot.id}>{deckName(slot)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {request.rank === "epic" || request.rank === "legendary" ? (
                <p
                  className="mt-3 text-sm font-bold text-[#8f2a1e] [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-xs"
                  data-testid="extract-dialog-rank"
                >
                  {tr("workshop.extractDialog.rank", {
                    rank: tr(`ranks.${request.rank}`),
                  })}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:500px)]:mt-2">
                <GameButton
                  intent="wood"
                  autoFocus
                  onPress={onKeep}
                  data-testid="extract-dialog-keep"
                >
                  {tr("workshop.extractDialog.keep")}
                </GameButton>
                <GameButton
                  intent="gold"
                  onPress={() => onExtract(request)}
                  data-testid="extract-dialog-confirm"
                >
                  {tr("workshop.extract")}
                </GameButton>
              </div>
            </>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
