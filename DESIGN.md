---
name: Heynbord
description: A painted fantasy card game on a small 3D tabletop, with a UI of wood, bronze, gold and parchment.
colors:
  gold: "#e2a93b"
  gold-light: "#ffe08a"
  gold-deep: "#7a5310"
  ready-gold: "#ffd75a"
  focus-cream: "#fff2a8"
  gold-trim: "#e9c46a"
  bronze-rim: "#e7bb6a"
  bronze: "#b47f36"
  pewter: "#8d9297"
  stone: "#757a80"
  wood-light: "#7a5233"
  wood: "#563720"
  wood-edge: "#2a1a0c"
  frame-wood: "#5b3a1e"
  tray-light: "#6b4423"
  tray: "#4a2d16"
  grain: "rgba(0,0,0,0.06)"
  parchment: "#f6ead0"
  parchment-deep: "#ead9b4"
  parchment-lit: "#fff3d1"
  parchment-rule: "#c9b48c"
  ink: "#2a1d12"
  ink-soft: "#5b4632"
  ink-faded: "#6b5238"
  ink-on-gold: "#2a1a05"
  night-plate: "#1c140e"
  plate-ember: "#4a3524"
  plate-socket: "#3a2a1c"
  cream: "#fff6df"
  cream-dim: "#e8d9bb"
  enemy-red: "#d9463b"
  enemy-deep: "#6b1610"
  blood-banner: "#8e1f1f"
  keyword-rust: "#b4521a"
  victory-amber: "#8a5a12"
  tutorial-teal: "#0e6f86"
  tutorial-glow: "#7fe3ff"
  hp-full: "#4ade80"
  hp-low: "#ef4444"
  heart-red: "#ff6b6b"
  town-sky: "#8fd0f5"
  battle-meadow: "#44772c"
  region-sky: "#9fcbe8"
  human-blue: "#2f5bd3"
  elf-green: "#4c9a3b"
  undead-teal: "#5fb3a8"
  orc-orange: "#d9661f"
  rank-common: "#a3a8ae"
  rank-uncommon: "#34c27a"
  rank-rare: "#3d7df0"
  rank-epic: "#a45ee5"
  rank-legendary: "#f59331"
  damage-physical: "#ffffff"
  damage-fire: "#ff6a33"
  damage-frost: "#8fd8ff"
  damage-holy: "#ffd75a"
typography:
  display:
    fontFamily: "Cinzel, ui-serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Cinzel, ui-serif, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.025em"
  title:
    fontFamily: "Cinzel, ui-serif, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "normal"
    fontFeature: '"cv02", "cv03", "cv04", "cv11"'
  body-small:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.375
    fontFeature: '"cv02", "cv03", "cv04", "cv11"'
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.025em"
  number:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.3em"
    fontWeight: 900
    lineHeight: 1
    fontFeature: '"tnum"'
rounded:
  sm: "4px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
  card: "0.85em"
  card-window: "0.55em"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  button-gold-large:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink-on-gold}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "48px"
  button-wood:
    backgroundColor: "{colors.wood}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  button-ghost:
    backgroundColor: "{colors.night-plate}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  button-icon:
    backgroundColor: "{colors.night-plate}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    size: "40px"
  parchment-dialog:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
    width: "min(420px, 94vw)"
  parchment-panel:
    backgroundColor: "{colors.parchment-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "12px"
  option-card:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px"
  option-card-selected:
    backgroundColor: "{colors.parchment-lit}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px"
  hud-plate:
    backgroundColor: "{colors.night-plate}"
    textColor: "{colors.cream}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
  hud-tooltip:
    backgroundColor: "{colors.night-plate}"
    textColor: "{colors.cream}"
    typography: "{typography.body-small}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
  details-panel:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px 12px 12px 20px"
    width: "min(300px, 53vw)"
  card-frame:
    backgroundColor: "{colors.bronze}"
    rounded: "{rounded.card}"
    padding: "0.36em"
    width: "9em"
    height: "12.6em"
  town-shortcut:
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    width: "96px"
    height: "66px"
  town-shortcut-current:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.sm}"
    height: "18px"
---

# Design System: Heynbord

## Overview

**Creative North Star: "The Painted Tabletop"**

Heynbord is a painted fantasy card game. The Battle is a painted battlefield (web ADR-0007), the Units are figures on it, and every 2D control is a real game piece at the edge of that painting: a wooden tray for the Hand, bronze frames for the cards, a leather Card Back, gold tokens for the actions, and parchment sheets for the rules. The world is bright, warm, clear, handmade and a little funny, like a classic adventure story. The UI never tries to be a web app around a game. It is part of the game box.

The material is a frame, not a surface for text. Wood, bronze and leather carry gradients, bevels and grain, but all text sits on a flat area with high contrast: cream on a dark plate, or dark ink on parchment. Pieces are chunky and tactile. They have thick borders, a hard drop under each button, and a small physical press. The density is that of a board game: a few large pieces, each easy to read on a phone in landscape.

The system is light and readable first (product pillar 5). The HUD sits at the edges of the screen and lets pointer events through to the Board. Effects and panels never hide the Board or the stats. Motion is short and physical, and reduced motion stops all of it.

The base component library theme in `apps/web/src/core/styles/globals.css` (a blue primary, zinc greys, light and dark modes) is not part of this system. It is the un-themed default that only the development Component Catalog at `/master-design` uses. The game world that this file describes is normative.

**Key Characteristics:**

- Real materials as frames: dark wood, warm bronze, gold, tooled leather, parchment.
- Text on flat, high-contrast areas only: cream on a night plate, or ink on parchment.
- Chunky pieces: 2px to 4px borders, a hard 3px drop with no blur, a 1px press.
- Gold means "act now" or "this is yours": the main action, a Ready card, Your Turn, the current screen.
- Game meaning is never shown by color alone: Rank uses gems and a count, Damage Type uses a color and an icon.
- One gold focus ring (`focus-cream`, 4px) on every interactive piece.
- A compact layout for short screens (`max-height: 500px`) on every component.

## Colors

The palette is warm workshop material (gold, bronze, wood, parchment, ink) on bright painted scenes, with fixed game colors for Races, Ranks and Damage Types.

### Primary

- **Guild Gold** (`gold`, with `gold-light` at the top of its gradient and `gold-deep` as its border): the one main action of a panel (End Turn, Start Battle, Retry, Got It), the selected state of a toggle such as speed ×2, and the name plate of the current Town Bar shortcut. Earned Stars use it too.
- **Ready Gold** (`ready-gold`): the "Your Turn" chip and banner, the Building labels in the Town, a Ready Countdown, and the Holy Damage Type.
- **Focus Cream** (`focus-cream`): the 4px focus ring, and the ring on a selected Hand Card. Nothing else uses it.
- **Gilded Trim** (`gold-trim`): thin borders on dark HUD plates and tooltips, at 70% opacity, and small lock icons.

### Secondary

- **Tavern Wood** (`wood-light` to `wood`, with `wood-edge` as its border): the default button. The Hand Bar runs from `tray-light` through `tray` to `wood-edge`, with a faint `grain`. The Town Bar uses the same wood family, with the same grain.
- **Frame Wood** (`frame-wood`): the thick 4px border of parchment dialogs and panels, and the plate behind a Deck class icon.
- **Warm Bronze** (`bronze`, with `bronze-rim` for badge rims): the shared card metal (a 5-stop gradient from `#f7dc9c` to `#8a5a20`), the rim of every round badge, the top edge of the Hand Bar, and the border of the Details Panel.
- **Cold Pewter and Stone** (`pewter` for the rim, a gradient from `#e6e8ea` to `#62676c`; `stone` for the face, a gradient from `#a9aeb3` to `#5d6166`): only the Locked Stage Marker. These cold greys are not warm material, so a Locked Stage reads as "not yet" next to the gold and wood shields.

### Tertiary

- **Banner Red** (`enemy-red`, with `enemy-deep` as its border): the enemy side. The enemy Hero border, the "Enemy Turn" chip and banner, and the enemy Hero ring.
- **Blood Banner** (`blood-banner`): the "Defeat" title and the Boss chip.
- **Keyword Rust** (`keyword-rust`): Keyword names in the Details Panel.
- **Victory Amber** (`victory-amber`): the "Victory" title on parchment.
- **Tutorial Teal** (`tutorial-teal` for the label text, `tutorial-glow` for the highlight ring): only the Tutorial. It is the one cool accent, so a Tutorial mark never looks like a game state.
- **Hero HP** (`hp-full`, `hp-low`): the Hero HP bar. It changes to `hp-low` at 30% HP or less, and the number always shows next to it.
- **Heart Red** (`heart-red`): the HP icon on a card.

### Game colors

These come from art direction 4. `apps/web/src/features/battle/palette.ts` holds them with their light and dark shades.

- **Race:** `human-blue` (second color gold), `elf-green` (second color warm brown), `undead-teal` (second color bone white), `orc-orange` (second color dark red). A Creature Card shows its Race color on the emblem.
- **Rank:** `rank-common` grey, `rank-uncommon` green, `rank-rare` blue, `rank-epic` purple, `rank-legendary` orange. A card shows its Rank color only on the Rank Gems and the art window trim.
- **Damage Type:** `damage-physical` white with a sword, `damage-fire` orange-red with a flame, `damage-frost` light blue with a snowflake, `damage-holy` gold with a sun.
- **Side:** the player is gold (`#f2c14e`), the enemy is red (`#d9463b`), on Hero panel borders and the Hero ring. A Unit shows its Side by facing only.

### Neutral

- **Parchment** (`parchment`): dialogs, the Details Panel, the Tutorial panel and option cards. `parchment-deep` is the larger panel under option cards, `parchment-lit` is a selected option, and `parchment-rule` is the border of an option that is not selected.
- **Ink** (`ink`): all text on parchment. `ink-soft` is secondary text (a Stage subtitle, a Deck description), `ink-faded` is reminder and flavor text, and `ink-on-gold` is the text on a gold button or chip.
- **Night Plate** (`night-plate`): the dark HUD surface, at 70% to 95% opacity: the Turn badge, the Hero panels, tooltips, ghost buttons, the portrait guard. `plate-ember` is the bright center of a round badge, and `plate-socket` is a key cap or an enemy Countdown.
- **Cream** (`cream`): all text on a dark plate or on wood. `cream-dim` is secondary text on a dark plate.
- **Sky and meadow** (`town-sky`, `battle-meadow`): the back color of the Town and the Battle while their paintings load. In the Battle, `battle-meadow` is the base of a gradient forest clearing, which also shows while a Region has no Battle Painting. `region-sky` is the back color of the Campaign while its Region Map loads.

