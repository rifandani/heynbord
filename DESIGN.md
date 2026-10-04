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
  wood-light: "#7a5233"
  wood: "#563720"
  wood-edge: "#2a1a0c"
  frame-wood: "#5b3a1e"
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
  battle-sky: "#a9cdee"
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
    width: "min(250px, 44vw)"
  card-frame:
    backgroundColor: "{colors.bronze}"
    rounded: "{rounded.card}"
    padding: "0.36em"
    width: "9em"
    height: "12.6em"
  town-shortcut:
    backgroundColor: "{colors.wood}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    width: "64px"
    height: "56px"
  town-shortcut-current:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.lg}"
    width: "64px"
    height: "56px"
---

# Design System: Heynbord

## Overview

**Creative North Star: "The Tabletop Diorama"**

Heynbord is a painted fantasy card game in a small 3D diorama. The Board is a game table, the Units are figures on it, and every 2D control is a real game piece on the edge of that table: a wooden tray for the Hand, bronze frames for the cards, a leather Card Back, gold tokens for the actions, and parchment sheets for the rules. The world is bright, warm, clear, handmade and a little funny, like a classic adventure story. The UI never tries to be a web app around a game. It is part of the game box.

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

The palette is warm workshop material (gold, bronze, wood, parchment, ink) on a bright painted sky, with fixed game colors for Races, Ranks and Damage Types.

### Primary

- **Guild Gold** (`gold`, with `gold-light` at the top of its gradient and `gold-deep` as its border): the one main action of a panel (End Turn, Start Battle, Retry, Got It), the selected state of a toggle such as speed ×2, and the current Town Bar shortcut. Earned Stars use it too.
- **Ready Gold** (`ready-gold`): the "Your Turn" chip and banner, the Building labels in the Town, a Ready Countdown, and the Holy Damage Type.
- **Focus Cream** (`focus-cream`): the 4px focus ring, and the ring on a selected Hand Card. Nothing else uses it.
- **Gilded Trim** (`gold-trim`): thin borders on dark HUD plates and tooltips, at 70% opacity, and small lock icons.

### Secondary

- **Tavern Wood** (`wood-light` to `wood`, with `wood-edge` as its border): the default button, and the open Town Bar shortcuts. The Hand Bar and the Town Bar use deeper wood gradients from the same family, with a faint grain.
- **Frame Wood** (`frame-wood`): the thick 4px border of parchment dialogs and panels, and the plate behind a Deck class icon.
- **Warm Bronze** (`bronze`, with `bronze-rim` for badge rims): the shared card metal (a 5-stop gradient from `#f7dc9c` to `#8a5a20`), the rim of every round badge, the top edge of the Hand Bar, and the border of the Details Panel.

### Tertiary

- **Banner Red** (`enemy-red`, with `enemy-deep` as its border): the enemy side. The enemy Hero border, the "Enemy Turn" chip and banner, and enemy Unit bases.
- **Blood Banner** (`blood-banner`): the "Defeat" title and the Boss chip.
- **Keyword Rust** (`keyword-rust`): Keyword names in the Details Panel.
- **Victory Amber** (`victory-amber`): the "Victory" title on parchment.
- **Tutorial Teal** (`tutorial-teal` for the label text, `tutorial-glow` for the highlight ring): only the Tutorial. It is the one cool accent, so a Tutorial mark never looks like a game state.
- **Hero HP** (`hp-full`, `hp-low`): the Hero HP bar. It changes to `hp-low` at 30% HP or less, and the number always shows next to it.
- **Heart Red** (`heart-red`): the HP icon on a card.

### Game colors

These come from art direction 4. `apps/web/src/features/battle/palette.ts` holds them with their light and dark shades.

- **Race:** `human-blue` (second color gold), `elf-green` (second color warm brown), `undead-teal` (second color bone white), `orc-orange` (second color dark red). A Creature Card shows its Race color on the name banner and the emblem.
- **Rank:** `rank-common` grey, `rank-uncommon` green, `rank-rare` blue, `rank-epic` purple, `rank-legendary` orange. A card shows its Rank color only on the Rank Gems and the art window trim.
- **Damage Type:** `damage-physical` white with a sword, `damage-fire` orange-red with a flame, `damage-frost` light blue with a snowflake, `damage-holy` gold with a sun.
- **Side:** the player is gold (`#f2c14e`), the enemy is red (`#d9463b`), on Unit bases and Hero panel borders.

