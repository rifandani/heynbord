---
version: 1
slug: "rc-features-battle-components-top-bar-tsx-d7743035"
primary_target: "apps/web/src/features/battle/components/top-bar.tsx"
related_targets: []
---

# Battle turn indicator

Mode: Operate. Scope: the turn indicator in the Battle Top Bar.

The Player must see whose Turn is active at once. Keep the existing Battle layout, localized labels, and the gold/player and red/enemy meanings.

## Direction contract

THESIS: Make ownership the main information. A full-color Side plate replaces the small chip inside a neutral counter.

OWN-WORLD: Use the Guild Gold face of End Turn with dark ink for the Player, Banner Red with cream for the enemy, and Cinzel for the owner. Put the Turn number on a round bronze-rimmed counter with the existing radial dark badge face. Use existing tokens only.

STORY: Read the owner first, follow the chevron toward that Side, then read the Turn count.

FIRST VIEWPORT: A 240px-wide, 44px-high plate in the existing Top Bar position. The owner and chevron occupy most of it. A round 48px bronze counter sits at the opposite end, with a large number and a small localized Turn caption below it. It stands 2px above and below the plate like a separate game piece. The plate reverses for the enemy. Keep all controls in place.

FORM: Local component refinement in the established Painted Tabletop world. No concept seed is needed for this narrow target. The state change updates its color, label, and direction together.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Implemented plate

The owner reads first on a plate at least 240px wide and 44px high. The Player uses the shared `goldFace` recipe from End Turn: a `gold-light` to `gold` gradient, `ink-on-gold` text and a `gold-deep` border. The enemy face is `blood-banner` with `cream` text and an `enemy-red` border. The owner uses Cinzel 900 (16px). A chevron points toward the active Side.

The Turn counter is a circle (48px) with a `bronze-rim` border (3px) and the existing radial dark badge face, from `plate-ember` to `night-plate`. It stands 2px above and below the plate. The numeral uses Inter 900 (24px), `gold-light` and tabular figures. The localized caption below it uses Inter 700 (10px), uppercase, in `cream-dim`. The visible numeral and caption are hidden from screen readers; one screen-reader-only label gives the full localized "Turn N". The layout reverses for the enemy. Both pieces use the existing Badge Drop. This change adds no tokens, raster assets or motion.

## Initial finish review (historical)

Verdict: **SHIP**. The finish reviewer checked all eight images in `.impeccable/review/`: `turn-desktop-player.png`, `turn-desktop-enemy.png`, `turn-mobile-player.png`, `turn-mobile-enemy.png`, and the four matching `-detail.png` images.

Text contrast is 12.11:1 for the Player owner, 8.24:1 for the enemy owner, and 16.87:1 for the counter. The desktop and mobile checks in `.impeccable/review/turn-check.json` show a 224 × 44px plate in both states, no content overflow, and no errors. Type checking, the targeted Ultracite check, and the token guard passed. The design detector returned `[]`.

At that stage, `DESIGN.md` recorded the Turn plate and the Night Plate counter inset. The existing tokens covered that change, so `.impeccable/design.json` stayed as it was.

## Gold finish update (historical)

The Player requested the same gold background as End Turn. The plate then changed to that button's shared `goldFace` recipe. The initial review images and Player contrast value above describe the previous flat Ready Gold face. At this stage, the size, type, direction and enemy face did not change.

## Round counter finish review

The Player rejected the dark "Turn 1" inset as boring. The round counter above replaces that inset within the existing Painted Tabletop world.

Verdict: **SHIP**, with no blockers. The fresh finish reviewer checked all 12 images in `.impeccable/review/`: `turn-counter-desktop-player.png`, `turn-counter-desktop-enemy.png`, `turn-counter-mobile-player.png`, `turn-counter-mobile-enemy.png`, `turn-counter-mobile-id-player.png`, `turn-counter-mobile-id-enemy.png`, and the six matching `-detail.png` images.

The minimum numeral contrast is 8.92:1; the minimum caption contrast is 8.26:1. The checks in `.impeccable/review/turn-counter-check.json` show a 240 × 44px plate in both states on desktop, mobile and Indonesian mobile, with no overflow or errors. A real End Turn action confirmed the change to the enemy state. The two-digit Turn limit (60) fits the counter. Type checking, the targeted Ultracite check, and the token guard passed. The design detector returned `[]`.

`DESIGN.md` now records the round counter. The existing tokens cover this change, so `.impeccable/design.json` stays as it is.