### Named Rules

**The Gold Means Act Rule.** Gold marks the main action of a panel, a Ready card, Your Turn, and the current place. Each panel has one gold action. Wood is the default for all other buttons.

**The Flat Text Rule.** Text never sits on a gradient, a grain or the 3D scene. It sits on a flat Night Plate, on parchment, or on a solid button face, with WCAG 2.2 AA contrast.

**The Never Color Alone Rule.** A Rank always has its gems (1 for Common to 5 for Legendary). A Damage Type always has its icon. A side always has its position (player left, enemy right) as well as its color.

**The Base Theme Stays Out Rule.** The blue primary and zinc greys of the base component theme never appear on a game screen. A base component that goes into the game gets the Heynbord colors first.

## Typography

**Display Font:** Cinzel (with ui-serif, Georgia, serif) **Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif)

**Character:** Cinzel is carved, classical capital letters, like the lettering on a gate or a tavern sign. It gives the heroic voice. Inter does all the work: rules text, labels, numbers and controls, with clear shapes at small sizes. Both fonts support Indonesian.

### Hierarchy

- **Display** (Cinzel 900, 2.25rem, 1.1): the result title, "Victory" or "Defeat". 1.5rem on a short screen.
- **Headline** (Cinzel 900, 1.875rem, 1.2, 0.025em): screen titles such as the Campaign header, with a hard 3px drop shadow. The Turn banner uses Cinzel 900 at 1.5rem.
- **Title** (Cinzel 700, 1.125rem, 1.25): panel labels, the Tutorial step title, Stage and Deck names, the Start Battle label, the Key Guide title, and the Building labels in the Town (at least 14px, scaled with the painting).
- **Body** (Inter 400, 0.875rem, 1.375): the Details Panel, the Tutorial text, the dialog text. Keywords are Inter 700 in `keyword-rust`.
- **Body Small** (Inter 400, 0.75rem, 1.375): reminder text, Deck descriptions, the Key Guide list. Flavor text is the same size in italic.
- **Label** (Inter 700, 0.75rem, 0.025em, uppercase): small section labels such as "Tutorial". Town Bar shortcut names use Inter 700 at 11px (10px on a screen narrower than 1200px), not uppercase.
- **Number** (Inter 900, tabular figures): Countdowns, Attack, HP, pile counts and the Turn number. On a card it is 1.2em to 1.3em of the card font size, with a small dark text shadow.

### Named Rules

**The Large Display Rule.** Cinzel is for titles and names at 14px or larger. Never use it for rules text, Keywords, numbers or paragraphs.

**The Big Number Rule.** A number that the Player plans with (a Countdown, Attack, HP) is Inter 900 with tabular figures, on its own badge or plate. It is the largest text on its piece.

## Layout

The Battle screen is a full-screen 3D Board with the 2D HUD at its edges. The Top Bar holds the player Hero at the top left, the Turn badge and the Battle controls at the top center, and the enemy Hero at the top right. The Hand Bar sits at the bottom center. End Turn is a small gold button just above the Graveyard Pile, aligned with the pile's right edge. The HUD containers let pointer events through (`pointer-events: none`), and only the pieces themselves take input, so the Board stays free. Toasts move to a narrow column at the bottom left, above the Hand Bar. Every edge respects `env(safe-area-inset-*)` with a 0.5rem minimum.

The Town is a 16:9 painting that covers the screen and crops its edges. Buildings and their labels have positions in painting coordinates, changed to percentages, so they stay on the painting at all sizes. A Building whose screen the Player level has not unlocked has a **Lock Plate** in the place of its label: a small round HUD plate (`night-plate` at 90%, a 2px `gold-trim` border at 70%, the Piece Drop) with the lock seal of the Town Bar and "Level N" in Inter 700 `cream-dim`. It has no Building Glow and no zoom. Focus, hover and a tap show the "Opens at level N" tooltip. The Town Bar is fixed to the bottom of every screen except the Battle.

The Campaign is a 16:9 Region Map painting (web ADR-0008), with its own 1600 × 900 coordinates. The Stage clearings, the Trail and the Boss landmark have positions in these coordinates, measured on each painting. The `mapFrame` function places the painting. It covers the screen above the Town Bar, and it stretches or squashes the painting on the x axis by at most 10% (`MAX_STRETCH`), so that the painting fills the screen width and the screen cuts as little of it as it can. On a phone, the painting gets larger, with less stretch, so that no two Stage Markers touch. The Trail line stretches with the painting. All Stage Markers (each with a 6px margin) must stay on the screen, between the top edge (8px) and the Town Bar (80px, 56px on a short screen). If they do not fit, the painting gets smaller, with a stretch of at most 20% (`FIT_STRETCH`). The painting then moves down as far as the markers let it, so that the Player sees as much of the Boss landmark as possible. At least half of the landmark always stays in view. The markers must also stay clear of the top HUD pieces: the Region banner at the top left and the Star chest plate at the top right. The screen measures these pieces. If a marker goes under one of them, the painting moves down as far as the Town Bar lets it, then sideways. If no position is clear, the painting gets 3% smaller and the screen tries again. When the painting still does not cover the screen above the Town Bar (only on some phones), its open edges fade out over 6%. Behind them, a dark, blurred copy of the same painting fills the sides (it covers the screen at 110%, with a 40px blur, 72% brightness and 90% saturation). The map shows no Stage names. The Stage Panel opens at the center of the screen.

Cards scale by font size. All Card Frame parts are in `em`: the card is 9em × 12.6em, so a 10px font gives a 90 × 126 px Hand Card, 7px gives 63 × 88 px on a short screen, and 20px gives the 180 × 252 px Card Details. The Hand Bar makes the card smaller still (`--hand-card-size`) so that 8 Hand Slots and both piles fit the screen width.

Spacing follows a 4px step: 4px between small controls, 8px between pieces in a group and inside HUD panels, 12px inside parchment panels, 16px between screen sections, 20px inside dialogs.

### Named Rules

**The Short Screen Rule.** `@media (max-height: 500px)` is the phone-in-landscape layout. Every component has a compact form for it: smaller padding, one size smaller text, and icon-only Town Bar shortcuts. A phone in portrait shows only a request to turn the phone.

**The Clear Board Rule.** No HUD piece, panel or effect may cover a Square or a Unit stat for longer than an action needs. Card Details open at the sides of the Board, not on it. The Tutorial panel opens next to the thing that its step tells about, with a pointer to it: above the Hand, under the Summon Zone, under the Player's Units, or above or under the Lane to block. It never covers the Squares that its step points to. When there is no space next to the Lane to block, the panel opens at the right of the screen.

**The Markers In View Rule.** On every screen shape, from 4:3 to 21:9 and on a phone in landscape, all Stage Markers stay on the screen, above the Town Bar, and at least half of the Boss landmark stays in view. No Stage Marker goes under a HUD piece. The painting gets smaller before a marker goes off the screen or under the HUD.

## Elevation & Depth

Depth is physical, as on a real table. Pieces have a hard, short drop shadow with no blur, as if they are 3px thick. Card metal has an inset bevel: a light top edge and a dark bottom edge. Trays and empty slots are wells with an inner shadow. Large soft shadows are only for things that float over the Board: a dialog, the Card Details, the Hand Bar. Glow is a state, not a decoration. It shows a Ready card, the active Hero, a selected option, or a Building under the pointer.

### Shadow Vocabulary

- **Piece Drop** (`box-shadow: 0 3px 0 rgba(0,0,0,0.45)`): every button and HUD tooltip. A Town Bar icon has the same drop at 2px, as `drop-shadow`, because it is a cut-out. When pressed, it changes to `0 1px 0 rgba(0,0,0,0.45)` and the piece moves down 1px.
- **Card Bevel** (`box-shadow: inset 0 0.1em 0 rgba(255,243,210,0.85), inset 0 -0.12em 0 rgba(60,30,5,0.75), 0 0.3em 0.7em rgba(0,0,0,0.55)`): the Card Frame and the Card Back.
- **Tray** (`box-shadow: inset 0 0.15em 0 rgba(255,214,150,0.3), inset 0 -0.3em 0.6em rgba(0,0,0,0.45), 0 0.6em 1.6em rgba(0,0,0,0.55)`): the Hand Bar.
- **Well** (`box-shadow: inset 0 0.35em 0.8em rgba(0,0,0,0.7), 0 0.08em 0 rgba(255,226,170,0.18)`): an empty Hand Slot or an empty pile.
- **Badge Drop** (`box-shadow: 0 0.12em 0.25em rgba(0,0,0,0.6)`): round card badges and stat plates.
- **Lift** (`filter: drop-shadow(0 10px 24px rgba(0,0,0,0.55))`): the Card Details over the Board.
- **Ready Glow** (`box-shadow: 0 0 18px 4px rgba(255,210,90,0.75)`): a Ready Hand Card.
- **Active Glow** (`box-shadow: 0 0 14px 2px rgba(255,215,90,0.6)`): the Hero panel of the side whose Turn it is.
- **Selected Halo** (`box-shadow: 0 0 0 3px rgba(226,169,59,0.45)`): a selected option card.
- **Building Glow** (`filter: drop-shadow(0 0 14px rgba(255,224,138,0.95))`): a Town Building under the pointer or the focus, and an Open or Done Stage Marker under the pointer, in focus or selected.
- **Tutorial Glow** (`box-shadow: 0 0 24px rgba(127,227,255,0.75)` with a 4px `tutorial-glow` ring): the part of the screen that a Tutorial step points to.
- **Bar Lift** (`box-shadow: 0 -4px 12px rgba(0,0,0,0.35)`): the Town Bar.

### Named Rules

**The Hard Drop Rule.** A piece that the Player can press casts a hard drop with no blur, and pressing it moves it down 1px. Soft, blurred shadows are only for things that float over the Board.

**The Glow Is State Rule.** A gold glow means Ready, active or selected. Never add a glow to a piece only to decorate it.

## Shapes

Shapes are rounded and friendly, never sharp and never pill-shaped buttons. Buttons, shortcuts and tooltips have gently curved corners (8px). HUD plates, option cards and the Tutorial panel are softer (12px). Dialogs and parchment panels are the softest (16px). Small chips and key caps are nearly square (4px). Badges, the HP bar and pile counts are full circles or capsules.