### Neutral

- **Parchment** (`parchment`): dialogs, the Details Panel, the Tutorial panel and option cards. `parchment-deep` is the larger panel under option cards, `parchment-lit` is a selected option, and `parchment-rule` is the border of an option that is not selected.
- **Ink** (`ink`): all text on parchment. `ink-soft` is secondary text (a Stage subtitle, a Deck description), `ink-faded` is reminder and flavor text, and `ink-on-gold` is the text on a gold button or chip.
- **Night Plate** (`night-plate`): the dark HUD surface, at 70% to 95% opacity: the Turn badge, the Hero panels, tooltips, ghost buttons, the portrait guard. `plate-ember` is the bright center of a round badge, and `plate-socket` is a key cap or an enemy Countdown.
- **Cream** (`cream`): all text on a dark plate or on wood. `cream-dim` is secondary text on a dark plate.
- **Sky** (`town-sky`, `battle-sky`): the back color of the Town and the Battle while their paintings load.

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
- **Title** (Cinzel 700, 1.125rem, 1.25): panel labels, the Tutorial step title, Stage and Deck names, the End Turn and Start Battle labels, the Key Guide title, and the Building labels in the Town (at least 14px, scaled with the painting).
- **Body** (Inter 400, 0.875rem, 1.375): the Details Panel, the Tutorial text, the dialog text. Keywords are Inter 700 in `keyword-rust`.
- **Body Small** (Inter 400, 0.75rem, 1.375): reminder text, Deck descriptions, the Key Guide list. Flavor text is the same size in italic.
- **Label** (Inter 700, 0.75rem, 0.025em, uppercase): small section labels such as "Tutorial". Town Bar shortcut names use Inter 700 at 11px, not uppercase.
- **Number** (Inter 900, tabular figures): Countdowns, Attack, HP, pile counts and the Turn number. On a card it is 1.2em to 1.3em of the card font size, with a small dark text shadow.

### Named Rules

**The Large Display Rule.** Cinzel is for titles and names at 14px or larger. Never use it for rules text, Keywords, numbers or paragraphs.

**The Big Number Rule.** A number that the Player plans with (a Countdown, Attack, HP) is Inter 900 with tabular figures, on its own badge or plate. It is the largest text on its piece.

## Layout

The Battle screen is a full-screen 3D Board with the 2D HUD at its edges. The Top Bar holds the player Hero at the top left, the Turn badge and the Battle controls at the top center, and the enemy Hero at the top right. The Hand Bar sits at the bottom center, and End Turn is at its right. The HUD containers let pointer events through (`pointer-events: none`), and only the pieces themselves take input, so the Board stays free. Toasts move to a narrow column at the bottom left, above the Hand Bar. Every edge respects `env(safe-area-inset-*)` with a 0.5rem minimum.

The Town is a 16:9 painting that covers the screen and crops its edges. Buildings and their labels have positions in painting coordinates, changed to percentages, so they stay on the painting at all sizes. The Town Bar is fixed to the bottom of every screen except the Battle. Panel screens such as the Campaign use a centered column of at most 1024px, with a 3:2 grid of two parchment panels from 768px.

Cards scale by font size. All Card Frame parts are in `em`: the card is 9em × 12.6em, so a 10px font gives a 90 × 126 px Hand Card, 7px gives 63 × 88 px on a short screen, and 20px gives the 180 × 252 px Card Details. The Hand Bar makes the card smaller still (`--hand-card-size`) so that 8 Hand Slots, both piles and End Turn fit the screen width.

Spacing follows a 4px step: 4px between small controls, 8px between pieces in a group and inside HUD panels, 12px inside parchment panels, 16px between screen sections, 20px inside dialogs.

### Named Rules

**The Short Screen Rule.** `@media (max-height: 500px)` is the phone-in-landscape layout. Every component has a compact form for it: smaller padding, one size smaller text, icon-only Town Bar shortcuts, and a 2-line End Turn label. A phone in portrait shows only a request to turn the phone.

**The Clear Board Rule.** No HUD piece, panel or effect may cover a Square or a Unit stat for longer than an action needs. Card Details and the Tutorial panel open at the sides of the Board, not on it.

## Elevation & Depth

