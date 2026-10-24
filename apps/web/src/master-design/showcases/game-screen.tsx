import { GameButton } from "@/core/components/game/game-button";
import {
  GameScreen,
  GameScreenTitle,
} from "@/core/components/game/game-screen";
import { NightPlate } from "@/core/components/game/night-plate";
import {
  ParchmentLabel,
  ParchmentPanel,
} from "@/core/components/game/parchment-panel";
import { gameText } from "@/core/components/game/surfaces";
import { BalancePlate } from "@/features/town/components/balance-plate";

import { Variant, VariantGrid } from "../variant";

const Preview = ({
  variant,
}: {
  readonly variant: "clear" | "crypt" | "shop";
}) => (
  <GameScreen contained label="Screen preview" tone={variant}>
    <div className="from-wood/40 to-night-plate absolute inset-0 bg-gradient-to-b" />
    <BalancePlate balances={{ coin: 12_470, essence: 320, heynstones: 18 }} />
    <div className="relative flex h-full flex-col p-4">
      <div className="flex items-center gap-3">
        <GameButton size="sm" intent="ghost">
          ← Back
        </GameButton>
        <GameScreenTitle>Campaign</GameScreenTitle>
        <span className={gameText({ role: "headline", tone: "cream" })}>
          Hearthvale
        </span>
      </div>
      <div className="mt-auto flex items-end gap-4">
        <NightPlate className="px-4 py-3">
          <p className={gameText({ role: "label", tone: "gold" })}>Your Turn</p>
          <p className={gameText({ role: "number", tone: "cream" })}>3</p>
        </NightPlate>
        <ParchmentPanel className="max-w-sm p-4">
          <ParchmentLabel>Stage 1-3</ParchmentLabel>
          <p className={gameText({ role: "body", tone: "soft" })}>
            The road to Marrow Castle. Win to open the Boss Stage.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <GameButton size="sm" intent="wood">
              Deck
            </GameButton>
            <GameButton size="sm" intent="gold">
              Fight
            </GameButton>
          </div>
        </ParchmentPanel>
      </div>
    </div>
  </GameScreen>
);

/**
 * The screen shell: a full-screen Heynbord surface with the same fade, safe
 * areas and Balance Plate as `/play`. `contained` frames it inside a card, so
 * a landing page can show a game screen without taking over the viewport.
 */
export const GameScreenShowcase = () => (
  <div className="flex flex-col gap-6">
    <VariantGrid>
      {(["clear", "crypt", "shop"] as const).map((variant) => (
        <Variant key={variant} label={variant} className="w-full max-w-xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-black/20 shadow-xl">
            <Preview variant={variant} />
          </div>
        </Variant>
      ))}
    </VariantGrid>
    <p className="text-muted-fg text-xs">
      The frame is 16:9. On a real screen the shell is fixed to the viewport and
      hides its overflow; the Town Bar sits over its bottom edge.
    </p>
  </div>
);