The card has its own shape language in `em`. The bronze frame has a 0.85em corner and the art window inside it has 0.55em. A Skill Card has an arched top on its art window, so its shape is different from a Creature Card. The card name is not on the frame. Rank Gems are small squares turned 45° into diamonds, with a dark edge and a light top-left facet. The Heynbord emblem (two hexagon halves and a four-point star) is the mark on the Card Back and, faded, in each empty slot. While the card art loads for the first time, the art window shows the same dark Well with the faded emblem, which pulses slowly (no pulse with reduced motion). Then the art fades in over 200ms. Art that loaded before shows at once.

Borders are thick and part of the material: 2px on buttons and HUD plates, 3px to 4px on parchment panels and dialogs, and about 0.16em of bronze on card badges.

## Components

### Buttons

Chunky and tactile, like a wooden or gold game token.

- **Shape:** gently curved (8px), 2px border, Inter 600, minimum height 44px (36px small, 48px large, 40px square icon).
- **Gold:** a vertical gradient from `gold-light` to `gold`, a `gold-deep` border and `ink-on-gold` text. Only for the main action of a panel and for a selected toggle. End Turn and a large gold button such as Start Battle use Cinzel.
- **Wood:** a vertical gradient from `wood-light` to `wood`, a `wood-edge` border and `cream` text. The default, for the second action of a panel.
- **Ghost:** `night-plate` at 70%, a `cream` border at 30%, and `cream` text. For small HUD controls over the Board: speed, Skip, sound, Key Guide.
- **Hover / Focus / Press:** hover makes the face 10% brighter. Focus shows a 4px `focus-cream` ring. Press moves the piece down 1px and the Piece Drop becomes 1px. The change takes 100ms.
- **Disabled:** 45% opacity, grayscale, and a "not allowed" pointer.

### Chips

- **Turn chip:** a 4px corner, Inter 600 at 0.75rem. "Your Turn" is `ready-gold` with `ink-on-gold` text. "Enemy Turn" is `enemy-red` with white text.
- **Boss chip:** `blood-banner` with white text, 10px Inter 700 in uppercase.
- **Enemy Countdown:** a small 4px-corner tile (20 × 28 px) on `plate-socket`. A Ready one changes to a dark red face with a `ready-gold` border and number.

### Cards / Containers

