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

**Card Details**: A larger copy of a card with a Details Panel next to it. It shows on hover, long press and keyboard focus for a Hand Card and for a Unit on the Board of either Side, and in the Deck builder. For a Unit, the card shows the current Attack and HP of the Unit, and the Details Panel shows how the Unit is different from its card. _Avoid_: tooltip, card popup, card info, inspect view

**Details Panel**: The text panel next to the card in the Card Details. It starts with the card name, then the fields that the card itself does not show, for example Keywords and flavor text. _Avoid_: side panel, info box, ability box

**Rank Gem**: One pip on the Card Frame, in the Rank color. A card shows 1 Rank Gem for Common and 5 for Legendary. _Avoid_: star, pip socket

**Hand Bar**: The panel at the bottom of the Battle screen. It holds the Deck Pile at the left, the Hand Slots in the middle and the Graveyard Pile at the right. _Avoid_: card tray, footer, hand panel

**Hand Slot**: One of the places for a Hand Card in the Hand Bar, one for each Card up to the Hand Limit. An empty Hand Slot shows that the Hand has room for one more card. _Avoid_: card socket, placeholder

**Card Back**: The face-down side of a card. All cards share one Card Back: the Active Cosmetic of the `cardBack` family, or the Standard Back. _Avoid_: sleeve, card cover

**Deck Pile**: The stack of Card Backs in the Hand Bar, with the number of cards in the Deck. It never shows which cards are in the Deck. _Avoid_: draw pile, library

**Graveyard Pile**: The stack in the Hand Bar that shows the last card that went into the Graveyard, and the number of cards in the Graveyard. _Avoid_: discard pile

### Battle screen

**Top Bar**: The panel at the top of the Battle screen. It holds the two Heroes, the Turn number, the Battle controls, the Handbook button and the Key Guide button. _Avoid_: header, HUD top, status bar

**Boss Plate**: The plate of one enemy Boss in the Top Bar of a Dungeon Battle: its Lane Strip, name, HP with a notch at each Boss Rule threshold, and the Countdowns of its Hand. A Defeated Boss keeps its plate. _Avoid_: boss bar, boss card, hero panel (a Stage has one Hero panel for each Side)

**Lane Strip**: The column of cells on a Boss Plate, one for each Lane from Lane 1 at the top. The cells of the Front of the Boss are full. _Avoid_: lane map, mini-map, lane pips

**Front Bracket**: The rounded mark on the ground under a Boss across the Lanes of its Front (web ADR-0011). It grows when a Front moves to that Boss. _Avoid_: front zone, territory, lane highlight

**Battle Painting**: The painted ground and background behind the Board, one for each Region. It is a flat 2D image, not a 3D scene. The Squares are not drawn on it. _Avoid_: stage background, backdrop, arena, battlefield map, Board skin

**Status Badge**: The row of Status icons above a Unit on the Board, each with its count when the Status has one. It shows at most 3 Statuses, then "+N". The Details Panel shows the full list and the rules text. _Avoid_: debuff bar, buff icons, status bar, status icons

**Keyword Plate**: The small Night Plate with a Keyword name and its value that shows over a Unit in Live when that Keyword occurs, for example "Swarm 2". It shows each time a Keyword changes the Battle, for all Keywords that can occur. _Avoid_: keyword flash, keyword popup, keyword toast, activation

**Wind-up**: The rune ring and the particles at the caster Hero at the start of a Skill Card cast. It looks the same for all Classes: the position of the Hero shows who casts. _Avoid_: charge-up, cast circle, Class aura

**Spell Bolt**: The glow that flies from the caster Hero to the target Squares of a Skill Card, in the color of its effect. _Avoid_: projectile, missile

**Key Guide**: The list of the keys that play a full Battle and what each key does. It opens from the info button in the Top Bar, on hover, on keyboard focus and on press. "Read more" on a Hint for a screen control opens it at the line of its key, and marks that line. _Avoid_: keyboard help, hotkeys, shortcuts, accessibility info, controls hint

**Battle Log**: The view-only mode of the Battle screen that shows the past moments of the current Battle, or of a Replay that the Player watches. It has the list of Log Entries, and the Board, the Hand Bar and the Heroes show the selected Log Entry. It shows only what the Player of that Battle saw at that moment. It never changes the Battle, and it goes away when the Player leaves the Battle. _Avoid_: replay, rewind, history, combat log, turn history, undo

