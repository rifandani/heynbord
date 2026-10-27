import { RegistryContext, useAtomValue } from "@effect/atom-react";
import {
  CARDS,
  coinDenominations,
  currentFloor,
  FORGE_STONE_TIERS,
  GEAR_SLOTS,
  HEYNSPIRE_FLOORS,
  heynspireBossStage,
  isHeynspireOpen,
  MAX_GEAR_LEVEL,
  PLAYER_LEVEL_XP,
  STAGES,
} from "@workspace/rules";
import type { HeroRef, Side, StageDefinition } from "@workspace/rules";
import { cn } from "cn";
import { useContext, useState } from "react";
import {
  HiArrowUturnLeft,
  HiMiniStar,
  HiOutlineStar,
  HiXMark,
} from "react-icons/hi2";

import { Button } from "@/core/components/ui/button";
import { Description, Label } from "@/core/components/ui/field";
import { NumberField, NumberInput } from "@/core/components/ui/number-field";
import { Switch, SwitchField } from "@/core/components/ui/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/core/components/ui/toggle-group";
import type { BattleSession } from "@/features/battle/battle-session";
import { devHitHero, newestSession } from "@/features/battle/battle-session";
import {
  publishBattle,
  readBattle,
  stagedBattle,
} from "@/features/battle/battle-store";
import {
  battleLogAtom,
  battleSessionAtom,
} from "@/features/battle/battle.atoms";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";
import type { StageResults } from "@/features/campaign/region-map";
import { collectionAtom } from "@/features/deck/deck.atoms";
import {
  canSetStars,
  finishVoyage,
  lastWonStage,
  nextStage,
  setStageStars,
  stageOrder,
  totalCopies,
  undoLast,
  winNext,
} from "@/features/dev-panel/dev-overrides";
import { useDevOverrides } from "@/features/dev-panel/use-dev-overrides";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { playerLevel } from "@/features/profile/profile";
import { profileAtom } from "@/features/profile/profile.atoms";
import { shipVoyage } from "@/features/seaport/seaport";
import { seaportAtom } from "@/features/seaport/seaport.atoms";
import { useVoyageName } from "@/features/seaport/use-voyage-name";
import type { SweepKind } from "@/features/sweep/sweep";
import { ownedTickets } from "@/features/sweep/sweep";
import type { BalanceKind } from "@/features/town/town";
import { balancesAtom } from "@/features/town/town.atoms";

// Developer tool: its text is not player text, so it is not in the Message
// Catalogs. Stage names and voyage names still come from the game text.
const count = new Intl.NumberFormat("en-US");
const STAR_OPTIONS = [1, 2, 3] as const;

const Heading = ({ id, children }: { id: string; children: string }) => (
  <h2
    id={id}
    className="text-muted-fg text-xs font-semibold tracking-wide uppercase"
  >
    {children}
  </h2>
);

const CollectionBlock = () => {
  const { unlockAll, setUnlockAll } = useDevOverrides();
  const collection = useAtomValue(collectionAtom);
  const cards = new Set(collection.map((entry) => entry.cardId)).size;
  return (
    <section
      aria-labelledby="dev-collection"
      className="grid content-start gap-3"
    >
      <Heading id="dev-collection">Collection</Heading>
      <SwitchField isSelected={unlockAll} onChange={setUnlockAll}>
        <Switch>Unlock all cards</Switch>
      </SwitchField>
      <p className="text-muted-fg tabular-nums">
        {unlockAll
          ? `All ${count.format(CARDS.length)} cards, each Rank from the Base Rank`
          : `Profile Collection, ${count.format(cards)} cards`}
        {" · "}
        {count.format(totalCopies(collection))} copies
      </p>
    </section>
  );
};

const BALANCE_FIELDS: readonly {
  readonly kind: BalanceKind;
  readonly label: string;
}[] = [
  { kind: "coin", label: "Coin (Copper)" },
  { kind: "essence", label: "Essence" },
  { kind: "heynstones", label: "Heynstones" },
];

const DENOMINATION = { gold: "Gold", silver: "Silver", copper: "Copper" };

const coinParts = (copper: number) =>
  coinDenominations(copper)
    .map(
      (part) =>
        `${count.format(part.amount)} ${DENOMINATION[part.denomination]}`
    )
    .join(" · ");

