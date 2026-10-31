# UI contrast audit — 2026-10-25

> **2026-10-26:** The application has one theme now: the Heynbord material palette. The light and dark rows below describe the scope at the audit date. The current alias pairs are in `DESIGN.md`, "Semantic Aliases", with their ratios.

Requirement: [issue 133, NFR-06](https://github.com/rifandani/heynbord/issues/133). Criteria: [WCAG 2.2, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast).

## Result

**NFR-06 contrast result: Pass for the documented product scope.** The eight display combinations pass the browser checks. The graphical and artwork bounds below meet the required ratios, including disabled cues.

Normal text must have a ratio of at least 4.5:1. Large text must have at least 3:1: 24 CSS px, or 18.67 CSS px with a weight of at least 700. Meaningful icons, control boundaries, selected-state cues and focus indicators must have at least 3:1 against adjacent colors. The project applies these same limits to visible disabled-control text and cues. WCAG itself exempts inactive controls.

## Tools and method

- Playwright 1.63.0 with its Chromium browser, through the existing web E2E suite.
- Browser-computed colors, sizes, font weights, opacity and color filters.
- `sharp` to read sRGB background pixels from browser screenshots.
- The WCAG relative-luminance formula, with unrounded ratios for assertions.
- Manual source and screenshot review for SVG text, WebGL textures, painted icons, halos and Board graphics. Bounds for translucent plates use a white background as the worst case for light text.
- The dev-only Component Catalog to identify the shared button, plate, dialog, text, resource and Rank components. Product checks use `/` and `/play`.

The browser helper temporarily hides text fill and text shadows without changing layout. It samples up to nine background points for each visible text run. It checks overflow clips and hit targets. It rejects stale positions when a timed notice leaves or a layout changes during capture. It also checks opaque control cues from their computed foreground and background colors.

Card Details ignore pointer input and cover other content. Their checks select the details surface explicitly. The underlying screen has its own preceding check. SVG and WebGL lettering are in the manual checks below.

The checks use reduced motion and stop CSS animations and transitions at steady states. The pulse extrema of Board targets are checked separately. A regression fixture verifies that the helper detects low-contrast text and faded disabled text, and gives 21:1 for black on white.

## Display combinations

Desktop: 1440 × 900 CSS px. Mobile game: 844 × 390 CSS px, with touch and mobile browser emulation. Mobile Home and the game's rotation message also use 390 × 844 CSS px. Each check asserts the applied class on `<html>` and sets the locale cookie before navigation. The game keeps its wood and parchment palette in both color modes; Home and its menus follow the selected mode.

| Locale | Applied mode | Display | Checkpoints | Text runs | Lowest normal | Lowest large | Result |
| --- | --- | --- | --: | --: | --: | --: | --- |
| en-us | dark | desktop | 40 | 1362 | 4.73:1 | 4.95:1 | Pass |
| en-us | dark | mobile | 42 | 941 | 4.66:1 | 4.95:1 | Pass |
| en-us | light | desktop | 40 | 1365 | 4.73:1 | 4.95:1 | Pass |
| en-us | light | mobile | 42 | 940 | 4.66:1 | 4.95:1 | Pass |
| id-id | dark | desktop | 40 | 1376 | 4.73:1 | 4.95:1 | Pass |
| id-id | dark | mobile | 42 | 962 | 4.66:1 | 4.95:1 | Pass |
| id-id | light | desktop | 40 | 1377 | 4.73:1 | 4.95:1 | Pass |
| id-id | light | mobile | 42 | 966 | 4.66:1 | 4.95:1 | Pass |

The final run checked 328 surface/display checkpoints and 9,289 visible text runs. It found zero measured failures. The [dated JSON summary](./wcag-contrast-audit-2026-10-25.json) records each checkpoint.

## Product coverage

Each display combination checks these product surfaces and states:

| Surface | Checked states |
| --- | --- |
| Home | Normal, Play hover, theme menu, language menu; mobile portrait |
| Town | New-player locks, balances, shortcut labels and badges, Settings; mobile rotation message |
| Settings | Selected and unselected language options, sound on/off, volume values, keyboard focus, option boundary contrast |
| Campaign | Region map, Stage Panel, rewards, Deck choices, disabled Fight and Sweep cues |
| Packs | Unaffordable Pack buttons, Drop Rates dialog, free Unopened Pack, Reveal, NEW labels, Card Details |
| Workshop | Combine, Craft, Fuse and Extract; empty counts, missing copies, unavailable actions, Rank labels |
| Hero | Gear upgrade actions with missing resources, zero Forge Stone counts, HP and stat values |
| Dungeons | Mine selection, Boss Dossiers, Boss number pins, rewards and preparation controls |
| Heynspire | Current Floor, locked Floor preview, rewards and preparation controls |
| Achievements | Progress, completed rewards and disabled actions |
| Bazaar | Standard look, available previews, unaffordable purchases and family headings |
| Seaport | Cargo and duration selection, Manifest, Dispatch and berth text |
| Deck dialog | Cards, empty Deck ribbon, Class selection, selected Class boundary, disabled slot purchase |
| Handbook | Index, entry text and shared term-link styles |
| Battle | HUD, Hand, Countdown and HP cues, button hover and press, Unit details and focus, legal targets |
| Battle Log | Turn and Side labels, transport controls, disabled stepping controls, entry text and Board marks |
| Results and Replay | Victory, Defeat, rewards, share notification, Watching a Replay and transport controls |
| Dungeon Battle | Three Boss plates, HP, Lanes and Boss Rule labels |

Shared dialog, tooltip and notification recipes are part of the review. The catalog is a reference surface and is outside the product pass result.

## Failures and fixes

Before ratios below are from the initial browser checks or the original color pair. A background-dependent result means that the old styling had no stable minimum over the supported artwork.

| Failure | Before | Fix and recheck |
| --- | --- | --- |
| Shared disabled buttons and unavailable items | Buttons used 45% opacity; Bazaar prices and Buy labels were below 4.5:1 | Keep full opacity. Use grayscale, a dashed border and disabled semantics. Remove opacity from unavailable parent surfaces. |
| Home Play hover | About 4.27:1 | Darken the blue hover face instead of mixing it toward white. |
| Rust term links on paper | 4.23:1 on parchment; 3.62:1 on deeper paper | Use `keyword-rust` `#984012`: 4.90:1 on deeper paper. |
| Cream-only focus on parchment | About 1.05:1 | Add an opaque dark outer edge. Cream against the dark edge is 16.02:1. |
| Selected options and radio boundaries | Gold and pale paper borders below 3:1 | Use Gold Deep for selected option boundaries and Faded Ink for unselected boundaries. Check actual radio marks and the selected Hero Class. |
| Town Building names | Sampled ratios as low as about 1.2:1 over the painting | Keep a dark plate behind the names at rest, on hover and with focus. |
| Bazaar family heading in Indonesian | 3.73:1 where the longer name crossed bright artwork | Give each family heading a dark plate. |
| Bazaar unavailable rows | Buy labels around 2.6:1 in sampled rows | Keep the row, price and disabled button at full opacity. |
| Workshop Rank names and missing-copy counts | Rare and Epic names around 4.2:1; several counts were faded | Use cream text in recipe panels, chooser menus and Pack reveals. Keep the colored Rank Gems and their pip counts. |
| Muted volume values | About 4.11:1 | Keep the numeric output and meaningful slider fill at full opacity. |
| Dungeon Boss number pins | About 2.6–2.7:1 on the bright red gradient | Put cream numbers on Enemy Deep: 11.16:1. |
| Enemy Side chip | 4.29:1 | Use white on Blood Banner: 8.88:1. |
| Enemy Class glyphs | The bright end of the red gradient did not give a stable 3:1 | Use the opaque dark Side color behind the cream glyph. |
| XP on deeper paper | About 4.15:1 | Use `xp-ink` `#09596c`, including the Seaport and Handbook XP text. |
| Claimed, unavailable and inactive card previews | Whole-card opacity weakened stats and glyphs | Keep full opacity. Use saturation changes and the existing state labels. |
| Notifications over artwork | Translucent semantic backgrounds depended on the scene | Composite the semantic tint onto an opaque theme overlay. Recheck the share notice in both modes. |
| Board target, focus, Log and fallen marks | Single-color or faded marks depended on the Board artwork | Add opaque dark or light edges. Raise the legal-target pulse floor. See the numerical bounds below. |

## Manual artwork and graphical checks

These checks use rendered captures and the paint/texture recipes. They apply to the five Region paintings, the Dungeon and Heynspire paintings, the loading ground, Standard ground, and all six supported Board skins: Meadow Dawn, Mesa Dusk, Harbor Night, Hollow Moon, Spire Noon and Deep Crystal. The bounds do not depend on which image pixel is behind the overlay. Browser captures use Standard ground; the color bounds cover the other ground variants.

| Object | Measurement and result |
| --- | --- |
| HUD and tooltip text over artwork | At 70% Night Plate over white, cream is 6.23:1 and dim cream is 4.82:1. At 85%, they are 10.85:1 and 8.39:1. More opaque plates also pass. |
| Unit stat and Status-count lettering | The dark text outline is the immediate background. Even its lightest result at 92% opacity over white is approximately `#23201f`. Reduced-stat red is at least 6.35:1; green is at least 9.28:1. White and cream also pass. |
| Card Countdown and HP | SVG text has an explicit light or dark stroke. The Countdown ink/light edge pair is 13.98:1; cream against the HP text's dark stroke is 15.89:1. Card previews keep these parts at full opacity. |
| Rank Gems | Pip count supplies the Rank cue. The lowest colored fill/opaque dark edge pair, Rare blue, is 4.31:1. |
| Status and Damage Type glyphs | Icons have dark plates or outlines as well as their shapes. The Bleed anchor against Night Plate is 3.98:1. Status counts use the separate outlined text above. |
| Legal targets | The mark is a gold rim (0.05 units) with a Night Plate hairline 0.02 units on each side, over a 22% gold fill. The rim and its hairline are the adjacent pair at 12.66:1, so the rim stays clear while the Board skin shows through. Focus uses a full-strength `focus-cream` rim. A Unit focus ring replaces the hidden target when appropriate. |
| Unit focus | A light halo and opaque dark edge surround the Side-colored ring. The light/dark pair is 16.02:1. |
| Battle Log and fallen marks | Parchment or cream marks have opaque ink edges. The fallen ring and cross keep both colors, including on dark skins. |
| Painted controls and resource icons | Review checks their shape, dark rim and adjacent label or value. Lock seals, counts and selected markers remain independent of the decorative painting. |

The automated suite does not derive ratios from antialiased SVG letter edges, WebGL texture pixels, painted icon interiors, particle effects, or a moving animation frame. Changes to those assets, text strokes, geometry widths, tone mapping, or material opacity require the same manual review. The current review uses emulated mobile Chromium. Physical-device display output and other browser engines are outside this run.

## Reproduce

From the repository root, with an unused test port:

```sh
rtk proxy env PW_PORT=4133 bun web test contrast.spec.ts --workers=2 --reporter=line
rtk proxy bun web typecheck
rtk proxy bun web:test:unit apps/web/src/features/battle/scene/markers.unit.test.ts apps/web/src/features/toast/toast.atoms.unit.test.ts
```

Each browser case saves its screenshots and `contrast-measurements.json` under `apps/web/playwright-test-results/`. The JSON gives the surface, text, source, computed color, opacity, required ratio and measured ratio. These generated files are ignored by Git. The dated result summary is stored beside this report.

## Verification

| Check | Result |
| --- | --- |
| Contrast browser suite | 9 passed: eight display cases and the measurement regression fixture |
| Measured product checkpoints | 328 passed; 9,289 text runs; zero measured failures |
| Web TypeScript check | Passed |
| Marker and toast unit tests | 11 passed in 2 files |
| Lint for the contrast-change files | Passed with warnings denied |
| Repository formatting check | Passed |
| Existing Board-name and color-mode browser tests | 3 passed |
| Existing two-Side Unit-detail smoke | Fails in QA setup on the first run and retry; see below |
| Full repository lint | Fails in separate music and game-flow work; see the note below |

The full lint command reports errors in `battle-audio.ts`, `music-catalog.ts`, `music-player.ts` and `components/play-screen.tsx`. They concern promise style, a type assertion, shadowed names, event registration and function complexity. Those files contain separate work in the shared checkout and are outside this contrast change.

The existing Unit-detail smoke fails at its setup requirement that QA seed 7 must expose Units of both Sides. It receives one Side before it tests a hover. An isolated invocation with one retry gives the same result. The contrast suite checks Unit details for a visible Unit in every display case. The contrast changes do not change Battle rules, QA seeds or Unit ownership.
