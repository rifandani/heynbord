/**
 * The Seaport screen (Economy 2.8, ADR-0053): the harbour seen from the
 * water, with the voyage chooser and the berth plate in the middle of the
 * screen. The Player selects a Cargo and a duration, reads the Manifest,
 * Dispatches the ship, and Collects its reward there. The rules own the
 * reward math; the screen sends the device time with each Command.
 */
import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { Expedition } from "@workspace/rules";
import { getCargo, getDuration } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useContext, useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
  Label,
  RadioGroup,
} from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { playerLevelAtom } from "@/features/profile/profile.atoms";
import { BerthPlate } from "@/features/seaport/components/berth-plate";
import type { LastCollect } from "@/features/seaport/components/berth-plate";
import { CargoPlaque } from "@/features/seaport/components/cargo-plaque";
import { DurationChip } from "@/features/seaport/components/duration-chip";
import { HarbourScene } from "@/features/seaport/components/harbour-scene";
import { ManifestPlate } from "@/features/seaport/components/manifest-plate";
import {
  durationOptions,
  firstVoyage,
  shipVoyage,
  voyageLock,
} from "@/features/seaport/seaport";
import {
  cargoOptionsAtom,
  lastVoyageAtom,
  seaportAtom,
} from "@/features/seaport/seaport.atoms";
import { useSeaport } from "@/features/seaport/use-seaport";
import { useVoyageName } from "@/features/seaport/use-voyage-name";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { balancesAtom } from "@/features/town/town.atoms";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The label plate of a chooser: a small Night Plate with a glyph. */
const ChooserLabel = ({
  glyph,
  children,
}: {
  readonly glyph: Glyph;
  readonly children: string;
}) => (
  <Label className="font-display flex w-fit items-center gap-2 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 px-3 py-0.5 text-[15px] font-black shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:800px)]:sr-only">
    <GlyphIcon glyph={glyph} className="size-4 text-[#e9c46a]" />
    {children}
  </Label>
);

/**
 * The chooser while the ship is out: a "Next voyage" strip that opens to the
 * Cargo, the duration and the Manifest, so that the Player can plan the next
 * voyage. The berth plate above it is the focal piece.
 */
const NextVoyage = ({
  name,
  isExpanded,
  onExpandedChange,
  children,
}: {
  readonly name: string;
  readonly isExpanded: boolean;
  readonly onExpandedChange: (expanded: boolean) => void;
  readonly children: ReactNode;
}) => {
  const { tr } = useGameText();
  return (
    <Disclosure
      isExpanded={isExpanded}
      onExpandedChange={onExpandedChange}
      className="group flex flex-col gap-2 [@media(max-height:500px)]:gap-1.5"
      data-testid="next-voyage"
    >
      <Heading className="m-0">
        <Button
          slot="trigger"
          className={cn(
            "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 px-3 text-left text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] outline-none",
            "transition-[background-color,translate,box-shadow] duration-100 data-[hovered]:bg-[#2a1e15]/90 data-[pressed]:translate-y-px data-[pressed]:shadow-[0_2px_0_rgba(0,0,0,0.45)]",
            "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
            "[@media(max-height:500px)]:min-h-10 [@media(max-height:500px)]:px-2.5"
          )}
          data-testid="next-voyage-trigger"
        >
          <GlyphIcon
            glyph="hourglass"
            className="size-4 shrink-0 text-[#e9c46a]"
          />
          <span className="font-display text-[15px] font-black [@media(max-height:500px)]:text-sm">
            {tr("seaport.nextVoyage")}
          </span>
          <span className="ml-auto truncate text-xs font-bold text-[#e8d9bb] tabular-nums">
            {name}
          </span>
          <GlyphIcon
            glyph="chevron"
            className="size-3.5 shrink-0 text-[#e9c46a] group-data-[expanded]:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
          />
        </Button>
      </Heading>
      <DisclosurePanel className="flex flex-col gap-2 [@media(max-height:500px)]:gap-1.5">
        {children}
      </DisclosurePanel>
    </Disclosure>
  );
};

/**
 * The Seaport screen. The Balance Plate is at the top right; after a
 * Collect, the Coin and the Essence count up and bump once. In the middle of
 * the screen: the Cargo plaques (2 × 2), the duration row, the Manifest with
 * the one gold Dispatch under it, and the berth plate.
 *
 * The berth plate leads when it has something to say: the ship is at sea or
 * back, or the Player collected in this visit. While the ship is out, the
 * chooser folds into the "Next voyage" strip under the berth plate, and a
 * note takes the place of the Dispatch, which cannot work. After a Collect,
 * the chooser opens by itself, under the receipt, so no plate jumps. Only at
 * the berth with no Collect in this visit does the chooser lead.
 *
 * On a short screen, the two columns are side by side, the Cargo plaques are
 * one row of icon tiles, and the right column starts under the Balance
 * Plate. Below 800px of height, the label plates are for screen readers
 * only, so that the Collect of the berth plate stays in view.
 * The screen fades in; with reduced motion, it shows at once.
 */
