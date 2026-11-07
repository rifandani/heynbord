import type { ModelContract } from "../../apps/web/scripts/model-contract.ts";

const difference = (
  field: string,
  recorded: string,
  current: string
): readonly string[] =>
  recorded === current
    ? []
    : [`${field}: recorded ${recorded}, now ${current}`];

const clipNames = (contract: ModelContract): string =>
  contract.clips.map((clip) => clip.name).join(",");

/** Each difference between a Source Contract and a new Raw Export. Numbers must match exactly. */
export const contractProblems = (
  recorded: ModelContract,
  current: ModelContract
): readonly string[] => {
  const problems = [
    ...difference("min", recorded.min.join(","), current.min.join(",")),
    ...difference("max", recorded.max.join(","), current.max.join(",")),
    ...difference("bones", recorded.bones.join(","), current.bones.join(",")),
    ...difference("clips", clipNames(recorded), clipNames(current)),
  ];
  if (clipNames(recorded) !== clipNames(current)) {
    return problems;
  }
  return [
    ...problems,
    ...recorded.clips.flatMap((clip, index) => {
      const now = current.clips[index];
      return [
        ...difference(
          `clips.${clip.name}.duration`,
          String(clip.duration),
          String(now?.duration)
        ),
        ...difference(
          `clips.${clip.name}.keyframes`,
          clip.keyframes,
          String(now?.keyframes)
        ),
      ];
    }),
  ];
};
