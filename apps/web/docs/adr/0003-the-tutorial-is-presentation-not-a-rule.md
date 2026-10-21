# The Tutorial is presentation, not a rule

The web app owns the Tutorial Steps. A pure module in `features/battle` reads the Battle Events and the Battle state, and decides which Tutorial Step to show. The rules package owns only the predicate "is this play of Stage 1-1 the Tutorial?", because the Stage results are in the Profile, and the Profile is in the rules package. The Tutorial changes no rule: a Tutorial play is a normal Battle with the same seed, Commands and AI.

We did this because the Tutorial is guidance about the screen, not a game rule. Replays and v2 PvP verification run a Battle from its seed and Commands only ([ADR-0006](../../../../docs/adr/0006-game-rules-are-a-deterministic-package.md)). Tutorial data in that path has no function there.

## Considered Options

- **The rules package emits Tutorial Step Battle Events.** Rejected. Step triggers depend on UI state (a selected Card, the playback of the Resolution Phase). This puts presentation into the deterministic package, and into every replay.
- **A scripted Stage 1-1 (a fixed top of the Deck, or a fixed enemy opening) to make sure each Step triggers.** Rejected for now. It needs a new `StageDefinition` feature. A headless simulation over many seeds and each Starter Deck shows that the Steps trigger with the normal rules. Use a scripted opening only if the simulation shows that a Step often does not trigger.

## Consequences

- The Step triggers are tested as pure module logic in the web app ([ADR-0001](../../../../docs/adr/0001-unit-tests-are-pure-module-logic.md)). The trigger rates are tested with a headless simulation that runs the rules and this module together, with no rendering.
- The Step 3 pause holds only the web playback queue. It never holds the rules state.
