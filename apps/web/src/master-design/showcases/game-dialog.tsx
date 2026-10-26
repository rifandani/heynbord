import { cn } from "cn";
import { useState } from "react";

import { GameButton } from "@/core/components/game/game-button";
import {
  GameDialog,
  GameDialogText,
  GameSheet,
  GAME_SCRIM_TINT,
} from "@/core/components/game/game-dialog";

import { Variant, VariantGrid } from "../variant";

/** A static phone in landscape, so the catalog shows the sheet without a resize. */
const SheetPreview = () => (
  <div className="bg-battle-meadow relative aspect-video w-full max-w-xl overflow-hidden rounded-2xl border-2 border-black/20 shadow-xl">
    <div className="from-gold-light/25 absolute inset-0 bg-radial-[at_30%_20%] to-transparent to-60%" />
    <div className={cn("absolute inset-0", GAME_SCRIM_TINT)} />
    <div
      className={cn(
        "border-frame-wood bg-parchment text-ink absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-2xl border-x-4 border-t-4 border-b-0 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-center"
      )}
    >
      <div className="border-parchment-rule flex items-center gap-3 border-b-2 pb-2 text-left">
        <h4 className="font-display flex-1 font-black">Extract this card?</h4>
        <span className="bg-wood text-cream shadow-piece border-wood-edge grid size-8 shrink-0 place-items-center rounded-lg border-2 text-xs">
          ✕
        </span>
      </div>
      <p className="text-ink-soft mt-2 text-xs">
        The sheet stands on the bottom edge of a phone in landscape.
      </p>
      <div className="mt-3 flex justify-center gap-2">
        <span className="bg-wood text-cream shadow-piece border-wood-edge rounded-lg border-2 px-3 py-1 text-xs font-semibold">
          Keep
        </span>
        <span className="border-gold-deep text-ink-on-gold shadow-piece from-gold-light to-gold rounded-lg border-2 bg-gradient-to-b px-3 py-1 text-xs font-semibold">
          Extract
        </span>
      </div>
    </div>
  </div>
);

/**
 * The parchment dialog: one scrim, one frame, one pair of actions. The Deck
 * book and the Handbook keep their own signature covers, but they sit on the
 * same scrim and use the same parchment. The sheet is the bottom variant for
 * a phone in landscape.
 */
export const GameDialogShowcase = () => {
  const [small, setSmall] = useState(false);
  const [large, setLarge] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-wood/30 flex flex-wrap gap-4 rounded-2xl p-6">
        <Variant label="small · confirm">
          <GameButton intent="wood" onPress={() => setSmall(true)}>
            Extract a card
          </GameButton>
        </Variant>
        <Variant label="large · rules with a close">
          <GameButton intent="wood" onPress={() => setLarge(true)}>
            Drop rates
          </GameButton>
        </Variant>
        <Variant label="sheet · phone landscape">
          <GameButton intent="wood" onPress={() => setSheet(true)}>
            Open a sheet
          </GameButton>
        </Variant>
      </div>

      <VariantGrid>
        <Variant label="the actions: wood then gold">
          <div className="bg-parchment border-frame-wood flex gap-3 rounded-2xl border-4 p-4">
            <GameButton intent="wood">Keep</GameButton>
            <GameButton intent="gold">Extract</GameButton>
          </div>
        </Variant>
      </VariantGrid>

      <Variant label="short screen: the dialog stays compact, the sheet comes up">
        <SheetPreview />
      </Variant>

      <GameDialog
        isOpen={small}
        onOpenChange={setSmall}
        title="Extract this card?"
        footer={
          <>
            <GameButton intent="wood" onPress={() => setSmall(false)}>
              Keep
            </GameButton>
            <GameButton intent="gold" onPress={() => setSmall(false)}>
              Extract
            </GameButton>
          </>
        }
      >
        <GameDialogText className="mt-2">
          You get 120 Essence. You cannot undo this.
        </GameDialogText>
      </GameDialog>

      <GameDialog
        isOpen={large}
        onOpenChange={setLarge}
        size="lg"
        title="Drop rates"
        closeLabel="Close"
        footer={
          <GameButton intent="wood" onPress={() => setLarge(false)}>
            Close
          </GameButton>
        }
      >
        <GameDialogText className="mt-3">
          A more expensive Pack is not a better deal. Every Rank shows its rate
          here, and the Guarantee counts the Packs that you open.
        </GameDialogText>
      </GameDialog>

      <GameSheet
        isOpen={sheet}
        onOpenChange={setSheet}
        title="Extract this card?"
        closeLabel="Close"
        footer={
          <>
            <GameButton intent="wood" onPress={() => setSheet(false)}>
              Keep
            </GameButton>
            <GameButton intent="gold" onPress={() => setSheet(false)}>
              Extract
            </GameButton>
          </>
        }
      >
        <GameDialogText className="mt-2">
          The sheet stands on the bottom edge, so the board stays in view and
          the actions sit under the thumbs.
        </GameDialogText>
      </GameSheet>
    </div>
  );
};
