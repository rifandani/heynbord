import {
  CAMPAIGN_SWEEP_TICKETS_PER_WIN,
  coinDenominations,
  floorFirstWinReward,
  HEYNSPIRE_BOSS_FLOOR_EVERY,
  HEYNSPIRE_BOSS_FLOOR_REWARD,
  HEYNSPIRE_FIFTH_FLOOR_EVERY,
  HEYNSPIRE_FIFTH_FLOOR_FORGE_STONES,
  HEYNSPIRE_FLOORS,
} from "@workspace/rules";
import type { ForgeStoneReward } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

/** One reward in a row of the table: its icon and its amount in Inter 900. */
const Amount = ({
  icon,
  children,
}: {
  readonly icon: ReactNode;
  readonly children: ReactNode;
}) => (
  <span className="inline-flex items-center gap-1 font-black whitespace-nowrap text-[#2a1d12] tabular-nums">
    {icon}
    {children}
  </span>
);

const Stones = ({ stones }: { readonly stones: ForgeStoneReward }) => {
  const { tr } = useGameText();
  return (
    <Amount icon={<ForgeStoneIcon tier={stones.tier} className="size-3.5" />}>
      {tr("battle.forgeStonesEarned", {
        count: stones.count,
        tier: tr(`forgeStones.tiers.${stones.tier}`),
      })}
    </Amount>
  );
};

/** The Floor numbers of every `every`-th Floor, for example "10, 20, 30, 40, 50". */
const everyNth = (every: number, skip?: number) =>
  Array.from(
    { length: HEYNSPIRE_FLOORS / every },
    (_, index) => (index + 1) * every
  )
    .filter((floor) => skip === undefined || floor % skip !== 0)
    .join(", ");

/**
 * The rewards of the Floors (Economy 2.3), from the rules, so the Entry
 * follows a balance change: each Floor, each 5th Floor and each Boss Floor.
 * Each Floor gives its reward one time.
 */
export const HeynspireGuide = () => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const first = floorFirstWinReward(1);
  const last = floorFirstWinReward(HEYNSPIRE_FLOORS);
  const boss = HEYNSPIRE_BOSS_FLOOR_REWARD;
  const rows = [
    {
      id: "each",
      kind: tr("handbook.heynspireTable.each", { last: HEYNSPIRE_FLOORS }),
      reward: (
        <>
          <Amount icon={null}>
            <CoinAmount
              parts={coinDenominations(first.coin)}
              format={format}
              tone="light"
            />
            <span aria-hidden>–</span>
            <span className="sr-only">{tr("handbook.heynspireTable.to")}</span>
            <CoinAmount
              parts={coinDenominations(last.coin)}
              format={format}
              tone="light"
            />
          </Amount>
          <Amount icon={null}>
            <span className="text-[#0e6f86]">
              {tr("handbook.heynspireTable.xp", {
                first: first.xp,
                last: last.xp,
              })}
            </span>
          </Amount>
          <Amount
            icon={
              <GlyphIcon
                glyph="campaignTicket"
                className="size-3.5 -rotate-8 text-[#b9801f]"
              />
            }
          >
            {tr("sweep.campaign.earned", {
              count: CAMPAIGN_SWEEP_TICKETS_PER_WIN,
            })}
          </Amount>
        </>
      ),
    },
    {
      id: "fifth",
      kind: tr("handbook.heynspireTable.fifth", {
        floors: everyNth(
          HEYNSPIRE_FIFTH_FLOOR_EVERY,
          HEYNSPIRE_BOSS_FLOOR_EVERY
        ),
      }),
      reward: <Stones stones={HEYNSPIRE_FIFTH_FLOOR_FORGE_STONES} />,
    },
    {
      id: "boss",
      kind: tr("handbook.heynspireTable.boss", {
        floors: everyNth(HEYNSPIRE_BOSS_FLOOR_EVERY),
      }),
      reward: (
        <>
          <Amount icon={<BalanceIcon kind="essence" className="size-3.5" />}>
            {tr("battle.essenceEarned", { amount: boss.essence })}
          </Amount>
          <Amount icon={<BalanceIcon kind="heynstones" className="size-3.5" />}>
            {tr("battle.heynstonesEarned", { amount: boss.heynstones })}
          </Amount>
          {boss.forgeStones.map((stones) => (
            <Stones key={stones.tier} stones={stones} />
          ))}
        </>
      ),
    },
  ];
  return (
    <table
      className="w-full max-w-lg border-collapse text-sm"
      data-testid="handbook-heynspire-table"
    >
      <caption className={cn(LABEL, "pb-1 text-left")}>
        {tr("handbook.heynspireTable.title")}
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{tr("handbook.heynspireTable.floorColumn")}</th>
          <th scope="col">{tr("handbook.heynspireTable.rewardColumn")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-[#c9b48c]/70">
            <th
              scope="row"
              className="w-[38%] py-1.5 pr-3 text-left align-top leading-snug font-bold text-[#3d2e1f]"
            >
              {row.kind}
            </th>
            <td className="py-1.5">
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {row.reward}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
