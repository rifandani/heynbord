import { useAtomSet } from "@effect/atom-react";
import { cn } from "cn";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { GameButton } from "@/core/components/game/game-button";
import type { PadPress } from "@/core/input/gamepad";
import { useGamepad } from "@/core/input/use-gamepad";
import { battlePainting } from "@/features/battle/battle-painting";
import type { BattleSession } from "@/features/battle/battle-session";
import { heroOf } from "@/features/battle/battle-view";
import {
  controlsGuideAtom,
  leaveConfirmAtom,
  padIdAtom,
} from "@/features/battle/battle.atoms";
import {
  dialogOpen,
  inDialog,
  isTyping,
} from "@/features/battle/components/battle-input";
import type {
  BattleKeyAction,
  BattleKeyCommand,
} from "@/features/battle/components/battle-keys";
import {
  cancelAction,
  inspectDirection,
  keyCommand,
  logKeyAction,
  nextReadyCard,
} from "@/features/battle/components/battle-keys";
import {
  BattleLogBanner,
  BattleLogPanel,
} from "@/features/battle/components/battle-log-panel";
import { BattlePainting } from "@/features/battle/components/battle-painting";
import { CastCard } from "@/features/battle/components/cast-card";
import { HandBar } from "@/features/battle/components/hand-bar";
import {
  ResultOverlay,
  TurnBanner,
} from "@/features/battle/components/overlays";
import { padBattleCommand } from "@/features/battle/components/pad-battle";
import { TopBar } from "@/features/battle/components/top-bar";
import { TutorialPanel } from "@/features/battle/components/tutorial-panel";
import { UnitDetails } from "@/features/battle/components/unit-details";
import type { useBattle } from "@/features/battle/use-battle";
import {
  clearBattleModels,
  useBattleModels,
} from "@/features/battle/use-battle-models";
import { useGameText } from "@/features/battle/use-game-text";
import { useHandbook } from "@/features/handbook/use-handbook";
import { useBattleHints } from "@/features/hint/use-hints";

const BattleCanvas = lazy(
  () => import("@/features/battle/scene/battle-canvas")
);

type Battle = ReturnType<typeof useBattle>;

/** NFR-05: the game needs WebGL 2. */
const hasWebgl2 = (): boolean => {
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
};

/** The panels and the confirm that a Battle key or a pad press can open. */
interface BattleOverlays {
  readonly openHandbook: () => void;
  readonly openControlsGuide: () => void;
  readonly openLeave: () => void;
}

/** What a Battle key can act on: the Battle, and the panels over it. */
interface KeyContext extends BattleOverlays {
  readonly battle: Battle;
}

/**
 * One Battle input, from a key or from a pad. The command carries its source,
 * and a pad has no DOM event to stop.
 */
interface BattleInput {
  readonly command: BattleKeyCommand;
  readonly shiftKey: boolean;
  readonly target: EventTarget | null;
  readonly preventDefault?: () => void;
}

/** The input of a pad command, which has no DOM event. */
const padInput = (command: BattleKeyCommand): BattleInput => ({
  command,
  shiftKey: false,
  target: null,
});

/** ArrowLeft and ArrowRight move the selection over the Ready cards. */
const moveSelection = (battle: Battle, input: BattleInput, step: 1 | -1) => {
  const hand = battle.session ? heroOf(battle.session.view, "player").hand : [];
  const next = nextReadyCard(hand, battle.selected, step);
  if (next === null) {
    return;
  }
  input.preventDefault?.();
  battle.select(next);
  document
    .querySelector<HTMLButtonElement>(`[data-testid="hand-card-${next}"]`)
    ?.focus();
};

/**
 * Enter plays the selected card on the focused target, but not on a focused
 * button. The guard is for the keyboard only: a pad press can play while a
 * button has the focus.
 */
const playFocusedTarget = (battle: Battle, input: BattleInput) => {
  const onButton =
    input.command.source === "keyboard" &&
    input.target instanceof HTMLButtonElement;
  const target = battle.targets[battle.focused];
  if (!onButton && target) {
    input.preventDefault?.();
    battle.play(target);
  }
};

const KEY_HANDLERS: Readonly<
  Record<
    BattleKeyAction,
    (keys: KeyContext, input: BattleInput, step: 1 | -1) => void
  >
