import { GameButton } from "@/features/battle/components/game-button";
import { openText } from "@/features/battle/tutorial";
import type { TutorialStep } from "@/features/battle/tutorial";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";

type Battle = ReturnType<typeof useBattle>;

const StepText = ({
  step,
  battle,
}: {
  readonly step: TutorialStep;
  readonly battle: Battle;
}) => {
  const { tr } = useGameText();
  return (
    <section
      aria-labelledby="tutorial-title"
      className="fade-in slide-in-from-right-4 animate-in pointer-events-auto flex flex-col gap-2 rounded-xl border-4 border-[#5b3a1e] bg-[#f6ead0] p-3 text-[#2a1d12] shadow-2xl duration-200 motion-reduce:animate-none [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-2"
      data-testid="tutorial-text"
      data-step={step}
    >
      <p className="text-xs font-bold tracking-wide text-[#0e6f86] uppercase">
        {tr("tutorial.label")}
      </p>
      <h2
        id="tutorial-title"
        className="font-display text-lg leading-tight font-black [@media(max-height:500px)]:text-base"
      >
        {tr(`tutorial.steps.${step}.title`)}
      </h2>
      <p className="text-sm leading-snug [@media(max-height:500px)]:text-xs">
        {tr(`tutorial.steps.${step}.text`)}
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <GameButton
          intent="ghost"
          size="sm"
          onPress={() => battle.skipTutorialText()}
          data-testid="tutorial-skip"
        >
          {tr("tutorial.skip")}
        </GameButton>
        <GameButton
          intent="gold"
          size="sm"
          onPress={() => battle.closeTutorialText()}
          data-testid="tutorial-got-it"
        >
          {tr("tutorial.gotIt")}
        </GameButton>
      </div>
    </section>
  );
};

/**
 * The open Tutorial Step text (GDD 8.3). Only one text shows at a time. It is
 * in a live region, so a screen reader reads each new text, and its controls
 * come first in the keyboard order of the Battle screen.
 */
export const TutorialPanel = ({ battle }: { readonly battle: Battle }) => {
  const step = openText(battle.session?.tutorial ?? null);
  return (
    <div
      className="pointer-events-none absolute top-1/2 right-[max(0.5rem,env(safe-area-inset-right))] z-30 w-[min(320px,38vw)] -translate-y-1/2 [@media(max-height:500px)]:w-[min(300px,40vw)]"
      aria-live="polite"
    >
      {step ? <StepText key={step} step={step} battle={battle} /> : null}
    </div>
  );
};
