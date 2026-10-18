import type { DeckEntry, DeckSlot } from "@workspace/rules";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import { GameButton } from "@/features/battle/components/game-button";
import { useGameText } from "@/features/battle/use-game-text";
import { defaultSlotName } from "@/features/deck/deck";

/** The copies that the Player wants to Fuse, and the saved Decks that use them. */
export interface FuseRequest {
  readonly inputs: readonly DeckEntry[];
  readonly decks: readonly DeckSlot[];
}

/**
 * The confirmation of a Fuse of copies that a saved Deck uses (GDD 7.4, the
 * same rule as an Extract): a parchment dialog that names each saved Deck.
 * The copies go out of those Decks. Keep takes the focus, because the Player
 * cannot undo a Fuse; Fuse is gold.
 */
export const FuseDialog = ({
  request,
  slots,
  onKeep,
  onFuse,
}: {
  readonly request: FuseRequest | null;
  /** All the Deck slots, for the default name and number of a Deck. */
  readonly slots: readonly DeckSlot[];
  readonly onKeep: () => void;
  readonly onFuse: (request: FuseRequest) => void;
}) => {
  const { tr, text } = useGameText();
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
          data-testid="fuse-dialog"
        >
          {request ? (
            <>
              <Heading
                slot="title"
                className="font-display text-2xl font-black [@media(max-height:500px)]:text-xl"
              >
                {tr("workshop.fuseDialog.title")}
              </Heading>
              <p className="mt-2 text-sm text-[#5b4632] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-xs">
                {tr("workshop.fuseDialog.text")}
              </p>
              <div
                className="mt-3 rounded-lg border-2 border-[#c9b48c] bg-[#ead9b4] px-3 py-2 text-left text-sm [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs"
                data-testid="fuse-dialog-decks"
              >
                <p className="font-semibold text-[#5b4632]">
                  {tr("workshop.fuseDialog.decks")}
                </p>
                <ul className="mt-1 list-disc pl-5 font-bold">
                  {request.decks.map((slot) => (
                    <li key={slot.id}>{deckName(slot)}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:500px)]:mt-2">
                <GameButton
                  intent="wood"
                  autoFocus
                  onPress={onKeep}
                  data-testid="fuse-dialog-keep"
                >
                  {tr("workshop.fuseDialog.keep")}
                </GameButton>
                <GameButton
                  intent="gold"
                  onPress={() => onFuse(request)}
                  data-testid="fuse-dialog-confirm"
                >
                  {tr("workshop.fuse")}
                </GameButton>
              </div>
            </>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
