import { RegistryContext, useAtom, useAtomValue } from "@effect/atom-react";
import { lazy, Suspense, useContext, useEffect, useMemo } from "react";

import {
  setSoundEnabled,
  setSoundVolume,
} from "@/features/battle/battle-audio";
import { stagePainting } from "@/features/battle/battle-painting";
import { soundOnAtom, soundVolumeAtom } from "@/features/battle/battle.atoms";
import type {
  BattleKeyAction,
  BattleKeyCommand,
} from "@/features/battle/components/battle-keys";
import {
  inspectDirection,
  keyCommand,
  nextReadyCard,
} from "@/features/battle/components/battle-keys";
import { BattlePainting } from "@/features/battle/components/battle-painting";
import { CastCard } from "@/features/battle/components/cast-card";
import { HandBar } from "@/features/battle/components/hand-bar";
import {
  PortraitGuard,
  ResultOverlay,
  TurnBanner,
} from "@/features/battle/components/overlays";
import { TopBar } from "@/features/battle/components/top-bar";
import { TutorialPanel } from "@/features/battle/components/tutorial-panel";
import { UnitDetails } from "@/features/battle/components/unit-details";
import { qaEnabled, stateFromSearch } from "@/features/battle/qa";
import { installTestHooks } from "@/features/battle/test-hooks";
import { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { CampaignScreen } from "@/features/campaign/components/campaign-screen";
import { HandbookDialog } from "@/features/handbook/components/handbook-dialog";
import { useHandbook } from "@/features/handbook/use-handbook";
import { HintBanner } from "@/features/hint/components/hint-banner";
import {
  useBattleHints,
  usePacksHints,
  useTownHints,
} from "@/features/hint/use-hints";
import { PacksScreen } from "@/features/packs/components/packs-screen";
import { TownBar } from "@/features/town/components/town-bar";
import {
  TownScreen,
  useTownLeave,
} from "@/features/town/components/town-screen";
import { gameScreenAtom } from "@/features/town/town.atoms";

const BattleCanvas = lazy(
  () => import("@/features/battle/scene/battle-canvas")
);

/** NFR-05: the game needs WebGL 2. */
const hasWebgl2 = (): boolean => {
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
};

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** A key in an open dialog (the Abandon confirm, the result) is for that dialog. */
const inDialog = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('[role="dialog"]') !== null;

type Battle = ReturnType<typeof useBattle>;

/** What a Battle key can act on: the Battle, and the Handbook over it. */
interface KeyContext {
  readonly battle: Battle;
  readonly openHandbook: () => void;
}

/** ArrowLeft and ArrowRight move the selection over the Ready cards. */
const moveSelection = (battle: Battle, event: KeyboardEvent, step: 1 | -1) => {
  const hand = battle.session?.view.sides.player.hand ?? [];
  const next = nextReadyCard(hand, battle.selected, step);
  if (next === null) {
    return;
  }
  event.preventDefault();
  battle.select(next);
  document
    .querySelector<HTMLButtonElement>(`[data-testid="hand-card-${next}"]`)
    ?.focus();
};

/** Enter plays the selected card on the focused target, but not on a focused button. */
const playFocusedTarget = (battle: Battle, event: KeyboardEvent) => {
  const onButton = event.target instanceof HTMLButtonElement;
  const target = battle.targets[battle.focused];
  if (!onButton && target) {
    event.preventDefault();
    battle.play(target);
  }
};

const KEY_HANDLERS: Readonly<
  Record<
    BattleKeyAction,
    (keys: KeyContext, event: KeyboardEvent, step: 1 | -1) => void
  >
> = {
  moveSelection: ({ battle }, event, step) =>
    moveSelection(battle, event, step),
  focusTarget: ({ battle }, event, step) => {
    event.preventDefault();
    battle.focusTarget(step);
  },
  play: ({ battle }, event) => playFocusedTarget(battle, event),
  endTurn: ({ battle }) => battle.endTurn(),
  skip: ({ battle }) => battle.skip(),
  inspect: ({ battle }, event) => {
    event.preventDefault();
    battle.toggleInspect();
  },
  // The Battle does not pause: the Handbook opens at one side of the Board.
  handbook: ({ openHandbook }, event) => {
    event.preventDefault();
    openHandbook();
  },
  cancel: ({ battle }) => battle.select(null),
};

/**
 * The keyboard Inspect mode takes the arrow keys and Esc. Returns true when it
 * used the key.
 */
const inspectKey = (
  battle: Battle,
  event: KeyboardEvent,
  command: BattleKeyCommand
): boolean => {
  if (!battle.inspecting) {
    return false;
  }
  const direction = inspectDirection(command);
  if (direction) {
    event.preventDefault();
    battle.inspectNext(direction);
    return true;
  }
  if (command.action === "cancel") {
    event.preventDefault();
    battle.stopInspect();
    return true;
  }
  return false;
};

const commandFromKey = (event: KeyboardEvent) =>
  isTyping(event.target) || inDialog(event.target) ? null : keyCommand(event);

const runKey = (
  keys: KeyContext,
  event: KeyboardEvent,
  command: BattleKeyCommand
) => {
  if (!inspectKey(keys.battle, event, command)) {
    KEY_HANDLERS[command.action](keys, event, command.step);
  }
};

const DETAILS = '[data-testid="unit-details"]';

/**
 * In the keyboard Inspect mode, Tab goes into the Card Details, to the links
 * of the Keyword, Status and Damage Type names (issue #25). Returns true when
 * it used the key.
 */
const tabIntoDetails = (battle: Battle, event: KeyboardEvent): boolean => {
  if (!battle.inspecting || event.key !== "Tab" || event.shiftKey) {
    return false;
  }
  const panel = document.querySelector(DETAILS);
  const inPanel = event.target instanceof Node && panel?.contains(event.target);
  const link = panel?.querySelector<HTMLElement>(
    '[data-testid="details-entry-link"]'
  );
  if (inPanel || inDialog(event.target) || !link) {
    return false;
  }
  event.preventDefault();
  link.focus();
  return true;
};

/** UI-02: a full Battle with only a keyboard. */
const useBattleKeys = (battle: Battle, openHandbook: () => void) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (tabIntoDetails(battle, event)) {
        return;
      }
      const command = commandFromKey(event);
      if (command) {
        runKey({ battle, openHandbook }, event, command);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [battle, openHandbook]);
};

