import { RegistryContext, useAtom, useAtomValue } from "@effect/atom-react";
import { lazy, Suspense, useContext, useEffect, useMemo } from "react";

import { setSoundEnabled } from "@/features/battle/battle-audio";
import { soundOnAtom } from "@/features/battle/battle.atoms";
import type { BattleKeyAction } from "@/features/battle/components/battle-keys";
import {
  keyCommand,
  nextReadyCard,
} from "@/features/battle/components/battle-keys";
import { HandBar } from "@/features/battle/components/hand-bar";
import {
  PortraitGuard,
  ResultOverlay,
  TurnBanner,
} from "@/features/battle/components/overlays";
import { StageSelect } from "@/features/battle/components/stage-select";
import { TopBar } from "@/features/battle/components/top-bar";
import { TutorialPanel } from "@/features/battle/components/tutorial-panel";
import { qaEnabled, stateFromSearch } from "@/features/battle/qa";
import { installTestHooks } from "@/features/battle/test-hooks";
import { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { TownBar } from "@/features/town/components/town-bar";
import { TownScreen } from "@/features/town/components/town-screen";
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
    (battle: Battle, event: KeyboardEvent, step: 1 | -1) => void
  >
> = {
  moveSelection,
  focusTarget: (battle, event, step) => {
    event.preventDefault();
    battle.focusTarget(step);
  },
  play: playFocusedTarget,
  endTurn: (battle) => battle.endTurn(),
  skip: (battle) => battle.skip(),
  cancel: (battle) => battle.select(null),
};

/** UI-02: a full Battle with only a keyboard. */
const useBattleKeys = (battle: Battle) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const command =
        isTyping(event.target) || inDialog(event.target)
          ? null
          : keyCommand(event);
      if (command) {
        KEY_HANDLERS[command.action](battle, event, command.step);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [battle]);
};

const BattleStage = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  const webgl2 = useMemo(() => hasWebgl2(), []);
  useBattleKeys(battle);
  return (
    <div
      className="fixed inset-0 overflow-hidden overscroll-none bg-[#a9cdee] text-[#fff6df]"
      data-testid="battle-stage"
    >
      {webgl2 ? (
        <Suspense
          fallback={
            <div className="font-display absolute inset-0 flex items-center justify-center bg-[#1c140e] text-xl">
              {tr("battle.loading")}
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
      <TutorialPanel battle={battle} />
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
 * The game in one route (web ADR-0006): the Town, the Campaign (now the Stage
 * select), then the Battle. The Town Bar shows on each screen except the Battle.
 */
export const PlayScreen = () => {
  const battle = useBattle();
  const registry = useContext(RegistryContext);
  const soundOn = useAtomValue(soundOnAtom);
  const [screen, setScreen] = useAtom(gameScreenAtom);

  useEscToTown(screen !== "town" && !battle.session, () => setScreen("town"));

  useEffect(() => setSoundEnabled(soundOn), [soundOn]);
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
            <TownScreen onOpen={setScreen} />
          ) : (
            <StageSelect onStart={(options) => battle.start(options)} />
          )}
          <TownBar screen={screen} onOpen={setScreen} />
        </>
      )}
      <PortraitGuard />
    </>
  );
};
