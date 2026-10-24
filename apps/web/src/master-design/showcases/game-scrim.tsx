import { cn } from "cn";

import { GAME_SCRIM_TINT } from "@/core/components/game/game-dialog";
import { parchmentStyles } from "@/core/components/game/surfaces";

import { Variant, VariantGrid } from "../variant";

/** A painted scene behind an overlay, drawn with the game tokens. */
const Scene = () => (
  <div className="bg-battle-meadow absolute inset-0">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,206,130,0.3),transparent_60%)]" />
    <div className="bg-wood/50 absolute inset-x-0 bottom-0 h-1/3" />
    <div className="bg-night-plate/70 border-gold-trim/40 absolute top-4 left-4 rounded-xl border-2 px-3 py-2">
      <span className="text-cream text-xs font-bold">Your Turn</span>
    </div>
  </div>
);

/**
 * The one scrim of the game (DESIGN.md, Parchment dialog): a 55% black wash
 * with a 2px blur. Every overlay darkens the scene with it; the Deck book,
 * the Handbook and the sheets use it too.
 */
export const GameScrimShowcase = () => (
  <div className="flex flex-col gap-6">
    <VariantGrid>
      <Variant label="the scene" className="w-full max-w-xl">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-black/20 shadow-xl">
          <Scene />
        </div>
      </Variant>
      <Variant label="with the scrim" className="w-full max-w-xl">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-black/20 shadow-xl">
          <Scene />
          <div className={cn("absolute inset-0", GAME_SCRIM_TINT)} />
          <div
            className={cn(
              parchmentStyles({ kind: "dialog", padding: "sm" }),
              "absolute inset-x-0 top-1/2 mx-auto w-[min(240px,80%)] -translate-y-1/2 text-center"
            )}
          >
            <p className="font-display text-lg font-black">
              Extract this card?
            </p>
            <p className="text-ink-soft mt-1 text-xs">
              The scrim keeps the scene, but turns the eye to the parchment.
            </p>
          </div>
        </div>
      </Variant>
    </VariantGrid>
    <p className="text-muted-fg max-w-2xl text-xs">
      Use it only on the overlay of a dialog or a sheet. The 2px blur is the
      same at every screen size, and the overlay adds the short-screen padding
      around the parchment.
    </p>
  </div>
);
