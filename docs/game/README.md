# Heynbord game documents

These documents define **Heynbord**. Heynbord is a web game: a fantasy collectible card game with lane battles that resolve automatically. It is a spiritual successor to *Kings and Legends* (2013) and *Rise of Mythos* (2013–2019).

All documents use ASD-STE100 Simplified Technical English.

## Reading order

| No. | Document | Purpose | Owner |
| --- | --- | --- | --- |
| 01 | [Design Pillars](./01-design-pillars.md) | The 5 rules that all design decisions must obey. | Game director |
| 02 | [Game Vision](./02-game-vision.md) | What Heynbord is, who it is for, and why it exists. | Game director |
| 03 | [Game Design](./03-game-design.md) | The full rules: battle, cards, progression, modes and content. | Game designer |
| 04 | [Product Requirements](./04-prd.md) | Requirements with IDs and priorities for v1, and release criteria. | Product owner |
| 05 | [Art and Audio Direction](./05-art-direction.md) | Visual style, AI art workflow, camera, UI and audio. | Art director |
| 06 | [Technical Design](./06-technical-design.md) | Architecture, the rules package, rendering, save data and tests. | Lead engineer |
| 07 | [Economy](./07-economy.md) | Currencies (Coin and Heynstones), sources and sinks, packs, the Bazaar, costs and future monetization rules. | Game designer |
| 08 | [Roadmap](./08-roadmap.md) | Milestones for v1 and the plan after v1. | Product owner |
| 09 | [Card Concepts](./09-card-concepts.md) | The art brief and the image prompt for each card. | Art director |
| 10 | [Town Concepts](./10-town-concepts.md) | The art brief, the positions and the image prompts for the Town. | Art director |
| 11 | [Battlefield Concepts](./11-battlefield-concepts.md) | The art brief, the positions and the image prompt for each Battle Painting. | Art director |

One person (the solo developer) has all the roles. The roles show which point of view each document has.

## Related files

- [`packages/rules/CONTEXT.md`](../../packages/rules/CONTEXT.md): the game glossary. All documents use its terms.
- [ADR-0006](../adr/0006-game-rules-are-a-deterministic-package.md): why the game rules are a separate deterministic package.
- [ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md): why Heynstones buy only Cosmetics and Conveniences.

## Status of names

A name marked **(draft)** is a proposal. You can change it without a new design review. Before release, do a trademark check on the game name, all draft names and all invented proper names (for example Heynstones, and named characters on cards and in Stages). Usual words, for example Bazaar or Militia Recruit, do not need the check.

Documents 01 to 04, 06 and 07 are a baseline. A change to a rule needs a design review or an ADR. Documents 05, 09 and 10 change with the content.

## Decision record

These decisions come from a design review on 2026-10-03:

| Topic | Decision |
| --- | --- |
| Product type | Spiritual successor. All names, lore, units and art are new. |
| Online scope | v1 is single player with a local save. v2 adds asynchronous online play. |
| Business model | Free-to-play with cosmetics only. v1 has no real-money payments. The Bazaar uses only earned Heynstones. |
| Visual style | 2.5D: card art on planes in a 3D scene. |
| Team | One developer. AI tools make the art. |
| Schedule | Playable alpha in about 3 months. v1.0 in about 6 months. |
| Platform | Desktop browser first. The layout also works on mobile in landscape. |
| App structure | The game is in `apps/web` with React Three Fiber. The rules are in `packages/rules`. |
| World and tone | Heynbord is the name of the world. Bright high fantasy with some humor. |
| Resource system | Countdown hand, as in the original. |
| Board | Lanes, 12 squares long. Stages use 3 lanes. Dungeons, Heynspire and multiplayer use 4. |
| Battle control | Automatic and deterministic, with speed control and auto-play. |
| v1 card set | 4 classes, 4 races, 5 ranks, about 100 cards. |
| Progression | Combine (no failure), Extract, Craft and hero gear. No Energy and no VIP. |
| Languages | `en-us` and `id-id` from v1. |
