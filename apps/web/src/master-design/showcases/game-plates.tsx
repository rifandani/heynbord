import { Button, TooltipTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import {
  GAME_TOOLTIP_CLASS,
  GameTooltip,
} from "@/core/components/game/game-tooltip";
import {
  NightPlate,
  NightPlateLabel,
} from "@/core/components/game/night-plate";
import {
  ParchmentLabel,
  ParchmentOverline,
  ParchmentPanel,
  ParchmentRule,
  ParchmentWell,
  NightPlateRule,
} from "@/core/components/game/parchment-panel";
import { gameText } from "@/core/components/game/surfaces";

import { Variant } from "../variant";

/**
 * The two surfaces of the game: a Night Plate for information over a painted
 * scene, and parchment for rules, choices and dialogs. Text on a plate is
 * cream; text on parchment is ink.
 */
export const GamePlatesShowcase = () => (
  <div className="flex flex-col gap-8">
    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Night plate</h4>
      <div className="bg-battle-meadow flex flex-wrap gap-4 rounded-2xl p-6">
        <Variant label="plate">
          <NightPlate className="px-4 py-3">
            <NightPlateLabel>Your Turn</NightPlateLabel>
            <p className={gameText({ role: "number", tone: "cream" })}>3</p>
          </NightPlate>
        </Variant>
        <Variant label="chip">
          <NightPlate kind="chip" className="px-2 py-1">
            <span className="text-xs font-bold">Boss</span>
          </NightPlate>
        </Variant>
        <Variant label="plate with a divider">
          <NightPlate className="flex items-center gap-3 px-3 py-2">
            <span className="text-sm font-bold">12</span>
            <NightPlateRule />
            <span className="text-cream-dim text-sm">Attack</span>
          </NightPlate>
        </Variant>
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Parchment panel</h4>
      <div className="bg-town-sky flex flex-wrap items-start gap-4 rounded-2xl p-6">
        <Variant label="panel">
          <ParchmentPanel className="w-80 p-5">
            <ParchmentLabel>The Workshop</ParchmentLabel>
            <ParchmentOverline className="mt-1 block">
              Craft a card
            </ParchmentOverline>
            <ParchmentWell className="mt-3 p-3">
              <p className={gameText({ role: "body" })}>
                Two copies of the same card make one card of the next Rank.
                Combine never fails.
              </p>
            </ParchmentWell>
            <ParchmentRule className="mt-3" />
            <div className="mt-3 flex justify-end gap-2">
              <GameButton size="sm" intent="wood">
                Cancel
              </GameButton>
              <GameButton size="sm" intent="gold">
                Combine
              </GameButton>
            </div>
          </ParchmentPanel>
        </Variant>
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Tooltip</h4>
      <div className="bg-night-plate border-gold-trim/40 inline-flex gap-4 rounded-2xl border-2 p-6">
        <Variant label="hover or focus">
          <TooltipTrigger delay={200}>
            <Button className="bg-wood text-cream shadow-piece border-wood-edge rounded-lg border-2 px-3 py-2 text-sm font-semibold">
              Heynstones
            </Button>
            <GameTooltip
              className={GAME_TOOLTIP_CLASS}
              offset={8}
              placement="bottom"
            >
              <span className="block font-bold">Heynstones</span>
              <span className="text-cream/85">Opens the Heynspire floors.</span>
            </GameTooltip>
          </TooltipTrigger>
        </Variant>
      </div>
    </section>
  </div>
);
