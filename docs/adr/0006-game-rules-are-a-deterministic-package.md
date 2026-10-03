# Game rules are a deterministic package

All Heynbord game rules (Battle, Deck rules, Workshop, rewards, enemy AI and the Profile model) are in `packages/rules` (`@workspace/rules`). The package is pure TypeScript. It does not use React, Three.js or the DOM. The Three.js scene in `apps/spa` only plays the Battle Events that the rules return. It never calculates a rule. All random results come from a seeded generator in the Battle state. All game values are integers. Thus the same seed and the same Commands always give the same result, on every browser and on a server.

We did this for three reasons. First, v2 adds asynchronous PvP: the server must run a Battle again from its seed and Commands, and accept the result only if it is the same. Second, replays and bug reports need only the seed and the Command list. Third, balance and economy simulations can run thousands of Battles without rendering.

## Considered Options

- **Rules inside the scene in `apps/spa`.** Rejected. It is faster to start, but the rules then depend on frame timing and on React. It is very difficult to move them to a server later.
- **The name `packages/core`.** Rejected. [ADR-0004](./0004-module-resolution-has-a-single-source-of-truth.md) removed `@workspace/core` and says "do not restore" it. A new package with the same name gives confusion. `rules` also says what the package contains.

## Consequences

- Do not use `Math.random()`, `Date.now()` or floating-point game values in `packages/rules`.
- Rule unit tests are pure module logic, as in [ADR-0001](./0001-unit-tests-are-pure-module-logic.md).
- The package returns IDs and values, not text. `apps/spa` owns the Message Catalogs.
