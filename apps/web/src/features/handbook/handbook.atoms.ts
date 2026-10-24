import { Atom } from "effect/reactivity";

import type { EntryId, HandbookRequest } from "@/features/handbook/handbook";
import { FIRST_ENTRY } from "@/features/handbook/handbook";

/**
 * The open Handbook and where it opened, or `null` when it is closed. One
 * dialog shows it for the Town Bar, the Top Bar, the H key and the links.
 * App state, so kept alive.
 */
export const handbookAtom = Atom.make<HandbookRequest | null>(null).pipe(
  Atom.keepAlive
);

/**
 * The last Entry that the Player read in this session. The Town Bar and the
 * Top Bar open the Handbook at it. A page load starts again at the Board.
 */
export const lastEntryAtom = Atom.make<EntryId>(FIRST_ENTRY).pipe(
  Atom.keepAlive
);

/** Opens the Handbook at the last Entry that the Player read. */
export const openFromBar = (last: EntryId): HandbookRequest => ({
  entry: last,
  from: "bar",
});

/** Opens the Handbook at the Entry of a link. */
export const openFromLink = (entry: EntryId): HandbookRequest => ({
  entry,
  from: "link",
});
