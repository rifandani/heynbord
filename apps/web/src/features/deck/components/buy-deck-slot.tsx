import { RegistryContext, useAtomValue } from "@effect/atom-react";
import {
  buyDeckSlot,
  coinDenominations,
  nextDeckSlotPrice,
} from "@workspace/rules";
import { cn } from "cn";
import { useContext, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { deckSlotsAtom } from "@/features/deck/deck.atoms";
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
  <span className="flex w-fit items-center rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-2.5 py-1 text-sm leading-none font-black whitespace-nowrap text-[#fff6df] tabular-nums shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:text-xs">
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
        className="group relative flex h-full shrink-0 cursor-pointer items-end rounded-t-md outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
        data-testid="deck-buy-slot"
      >
        <span
          className={cn(
            "relative flex h-10 w-full items-center gap-1.5 border-2 border-b-0 border-dashed border-[#e7bb6a]/45 bg-[#3a2314] px-3 pt-2.5 pb-2 text-sm font-black text-[#fff6df]/90 transition-[filter] duration-150 group-data-[hovered]:brightness-125 motion-reduce:transition-none",
            "[clip-path:polygon(0_0,50%_7px,100%_0,100%_100%,0_100%)]",
            "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-1 [@media(max-height:500px)]:text-[11px]"
          )}
        >
          <GlyphIcon
            glyph="lock"
            className="size-4 shrink-0 text-[#e7bb6a] [@media(max-height:500px)]:size-3"
          />
          <CoinAmount parts={coinDenominations(price)} format={format} />
        </span>
      </Button>
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      >
        <Modal className="fade-in zoom-in-95 animate-in w-[min(400px,94vw)] rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] p-5 text-center text-[#2a1d12] shadow-2xl duration-200 motion-reduce:animate-none [@media(max-height:500px)]:p-3">
          <Dialog className="outline-none" data-testid="buy-slot-dialog">
            {({ close }) => (
              <>
                <Heading
                  slot="title"
                  className="font-display text-2xl font-black [@media(max-height:500px)]:text-xl"
                >
                  {tr("deckBuilder.buySlot.title", { number: slotNumber })}
                </Heading>
                <dl className="mx-auto mt-3 grid w-fit grid-cols-[auto_auto] items-center gap-x-4 gap-y-2 text-left text-sm">
                  <dt className="text-[#5b4632]">
                    {tr("deckBuilder.buySlot.price")}
                  </dt>
                  <dd className="flex justify-end">
                    <CoinPlate copper={price} format={format} words={words} />
                  </dd>
                  <dt className="text-[#5b4632]">
                    {tr("deckBuilder.buySlot.balance")}
                  </dt>
                  <dd
                    className="flex justify-end"
                    data-testid="buy-slot-balance"
                  >
                    <CoinPlate
                      copper={balances.coin}
                      format={format}
                      words={words}
                    />
                  </dd>
                </dl>
                {canBuy ? null : (
                  <p
                    className="mt-3 text-sm font-bold text-[#8f2a1e]"
                    data-testid="buy-slot-short"
                  >
                    {tr("deckBuilder.buySlot.short", {
                      amount: words(price - balances.coin),
                    })}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:500px)]:mt-2">
                  <GameButton intent="wood" onPress={close}>
                    {tr("deckBuilder.buySlot.cancel")}
                  </GameButton>
                  <GameButton
                    intent="gold"
                    autoFocus={canBuy}
                    isDisabled={!canBuy}
                    onPress={() => {
                      close();
                      buy();
                    }}
                    data-testid="buy-slot-confirm"
                  >
                    {tr("deckBuilder.buySlot.buy")}
                  </GameButton>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