**Watching a Replay**: The Battle Log of a Replay, not of the current Battle. It has no Live: all of the Battle is in the past. It plays from the first Log Entry, and it does not show the result until the last Log Entry. Then it shows the result with no rewards. It never sends a Command and never changes the Profile. _Avoid_: replay mode, spectate, playback, import

**Replay Link**: A link that holds one full Replay. The Player shares it from the result of a Stage Battle, a Dungeon Battle or a Floor Battle. To open it starts Watching a Replay at once, in place of the Town. _Avoid_: share code, battle export, Battle Log export, replay file

**Log Entry**: One past moment in the Battle Log: one card play, one Unit Action or one Phase effect, with all its results. The Log Entries are under one header for each Turn of a Side. _Avoid_: log line, event, step, history item

**Live**: The current moment of the Battle, as opposed to a Log Entry. "Back to Live" closes the Battle Log. _Avoid_: present, now, current turn

### Cosmetics

**Hero portrait**: A painting of the face of the Player's Hero, and a Cosmetic of the `heroPortrait` family. It does not change with the Class of the Active Deck: the Player's Hero keeps one face for all Classes, and the Class stays on its own name and glyph. It shows on the Hero screen, in the player panel of the Top Bar, and on the banner of the Player's Hero on the Board. The enemy Side never shows it. _Avoid_: avatar, hero skin, portrait card, face

**Standard portrait**: The free look of the Hero portrait family, which every Player has: the Hero banner in code, in the color of its Side, with the Class glyph. _Avoid_: default portrait, base portrait

### Town

**Town**: The hub screen of the game, and the first screen that the Player sees. It is a painted view of a town, with one Building for each screen that the Player can open. _Avoid_: Camp, city, hub, home, lobby, main menu

**Building**: One place in the Town that opens one screen when the Player selects it. A Building that has no screen yet is only decoration: it has no label and the Player cannot select it. The Town Gate, the Card shop, the Workshop, the Market, the Barracks, the Dungeons cave, the Heynspire tower, the Hall of banners and the Seaport quay can be selected. _Avoid_: hotspot, landmark, location, house

**Town Gate**: The Building that opens the Campaign: a large gate with a road that goes out of the Town. _Avoid_: Campaign Building, map house, exit

**Card shop**: The Building that opens the Packs screen: a small house with a purple roof. It opens at Player level 2. _Avoid_: Pack shop, store

**Market**: The Building that opens the Bazaar screen: an open market square with colored tents around a fountain, above the Workshop and right of the Card shop. It has no lock: it opens at any Player level. Its label is above the tents, in the safe area. _Avoid_: Bazaar Building, market square, bazaar stalls

**Barracks**: The Building that opens the Hero screen: a long stone barracks with a fenced training yard. It opens at Player level 5. _Avoid_: Hero Building, armory, training hall

**Dungeons cave**: The Building that opens the Dungeons screen: a cave in grey rocks with ruined pillars, at the right edge of the Town. It opens at Player level 10. It is outside the safe area, so a narrow screen crops it, and the Dungeons shortcut is the sure way in. _Avoid_: dungeon entrance, cave Building, mine

**Heynspire tower**: The Building that opens the Heynspire screen: the white castle with the tall tower and the blue roofs on the hill at the back of the Town. It opens with the first win of Stage 5-10, not at a Player level. Its label is on the walls of the castle, because a wide screen crops the top of the tower. _Avoid_: castle Building, spire Building, endless tower

**Hall of banners**: The Building that opens the Achievements screen: a wide hall with red roofs and long blue and gold banners, behind the Library and the Card shop. It has no lock: it opens at any Player level. Its label is on the red roofs, under the Heynspire hill. _Avoid_: trophy hall, achievements Building, guild hall

**Seaport quay**: The Building that opens the Seaport screen: the harbour by the sea at the right edge of the Town, with the long piers, the moored ships and the towers with blue roofs, under the Balance Plate corner. It opens at Player level 8. It is outside the safe area, so a narrow screen crops it, and the Seaport shortcut is the sure way in. The current Town painting already has it. _Avoid_: harbour Building, port, dock, pier

**Lock Plate**: The small plate with a lock that replaces the name label of a Building whose screen the Player has not unlocked. It shows the level that opens the screen, or, for the Heynspire tower, the ID of the Boss Stage to win first with a small crown. It has the same tooltip as the Town Bar shortcut: "Opens at level N", or "Win Marrow Castle (5-10) to open". _Avoid_: level badge, locked label

