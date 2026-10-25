import type { DeckEntry, DeckSlot } from "@workspace/rules";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog, GameDialogText } from "@/core/components/game/game-dialog";
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
    <GameDialog
      isOpen={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          onKeep();
        }
      }}
      title={tr("workshop.fuseDialog.title")}
      testId="fuse-dialog"
      footer={
        request ? (
          <>
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
          </>
        ) : null
      }
    >
      {request ? (
        <>
          <GameDialogText className="mt-2 [@media(max-height:500px)]:mt-1">
            {tr("workshop.fuseDialog.text")}
          </GameDialogText>
          <div
            className="border-parchment-rule bg-parchment-deep mt-3 rounded-lg border-2 px-3 py-2 text-left text-sm [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs"
            data-testid="fuse-dialog-decks"
          >
            <p className="text-ink-soft font-semibold">
              {tr("workshop.fuseDialog.decks")}
            </p>
            <ul className="mt-1 list-disc pl-5 font-bold">
              {request.decks.map((slot) => (
                <li key={slot.id}>{deckName(slot)}</li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </GameDialog>
  );
};
