import { useAtom } from "@effect/atom-react";
import type { PackDefinition, RaceId, RankId } from "@workspace/rules";
import {
  coinDenominations,
  PACKS,
  rankPips,
  TEN_PACKS,
} from "@workspace/rules";
import { cn } from "cn";
import { useMemo, useState } from "react";
import {
  Label,
  Radio,
  RadioGroup,
  SelectionIndicator,
} from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { raceGlyph } from "@/features/battle/glyphs";
import { RANK_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { RACES_WITH_CARDS } from "@/features/deck/deck";
import { shownHintAtom } from "@/features/hint/hint.atoms";
import { DropRatesDialog } from "@/features/packs/components/drop-rates-dialog";
import { FoundMeter } from "@/features/packs/components/found-meter";
import { CoinPrice, PackArt } from "@/features/packs/components/pack-art";
import { PackReveal } from "@/features/packs/components/pack-reveal";
import {
  ShopkeeperBubble,
  ShopScene,
} from "@/features/packs/components/shop-scene";
import type {
  OpenCount,
  PackOrder,
  PackState,
  PoolProgress,
  RevealedPack,
} from "@/features/packs/packs";
import {
  bestRank,
  dropRateBar,
  isFreeOrder,
  missingCoin,
  newCardCount,
  orderPrice,
  packsToGuarantee,
  poolProgress,
} from "@/features/packs/packs";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { useGuaranteeText } from "@/features/packs/use-guarantee-text";
import { usePacks } from "@/features/packs/use-packs";
import { BalancePlate } from "@/features/town/components/balance-plate";

/** "All cards", or one Race for the Race Packs. */
type Pool = "all" | RaceId;

const POOLS: readonly Pool[] = ["all", ...RACES_WITH_CARDS];

/** The HUD plate of the top band (DESIGN.md, HUD plate). */
const PLATE =
  "flex items-center rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/** The welcome lines of the shopkeeper, one after the other. */
const WELCOMES = ["a", "b", "c"] as const;

/** Each visit to the shop starts at the next welcome line. */
let visits = 0;

/** What the shopkeeper says. */
type ShopLine =
  | { readonly kind: "firstVisit" }
  | { readonly kind: "welcome"; readonly index: number }
  | { readonly kind: "complete" }
  | { readonly kind: "pool"; readonly pool: Pool }
  /** After a reveal: the best Rank, and the number of new cards. */
  | {
      readonly kind: "reaction";
      readonly rank: RankId;
      readonly fresh: number;
    };

const useShopLineText = () => {
  const { tr } = useGameText();
  return (line: ShopLine): string => {
    switch (line.kind) {
      case "firstVisit": {
        return tr("packs.shopkeeper.firstVisit");
      }
      case "welcome": {
        const key = WELCOMES[line.index % WELCOMES.length] ?? "a";
        return tr(`packs.shopkeeper.welcome.${key}`);
      }
      case "complete": {
        return tr("packs.shopkeeper.complete");
      }
      case "pool": {
        return line.pool === "all"
          ? tr("packs.shopkeeper.all")
          : tr(`packs.shopkeeper.races.${line.pool}`);
      }
      default: {
        if (
          line.rank === "rare" ||
          line.rank === "epic" ||
          line.rank === "legendary"
        ) {
          return tr(`packs.shopkeeper.reactions.${line.rank}`);
        }
        return tr(
          line.fresh > 0
            ? "packs.shopkeeper.reactions.fresh"
            : "packs.shopkeeper.reactions.copies"
        );
      }
    }
  };
};

const segment = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "relative isolate flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-bold whitespace-nowrap transition-colors duration-200 outline-none select-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
    "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs",
    isSelected
      ? "text-[#2a1a05]"
      : "text-[#fff6df]/85 data-[hovered]:bg-[#fff6df]/10 data-[hovered]:text-[#fff6df]"
  );