**Town Bar**: The panel at the bottom of the Town and of each screen except the Battle. It has one shortcut for each screen that has a Building, the screens that do not exist yet too, a shortcut back to the Town, and a shortcut to the Handbook. _Avoid_: menu bar, nav bar, footer, dock

**Stowed Town Bar**: The Town Bar when the Player puts it away. It has no wood and takes no room, so the screen fills the space. Only the brass pull stays, at the corner of the screen. _Avoid_: collapsed bar, hidden bar, minimized bar, rail

**Handbook**: The dialog that tells how the game works: the rules, the terms and the icons that the Player meets. It opens over the current screen, from the Town Bar and from the Top Bar of the Battle. It has no Building. It explains concepts and does not list cards: the Deck builder lists cards. It has an entry only for a feature that is in the game, and the Player can read all its entries from the start. _Avoid_: Wiki, codex, help, encyclopedia, rulebook, guide

**Chapter**: One group of Entries in the Handbook, for example Battle, Cards, Keywords or Statuses. _Avoid_: category, section, tab

**Entry**: One term in the Handbook, with its icon if it has one, its rule text and links to related Entries. Each Entry belongs to one Chapter. The search also finds an Entry by the words that players use in other games, for example "mana" for Countdown. _Avoid_: article, page, topic, wiki page

**Balance Plate**: The plate in the top-right corner of the Town that shows the Coin, Essence and Heynstone balances of the Player. Each balance tells what it pays for on hover, focus and tap. It shows information only. _Avoid_: wallet, purse, currency bar, resource bar

### Campaign screen

**Region Map**: The painted map of one Region, with its Trail and its Stage Markers. The Campaign screen shows one Region Map at a time. It is a flat 2D image. _Avoid_: Campaign map, world map, level map, stage map, battlefield map

**Trail**: The road on a Region Map from the first Stage to the Boss Stage, with one stop for each Stage. _Avoid_: path, route, track

**Stage Marker**: The mark on the Trail for one Stage. It shows the state of the Stage, and the Player selects it to play that Stage. _Avoid_: checkpoint, node, pin, level button

**Stage Panel**: The dialog that opens when the Player selects a Stage Marker. It shows the Stage, its enemy Hero, its rewards, the best Stars and the Deck, and it starts the Battle. _Avoid_: stage popup, stage details, pre-battle screen, lobby

**Sweep Result**: The dialog that shows the result of a Campaign Sweep or a Dungeon Sweep: the total rewards of all its Tickets, and the Tickets of that type that stay. _Avoid_: sweep report, auto-play summary, loot screen

### Packs screen

**Pack Stand**: One Pack on the Packs screen: the painted Pack on a wood ledge, then a plate with its name, its Rank bar, its Pack Guarantee line and the Open buttons. _Avoid_: pack card, shop item, offer

**Rank Bar**: The small bar of the Drop Rates of a Pack, with the Rank Gems and the rate of each Rank under it. _Avoid_: odds bar, rarity bar

**Race Stamp**: The round stamp with the Race emblem that the game puts on the Pack art of a Race Pack. A Race Pack has no art of its own. _Avoid_: faction badge, race sticker

**Class Stamp**: The round stamp with the Class emblem of a Skill Card (the Class glyph in ink on parchment) that the game puts on the Pack art of a Class Pack, in the place of the Race Stamp. There are no Class colors. _Avoid_: class badge, skill sticker

**Reveal**: The screen over the Packs screen that shows the cards of the opened Packs. One Pack: 5 face-down cards that flip. Open ×10: a full flip for each Epic and Legendary card, then a grid of all the cards. _Avoid_: pull animation, pack opening

### Hero screen

**Hero screen**: The screen that shows the Player's Hero: its Class, its Hero HP and its 4 Gear items. The Player does Gear upgrades there. It shows the Class of the Active Deck, and it opens the Deck dialog to change it. _Avoid_: Character screen, armory, equipment screen, Gear screen, profile

### Achievements screen

**Achievements screen**: The screen that lists all Achievements in their 4 categories, with the progress of each, and where the Player claims their rewards. The Hall of banners and the Achievements shortcut open it. _Avoid_: trophy room, quest log, challenges screen, badges

**Category Flag**: One cloth flag on the pole at the left of the Achievements screen: a tab for one category of Achievements. It shows the name of the category, its done count ("3 / 8") and the number of its rewards to claim. The selected flag goes under the edge of the Achievement Roll. _Avoid_: category tab, banner tab, filter