/** The 2 types of Sweep Ticket (ADR-0039). */
const SWEEP_TICKET_FIELDS: readonly {
  readonly kind: SweepKind;
  readonly label: string;
}[] = [
  { kind: "campaign", label: "Campaign Sweep Tickets" },
  { kind: "dungeon", label: "Dungeon Sweep Tickets" },
];

const BalancesBlock = () => {
  const { setBalance, setSweepTickets } = useDevOverrides();
  const balances = useAtomValue(balancesAtom);
  const profile = useAtomValue(profileAtom);
  return (
    <section
      aria-labelledby="dev-balances"
      className="grid content-start gap-3"
    >
      <Heading id="dev-balances">Balances</Heading>
      {BALANCE_FIELDS.map(({ kind, label }) => (
        <NumberField
          key={kind}
          value={balances[kind]}
          minValue={0}
          step={1}
          formatOptions={{ maximumFractionDigits: 0 }}
          onChange={(value) => setBalance(kind, value)}
        >
          <Label>{label}</Label>
          <NumberInput />
          {kind === "coin" ? (
            <Description className="tabular-nums">
              {coinParts(balances.coin)}
            </Description>
          ) : null}
        </NumberField>
      ))}
      {SWEEP_TICKET_FIELDS.map(({ kind, label }) => (
        <NumberField
          key={kind}
          value={ownedTickets(profile, kind)}
          minValue={0}
          step={1}
          formatOptions={{ maximumFractionDigits: 0 }}
          onChange={(value) => setSweepTickets(kind, value)}
        >
          <Label>{label}</Label>
          <NumberInput />
        </NumberField>
      ))}
    </section>
  );
};

const FORGE_STONE_NAMES = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** The count of each Forge Stone tier that the Gear upgrades use. */
const ForgeStonesBlock = () => {
  const { setForgeStones } = useDevOverrides();
  const { forgeStones } = useAtomValue(profileAtom);
  return (
    <section
      aria-labelledby="dev-forge-stones"
      className="grid content-start gap-3"
    >
      <Heading id="dev-forge-stones">Forge Stones</Heading>
      <div className="grid grid-cols-2 gap-3">
        {FORGE_STONE_TIERS.map((tier) => (
          <NumberField
            key={tier}
            value={forgeStones[tier]}
            minValue={0}
            step={1}
            formatOptions={{ maximumFractionDigits: 0 }}
            onChange={(value) => setForgeStones(tier, value)}
          >
            <Label className="inline-flex items-center gap-1.5">
              <ForgeStoneIcon tier={tier} className="size-4" />
              {FORGE_STONE_NAMES[tier]}
            </Label>
            <NumberInput />
          </NumberField>
        ))}
      </div>
    </section>
  );
};

/**
 * The won Heynspire Floors (web ADR-0009). The first win of the last Boss
 * Stage opens Heynspire, so the field stays off before that win: play cannot
 * win a Floor before it.
 */
const HeynspireBlock = () => {
  const { setFloorsWon } = useDevOverrides();
  const profile = useAtomValue(profileAtom);
  const open = isHeynspireOpen(profile);
  const current = currentFloor(profile);
  let state = `Opens with the first win of Stage ${heynspireBossStage().id}`;
  if (open) {
    state = current === null ? "All Floors won" : `Current Floor ${current}`;
  }
  return (
    <section
      aria-labelledby="dev-heynspire"
      className="grid content-start gap-3"
    >
      <Heading id="dev-heynspire">Heynspire</Heading>
      <NumberField
        value={profile.heynspireFloorsWon}
        minValue={0}
        maxValue={HEYNSPIRE_FLOORS}
        step={1}
        formatOptions={{ maximumFractionDigits: 0 }}
        isDisabled={!open}
        onChange={setFloorsWon}
      >
        <Label>Floors won</Label>
        <NumberInput />
        <Description className="tabular-nums">{state}</Description>
      </NumberField>
    </section>
  );
};

/**
 * Finishes the voyage of the Seaport ship at once: the Dispatch time moves
 * back by the full duration, so a Collect gives the full reward. Unlike the
 * other values of the panel, this changes the saved Profile, as play does.
 */
