# Final evidence: Heynbord Battle slice (M0 + M1)

Date: 2026-10-04. Branch: `feat/battle-slice` (not committed). Design artifacts: [design-brief.md](design-brief.md). Progress: [game-progress.md](game-progress.md).

## Result

The game is playable from `/battle`: choose a Stage and a Starter Deck, then play full Battles against the AI with the mouse, touch, or the keyboard only. A Battle ends with Victory (1 to 3 Stars) or Defeat, and "Play Again" restarts at once.

## Verification (final code)

| Check | Command | Result |
| --- | --- | --- |
| Lint and format | `bun run lint` | pass |
| Types (rules) | `cd packages/rules && bunx tsc --noEmit -p .` | pass |
| Types (web) | `cd apps/web && bunx tsc --noEmit` | pass except 1 existing error in `src/core/components/ui/note.tsx` (not in this change) |
| Unit tests and coverage gate | `bunx vitest run --coverage` | 51 files, 337 tests pass; per-file 90% floor passes |
| Dead code, duplicates, health | `bun run check:dead-code`, `check:dupes`, `check:health` | all pass (health: 0 complexity findings) |
| E2E on a production build | `cd apps/web && CI=1 bunx playwright test --retries=0` | 14 of 14 pass (6 new Battle tests + 8 existing) |
| Canvas captures | inspector + manifest [evidence.json](evidence.json) | 8 of 8 PASS, hardware GPU, render budget OK |
| Evidence check | `check_evidence.py --manifest artifacts/evidence.json` | passed, 12 artifacts |
| Balance simulation | `bun run rules:sim` | see design brief (GDD 13 targets) |

## Bot playtest (real input)

From `e2e/battle.spec.ts`, report [bot-playtest.json](bot-playtest.json):

- Full Battle with mouse clicks on cards and on the 3D target markers (Stage 1-1, seed 7): 22 Turns, 17 cards played, first play on Turn 3, **Victory** (player 43 HP, enemy 0 HP), 0 console errors. Then "Play Again" starts a new Battle at Turn 1.
- Drag and drop a card onto a Square: the Unit appears.
- Keyboard only (arrows, Enter, E, S): Units are summoned and Turns advance to Turn 6.
- Phone landscape 844×390 with touch taps: the Unit appears.
- Phone portrait: the "turn your phone" message shows (UI-03).
- Language switch to Indonesian on the Stage select.

## Renderer and performance

| Viewport | Draw calls | Triangles | Geometries | Textures | Frame |
| --- | --- | --- | --- | --- | --- |
| Desktop 1280×720, active play | under 60 | about 8,000 | 26 | 20 | 60 fps (hardware Metal GPU) |
| Phone landscape 844×390, Resolution Phase | 52 | 8,022 | 26 | 20 | 50 to 60 fps (desktop GPU, phone viewport) |
| Headless bot, software renderer, full Battle | max 60 | — | — | — | median 24 fps (SwiftShader; not a performance number) |

Budgets (technical design 6): draw calls < 150 — pass. Device pixel ratio max 2 with `PerformanceMonitor` drop to 1 — done. One `<Canvas>` only on the Battle screen; Three.js loads in its own chunk.

| Bundle (gzip) | Size | Budget |
| --- | --- | --- |
| Battle scene chunk (`battle-canvas`, Three.js + R3F + drei + scene) | 249 KB | < 400 KB — pass |
| Battle route chunk (rules engine, HUD) | 25 KB | — |
| Main shared chunk | 227 KB | — |
| Home page JS on the wire (brotli, measured) | 284 KB | < 250 KB — **over, existing**: the template's main chunk (224 KB) and the language/theme menus (49 KB). This change adds about 5 KB (game text in 2 catalogs). |

Battle start after "Start Battle": 1.4 s on the local preview (NFR-03 target < 5 s). No image, model or audio files load: all art is procedural, all sounds are Web Audio.

## Captures

