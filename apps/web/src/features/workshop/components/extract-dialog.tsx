import type { DeckSlot, RankId } from "@workspace/rules";
import { EXTRACT_ESSENCE } from "@workspace/rules";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog, GameDialogText } from "@/core/components/game/game-dialog";
import { useGameText } from "@/features/battle/use-game-text";
import { defaultSlotName } from "@/features/deck/deck";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { WORKSHOP_WARNING } from "@/features/workshop/tokens";

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
    <GameDialog
      isOpen={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          onKeep();
        }
      }}
      title={tr("workshop.extractDialog.title")}
      testId="extract-dialog"
      footer={
        request ? (
          <>
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
          </>
        ) : null
      }
    >
      {request ? (
        <>
          <GameDialogText className="mt-2 [@media(max-height:500px)]:mt-1">
            {tr("workshop.extractDialog.text")}
          </GameDialogText>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-base font-black [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            <BalanceIcon kind="essence" className="size-5 shrink-0" />
            {tr("workshop.extractDialog.gain", {
              essence: format(EXTRACT_ESSENCE[request.rank]),
            })}
          </p>
          {request.decks.length > 0 ? (
            <div
              className="border-parchment-rule bg-parchment-deep mt-3 rounded-lg border-2 px-3 py-2 text-left text-sm [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs"
              data-testid="extract-dialog-decks"
            >
              <p className="text-ink-soft font-semibold">
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
              className="mt-3 text-sm font-bold [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-xs"
              style={{ color: WORKSHOP_WARNING }}
              data-testid="extract-dialog-rank"
            >
              {tr("workshop.extractDialog.rank", {
                rank: tr(`ranks.${request.rank}`),
              })}
            </p>
          ) : null}
        </>
      ) : null}
    </GameDialog>
  );
};