- **Parchment dialog:** `parchment`, a 4px `frame-wood` border, a 16px corner, 20px padding, centered text, on a 55% black scrim with a 2px blur. One gold and one wood button at the bottom. The first action takes focus when the dialog opens.
- **Settings dialog:** a parchment dialog at the center of the screen, at most 480px wide, on the same scrim. The painted `settings` icon and a Cinzel title, a square wood close button at the top right (on parchment, a ghost button looks grey), and a `parchment-rule` line under them. Then one row for each option: a Cinzel label at the left (88px), the control at the right, with `parchment-rule` lines between the rows. Language is a radio group of option cards, each with the language name in its own language and a round radio mark (a gold face with an ink dot when selected). Sound is a square wood sound switch, a volume slider from 0 to 100, and the value in Inter 900 with tabular figures. The slider is a groove cut into the parchment (`frame-wood` with an inner shadow and a light lower lip), a gold fill, notches at every 25 under it, and a bronze knob in the card metal with the Piece Drop and the 1px press while dragged. When the sound is off or the volume is 0, the fill and the value go grey and faint, and the switch shows the mute icon. A volume change turns the sound on, the switch gives back 50 from a volume of 0, and a short tone plays at the new volume when the knob stops. A change applies at once, so the dialog has no Save button. The current language takes focus when the dialog opens, and focus goes back to the Settings button when it closes.
- **Deck dialog (signature):** the Deck builder is an open book at the center of the screen, at most 1200 × 780 px (the full screen less 8px on a short screen), on the same scrim. The cover is flat leather (`#55301a`) with a thin tooled line in `bronze-rim` at 30% and four corners in the card metal, as on the painted `deck` icon. The top band of the cover holds the `deck` icon and the Cinzel title in `cream`, then the Deck slots (3 to 10) as ribbon bookmarks with a swallowtail end, then a square wood close button. Until the Player has 10 slots, a locked ribbon follows the last slot: dark leather with a dashed `bronze-rim` edge, a lock and the Coin price of the next slot. It opens a small parchment dialog with the price, the Coin balance, the balance after the purchase, and Cancel and Buy. When the Coin is not enough, Buy is disabled and the dialog says how much more Coin the Player needs. After a purchase, the new empty slot opens. A ribbon is wood with `cream` text; the open slot is gold and taller, because it is the current place; the active Deck has a small seal with a check. The two parchment pages have the edges of the lower pages under them and a soft shadow at the spine; no text sits in the spine. The left page, "Your Cards", is a grid of Card Frames (11px font size, 7px on a short screen) with a filter of three option chips. The selected chip is a gold plate, and when the selection changes the plate slides along the strip to the new chip (220ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`; none with reduced motion). Under each card, a Night Plate shows the free copies (`×2`), or a `parchment-deep` chip shows why the card cannot go in ("All in Deck", "Deck is full", "3 copies", "Mage only"); such a card is 82% bright and less saturated, like a card that is not Ready. A press adds one copy. The right page has the Deck name as a Cinzel title that the Player can edit (a dashed line under it on hover, `parchment-lit` while it has focus), the Hero Class as option cards, the Countdown curve, the Deck list, and a footer. The **Countdown curve** is a well cut into the page (`parchment-deep`, a `parchment-rule` border, an inner shadow) with one column for each Countdown 1 to 6: each card is the edge of a card, in the card metal for a Creature Card and in parchment with a `gold-deep` line for a Skill Card. A new card drops onto its column (220ms; none with reduced motion). The **Deck list** is ruled like a ledger, with `parchment-rule` lines: a round Countdown badge, a strip of the art in a Rank-colored frame, the name, the Rank Gems and the copies in Inter 900. Under the pointer the row is `parchment-lit` and the copies change to a small wood minus key; a press removes one copy. The footer has the size groove of the volume slider (gold from the minimum, a muted bronze below it, an ink notch at the minimum), the reasons with a `keyword-rust` diamond when the Deck is not valid, then Remove All and Auto-fill in wood and "Use This Deck" in gold. On the active Deck, the gold action changes to an "Active Deck" chip (`parchment-lit`, a `gold` border, `gold-deep` text). Hover (250ms), keyboard focus or a long press shows the Card Details over the other page, with the card at the spine, so they never cover the card under the pointer.
- **Handbook dialog:** the Handbook is a second book from the same game box, a cloth-bound field manual, not a leather ledger like the Deck book. The cover is a deep blue bookcloth (a gradient from `#33476b` to `#1d2b47` with a fine diagonal weave), a 2px `#121c30` edge, stitches in a dashed `bronze-rim` line at 35%, a 16px corner and the soft dialog drop. It has no gold corners and no ribbons. The top band of the cover holds the `handbook` icon (an open book glyph in `cream` until the painted icon exists), the Cinzel title in `cream` with a hard 2px text drop, the search field and a square wood close button. The search field is a well cut into the cloth: `parchment-lit`, a 2px dark edge, an inner shadow, a magnifier, `ink-faded` placeholder text, a clear button while it has text, and the 4px `focus-cream` ring. The Chapters are thumb-index tabs on the page edge, one for each Chapter: a tab of `#d9c39a` with the Chapter icon and its short name in Inter 700 at 12px, a 2px hard drop, and an 8px corner on its outer side. The open Chapter is the current place: its tab is `parchment`, it joins the page, and a 4px gold line marks its outer edge. **Two pages** on desktop, outside the Battle: at most 1180 × 760 px, on the usual scrim. The left page is the index of the open Chapter, ruled like the index of a book: rows of at least 40px with a `parchment-rule` line under each, the icon of the Entry at the left when it has one, and the open Entry on `gold-light` at 45% in Inter 700 with a short gold bar at its left. The right page is the open Entry, with a soft shadow at the spine between the pages. A search shows its results on the left page: the Entry name, or "alias → name" for a word from other games, with the Chapter under it in `ink-soft`; no result is one line and a link to the Battle Chapter. **Entry page:** a Label with the Chapter, the name in Cinzel 900 (28px, 20px on a short screen), the large icon in a round 64px badge (a dark radial plate with a 3px `bronze-rim` rim and the Piece Drop, so that a Status, a Damage Type color or the Rank Gems keep their own colors), the rule text in Inter at 15px in `ink`, then the Rank table (each Rank with its Rank Gems and N in Inter 900 with tabular figures, `parchment-rule` lines between rows) or the line "N is on each card", then the Lane strip, then "See also" links in Inter 700 `keyword-rust` with an underline. **Token gallery:** the Token Entry shows "Tokens in the game" after its rule text, in the same `#f1e2c2` well as the Lane strip. Each Token that a card summons is there; the list comes from the rules, so a new Token shows with no Handbook change. One Rank control holds all the Tokens: a strip of 5 segments with the Rank Gems only, as the filters of the Deck builder (the gold plate slides to the selected segment), and the name of the selected Rank in Cinzel at the right of the heading. Each Token is one ruled row: its Token frame at 10px (8px on a short screen), its name in Cinzel, "Race · Token", Attack, HP and Speed (a changed value rises into its place in 300ms; with reduced motion it changes at once), then the Damage Type, Melee or Ranged and its Keywords as Entry links in `keyword-rust`, then "Summoned by" and the names of the cards that summon it at that Rank, with a dotted underline. Hover, keyboard focus or a long press on a name shows the Card Details of that card at that Rank beside the row, out of the page (over the name on a short screen). They have no links. A Token that no card makes at the selected Rank shows a muted, grey frame and the line "No card makes this Token at this Rank." with a link that selects the lowest Rank that has one. The search finds the Token Entry by a Token name ("Skeleton → Token"). **Pack guide:** the Pack Entry shows the three painted Packs on a wood ledge in the `#f1e2c2` well, as React Aria tabs. The selected Pack lifts 8px off the ledge into a pool of lamp light (260ms, `cubic-bezier(0.16, 1, 0.3, 1)`), its name goes to `ink`, and a short gold bar slides under it. The Peddler shows the Free tag until the Player opens the free Pack. Under the shelf: "A more expensive Pack is not a better deal." The panel of the selected Pack has its job line in Cinzel, the Rank bar of its Drop Rates with Rank Gems, names and percents, then the **Pack Guarantee track**: one small Pack cell for each Pack before the Guarantee, dark for each Pack that the Player opened with no card of that Rank, a gold ring and a caret on the next Pack, and the shield in the Rank color at the end. The cells come in one by one (22ms apart) and the shield stamps down (`hint-seal`), so the eye follows the count to the Guarantee; with reduced motion they show at once. Then "For you now:" with the Packs screen Guarantee line, New Card First and Open ×10 as ruled rows, and the same Pack with a Race Stamp and a Class Stamp for its Race and Class versions. **Lane strip:** a static strip of Squares drawn in code on a `#f1e2c2` well with a 2px `parchment-rule` edge: Squares in `parchment-deep`, the Heroes as tall plates in the Side colors with a crown, Units as round tokens in the Side colors with their card icon (a sword for Melee, an arrow for Ranged, a wall for Wall or wings for Flying), a Summon Zone tint in `ready-gold` (player) or `enemy-red` (enemy), a hatch for the Wall Columns, and arrows: a solid line for Movement, a dashed arc for Flying and a summon, an arc in the Side color for a hit (an enemy hit goes under the Units), a thick line for a push, and a dashed ring where a Unit stops. It has no text. **Short screen** (`max-height: 500px`): one page at a time over the full screen less 8px. The list shows first, an Entry opens over it with a square wood back arrow in place of the icon, and the tabs become a strip of icons over the page. **In the Battle:** the same single page, `min(26rem, 42vw)` wide at the right side of the screen with no scrim, so that most of the Board stays in view (The Clear Board Rule). The Battle does not pause. Esc, the close button and a click outside close the Handbook, and the focus goes back to the control that opened it. Out of the Battle it opens and closes on its spine, as the Deck book does. In the Battle, the closed book (the cloth cover with the icon and the title) slides in from the right edge of the screen (`cubic-bezier(0.16, 1, 0.3, 1)`), then the cover swings open toward the Board on the spine at its left edge until it is edge-on and gone, so that it never lies on the Board; it goes dark as it stands up, and its shadow on the page goes with it (`handbook-side`, 440ms). The close plays the same keyframes in reverse in 280ms: the cover shuts, then the book slides away. With reduced motion it shows and goes at once.
- **Parchment panel:** `parchment-deep`, a 4px `frame-wood` border, a 16px corner, 12px padding. It holds a Cinzel label and a group of option cards.
- **Option card:** `parchment` with a 2px `parchment-rule` border and a 12px corner. When selected, it changes to `parchment-lit` with a `gold` border and the Selected Halo. Hover lifts it 2px.
- **HUD plate:** `night-plate` at 85%, a 2px border, a 12px corner. The Turn badge has a `gold-trim` border at 70%. A Hero panel has the color of its side as its border, a small light blur behind it, and the Active Glow during its Turn.
- **Tooltip:** `night-plate` at 95%, a 2px `gold-trim` border at 70%, the Piece Drop. 8px corner for a short label, 12px for the Key Guide.
- **Hint:** a small `parchment` banner with a 2px `frame-wood` border, an 8px corner and a pointer to its subject, at most 420px wide. At the left is the **seal**: the subject on a round 40px badge (32px on a short screen) with the dark radial plate and a 2px `bronze-rim` rim, as the large icon of a Handbook Entry. The Deck Hint shows the painted `deck` icon, the Recall Hint the Recall glyph in `cream`, and the Skill Card Hint a Skill Card glyph in `ready-gold`, turned 8°. The Gear Hint shows the painted `hero` icon, and the Sweep Hint the Sweep Ticket glyph in `ready-gold`, turned 8°. The seal stamps onto the parchment 120ms after the banner opens: it comes down from 150%, turned 14°, presses in to 92% and settles (`hint-seal`, 380ms). Then a `tutorial-teal` label "Hint", the text, and "Read more" with the book glyph, because it opens the Handbook. A 2px **time line** in `tutorial-teal` at 45% on the bottom edge gets shorter over the 8 seconds until the Hint closes (`hint-time`, linear). While the pointer or the focus holds the Hint, the line is full and stops, as the time does. With reduced motion, the seal does not stamp and the line does not show. The Sweep Hint is the one Hint in a modal dialog: it shows over the scrim of the Stage Panel, below the Sweep button and out of the panel. On a short screen, the panel fills the screen, so the Hint is at most 340px wide and points from the empty part of the left column at the "Sweep" label of the Sweep row; it covers no control. Its "Read more" puts the focus back on the Sweep button first, so that the panel keeps the focus when the Handbook closes.

### Inputs / Fields

The one text field is the Deck name in the Deck dialog: it looks like the Cinzel title of the page, not like a form field. Choices use option cards in a radio group (see above). The language control is in the Settings dialog: one option card for each language, in a radio group.

### Navigation

- **Town Bar:** a wood shelf fixed to the bottom, 80px high (56px on a short screen) plus the safe-area inset. The wood is a gradient from `#5a3a20` through `#4a2f1b` to `#2e1d10` with the Hand Bar grain, a 4px `wood-edge` top border with a thin `bronze-rim` highlight under it, and the Bar Lift. Along the bottom runs a flat lip (`#24170c`, a `bronze-rim` line at 20% on top) that holds the names, so no name sits on the grain. The Town shortcut is at the left, apart from the others, after a carved groove. The Settings button is at the right, apart from the others, after a carved groove.
- **Shortcut:** a painted icon (66px, from `apps/web/public/town/bar/`, 11 — Town Concepts 7) that stands on the shelf and out of its top edge, with a small dark contact shadow, over its 11px Inter 700 name on the lip. The slot is at most 96px wide and shares the bar width with the others. The button has no fill: the icon is the piece. Hover lifts the icon 3px and makes it 10% brighter, and the name changes to `gold-light`. Press puts the icon back down. The current screen has its name on a gold plate (`gold-light` to `gold`, a `gold-deep` border, `ink-on-gold`, a 4px corner, a 2px drop), its icon 4px higher in a soft `ready-gold` light, and a short hop when it becomes current (none with reduced motion). A screen that does not exist yet shows its icon at half color, warmed a little toward the wood, with a small round lock seal (`night-plate`, a `gold-trim` border and lock) at its foot, and its name in `cream-dim` at 70%. Hover and focus give the full color back for a look. It still takes focus, and its tooltip says it opens later. A shortcut to a screen that the Player level has not unlocked looks the same, and its tooltip says "Opens at level N". On a short screen, shortcuts are 44px slots with a 48px icon only, the current one has a short `ready-gold` mark under it, and a long press shows the name.
- **Settings button:** a Shortcut with the painted `settings` icon and the name "Settings". It opens the Settings dialog. It never has the current state or the lock, because Settings is not a screen. While the dialog is open, its icon stays lifted.
- **Deck shortcut:** a Shortcut that opens the Deck dialog over the current screen. Like the Settings button, it has no current state, and its icon stays lifted while the dialog is open.
- **Handbook shortcut:** the last Shortcut, before the groove of the Settings button. It opens the Handbook dialog over the current screen. Like the Deck shortcut, it has no current state and no lock, and its icon stays lifted while the dialog is open. Until the painted `handbook` icon exists, its slot shows an open book glyph in `cream` with the 2px drop.
- **Top Bar Handbook button:** a small ghost button with the open book glyph, next to the Key Guide button. It opens the Handbook at one side of the Board. The H key does the same.
- **Battle Log (GDD 11.2):** a view-only record of the past moments of a Solo Battle, from the scroll glyph button next to Skip (a ghost button, gold while the Battle Log is open), the L key, or a wood "Battle Log" button under the two buttons of the result. It is not in the Tutorial. Live pauses while it is open. The panel is a parchment record: `parchment`, a 4px `frame-wood` border, a 16px corner, the Piece Drop and a soft lift. It docks at the right side between the Top Bar and the Hand Bar, `min(24rem, 38vw)` wide, so that the Heroes, the enemy Hand and the Hand Bar show the selected moment. When it opens, it unrolls from its top edge (`log-panel`, 260ms, a clip-path; none with reduced motion). The header has the scroll glyph, the Cinzel title and three square wood buttons: one Log Entry back, Play or Pause, and one Log Entry forward. Each Turn of a Side has a sticky header on `parchment-deep`: "Turn N" in Cinzel 700 with the Side chip of the Turn badge, and the HP of each Hero at the end of the Turn in Inter. A Log Entry is one row: a 24px round dark socket with a glyph of its kind and a rim in the color of its Side, a one-line summary in Inter 13px, and the total damage (a heart and "−N") and the deaths (a skull and N). The selected entry is the current place: `parchment-lit`, a 2px `gold` border and the Selected Halo. Only it opens, to show one line for each result in Inter 12px. In these lines, a Unit or a card name is an ink link that opens its Card Details at the left of the panel (a Unit on the Board shows its values at that moment), and a Keyword, a Status or a Damage Type is a `keyword-rust` link to its Handbook Entry. The Handbook opens on top of the panel, at the same side. Crit, Block, Ward and True Damage are small chips after a hit. The footer has the one gold action, Back to Live, with an Esc key cap. While the Battle Log is open, the Battle Painting and the Board are grey and a little warm (`saturate(0.28) sepia(0.2) brightness(0.95)`), a parchment banner "Turn N · Side · Battle Log" hangs under the Turn badge, the Units that the selected entry changed have a `parchment-lit` ring with an ink edge on the ground, and a Square where a Unit died has a faint ink ring with a cross. End Turn does not show, Skip is disabled, and the Turn Banner and the sounds do not play. On a short or narrow screen (`max-height: 500px` or `max-width: 760px`), the panel is a sheet over the bottom of the Board, just above the Hand Bar, at most 36rem wide. Its header also holds "Show Board", which folds the sheet to its header, and a compact Back to Live.
- **Balance Plate:** a HUD plate (`night-plate` at 85%, a 2px `gold-trim` border at 70%, a 12px corner, the Piece Drop) fixed to the top-right corner of the Town, inside the safe-area insets. It holds Coin, Essence and Heynstones in that order, with short `gold-trim` dividers. Each balance is a 40px focusable piece (32px on a short screen) with a 20px icon (16px) and an Inter 900 number with tabular figures. Coin shows only the denominations that are not zero, each with a coin icon in its metal and a letter in the metal color. Hover, focus or a tap shows a tooltip that says what the balance pays for. Hover makes the area of a balance 10% lighter. A balance has no action, so it has no drop and no 1px press. The plate has no gold fill and no glow, because it shows information only. The Component Catalog shows its ranges.
- **Leave:** a square ghost button with a close mark at the top left of the Battle. Before a result, it opens a parchment dialog to confirm. After a result, it leaves at once.
- **Result rewards:** under the Stars of the result, the card won at the left and the Coin and the XP at the right. The card is a Card Frame at 6px (4.5px on a short screen), turned 2°, dealt on as in the Stage Panel (`stage-panel-deal`), with its name in Inter 700 at 12px under it. A card that is not Discovered gets the gold "NEW" chip of the Reveal, stamped on (`pack-stamp`). The Coin is the small Night Plate of the result. The XP line has "Level N" in `ink-soft` and "+N XP" in `tutorial-teal`, over a 10px groove (8px on a short screen) with a teal fill (`#7fe0f0` to `#0e8aa6`) from the start of the level to the next level. The fill grows from the XP before the result, or from the start after a level up (`result-xp-fill`, 900ms after 350ms). Then "Level up! Level N" stamps on as a gold plate in Cinzel 900 (`result-level-up`). With reduced motion, the bar shows its end at once and nothing stamps. After a win, a second small Night Plate next to the Coin shows the Sweep Tickets of the win: the Sweep Ticket glyph in `ready-gold`, turned 8°, and "+2 Sweep Tickets" in Inter 900. A loss shows no Ticket plate. A result with Forge Stones shows a third small Night Plate: the 18px Forge Stone icon of the tier and "+1 × Common Forge Stone" in Inter 900. The Sweep Result shows the same plate next to its Coin, with the Forge Stones of all its Tickets, and the claimed Star chest panel shows them as one more reward line ([ADR-0038](./docs/adr/0038-gear-upgrades-need-earn-only-forge-stones.md)).

### Card Frame (signature)

The center of the system. A bronze frame (Card Bevel) around the card art, with all parts in `em` so that one font size scales the whole card.

- **Countdown badge** at the top left: a round badge with a bronze rim on a dark radial plate, a faint hourglass, and the number in Inter 900. A Ready card has a gold radial face with dark text.
- **Emblem** at the top right: the Race color with a cream Race icon, or parchment with an ink Class icon on a Skill Card.
- **Rank Gems** at the top center, in line with the Countdown and the emblem. The card name is not here.
- **Stat plates** at the bottom corners: Attack with its Damage Type icon in the Damage Type color, and HP with a heart in `heart-red`. A Skill Card has one round effect badge at the bottom center.
- **Hand Card states:** a Ready card has the Ready Glow and lifts 8px on hover. A card that is not Ready is 82% bright and 70% saturated. A selected card lifts 12px and has a 4px `focus-cream` ring.

### Hand Bar (signature)

A wooden tray with a faint vertical grain and the Tray shadow, with a `bronze` top edge. From left to right: the Deck Pile (Card Backs with bronze edges under them), a bronze divider, 8 Hand Slots (empty ones are Wells with a faded emblem), a divider, and the Graveyard Pile. Each pile has a round count badge on the divider. End Turn is the small gold button (Cinzel 14px), just above the Graveyard Pile and aligned with its right edge, outside the tray.

### Card Details

The Card Frame at 20px font size, with the Details Panel on its right: `parchment`, a 3px `bronze` border with no left side, a 12px corner on the right only, and the Lift. The panel starts with the card name in Cinzel (16px, 14px on a short screen). Under the name it shows the Race or Class line, a stat row with icons, Keywords, and the flavor text in italic at the bottom, with `#c9a46a` rules between the groups. The card always shows the base values at the Rank: Attack, HP and Countdown. The stat row shows the base Speed. A card in the Hand shows its current Countdown on the Hand Card, not in the Card Details. The name shows only in this panel, on hover, long press or keyboard focus. In the keyboard Inspect mode, Tab goes into the panel, and the names of the Keywords, Statuses and Damage Types are links to their Handbook Entries: a dotted underline in `keyword-rust` at 50% that becomes solid under the pointer, and the focus ring. The Card Details of a hover or a long press have no links.

**Unit on the Board.** Hover (after 150ms), a long press (450ms, until the finger goes up), or the I key shows the Card Details of a Unit of either Side. They open at the side of the screen of the Unit owner, between the Top Bar and the Hand Bar: the Card Details of a player Unit at the left, and of an enemy Unit at the right. When the Tutorial text is open at the right, they open at the left. The card is at the screen edge and the panel faces the Board, so at the right edge the layout is mirrored. The card shows the base values, not the current Attack and HP of the Unit: the feet of the Unit show those. The Race line ends with a Side chip in the style of the Turn chip: "Yours" on the player gold with `ink-on-gold`, or "Enemy" on `enemy-deep` with a `enemy-red` border and `cream` text. Under it, a status group shows the bonus Bulwark and its Turns left, Burn and Frozen, each with its icon and a name in `keyword-rust`. The group also shows the Rally bonus ("Attack +1", with a banner icon and the hint "From Rally: until the end of this Turn."), the Swarm bonus ("Attack +1", with a sword icon) as a separate line, and a Rebirth that the Unit used ("Reborn"). The group is absent when the Unit has none of these. On a short screen, the flavor text of a Unit goes away. A Token Unit shows its Token art in the same Card Frame with no Countdown badge. Its Race line also says "Token", and a muted line in place of the flavor text says that a Token is not a card. On the Board, the feet of the Unit show `Attack | HP`. A number is white when it equals the value at summon, `#ff7a6b` when it is lower, and `hp-full` when it is higher, for example an Attack with the Rally or Swarm bonus. The bar between them is `cream`. The line has a dark outline. Bulwark stays in the Card Details. The inspected Unit has a `focus-cream` ring with a dark edge on the ground. Only one Card Details shows at a time: those of a Unit hide those of a Hand Card.

### Campaign (signature)

The map is the menu. Each Stage is a heraldic shield on its painted clearing, and the Open shield is the one gold thing on the map.

- **Stage Marker:** a heater shield that stands on its clearing, with its ID plate on the clearing under it. The rim is metal with a vertical gradient, and the face is paint with a light from the upper left. A 3px `wood-edge` line goes around the shield, and a thin light line shows the upper-left facet of the rim. The shield casts the hard 3px Piece Drop (as `drop-shadow`, because it is a cut-out), and a soft `night-plate` contact shadow sits on the clearing under it. The shield width is 66px × the map scale, from 34px to 64px, so it is never larger than a Town Bar icon. The shield is 1.15 × as high as it is wide.
  - **Open:** a card-metal rim (`#f7dc9c` to `#8a5a20`) and a gold face (`#fff3c4` through `ready-gold` and `gold` to `#b9801f`), with crossed swords in `ink-on-gold`. A soft `ready-gold` halo pulses behind the shield, and a `gold-light` ring ripples out on the ground. Only one Stage is Open.
  - **Done:** a bronze rim around a Tavern Wood face (`#8a5d38` to `#3a2412`), with a thick `cream` check.
  - **Locked:** a `pewter` rim around a `stone` face, with a dark lock (`#2b2e31` at 85%). The marker keeps its focus. Hover (after 200ms), keyboard focus, or a tap or long press with touch show a Tooltip above it: "Win Stage X first."
  - **Boss:** 1.3 × larger, with a `ready-gold` crown (a `#5b3a0c` outline and a 2px drop) on top of the shield.
  - **ID plate:** the Stage ID in Inter 900 at 13px with tabular figures (11px on a short screen), on a plate 22px high (19px) with a 6px corner, a 2px border and a 2px drop. Open is a gold plate (`gold-light` to `gold`, a `gold-deep` border, `ink-on-gold`). Done is a Night Plate at 90% with a `gold-trim` border at 70% and `cream` text, and the best Stars after the ID (3 Stars at 11px, 9px on a short screen). Locked is dim: a Night Plate at 80%, a `cream` border at 25%, and `cream-dim` text.
  - **States:** an Open or Done marker lifts 3px under the pointer, gets 10% brighter and has the Building Glow. Keyboard focus gives the Building Glow and a focus ring on the shield edge: a `focus-cream` line on a dark `night-plate` edge. Press moves it down 1px. While its Stage Panel is open, the marker stays 4px higher and 10% brighter, with the Building Glow. The changes take 150ms. A Locked marker only gets 10% brighter under the pointer, and it does not lift or glow.
- **Trail line:** an SVG line on the center of the painted road, in the painting coordinates, so it scales with the painting. It is a smooth curve through measured points. The walked part, from the Trail entry to the last Done Stage, is `cream` dashes (16 on, 13 off, 7.5 wide) on a dark `wood-edge` under-stroke at 55% (13 wide), with round caps. The part ahead is `cream` dots at 80% every 18 units, on a dark dot at 35%.
- **Region banner:** a HUD plate (`night-plate` at 85%, a 2px `gold-trim` border at 70%, a 12px corner, the Piece Drop) at the top left, 64px high (40px on a short screen), inside the safe-area insets. It holds the Region name in Cinzel 900 at the Headline size (24px on a short screen) in `gold-light`, with a hard 3px text drop. Under the name, "Region 1 of 3" is Inter 600 at 12px in `cream-dim`. On a short screen, this line is for screen readers only. After a short `gold-trim` divider at 25% comes the arrow to the next Region: a 40px square (32px on a short screen) with an 8px corner and a `cream` chevron at 70%. Hover gives a `cream` area at 10% and the full `cream`. Focus gives the 4px `focus-cream` ring. While the next Region has no Region Map, a small round lock seal (`night-plate`, a `gold-trim` border and lock) sits at the bottom right of the arrow, and its Tooltip says that the Region opens later. Region 1 has no back arrow.
- **Star chest plate:** a HUD plate at the top right, with the same height as the Region banner. At the left, a `ready-gold` Star (24px, 20px on a short screen) and the Star count in Inter 900 at 18px with tabular figures, then "/ 30" in Inter 700 at 14px in `cream-dim`. At the right is a track 176px wide (96px on a short screen): a groove cut into the plate (`plate-socket`, 8px high, with an inner shadow and a light lower lip), with a gold fill (`gold-light` to `gold`) to the Star count. The fill moves in 700ms. A chest sits on the track at 10, 20 and 30 Stars. Each chest is a 40px focusable piece (32px) with a painted wood chest. A closed chest has a domed lid, `bronze-rim` bands and a lock, at 90% brightness and 70% saturation. A claimable chest (the Region has its Stars) is closed at full color, with a `ready-gold` halo behind it that pulses as the Town Gate pulse (none with reduced motion); hover lifts it 2px. A claimed chest has its lid open and gold light comes out. A number badge with a 4px corner sits at the bottom right of each chest, in Inter 900 at 12px. The badge of a claimable or a claimed chest is a gold plate. The badge of a closed chest is a Night Plate with a `gold-trim` border at 50% and `cream-dim` text. Hover, focus or a tap shows a Tooltip under the chest with its Stars and its state: the Stars still needed, "open it to claim", or "claimed". A tap or Enter on a claimable chest claims it, plays a short chime, and opens the **chest rewards** panel under it: a HUD plate 256px wide with the Cinzel 900 title in `gold-light`, one line for each reward (the balance icon and the amount, and the Pack glyph with "1 Merchant Pack waits in the Card shop"), and a small gold "OK" button that takes the focus. Esc, OK and a click outside close it.
- **Stage Panel:** a parchment dialog like the Settings dialog: `parchment`, a 4px `frame-wood` border, a 16px corner, 16px padding at the top and 20px at the sides and bottom, and a soft drop (`0 24px 48px rgba(0,0,0,0.55)`), on the 55% black scrim with a 2px blur. It is `min(460px, 94vw)` wide. The header has the shield of the Stage state, the Stage ID in Cinzel 900 at 24px (20px on a short screen) with the Boss chip, a "Best Stars" line in Inter 700 at 12px in `ink-soft` with 3 Stars at 16px (or "Not won yet"), and a square wood close button at the right. A 2px `parchment-rule` line is under the header. Then one row for each part: a Cinzel 700 label at 14px at the left (76px), the content at the right, and `parchment-rule` lines at 70% between the rows. The enemy row has the enemy Class icon on a 28px `enemy-deep` tile, the enemy line in Inter 700, and the Hero HP and Recommended level in 12px `ink-soft`. The reward row has the first-win card as a Card Frame at 6px font size (4.5px on a short screen), turned 2° to the left, with its name in Cinzel 700 and its Rank. After the first win, the card is at 70% opacity and 70% saturation, and the text gives the repeat-win reward. The Deck row is a radio group of option cards (at least 44px high), each with the Class icon on a 28px `frame-wood` tile, the Deck name in Cinzel 700 at 14px, and the Class and card count in 12px `ink-soft`. Under them, a small wood "Edit Decks" button opens the Deck dialog in place of the panel. A Deck that is not valid shows its first reason with a `keyword-rust` diamond, and Fight is then disabled. Fight is a large gold button across the full width, in Cinzel with 0.04em letter spacing. It takes the focus when the panel opens, so Enter starts the Battle. On a short screen, the panel is `min(720px, 96vw)` wide with two columns 20px apart: the enemy and the reward at the left, and the Deck and Fight at the right, with Fight at the bottom. The panel comes up out of its Stage Marker on the path of the Settings dialog (`settings-sheet-*`, 460ms). While it grows, its parts ink in from the top, one after the other: each rises 6px and fades in, 50ms after the part before it (`stage-panel-ink`, 320ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`). Then the reward card is dealt onto the page: it comes down from above and to the right, 120% large and turned 12°, and lands at its own tilt (`stage-panel-deal`, 440ms). The close plays the path in reverse in 260ms, back into the marker: the text goes first and the scrim fades with the sheet. The panel keeps its Stage until the close ends. On the way to the Deck dialog and back, it only zooms from 95% and fades at the center, because the Deck book opens over it. With reduced motion it shows and goes at once.
- **Sweep (Stage Panel):** only on a Stage with 3 best Stars (GDD 4.12). Under the Deck row, a Sweep row of the same form: the Cinzel label "Sweep", then the **Sweep Ticket** glyph (a ticket stub with a notch in each end, a line of tear holes and a star) in `ready-gold` on a 28px `frame-wood` tile with "Tickets: 7" in Inter 700, and at the right the **Ticket control**: square wood − and + keys (40px, 32px on a short screen), the number in Inter 900 at 24px with tabular figures in a `parchment-lit` well with a `parchment-rule` border and an inner shadow, and a small wood "Max" key. The number is a WAI-ARIA spinbutton: the arrow keys, the page keys, Home and End change it, and it is not a text field, so a phone shows no keyboard. It is 1 to 10, and not more than the Tickets; it starts at the most, and a key is off at its limit. With 0 Tickets, the control is absent and an `ink-soft` line says "Each win that you play gives 2 Sweep Tickets." The buttons are then two columns: Fight in wood at the left and **Sweep ×N** in gold with the Ticket glyph at the right, which takes the focus. With 0 Tickets, Sweep is off and Fight is gold and takes the focus again (The Gold Means Act Rule).
- **Sweep Result:** a Sweep turns the page of the Stage Panel in place: the header stays, with the same 3 best Stars, and the body changes. "Victory" in Cinzel 900 at 36px (24px on a short screen) in `victory-amber`, with a gold stamp "×N" and the Ticket glyph, turned −6° (`pack-stamp`). Under it, the cards in a fan: one Card Frame at 7px (5.5px on a short screen) for each card and Rank, from the highest Rank, each turned out from the center and dealt 70ms after the one before it (`stage-panel-deal`). More copies show the `×N` plate of the Open ×10 grid, a card that was not Discovered gets the gold "NEW" chip, and with 3 cards or fewer the names show under them. When the fan is wider than the page, the cards overlap. With no card, an italic `ink-faded` line says "No card this time." Under a `parchment-rule` line: the Coin plate and "Sweep Tickets left: N" at the left, the XP bar of the result at the right. The buttons are wood **Close** (back to the first page with the new Ticket count) and gold **Sweep Again ×N** with the focus; when the Player has too few Tickets, Sweep Again is off and Close is gold. The parts ink in from the top (`stage-panel-ink`, 60ms apart), and each Sweep plays them again. On a short screen, the title and the fan are the left column, and the rewards and the buttons the right column. With reduced motion, all shows at once.

### Packs

- **Packs screen:** the inside of the Card shop: the Card shop painting (Town Concepts 9, 3:2) at the size that covers the screen, so a point in painting percent stays on the same thing at all screen sizes. Its brass lamp and two lanterns have a soft warm light that breathes, and dust drifts in the light of the round window. At the top left, a HUD plate holds the Cinzel title "Packs" and a small wood **Drop Rates** button. The Balance Plate is at the top right, as in the Town. Under the top band, one **pool plate** (a HUD plate) selects the cards in the Packs with two radio groups and a thin divider between them. The first group, "Cards", selects the kind: "All cards", "Creature Cards" or "Skill Cards". The second group selects the Race of a Race Pack (one segment for each Race with its Race glyph) or the Class of a Class Pack (one segment for each Class with Skill Cards, with its Class glyph). The Race or Class name shows on a screen 1100px or wider; on a narrower screen, it is for screen readers only. The second group has no "All" segment, because "All cards" is the first kind. With "All cards", the second group closes and the plate gets narrower with the same 220ms slide (a grid column from `1fr` to `0fr`); the plate does not get taller. With reduced motion, it changes at once. Skill Cards starts on the Class of the active Deck, and Creature Cards on the first Race; the screen keeps the last Race and the last Class while it is open. The selected segment of each group is a gold plate that slides, as the filters of the Deck builder. One control sets the pool of the three Packs, so their prices change together. Next to it, a HUD plate shows **Cards found** for that pool: the label in 12px `cream-dim`, a groove cut into the plate (`plate-socket`, 8px high, with an inner shadow and a light lower lip) with a gold fill, and "9 / 93" in Inter 900 with tabular figures. A card counts one time in any Rank. The fill moves in 700ms when the pool changes. On a screen 760px or taller, the plate is under the pool plate, so the row stays narrow; on a short screen, the label is for screen readers only.
- **Shopkeeper:** the shopkeeper in the painting talks in a speech bubble over his head: `parchment`, a 2px `frame-wood` border, a 12px corner, Inter 600 at 14px in `ink`, the Piece Drop and a soft shadow, with a tail that points down at him. Each new line grows out of the tail (`shopkeeper-say`, 340ms). He says a gift line on the first visit (before the free Pack), else a welcome; a line for each pool when it changes ("Elf cards. Mind the thorns."); a line when the Player has all cards of the pool; and, after a reveal, a reaction to the best card (Rare, Epic, Legendary) or to the new cards. He never talks about price or time. A press on him (a focusable area on his figure, with the focus ring) gives the next welcome. The bubble measures the HUD pieces: when it goes over one, it moves right of it, and it gets narrower near the screen edge; with less than 200px, it hides. On a screen narrower than 1100px or a short screen, the Packs cover him, so he is quiet.
- **Pack Stand:** the three Packs stand side by side, at most 280px wide each, with the same bottom line. The painted Pack (2:3, about 250px tall, a soft contact shadow under it) stands on a wood ledge on top of a HUD plate. The plate has the Pack name in Cinzel 700 in `gold-light`, its job in 12px `cream-dim` (two lines high on all three, so the plates line up), the **Rank Bar** (an 8px bar in the Rank colors, then each rate with its Rank Gems, so the Rank never shows by color only), the Pack Guarantee line with a shield in the Guarantee Rank color, then **Open** in gold and **Open ×10** in wood, each with its price in coin icons and short letters. When the Coin is not enough, the button is disabled and says "Need 1s 50c". The first single Peddler Pack is **Free**: the button says "Free" in Cinzel, and a gold "Free" tag hangs on the corner of the painted Pack. A Pack that the Player cannot buy shows its art 70% bright and less saturated. A Race Pack shows the **Race Stamp** at the center of the lower-right quarter of the Pack: the Race glyph in `cream` on a round radial plate in the Race colors with a bronze rim. A Class Pack shows the **Class Stamp** in the same place and at the same size: the Class glyph in `ink` on the radial `parchment` plate of the Skill Card emblem, with the same bronze rim. There are no Class colors. The reveal and Open another use the same stamp. On a short screen, each Pack stands at the left of its plate (30% of the stand), the job line is only for screen readers, and the two Open buttons are one under the other with the price at the right.
- **Drop Rates dialog:** a parchment dialog like the Stage Panel, `min(720px, 96vw)` wide, with a scroll. A ruled table has one column for each Pack: the Drop Rate of each Rank (each Rank with its Rank Gems; "—" for 0), the Pack Guarantee, the Open ×10 bonus, New Card First (a check or "—"), the price and the Race or Class Pack price. Then the numbered Pack rules and New Card First. On a short screen, the table and the rules are two columns.
- **Reveal:** on the shop counter: over the full screen, the shop stays in view behind a 6px blur and a dark radial scrim (`#24160e` at 80% in the center to `#0c0805` at 96%), under a soft cone of lamp light from the top center that breathes as the shop lamps do. The Pack name in Cinzel 900 in `gold-light`. One Pack: 5 Card Backs in a row (13px to 17px font, with the screen height; 8.5px on a short screen), from the lowest Rank to the best card at the right. A Rare, Epic or Legendary card has a halo on its back in `rank-rare`, `rank-epic` or a gold `#ffc94a`; Common and Uncommon have none. A press flips one card. **Reveal all** (gold) flips the others one after the other, and **Skip** (wood) shows them at once. Under each face, the name in Cinzel 700 in `cream` and the Rank in its color; a card that was not Discovered has a gold "NEW" chip at its top. After all faces show, **Open another** (wood, with its price in coin icons) buys the same Pack in the same pool again and starts a new reveal; it is absent when the Coin is not enough. **Done** is the gold action. If a rule gave a card of the Guarantee Rank, a line on a Night Plate says so. Open ×10: each Epic and Legendary card in turn as one large card (20px font) with "Flip", then "Next card", then a grid of all the cards (7.5px font, 6px on a short screen), from the highest Rank, new cards first, with a `×N` Night Plate for more copies of one card and Rank, then Open another and Done.

### Workshop

- **Workshop screen:** the inside of the Workshop: its painting (Town Concepts 10, 3:2) at the size that covers the screen, as the Packs screen. The brass lantern and the forge fire breathe (`shop-lamp`). At the top left, a HUD plate holds an anvil glyph and the Cinzel title "Workshop"; the Balance Plate is at the top right. The card grid and the **Rank Panel** stand in front of the calm wall of the painting: together about 72% of the painting width, centered, so that a wide screen shows the smith at the left and the goblin tinker at the right. A phone in landscape uses the full width. Each plate is only as tall as its content.
- **Card grid:** a HUD plate with "Found cards", its count, and the filters of the Deck builder on Night Plate strips (the same gold plate slides). The Ownership filter says "All", "Owned" and "0 copies". One tile for each Discovered card: the Card Frame at its highest owned Rank (11px font, 7px on a short screen), and under it a strip with the copies of each owned Rank: the Rank Gems and "×N" on a dark chip, never the color alone. A card with 0 copies is 82% bright and less saturated. A tile with a pair below Legendary has a small gold anvil on the bottom edge of its frame, between Attack and HP. The selected tile has a gold ring and glow. It is a React Aria grid: arrow keys move, Enter or a press selects.
- **Rank Panel:** a HUD plate, 380px wide (40vw at most). At the top, the card (13px font on a tall screen) with its name in Cinzel 700 in `gold-light`, the shown Rank with its gems, and the **Path to Legendary**: a groove with a gold fill as "Cards found", "9/16", and "7 more Common copies · 57s". Under it, the ladder: Rank rows from Legendary at the top to the Base Rank. A row has the Rank Gems, the Rank name in its color, "×N", and Extract (wood, with the Essence icon and "+N"); a row with copies has a brighter plate. The Base Rank row also has Craft (wood, its Essence cost, or "Need" and the Essence that is missing), or a lock chip "Opens at level 6". Between two rows, the rung: two wood rails and the gold Combine button, "2 → 1" and its Coin, or "Need 2 copies" or "Need 1s 50c" when it is off. A row or a rung under the pointer or the focus shows its Rank on the card. On a short screen, the card and the path are a column at the left of the ladder, the rows are 26px and the rungs 22px, and Extract shows only its icon and amount.
- **Feedback:** a Combine or a Craft turns the card over to the new copy (`workshop-flip`, 420ms) with the Rank burst of the Pack reveal behind it, plays the anvil sound (and the Rank chime for Rare and up), and the changed copy count hops once (`workshop-count`). The card keeps the new copy until the Player moves the pointer or the focus to a row. The Coin counts down and the Essence counts up on the Balance Plate in 700ms. After a Combine, the focus stays on the same Combine while it is on, else it goes to the next rung. With reduced motion, there is no turn and no burst, and the numbers change at once.
- **Extract dialog:** a parchment dialog. It names each saved Deck that uses the copy, and it tells in dark red text (as the Deck Slot dialog) that an Epic or a Legendary copy costs much to get again. **Keep** (wood) takes the focus; **Extract** is gold.

### Hero screen

- **Hero screen:** the inside of the Barracks. The Barracks Building in the Town (its label is "Hero") and the Hero shortcut open it from Player level 5; before that, the Building has its Lock Plate and the shortcut its lock. The painting (Town Concepts 11, 3:2) is at the size that covers the screen, as the Workshop, on a `#24170f` back color. A shade makes the center a little dim and the top and bottom edges darker, so the plates and the Town Bar stay easy to read. Until the painting exists, a **timber wall** in code holds its place: dark planks of the Town Bar wood (`#3b2616` to `#24170d`) with a seam every 7.5vw, two heavy beams with a lit top edge, a warm light from the upper left, and a stone floor in shadow. It is calm and has no ambient motion. At the top left, a HUD plate (44px high, 36px on a short screen) holds a helmet glyph in `ready-gold` and the Cinzel 700 title "Hero" in `gold-light`, the name of the shortcut and of the Building label. The Balance Plate is at the top right. The screen fades in over 300ms.
- **Layout:** the Hero plate, the Forge Stone plate and the Gear Rack are one column, at most 1080px wide, centered on the calm wall between the top plates and the Town Bar, with 12px between them (8px on a short screen). Each plate is only as tall as its content. A phone in landscape uses the full width less the safe-area insets.
- **Hero plate:** a HUD plate across the column. At the left, the **Class seal**: the Class glyph in `ink` on the radial `parchment` plate of the Skill Card emblem, 56px (36px on a short screen), with a 3px `bronze-rim` rim and the Piece Drop. There are no Class colors. Then the Class name in Cinzel 700 at 20px in `gold-light`, and under it "Active Deck: name" in 13px `cream-dim`, cut with an ellipsis when it is long. The Hero has the Class of the Active Deck. Then **Change Deck**, a small wood button with the cards glyph, which opens the Deck dialog over the screen. After a 2px `gold-trim` divider at 25% comes the **Hero HP**: a heart in `heart-red` on a 40px round dark badge with a `bronze-rim` rim, the label "Hero HP" in Inter 700 12px `cream-dim` (for screen readers only on a short screen), the total in Inter 900 at 28px (18px) with tabular figures, and the sum line after it in Inter 600 13px `cream-dim`: "= 30 base + 7 level + 5 × 2 Armor".
- **Forge Stone plate:** a slim HUD plate under the Hero plate, only as wide as its content, with "Forge Stones" in Inter 700 12px `cream-dim` and the 5 tiers in a row, 16px apart, that wrap on a narrow screen: the **Forge Stone icon** (a cut stone with a light top face and a dark right face, in the Card Rank color of its tier, with a 1.6px `#1c140e` outline and the Piece Drop) at 20px, the tier name in Inter 600 13px `cream-dim` and the count in Inter 900 16px `cream` with tabular figures. A count of 0 is at 60% opacity. The tier name always shows, so the color is never the only cue. On a short screen, the icon is 14px and the text is 10px to 12px ([ADR-0038](./docs/adr/0038-gear-upgrades-need-earn-only-forge-stones.md), [ADR-0039](./docs/adr/0039-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)).
- **Gear Rack:** 4 Gear plates in one row, equal in width and height, 12px apart (8px on a short screen), in the order Weapon, Armor, Trinket, Banner. Each one is a HUD plate with, from the top: the icon, the name, the level groove, the stat, and the upgrade at the bottom edge. The **icon** is 96px (44px on a short screen): the painted Gear icon (256 × 256 WebP) with the Piece Drop as `drop-shadow`, or, until a person paints it, the Gear glyph in a warm cream (`#f3e6c4`) on a round badge with the dark radial plate, a 3px `bronze-rim` rim and the Piece Drop. The Weapon sword turns 45°, because an upright sword reads as "!". The Armor is the breastplate glyph and the Trinket the amulet glyph. The **name** is Cinzel 700 at 18px in `gold-light`. The **level groove** is a React Aria meter: the label "Level" in Inter 700 12px `cream-dim`, and "8 / 20" with the level in Inter 900 at 20px `cream` and "/ 20" at 14px `cream-dim`. Under them, a well cut into the plate (`#120c08` at 80%, a 6px corner, an inner shadow and a light lower lip) holds 20 notches in 2 rows of 10, 10px high (6px on a short screen), 3px apart, with a 2px corner. A notch up to the level is gold (`gold-light` to `gold`, with a light top edge). The others are `plate-socket` with an inner shadow. The **stat** row has the stat name in 12px `cream-dim`, then the value now in Inter 900 at 16px `cream`, an arrow in `gold-trim`, and the value at the next level in `gold-light`, with tabular figures: "4% → 4.5%", or "+10 → +11" for the Hero HP of the Armor. A chance shows as a percent in the language of the Player, with up to 2 decimals ("0.75%"). Under it, one help line in 12px `cream-dim` tells what the stat does. Above the upgrade, the **stone cost** line: the Forge Stone icon (16px) and "1 × Rare Forge Stone" in Inter 700 12px `cream`, and at the right "You have N" in Inter 600 `cream-dim`, or in `#ff9b85` when N is 0 (for screen readers only on a short screen). It is not there at level 20. The **upgrade** is one gold button across the plate, 44px high: "Upgrade" in Inter 700 and the Coin price in coin icons. Each press adds 1 level at once, with no confirmation.
- **Upgrade states:** **Ready** is the gold button. **Off for Coin** is an engraved plate: `#120c08` at 70%, a 2px `gold-trim` border at 50%, an inner shadow, no drop and no press. It says "Need" in Inter 600 `cream-dim` and the missing Coin in coin icons in Inter 700 `cream`. **Off for a Forge Stone** (the Coin is enough) is the same engraved plate with the Forge Stone icon and "Need Forge Stone". When both are missing, the button shows the Coin, and the stone cost line shows the red "You have 0". **Level 20** is the same engraved plate with a check and "Max level" in `gold-light`. At level 20 the stat row shows only the value now, and a **Max seal** sits at the lower right of the icon: "MAX" in Inter 900 at 11px with 0.04em letter spacing, `ink-on-gold`, on a gold capsule (`gold-light` to `gold`, a 2px `gold-deep` border, a 2px drop).
- **Exception to the Disabled button:** on the Hero screen, an upgrade that is off does not use the shared Disabled look (45% opacity and grayscale). It is the engraved plate above, with full-contrast text and a normal pointer, so that the missing Coin, the missing Forge Stone and "Max level" stay easy to read (WCAG 2.2 AA). The button is still disabled for the pointer, the keyboard and screen readers.
- **Feedback:** an upgrade plays 5 short beats at the same time. The new notch flashes as it fills: it grows to 190% of its height, 90% brighter, with a `ready-gold` glow, and settles (`gear-notch`, 520ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`). The level number hops once (`workshop-count`, 420ms). The value now rolls up into its place from below and fades in (`gear-roll`, 320ms). The plate glows one time: a `ready-gold` glow and a `gold-light` inner line that peak at 25% and fade (`gear-glow`, 900ms, ease-out). The `gearUp` sound plays: a lighter strike of the anvil iron, then a second, higher ring, so the Player hears one level up. The Coin counts down on the Balance Plate in 700ms, and after an Armor upgrade the Hero HP total counts up in 700ms too. When an item gets to level 20, the Rare chime plays 180ms after the strike, and the Max seal stamps on (`pack-stamp`, 380ms). A screen reader hears "Weapon is now level 10. Unit Crit: 5%." With reduced motion, the notch, the number, the stat and the plate do not move or glow, the seal does not stamp, and the numbers change at once. The sounds follow the Sound setting.
- **Focus:** after an upgrade, the focus stays on the same upgrade while it is on. Else it goes to the next upgrade that is on, to the right and then from the left end, else to the rack. So the Player can upgrade again and again with the keyboard, as after a Combine in the Workshop. While the pointer or the keyboard focus is on an upgrade that is on, the next notch of its groove shows a faint gold edge (`gold-light` at 85%, 1.5px, inside). Touch does not show it.
- **Short screen:** the top plates are 36px high. The Hero plate is one tight row with the 36px seal, 14px text, a compact Change Deck and the Hero HP at 18px with its sum line. In each Gear plate, the 44px icon and the 14px name are one row, the groove is 8px, the help line is for screen readers only, and the upgrade is 32px high with 12px text.
- **Gear Hint:** the first time that the Hero screen opens, the Gear Hint shows below the Weapon upgrade (above it when there is no space), so that the Hero plate stays clear. Its seal is the painted `hero` shortcut icon. "Read more" opens the Gear Entry. It closes when the Hero screen closes.
- **Gear Entry (Handbook):** in the Progress Chapter, with the breastplate glyph as its icon. After the rule text, a ruled table "The 4 Gear items": each item with its glyph in `frame-wood` (the Weapon turned 45°), the stat that it gives, and the value at level 25 in Inter 900 with tabular figures, with `parchment-rule` lines at 70% between the rows. Then "Coin and Forge Stone for each level" in the `#f1e2c2` well of the Lane strip (a 2px `parchment-rule` border, a 12px corner, an inner shadow): a grid of 5 columns, each with the 12px Forge Stone icon of its tier, "Level N" and its Coin price in coin icons in Inter 900. Under the grid, a legend gives each tier with its icon and its levels ("Common Forge Stone: levels 1 to 5"), and a line gives the total Coin and Forge Stones from level 0 to 25. The numbers come from the rules, so the Entry follows a balance change.

### Motion

Motion is short, physical and gives information. Buttons react in 100ms. A drawn card flies from the Deck Pile to its Hand Slot, and a card drops onto the Graveyard Pile with a short flash. Both use `cubic-bezier(0.2, 0.8, 0.2, 1)` and take the time of their Battle event, so they keep time with the Battle speed. Banners and dialogs fade and zoom in from 95% in 200ms to 300ms. A Hint grows out of the tip of its pointer, which touches its subject: it starts at half size, 8px nearer the subject, lifts away, and settles from 102% (`hint-pop`, 320ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`). Its shadow grows as it lifts. The close plays the same keyframes in reverse in 180ms, back into the pointer, and the Hint stays where it is while it closes. With no anchor, it grows up from its bottom center. The Settings dialog comes up out of the Settings button: it starts at the size of the icon, tilted 6° toward the center of the screen, lifts off the shelf faster than it moves to the side, so its path curves, and grows and comes level on the way (`settings-sheet-*`, 460ms). Its shadow grows as it lifts, and its text shows when it is large enough to read. The close plays the same keyframes in reverse in 260ms, back into the button, and the scrim fades with it. A Skill Card cast, of either Side, has 3 beats that follow its Battle events. In the reveal, the card comes out of the caster's Hand to the caster's side of the screen with a flare of the effect color (an enemy card turns from its Card Back to its face), its name shows on a Night Plate with a border in the Side color, the caster Hero rises in the effect color, the target Squares light up from the caster's side, and a spell bolt flies to them. In the resolve, the card and the Squares stay lit while the effect hits. In the settle, a chip says where the card goes ("Back to the Hand" on gold, or "Graveyard" on a Night Plate), and the card goes back into the Hand or falls away. With reduced motion, the card only fades and the Squares light up together. A summoned Token hops from the Square of the Unit that summoned it to its own Square, grows from 35% and fades in, with the summon ring of its Side (420ms). In a Rebirth, the Unit falls as in a death, then gets up again in its Square with a pale teal light, a pale ring and the heal light (640ms). When a Rally Unit gives its bonus, it pulses: it grows to 114%, lifts a little and shines `ready-gold` in the first 40% of the beat. Then each target gets a soft `ready-gold` light, and the Attack number at its feet counts up to the new value (560ms). The end of the bonus has no beat. With reduced motion, the Rally Unit only shines and the number changes at once. When a Keyword occurs, a Keyword Plate shows over its Unit at the same time as the result, and the Battle does not wait for it: a small Night Plate with a border in the Side color and the Keyword name and value in Inter 700 `cream` ("Swarm 2"). It sits above the Status Badge and follows the Unit (a Last Breath plate stays on the Square). It grows in over 120ms, rises a little and fades in its last 25%, in 1.1s (0.7s at ×2). A new plate on the same Unit goes under the older plates and pushes them up, with at most 3. Skip and the Battle Log show no plates. With reduced motion, the plate shows at full size, does not rise, and fades out. In the Town, a selected Building zooms in by 12% and fades in 450ms. The Town has slow ambient motion (clouds, chimney smoke, light on the water). With reduced motion, all of it stops.

On the Packs screen, the lamps breathe on a 5.5s loop (`shop-lamp`), and 8 specks of dust drift up and fade in the window light (`shop-mote`, 8s to 13s). A Pack Stand lifts its Pack 4px under the pointer, and a line of light goes across the Pack (`shop-sheen`, 900ms); the Pack image is its mask, so the light only touches the Pack. When a Pack opens, the Pack lifts and shakes (`pack-shake`, 520ms). Then it tears on a zigzag line near its top: the top strip flies up and off (`pack-tear-top`, 520ms), the body drops away (`pack-tear-body`, 480ms), and a light comes out of the tear (`pack-burst`, 800ms). The light has the color of the best card in the Pack when it is Rare or higher, else a warm lamp light, so the Player knows what is coming. A paper tear sounds with it. Then the 5 Card Backs fan out of the place of the Pack to their places, turned and small at the start, 90ms apart (`pack-fan`, 560ms, `cubic-bezier(0.16, 1, 0.3, 1)`). A Rank halo pulses on a 1.6s loop (`pack-glow`). A Card Back under the pointer lifts and turns 2°. A flip turns the card on its vertical axis in 500ms, with a short turn sound; "Reveal all" starts each flip 140ms after the one before it. When the face shows (200ms into the flip), a light grows with the Rank, behind the card: Uncommon has a ring in the card shape (`pack-ring`); Rare a ring and a burst of its color (`pack-burst`); Epic adds rays that turn a little as they fade (`pack-rays`, 1300ms); Legendary has all of them larger, a second ring, and the card jumps to 110% (`pack-pop`). A Rare, Epic or Legendary face has a chime that grows with the Rank (two notes, four notes, then a rising run with a shimmer). The sounds follow the Sound setting. The NEW chip stamps onto the card (`pack-stamp`, 380ms). The name comes up 6px under its card after the flip (`pack-name`, 300ms). With reduced motion, the lamps and the dust are still, the Pack does not open, the faces show at once with no halo, flip, light or stamp, and Open ×10 goes straight to the grid.

The Campaign screen fades in over 300ms. The Stage Markers then rise onto their clearings in Trail order (`campaign-marker-in`): each one comes down 14px from 86% size and fades in, in 480ms with `cubic-bezier(0.2, 0.8, 0.2, 1)`, 55ms after the marker before it. The walked part of the Trail draws in from the Trail entry (`campaign-trail-draw`, 1100ms, `cubic-bezier(0.3, 0.7, 0.2, 1)`). The Open marker pulses: its halo grows and fades on a 2.4s loop (`town-gate-pulse`), and its ground ring ripples out from 55% to 125% and fades on the same 2.4s loop (`campaign-ripple`). When the Campaign first shows a Stage that a win just opened, that shield wakes up one time, after 600ms: it grows from a grey 70% to a bright 116% and settles in 900ms (`campaign-awaken`), and a 4px `focus-cream` ring expands and fades in 1100ms (`campaign-awaken-ring`). With reduced motion, all of it stops: the markers and the Trail show at once, with no pulse, ripple or wake-up.

## Do's and Don'ts

### Do:

- **Do** put all text on a flat area: `cream` on a `night-plate`, or `ink` on `parchment`, at WCAG 2.2 AA contrast.
- **Do** give each panel one gold action. Use wood for the second action and ghost for small controls over the Board.
- **Do** give every interactive piece the 4px `focus-cream` ring, the Piece Drop and the 1px press.
- **Do** show a Rank with its gems and a Damage Type with its icon, every time.
- **Do** size card parts in `em`, and set the card size with the font size of the parent.
- **Do** give every new component a compact form for `@media (max-height: 500px)`, and respect the safe-area insets.
- **Do** stop all motion when the Player asks for reduced motion.
- **Do** keep the art bright, warm and lit from the upper left, as art direction 5 asks.

### Don't:

- **Don't** make the game dark, realistic, gory, noisy or neon.
- **Don't** use the blue primary, the zinc greys or the light/dark switch of the base component theme on a game screen.
- **Don't** put text directly on wood grain, a bronze gradient, or a painting. On the Board, damage numbers and the Unit line use a dark outline.
- **Don't** use Cinzel for rules text, Keywords, numbers, or any text under 14px.
- **Don't** show a Rank, a Damage Type or a side by color alone.
- **Don't** add a glow to a piece that is not Ready, active or selected.
- **Don't** use soft, blurred shadows on buttons. They have a hard drop.
- **Don't** cover a Square or a Unit stat with a HUD piece, a panel or an effect.
- **Don't** use the Tutorial teal for anything except the Tutorial.
