# web

React app on TanStack Start. The server renders and streams each page.

## Language

### Internationalization

**Locale**: A lowercase BCP-47 language tag that selects which Message Catalog to use (`en-us`, `id-id`). The server picks it for each request: the `app-locale` cookie, then `Accept-Language`. _Avoid_: language, languageCode, lng, resolvedLanguage

**Message Catalog**: The set of Translation Keys and strings for one Locale, owned in `apps/web/src/core/libs/i18n`. _Avoid_: resources, locale JSON, dictionary, i18n file

**Translation Key**: A flat identifier into a Message Catalog (e.g. `welcome`, `title`). _Avoid_: nested namespaces, i18next paths

**Translation Provider**: React glue that reads the current Locale and exposes `t` / `setLocale`. _Avoid_: I18nextProvider, react-i18next

### Errors

**Error Envelope**: The `{ message }` body the API returns on a failed request. Present on most failures, absent on some — a caller may never assume it parsed. _Avoid_: error response, error body, error payload

### Card presentation

**Card Frame**: The border, badges and plates around the card art. All cards share one frame metal. The Race or Class shows on the name banner and the emblem, and the Rank shows only on the gems and the inner trim. A Skill Card has a variant shape of the frame. _Avoid_: card template, border, card skin

**Hand Card**: The small card in the Hand. It shows the art, the Countdown, the name, the Rank gems, the emblem, and Attack and HP for a Creature Card. _Avoid_: card face, mini card, card thumbnail

**Card Details**: A larger copy of a card with a Details Panel next to it. It shows on hover, long press and keyboard focus for a Hand Card and for a Unit on the Board of either Side, and in the Collection. For a Unit, the card shows the current Attack and HP of the Unit, and the Details Panel shows how the Unit is different from its card. _Avoid_: tooltip, card popup, card info, inspect view

**Details Panel**: The text panel next to the card in the Card Details. It shows the fields that the card itself does not show, for example Keywords and flavor text. _Avoid_: side panel, info box, ability box

**Rank Gem**: One pip on the Card Frame, in the Rank color. A card shows 1 Rank Gem for Common and 5 for Legendary. _Avoid_: star, pip socket

**Hand Bar**: The panel at the bottom of the Battle screen. It holds the Deck Pile at the left, the Hand Slots in the middle and the Graveyard Pile at the right. _Avoid_: card tray, footer, hand panel

**Hand Slot**: One of the 8 places for a Hand Card in the Hand Bar, one for each card that the Hand can hold. An empty Hand Slot shows that the Hand has room for one more card. _Avoid_: card socket, placeholder

**Card Back**: The face-down side of a card. All cards share one Card Back. _Avoid_: sleeve, card cover

**Deck Pile**: The stack of Card Backs in the Hand Bar, with the number of cards in the Deck. It never shows which cards are in the Deck. _Avoid_: draw pile, library

**Graveyard Pile**: The stack in the Hand Bar that shows the last card that went into the Graveyard, and the number of cards in the Graveyard. _Avoid_: discard pile

### Battle screen

**Top Bar**: The panel at the top of the Battle screen. It holds the two Heroes, the Turn number, the Battle controls and the Key Guide button. _Avoid_: header, HUD top, status bar

**Battle Painting**: The painted ground and background behind the Board, one for each Region. It is a flat 2D image, not a 3D scene. The Squares are not drawn on it. _Avoid_: stage background, backdrop, arena, battlefield map, Board skin

**Key Guide**: The list of the keys that play a full Battle and what each key does. It opens from the info button in the Top Bar, on hover, on keyboard focus and on press. _Avoid_: keyboard help, hotkeys, shortcuts, accessibility info, controls hint

### Town

**Town**: The hub screen of the game, and the first screen that the Player sees. It is a painted view of a town, with one Building for each screen that the Player can open. _Avoid_: Camp, city, hub, home, lobby, main menu

**Building**: One place in the Town that opens one screen when the Player selects it. A Building that has no screen yet is only decoration: it has no label and the Player cannot select it. In v1, only the Town Gate can be selected. _Avoid_: hotspot, landmark, location, house

**Town Gate**: The Building that opens the Campaign: a large gate with a road that goes out of the Town. _Avoid_: Campaign Building, map house, exit

**Town Bar**: The panel at the bottom of the Town and of each screen except the Battle. It has one shortcut for each screen that has a Building, the screens that do not exist yet too, and a shortcut back to the Town. _Avoid_: menu bar, nav bar, footer, dock

### Component Catalog

**Component Catalog**: The single page at `/master-design` that displays every core UI component for visual inspection by developers and designers. It is available in development. A production build answers 404. _Avoid_: master design, styleguide, storybook, docs site

**Component Entry**: One component's place in the Component Catalog — its Category membership, its nav item, and its section of the page. _Avoid_: item, doc, page

**Variant Showcase**: One rendered example within a Component Entry, demonstrating a single combination of a component's props. _Avoid_: demo, example, story

**Category**: A named grouping of Component Entries (Buttons, Overlays, Charts, …) that determines both nav grouping and page order. _Avoid_: group, section, tag