Depth is physical, as on a real table. Pieces have a hard, short drop shadow with no blur, as if they are 3px thick. Card metal has an inset bevel: a light top edge and a dark bottom edge. Trays and empty slots are wells with an inner shadow. Large soft shadows are only for things that float over the Board: a dialog, the Card Details, the Hand Bar. Glow is a state, not a decoration. It shows a Ready card, the active Hero, a selected option, or a Building under the pointer.

### Shadow Vocabulary

- **Piece Drop** (`box-shadow: 0 3px 0 rgba(0,0,0,0.45)`): every button, Town Bar shortcut and HUD tooltip. When pressed, it changes to `0 1px 0 rgba(0,0,0,0.45)` and the piece moves down 1px.
- **Card Bevel** (`box-shadow: inset 0 0.1em 0 rgba(255,243,210,0.85), inset 0 -0.12em 0 rgba(60,30,5,0.75), 0 0.3em 0.7em rgba(0,0,0,0.55)`): the Card Frame and the Card Back.
- **Tray** (`box-shadow: inset 0 0.15em 0 rgba(255,214,150,0.3), inset 0 -0.3em 0.6em rgba(0,0,0,0.45), 0 0.6em 1.6em rgba(0,0,0,0.55)`): the Hand Bar.
- **Well** (`box-shadow: inset 0 0.35em 0.8em rgba(0,0,0,0.7), 0 0.08em 0 rgba(255,226,170,0.18)`): an empty Hand Slot or an empty pile.
- **Badge Drop** (`box-shadow: 0 0.12em 0.25em rgba(0,0,0,0.6)`): round card badges and stat plates.
- **Lift** (`filter: drop-shadow(0 10px 24px rgba(0,0,0,0.55))`): the Card Details over the Board.
- **Ready Glow** (`box-shadow: 0 0 18px 4px rgba(255,210,90,0.75)`): a Ready Hand Card.
- **Active Glow** (`box-shadow: 0 0 14px 2px rgba(255,215,90,0.6)`): the Hero panel of the side whose Turn it is.
- **Selected Halo** (`box-shadow: 0 0 0 3px rgba(226,169,59,0.45)`): a selected option card.
- **Building Glow** (`filter: drop-shadow(0 0 14px rgba(255,224,138,0.95))`): a Town Building under the pointer or the focus.
- **Tutorial Glow** (`box-shadow: 0 0 24px rgba(127,227,255,0.75)` with a 4px `tutorial-glow` ring): the part of the screen that a Tutorial step points to.
- **Bar Lift** (`box-shadow: 0 -4px 12px rgba(0,0,0,0.35)`): the Town Bar.

### Named Rules

**The Hard Drop Rule.** A piece that the Player can press casts a hard drop with no blur, and pressing it moves it down 1px. Soft, blurred shadows are only for things that float over the Board.

**The Glow Is State Rule.** A gold glow means Ready, active or selected. Never add a glow to a piece only to decorate it.

## Shapes

Shapes are rounded and friendly, never sharp and never pill-shaped buttons. Buttons, shortcuts and tooltips have gently curved corners (8px). HUD plates, option cards and the Tutorial panel are softer (12px). Dialogs and parchment panels are the softest (16px). Small chips and key caps are nearly square (4px). Badges, the HP bar and pile counts are full circles or capsules.

The card has its own shape language in `em`. The bronze frame has a 0.85em corner and the art window inside it has 0.55em. A Skill Card has an arched top on its art window, so its shape is different from a Creature Card. The name banner is a ribbon: a flat bar with a V-shaped notch cut into each end. Rank Gems are small squares turned 45° into diamonds, with a dark edge and a light top-left facet. The Heynbord emblem (two hexagon halves and a four-point star) is the mark on the Card Back and, faded, in each empty slot.

Borders are thick and part of the material: 2px on buttons and HUD plates, 3px to 4px on parchment panels and dialogs, and about 0.16em of bronze on card badges.

## Components

### Buttons

Chunky and tactile, like a wooden or gold game token.

