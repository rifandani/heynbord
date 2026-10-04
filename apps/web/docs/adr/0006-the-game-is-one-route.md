# The game is one route

The full game is in the `/play` route. The Town, the Campaign and the Battle are states of that route, not separate URLs. The game opens a different URL only for a link to a page that is not part of the game.

We did this so that the game feels like one app, as the original Flash games did, and not like a website: no page change and no URL change between screens.

## Considered Options

- **One route for each screen (`/play/campaign`, `/play/battle`).** Rejected. It gives deep links and a working browser Back button, but the game then feels like a website with pages.

## Consequences

- The browser Back button does not move between game screens. Each screen has its own in-game control to go back.
- A reload always opens the Town. The game does not remember the last screen. A Battle in progress has no save, so a reload loses it.
- The e2e tests and the QA hooks must open a screen through the game state, not through a URL.
