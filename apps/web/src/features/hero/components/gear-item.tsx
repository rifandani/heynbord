import { coinDenominations, MAX_GEAR_LEVEL } from "@workspace/rules";
import { cn } from "cn";
import { Label, Meter } from "react-aria-components";

import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { GearItem } from "@/features/hero/hero";
import { GEAR_GLYPH, GEAR_GLYPH_TURN, heroArt } from "@/features/hero/hero-art";
import { useStatFormat } from "@/features/hero/use-stat-format";
import { CoinPrice } from "@/features/packs/components/pack-art";
import { useCoinFormat } from "@/features/packs/use-coin-format";

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/** A small label on a dark plate. */
const SMALL_LABEL =
  "text-xs font-bold text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]";

const NOTCHES = Array.from({ length: MAX_GEAR_LEVEL }, (_, index) => index);

/**
 * The icon of a Gear item: its painted icon, or its glyph on a round dark
 * badge with a bronze rim until a person paints it (11 — Town Concepts 12).
 * At level 10 the "Max" seal sits on its lower right; it stamps on when the
 * item gets there.
 */
const GearIcon = ({
  item,
  stamp,
}: {
  readonly item: GearItem;
  readonly stamp: boolean;
}) => {
  const { tr } = useGameText();
  const painted = heroArt(item.slot);
  return (
    <span
      className="relative grid size-24 shrink-0 place-items-center [@media(max-height:500px)]:size-11"
      aria-hidden
    >
      {painted ? (
        <img
          src={painted}
          alt=""
          width={256}
          height={256}
          draggable={false}
          className="size-full object-contain drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] select-none"
        />
      ) : (
        <span className="grid size-[84%] place-items-center rounded-full border-[3px] border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] shadow-[0_3px_0_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,226,170,0.18)] [@media(max-height:500px)]:border-2">
          <GlyphIcon
            glyph={GEAR_GLYPH[item.slot]}
            className={cn(
              "size-[54%] text-[#f3e6c4] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]",
              GEAR_GLYPH_TURN[item.slot]
            )}
          />
        </span>
      )}
      {item.upgrade.kind === "max" ? (
        <span
          className={cn(
            "absolute -right-1 -bottom-1 grid place-items-center rounded-full border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-1.5 py-0.5 text-[11px] leading-none font-black tracking-[0.04em] text-[#2a1a05] uppercase shadow-[0_2px_0_rgba(0,0,0,0.45)]",
            "[@media(max-height:500px)]:-right-2 [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[9px]",
            stamp &&
              "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          )}
          data-testid={`gear-max-${item.slot}`}
        >
          {tr("hero.maxSeal")}
        </span>
      ) : null}
    </span>
  );
};

/** The faint gold edge of the next notch, while the upgrade has the pointer or the keyboard focus. */
const NEXT_NOTCH =
  "group-has-[[data-hovered]]/gear:shadow-[inset_0_0_0_1.5px_rgba(255,224,138,0.85)] group-has-[[data-focus-visible]]/gear:shadow-[inset_0_0_0_1.5px_rgba(255,224,138,0.85)]";

/**
 * The level of a Gear item: 10 notches cut into the plate, gold to the level.
 * The notch of the last upgrade flashes as it fills. While the pointer or the
 * keyboard focus is on an upgrade that is on, the next notch shows a faint
 * gold edge.
 */
const LevelGroove = ({
  level,
  flash,
  ready,
}: {
  readonly level: number;
  /** The serial of the last upgrade of this item in this visit, or 0. */
  readonly flash: number;
  /** True when the upgrade is on. */
  readonly ready: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <Meter
      value={level}
      minValue={0}
      maxValue={MAX_GEAR_LEVEL}
      valueLabel={tr("hero.levelLabel", { level, max: MAX_GEAR_LEVEL })}
      className="flex w-full flex-col gap-1"
    >
      <span className="flex items-baseline justify-between gap-2">
        <Label className={SMALL_LABEL}>{tr("hero.levelName")}</Label>
        <span className="font-black tabular-nums" aria-hidden>
          <span
            key={flash}
            className={cn(
              "inline-block text-xl text-[#fff6df] [@media(max-height:500px)]:text-sm",
              flash > 0 &&
                "motion-safe:animate-[workshop-count_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
            )}
            data-testid="gear-level"
          >
            {level}
          </span>
          <span className="text-sm text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]">
            {" / "}
            {MAX_GEAR_LEVEL}
          </span>
        </span>
      </span>
      <span
        className="flex gap-[3px] rounded-md bg-[#120c08]/80 p-[3px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),0_1px_0_rgba(255,226,170,0.18)]"
        aria-hidden
      >
        {NOTCHES.map((index) => (
          <span
            key={index === level - 1 ? `${index}:${flash}` : index}
            className={cn(
              "h-3 flex-1 rounded-[2px] transition-[background-color,box-shadow] duration-150 [@media(max-height:500px)]:h-2",
              index < level
                ? "bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                : "bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)]",
              index === level && ready && NEXT_NOTCH,
              index === level - 1 &&
                flash > 0 &&
                "motion-safe:animate-[gear-notch_520ms_cubic-bezier(0.2,0.8,0.2,1)]"
            )}
          />
        ))}
      </span>
    </Meter>
  );
};

