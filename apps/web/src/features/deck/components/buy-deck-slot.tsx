import { RegistryContext, useAtomValue } from "@effect/atom-react";
import {
  buyDeckSlot,
  coinDenominations,
  nextDeckSlotPrice,
} from "@workspace/rules";
import { cn } from "cn";
import { useContext, useMemo } from "react";
import { Button, DialogTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog } from "@/core/components/game/game-dialog";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { deckSlotsAtom } from "@/features/deck/deck.atoms";
import { DECK_COLORS } from "@/features/deck/tokens";
import { profileAtom } from "@/features/profile/profile.atoms";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";
import { balancesAtom } from "@/features/town/town.atoms";

/**
 * A Coin amount on the small Night Plate of a Battle reward: each
 * denomination with its coin and its letter, and the words for a screen
 * reader.
 */
const CoinPlate = ({
  copper,
  format,
  words,
}: {
  readonly copper: number;
  readonly format: (value: number) => string;
  readonly words: (copper: number) => string;
}) => (
  <span className="border-gold-trim/70 bg-night-plate/90 text-cream shadow-piece flex w-fit items-center rounded-xl border-2 px-2.5 py-1 text-sm leading-none font-black whitespace-nowrap tabular-nums [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:text-xs">
    <span className="sr-only">{words(copper)}</span>
    <span aria-hidden>
      <CoinAmount parts={coinDenominations(copper)} format={format} />
    </span>
  </span>
);

/**
 * The next Deck Slot that the Player can buy (GDD 6, Economy 3.5): a locked
 * ribbon after the last slot, with its Coin price. It opens a confirm dialog.
 * At the maximum it is not there. `onBought` gets the ID of the new slot.
 */
export const BuyDeckSlot = ({
  onBought,
}: {
  readonly onBought: (slotId: string) => void;
}) => {
  const { tr, locale } = useGameText();
  const registry = useContext(RegistryContext);
  const slots = useAtomValue(deckSlotsAtom);
  const balances = useAtomValue(balancesAtom);
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const words = (copper: number) =>
    coinWords(copper, format, (denomination) =>
      tr(`town.balances.denominations.${denomination}.name`)
    );

  const price = nextDeckSlotPrice(slots.length);
  if (price === null) {
    return null;
  }
  const slotNumber = slots.length + 1;
  const canBuy = balances.coin >= price;

  const buy = () => {
    // It reads the registry, not a render: two fast presses buy two times.
    const bought = buyDeckSlot(registry.get(profileAtom));
    if (!bought) {
      return;
    }
    registry.set(profileAtom, bought.profile);
    unlockAudio();
    playSound("select", 0);
    onBought(bought.slot.id);
  };

  return (
    <DialogTrigger>
      <Button
        aria-label={tr("deckBuilder.buySlot.ribbon", {
          number: slotNumber,
          price: words(price),
        })}
        className="group data-[focus-visible]:ring-focus-cream relative flex h-full shrink-0 cursor-pointer items-end rounded-t-md outline-none data-[focus-visible]:ring-4"
        data-testid="deck-buy-slot"
      >
        <span
          className={cn(
            "border-bronze-rim/45 text-cream/90 relative flex h-10 w-full items-center gap-1.5 border-2 border-b-0 border-dashed px-3 pt-2.5 pb-2 text-sm font-black transition-[filter] duration-150 group-data-[hovered]:brightness-125 motion-reduce:transition-none",
            "[clip-path:polygon(0_0,50%_7px,100%_0,100%_100%,0_100%)]",
            "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-1 [@media(max-height:500px)]:text-[11px]"
          )}
          style={{ backgroundColor: DECK_COLORS.slotNight }}
        >
          <GlyphIcon
            glyph="lock"
            className="text-bronze-rim size-4 shrink-0 [@media(max-height:500px)]:size-3"
          />
          <CoinAmount parts={coinDenominations(price)} format={format} />
        </span>
      </Button>
      <GameDialog
        title={tr("deckBuilder.buySlot.title", { number: slotNumber })}
        testId="buy-slot-dialog"
        footer={
          <>
            <GameButton intent="wood" slot="close">
              {tr("deckBuilder.buySlot.cancel")}
            </GameButton>
            <GameButton
              intent="gold"
              slot="close"
              autoFocus={canBuy}
              isDisabled={!canBuy}
              onPress={buy}
              data-testid="buy-slot-confirm"
            >
              {tr("deckBuilder.buySlot.buy")}
            </GameButton>
          </>
        }
      >
        <dl className="mx-auto mt-3 grid w-fit grid-cols-[auto_auto] items-center gap-x-4 gap-y-2 text-left text-sm">
          <dt className="text-ink-soft">{tr("deckBuilder.buySlot.price")}</dt>
          <dd className="flex justify-end">
            <CoinPlate copper={price} format={format} words={words} />
          </dd>
          <dt className="text-ink-soft">{tr("deckBuilder.buySlot.balance")}</dt>
          <dd className="flex justify-end" data-testid="buy-slot-balance">
            <CoinPlate copper={balances.coin} format={format} words={words} />
          </dd>
        </dl>
        {canBuy ? null : (
          <p
            className="mt-3 text-sm font-bold"
            style={{ color: DECK_COLORS.problemText }}
            data-testid="buy-slot-short"
          >
            {tr("deckBuilder.buySlot.short", {
              amount: words(price - balances.coin),
            })}
          </p>
        )}
      </GameDialog>
    </DialogTrigger>
  );
};