/**
 * The cards in the Packs: all cards, or one Race. One control for the three
 * Packs, so that their prices change together. The gold plate of the selected
 * segment slides to a new segment, as the filters of the Deck builder.
 */
const PoolStrip = ({
  pool,
  onChange,
}: {
  readonly pool: Pool;
  readonly onChange: (pool: Pool) => void;
}) => {
  const { tr } = useGameText();
  return (
    <RadioGroup
      value={pool}
      onChange={(next) => {
        const option = POOLS.find((candidate) => candidate === next);
        if (option) {
          onChange(option);
        }
      }}
      orientation="horizontal"
      className={cn(PLATE, "max-w-full gap-0.5 overflow-x-auto p-1")}
      data-testid="pack-pool"
    >
      <Label className="sr-only">{tr("packs.pool.label")}</Label>
      {POOLS.map((id) => (
        <Radio
          key={id}
          value={id}
          className={segment}
          data-testid={`pack-pool-${id}`}
        >
          {({ isSelected }) => (
            <>
              {id === "all" ? (
                tr("packs.pool.all")
              ) : (
                <>
                  <GlyphIcon
                    glyph={raceGlyph(id)}
                    className="size-4 shrink-0"
                  />
                  <span className="max-[1099px]:sr-only">
                    {tr(`races.${id}`)}
                  </span>
                </>
              )}
              <SelectionIndicator
                isSelected={isSelected}
                className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[0_1px_2px_rgba(60,30,5,0.45)] motion-safe:transition-[translate,width] motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              />
            </>
          )}
        </Radio>
      ))}
    </RadioGroup>
  );
};

/**
 * The Rank Gems at legend size: the count of gems names the Rank, as on the
 * Card Frame (The Never Color Alone Rule).
 */
const MiniGems = ({ rank }: { readonly rank: RankId }) => (
  <span className="inline-flex items-center gap-[2px]">
    {Array.from({ length: rankPips(rank) }, (_, index) => (
      <span
        key={index}
        className="size-[5px] rotate-45 border border-[#2a1a08]"
        style={{ backgroundColor: RANK_COLORS[rank] }}
      />
    ))}
  </span>
);

/**
 * A small Rank bar of the Drop Rates of a Pack, and under it the rate of each
 * Rank with its Rank Gems, so that the Rank never shows by color only.
 */
