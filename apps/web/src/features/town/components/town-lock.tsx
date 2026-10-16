import { useGameText } from "@/features/battle/use-game-text";
import { BossCrown } from "@/features/campaign/components/campaign-icons";
import type { TownLock } from "@/features/town/town";

/**
 * The words of a lock (GDD 11.4): "Opens at level N" for a Player level, or
 * "Win Marrow Castle (5-10) to open" for a Stage to win first. `named` gives
 * the accessible name of a locked Building or shortcut, with the same words.
 */
export const useTownLockText = () => {
  const { tr } = useGameText();
  const stageName = (stageId: string) => tr(`stages.${stageId}.name`);
  return {
    reason: (lock: TownLock) =>
      lock.kind === "level"
        ? tr("town.opensAtLevel", { level: lock.level })
        : tr("town.opensWithStage", {
            stage: stageName(lock.stageId),
            id: lock.stageId,
          }),
    named: (name: string, lock: TownLock) =>
      lock.kind === "level"
        ? tr("town.lockedAtLevel", { name, level: lock.level })
        : tr("town.lockedWithStage", {
            name,
            stage: stageName(lock.stageId),
            id: lock.stageId,
          }),
  };
};

/**
 * The short text of a Lock Plate: "Level N", or the ID of the Boss Stage to
 * win first with a small Boss crown, as the Stage Marker of a Boss Stage.
 */
export const LockPlateText = ({ lock }: { readonly lock: TownLock }) => {
  const { tr } = useGameText();
  if (lock.kind === "level") {
    return <>{tr("town.levelPlate", { level: lock.level })}</>;
  }
  return (
    <span className="flex items-center gap-1 tabular-nums">
      <BossCrown className="size-[1.15em] drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]" />
      {lock.stageId}
    </span>
  );
};
