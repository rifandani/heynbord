import { useGameText } from "@/features/battle/use-game-text";

/**
 * The guard of a phone in portrait: the Battle needs the width of the
 * landscape. It is not part of the Battle UI, because the Play screen shows
 * it over every screen.
 */
export const PortraitGuard = () => {
  const { tr } = useGameText();
  return (
    <div className="bg-night-plate text-cream pointer-events-auto fixed inset-0 z-[60] hidden items-center justify-center p-8 text-center [@media(orientation:portrait)_and_(pointer:coarse)]:flex">
      <p className="font-display max-w-xs text-xl">
        <span className="mb-4 block text-5xl" aria-hidden>
          ⟳
        </span>
        {tr("battle.rotate")}
      </p>
    </div>
  );
};
