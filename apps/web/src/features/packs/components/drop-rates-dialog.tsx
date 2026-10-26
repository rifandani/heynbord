import type { PackDefinition } from "@workspace/rules";
import { coinDenominations, PACKS, RANKS } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { DialogTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog } from "@/core/components/game/game-dialog";
import { RankGems } from "@/core/components/game/rank-gems";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { CoinPrice } from "@/features/packs/components/pack-art";
import { PACKS_RATE_CHECK } from "@/features/packs/tokens";
import { useGuaranteeText } from "@/features/packs/use-guarantee-text";

/** The Pack rules of Economy 3.1, in the order that a Pack uses them. */
const RULES = [
  "roll",
  "select",
  "uncommon",
  "guarantee",
  "ten",
  "pool",
  "versions",
] as const;

const CELL = "px-2 py-1.5 [@media(max-height:500px)]:py-1";

const RateCell = ({ basisPoints }: { readonly basisPoints: number }) => {
  const { locale } = useGameText();
  const percent = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 1,
      }),
    [locale]
  );
  return (
    <td className={cn(CELL, "text-right font-black tabular-nums")}>
      {basisPoints > 0 ? percent.format(basisPoints / 10_000) : "—"}
    </td>
  );
};

/** One row of the table: a label, then one cell for each Pack. */
const row = (
  label: string,
  cell: (pack: PackDefinition) => ReactNode,
  testId?: string
) => (
  <tr className="border-parchment-rule/70 border-t" data-testid={testId}>
    <th scope="row" className={cn(CELL, "text-left font-bold")}>
      {label}
    </th>
    {PACKS.map((pack) => (
      <td key={pack.id} className={cn(CELL, "text-right")}>
        {cell(pack)}
      </td>
    ))}
  </tr>
);

/** The table of the three Packs: the Drop Rates, the prices and the rules of each Pack. */
const DropRatesTable = () => {
  const { tr, locale } = useGameText();
  const guarantee = useGuaranteeText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  return (
    <table
      className="w-full border-collapse text-sm [@media(max-height:500px)]:text-xs"
      data-testid="drop-rates-table"
    >
      <caption className="sr-only">{tr("packs.rates.caption")}</caption>
      <thead>
        <tr>
          <th
            scope="col"
            className={cn(CELL, "text-ink-soft text-left text-xs font-bold")}
          >
            {tr("packs.rates.rank")}
          </th>
          {PACKS.map((pack) => (
            <th
              key={pack.id}
              scope="col"
              className={cn(CELL, "font-display text-right font-bold")}
            >
              {tr(`packs.names.${pack.id}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {RANKS.map((rank) => (
          <tr key={rank} className="border-parchment-rule/70 border-t">
            <th scope="row" className={cn(CELL, "text-left font-bold")}>
              <span className="flex items-center gap-2">
                <span className="w-[4.6em] text-xs" aria-hidden>
                  <RankGems rank={rank} />
                </span>
                {tr(`ranks.${rank}`)}
              </span>
            </th>
            {PACKS.map((pack) => (
              <RateCell key={pack.id} basisPoints={pack.dropRates[rank]} />
            ))}
          </tr>
        ))}
        {row(tr("packs.rates.guarantee"), (pack) =>
          guarantee(pack.guarantee.rank, pack.guarantee.packs)
        )}
        {row(tr("packs.rates.tenBonus"), (pack) =>
          tr(`packs.rates.ten.${pack.id}`)
        )}
        {row(
          tr("packs.rates.newCardFirst"),
          (pack) =>
            pack.newCardFirst ? (
              <span style={{ color: PACKS_RATE_CHECK }}>
                <GlyphIcon
                  glyph="check"
                  className="ml-auto size-4"
                  label={tr("packs.rates.yes")}
                />
              </span>
            ) : (
              <>
                <span aria-hidden>—</span>
                <span className="sr-only">{tr("packs.rates.no")}</span>
              </>
            ),
          "rates-new-card-first"
        )}
        {row(tr("packs.rates.price"), (pack) => (
          <CoinPrice
            parts={coinDenominations(pack.price)}
            format={format}
            tone="light"
            className="justify-end font-bold"
          />
        ))}
        {row(tr("packs.rates.versionPrice"), (pack) => (
          <CoinPrice
            parts={coinDenominations(pack.versionPrice)}
            format={format}
            tone="light"
            className="justify-end font-bold"
          />
        ))}
      </tbody>
    </table>
  );
};

/**
 * The Drop Rates button and its dialog (PRG-07, Economy 3.1 rule 8): the full
 * Drop Rates table of the three Packs, the Pack Guarantees, the ×10 bonuses,
 * the prices, the Pack rules and New Card First. A parchment dialog, as the
 * Settings dialog.
 */
export const DropRatesDialog = ({
  className,
}: {
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  return (
    <DialogTrigger>
      <GameButton
        intent="wood"
        size="sm"
        className={className}
        data-testid="drop-rates-button"
      >
        <GlyphIcon glyph="info" className="size-4" />
        {tr("packs.rates.button")}
      </GameButton>
      <GameDialog
        title={tr("packs.rates.title")}
        closeLabel={tr("packs.rates.close")}
        closeTestId="drop-rates-close"
        size="lg"
        className="w-[min(720px,96vw)] text-left"
        testId="drop-rates-dialog"
      >
        <div className="mt-3 [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-[1.1fr_1fr] [@media(max-height:500px)]:gap-4">
          <div>
            <p className="text-ink-soft mb-1 text-xs">
              {tr("packs.rates.each")}
            </p>
            <DropRatesTable />
          </div>
          <div>
            <h3 className="font-display mt-4 text-base font-bold [@media(max-height:500px)]:mt-0">
              {tr("packs.rates.rulesTitle")}
            </h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm leading-snug [@media(max-height:500px)]:text-xs">
              {RULES.map((rule) => (
                <li key={rule}>{tr(`packs.rates.rules.${rule}`)}</li>
              ))}
            </ol>
            <h3 className="font-display mt-3 text-base font-bold">
              {tr("packs.rates.newCardFirst")}
            </h3>
            <p
              className="mt-1 text-sm leading-snug [@media(max-height:500px)]:text-xs"
              data-testid="new-card-first-rule"
            >
              {tr("packs.rates.newCardFirstRule")}
            </p>
          </div>
        </div>
      </GameDialog>
    </DialogTrigger>
  );
};
