import { useAtomValue } from "@effect/atom-react";
import type { PackDefinition, PackId } from "@workspace/rules";
import { coinDenominations, PACK_SIZE, PACKS, RANKS } from "@workspace/rules";
import { cn } from "cn";
import { useMemo, useState } from "react";
import type { Key } from "react-aria-components";
import {
  SelectionIndicator,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "react-aria-components";

import { RankGems } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { RANK_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { CLASSES_WITH_CARDS, RACES_WITH_CARDS } from "@/features/deck/deck";
import { CoinPrice, PackArt } from "@/features/packs/components/pack-art";
import { dropRateBar, packsToGuarantee } from "@/features/packs/packs";
import { packStateAtom } from "@/features/packs/packs.atoms";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { useGuaranteeText } from "@/features/packs/use-guarantee-text";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

const ROW = "border-t border-[#c9b48c]/70";

const WELL =
  "rounded-xl border-2 border-[#c9b48c] bg-[#f1e2c2] shadow-[inset_0_2px_4px_rgba(91,58,30,0.18)]";

/** The delay between two cells of the Pack Guarantee track, in ms. */
const TICK_MS = 22;

const toPack = (key: Key): PackId | null =>
  PACKS.find((pack) => pack.id === key)?.id ?? null;

/**
 * The three Packs stand on a wood shelf. Each Pack is a tab: the selected one
 * lifts off the shelf into a pool of lamp light, and a gold bar slides under
 * its name. The Peddler shows the Free tag until the Player opens it.
 */
const PackTab = ({
  pack,
  free,
}: {
  readonly pack: PackDefinition;
  readonly free: boolean;
}) => {
  const { tr } = useGameText();
  const { format, words } = useCoinFormat();
  return (
    <Tab
      id={pack.id}
      className="group/stand relative flex w-[30%] max-w-32 cursor-pointer flex-col items-center rounded-lg pb-1.5 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
      data-testid={`handbook-pack-tab-${pack.id}`}
    >
      {({ isSelected }) => (
        <>
          {/* The lamp light on the shelf under the selected Pack. */}
          <span
            className={cn(
              "pointer-events-none absolute top-[calc(var(--pack-h)-1.75rem)] left-1/2 h-10 w-[140%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,214,120,0.75),transparent)] transition-opacity duration-300",
              isSelected ? "opacity-100" : "opacity-0"
            )}
            aria-hidden
          />
          <PackArt
            pack={pack.id}
            pool={{ kind: "all" }}
            free={free}
            sheen
            className={cn(
              "z-10 h-(--pack-h) transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
              isSelected
                ? "-translate-y-2"
                : "group-data-[hovered]/stand:-translate-y-1"
            )}
          />
          <span
            className={cn(
              "font-display relative mt-2.5 text-center text-[0.8125rem] leading-tight font-bold text-balance transition-colors duration-200 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-xs",
              isSelected ? "text-[#2a1a0c]" : "text-[#5b4632]"
            )}
          >
            {tr(`packs.names.${pack.id}`)}
          </span>
          <CoinPrice
            parts={coinDenominations(pack.price)}
            format={format}
            className="mt-0.5 text-xs font-bold text-[#5b4632]"
          />
          <span className="sr-only">{words(pack.price)}</span>
          <SelectionIndicator
            isSelected={isSelected}
            className="absolute -bottom-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#e2a93b] to-[#ffe08a] shadow-[0_1px_2px_rgba(60,30,5,0.45)] motion-safe:transition-[translate] motion-safe:duration-[260ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        </>
      )}
    </Tab>
  );
};

/** The Drop Rates of one Pack: a Rank bar, and each Rank with its gems, name and chance. */
const RankRoll = ({ pack }: { readonly pack: PackDefinition }) => {
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
  return (
    <section aria-labelledby="pack-guide-roll" className="space-y-1.5">
      <h4 id="pack-guide-roll" className={LABEL}>
        {tr("handbook.packGuide.rollTitle")}
      </h4>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full border border-[#5b4632]/60 bg-[#5b4632]/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
        aria-hidden
      >
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
      <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-[0.8125rem] leading-tight font-semibold text-[#3d2e1f]">
        {segments.map((part) => (
          <li key={part.rank} className="flex items-center gap-1.5">
            <span className="text-[11px]" aria-hidden>
              <RankGems rank={part.rank} />
            </span>
            {tr(`ranks.${part.rank}`)}
            <span className="font-black tabular-nums">
              {percent.format(part.basisPoints / 10_000)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-snug text-[#5b4632]">
        {tr("handbook.packGuide.rollNote", { cards: PACK_SIZE })}
      </p>
    </section>
  );
};

/**
 * The Pack Guarantee as a row of Packs: the Packs in a row that gave no card
 * of the Guarantee Rank are dark, the next Pack has a gold ring, and the last
 * one is the shield in the Rank color. The row is the Player's own count. The
 * cells come in one by one and the shield stamps down, so the eye follows the
 * count up to the Guarantee.
 */
const GuaranteeTrack = ({
  pack,
  counter,
}: {
  readonly pack: PackDefinition;
  readonly counter: number;
}) => {
  const { tr } = useGameText();
  const guarantee = useGuaranteeText();
  const { rank, packs } = pack.guarantee;
  const before = packs - 1;
  const left = packsToGuarantee(pack, counter);
  const top = rank === RANKS.at(-1);
  const now = guarantee(rank, left);
  return (
    <section aria-labelledby="pack-guide-guarantee" className="space-y-1.5">
      <h4 id="pack-guide-guarantee" className={LABEL}>
        {tr("handbook.packGuide.guaranteeTitle")}
      </h4>
      <div
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the row of Packs is one labelled picture of the count
        role="img"
        aria-label={tr("handbook.packGuide.trackLabel", {
          opened: counter,
          before,
          guarantee: now,
        })}
        className={cn(
          WELL,
          "flex items-end justify-center gap-1 px-2.5 pt-2.5 pb-1"
        )}
        data-testid="handbook-pack-track"
        data-left={left}
      >
        {Array.from({ length: before }, (_, index) => {
          const opened = index < counter;
          const next = index === counter;
          return (
            <span
              key={index}
              className="flex max-w-6 min-w-0 flex-1 flex-col items-center gap-0.5"
            >
              <span
                className={cn(
                  "motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:fade-in motion-safe:slide-in-from-bottom-1 aspect-[2/3] w-full rounded-[3px] border motion-safe:duration-200",
                  opened
                    ? "border-[#3d2e1f] bg-[#7a5d3e]"
                    : "border-[#c9b48c] bg-[#e6d3ab]",
                  next &&
                    "border-[#b4781a] bg-[#fff2c4] ring-2 ring-[#e2a93b] ring-offset-1 ring-offset-[#f1e2c2]"
                )}
                style={{ animationDelay: `${index * TICK_MS}ms` }}
              />
              <span
                className={cn(
                  "h-1.5 w-0 border-x-[4px] border-b-[5px] border-x-transparent border-b-[#b4781a]",
                  !next && "invisible"
                )}
              />
            </span>
          );
        })}
        <span className="ml-1 flex shrink-0 flex-col items-center gap-0.5">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-full border-2 border-[#8a6a3c] bg-[radial-gradient(circle_at_35%_30%,#4a3a2a,#1f150d)] shadow-[0_2px_3px_rgba(40,20,5,0.45)] motion-safe:animate-[hint-seal_380ms_cubic-bezier(0.16,1,0.3,1)_both]",
              left === 1 && "ring-2 ring-[#e2a93b] ring-offset-1"
            )}
            style={{
              color: RANK_COLORS[rank],
              animationDelay: `${before * TICK_MS + 80}ms`,
            }}
          >
            <GlyphIcon glyph="shield" className="size-4" />
          </span>
          <span
            className={cn(
              "h-1.5 w-0 border-x-[4px] border-b-[5px] border-x-transparent border-b-[#b4781a]",
              left !== 1 && "invisible"
            )}
          />
        </span>
      </div>
      <p
        className="flex items-center gap-1.5 text-[0.8125rem] leading-snug font-bold text-[#2a1a0c]"
        data-testid="handbook-pack-guarantee-now"
      >
        <span className="shrink-0" style={{ color: RANK_COLORS[rank] }}>
          <GlyphIcon glyph="shield" className="size-3.5" />
        </span>
        {tr("handbook.packGuide.guaranteeNow", { guarantee: now })}
      </p>
      <p className="text-xs leading-snug text-[#5b4632]">
        {tr(
          top
            ? "handbook.packGuide.guaranteeRuleTop"
            : "handbook.packGuide.guaranteeRule",
          { before, rank: tr(`ranks.${rank}`) }
        )}
      </p>
    </section>
  );
};

/** New Card First and the Open ×10 bonus of one Pack, as ruled rows. */
const PackFacts = ({ pack }: { readonly pack: PackDefinition }) => {
  const { tr } = useGameText();
  return (
    <dl className="text-sm">
      <div className={cn(ROW, "grid grid-cols-[7.5rem_1fr] gap-x-3 py-1.5")}>
        <dt className="flex items-center gap-1.5 font-semibold">
          {tr("handbook.packGuide.newCardFirst")}
        </dt>
        <dd className="leading-snug font-medium text-[#3d2e1f]">
          {tr(
            pack.newCardFirst
              ? "handbook.packGuide.newCardFirstYes"
              : "handbook.packGuide.newCardFirstNo"
          )}
        </dd>
      </div>
      <div className={cn(ROW, "grid grid-cols-[7.5rem_1fr] gap-x-3 py-1.5")}>
        <dt className="font-semibold">{tr("packs.openTen")}</dt>
        <dd className="leading-snug font-medium text-[#3d2e1f]">
          {pack.tenPackBonus === "extraPack"
            ? tr("handbook.packGuide.tenExtra")
            : tr("handbook.packGuide.tenGuarantee", {
                rank: tr(`ranks.${pack.guarantee.rank}`),
              })}
        </dd>
      </div>
    </dl>
  );
};

/**
 * The Race Pack and the Class Pack of the selected Pack: the same Pack with
 * the Race Stamp and the Class Stamp.
 */
const PackVersions = ({ pack }: { readonly pack: PackDefinition }) => {
  const { tr } = useGameText();
  const { words } = useCoinFormat();
  const [race] = RACES_WITH_CARDS;
  const [classId] = CLASSES_WITH_CARDS;
  return (
    <section aria-labelledby="pack-guide-versions" className="space-y-1.5">
      <h4 id="pack-guide-versions" className={LABEL}>
        {tr("handbook.packGuide.versionsTitle")}
      </h4>
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 items-end gap-1.5" aria-hidden>
          {race ? (
            <PackArt
              pack={pack.id}
              pool={{ kind: "race", race }}
              className="h-24 -rotate-6 [@media(max-height:500px)]:h-20"
            />
          ) : null}
          {classId ? (
            <PackArt
              pack={pack.id}
              pool={{ kind: "class", classId }}
              className="h-24 rotate-6 [@media(max-height:500px)]:h-20"
            />
          ) : null}
        </div>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm leading-snug font-medium text-[#3d2e1f]">
            {tr("handbook.packGuide.versions", {
              price: words(pack.versionPrice),
              pack: tr(`packs.names.${pack.id}`),
            })}
          </p>
          <p className="text-xs leading-snug text-[#5b4632]">
            {tr("handbook.packGuide.allCards")}
          </p>
        </div>
      </div>
    </section>
  );
};

/**
 * The Pack Entry (Economy 3.1, ADR-0027): the three Packs on a shelf. The
 * Player selects one and reads what it does: its job, the chance of each Rank,
 * the Pack Guarantee with the Player's own count, New Card First, the Open ×10
 * bonus, and its Race and Class versions.
 */
export const PackGuide = () => {
  const { tr } = useGameText();
  const packState = useAtomValue(packStateAtom);
  const [selected, setSelected] = useState<PackId>("peddler");
  return (
    <div className="space-y-4" data-testid="handbook-pack-guide">
      <Tabs
        selectedKey={selected}
        onSelectionChange={(key) => {
          const next = toPack(key);
          if (next) {
            setSelected(next);
          }
        }}
        className="space-y-4"
      >
        <figure
          className={cn(
            WELL,
            "overflow-hidden px-2 pt-3 pb-2.5 [--pack-h:6.5rem] [@media(max-height:500px)]:[--pack-h:4.75rem]"
          )}
        >
          <div className="relative">
            {/* The wood ledge that the Packs stand on. A Tab list holds only Tabs, so it is outside. */}
            <span
              className="absolute inset-x-0 top-[calc(var(--pack-h)-0.75rem)] h-3 rounded-md border-2 border-[#2a1a0c] bg-gradient-to-b from-[#7a5233] to-[#563720] shadow-[0_3px_0_rgba(0,0,0,0.3)]"
              aria-hidden
            />
            <TabList
              aria-label={tr("handbook.packGuide.shelf")}
              className="relative flex items-start justify-around"
            >
              {PACKS.map((pack) => (
                <PackTab
                  key={pack.id}
                  pack={pack}
                  free={!packState.freePackUsed && pack.id === "peddler"}
                />
              ))}
            </TabList>
          </div>
          <figcaption className="mt-2 text-center text-xs leading-snug text-[#5b4632]">
            {tr("handbook.packGuide.notBetter")}
          </figcaption>
        </figure>
        {PACKS.map((pack) => (
          <TabPanel
            key={pack.id}
            id={pack.id}
            className="space-y-4 rounded-sm outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
            data-testid={`handbook-pack-panel-${pack.id}`}
          >
            <p className="font-display text-lg leading-snug font-bold text-balance text-[#2a1a0c]">
              {tr(`packs.jobs.${pack.id}`)}
            </p>
            <RankRoll pack={pack} />
            <GuaranteeTrack
              pack={pack}
              counter={packState.guaranteeCounters[pack.id]}
            />
            <PackFacts pack={pack} />
            <PackVersions pack={pack} />
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};
