import type { DeckEntry, DeckSlot, RankId } from "@workspace/rules";
import { fuseChances, fuseRecipe } from "@workspace/rules";
import { useMemo, useRef, useState } from "react";

import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import type { Flight } from "@/features/workshop/components/essence-flight";
import { measureFlight } from "@/features/workshop/components/essence-flight";
import type { FuseChoice } from "@/features/workshop/components/fuse-chooser";
import { FuseChooser } from "@/features/workshop/components/fuse-chooser";
import type { FuseRequest } from "@/features/workshop/components/fuse-dialog";
import { FuseDialog } from "@/features/workshop/components/fuse-dialog";
import type { Fusion } from "@/features/workshop/components/fuse-panel";
import { FusePanel } from "@/features/workshop/components/fuse-panel";
import type { GridFuse } from "@/features/workshop/components/workshop-grid";
import type { useWorkshop } from "@/features/workshop/use-workshop";
import type {
  StationContext,
  WorkshopTile,
} from "@/features/workshop/workshop";
import {
  fuseMark,
  fuseOptions,
  fuseRefusal,
  fuseState,
  pruneInputs,
} from "@/features/workshop/workshop";

/** What the Fuse station needs from the Workshop screen. */
interface FuseStationInput {
  readonly workshop: ReturnType<typeof useWorkshop>;
  readonly slots: readonly DeckSlot[];
  /** All the tiles of the grid with the filters, before the ready filter. */
  readonly found: readonly WorkshopTile[];
  readonly context: StationContext;
  /** A new number for each Workshop action, for its drops and its reveal. */
  readonly nextSerial: () => number;
  /** The Essence drops of a Fuse: `null` with reduced motion. */
  readonly onFlight: (flight: Flight | null) => void;
  readonly onSay: (text: string) => void;
  readonly onSound: (rank: RankId, copies: number) => void;
}

/**
 * The Fuse station of the Workshop (GDD 7.4, ADR-0049): the slots, the Rank
 * chooser, the confirmation for copies in saved Decks, and the reveal. The
 * slots stay while the Player changes the station in one visit, and they lose
 * the copies that the Player does not own any more. It gives the Fuse state
 * of the grid, the panel, and the chooser and the dialog over the screen.
 */
export const useFuseStation = ({
  workshop,
  slots,
  found,
  context,
  nextSerial,
  onFlight,
  onSay,
  onSound,
}: FuseStationInput) => {
  const { tr } = useGameText();
  const [held, setHeld] = useState<readonly DeckEntry[]>([]);
  const [result, setResult] = useState<Fusion | null>(null);
  const [shake, setShake] = useState(0);
  const [choice, setChoice] = useState<FuseChoice | null>(null);
  const [request, setRequest] = useState<FuseRequest | null>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const { collection } = workshop;

  const inputs = useMemo(
    () => pruneInputs(held, collection),
    [held, collection]
  );
  const recipe = fuseRecipe(inputs);
  const state = fuseState(collection, inputs, context);
  const chances = useMemo(
    () => fuseChances(collection, inputs),
    [collection, inputs]
  );
  const marks = useMemo(
    () =>
      new Map(
        found.map((tile) => [tile.cardId, fuseMark(tile, collection, inputs)])
      ),
    [found, collection, inputs]
  );

  const name = (cardId: string) => tr(`cards.${cardId}.name`);

  const put = (cardId: string, rank: RankId) => {
    const next = [...inputs, { cardId, rank }];
    setHeld(next);
    setResult(null);
    onSay(
      tr("workshop.done.fuseIn", {
        name: name(cardId),
        rank: tr(`ranks.${rank}`),
        count: next.length,
        total: fuseRecipe(next)?.copies ?? next.length,
      })
    );
  };

  /** Why a press puts no copy in: said, and a full set of slots shakes. */
  const refuse = (tile: WorkshopTile) => {
    const why = fuseRefusal(tile, collection, inputs);
    if (why === "full") {
      setShake((current) => current + 1);
    }
    if (why === "kind" && recipe) {
      onSay(tr(`workshop.refusal.${recipe.kind}`));
      return;
    }
    onSay(
      tr(`workshop.refusal.${why ?? "copies"}`, {
        name: name(tile.cardId),
        rank: recipe ? tr(`ranks.${recipe.rank}`) : "",
      })
    );
  };

  const onPut = (cardId: string, element: HTMLElement | null) => {
    if (state.kind === "locked") {
      onSay(tr("workshop.refusal.locked", { level: state.level }));
      return;
    }
    const tile = found.find((item) => item.cardId === cardId);
    if (!tile) {
      return;
    }
    const ranks = fuseOptions(tile, collection, inputs);
    const [only] = ranks;
    if (only === undefined) {
      refuse(tile);
    } else if (ranks.length === 1) {
      put(cardId, only);
    } else {
      anchor.current = element;
      setChoice({ cardId, ranks });
    }
  };

  const fuseNow = (copies: readonly DeckEntry[]) => {
    const fused = fuseRecipe(copies);
    if (!fused) {
      return;
    }
    const serial = nextSerial();
    // Read the places of the drops before the panel changes.
    const flight = prefersReducedMotion()
      ? null
      : measureFlight(fused.rank, serial, "in");
    const cardId = workshop.fuse(copies);
    if (cardId === null) {
      return;
    }
    onSound(fused.rank, copies.length);
    setResult({ cardId, rank: fused.rank, inputs: copies, serial });
    setHeld([]);
    onFlight(flight);
    onSay(
      tr("workshop.done.fuse", {
        name: name(cardId),
        rank: tr(`ranks.${fused.rank}`),
      })
    );
  };

  const onFuse = () => {
    const decks = workshop.decksUsingInputs(inputs);
    if (decks.length > 0) {
      setRequest({ inputs, decks });
    } else {
      fuseNow(inputs);
    }
  };

  const grid: GridFuse = { marks, rank: recipe?.rank ?? null, onPut };

  return {
    grid,
    /** The new card stops showing when the Player leaves the station. */
    quiet: () => setResult(null),
    panel: (
      <FusePanel
        key="fuse"
        state={state}
        inputs={inputs}
        chances={chances}
        essence={workshop.essence}
        result={result}
        shake={shake}
        onRemove={(index) => {
          const input = inputs[index];
          setHeld(inputs.toSpliced(index, 1));
          if (input) {
            onSay(tr("workshop.done.fuseOut", { name: name(input.cardId) }));
          }
        }}
        onClear={() => {
          setHeld([]);
          onSay(tr("workshop.done.fuseClear"));
        }}
        onFuse={onFuse}
      />
    ),
    overlays: (
      <>
        <FuseChooser
          choice={choice}
          anchor={anchor}
          collection={collection}
          inputs={inputs}
          onPick={(cardId, rank) => {
            setChoice(null);
            put(cardId, rank);
          }}
          onClose={() => setChoice(null)}
        />
        <FuseDialog
          request={request}
          slots={slots}
          onKeep={() => setRequest(null)}
          onFuse={(confirmed) => {
            setRequest(null);
            fuseNow(confirmed.inputs);
          }}
        />
      </>
    ),
  };
};
