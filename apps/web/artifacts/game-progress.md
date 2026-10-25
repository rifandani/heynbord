# Game progress (threejs-game-director)

## Intent and constraints

- Build the Heynbord Battle slice (roadmap M0 + M1) from `docs/game/`. It must be playable, performant by default, and verified.
- Decisions (grilling session, 2026-10-03, all recommended answers accepted): scope M0 + M1; procedural art and Web Audio sounds only (no external generators); work on branch `feat/battle-slice` with no commit.
- Stack: `three` 0.186.1, `@react-three/fiber` 9.8.1, `@react-three/drei` 10.7.9. No uikit: the HUD is React DOM (art direction 2).

## Done

- `packages/rules`: deterministic engine (`step`, `createBattle`, `legalTargets`, `starsFor`), 20 cards, 2 Starter Decks, 4 Stages, AI (`chooseCommand`), simulation script.
- `apps/web/src/features/battle`: view model, session and timeline, atoms, R3F scene, HUD, audio, QA hooks, `/battle` route.
- Tests: rules unit tests, web unit tests, E2E bot playtest.

## Pending

- None for this slice. See `final-evidence.md` for the verification and the known limits.

## Known limits

- Hover details for Units on the Board are not done (cards in the Hand have them).
- No Auto-play UI (M4). `autoPlayTurn` exists and the QA hooks use it.