export const SeaportScreen = () => {
  const { tr } = useGameText();
  const registry = useContext(RegistryContext);
  const level = useAtomValue(playerLevelAtom);
  const cargoes = useAtomValue(cargoOptionsAtom);
  const seaport = useAtomValue(seaportAtom);
  const balances = useAtomValue(balancesAtom);
  const coin = useCountTo(balances.coin);
  const essence = useCountTo(balances.essence);
  const { dispatch } = useSeaport();
  const voyageName = useVoyageName();
  const [voyage, setVoyage] = useState<Expedition>(() =>
    firstVoyage(level, seaport, registry.get(lastVoyageAtom))
  );
  const [last, setLast] = useState<LastCollect | null>(null);
  const [said, setSaid] = useState("");
  // The Next voyage strip starts closed for each voyage.
  const [opened, setOpened] = useState(false);
  const [bumps, setBumps] = useState({ coin: 0, essence: 0 });
  const atSea = shipVoyage(seaport);
  const away = atSea !== null;
  const berthLeads = away || last !== null;
  const lock = voyageLock(level, voyage);
  const name = voyageName(voyage);
  const stoneTier =
    getCargo("forgeStones").forgeStones?.[voyage.hours].tier ?? "epic";

  const onDispatch = () => {
    if (dispatch(voyage) === null) {
      setSaid(tr("seaport.cannotDispatch"));
      return;
    }
    unlockAudio();
    playSound("select");
    registry.set(lastVoyageAtom, voyage);
    setLast(null);
    setOpened(false);
    setSaid(tr("seaport.dispatched", { name, hours: voyage.hours }));
  };

  const onCollected = (collect: LastCollect | null) => {
    if (collect === null) {
      setSaid(tr("seaport.cannotCollect"));
      return;
    }
    setLast(collect);
    setBumps((value) => ({
      coin: value.coin + (collect.reward.coin > 0 ? 1 : 0),
      essence: value.essence + (collect.reward.essence > 0 ? 1 : 0),
    }));
    const collected = tr("seaport.berth.collected", {
      name: voyageName(collect.expedition),
    });
    setSaid(
      collect.levelAfter > collect.levelBefore
        ? `${collected} ${tr("battle.levelUp", { level: collect.levelAfter })}`
        : collected
    );
  };

  const choices = (
    <>
      <RadioGroup
        value={voyage.cargo}
        onChange={(value) =>
          setVoyage({ cargo: getCargo(value).id, hours: voyage.hours })
        }
        className="flex flex-col gap-1.5"
      >
        <ChooserLabel glyph="anchor">{tr("seaport.cargo")}</ChooserLabel>
        <div className="grid grid-cols-2 gap-1.5 pt-1 [@media(max-height:500px)]:grid-cols-4 [@media(max-height:800px)]:pt-1.5">
          {cargoes.map((option) => (
            <CargoPlaque
              key={option.cargo.id}
              option={option}
              tier={stoneTier}
              atSea={atSea?.cargo === option.cargo.id}
            />
          ))}
        </div>
      </RadioGroup>
      <RadioGroup
        value={String(voyage.hours)}
        onChange={(value) =>
          setVoyage({
            cargo: voyage.cargo,
            hours: getDuration(Number(value)).hours,
          })
        }
        orientation="horizontal"
        className="flex flex-col gap-1.5"
      >
        <ChooserLabel glyph="hourglass">{tr("seaport.duration")}</ChooserLabel>
        <div className="flex gap-1 rounded-xl border-2 border-[#e9c46a]/45 bg-[#1c140e]/85 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_3px_0_rgba(0,0,0,0.45)]">
          {durationOptions(level).map((option) => (
            <DurationChip key={option.duration.hours} option={option} />
          ))}
        </div>
      </RadioGroup>
      <ManifestPlate voyage={voyage} lock={lock} away={away} />
    </>
  );
  const chooser = (
    <section
      key="chooser"
      className="flex shrink-0 flex-col gap-2 [@media(max-height:500px)]:gap-1.5"
      data-testid="voyage-chooser"
    >
      {away ? (
        <NextVoyage
          name={name}
          isExpanded={opened}
          onExpandedChange={setOpened}
        >
          {choices}
          <p
            className="flex w-fit items-center gap-1.5 rounded-lg bg-[#1c140e]/80 px-2.5 py-1 text-xs font-semibold text-[#e8d9bb]"
            data-testid="seaport-sail-note"
          >
            <GlyphIcon glyph="anchor" className="size-3 text-[#e9c46a]" />
            {tr("seaport.sailNote")}
          </p>
        </NextVoyage>
      ) : (
        <>
          {choices}
          <GameButton
            intent="gold"
            size="lg"
            isDisabled={lock !== null}
            onPress={onDispatch}
            aria-label={tr("seaport.dispatchLabel", { name })}
            aria-describedby={lock === null ? undefined : "dispatch-note"}
            className="font-display min-h-11 w-full shrink-0 tracking-[0.04em] [@media(max-height:500px)]:min-h-10"
            data-testid="seaport-dispatch"
          >
            {tr("seaport.dispatch")}
          </GameButton>
        </>
      )}
    </section>
  );
  const berthPlate = (
    <BerthPlate
      key={seaport.startedAt ?? "atBerth"}
      last={last}
      onCollected={onCollected}
    />
  );

  return (
    <main
      aria-label={tr("seaport.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="seaport"
    >
      <HarbourScene />
      <BalancePlate balances={{ ...balances, coin, essence }} bumps={bumps} />
      {/* The page heading stays for screen readers only. */}
      <h1 className="sr-only">{tr("seaport.title")}</h1>
      <div
        className={cn(
          "absolute top-[max(0.75rem,env(safe-area-inset-top))] bottom-[92px] left-1/2 flex w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 flex-col justify-center-safe gap-2.5 overflow-y-auto overscroll-contain",
          "[@media(max-height:500px)]:top-[max(0.5rem,env(safe-area-inset-top))] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:grid [@media(max-height:500px)]:w-[min(calc(100vw-1rem),40rem)] [@media(max-height:500px)]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] [@media(max-height:500px)]:items-start [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:[&>:last-child]:mt-10"
        )}
      >
        {berthLeads ? [berthPlate, chooser] : [chooser, berthPlate]}
      </div>
      <p className="sr-only" aria-live="polite" data-testid="seaport-said">
        {said}
      </p>
    </main>
  );
};
