# web

React app on TanStack Start. The server renders and streams each page.

## Language

### Internationalization

**Locale**: A lowercase BCP-47 language tag that selects which Message Catalog to use (`en-us`, `id-id`). The server picks it for each request: the `app-locale` cookie, then `Accept-Language`. _Avoid_: language, languageCode, lng, resolvedLanguage

**Message Catalog**: The set of Translation Keys and strings for one Locale, owned in `apps/web/src/core/libs/i18n`. _Avoid_: resources, locale JSON, dictionary, i18n file

**Translation Key**: A dot path to one string in a Message Catalog (e.g. `welcome`, `keywords.trample`, `cards.goblin.ankleSnatcher.name`). Game data builds some Translation Keys from IDs. _Avoid_: message ID, i18next paths

**Translation Provider**: React glue that reads the current Locale and exposes `t` / `setLocale`. _Avoid_: I18nextProvider, react-i18next

### Errors

**Error Envelope**: The `{ message }` body the API returns on a failed request. Present on most failures, absent on some — a caller may never assume it parsed. _Avoid_: error response, error body, error payload

### Card presentation

**Facing**: The advance direction of a Creature Card painting. The painting advances to the right of the image, and an enemy Unit on the Board is a horizontal mirror of that painting. _Avoid_: flip, orientation

**Card Frame**: The border, badges and plates around the card art. All cards share one frame metal. The Race or Class shows on the emblem, and the Rank shows only on the gems and the inner trim. The card name is not on the frame. A Skill Card has a variant shape of the frame. _Avoid_: card template, border, card skin

**Hand Card**: The small card in the Hand. It shows the art, the Countdown, the Rank gems, the emblem, and Attack and HP for a Creature Card. _Avoid_: card face, mini card, card thumbnail

**Card Details**: A larger copy of a card with a Details Panel next to it. It shows on hover, long press and keyboard focus for a Hand Card and for a Unit on the Board of either Side, and in the Collection. For a Unit, the card shows the current Attack and HP of the Unit, and the Details Panel shows how the Unit is different from its card. _Avoid_: tooltip, card popup, card info, inspect view

**Details Panel**: The text panel next to the card in the Card Details. It starts with the card name, then the fields that the card itself does not show, for example Keywords and flavor text. _Avoid_: side panel, info box, ability box

**Rank Gem**: One pip on the Card Frame, in the Rank color. A card shows 1 Rank Gem for Common and 5 for Legendary. _Avoid_: star, pip socket

**Hand Bar**: The panel at the bottom of the Battle screen. It holds the Deck Pile at the left, the Hand Slots in the middle and the Graveyard Pile at the right. _Avoid_: card tray, footer, hand panel

**Hand Slot**: One of the places for a Hand Card in the Hand Bar, one for each Card up to the Hand Limit. An empty Hand Slot shows that the Hand has room for one more card. _Avoid_: card socket, placeholder

**Card Back**: The face-down side of a card. All cards share one Card Back. _Avoid_: sleeve, card cover

**Deck Pile**: The stack of Card Backs in the Hand Bar, with the number of cards in the Deck. It never shows which cards are in the Deck. _Avoid_: draw pile, library

**Graveyard Pile**: The stack in the Hand Bar that shows the last card that went into the Graveyard, and the number of cards in the Graveyard. _Avoid_: discard pile

### Battle screen

**Top Bar**: The panel at the top of the Battle screen. It holds the two Heroes, the Turn number, the Battle controls and the Key Guide button. _Avoid_: header, HUD top, status bar

**Battle Painting**: The painted ground and background behind the Board, one for each Region. It is a flat 2D image, not a 3D scene. The Squares are not drawn on it. _Avoid_: stage background, backdrop, arena, battlefield map, Board skin

**Status Badge**: The row of Status icons above a Unit on the Board, each with its count when the Status has one. It shows at most 3 Statuses, then "+N". The Details Panel shows the full list and the rules text. _Avoid_: debuff bar, buff icons, status bar, status icons

**Key Guide**: The list of the keys that play a full Battle and what each key does. It opens from the info button in the Top Bar, on hover, on keyboard focus and on press. _Avoid_: keyboard help, hotkeys, shortcuts, accessibility info, controls hint

### Town

**Town**: The hub screen of the game, and the first screen that the Player sees. It is a painted view of a town, with one Building for each screen that the Player can open. _Avoid_: Camp, city, hub, home, lobby, main menu

**Building**: One place in the Town that opens one screen when the Player selects it. A Building that has no screen yet is only decoration: it has no label and the Player cannot select it. In v1, only the Town Gate can be selected. _Avoid_: hotspot, landmark, location, house

**Town Gate**: The Building that opens the Campaign: a large gate with a road that goes out of the Town. _Avoid_: Campaign Building, map house, exit

**Town Bar**: The panel at the bottom of the Town and of each screen except the Battle. It has one shortcut for each screen that has a Building, the screens that do not exist yet too, and a shortcut back to the Town. _Avoid_: menu bar, nav bar, footer, dock

**Balance Plate**: The plate in the top-right corner of the Town that shows the Coin, Essence and Heynstone balances of the Player. Each balance tells what it pays for on hover, focus and tap. It shows information only. _Avoid_: wallet, purse, currency bar, resource bar

### Campaign screen

**Region Map**: The painted map of one Region, with its Trail and its Stage Markers. The Campaign screen shows one Region Map at a time. It is a flat 2D image. _Avoid_: Campaign map, world map, level map, stage map, battlefield map

**Trail**: The road on a Region Map from the first Stage to the Boss Stage, with one stop for each Stage. _Avoid_: path, route, track

**Stage Marker**: The mark on the Trail for one Stage. It shows the state of the Stage, and the Player selects it to play that Stage. _Avoid_: checkpoint, node, pin, level button

**Stage Panel**: The dialog that opens when the Player selects a Stage Marker. It shows the Stage, its enemy Hero, its rewards, the best Stars and the Deck, and it starts the Battle. _Avoid_: stage popup, stage details, pre-battle screen, lobby

### Component Catalog

**Component Catalog**: The single page at `/master-design` that displays every core UI component for visual inspection by developers and designers. It is available in development. A production build answers 404. _Avoid_: master design, styleguide, storybook, docs site

**Component Entry**: One component's place in the Component Catalog — its Category membership, its nav item, and its section of the page. _Avoid_: item, doc, page

**Variant Showcase**: One rendered example within a Component Entry, demonstrating a single combination of a component's props. _Avoid_: demo, example, story

**Category**: A named grouping of Component Entries (Buttons, Overlays, Charts, …) that determines both nav grouping and page order. _Avoid_: group, section, tag

## Relationships

- Each selectable **Building** opens one screen for a rules term. The Town Gate opens the Campaign. Later, the Workshop Building opens the Workshop, and the Bazaar Building opens the Bazaar.
- A **Creature Card** painting has one **Facing**. The Board mirrors that painting for an enemy **Unit**.
