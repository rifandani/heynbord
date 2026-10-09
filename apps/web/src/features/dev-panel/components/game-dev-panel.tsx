import { useAtomValue } from "@effect/atom-react";
import { CARDS, coinDenominations, STAGES } from "@workspace/rules";
import type { StageDefinition } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
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
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";
import type { StageResults } from "@/features/campaign/region-map";
import { collectionAtom } from "@/features/deck/deck.atoms";
import {
  canSetStars,
  lastWonStage,
  nextStage,
  setStageStars,
  stageOrder,
  totalCopies,
  undoLast,
  winNext,
} from "@/features/dev-panel/dev-overrides";
import { useDevOverrides } from "@/features/dev-panel/use-dev-overrides";
import type { BalanceKind } from "@/features/town/town";
import { balancesAtom } from "@/features/town/town.atoms";

// Developer tool: its text is not player text, so it is not in the Message
// Catalogs. Stage names still come from the game text.
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
          : `Starter Collection, ${count.format(cards)} cards`}
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

const BalancesBlock = () => {
  const { setBalance } = useDevOverrides();
  const balances = useAtomValue(balancesAtom);
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
 * balances and wins Campaign Stages one by one. Development only.
 */
export const GameDevPanel = ({
  theme,
}: {
  readonly theme: "light" | "dark";
}) => {
  const { storageAvailable, clear } = useDevOverrides();
  return (
    <div
      className={cn(
        theme === "dark" && "dark",
        "bg-bg text-fg min-h-full text-sm",
        // The devtools theme can differ from the page theme. `--color-*` tokens
        // resolve at `:root`, so the kit sees the nested `.dark` only after
        // they resolve again here.
        "[--color-border:var(--border)] [--color-fg:var(--fg)] [--color-muted-fg:var(--muted-fg)] [--color-primary-fg:var(--primary-fg)] [--color-primary:var(--primary)] [--color-ring:var(--ring)] [--color-secondary-fg:var(--secondary-fg)] [--color-secondary:var(--secondary)] [--color-warning:var(--warning)]"
      )}
    >
      <div className="grid gap-x-10 gap-y-6 p-4 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,40rem)]">
        <div className="grid content-start gap-6">
          <CollectionBlock />
          <BalancesBlock />
        </div>
        <CampaignBlock />
        <footer className="border-border flex flex-wrap items-center gap-3 border-t pt-3 lg:col-span-full">
          <p className="text-muted-fg me-auto text-xs">
            {storageAvailable
              ? "Changes stay after a reload until you clear them."
              : "Browser storage is blocked: changes end at the next reload."}
          </p>
          <Button size="xs" intent="outline" onPress={clear}>
            Clear dev state
          </Button>
        </footer>
      </div>
    </div>
  );
};