const BattleStage = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  const webgl2 = useMemo(() => hasWebgl2(), []);
  const stageId = battle.session?.options.stageId;
  const painting = useMemo(
    () => (stageId ? stagePainting(stageId) : null),
    [stageId]
  );
  const handbook = useHandbook();
  useBattleKeys(battle, handbook.open);
  useBattleHints(battle.session);
  return (
    <div
      className="fixed inset-0 overflow-hidden overscroll-none text-[#fff6df]"
      data-testid="battle-stage"
    >
      {/* The painting loads before the 3D chunk, so it shows at once (web ADR-0007). */}
      <BattlePainting src={painting} />
      {webgl2 ? (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-display rounded-xl bg-[#1c140e]/85 px-6 py-3 text-xl">
                {tr("battle.loading")}
              </p>
            </div>
          }
        >
          <BattleCanvas onPick={(target) => battle.play(target)} />
        </Suspense>
      ) : (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-[#1c140e] p-8 text-center text-lg"
        >
          {tr("battle.noWebgl")}
        </div>
      )}
      <CastCard />
      <TutorialPanel battle={battle} />
      <UnitDetails battle={battle} />
      <TopBar battle={battle} />
      <TurnBanner />
      <HandBar battle={battle} />
      <ResultOverlay battle={battle} />
    </div>
  );
};

/** Esc on a screen other than the Town goes back to the Town (GDD 11.4). */
const useEscToTown = (active: boolean, toTown: () => void) => {
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        !isTyping(event.target)
      ) {
        toTown();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, toTown]);
};

/**
 * The game in one route (web ADR-0006): the Town, the Campaign (the Region
 * Map), then the Battle, and the Packs. The Town Bar shows on each screen
 * except the Battle.
 */
export const PlayScreen = () => {
  const battle = useBattle();
  const registry = useContext(RegistryContext);
  const soundOn = useAtomValue(soundOnAtom);
  const soundVolume = useAtomValue(soundVolumeAtom);
  const [screen, setScreen] = useAtom(gameScreenAtom);
  const { leaving, open: handleOpen } = useTownLeave(screen, setScreen);

  useEscToTown(screen !== "town" && !battle.session, () => setScreen("town"));
  useTownHints(!battle.session);
  usePacksHints(!battle.session && screen === "packs");

  useEffect(() => setSoundEnabled(soundOn), [soundOn]);
  useEffect(() => setSoundVolume(soundVolume), [soundVolume]);
  useEffect(
    () =>
      qaEnabled()
        ? installTestHooks(registry, stateFromSearch(location.search))
        : undefined,
    [registry]
  );

  return (
    <>
      {battle.session ? (
        <BattleStage battle={battle} />
      ) : (
        <>
          {screen === "town" ? (
            <TownScreen leaving={leaving} onOpen={handleOpen} />
          ) : null}
          {screen === "campaign" ? (
            <CampaignScreen onStart={(options) => battle.start(options)} />
          ) : null}
          {screen === "packs" ? <PacksScreen /> : null}
          <TownBar screen={screen} onOpen={handleOpen} />
        </>
      )}
      <HintBanner />
      <HandbookDialog inBattle={battle.session !== null} />
      <PortraitGuard />
    </>
  );
};
