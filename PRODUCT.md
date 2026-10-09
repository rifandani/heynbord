# Product

<!-- impeccable:product-schema 1 -->

This file gives the durable product facts for design work. The source of truth is [`docs/game/`](docs/game/README.md). When this file and those documents disagree, the documents win. Update this file.

## Platform

web

## Users

- **Primary: the returning fan.** Age 25 to 40. Played Flash and Facebook card games (_Kings and Legends_, _Rise of Mythos_) in the early 2010s. Has little free time and plays in sessions of 10 to 30 minutes. Dislikes pay-to-win games. Wants deep Deck building without the speed of real-time games.
- **Secondary: the strategy card player.** Plays _Hearthstone_, _Marvel Snap_, _Teamfight Tactics_ or _Legends of Runeterra_. Wants a new mechanic and likes to theory-craft Decks. Plays on a desktop browser at work breaks, or on a phone at home.

Details: [02 — Game Vision](docs/game/02-game-vision.md#target-players), [04 — PRD](docs/game/04-prd.md#5-users).

## Product Purpose

Heynbord is a fantasy collectible card game for the web browser. The Player collects cards, builds a Deck, plays Ready cards into Lanes, and then watches the Units move and fight automatically. It is a spiritual successor to _Kings and Legends_ (2013) and _Rise of Mythos_ (2013–2019). Those games shut down, and Flash stopped in 2020. The 2023 revival is pay-to-win. No modern, fair browser game gives this experience.

v1 is single player (PvE) with a local save: a Campaign of 3 Regions (30 Stages, 3 Boss Stages), the Heynspire tower (50 Floors), and 118 Cards.

Success for v1.0:

- A Player can finish the Campaign in 8 to 15 hours, and playtesters want to continue in Heynspire.
- 8 of 10 playtesters can explain why they won or lost a Battle.
- No playtester names "pay-to-win" or "too much grind" as their main problem.
- 60 fps on a normal laptop. 30 fps or more on a mid-range phone in landscape.

## Positioning

_A collectible card game crossed with lane tower defense, where timing replaces mana._

- **Countdown hand in place of mana.** Each card becomes Ready after a number of Turns. Timing is the main skill.
- **Plan, then watch.** The Player makes all decisions before the Units act. Then the Battle resolves by clear, deterministic rules.
- **Fair by design.** No real money buys power. Combine never fails. There is no Energy. The game shows all Drop Rates.
- **No install.** The game opens from a link on desktop or phone.

## Operating Context

- Desktop browser first, with mouse and keyboard. The game also works on a phone in landscape with touch. On a phone in portrait, the game asks the Player to turn the phone.
- Session loop: 3 to 6 Battles in 10 to 30 minutes, then Workshop and Deck changes. A Battle takes 3 to 6 minutes at speed ×1.
- Screens: Title, Town (hub), Campaign map, Heynspire, Battle, Deck builder, Collection, Workshop, Hero, Packs, Achievements, Settings. See [GDD 11.1](docs/game/03-game-design.md#111-screens).
- The full game is one route, `/play`. The Town, the Campaign and the Battle are states of that route, not separate URLs. Each screen has its own in-game control to go back. See [web ADR-0006](apps/web/docs/adr/0006-the-game-is-one-route.md).
- The Battle is a 3D scene (React Three Fiber) on a 2D Battle Painting for each Region. The Squares are not drawn. See [web ADR-0007](apps/web/docs/adr/0007-the-battlefield-is-a-2d-painting.md) and [13 — Battlefield Concepts](docs/game/13-battlefield-concepts.md). The Hand, HUD and all menus are 2D React UI on React Aria components, so text stays sharp.
- The Town is a layered 2D painting, not a 3D scene: a painted plate with one cut-out image for each selectable Building. Each Building is a React Aria button. See [web ADR-0005](apps/web/docs/adr/0005-the-town-is-a-layered-2d-painting.md) and [11 — Town Concepts](docs/game/11-town-concepts.md).

## Capabilities and Constraints

- Terminology: use the glossary in [`packages/rules/CONTEXT.md`](packages/rules/CONTEXT.md) (for example **Rank**, not rarity; **Countdown**, not mana; **Stars** only for Stage results). The web glossary is [`apps/web/CONTEXT.md`](apps/web/CONTEXT.md).
- Languages: `en-us` and `id-id` from v1. All text comes from Message Catalogs. Fonts must support Indonesian characters.
- Save: local only (IndexedDB), with export and import. v1 sends no player data to a server.
- Performance: Title screen interactive in less than 3 seconds on 4G. Battle assets load only when needed. WebGL 2 is necessary, with a clear message when it is not available. PWA with offline play.
- Business model: free-to-play with Cosmetics only. v1 has no shop, payments or ads.
- Not in v1: online play, accounts, PvP, guilds, chat, trading, native apps, portrait phone layout.
- Team: one developer. AI tools make the art and music. Each asset needs a licence record.
- Undecided: final names for currency, Regions and Heynspire (marked **(draft)** in the docs); the audio sources; the domain and hosting.

Requirements with IDs and priorities: [04 — PRD](docs/game/04-prd.md#6-requirements).

## Brand Commitments

- **Name:** Heynbord. It is also the name of the world. A trademark check must occur before release.
- **Logo:** the gold H-shaped mark with a four-point star in [`apps/web/brand/`](apps/web/brand/) (`logo-transparent.jpg`, `logo-black.jpg`, `logo-white.jpg`). It is final. Keep it.
- **World and tone:** bright high fantasy with some humor, like a classic adventure story. Colorful and heroic. No gore. Not dark, realistic, noisy or neon.
- **Art direction:** [05 — Art and Audio Direction](docs/game/05-art-direction.md) is binding for all visual and audio work.
- **Voice:**
  - Labels, rules text, card Keyword text, settings and errors use plain, simple English, similar to ASD-STE100.
  - Card flavor text, story scenes and characters can be warm and a little funny.
  - Never use pressure language about money or time.
- **Originality:** all names, lore, art, numbers and card text are new. Never copy from the original games.

## Evidence on Hand

- Logo files in `apps/web/brand/` and PWA icons in `apps/web/public/`.
- Complete design documents in `docs/game/` (pillars, vision, GDD, PRD, art direction, technical design, economy, roadmap).
- Card art: 22 final card illustrations in `apps/web/public/creature/{race}/` (Creature Cards) and `apps/web/public/skills/{class}/` (Skill Cards), made with GPT Image (one 3:4 portrait for each card, with its background). Ten of them are the golden references ([art direction 5.1](docs/game/05-art-direction.md)).
- Town art: the first master painting (`apps/web/public/town/town.webp`, 1672 × 941) and the Town Gate layer cut out of it (`town-gate.webp`). A 3200 × 1800 export is still to make. The 11 Town Bar icons (10 shortcuts and Settings): the 1254 × 1254 JPG sources on black in `apps/web/art/town/bar/`, and the 128 × 128 WebP cut-outs that the game uses in `apps/web/public/town/bar/`. The brief is [11 — Town Concepts](docs/game/11-town-concepts.md).
- Pack art: the Peddler, Merchant and Royal Packs, made with GPT Image. The 1024 × 1536 WebP sources are in `apps/web/art/packs/`, and the 512 × 768 WebP files that the game uses are in `apps/web/public/packs/`. The brief is [11 — Town Concepts, 8](docs/game/11-town-concepts.md#8-pack-art). The Merchant Pack is the `packs` Town Bar icon, upright.
- Sound: the Battle sounds are made with Web Audio in code (`apps/web/src/features/battle/battle-audio.ts`). No audio files and no music exist yet.
- Campaign art: the Hearthvale Region Map (`apps/web/public/battle/hearthvale-region.webp`, 1672 × 941). The Campaign screen measures its clearings and road in `apps/web/src/features/campaign/region-map.ts`. The brief is [12 — Region Concepts](docs/game/12-region-concepts.md).
- No Battle Painting exists yet. Until the Hearthvale painting exists, the Battle shows a meadow gradient. The brief is [13 — Battlefield Concepts](docs/game/13-battlefield-concepts.md).
- No playtests, players, reviews, testimonials or press exist yet. Do not invent them.

## Product Principles

The pillars have an order. When two pillars disagree, the lower number wins. Full text: [01 — Design Pillars](docs/game/01-design-pillars.md).

1. **Fair to the player.** The Player never pays for power and never loses progress because of luck.
2. **Plan, then watch.** The Player decides first. Then the Battle resolves by clear, fixed rules that the Player can read.
3. **Timing is the skill.** Countdowns make "when" the main decision.
4. **Every card has a future.** No card is useless. Duplicates and weak cards always have a use.
5. **Light and readable on the web.** Fast to load, smooth on normal hardware, easy to read on a small screen. Effects never hide the Board or the stats.

## Accessibility & Inclusion

- UI text contrast meets WCAG 2.2 AA.
- The Player can play a full Battle with the keyboard only, and with touch only.
- Never use color alone: Rank uses color and pips. Damage Type uses color and an icon.
- Settings: text size, reduced motion (no camera movement or shake), high-contrast Board, Battle speed, separate audio volumes, language.
- The Battle shows the Attack and HP of each Unit at all times. Hover or long press shows the full card details.