const RankBar = ({ pack }: { readonly pack: PackDefinition }) => {
  const { tr, locale } = useGameText();
  const percent = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 1,
      }),
    [locale]
  );
  const segments = dropRateBar(pack);
  const rates = segments
    .map(
      (part) =>
        `${tr(`ranks.${part.rank}`)} ${percent.format(part.basisPoints / 10_000)}`
    )
    .join(", ");
  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the bar and its legend are one labelled picture of the Drop Rates
      role="img"
      aria-label={tr("packs.rankBar", { rates })}
      data-testid={`pack-rank-bar-${pack.id}`}
    >
      <div className="flex h-2 w-full overflow-hidden rounded-full border border-black/40 bg-black/40">
        {segments.map((part) => (
          <span
            key={part.rank}
            className="h-full"
            style={{
              width: `${part.basisPoints / 100}%`,
              backgroundColor: RANK_COLORS[part.rank],
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs leading-none font-bold text-[#e8d9bb] tabular-nums [@media(max-height:500px)]:text-[10px]">
        {segments.map((part) => (
          <span key={part.rank} className="flex items-center gap-1">
            <MiniGems rank={part.rank} />
            {percent.format(part.basisPoints / 10_000)}
          </span>
        ))}
      </div>
    </div>
  );
};

/** The Pack Guarantee line: the Rank and how many Packs are left. */
const GuaranteeLine = ({
  pack,
  counter,
}: {
  readonly pack: PackDefinition;
  readonly counter: number;
}) => {
  const guarantee = useGuaranteeText();
  const rank: RankId = pack.guarantee.rank;
  const left = packsToGuarantee(pack, counter);
  return (
    <p
      className="flex items-start gap-1.5 text-xs leading-snug font-semibold text-[#fff6df] [@media(max-height:500px)]:text-[11px]"
      data-testid={`pack-guarantee-${pack.id}`}
      data-left={left}
    >
      {/* The shield has the color of the Guarantee Rank; the text names the Rank. */}
      <span className="mt-px shrink-0" style={{ color: RANK_COLORS[rank] }}>
        <GlyphIcon glyph="shield" className="size-3.5" />
      </span>
      <span>{guarantee(rank, left)}</span>
    </p>
  );
};

/** The two buttons of a Pack: Open and Open ×10 (Royal: Open ×10 (+1)). */
const OpenButton = ({
  order,
  packState,
  coin,
  onOpen,
}: {
  readonly order: PackOrder;
  readonly packState: PackState;
  readonly coin: number;
  readonly onOpen: (order: PackOrder) => void;
}) => {
  const { tr } = useGameText();
  const { format, words, short } = useCoinFormat();
  const name = tr(`packs.names.${order.pack}`);
  const free = isFreeOrder(order, packState);
  const price = orderPrice(order, packState);
  const missing = missingCoin(order, packState, coin);
  const ten = order.count === TEN_PACKS;
  const title = ten
    ? tr(order.pack === "royal" ? "packs.openTenPlus" : "packs.openTen")
    : free
      ? tr("packs.free")
      : tr("packs.open");
  const label = free
    ? tr("packs.openFreeLabel", { pack: name })
    : missing > 0
      ? tr("packs.missingLabel", {
          action: title,
          pack: name,
          amount: words(missing),
        })
      : tr("packs.openLabel", {
          action: title,
          pack: name,
          price: words(price),
        });
  return (
    <GameButton
      intent={ten ? "wood" : "gold"}
      isDisabled={missing > 0}
      onPress={() => onOpen(order)}
      aria-label={label}
      className={cn(
        "min-h-12 flex-1 flex-col gap-0.5 px-2 leading-none",
        "[@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:w-full [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:justify-between [@media(max-height:500px)]:gap-2",
        free && "font-display text-lg font-black"
      )}
      data-testid={`pack-open${ten ? "-ten" : ""}-${order.pack}`}
      data-free={free || undefined}
    >
      <span className="text-sm font-bold whitespace-nowrap [@media(max-height:500px)]:text-xs">
        {title}
      </span>
      {free ? null : missing > 0 ? (
        <span className="text-xs font-semibold whitespace-nowrap [@media(max-height:500px)]:text-[10px]">
          {tr("packs.need", { amount: short(missing) })}
        </span>
      ) : (
        <CoinPrice
          parts={coinDenominations(price)}
          format={format}
          className="text-xs font-bold [@media(max-height:500px)]:text-[10px]"
        />
      )}
    </GameButton>
  );
};

/**
 * One Pack on the shelf: the painted Pack, then a plate with its name, its
 * job, the Rank bar of its Drop Rates, its Pack Guarantee line and the Open
 * buttons. On a short screen, the Pack stands at the left of its plate.
 */
const PackStand = ({
  pack,
  race,
  packState,
  coin,
  onOpen,
}: {
  readonly pack: PackDefinition;
  readonly race: RaceId | null;
  readonly packState: PackState;
  readonly coin: number;
  readonly onOpen: (order: PackOrder) => void;
}) => {
  const { tr } = useGameText();
  const one: PackOrder = { pack: pack.id, race, count: 1 };
  const free = isFreeOrder(one, packState);
  const order = (count: OpenCount): PackOrder => ({
    pack: pack.id,
    race,
    count,
  });
  return (
    <li
      className="group/stand flex w-[min(280px,31vw)] flex-col items-center [@media(max-height:500px)]:w-[min(272px,31vw)] [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-end [@media(max-height:500px)]:gap-1"
      data-testid={`pack-${pack.id}`}
    >
      <PackArt
        pack={pack.id}
        race={race}
        free={free}
        dim={missingCoin(one, packState, coin) > 0}
        sheen
        className="z-10 -mb-3 h-[min(34dvh,250px)] transition-transform duration-150 ease-out group-hover/stand:-translate-y-1 motion-reduce:transition-none [@media(max-height:500px)]:mb-0 [@media(max-height:500px)]:h-auto [@media(max-height:500px)]:w-[30%] [@media(max-height:500px)]:shrink-0"
      />
      <section
        aria-labelledby={`pack-name-${pack.id}`}
        className={cn(
          PLATE,
          "relative w-full flex-col items-stretch gap-2 rounded-xl px-3 pt-4 pb-3 [@media(max-height:500px)]:w-auto [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:flex-1 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-1.5"
        )}
      >
        {/* The wood ledge that the Pack stands on. */}
        <span
          className="absolute inset-x-2 -top-1.5 h-3 rounded-md border-2 border-[#2a1a0c] bg-gradient-to-b from-[#7a5233] to-[#563720] shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:hidden"
          aria-hidden
        />
        <div className="text-center [@media(max-height:500px)]:text-left">
          <h2
            id={`pack-name-${pack.id}`}
            className="font-display text-lg leading-tight font-bold text-[#ffe08a] [@media(max-height:500px)]:text-sm"
          >
            {tr(`packs.names.${pack.id}`)}
          </h2>
          <p className="mt-0.5 min-h-[2lh] text-xs leading-snug text-[#e8d9bb] [@media(max-height:500px)]:sr-only">
            {tr(`packs.jobs.${pack.id}`)}
          </p>
        </div>
        <RankBar pack={pack} />
        <GuaranteeLine
          pack={pack}
          counter={packState.guaranteeCounters[pack.id]}
        />
        <div className="mt-1 flex gap-2 [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:flex-col [@media(max-height:500px)]:gap-1">
          <OpenButton
            order={order(1)}
            packState={packState}
            coin={coin}
            onOpen={onOpen}
          />
          <OpenButton
            order={order(TEN_PACKS)}
            packState={packState}
            coin={coin}
            onOpen={onOpen}
          />
        </div>
      </section>
    </li>
  );
};

/** The open reveal: the order, its opened Packs and the pool count before them. */
interface Opened {
  readonly order: PackOrder;
  readonly packs: readonly RevealedPack[];
  readonly progress: PoolProgress;
  /** A new number for each purchase, so Open another starts a new reveal. */
  readonly serial: number;
}

/**
 * The Packs screen (Economy 3.1): the inside of the Card shop, where the
 * three Packs stand side by side on the counter. The pool control (all cards
 * or one Race) and the "Cards found" count of that pool, the Drop Rates dialog
 * and the Balance Plate. The lamps breathe and dust drifts in the window
 * light. The shopkeeper talks: a welcome, a line for the selected pool, and a
 * reaction to the last reveal; a press on him gives a new welcome. An Open
 * button buys the Packs and opens the reveal over the screen.
 */
export const PacksScreen = () => {
  const { tr } = useGameText();
  const lineText = useShopLineText();
  const { balances, coin, packState, collection, classId, buy } = usePacks();
  const [hint, setHint] = useAtom(shownHintAtom);
  const [pool, setPool] = useState<Pool>("all");
  const [opened, setOpened] = useState<Opened | null>(null);
  const race = pool === "all" ? null : pool;
  const progress = useMemo(
    () => poolProgress(race, classId, collection),
    [race, classId, collection]
  );
  const [say, setSay] = useState<{
    readonly line: ShopLine;
    readonly serial: number;
  }>(() => {
    visits += 1;
    if (!packState.freePackUsed) {
      return { line: { kind: "firstVisit" }, serial: 0 };
    }
    return progress.found >= progress.total
      ? { line: { kind: "complete" }, serial: 0 }
      : { line: { kind: "welcome", index: visits - 1 }, serial: 0 };
  });
  const talk = (line: ShopLine) =>
    setSay((current) => ({ line, serial: current.serial + 1 }));

  const changePool = (next: Pool) => {
    setPool(next);
    const nextProgress = poolProgress(
      next === "all" ? null : next,
      classId,
      collection
    );
    talk(
      nextProgress.found >= nextProgress.total
        ? { kind: "complete" }
        : { kind: "pool", pool: next }
    );
  };

  const open = (order: PackOrder) => {
    const before = poolProgress(order.race, classId, collection);
    const packs = buy(order);
    if (!packs) {
      return;
    }
    unlockAudio();
    playSound("select");
    if (hint === "freePack") {
      setHint(null);
    }
    setOpened((current) => ({
      order,
      packs,
      progress: before,
      serial: (current?.serial ?? 0) + 1,
    }));
  };

  const close = () => {
    if (opened) {
      talk({
        kind: "reaction",
        rank: bestRank(opened.packs),
        fresh: newCardCount(opened.packs),
      });
    }
    setOpened(null);
  };

  const welcomeNext = () => {
    visits += 1;
    talk({ kind: "welcome", index: visits - 1 });
  };

  return (
    <main
      aria-label={tr("packs.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden bg-[#2a1824] text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="packs"
    >
      {/* The Card shop inside (Town Concepts, section 9). */}
      <ShopScene>
        {opened ? null : (
          <ShopkeeperBubble
            line={lineText(say.line)}
            serial={say.serial}
            onTalk={welcomeNext}
          />
        )}
      </ShopScene>
      <div className="absolute inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-20 flex items-start gap-2 px-[max(0.5rem,env(safe-area-inset-left))]">
        <header
          className={cn(
            PLATE,
            "h-16 gap-3 pr-2 pl-4 [@media(max-height:500px)]:h-10 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pl-3"
          )}
        >
          <h1 className="font-display text-3xl leading-none font-black tracking-[0.025em] text-[#ffe08a] [text-shadow:0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:text-xl">
            {tr("packs.title")}
          </h1>
          <span
            className="h-7 w-0.5 rounded-full bg-[#e9c46a]/25"
            aria-hidden
          />
          <DropRatesDialog className="[@media(max-height:500px)]:min-h-7 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs" />
        </header>
      </div>
      <BalancePlate balances={balances} />
      <div className="pointer-events-none absolute inset-x-0 top-[calc(max(0.5rem,env(safe-area-inset-top))+4.5rem)] bottom-[80px] flex flex-col items-center justify-center gap-6 px-2 pb-4 [@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[56px] [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pb-2">
        {/* On a tall screen, "Cards found" is under the pool strip, so the
            row stays narrow and the shopkeeper has room to talk. */}
        <div
          className="pointer-events-auto flex max-w-full items-center gap-2 [@media(min-height:760px)]:flex-col [@media(min-height:760px)]:gap-1.5"
          data-shop-avoid
        >
          <PoolStrip pool={pool} onChange={changePool} />
          <div
            className={cn(
              PLATE,
              "h-11 shrink-0 px-3 [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:px-2 [@media(min-height:760px)]:h-9"
            )}
          >
            <FoundMeter progress={progress} />
          </div>
        </div>
        <ul
          className="pointer-events-auto flex items-end justify-center gap-[min(2rem,2.5vw)] [@media(max-height:500px)]:gap-[1.5vw]"
          data-testid="pack-list"
          data-shop-avoid
        >
          {PACKS.map((pack) => (
            <PackStand
              key={pack.id}
              pack={pack}
              race={race}
              packState={packState}
              coin={coin}
              onOpen={open}
            />
          ))}
        </ul>
      </div>
      {opened ? (
        <PackReveal
          key={opened.serial}
          order={opened.order}
          packs={opened.packs}
          progress={opened.progress}
          again={
            missingCoin(opened.order, packState, coin) === 0
              ? { price: orderPrice(opened.order, packState) }
              : null
          }
          onAgain={() => open(opened.order)}
          onClose={close}
        />
      ) : null}
    </main>
  );
};