- **Shape:** gently curved (8px), 2px border, Inter 600, minimum height 44px (36px small, 48px large, 40px square icon).
- **Gold:** a vertical gradient from `gold-light` to `gold`, a `gold-deep` border and `ink-on-gold` text. Only for the main action of a panel and for a selected toggle. A large gold button such as End Turn uses Cinzel.
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
- **Parchment panel:** `parchment-deep`, a 4px `frame-wood` border, a 16px corner, 12px padding. It holds a Cinzel label and a group of option cards.
- **Option card:** `parchment` with a 2px `parchment-rule` border and a 12px corner. When selected, it changes to `parchment-lit` with a `gold` border and the Selected Halo. Hover lifts it 2px.
- **HUD plate:** `night-plate` at 85%, a 2px border, a 12px corner. The Turn badge has a `gold-trim` border at 70%. A Hero panel has the color of its side as its border, a small light blur behind it, and the Active Glow during its Turn.
- **Tooltip:** `night-plate` at 95%, a 2px `gold-trim` border at 70%, the Piece Drop. 8px corner for a short label, 12px for the Key Guide.

### Inputs / Fields

The game screens have no text fields yet. Choices use option cards in a radio group (see above). The language control in the Town Bar still uses the base component on a white plate, until it gets the Heynbord theme.

### Navigation

- **Town Bar:** a dark wood bar (gradient `#4a2f1b` to `#2e1d10`) fixed to the bottom, with a 4px `wood-edge` top border and the Bar Lift. The Town shortcut is at the left, apart from the others, with a faint divider.
- **Shortcut:** a wood button (64 × 56 px) with a 24px icon over an 11px Inter 700 name. The current screen is gold. A screen that does not exist yet has no fill, `cream-dim` text at 60%, and a small `gold-trim` lock. It still takes focus, and its tooltip says it opens later. On a short screen, shortcuts are 44px squares with the icon only, and a long press shows the name.
- **Leave:** a square ghost button with a close mark at the top left of the Battle. Before a result, it opens a parchment dialog to confirm. After a result, it leaves at once.

### Card Frame (signature)

The center of the system. A bronze frame (Card Bevel) around the card art, with all parts in `em` so that one font size scales the whole card.

- **Countdown badge** at the top left: a round badge with a bronze rim on a dark radial plate, a faint hourglass, and the number in Inter 900. A Ready card has a gold radial face with dark text.
- **Emblem** at the top right: the Race color with a cream Race icon, or parchment with an ink Class icon on a Skill Card.
- **Name banner:** a ribbon in the Race color (or parchment for a Skill Card) with Inter 700 text that clamps to 2 lines, and the Rank Gems under it.
- **Stat plates** at the bottom corners: Attack with its Damage Type icon in the Damage Type color, and HP with a heart in `heart-red`. A Skill Card has one round effect badge at the bottom center.
- **Hand Card states:** a Ready card has the Ready Glow and lifts 8px on hover. A card that is not Ready is 82% bright and 70% saturated. A selected card lifts 12px and has a 4px `focus-cream` ring.

### Hand Bar (signature)

A wooden tray with a faint vertical grain and the Tray shadow, with a `bronze` top edge. From left to right: the Deck Pile (Card Backs with bronze edges under them), a bronze divider, 8 Hand Slots (empty ones are Wells with a faded emblem), a divider, and the Graveyard Pile. Each pile has a round count badge on the divider. End Turn is a large gold button outside the tray, at its right.

### Card Details

The Card Frame at 20px font size, with the Details Panel on its right: `parchment`, a 3px `bronze` border with no left side, a 12px corner on the right only, and the Lift. It shows the Race or Class line, a stat row with icons, Keywords, and the flavor text in italic at the bottom, with `#c9a46a` rules between the groups.

### Motion

Motion is short, physical and gives information. Buttons react in 100ms. A drawn card flies from the Deck Pile to its Hand Slot, and a card drops onto the Graveyard Pile with a short flash. Both use `cubic-bezier(0.2, 0.8, 0.2, 1)` and take the time of their Battle event, so they keep time with the Battle speed. Banners and dialogs fade and zoom in from 95% in 200ms to 300ms. In the Town, a selected Building zooms in by 12% and fades in 450ms. The Town has slow ambient motion (clouds, chimney smoke, light on the water). With reduced motion, all of it stops.

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
- **Don't** put text directly on wood grain, a bronze gradient, a painting or the 3D scene.
- **Don't** use Cinzel for rules text, Keywords, numbers, or any text under 14px.
- **Don't** show a Rank, a Damage Type or a side by color alone.
- **Don't** add a glow to a piece that is not Ready, active or selected.
- **Don't** use soft, blurred shadows on buttons. They have a hard drop.
- **Don't** cover a Square or a Unit stat with a HUD piece, a panel or an effect.
- **Don't** use the Tutorial teal for anything except the Tutorial.