> = {
  moveSelection: ({ battle }, input, step) =>
    moveSelection(battle, input, step),
  focusTarget: ({ battle }, input, step) => {
    input.preventDefault?.();
    battle.focusTarget(step);
  },
  play: ({ battle }, input) => playFocusedTarget(battle, input),
  endTurn: ({ battle }) => battle.endTurn(),
  skip: ({ battle }) => battle.skip(),
  inspect: ({ battle }, input) => {
    input.preventDefault?.();
    battle.toggleInspect();
  },
  // The Battle does not pause: the Handbook opens at one side of the Board.
  handbook: ({ openHandbook }, input) => {
    input.preventDefault?.();
    openHandbook();
  },
  // Live pauses while the Battle Log is open (GDD 11.2).
  battleLog: ({ battle }, input) => {
    input.preventDefault?.();
    battle.openLog();
  },
  controlsGuide: ({ openControlsGuide }, input) => {
    input.preventDefault?.();
    openControlsGuide();
  },
  // Esc in Live (GDD 11.4) cancels what is open first. With nothing to cancel,
  // it opens the Leave confirm, as the Leave button does. A finished Battle
  // already shows its result, so there is no Live to leave.
  cancel: ({ battle, openLeave }, input) => {
    if (battle.liveSession?.view.result !== null) {
      return;
    }
    const action = cancelAction(battle.selected !== null, input.command.source);
    if (action === "select") {
      battle.select(null);
    } else if (action === "leave") {
      input.preventDefault?.();
      openLeave();
    }
  },
};

/**
 * The keyboard Inspect mode takes the direction presses and Esc. Returns true
 * when it used the press.
 */
const inspectKey = (
  battle: Battle,
  input: BattleInput,
  command: BattleKeyCommand
): boolean => {
  if (!battle.inspecting) {
    return false;
  }
  const direction = inspectDirection(command);
  if (direction) {
    input.preventDefault?.();
    battle.inspectNext(direction);
    return true;
  }
  if (command.action === "cancel") {
    input.preventDefault?.();
    battle.stopInspect();
    return true;
  }
  return false;
};

/** The result dialog takes its own keys, but L opens the Battle Log from it. */
const inResult = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest('[data-testid="battle-result"]') !== null;

const commandFromKey = (event: KeyboardEvent) => {
  if (isTyping(event.target)) {
    return null;
  }
  const command = keyCommand(event);
  if (!inDialog(event.target)) {
    return command;
  }
  return command?.action === "battleLog" && inResult(event.target)
    ? command
    : null;
};

/**
 * The keys of the open Battle Log: ←/→ one Log Entry, Shift+←/→ one Turn,
 * L1 and R1 on a pad one Turn, L and Esc Back to Live (in a Replay, Esc
 * leaves). Inspect and the Handbook work as in Live, and the other Live
 * commands do nothing.
 */
const runLogKey = (keys: KeyContext, input: BattleInput) => {
  const action = logKeyAction(
    input.command,
    input.shiftKey,
    keys.battle.watching
  );
  switch (action._tag) {
    case "step": {
      input.preventDefault?.();
      keys.battle.stepLog(action.step, action.byTurn);
      return;
    }
    case "close": {
      input.preventDefault?.();
      keys.battle.closeLog();
      return;
    }
    case "live": {
      KEY_HANDLERS[input.command.action](keys, input, input.command.step);
      break;
    }
    case "off": {
      // All Live input is off in the Battle Log.
      break;
    }
    default: {
      return action satisfies never;
    }
  }
};

const runKey = (keys: KeyContext, input: BattleInput) => {
  if (inspectKey(keys.battle, input, input.command)) {
    return;
  }
  if (keys.battle.log) {
    runLogKey(keys, input);
    return;
  }
  KEY_HANDLERS[input.command.action](keys, input, input.command.step);
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
const useBattleKeys = (battle: Battle, overlays: BattleOverlays) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (tabIntoDetails(battle, event)) {
        return;
      }
      const command = commandFromKey(event);
      if (command) {
        runKey(
          { battle, ...overlays },
          {
            command,
            shiftKey: event.shiftKey,
            target: event.target,
            preventDefault: () => event.preventDefault(),
          }
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [battle, overlays]);
};

/**
 * A pad command, after the guards that the keyboard applies to a key event:
 * a text field takes the input, and an open dialog takes all but L1 in the
 * result.
 */
const padCommandFor = (press: PadPress): BattleKeyCommand | null => {
  if (isTyping(document.activeElement)) {
    return null;
  }
  const command = padBattleCommand(press);
  if (!dialogOpen()) {
    return command;
  }
  return command?.action === "battleLog" && inResult(document.activeElement)
    ? command
    : null;
};

/** UI-02: a full Battle with only a controller. The pad shares the key path. */
const useBattlePad = (battle: Battle, overlays: BattleOverlays) => {
  const { tr } = useGameText();
  const setPadId = useAtomSet(padIdAtom);
  useEffect(() => () => setPadId(null), [setPadId]);
  useGamepad({
    onPress: (press) => {
      const command = padCommandFor(press);
      if (command) {
        runKey({ battle, ...overlays }, padInput(command));
      }
    },
    onConnect: (pad) => {
      setPadId(pad.id);
      toast(tr("battle.padConnected"), { id: "pad-connect" });
    },
    onDisconnect: () => setPadId(null),
  });
};

/** The 3D Board, which loads in its own chunk. */
const BoardLayer = ({
  battle,
  webgl2,
}: {
  readonly battle: Battle;
  readonly webgl2: boolean;
}) => {
  const { tr } = useGameText();
  if (!webgl2) {
    return null;
  }
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display bg-night-plate/85 rounded-xl px-6 py-3 text-xl">
            {tr("battle.loading")}
          </p>
        </div>
      }
    >
      <BattleCanvas onPick={(target) => battle.play(target)} />
    </Suspense>
  );
};