/**
 * One Gear item on the Gear Rack (GDD 7.3): its icon, its name, its level
 * groove, its stat now and at the next level, and one gold upgrade with its
 * Coin. Each press upgrades 1 level at once, with no confirmation. Off at
 * level 10 ("Max level") and when the Coin is not enough ("Need 1s 50c").
 */
export const GearPlate = ({
  item,
  flash,
  onUpgrade,
}: {
  readonly item: GearItem;
  /** The serial of the last upgrade of this item in this visit, or 0. */
  readonly flash: number;
  readonly onUpgrade: () => void;
}) => {
  const { tr } = useGameText();
  const stat = useStatFormat();
  const { format, words } = useCoinFormat();
  const name = tr(`hero.slots.${item.slot}`);
  const { upgrade } = item;
  const label =
    upgrade.kind === "ready"
      ? tr("hero.upgradeLabel", {
          name,
          level: item.level + 1,
          price: words(upgrade.coin),
        })
      : upgrade.kind === "coin"
        ? tr("hero.needLabel", { name, amount: words(upgrade.missing) })
        : tr("hero.maxLabel", { name });
  const titleId = `gear-${item.slot}-name`;

  return (
    <li
      aria-labelledby={titleId}
      className={cn(
        PLATE,
        "group/gear relative flex min-w-0 flex-col items-center gap-2.5 px-3 pt-3 pb-3",
        "[@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-2"
      )}
      data-testid={`gear-${item.slot}`}
      data-level={item.level}
      data-state={upgrade.kind}
    >
      {/* The short glow of an upgrade: a new element for each one, so that it
          plays again. The plate itself stays, so its button keeps the focus. */}
      {flash > 0 ? (
        <span
          key={flash}
          className="pointer-events-none absolute -inset-0.5 rounded-xl motion-safe:animate-[gear-glow_900ms_ease-out_both]"
          aria-hidden
        />
      ) : null}
      <span className="flex w-full flex-col items-center gap-1.5 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-2">
        <GearIcon item={item} stamp={flash > 0} />
        <h3
          id={titleId}
          className="font-display text-lg leading-tight font-bold text-[#ffe08a] [@media(max-height:500px)]:text-sm"
        >
          {name}
        </h3>
      </span>
      <LevelGroove
        level={item.level}
        flash={flash}
        ready={upgrade.kind === "ready"}
      />
      <div className="flex w-full flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={SMALL_LABEL}>{tr(`hero.stats.${item.stat}`)}</span>
          <span
            className="flex items-baseline gap-1 font-black whitespace-nowrap tabular-nums"
            data-testid="gear-stat"
          >
            <span
              key={flash}
              className={cn(
                "inline-block text-base text-[#fff6df] [@media(max-height:500px)]:text-xs",
                flash > 0 &&
                  "motion-safe:animate-[gear-roll_320ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
              )}
            >
              {stat(item.stat, item.now)}
            </span>
            {item.next === null ? null : (
              <>
                <span
                  className="text-xs text-[#e9c46a]/80 [@media(max-height:500px)]:text-[10px]"
                  aria-hidden
                >
                  →
                </span>
                <span className="text-base text-[#ffe08a] [@media(max-height:500px)]:text-xs">
                  {stat(item.stat, item.next)}
                </span>
              </>
            )}
          </span>
        </span>
        <p className="text-left text-xs leading-snug text-[#e8d9bb] [@media(max-height:500px)]:sr-only">
          {tr(`hero.statHelp.${item.stat}`)}
        </p>
      </div>
      <GameButton
        intent={upgrade.kind === "ready" ? "gold" : "ghost"}
        size="md"
        isDisabled={upgrade.kind !== "ready"}
        onPress={onUpgrade}
        aria-label={label}
        className={cn(
          "mt-auto w-full text-sm whitespace-nowrap [@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs",
          // An upgrade that is off is an engraved plate with no drop, because
          // it cannot be pressed. Its text stays at full contrast: at level 10
          // the gold "Max level", else the Coin that is still missing.
          upgrade.kind !== "ready" &&
            "border-[#e9c46a]/50 bg-[#120c08]/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.75)] data-[disabled]:cursor-default data-[disabled]:opacity-100 data-[disabled]:grayscale-0",
          upgrade.kind === "max" && "text-[#ffe08a]",
          upgrade.kind === "coin" && "text-[#e8d9bb]"
        )}
        data-testid={`gear-upgrade-${item.slot}`}
        data-gear-upgrade={item.slot}
        data-state={upgrade.kind}
      >
        {upgrade.kind === "ready" ? (
          <>
            <span className="font-bold">{tr("hero.upgrade")}</span>
            <CoinPrice
              parts={coinDenominations(upgrade.coin)}
              format={format}
            />
          </>
        ) : upgrade.kind === "coin" ? (
          <>
            <span className="font-semibold">{tr("workshop.need")}</span>
            <CoinPrice
              parts={coinDenominations(upgrade.missing)}
              format={format}
              className="font-bold text-[#fff6df]"
            />
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <GlyphIcon glyph="check" className="size-3.5 shrink-0" />
            {tr("hero.max")}
          </span>
        )}
      </GameButton>
    </li>
  );
};