**Achievement Roll**: The parchment list at the right of the Achievements screen with the rows of the selected category, and Claim all at its foot. Each row shows the name, the goal, the reward and the state: a progress bar ("Not done" for a Feat), Claim, or the check seal. _Avoid_: achievement list, quest list, table

**Claim**: The action that adds the reward of one Completed Achievement to the Profile, on its row of the Achievement Roll. **Claim all** claims all Completed Achievements of all categories at one time. The rules term is the same for a Star chest. _Avoid_: collect (a Collect is for an Expedition of the Seaport), redeem, receive

**Achievements badge**: The small gold count on the Achievements shortcut of the Town Bar: the number of Completed Achievements that the Player did not claim. It does not show at 0. _Avoid_: notification dot, red dot, alert

### Dungeons screen

**Mine**: The Dungeons screen as one mine that goes down into the earth: one Stop for each Dungeon, deeper with each number, in a column of shaft rock. When the Player selects another Dungeon, the lift stays in its well and the world moves, so the old Stop slides away, the rock goes past and the new Stop comes in. _Avoid_: dungeon list, level select, tabs, shaft section

**Stop**: One Dungeon on the Dungeons screen: the painted lair of that Dungeon, with the empty lift well at its left, the level floor line, the Bosses in the middle and calm rock at the right, under the Dungeon Panel. The Mine puts the same lift cut-out over the well of the selected Stop: the open lift, or the locked lift (gate shut, with a padlock) while the Dungeon is locked, over a dim Stop. _Avoid_: chamber, room, floor, stage

**Boss Mark**: The box of one Boss on a painted Stop, measured on the painting: its center and its top and its bottom, in percent of the Stop. The game lights it when the Player hovers or focuses the Boss Dossier. _Avoid_: boss hit box, boss region, boss glow

**Boss Dossier**: The entry of one Boss in the Dungeon Panel: its pin, its Class seal, its name, Class and wanted line, its Hero HP with a notch at each Boss Rule threshold, its Boss Rules, the Lanes of its Front and its Units at the start. Focus or hover on it lights the Boss on the painting. _Avoid_: boss profile, enemy card

**Depth Gauge**: The rope at the left of the Mine, with one marker for each Stop and the lift cage around the marker of the selected Stop. A press on a marker goes to that Stop. _Avoid_: spine, scrollbar, mini-map

### Heynspire screen

**Tower column**: The tower on the Heynspire screen: one column of 50 storeys, from Floor 1 at the bottom over the clouds to Floor 50 under the summit. It is a list of Floors that the Player selects; the Floor Panel shows the selected Floor. _Avoid_: floor list, ladder, level list, tower map, Floor rail

**Storey**: One Floor in the tower column: its stone, its door with "Floor" and the Floor number, and its status ribbon (Won, Current Floor or Locked). A Boss Floor is a Boss storey: a grander storey with a crown and the banners of its Boss. _Avoid_: floor tile, floor stone, step

**Flight**: A group of 10 Floors that ends on a Boss Floor: Floors 1 to 10, 11 to 20, and so on. The spine of the tower column shows one crown for each Flight. It is a term of the code and the screen only, not a rules term. _Avoid_: tier, chapter, section, stage group, milestone

**Floor Panel**: The parchment sheet docked at the right of the Heynspire screen, open at all times. It shows the selected Floor: its enemy Hero, its first win reward and the Recommended level. For the Current Floor it also has the Deck choice and Fight. A won Floor shows its reward as received, with no Fight, because a won Floor cannot be played again. A locked Floor shows which Floor to win first. _Avoid_: floor popup, floor details, pre-battle screen

### Workshop screen

**Station**: One of the four places of the Workshop screen, one for each action: Combine, Craft, Fuse and Extract. The Player selects a Station on its tab, then a card. A Station marks the cards that it can act on, and its Panel shows only its action. _Avoid_: mode, tab (for the concept), workbench

**Station Panel**: The HUD plate at the right of the Workshop screen for the selected card in the selected Station. The Combine Panel is the ladder of Rank rows, from Legendary at the top to the Base Rank at the bottom, with a Combine on the rung between two rows and the Path to Legendary. The Craft Panel shows the Essence cost and the Base Rank copy that a Craft makes. An Epic or a Legendary card has no Craft, so it is not in the Craft grid. The Extract Panel has a row for each Rank with a copy, each with its Extract. _Avoid_: Rank Panel, card panel, upgrade panel, detail panel