const SeaportBlock = () => {
  const registry = useContext(RegistryContext);
  const voyage = shipVoyage(useAtomValue(seaportAtom));
  const voyageName = useVoyageName();

  const finish = () => {
    const profile = registry.get(profileAtom);
    const seaport = finishVoyage(profile.seaport, Date.now());
    if (seaport !== profile.seaport) {
      registry.set(profileAtom, { ...profile, seaport });
    }
  };

  return (
    <section aria-labelledby="dev-seaport" className="grid content-start gap-3">
      <Heading id="dev-seaport">Seaport</Heading>
      <div className="flex items-center gap-2">
        <p className="text-muted-fg me-auto min-w-0 truncate">
          {voyage === null ? "Ship at the berth" : voyageName(voyage)}
        </p>
        <Button size="xs" isDisabled={voyage === null} onPress={finish}>
          Finish voyage
        </Button>
      </div>
    </section>
  );
};

const GEAR_NAMES = {
  weapon: "Weapon",
  armor: "Armor",
  trinket: "Trinket",
  banner: "Banner",
};

/**
 * The Player level and the Gear that the Battles and the Deck limits use. A
 * level sets the XP to the start of that level.
 */
const PlayerBlock = () => {
  const { setLevel, setGear } = useDevOverrides();
  const profile = useAtomValue(profileAtom);
  return (
    <section aria-labelledby="dev-player" className="grid content-start gap-3">
      <Heading id="dev-player">Player</Heading>
      <NumberField
        value={playerLevel(profile)}
        minValue={1}
        maxValue={PLAYER_LEVEL_XP.length}
        step={1}
        formatOptions={{ maximumFractionDigits: 0 }}
        onChange={setLevel}
      >
        <Label>Player level</Label>
        <NumberInput />
        <Description className="tabular-nums">
          {count.format(profile.xp)} XP
        </Description>
      </NumberField>
      <div className="grid grid-cols-2 gap-3">
        {GEAR_SLOTS.map((slot) => (
          <NumberField
            key={slot}
            value={profile.gear[slot]}
            minValue={0}
            maxValue={MAX_GEAR_LEVEL}
            step={1}
            formatOptions={{ maximumFractionDigits: 0 }}
            onChange={(value) => setGear(slot, value)}
          >
            <Label>{GEAR_NAMES[slot]}</Label>
            <NumberInput />
          </NumberField>
        ))}
      </div>
    </section>
  );
};

const SIDES: readonly Side[] = ["enemy", "player"];

const SIDE_NAMES = { enemy: "Enemy", player: "Player" };

/** The Heroes of the Battle, enemy first, with their HP in the rules. */
const battleHeroes = (session: BattleSession) =>
  SIDES.flatMap((side) => {
    const { heroes } = session.rules.sides[side];
    return heroes.map((hero, index) => ({
      ref: { side, hero: index } satisfies HeroRef,
      name:
        heroes.length > 1
          ? `${SIDE_NAMES[side]} Hero ${index + 1}`
          : `${SIDE_NAMES[side]} Hero`,
      hp: hero.hp,
      maxHp: hero.maxHp,
    }));
  });

/** Why the panel cannot hit a Hero now, or `null` when it can. */
const blockedReason = (
  session: BattleSession | null,
  logOpen: boolean
): string | null => {
  if (session === null) {
    return "No Battle on the screen";
  }
  if (session.rules.status === "finished") {
    return "The Battle is finished";
  }
  return logOpen ? "Close the Battle Log first" : null;
};

/**
 * Deals True Damage to a Hero of the Battle on the screen, so that a Battle
 * ends sooner. The hit plays as a normal hit: a Defeat and the result follow.
 */