- Desktop: [active play](pass-1/desktop-active-play.png), [targeting](pass-1/desktop-targeting.png), [Resolution Phase](pass-1/desktop-resolution.png), [Victory](pass-1/desktop-victory.png), [Defeat](pass-1/desktop-defeat.png). The Victory and Defeat captures caught the dialog in its 300 ms fade-in; the dialog now has no animation with reduced motion.
- Phone landscape: [active play](pass-1/landscape/mobile-landscape-active-play.png), [targeting](pass-1/landscape/mobile-landscape-targeting.png), [Resolution Phase](pass-1/landscape/mobile-landscape-resolution.png), motion clip [resolution-motion.webm](pass-1/landscape/resolution-motion.webm), metrics [report.json](pass-1/landscape/report.json).
- Phone portrait (inspector "mobile" = iPhone 13 portrait): all 3 captures show the UI-03 "turn your phone" screen, which is correct. The inspector has no landscape mode, so the landscape captures above use a separate Playwright script.

## Visual scorecard (genre mapping: Hero = the Unit and Hero standees, Enemies = enemy Units, Interactables = cards and target markers)

No baseline (new game). Premium was not requested; M1 calls for placeholder art.

| Category | Score | Evidence |
| --- | --- | --- |
| Art direction | 2 | Warm painted-diorama palette, Race colors, wood and parchment UI, one icon set for scene and HUD. |
| Hero / Units | 1.5 | Procedural standees with role icon, Race gradient and Rank pips; readable, but not painted art. |
| Enemies | 2 | Owner by base color and facing; roles by icon; always-visible Attack and HP. |
| Interactables | 2 | Ready glow, large Countdowns, glowing legal targets, drag ghost, card details on hover, long press and focus. |
| World | 1.5 | Table-land Board, forest line, hills, foreground rocks and bushes; sparse midground. |
| Materials | 1 | Flat-shaded standard materials with color variation; no decals or wear. |
| Lighting | 1.5 | Hemisphere, warm key from the upper left, cool fill, blob shadows; no real shadows (performance choice). |
| VFX / motion | 2 | Hops, lunges, projectiles, hit shake and tint, Crit shake, damage numbers by Damage Type, summon rings, death fall. |
| UI / HUD | 2 | Genre HUD: Hero panels, enemy Hand Countdowns, Turn badge, speed, Skip, sound, result dialog with Stars; phone layout checked. |
| Performance evidence | 2.5 | Renderer counts, bundle sizes, budgets, real-input bot, production-build E2E. |

Average 1.8. Not premium. The next pass that raises it: the M0 style bible and AI card art (Hero, World, Materials), then lighting and shadow work in the graphics skill.

## Review findings

An independent review of the rules engine against GDD 4 and 9 found no high-severity defect. Fixed: (1) the hidden Hand leaked through `instanceId` (IDs now come after the shuffle), (2) the AI view now hides `seed`, (3) `CardDrawn` events keep the drawn Countdown. Deliberate readings of GDD ambiguities to confirm: Burn ignores Armor; Retaliation uses the defender's Damage Type and can be Blocked; Freeze ends when the Unit skips its action; the 2×1 area goes from the target Square toward the target owner's Hero; Flying moves to the farthest empty Square in reach; bonus Armor counts down in the owner's End Step; Sudden Death never Crits; the Turn limit check assumes the player goes first (PvE). Open: the AI score does not yet estimate damage to its own Hero (GDD 9 lists it).

## Known limits

- Hover details for Units on the Board are not done (Hand cards have them).
- No Auto-play UI (M4). `autoPlayTurn` exists and the QA hooks use it.
- The result dialog is a `section role="dialog"` with focus on "Play Again" but no focus trap.
- The keyboard hint text is 10 px.
- In the dev server (not the production build), Vite can reload the page once when it discovers dependencies; the E2E suite runs against the production build, as CI does.
- QA hooks (`window.__THREE_GAME_TEST_HOOKS__`, `?seed=`, `?state=`) are on in development, in E2E builds, and with `?qa` in the URL.