**Spare copy**: A copy of a card that no saved Deck uses: the copies of a card and Rank less the most that one saved Deck uses. An Extract of a spare copy changes no Deck. _Avoid_: duplicate, extra, surplus

**Path to Legendary**: The groove track in the Combine Panel that counts each copy of the card as Base Rank copies (a copy in Rank r is 2^(r − base) of them), and tells the copies and the Coin that are still needed for one Legendary copy. _Avoid_: progress bar, upgrade path

### Bazaar screen

**Bazaar screen**: The screen that the Market opens: the offers that the Player buys with Heynstones, one section for each Cosmetic family, behind the inside of the Market. A Card Back that the Player owns can be made the Active Cosmetic there. _Avoid_: shop screen, store screen, market screen

**Item plate**: One offer on the Bazaar screen: the painted face of a Card Back or the glyph of its family, the name, and the price, "Owned" or "In use", with **Buy** or **Use**. _Avoid_: offer card, product tile, row

**Card Back shelf**: The plate above the Card Backs that shows the look at the size of a card, with its name and its state. The pointer, the keyboard focus or a press on a plate puts that look on the shelf. _Avoid_: preview pane, try-on window, mirror

**Standard Back**: The Card Back that every Player has, for free, when no Card Back is Active. It is not a Bazaar item and not a Cosmetic. _Avoid_: default skin, basic back

### Seaport screen

**Seaport screen**: The screen of the Seaport: the harbour seen from the water, with the Cargo plaques, the duration row, the Manifest and the berth plate over the calm water at its left. The Player Dispatches the ship and Collects its reward there. The rules own the reward math; the screen sends the device time `now` with each Command. _Avoid_: port screen, harbour screen, idle screen

**Cargo plaque**: One plaque of the Cargo list on the Seaport screen: the icon and the name of one Cargo. A Cargo that the Player level has not opened shows a Lock Plate with "Lv N". _Avoid_: expedition card, destination, route button, offer

**Duration chip**: One chip of the duration row on the Seaport screen: the hours of a voyage and its bonus for each hour, or its Lock Plate. _Avoid_: time button, timer option

**Manifest**: The plate under the duration row that shows what the selected Cargo and duration bring: the full reward as one big number, the device time when the ship is back, and the bonus. The Dispatch is under it. _Avoid_: preview, summary, reward box

**Berth plate**: The parchment plate under the Dispatch that shows the ship: at the berth, away with the time left and the reward that a Collect gives now, or back with the full reward. Collect is on it. _Avoid_: ship panel, timer panel, status box

### Component Catalog

**Component Catalog**: The single page at `/master-design` that displays every core UI component for visual inspection by developers and designers. It is available in development. A production build answers 404. _Avoid_: master design, styleguide, storybook, docs site

**Component Entry**: One component's place in the Component Catalog — its Category membership, its nav item, and its section of the page. _Avoid_: item, doc, page

**Variant Showcase**: One rendered example within a Component Entry, demonstrating a single combination of a component's props. _Avoid_: demo, example, story

**Category**: A named grouping of Component Entries (Buttons, Overlays, Charts, …) that determines both nav grouping and page order. _Avoid_: group, section, tag

## Relationships

- Each selectable **Building** opens one screen for a rules term. The Town Gate opens the Campaign, the Card shop opens the Packs screen, the Workshop Building opens the Workshop, the Market opens the Bazaar, the Barracks opens the Hero screen, the Dungeons cave opens the Dungeons screen, the Heynspire tower opens the Heynspire screen, and the Hall of banners opens the Achievements screen. The Seaport quay opens the Seaport screen.
- The **Handbook** and the **Card Details** show the same rule text for a Keyword and a Status. The **Card Details** show the name of a **Damage Type** only; its rule is in the Handbook. The Handbook never has its own copy of a rule.
- A **Creature Card** painting has one **Facing**. The Board mirrors that painting for an enemy **Unit**.
- The **Battle Log** shows the Battle Events that the screen already played. It never shows a later moment than **Live**. While it is open, the Live playback pauses.
- **Watching a Replay** uses the **Battle Log** mode, but for a **Replay**, not for the current Battle. It has no **Live**, so it has no "Back to Live". The rules run the Replay again to make its Battle Events.
- A **Replay Link** holds a **Replay** (rules), not a **Battle Log**. The Battle Log is only a mode of the screen, and it has no data to share.
