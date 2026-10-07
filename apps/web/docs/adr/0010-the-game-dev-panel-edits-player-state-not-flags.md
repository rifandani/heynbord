# The Game Dev Panel edits Player state, not Feature Flags

In development, the TanStack Devtools have a "Game Dev Panel" tab (`src/features/dev-panel`). It unlocks all cards and wins Campaign Stages one by one. It writes to the same atoms that play writes to (`collectionAtom`, `stageResultsAtom`, `tutorialStageWonAtom`). The game code does not know that the panel exists.

The panel does not bring back the Feature Flags of ADR-0001. It does not change how the game behaves. It only puts the Player into a state that play can also reach, so a developer does not have to play Battles to test a later screen.

## Considered Options

- **An `EventClient` bus between the game and the panel**, as the TanStack custom plugin guide shows. Rejected. The panel renders in the same React tree through a portal, so it can read and write the atom registry directly.
- **Query parameters, like the QA hooks (`?state=`).** Rejected for this use. They are good for a fixed state in a bot playtest, but a developer wants to step through the Campaign one Stage at a time.

## Consequences

- The panel is in the production bundle only if `__root.tsx` mounts the devtools. It does that only in development and not in E2E runs.
- The panel can only win the next Stage or change a won Stage. To clear a Stage also clears all Stages after it. The Campaign never gets a state that play cannot reach.
- After the first use, the panel keeps the Collection and Stage results in `localStorage` (`heynbord.dev-overrides.v1`). It also keeps the results of real Battles, so a reload no longer starts as a new Player. "Clear dev state" ends this.
- The panel text is English only. It is a developer tool, not Player text, so it is not in the Message Catalogs.