const BattleBlock = () => {
  const registry = useContext(RegistryContext);
  const session = useAtomValue(battleSessionAtom);
  const logOpen = useAtomValue(battleLogAtom) !== null;
  const [damage, setDamage] = useState(10);
  const blocked = blockedReason(session, logOpen);
  const amount = Number.isFinite(damage) ? Math.floor(damage) : 0;

  const hit = (ref: HeroRef) => {
    // The scene clock can be ahead of the atom inside one event.
    const live = newestSession(readBattle(registry), stagedBattle());
    if (live === null || registry.get(battleLogAtom) !== null) {
      return;
    }
    const next = devHitHero(live, ref, amount);
    if (next !== live) {
      publishBattle(registry, next);
    }
  };

  return (
    <section aria-labelledby="dev-battle" className="grid content-start gap-3">
      <Heading id="dev-battle">Battle</Heading>
      <NumberField
        value={damage}
        minValue={1}
        step={1}
        formatOptions={{ maximumFractionDigits: 0 }}
        isDisabled={blocked !== null}
        onChange={setDamage}
      >
        <Label>Hero damage</Label>
        <NumberInput />
        <Description>
          {blocked ?? "True Damage: no Crit. A hit to 0 HP Defeats the Hero."}
        </Description>
      </NumberField>
      {session !== null && blocked === null ? (
        <ul className="grid gap-1">
          {battleHeroes(session).map(({ ref, name, hp, maxHp }) => (
            <li
              key={`${ref.side}-${ref.hero}`}
              className="flex items-center gap-2"
            >
              <span className="me-auto min-w-0 truncate">{name}</span>
              <span className="text-muted-fg tabular-nums">
                {count.format(hp)} / {count.format(maxHp)} HP
              </span>
              <Button
                size="xs"
                intent={ref.side === "enemy" ? "primary" : "outline"}
                isDisabled={hp <= 0 || amount < 1}
                aria-label={`Deal ${amount} damage to the ${name}`}
                onPress={() => hit(ref)}
              >
                {hp <= 0 ? "Defeated" : `Hit ${count.format(amount)}`}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

/** Three star buttons: a press sets the Stars of the Stage, the cross clears it. */
const StarRating = ({
  stage,
  stars,
  enabled,
  onSet,
}: {
  readonly stage: string;
  readonly stars: number;
  readonly enabled: boolean;
  readonly onSet: (stars: number) => void;
}) => (
  <fieldset className="flex items-center">
    <legend className="sr-only">{`Stars of ${stage}`}</legend>
    {STAR_OPTIONS.map((value) => {
      const Icon = value <= stars ? HiMiniStar : HiOutlineStar;
      return (
        <Button
          key={value}
          intent="plain"
          size="sq-xs"
          isDisabled={!enabled}
          aria-label={`${value} ${value === 1 ? "Star" : "Stars"}`}
          aria-pressed={value === stars}
          onPress={() => onSet(value)}
          className={cn(value <= stars && "[--btn-icon:var(--color-warning)]")}
        >
          <Icon />
        </Button>
      );
    })}
    <Button
      intent="plain"
      size="sq-xs"
      isDisabled={!enabled || stars === 0}
      aria-label={`Clear ${stage} and the Stages after it`}
      onPress={() => onSet(0)}
    >
      <HiXMark />
    </Button>
  </fieldset>
);

const StageRow = ({
  stage,
  results,
  isNext,
  onChange,
}: {
  readonly stage: StageDefinition;
  readonly results: StageResults;
  readonly isNext: boolean;
  readonly onChange: (results: StageResults) => void;
}) => {
  const { tr } = useGameText();
  const stars = results[stage.id] ?? 0;
  const enabled = canSetStars(STAGES, results, stage.id);
  return (
    <tr
      className={cn(
        "border-border border-t",
        isNext && "bg-primary/8",
        !enabled && "text-muted-fg"
      )}
    >
      <td className="py-1 pe-3 font-medium tabular-nums">{stage.id}</td>
      <td className="max-w-0 truncate py-1 pe-3">
        {tr(`stages.${stage.id}.name`)}
        {stage.boss ? <span className="text-muted-fg"> · Boss</span> : null}
      </td>
      <td className="hidden py-1 pe-3 whitespace-nowrap sm:table-cell">
        {stars > 0 ? (
          "Done"
        ) : isNext ? (
          <span className="text-primary font-medium">Next</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <GlyphIcon glyph="lock" className="size-3" />
            Locked
          </span>
        )}
      </td>
      <td className="py-0.5">
        <StarRating
          stage={stage.id}
          stars={stars}
          enabled={enabled}
          onSet={(value) =>
            onChange(setStageStars(STAGES, results, stage.id, value))
          }
        />
      </td>
    </tr>
  );
};

const CampaignBlock = () => {
  const { tr } = useGameText();
  const { setResults } = useDevOverrides();
  const results = useAtomValue(stageResultsAtom);
  const [winStars, setWinStars] = useState(3);
  const next = nextStage(STAGES, results);
  const last = lastWonStage(STAGES, results);
  const order = stageOrder(STAGES);
  const won = order.filter((stage) => (results[stage.id] ?? 0) > 0).length;
  const stars = order.reduce((sum, stage) => sum + (results[stage.id] ?? 0), 0);

  return (
    <section
      aria-labelledby="dev-campaign"
      className="grid min-w-0 content-start gap-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <Heading id="dev-campaign">Campaign</Heading>
        <p className="text-muted-fg text-xs tabular-nums">
          {won} of {order.length} Stages · {stars} / {order.length * 3} Stars
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="me-auto min-w-0 truncate">
          {next === null ? (
            "All Stages done"
          ) : (
            <>
              <span className="text-muted-fg">Next </span>
              <span className="font-medium tabular-nums">{next.id}</span>{" "}
              {tr(`stages.${next.id}.name`)}
            </>
          )}
        </p>
        <ToggleGroup
          size="xs"
          aria-label="Stars for the win"
          disallowEmptySelection
          selectedKeys={[String(winStars)]}
          onSelectionChange={(keys) => {
            const [key] = [...keys];
            if (key !== undefined) {
              setWinStars(Number(key));
            }
          }}
          isDisabled={next === null}
        >
          {STAR_OPTIONS.map((value) => (
            <ToggleGroupItem
              key={value}
              id={String(value)}
              aria-label={`${value} Stars`}
            >
              {value}
              <HiMiniStar aria-hidden />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          size="xs"
          isDisabled={next === null}
          onPress={() => setResults(winNext(STAGES, results, winStars))}
        >
          {next === null ? "Win" : `Win ${next.id}`}
        </Button>
        <Button
          size="xs"
          intent="outline"
          isDisabled={last === null}
          onPress={() => setResults(undoLast(STAGES, results))}
        >
          <HiArrowUturnLeft aria-hidden />
          {last === null ? "Undo" : `Undo ${last.id}`}
        </Button>
        <Button
          size="xs"
          intent="plain"
          isDisabled={last === null}
          onPress={() => setResults({})}
        >
          Reset
        </Button>
      </div>

      <table className="w-full table-fixed border-collapse text-start">
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="hidden w-20 sm:table-column" />
          <col className="w-36" />
        </colgroup>
        <thead className="sr-only">
          <tr>
            <th>Stage</th>
            <th>Name</th>
            <th className="hidden sm:table-cell">State</th>
            <th>Stars</th>
          </tr>
        </thead>
        <tbody>
          {order.map((stage) => (
            <StageRow
              key={stage.id}
              stage={stage}
              results={results}
              isNext={stage.id === next?.id}
              onChange={setResults}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
};

/**
 * The Game Dev Panel: a TanStack Devtools tab that unlocks all cards, sets the
 * Player level, the Gear, the balances, the 2 types of Sweep Ticket, the Forge
 * Stones and the won Heynspire Floors, wins Campaign Stages one by one, hits
 * the Heroes of the Battle on the screen, and finishes the Seaport voyage.
 * Its values show over the Profile and are not saved into it, except the
 * finished voyage.
 * Development only.
 */
export const GameDevPanel = () => {
  const { active, storageAvailable, clear } = useDevOverrides();
  return (
    <div
      className={cn(
        "bg-bg text-fg min-h-full text-sm",
        // The kit maps the semantic aliases in `:root`, not in the devtools
        // panel, so it maps them again here.
        "[--color-border:var(--border)] [--color-fg:var(--fg)] [--color-muted-fg:var(--muted-fg)] [--color-primary-fg:var(--primary-fg)] [--color-primary:var(--primary)] [--color-ring:var(--ring)] [--color-secondary-fg:var(--secondary-fg)] [--color-secondary:var(--secondary)] [--color-warning:var(--warning)]"
      )}
    >
      <div className="grid gap-x-10 gap-y-6 p-4 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,40rem)]">
        <div className="grid content-start gap-6">
          <BattleBlock />
          <CollectionBlock />
          <PlayerBlock />
          <BalancesBlock />
          <ForgeStonesBlock />
          <HeynspireBlock />
          <SeaportBlock />
        </div>
        <CampaignBlock />
        <footer className="border-border flex flex-wrap items-center gap-3 border-t pt-3 lg:col-span-full">
          <p className="text-muted-fg me-auto text-xs">
            {storageAvailable
              ? "Changes show over the Profile, not in it. They stay after a reload until you clear them."
              : "Browser storage is blocked: changes end at the next reload."}
          </p>
          <Button
            size="xs"
            intent="outline"
            isDisabled={!active}
            onPress={clear}
          >
            Clear dev state
          </Button>
        </footer>
      </div>
    </div>
  );
};