/**
 * The Battle in front of the Play screen: the Board, the Top Bar, the Hand
 * Bar, the Battle Log and the result. It loads in its own chunk when a Battle
 * starts.
 */
const BattleStageContent = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  const webgl2 = useMemo(() => hasWebgl2(), []);
  const options = battle.session?.options;
  const painting = useMemo(
    () => (options ? battlePainting(options) : null),
    [options]
  );
  const handbook = useHandbook();
  const setGuide = useAtomSet(controlsGuideAtom);
  const setLeave = useAtomSet(leaveConfirmAtom);
  const openControlsGuide = useCallback(
    () => setGuide({ line: null }),
    [setGuide]
  );
  const overlays = useMemo(
    () => ({
      openHandbook: handbook.open,
      openControlsGuide,
      openLeave: () => setLeave(true),
    }),
    [handbook.open, openControlsGuide, setLeave]
  );
  useBattleKeys(battle, overlays);
  useBattlePad(battle, overlays);
  useBattleHints(battle.liveSession);
  return (
    <div
      className="text-cream fixed inset-0 overflow-hidden overscroll-none"
      data-testid="battle-stage"
    >
      {/*
       * In the Battle Log, the painting and the Board are grey and a little
       * warm, like an old picture, so that a past moment never looks like Live.
       */}
      <div
        className={cn(
          "absolute inset-0 transition-[filter] duration-300 ease-out motion-reduce:transition-none",
          battle.log && "[filter:saturate(0.28)_sepia(0.2)_brightness(0.95)]"
        )}
        data-testid="battle-board-layer"
        data-past={battle.log ? true : undefined}
      >
        {/* The painting loads before the 3D chunk, so it shows at once (web ADR-0006). */}
        <BattlePainting src={painting} />
        <BoardLayer battle={battle} webgl2={webgl2} />
      </div>
      {webgl2 ? null : (
        <div
          role="alert"
          className="bg-night-plate absolute inset-0 flex items-center justify-center p-8 text-center text-lg"
        >
          {tr("battle.noWebgl")}
        </div>
      )}
      <CastCard />
      <TutorialPanel battle={battle} />
      <UnitDetails battle={battle} />
      <TopBar battle={battle} />
      <TurnBanner />
      <BattleLogBanner battle={battle} />
      <HandBar battle={battle} />
      <BattleLogPanel battle={battle} />
      <ResultOverlay battle={battle} />
    </div>
  );
};

/** The retry when one or more Unit Models did not load. */
const BattleModelError = ({
  retry,
  leave,
}: {
  readonly retry: () => void;
  readonly leave: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <div className="bg-night-plate text-cream fixed inset-0 z-50 grid place-items-center px-6">
      <div className="max-w-sm text-center">
        <p className="font-display text-xl">{tr("battle.modelError")}</p>
        <div className="mt-4 flex justify-center gap-2">
          <GameButton intent="gold" size="lg" onPress={retry}>
            {tr("battle.modelRetry")}
          </GameButton>
          <GameButton intent="wood" size="lg" onPress={leave}>
            {tr("battle.quit")}
          </GameButton>
        </div>
      </div>
    </div>
  );
};

const BattleStageModels = ({
  battle,
  session,
  onRetry,
}: {
  readonly battle: Battle;
  readonly session: BattleSession;
  readonly onRetry: () => void;
}) => {
  const failed = useBattleModels(session);
  if (failed.length > 0) {
    return (
      <BattleModelError
        retry={onRetry}
        leave={() => {
          clearBattleModels(session);
          battle.leave();
        }}
      />
    );
  }
  return <BattleStageContent battle={battle} />;
};

const BattleStageGate = ({
  battle,
  session,
}: {
  readonly battle: Battle;
  readonly session: BattleSession;
}) => {
  const [attempt, setAttempt] = useState(0);
  return (
    <BattleStageModels
      key={attempt}
      battle={battle}
      session={session}
      onRetry={() => {
        clearBattleModels(session);
        setAttempt((value) => value + 1);
      }}
    />
  );
};

/** The Battle, after every Unit Model of the Battle is ready. */
export const BattleStage = ({ battle }: { readonly battle: Battle }) =>
  battle.liveSession ? (
    <BattleStageGate battle={battle} session={battle.liveSession} />
  ) : null;
