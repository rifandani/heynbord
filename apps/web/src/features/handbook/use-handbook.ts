import { useAtom, useAtomValue } from "@effect/atom-react";

import type { EntryId } from "@/features/handbook/handbook";
import {
  handbookAtom,
  lastEntryAtom,
  openFromBar,
  openFromLink,
} from "@/features/handbook/handbook.atoms";

/**
 * The openers of the Handbook: the Town Bar shortcut, the Top Bar button and
 * the H key open it at the last Entry that the Player read; a link opens it
 * at its Entry.
 */
export const useHandbook = () => {
  const [request, setRequest] = useAtom(handbookAtom);
  const last = useAtomValue(lastEntryAtom);
  return {
    isOpen: request !== null,
    open: () => setRequest(openFromBar(last)),
    openAt: (entry: EntryId) => setRequest(openFromLink(entry)),
  };
};
