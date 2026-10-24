import type { Expedition } from "@workspace/rules";

import { useGameText } from "@/features/battle/use-game-text";

/** The name of a voyage, for example "Essence, 24 h" (Economy 2.8). */
export const useVoyageName = () => {
  const { tr } = useGameText();
  return (voyage: Expedition) =>
    tr("seaport.voyageName", {
      cargo: tr(`seaport.cargoes.${voyage.cargo}`),
      hours: voyage.hours,
    });
};
