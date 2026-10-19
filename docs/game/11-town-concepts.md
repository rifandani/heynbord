# 11 — Town Concepts

This document gives the art brief for the Town, the first screen of the game ([GDD 11.4](./03-game-design.md#114-town)). The Town is a 2D painting ([web ADR-0005](../../apps/web/docs/adr/0005-the-town-is-a-layered-2d-painting.md)): one master painting, with one button over each Building that the Player can select. The art must agree with the Building table in GDD 11.4 and with the positions in `apps/web/src/features/town/town.ts`. Section 7 gives the brief for the Town Bar icons, section 8 gives the brief for the Pack art, section 9 gives the brief for the inside of the Card shop, behind the Packs screen, and section 10 gives the brief for the inside of the Workshop, behind the Workshop screen.

Now the Town uses the first master painting, `apps/web/public/town/town.webp` (1986 × 941). It is the 1672 × 941 original, stretched to the side: the center 400 code units keep their shape, and the stretch increases to 1.67× at the left and right edges. This lets a wide desktop screen show the full Heynspire and the full Town Gate. The painting does not follow all of this brief: section 1.2 gives the positions in the current painting. A new export at 4000 × 1800 can replace it with no code change if it keeps the same composition.

## 1. Rules for the Town art

- **One master painting.** Make the full Town in one image, so that all Buildings have the same light, scale and style. Do not make each Building in a separate image.
- **View.** A high bird's-eye view, about 45° down, like a painted map of a town. All Buildings show their front and their roof.
- **Light.** From the upper left, as in all other art.
- **Size.** Landscape, about 2.1:1, so that a wide desktop screen shows the full painting from the top of the Heynspire to the ground line. Export at 3800 × 1800. The code uses a 1900 × 900 coordinate box, so 1 code unit is 2 pixels.
- **No text.** The image has no labels, signs with letters, logo or UI. The game shows the Building labels as text from the Message Catalogs, in each language.
- **Each Building is clear.** Each Building has its own silhouette and some open space around it, so that a Player can find it at a small size (a phone in landscape).
- **Detail and humor.** Bright, warm and a little funny (art direction 1). Small people, animals and jokes are good. They must not hide the Buildings.

### 1.1 Setting and palette

| Item | Brief |
| --- | --- |
| Place | A free town on a green hillside next to the sea. All peoples of Heynbord come here to trade and to start their adventures. |
| Architecture | Mainly warm stone and timber, with terracotta and blue roofs. Small signs of each of the 6 Races: a human guard at the gate, an orc food stall in the market, elf trees with lanterns, a quiet undead bell keeper on the hall, a goblin tinker's junk cart at the Workshop, and a wild boulder tortoise (Feral) asleep on the road between the Workshop and the Market. |
| Palette | Warm stone, terracotta, royal blue roofs, gold banners, green hills, blue sea. No single Race color is the main color. |
| Time and weather | A clear morning. Soft white clouds. |

### 1.2 Positions on the painting

The painting covers the screen and crops its edges (GDD 11.4). The positions are in the 1900 × 900 code box, for the current painting.

| Area | Box (x, y) | Rule |
| --- | --- | --- |
| Ground line | y 864 | The base of the Town Gate. The game keeps this line on the top edge of the Town Bar, on all screens. The painting below it goes under the Town Bar. Put only road and trees there. |
| Safe area | x 374 to 1526, y 136 to 864 | Each screen shape from 4:3 to 19.5:9 shows this area above the Town Bar. The label of each selectable Building, and the part of the Building under its label, must be in it. |
| Town Gate | x 720 to 1064, y 603 to 864 | The selectable box of the Town Gate: the two towers, the arch, the doors and the guards. The wall is not in the box. With its label, the box starts at y 557, and its light goes up to y 520, the tips of the tower roofs. |
| Town Gate label | x 720 to 1064, y 557 to 603 | The game writes "Campaign" here, between the two tower roofs, at the middle of their height. |
| Card shop | x 1010 to 1209, y 436 to 612 | The selectable box of the Card shop: the house with the purple roof, its awnings and its stalls. The box covers the right tower of the Town Gate at its lower left, so the game cuts that corner from the selectable area, and the pointer there selects the Town Gate. |
| Card shop label | x 1010 to 1209, y 390 to 436 | The game writes "Packs" here, above the purple roof. |
| Market (Bazaar) | x 1210 to 1526, y 366 to 505 | The selectable box of the Market: the tents, the stalls and the fountain of the market square, above the Workshop and right of the Card shop. Its box is the part of the square in the safe area: a 4:3 screen crops the blue awning and the red tent at its right (to x 1645), so the box ends at x 1526, the right edge of the Workshop label. It stops at the top of the Workshop label (y 505), so that label keeps the pointer. |
| Market label | x 1210 to 1526, y 320 to 366 | The game writes "Bazaar" here, above the tents, under the Balance Plate corner (y 180). |
| Workshop | x 1318 to 1745, y 551 to 705 | The selectable box of the Workshop: the open forge with the blue roof, the tall chimney and the house at its right. With its label, the box starts at y 505, and its light goes up to y 480, the top of the chimney. Its `clip` follows the roofs, the chimney and the wall, so the plaza and the wall go to the painting. Only its left part (to x 1526) is in the safe area: a 4:3 screen crops the chimney and the house. |
| Workshop label | x 1318 to 1526, y 505 to 551 | The game writes "Workshop" here, on the top edge of the forge roof, over the left part of the Workshop, in the safe area. It is below the Market stalls, so it does not cover them. |
| Barracks | x 91 to 555, y 344 to 526 | The selectable box of the Barracks: the round tower, the long building with the blue roof, the training yard with the dummies and the fence. With its label, the box starts at y 298, and its light goes up to y 320. Its `clip` follows the roofs and the fence. Only its right part (from x 374) is in the safe area: a 4:3 screen crops the tower, the left wing and the label. |
| Barracks label | x 124 to 303, y 298 to 344 | The game writes "Hero" here, over the left wing of the Barracks, right of the round tower. It is outside the safe area: a 4:3 screen crops it. GDD 11.4 permits it, because the Hero shortcut opens the screen on all screens. The name touches the top of the blue roof. |
| Dungeons cave | x 1480 to 1900, y 746 to 864 | The selectable box of the cave: the first ruined pillar, the rock face and the cave arch, from under its label down to the ground line. The top of the rock mound stays in the painting. Its `clip` follows the pillar. It is outside the safe area, as the Barracks label is: a 4:3 screen crops all of it, and a 16:10 screen crops the arch. GDD 11.4 permits it, because the Dungeons shortcut opens the screen on all screens. |
| Dungeons cave label | x 1500 to 1700, y 700 to 746 | The game writes "Dungeons" here, on the rock face at the left of the arch. A 16:10 screen shows it. It is under the lower edge of the Workshop, so it never takes the pointer from the Workshop. |
| Heynspire tower | x 540 to 760, y 184 to 244 | The selectable box of Heynspire: the hill under the castle. The hover light goes up to the flag at the top of the tower (x 500 to 800, y 0 to 250). |
| Heynspire label | x 540 to 760, y 138 to 184 | The game writes "Heynspire" here, on the walls of the castle, at the top of the safe area. |
| Hall of banners | x 790 to 1090, y 296 to 390 | The selectable box of the Hall of banners: the front of the hall with its long banners and its arched door. It stops at the top of the Card shop label (y 390), so that label keeps the pointer. The hover light goes down over the steps and the trophies (x 770 to 1110, y 226 to 456). |
| Hall of banners label | x 800 to 1080, y 250 to 296 | The game writes "Achievements" here, on the red roofs of the hall. It is under the Heynspire hill and right of the Heynspire box (x 540 to 760), so the two labels never touch. It is far above the Town Gate label (y 557 to 603). |
| Seaport quay | x 1590 to 1900, y 242 to 426 | The box of the Seaport quay (2.10): the tall towers, the big ship, the two long piers, the small ship, the quay along the wall and the round tower with the blue roof. With its label, the box starts at y 196, and its light goes up to y 190, over the flag of the big ship. It is outside the safe area, as the Dungeons cave is: a 4:3 or a 16:10 screen crops almost all of it, and a 19.5:9 phone shows all of it. GDD 11.4 permits it, because the Seaport shortcut opens the screen on all screens. The Building sets its label, its hit box and its light inside this box. |
| Seaport quay label | x 1610 to 1900, y 196 to 242 | The game writes "Seaport" here, in the sky above the big ship, under the Balance Plate corner (y 180). A 4:3 or a 16:10 screen crops it. |
| Balance Plate corner | x 1280 to 1900, y 0 to 180 | The game shows the Balance Plate at the top right of the screen. On a 19.5:9 phone it goes down to about y 122. This box is that area with a margin. Do not put a selectable Building or its label in it. |
| Sky | Above the safe area | A screen wider than about 2.2:1 above the Town Bar crops it first. On a 19.5:9 phone, the top of the Heynspire is also cropped. |
| Edges | Outside the safe area | A screen can crop them. Decoration Buildings can be here. The Barracks label and the Dungeons cave are the selectable parts here (see their rows). |

```text
 0                  475                 950                1425               1900
 ┌───────────────────────────────────────────────────────────────────────────────┐ 0
 │ sky, clouds      [Heynspire castle on the hill]                               │
 │                                                          [Seaport quay, ships]│
 │   [Barracks, yard]          [Hall of banners]                                 │
 │                 [Library]          [Card shop]        [Market, fountain]      │
 │                                                    "Bazaar"                  │ 366
 │                          "Campaign"                 [Workshop, forge smoke]   │ 474
 │  ═══════ town wall ════════╗ [ TOWN GATE ] ╔══════════ town wall ═══ [Cave] ◄─│ 520
 │     trees                  ║  x 720-1064   ║                          (edge)   │
 │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ground line y 864: top of the Town Bar ─ ─ ─ ─ ─ ─ │ 864
 └───────────────────────────────────────────────────────────────────────────────┘ 900
```

### 1.3 Ambient layers

The game adds motion on separate layers over the painting. The painting must give a place for each layer. If the positions change, update the constants in `apps/web/src/features/town/components/town-screen.tsx`.

| Layer | Position in the code box | Need in the painting |
| --- | --- | --- |
| Chimney smoke | Workshop forge chimney (1612, 472) | A chimney top. The puffs continue the smoke in the painting. |
| Light on the sea | x 1515 to 1882, y 218 to 251 | Open sea with no buildings or ships in front of it. A phone crops it. |
| Clouds | None | The clouds are in the painting. The game does not move them. |
| Flags | None | The flags are in the painting. |

## 2. Buildings

Each screen of GDD 11.1 except Title and Settings has a Building. The Town Gate, the Card shop, the Workshop, the Barracks, the Dungeons cave, the Heynspire tower and the Hall of banners can be selected. The other Buildings are decoration in the plate until their screens exist.

### 2.1 Town Gate

`Campaign` · Selectable in v1

| Field | Brief |
| --- | --- |
| Shape | A large stone gatehouse with two round towers. The towers have blue conical roofs and gold flags. The gate is open, with wooden doors. |
| Props | A gold crest above the arch, banners on the towers, a small guard house, a sign post with arrows that point out of the Town (no letters). |
| Story cue | The road goes out of the gate and down to the bottom left, toward far meadows. It says "go out and fight" with no text. |
| Silhouette hook | The two tower roofs and the open arch. |
| Humor note | A sleepy guard sits on a stool next to the gate, with a cat on his lap. |
| Position | The center of the painting, in the town wall, on the ground line (box in 1.2). |
| Export | No separate export: the Building is a part of the master painting. |

### 2.2 Heynspire tower

`Heynspire` · Selectable · Opens with the first win of Stage 5-10

The tower opens the Heynspire screen ([GDD 8.2](./03-game-design.md#82-heynspire-draft-name)). Until then, a Lock Plate with "5-10" and a small crown takes the place of its label. In the current painting, Heynspire is a white castle with a tall central tower and blue roofs on the hill at the back (box in 1.2). A new export can make it taller and thinner, as this brief asks, if the label box in 1.2 stays on its walls. The `heynspire` Town Bar icon (7.3) shows the castle of the current painting, not the tower of this brief. If a new export paints the tower, paint the icon again.

| Field | Brief |
| --- | --- |
| Shape | A very tall, thin white stone tower with blue roofs. It goes up into the clouds, and the top is not visible. |
| Props | Small windows with light, floating stones around the top, a long stair around the tower. |
| Silhouette hook | The tallest shape in the image. |
| Humor note | A tired climber sits on the stair halfway up, with a water bottle. |
| Position | On the hill at the back, left of the center (box in 1.2). A screen wider than about 2.2:1 crops the top of the tower, so the label is on the walls of the castle. |

### 2.3 Dungeons cave

`Dungeons` · Selectable · Opens at player level 10

| Field | Brief |
| --- | --- |
| Shape | A dark cave in grey rocks, with old ruined pillars at the entrance. |
| Props | A wooden barrier with a warning skull (cute, not scary), torches, a pick and a lantern on the ground. |
| Silhouette hook | The black arch of the cave. |
| Humor note | Two small glowing eyes look out from the dark. |
| Position | The right edge (about x 1620 to 1900, y 550 to 720). A screen can crop it. |
| Export | No separate export: the cave is a part of the master painting. The cave opens the Dungeons screen (GDD 8.4) at Player level 10; below that level, a Lock Plate replaces its label. Its inside is section 13. |

### 2.4 Library

No screen · Decoration only

| Field | Brief |
| --- | --- |
| Shape | A stone library with a blue roof and tall arched windows. |
| Props | Book stacks at the door, a small card table outside with two players, a chimney. |
| Silhouette hook | The row of tall arched windows. |
| Humor note | A stack of books is taller than the door. |
| Position | Left of the Town Gate, inside the wall (about x 540 to 670). |

### 2.5 Workshop

`Workshop` · Selectable · Opens at player level 3

| Field | Brief |
| --- | --- |
| Shape | A timber workshop with a brown roof and a tall stone chimney. |
| Props | An anvil and a work bench outside, glowing sparks at the door, barrels and crates, a goblin tinker's junk cart full of gears and pots. |
| Silhouette hook | The tall chimney. |
| Humor note | A small dwarf-like smith hits a glowing card on the anvil. |
| Position | Right of the Town Gate, inside the wall, at the right of the Market. In the current painting, it is at x 1318 to 1745, and its roof is blue (box in 1.2). |

### 2.6 Market

`Bazaar` · Selectable: the Market Building and the Town Bar shortcut open the Bazaar screen. The Market box is the tents, the stalls and the fountain of the square, in the safe area (1.2). The inside of the Market is section 16.

| Field | Brief |
| --- | --- |
| Shape | An open market square of pale stone paving between warm stone houses, with five tents: a small white tent with blue trim, an orange and cream striped tent with a pointed top, a long yellow and cream striped awning, a long blue and white striped awning, and a red tent with a pointed top. A round stone fountain with blue water is in the middle of the square. |
| Props | Crates, sacks and baskets on the stalls, fruit, cloth, a fortune teller tent, an orc food stall with a big pot. Townsfolk in plain robes walk between the stalls. |
| Silhouette hook | The group of colored tent tops around the fountain. |
| Humor note | A goat eats the cloth on one stall. A wild boulder tortoise sleeps on the road to the Market, and the townsfolk walk around it. |
| Position | The right side, near the sea, above the Workshop. In the current painting, it is at about x 1200 to 1645 and y 356 to 518. The Bazaar art (section 16) uses this part of the painting as its outside reference: `BAZAAR_OUTSIDE` in `scripts/town-art/write-prompts.ts` (x 1256, y 372, 464 × 169 in the pixels of `town.webp`). |

### 2.7 Card shop

`Packs` · Selectable

| Field | Brief |
| --- | --- |
| Shape | A small, narrow house with a purple roof and a large round shop window. |
| Props | Card packs in the window (no letters), a bell over the door, a short queue of customers. |
| Silhouette hook | The purple roof and the round window. |
| Humor note | A child presses its face on the window. |
| Position | Near the Town Gate, right side. In the current painting, it is at x 1010 to 1209 (box in 1.2). |
| Export | No separate export: the Building is a part of the master painting. |

### 2.8 Barracks

`Hero` · Opens the Hero screen

| Field | Brief |
| --- | --- |
| Shape | A long stone barracks with a fenced training yard. The current painting gives it a blue roof and a round tower at its left end. |
| Props | Straw training dummies, a weapon rack, a chimney. |
| Silhouette hook | The fence and the dummies. |
| Humor note | One dummy wears a cooking pot as a helmet. |
| Position | The far left, inside the wall. In the current painting, it is at x 91 to 555 (box in 1.2). |
| Export | No separate export: the Barracks is a part of the master painting. The Barracks opens the Hero screen (GDD 7.3) at Player level 5; below that level, a Lock Plate replaces its label. |

### 2.9 Hall of banners

`Achievements` · Opens the Achievements screen

| Field | Brief |
| --- | --- |
| Shape | A wide hall with a red roof and many long banners in blue and gold on its front. |
| Props | Trophies on the steps (cups and shields), a bell on the roof. |
| Silhouette hook | The row of long banners. |
| Humor note | A quiet undead bell keeper waves from the roof. |
| Position | Behind the Town Gate, the Library and the Card shop. In the current painting, it is at x 790 to 1090 (box in 1.2). Its label is on its red roofs, and it must not touch the Heynspire label or the Town Gate label. |
| Export | No separate export: the Hall is a part of the master painting. The Hall opens the Achievements screen ([15 — Achievements, 4](./15-achievements.md#4-achievements-screen)) at any Player level, so it has no Lock Plate. The inside of the Hall is section 15. |

### 2.10 Seaport quay

`Seaport` · Opens the Seaport screen

| Field | Brief |
| --- | --- |
| Shape | The harbour at the right edge of the Town, by the sea: a stone quay along the Town wall, two long wooden piers on posts, a big ship with white sails and a small ship moored at the piers, and square towers with blue roofs along the quay. |
| Props | Crates, barrels, bollards with coiled ropes, gulls. |
| Silhouette hook | The big ship with white sails at the end of the pier. |
| Humor note | A gull steals a fish from an open crate on the quay. |
| Position | The upper right, under the Balance Plate corner. In the current painting, it is at x 1590 to 1900 (box in 1.2). It is outside the safe area, so a narrow screen crops it, and the Seaport shortcut is the sure way in. |
| Export | No separate export: the quay is a part of the master painting, and the current painting already has it. The quay opens the Seaport screen ([Economy 2.8](./07-economy.md#28-seaport-expeditions)) at Player level 8; below that level, a Lock Plate replaces its label. The Seaport screen is section 17. |

## 3. Prompts

The game docs do not keep the image prompts of the Town. Run `bun town:prompts` to write them to `apps/web/art/town/raw/`. Git ignores this folder.

- `style-reference.png`: 4 golden references of art direction 5.1 in one image. They set the brush, the light and the palette.
- `painting/prompts.md`: the setup message, then the painting message.
- `bar/`: the prompts of the Town Bar icons (7.2).
- `packs/`: the prompts of the Pack art (8.2).
- `shop/`: the prompts of the Card shop inside (9.4).
- `workshop/`: the prompts of the Workshop inside (10.4).
- `barracks/`: the prompts of the Barracks inside (11.4).
- `gear/`: the prompts of the Gear icons (12.2).
- `cave/`: the prompts of the Dungeons cave inside (13.4), then the Battle Painting of all Dungeon Battles ([13 — Battlefield Concepts, 1.6](./13-battlefield-concepts.md#16-the-dungeon-cave)), with its two references.
- `heynspire/`: the prompts of the Heynspire inside (14.4), then the Battle Painting of all Floor Battles ([13 — Battlefield Concepts, 1.7](./13-battlefield-concepts.md#17-heynspire)), with its two references.
- `bazaar/`: the prompts of the Bazaar inside (16.4).
- `seaport/`: the prompts of the Seaport screen (17.4).

The painting message is a short form of the briefs in sections 1 and 2. It is in `scripts/town-art/prompts.ts`. When you change a brief, change the painting message too, then run the script again.

## 4. Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `painting/prompts.md` and the style reference (section 3).
2. Select one image with the checklist in 5.
3. Fix problems by hand or with inpainting (text-like marks, strange buildings, broken roofs).
4. Scale the image so that the Town Gate fills its box in 1.2. Crop to 2.1:1 and export at 3800 × 1800.
5. Compress the file (Technical Design, section 6). Put it in `apps/web/public/town/`, and change `PAINTING_IMAGE` in `town.ts`. If the Buildings move, change their boxes in `SELECTABLE_BUILDINGS`.
6. Check the chimney points and the sea area (1.3). Change the ambient constants if necessary.
7. Write the licence record (art direction 5.5) for the master painting.

## 5. Review checklist

- [ ] All 10 Buildings of section 2 are in the image, and each is easy to find.
- [ ] The base of the Town Gate is on the ground line, and the label area above it is readable.
- [ ] The label of each selectable Building, and the part of the Building under it, are in the safe area.
- [ ] Below the ground line, there is only road and trees.
- [ ] The light comes from the upper left, as in all other art.
- [ ] No text, letters, logo or signature in the image.
- [ ] The image does not look like a known town from another game.
- [ ] The style matches the golden references.

## 6. When the Town changes

- When a screen comes, add its Building to `SELECTABLE_BUILDINGS` in `town.ts`. Its label, and the part of the Building under the label, must be in the safe area. The Market (2.6) is the last Building: its box is the part of the market square in the safe area, and its label is under the Balance Plate corner.
- When you add a screen with no Building in section 2, add its brief here first. Then paint it into the master painting with inpainting, in the same style.
- When you change the painting, check the ambient layers (1.3) again.

## 7. Town Bar icons

The Town Bar (GDD 11.4) has one shortcut for each entry of `TOWN_SHORTCUTS` in `town.ts`. Each shortcut shows its painted icon, so that the bar looks like a part of the painted world. Each icon shows the same object as its Building in section 2, so the bar and the Town agree.

The Settings button at the right end of the bar also has a painted icon. It replaces the language and sound buttons. It opens the Settings dialog in the center of the screen (GDD 11.4), where the Player sets the audio, the language and the other options. Settings has no Building, so its icon shows a different object (7.3).

The Handbook shortcut, the last shortcut before the Settings button, opens the Handbook dialog (GDD 11.1). The Handbook has no Building either, so its icon also shows a different object (7.3). A shortcut without a painted icon shows a temporary icon in the same slot. Its ID stays in `UNPAINTED_ICONS` in `town.ts` until its WebP file is in `apps/web/public/town/bar/`: a unit test checks that the list and the files agree.

The painted icons show at 66 px (48 px on a phone), and they stand out of the top edge of the bar. `DESIGN.md` (Navigation) gives the Shortcut size and states.

### 7.1 Rules for the icons

- **One object for each icon.** No scene, no ground, no frame and no badge circle. The background is transparent.
- **View.** A slight three-quarter view from above, about 30° down. The bottom edge of the object is flat, so that it sits on the bar.
- **Light.** From the upper left, as in all other art.
- **Outline.** A thick dark brown outline (`#2e1d10`, the dark end of the Town Bar wood) around each object. All icons have the same outline thickness.
- **Size.** Square 1:1. Make at 1024 × 1024. The object fills about 85% of the canvas.
- **No text.** No letters, numbers, runes or logo. The game shows the shortcut names from the Message Catalogs, in each language.
- **States.** Make one image for each icon. The code makes the current, hover, focus and locked states (DESIGN.md Navigation).

### 7.2 Prompts

The game docs do not keep the prompts of the Town Bar icons. Run `bun town:prompts` to write them to `apps/web/art/town/raw/bar/` (section 3). Git ignores this folder.

- `../style-reference.png`: the style reference of section 3.
- `set-reference.png`: the `town` icon, from `apps/web/art/town/bar/`. The other icons match its outline, view angle and scale.
- `prompts.md`: the setup message, then one prompt for each icon of 7.3.

Each icon prompt has the rules of 7.1 and the subject line of the icon in `scripts/town-art/subjects.ts`. Use one ChatGPT conversation for all icons: attach the references to the setup message, then send each icon prompt in its own message. To change an icon, change its subject line, then run the script again. When you add a row to 7.3, add a subject line too.

### 7.3 Icon subjects

In the order of `TOWN_SHORTCUTS`, then the Settings button. The `seaport` shortcut comes after the `dungeons` shortcut and before the `deck` shortcut.

| Shortcut | Building | Object |
| --- | --- | --- |
| `town` | None | A small town house with a royal blue roof and a gold flag |
| `campaign` | Town Gate (2.1) | The gatehouse with two round towers and open doors |
| `heynspire` | Heynspire tower (2.2) | The white castle of the current painting: a tall central tower and smaller turrets with blue roofs, on a rock |
| `dungeons` | Dungeons cave (2.3) | The cave arch with a torch, a warning barrier and glowing eyes |
| `deck` | Library (2.4) | An open book with a fan of three cards |
| `workshop` | Workshop (2.5) | An anvil with a hammer and a glowing hot card |
| `packs` | Card shop (2.7) | A sealed card pack in purple foil |
| `hero` | Barracks (2.8) | A knight helmet with a blue plume, on a round shield |
| `achievements` | Hall of banners (2.9) | A gold trophy cup in front of a blue and gold banner |
| `seaport` | Seaport quay (2.10) | A moored cargo ship: a small two-masted ship with white sails, a wooden hull, a gold flag, and a wooden bollard with a coiled rope at its bow. The bottom of the hull is flat, so the ship stands on the bar. No other icon is a ship. |
| `bazaar` | Market (2.6) | A striped market tent and a coin purse |
| `handbook` | None | An open book with a quill and a ribbon |
| `settings` | None | A bronze cogwheel with a blue gem, upright in a wooden block |

### 7.4 Steps

1. Run `bun town:prompts`. Make the icons with the prompts and the references of 7.2, with GPT Image, a transparent background and high quality, at 1024 × 1024. Make the `town` icon first: the other icons use it as the set reference.
2. Select each icon with the checklist in 7.5.
3. Fix problems by hand or with inpainting (text-like marks, extra parts, a broken outline).
4. Export each icon as WebP with transparency at 128 × 128 (2× the largest shortcut size). Compress the files (Technical Design, section 6). Put them in `apps/web/public/town/bar/`, with the shortcut ID as the file name (for example `campaign.webp`, and `settings.webp` for the Settings button). Keep the full-size sources in `apps/web/art/town/bar/`, not in `public/`: the server sends each file in `public/` to the browser.
5. Write the licence record (art direction 5.5) for each icon.

### 7.5 Review checklist

- [ ] Each icon is clear at 48 px and at 32 px.
- [ ] The 13 icons have the same outline thickness, view angle, light and scale.
- [ ] Each shortcut icon shows the same object as its Building in section 2. The `heynspire` icon shows the castle of the current painting (2.2).
- [ ] The Settings cogwheel does not look like the Workshop anvil.
- [ ] The `seaport` ship is clear at 48 px, and it stands on the flat bottom of its hull with no water.
- [ ] The Handbook book does not look like the Deck book: it is a cloth-bound field manual with a quill and a ribbon, and it has no cards.
- [ ] The light comes from the upper left.
- [ ] The background is transparent, and the bottom edge of the object is flat.
- [ ] No text, letters, runes, logo or signature in the image.
- [ ] The icons do not look like the icons of another game.
- [ ] The style matches the golden references.

## 8. Pack art

The Packs screen shows the three Packs side by side ([Economy 3.1](./07-economy.md#31-packs)). Each Pack has one painted image. The Packs come from the Card shop (2.7), and the Merchant Pack is the same object as the `packs` icon of the Town Bar (7.3). Until the art exists, the screen shows a CSS Pack in the same box.

### 8.1 Rules for the Pack art

- **Material, not size.** The three Packs have the same body size and the same position on the canvas. The material shows the job of each Pack, from cheap to rich: matte paper, shiny foil, then velvet and gold. A more expensive Pack is not a better deal ([ADR-0027](../adr/0027-the-three-packs-give-equal-value-for-each-coin.md)), so the Royal Pack is not larger or brighter. No glow, no light rays and no extra sparkles.
- **Value, from light to dark.** In greyscale, the bodies go from light to dark: the Peddler Pack is light kraft, the Merchant Pack is a mid-dark purple with a bright band, and the Royal Pack is the darkest. The gold of the Royal Pack is only on the corners, the edges and the seal, on less than about 15% of the front face. Thus the three Packs are easy to tell apart, and the Royal Pack is not brighter.
- **View.** Upright, from the front, with a little depth. The bottom edge is flat and level, so that the three Packs stand on one line.
- **Light.** From the upper left, as in all other art.
- **Outline.** The thick dark brown outline (`#2e1d10`) of the Town Bar icons, at the same thickness on the make canvas.
- **Seal.** The seal of each Pack is at the upper center of the front face.
- **Stamp area.** The lower-right quarter of the front face is plain: no seal, no band end and no ornament. On a Race Pack or a Class Pack, the game puts a round stamp at the center of that quarter, with a bronze rim. The Race Stamp has the Race emblem of the Card Frame. The Class Stamp has the Class emblem of a Skill Card: the Class glyph in ink on parchment. The stamp does not cover the gold corner plate of the Royal Pack. A Race Pack and a Class Pack have no art of their own.
- **No cards.** No card shows out of the Pack, because a card can show a Rank.
- **Size.** Portrait 2:3. Make at 1024 × 1536. The Pack body fills about 80% of the width and 88% of the height. Export at 512 × 768.
- **No text.** No letters, numbers, runes or logo. The game shows the Pack names from the Message Catalogs, in each language.
- **Background.** Transparent, with no ground shadow. The game adds the contact shadow, so that the Pack sits on any surface.
- **States.** Make one closed image for each Pack. The code makes the hover, focus, disabled and **Free** states, the Race Stamp and the Class Stamp. When a Pack opens, the code moves the closed image (a lift, a shake, then a fade) and the face-down cards come in. There is no tear strip, no open Pack and no layer.

### 8.2 Prompts

The game docs do not keep the prompts of the Pack art. Run `bun town:prompts` to write them to `apps/web/art/town/raw/packs/` (section 3). Git ignores this folder.

- `../style-reference.png`: the style reference of section 3.
- `set-reference.png`: the Merchant Pack (`apps/web/art/packs/merchant-pack.webp`) when it exists, else the `packs` icon (`apps/web/art/town/bar/packs-icon.jpg`). The other Packs match its outline, brush and scale.
- `prompts.md`: the setup message, then one prompt for each Pack of 8.3.

Each Pack prompt has the rules of 8.1 and the subject line of the Pack in `scripts/town-art/subjects.ts`. Make the Merchant Pack first. Then run the script again, and make the Peddler Pack and the Royal Pack in one new ChatGPT conversation, with the Merchant Pack as the set reference.

### 8.3 Pack subjects

| Pack | Material | Seal |
| --- | --- | --- |
| `merchant` | Purple foil, gold crimped ends and a royal blue band, as the `packs` icon | A red wax seal with the gold four-point star |
| `peddler` | Kraft paper, folded at the ends like a parcel, a few creases | A plain wax seal under crossed hemp twine with a slightly crooked bow |
| `royal` | Deep crimson velvet with gold corner plates and gold edges | A round gold seal with a raised crown, on a thin gold cord |

### 8.4 Steps

1. Run `bun town:prompts`. Make the Merchant Pack first, with `packs/prompts.md` and the references of 8.2, with GPT Image, a transparent background and high quality, at 1024 × 1536. Save it as `apps/web/art/packs/merchant-pack.webp`, and run `bun town:prompts` again: the other Packs use it as the set reference.
2. Make the Peddler Pack and the Royal Pack. Select each image with the checklist in 8.5.
3. Fix problems by hand or with inpainting (text-like marks, extra parts, a broken outline, an ornament in the stamp area).
4. Put the three Packs on one canvas and check that the bodies have the same size and the same bottom line. Move or scale an image if necessary.
5. Export each Pack as WebP with transparency at 512 × 768: `cwebp -q 80 -resize 512 768 <id>-pack.webp -o <id>.webp`. Put the files in `apps/web/public/packs/` (`peddler.webp`, `merchant.webp`, `royal.webp`). Keep the full-size sources in `apps/web/art/packs/`, not in `public/`.
6. Add a unit test in the same commit as the art. The test reads `apps/web/public/packs/` and checks that it has exactly `peddler.webp`, `merchant.webp` and `royal.webp`, and that each one is a 512 × 768 WebP with alpha (as the card art test of #30).

The licence record (art direction 5.5) of the Pack art is part of the release item in the [roadmap](./09-roadmap.md), not a step of this section.

### 8.5 Review checklist

- [ ] In greyscale at 96 px tall, the three Packs are easy to tell apart.
- [ ] The Merchant Pack and the `packs` icon look like the same object.
- [ ] The three Packs have the same body size and the same bottom line. The Royal Pack does not look larger.
- [ ] The Royal Pack body is the darkest, and its gold is only on the corners, the edges and the seal.
- [ ] The seal is at the upper center, and the lower-right quarter of the front face is plain.
- [ ] No card shows out of a Pack.
- [ ] The light comes from the upper left, and the outline matches the Town Bar icons.
- [ ] The background is transparent, with no ground shadow.
- [ ] No text, letters, runes, logo or signature in the image.
- [ ] The Packs do not look like the card packs of another game.
- [ ] The style matches the golden references.

## 9. Card shop inside

The Packs screen shows the inside of the Card shop (2.7) behind the Packs. One painting covers the full screen. It makes the shop warm, full and a little rich, so that the Player wants to open a Pack. The image is `apps/web/public/town/card-shop-inside.webp`.

### 9.1 Rules for the shop art

- **One painting, a full room.** The room fills the image to all edges. There is no frame and no border.
- **View.** From the customer's side of the counter, at eye level, straight on. The counter goes across the full width at the bottom.
- **A calm center.** The Packs, their plates and the pool plate cover the center (9.2). There, the painting is a plain dark plum curtain with soft folds, low contrast and no small details. Thus the Packs and the text stay easy to read. The details, the people and the bright light are at the left, at the right and at the top.
- **Value.** Mid-dark in total. The brightest areas are the round window and the lantern light. The center is the darkest area, darker than the sides, so that the gold of the Packs and the cream text show clearly.
- **Light.** From the upper left, through the round window, as in all other art. Warm lanterns add small pools of light.
- **The three Packs.** All packs on the shelves and in the hands of the people are the three Packs of section 8, at a small size: the kraft parcel, the purple foil and the crimson velvet. They have no Race Stamp or Class Stamp.
- **No loose cards.** No card face shows, because a card can show a Rank.
- **No text.** Signs and labels show only simple shapes: a gold four-point star, a crown or a coin. No letters, numbers, runes or logo.
- **Detail and humor.** Bright, warm and a little funny (art direction 1). The people and the jokes stay at the sides and at the top.
- **Size.** Landscape 3:2. Make at 1536 × 1024 and export at the same size. The screen covers its full area with the image, so a wide screen crops the top and the bottom, and a 4:3 screen crops the sides.

### 9.2 Positions on the painting

The boxes are in percent of the 1536 × 1024 image. The layout sketch of 9.3 shows them. On a 1366 × 768 laptop screen, the Packs and their plates cover about x 14 to 86 and y 25 to 83. On a wider screen, more of the sides shows.

| Area | Box (x, y) | Content |
| --- | --- | --- |
| Safe area | x 6 to 94, y 12 to 86 | Each screen shape from 4:3 to 19.5:9 shows this area. The shopkeeper's face and the window must be in it. |
| Calm center | x 22 to 78, y 25 to 82 | A plain deep plum velvet curtain with soft folds, lit softly from above. The Packs stand in front of it. |
| High shelf | x 22 to 78, y 13 to 25 | Rows of the three Packs. A goblin apprentice on top of the right end. The pool plate covers its lower edge. |
| Ceiling | x 0 to 100, y 0 to 12 | Dark wood beams, three brass lanterns, strings of pennants and Pack bundles. The title plate and the Balance Plate cover the top corners. |
| Round window | x 2 to 22, y 14 to 46 | The round shop window of 2.7, from the inside. Morning light comes in. A child presses its face on the glass. |
| Left corner | x 0 to 22, y 54 to 80 | A stack of kraft parcels with a sleeping cat on top. |
| Shopkeeper | x 80 to 96, y 26 to 80 | The shopkeeper behind the counter, with tall shelves of Packs behind. The pack in his hand stays in this box too: next to the Royal Pack, it looks like a fourth Pack. |
| Counter | x 0 to 100, y 80 to 100 | A honey-brown wood counter with a carved front. A brass bell at the left end, a coin chest and a coin scale at the right end. The Town Bar covers its lower part. |

### 9.3 Subjects

| Subject | Brief |
| --- | --- |
| Shopkeeper | A plump, cheerful old human with a big curled grey moustache, round spectacles and a purple waistcoat with gold buttons. He leans toward the Player, holds up a Merchant Pack proudly and winks. |
| Apprentice | A small goblin on top of the high shelf. He carries too many Packs and almost drops one. |
| Cat | A fat ginger cat asleep on the kraft parcels. |
| Child | Outside the round window, a small child presses its face and both hands on the glass, as in the humor note of 2.7. |
| Riches | Gold coins in an open chest, a brass scale and brass lanterns. They show that the shop is a place of treasure. |

### 9.4 Prompts

The game docs do not keep the prompts of the shop art. Run `bun town:prompts` to write them to `apps/web/art/town/raw/shop/` (section 3). Git ignores this folder.

- `layout.png`: the layout sketch, with flat shapes at the boxes of 9.2.
- `../style-reference.png`: the style reference of section 3.
- `pack-reference.png`: the three Packs side by side, from `apps/web/art/packs/`.
- `prompts.md`: the setup message, the painting message and a list of fixes.

The painting message is a short form of 9.1 to 9.3. It is in `scripts/town-art/prompts.ts`. When you change the brief, change the painting message and the layout sketch too, then run the script again.

### 9.5 Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `shop/prompts.md` and the references of 9.4, with GPT Image and high quality, at 1536 × 1024.
2. Select one image with the checklist in 9.6.
3. Fix problems with the edit tool of ChatGPT, by hand or with inpainting (the fixes in `prompts.md`).
4. Put a screenshot of the Packs screen over the image at 1366 × 768 and at 1920 × 1080, and check that the center is calm behind the Packs.
5. Export as WebP with no alpha: `cwebp -q 80 card-shop-inside.png -o card-shop-inside.webp`. If the source is already a smaller WebP, use the source. Put the file in `apps/web/public/town/` as `card-shop-inside.webp`, and keep the full-size source in `apps/web/art/town/`. `packs-screen.tsx` shows it (cover, centered), with darker edges over it.

The licence record (art direction 5.5) of the shop art is part of the release item in the [roadmap](./09-roadmap.md), not a step of this section.

### 9.6 Review checklist

- [ ] The center behind the Packs is calm and dark, and the plates and the Pack text stay easy to read.
- [ ] The shopkeeper, the window, the apprentice and the cat are each easy to find, and they are not in the center.
- [ ] The packs in the shop are the three Packs of section 8, and no card face shows.
- [ ] The room looks warm and full, and it makes the Player want to open a Pack.
- [ ] The light comes from the upper left.
- [ ] No text, letters, runes, logo or signature in the image.
- [ ] The shop does not look like a known shop from another game.
- [ ] The style matches the golden references.

## 10. Workshop inside

The Workshop screen ([GDD 7.4](./03-game-design.md#74-workshop)) shows the inside of the Workshop (2.5) behind the card grid and the Station Panel. One painting covers the full screen. It makes the Workshop warm, busy and a little funny, so that the Player wants to Combine a pair. The image is `apps/web/public/town/workshop-inside.webp`.

### 10.1 Rules for the Workshop art

- **One painting, a full room.** The room fills the image to all edges. There is no frame and no border.
- **View.** From the open door, at eye level, straight on. A work bench goes across the full width at the bottom.
- **The same Workshop as the Town.** The room is the inside of the Workshop in the Town painting: a timber frame with heavy beams, pale stone walls and the tall pale stone chimney of the forge.
- **A calm center.** The card grid and the Station Panel cover most of the screen (10.2). There, the painting is a plain back wall of dark smoke-stained timber planks, with low contrast and no small details. Thus the cards and the text stay easy to read. The forge, the people and the bright light are at the left, at the right and at the top.
- **The forge glow stays at the side.** The fire of the forge is at the left edge, low. Its glow lights the floor and the left part of the room, not the center of the back wall. No sparks, smoke or glow go across the center.
- **Value.** Mid-dark in total. The brightest areas are the forge fire and the glowing card on the anvil. The center is the darkest area, darker than the sides, so that the Rank colors of the cards and the cream text show clearly.
- **Light.** From the upper left, through a small high window, as in all other art. The forge adds warm orange light from the low left.
- **No card faces.** The glowing card on the anvil shows only its plain back or its edge. No card face shows, because a card can show a Rank. No pack of section 8 is in the room: the Workshop does not sell Packs.
- **No text.** Signs and labels show only simple shapes: a hammer, a gear or a coin. No letters, numbers, runes or logo.
- **Detail and humor.** Bright, warm and a little funny (art direction 1). The people and the jokes stay at the sides and at the top.
- **Size.** Landscape 3:2. Make at 1536 × 1024 and export at the same size. The screen covers its full area with the image, as on the Packs screen (9.1), so a wide screen crops the top and the bottom, and a 4:3 screen crops the sides.

### 10.2 Positions on the painting

The boxes are in percent of the 1536 × 1024 image. The layout sketch of 10.4 shows them. On a 1366 × 768 laptop screen, the card grid and the Station Panel cover about x 14 to 86 and y 18 to 84: the card grid at the left and in the center, the Station Panel at the right. On a wider screen, more of the sides shows.

| Area | Box (x, y) | Content |
| --- | --- | --- |
| Safe area | x 6 to 94, y 12 to 86 | Each screen shape from 4:3 to 19.5:9 shows this area. The smith, the anvil and the goblin tinker must be in it. |
| Calm wall | x 16 to 84, y 16 to 84 | A plain back wall of dark smoke-stained timber planks, with a few iron tools that hang in shadow. The card grid and the Station Panel stand in front of it. |
| Ceiling | x 0 to 100, y 0 to 16 | Heavy dark timber beams, a chain with a hook, hanging tongs and hammers, one brass lantern, and a small high window at the upper left. The title plate and the Balance Plate cover the top corners. |
| Forge | x 0 to 16, y 10 to 84 | The stone forge with a pale stone hood, and the chimney that goes up to the ceiling along the left edge. The fire is low, at x 0 to 10 and y 50 to 72. A leather bellows. |
| Anvil and smith | x 6 to 16, y 54 to 84 | The anvil in front of the forge. The small dwarf-like smith strikes a glowing card on it. |
| Junk cart | x 84 to 100, y 28 to 84 | The goblin tinker's junk cart, full of gears, pots and springs. The goblin tinker sits on top of it. Barrels and crates below and next to it. |
| Work bench | x 0 to 100, y 84 to 100 | A thick, scarred wood work bench with a vise, files, a small hammer and a few loose gears. A water bucket at the left end. The Town Bar covers its lower part. |

### 10.3 Subjects

| Subject | Brief |
| --- | --- |
| Smith | A small, stocky, dwarf-like smith with a big braided ginger beard, a leather apron and thick gloves. He swings his hammer with all his strength. His tongue sticks out a little. |
| Glowing card | A blank card on the anvil, seen at an angle so that only its plain back and its edge show. It glows white-gold, and a few short sparks fly off it to the left, away from the center. |
| Goblin tinker | A small green goblin with brass goggles on his forehead. He sits on top of his junk cart and fixes a toy-like gear contraption. A spring jumps out of it next to his ear. |
| Junk cart | A small wooden cart with crooked wheels, full of gears, pots, kettles, springs and pipes. |
| Riches | A small open box of gold coins on the work bench, and brass tools. They show that the Workshop also costs Coin. |

### 10.4 Prompts

The game docs do not keep the prompts of the Workshop art. Run `bun town:prompts` to write them to `apps/web/art/town/raw/workshop/` (section 3). Git ignores this folder.

- `layout.png`: the layout sketch, with flat shapes at the boxes of 10.2.
- `../style-reference.png`: the style reference of section 3.
- `outside-reference.png`: the Workshop in the Town painting, cropped from `apps/web/public/town/town.webp`. The inside matches its timber, its pale stone and its chimney.
- `prompts.md`: the setup message, the painting message and a list of fixes.

The painting message is a short form of 10.1 to 10.3. It is in `scripts/town-art/prompts.ts`. When you change the brief, change the painting message and the layout sketch too, then run the script again.

### 10.5 Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `workshop/prompts.md` and the references of 10.4, with GPT Image and high quality, at 1536 × 1024.
2. Select one image with the checklist in 10.6.
3. Fix problems with the edit tool of ChatGPT, by hand or with inpainting (the fixes in `prompts.md`).
4. Put a screenshot of the Workshop screen over the image at 1366 × 768 and at 1920 × 1080, and check that the center is calm behind the card grid and the Station Panel. If the Workshop screen does not exist yet, use the boxes of 10.2.
5. Export as WebP with no alpha: `cwebp -q 80 workshop-inside.png -o workshop-inside.webp`. If the source is already a smaller WebP, use the source. Put the file in `apps/web/public/town/` as `workshop-inside.webp`, and keep the full-size source in `apps/web/art/town/`. The Workshop screen shows it (cover, centered), with darker edges over it, as the Packs screen does.

The licence record (art direction 5.5) of the Workshop art is part of the release item in the [roadmap](./09-roadmap.md), not a step of this section.

### 10.6 Review checklist

- [ ] The center behind the card grid and the Station Panel is calm and dark, and the cards and the text stay easy to read.
- [ ] The forge fire is at the left edge, and its glow and its sparks do not go across the center.
- [ ] The smith, the glowing card, the goblin tinker and the junk cart are each easy to find, and they are not in the center.
- [ ] The room looks like the inside of the Workshop in the Town painting: timber beams, pale stone and the tall chimney.
- [ ] No card face shows, and no Pack is in the room.
- [ ] The light comes from the upper left.
- [ ] No text, letters, runes, logo or signature in the image.
- [ ] The Workshop does not look like a known forge from another game.
- [ ] The style matches the golden references.

## 11. Barracks inside

The Hero screen ([GDD 7.3](./03-game-design.md#73-gear)) shows the inside of the Barracks (2.8) behind the Hero plate and the 4 Gear plates. One painting covers the full screen. It makes the Barracks calm, warm and a little funny, so that the Player wants to come back and upgrade the Gear. The image is `apps/web/public/town/barracks-inside.webp`. Until it exists, the Hero screen shows a timber wall in code, in the same place (`UNPAINTED_HERO_ART` in `apps/web/src/features/hero/hero-art.ts`).

### 11.1 Rules for the Barracks art

- **One painting, a full room.** The room fills the image to all edges. There is no frame and no border.
- **View.** From the middle of the hall, at eye level, straight on. A low bench goes across the full width at the bottom.
- **The same Barracks as the Town.** The room is the inside of the Barracks in the Town painting: pale stone walls, timber beams and arched doors. The training yard shows through an open door.
- **A calm center.** The Hero plate and the Gear Rack cover most of the screen (11.2). There, the painting is a plain back wall of pale stone in soft shadow, with low contrast and no small details. Thus the plates and the text stay easy to read.
- **No Hero and no Gear.** No knight, no Hero figure and no finished Weapon, Armor, Trinket or Banner: the Hero and the Gear looks are Cosmetics that come later (GDD 10). The room shows only practice gear: wooden swords, wooden shields and straw dummies.
- **Value.** Mid-dark in total. The brightest areas are the open door and the high window. The center is the darkest area.
- **Light.** From the upper left, through a small high window, as in all other art. Daylight comes in at the open door at the left.
- **No text.** Banners show only plain blue and gold. No letters, numbers, runes or logo.
- **Detail and humor.** The straw dummy with a cooking pot as a helmet (2.8) stands at the right, and a cat sleeps on the bench. The jokes stay at the sides and at the top.
- **Size.** Landscape 3:2. Make at 1536 × 1024 and export at the same size. The screen covers its full area with the image, as on the Workshop screen (10.1).

### 11.2 Positions on the painting

The boxes are in percent of the 1536 × 1024 image. On a 1366 × 768 laptop screen, the Hero plate and the Gear Rack cover about x 12 to 88 and y 25 to 82.

| Area | Box (x, y) | Content |
| --- | --- | --- |
| Safe area | x 6 to 94, y 12 to 86 | Each screen shape from 4:3 to 19.5:9 shows this area. The weapon rack, the door and the dummy must be in it. |
| Calm wall | x 14 to 86, y 16 to 84 | A plain back wall of pale stone blocks in soft warm shadow, with only a few empty iron hooks. The plates stand in front of it. |
| Ceiling | x 0 to 100, y 0 to 16 | Heavy dark timber beams, a row of long blue and gold banners with no symbols, one iron chandelier, and a small high window at the upper left. The title plate and the Balance Plate cover the top corners. |
| Left side | x 0 to 14, y 16 to 84 | An open arched door with daylight and a glimpse of the training yard, and a wooden weapon rack with practice swords, spears and round shields. |
| Right side | x 86 to 100, y 16 to 84 | The straw dummy with the cooking pot, a wooden bench with a folded blanket and a sleeping cat, and a barrel of wooden practice swords. |
| Floor | x 0 to 100, y 84 to 100 | Worn wooden planks with a little straw, and a long low bench. The Town Bar covers its lower part. |

### 11.3 Subjects

| Subject | Brief |
| --- | --- |
| Training dummy | A straw dummy on a post, with a dented cooking pot as a helmet. It leans a little, as if it is tired. |
| Cat | An orange cat that sleeps on the folded blanket of the bench, curled up. |
| Weapon rack | Blunt wooden practice swords, practice spears and round wooden shields. No real weapon. |

### 11.4 Prompts

Run `bun town:prompts` to write the prompts to `apps/web/art/town/raw/barracks/` (section 3): `layout.png` (the layout sketch, with flat shapes at the boxes of 11.2), `outside-reference.png` (the Barracks cut out of the Town painting) and `prompts.md`. The painting message is a short form of 11.1 to 11.3, in `scripts/town-art/prompts.ts`. When you change the brief, change the painting message and the layout sketch too.

### 11.5 Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `barracks/prompts.md` and the references of 11.4, with GPT Image and high quality, at 1536 × 1024.
2. Select one image with the checklist in 11.6.
3. Fix problems with the edit tool of ChatGPT, by hand or with inpainting.
4. Put a screenshot of the Hero screen over the image at 1366 × 768 and at 1920 × 1080, and check that the center is calm behind the Hero plate and the Gear Rack.
5. Export as WebP with no alpha: `cwebp -q 80 barracks-inside.png -o barracks-inside.webp`. Put the file in `apps/web/public/town/`, and keep the full-size source in `apps/web/art/town/`. Then remove `barracksInside` from `UNPAINTED_HERO_ART` in `apps/web/src/features/hero/hero-art.ts`: a unit test checks the list and the files.

### 11.6 Review checklist

- [ ] The center behind the plates is calm and dark, and the text stays easy to read.
- [ ] The door, the weapon rack, the dummy and the cat are each easy to find, and they are not in the center.
- [ ] The room looks like the inside of the Barracks in the Town painting.
- [ ] No Hero, no knight, and no finished Weapon, Armor, Trinket or Banner.
- [ ] The light comes from the upper left.
- [ ] No text, letters, runes, logo or signature in the image.
- [ ] The style matches the golden references.

## 12. Gear icons

The Hero screen shows one painted icon for each of the 4 Gear items (GDD 7.3): the Weapon, the Armor, the Trinket and the Banner. The icons show the item, not its level: the level number of the screen shows the level. The names and the icons do not depend on the Class of the Hero. Until an icon exists, the screen shows the Gear glyph on a round dark badge in the same box (`UNPAINTED_HERO_ART` in `apps/web/src/features/hero/hero-art.ts`).

### 12.1 Rules for the icons

- **One object for each icon.** No scene, no ground, no frame and no badge circle. The background is transparent.
- **The same set as the Town Bar.** The same thick dark brown outline (`#2e1d10`), view, light and brush as the `hero` Town Bar icon (7.3).
- **Plain items.** No magic glow, no runes, no symbol of a Class and no damage. Royal blue, gold and steel, the colors of the Town banners.
- **Size.** Square 1:1. Make at 1024 × 1024. The object fills about 80% of the canvas. Export at 256 × 256.
- **No text.** No letters, numbers, runes or logo.

### 12.2 Prompts

Run `bun town:prompts` to write the prompts to `apps/web/art/town/raw/gear/` (section 3): `set-reference.png` (the `hero` Town Bar icon) and `prompts.md`. The prompts are in `scripts/town-art/prompts.ts` (`GEAR_SUBJECT` and `gearIconPromptOf`). When you change a subject in 12.3, change it there too.

### 12.3 Icon subjects

| Item | Subject |
| --- | --- |
| Weapon | A short broad sword with a steel blade, a gold cross-guard and a blue leather grip, on its diagonal with the tip to the upper right. |
| Armor | A steel breastplate with a gold trim and two blue leather straps. |
| Trinket | A round gold amulet with one large blue gem, on a short gold chain. |
| Banner | A small blue pennant with a gold border and a swallowtail end, on a short wooden pole with a gold tip. |

### 12.4 Steps

1. Make each icon with `gear/prompts.md` in one ChatGPT conversation, at 1024 × 1024 with a transparent background.
2. Keep the full-size sources in `apps/web/art/hero/gear/` (`weapon.png`, `armor.png`, `trinket.png`, `banner.png`).
3. Export each one at 256 × 256 as WebP with alpha: `cwebp -q 85 -alpha_q 100 -resize 256 256 weapon.png -o weapon.webp`. Put the files in `apps/web/public/hero/gear/`.
4. Remove the IDs of the new icons from `UNPAINTED_HERO_ART` in `apps/web/src/features/hero/hero-art.ts`: a unit test checks the list and the files.

### 12.5 Review checklist

- [ ] The 4 icons look like one set, and like the Town Bar icons.
- [ ] Each item is easy to know at 44 px (a phone in landscape).
- [ ] No item shows a Class: the Weapon is not a staff or a bow, and the Trinket is not a holy symbol.
- [ ] The background is transparent, with clean edges on a dark plate.
- [ ] No text, letters, runes or logo.

## 13. Dungeons cave inside

The Dungeons screen ([GDD 8.4](./03-game-design.md#84-dungeons)) shows the inside of the Dungeons cave (2.3) behind the notice board with the wanted posters and the rail with Fight. One painting covers the full screen. It makes the mine friendly and a little funny, not scary, so that the Player wants to come back for the repeat wins. The image is `apps/web/public/town/cave-inside.webp`, and its source is `apps/web/art/town/cave-inside.webp`. If an ID is in `UNPAINTED_DUNGEON_ART` (`apps/web/src/features/dungeons/dungeon-art.ts`), the Dungeons screen shows a mine gallery in code, in the same place.

### 13.1 Rules for the cave art

- **The same cave as the Town.** The room is the inside of the cave in the Town painting: grey rocks, old timber props and a beam, and the ruined stones of the entrance.
- **Bright, not dark.** Art direction 5 binds it: warm lantern light from the upper left, a second small lantern at the right, and soft glowcap mushrooms in the shadows, from the Glowcap Hollows. No gore, no skulls on show, no noise.
- **A calm center.** The center of the image (about 70% of the width, and the height between 8% and 88%) is a plain rock wall with little detail. The notice board and the rail stand there. Detail goes to the edges.
- **No text and no UI.** No signs with letters, no frames, no posters: the game draws the notice board and the posters.
- **3:2, 1536 × 1024**, the same as the Barracks inside, at the size that covers the screen.

### 13.2 Positions on the painting

| Area | Box (x, y in percent) | Rule |
| --- | --- | --- |
| Top band | y 0 to 8 | The tabs at the top left and the Balance Plate at the top right. Keep it dark and plain. |
| Notice board and rail | x 9 to 91, y 8 to 88 | The calm rock wall. |
| Floor | y 88 to 100 | The Town Bar covers it. Packed earth, a mine cart track, a dropped pick. |
| Left edge | x 0 to 9 | A timber prop and the main lantern. |
| Right edge | x 91 to 100 | A timber prop, a small lantern and the tunnel that goes down. |

### 13.3 Subjects

- A mine gallery with a tunnel that goes down into the dark at the right, with a soft green glow of glowcaps at its end.
- A mine cart on a short track, with roots that come through the ceiling.
- **Humor note:** a Goblin hard hat with a candle on top hangs on a nail, and two small glowing eyes look out of the tunnel, as in the Town.

### 13.4 Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `cave/prompts.md` (section 3), with GPT Image and high quality, at 1536 × 1024. The script writes the layout sketch of 13.2 and the cave of the Town painting as the outside reference. The messages are `CAVE_SETUP_PROMPT` and `CAVE_PROMPT` in `scripts/town-art/prompts.ts`: when you change 13.1 to 13.3, change them too.
2. Select the image that keeps the center calm, and check it with 13.5.
3. Export as WebP with no alpha: `cwebp -q 80 cave-inside.png -o cave-inside.webp`. Put the file in `apps/web/public/town/`, and keep the full-size source in `apps/web/art/town/`. Then remove `caveInside` from `UNPAINTED_DUNGEON_ART` in `apps/web/src/features/dungeons/dungeon-art.ts`: a unit test checks the list and the files.
4. Write the licence record (art direction 5.5) for the image.

### 13.5 Review checklist

- [ ] The room looks like the inside of the cave in the Town painting.
- [ ] The light is warm and comes from the upper left. The room is not dark or scary.
- [ ] The center is a calm rock wall: the notice board and the rail are easy to read on it.
- [ ] The image has no text, no frames and no posters.
- [ ] The Town Bar covers only the floor.

## 14. Heynspire inside

The Heynspire screen ([GDD 8.2](./03-game-design.md#82-heynspire-draft-name), [GDD 11.1](./03-game-design.md#111-screens)) shows the tower as one column of 50 storeys, from Floor 1 at the bottom over the clouds to Floor 50 under the summit, on a sky. The Floor Panel is docked at the right. The game stacks 5 painted parts: the **base**, a **storey** (the 45 Floors that are not Boss Floors), a **Boss storey** (Floors 10, 20, 30, 40 and 50), the **summit**, and the **sky** behind them. The images are in `apps/web/public/heynspire/`, and their sources are in `apps/web/art/town/heynspire/`. If an ID is in `UNPAINTED_HEYNSPIRE_ART` (`apps/web/src/features/heynspire/heynspire-art.ts`), the screen shows a fallback in the same box: storeys of cream stone drawn in CSS (with `tower-stone.webp`, a patch of the old Heynspire inside painting), an SVG summit, and the old Heynspire inside painting (`apps/web/public/town/heynspire-inside.webp`), softened, as the sky.

### 14.1 Rules for the Heynspire art

- **The same tower as the Town.** Cream and white stone blocks, royal blue conical roofs and gold accents, as the Heynspire of the Town painting.
- **Parts that stack.** All parts are seen straight on, at eye level, with no perspective tilt. The top and bottom edges of a storey are straight and level, so that the same storey stacks on itself with no seam. The base, the storeys, the Boss storeys and the summit have the same wall width.
- **One outline.** A Boss storey has the same wall and the same cornice as a storey, so that the outline of the tower does not change at a Boss Floor. Only the summit has merlons: merlons tell the eye that the tower stops. The base has no door: its stair leads into the door of Floor 1, so that the climb starts at Floor 1.
- **An empty door.** The doorway of a storey and of a Boss storey is plain and dark, with no door, no light and no objects: the game paints the door of the Floor state (gold light, wood or dark oak) and the Floor number in it.
- **Bright, not dark.** Art direction 5 binds it: morning light from the upper left, soft white clouds, blue sky. No storm, no night.
- **A calm sky.** The sky has no tower and no wall. Its left half (behind the column) and its right third (behind the Floor Panel) are plain sky and soft cloud. Detail goes to the middle and to the bottom.
- **No text and no UI.** No signs with letters, no numbers on doors, no symbols on the Boss banners: the game draws the Floors, their numbers and the Class seals.
- **Transparent cut-outs.** The base, the storey, the Boss storey and the summit have a transparent background. The sky fills its image.

### 14.2 Parts and positions

The table gives the brief for a new image. The last column gives the boxes of the art in `public/` (x, y in percent of the exported file). The storey, the Boss storey and the summit are trimmed to their stone (14.4), so the exported size is smaller than the size to make. The game shows each part at the width of `PAINTED_PART_WIDTH` (in storey widths), so that the walls align.

| Part | File | Make at | Brief (x, y in percent of the image) | The art in `public/` |
| --- | --- | --- | --- | --- |
| Storey | `storey.webp` | 1536 × 1024 | Wall x 10 to 90. Cornice x 5 to 95, y 0 to 10, with corbels under it. Door x 37 to 63, y 22 to 100. Arrow slits at x 22 and x 78. | 1536 × 944. Wall x 10 to 90. Door x 39 to 61, y 32 to 100 (`STOREY_DOOR.storey`). Width 1. |
| Boss storey | `boss-storey.webp` | 1536 × 1024 | Wall x 10 to 90. Cornice x 5 to 95, y 0 to 10, with corbels under it and a gold trim, as the storey. No merlons. Door x 39 to 61, y 30 to 100, with a carved frame, columns and a gold keystone. Two red banners at x 29 and x 71. | 1536 × 932. Wall x 10 to 90. Door x 41 to 59, y 37 to 100 (`STOREY_DOOR.bossStorey`). Red banners at x 27.3 and x 72.1: the game puts the Class seal of the Boss on them, and the crown on the gold keystone. Width 1, the same as a storey. |
| Summit | `summit.webp` | 1024 × 1536 | Straight on, with level edges. A short wall x 10 to 90 at the bottom, its bottom edge level. Corbels and a ring of merlons x 2 to 98 over it. The roof and a pole with no flag at x 50, its top at y 0: the game draws the flag. | 1008 × 1505. The ring fills the width. The wall at the bottom is x 8.5 to 91.5. The pole is at x 50, its top at y 0. Width 0.96. |
| Base | `base.webp` | 1536 × 1024 | Straight on. A low plinth, its top edge level at x 20 to 80 and y 0, with no door, no windows and no banners. A broad stair climbs to the top edge at x 40 to 60, into the door of Floor 1. Clouds in the bottom third. | 1536 × 769. The plinth is x 15.4 to 84.6. The top step is x 40.2 to 59.2 at y 25.4 (`BASE_STAIR`): Floor 1 stands on it, behind the plinth, and the game cuts the plinth wall away above the stair. Width 1.3. |
| Sky | `sky.webp` | 1536 × 1024 | Plain sky at x 0 to 50 and x 66 to 100. Floating stones with flags and the far Town in the middle. Clouds in the bottom fifth. | 1536 × 1024. |

### 14.3 Subjects

- The cream stone wall of the round tower, with a cornice and corbels, an arched doorway and two arrow slits; a few ivy leaves at one corner only.
- A Boss storey is the same wall as a storey, made grand: a gold trim on the cornice, a carved door frame with columns and a gold keystone, and two plain deep red banners. It has no merlons.
- The summit: a short wall, corbels and a ring of merlons, under the royal blue cone roof with slate tiles and a gold eave trim.
- The tower foot: a low plain plinth with no door, and a broad stair that climbs into the door of Floor 1, in soft white clouds.
- The sky: floating stones with grass on top and small blue and gold flags, and far below them the town on its green hill and the blue sea, very small.

### 14.4 Steps

1. Run `bun town:prompts`. Make the parts with `heynspire/prompts.md` (section "Heynspire tower"), with GPT Image and high quality, at the size of each part. The script writes the layout sketch of one storey (14.2) and the castle of the Town painting as the outside reference. The messages are `HEYNSPIRE_SETUP_PROMPT` and `HEYNSPIRE_PART_PROMPTS` in `scripts/town-art/prompts.ts`: when you change 14.1 to 14.3, change them too.
2. Select one image of each part, and check it with 14.5.
3. Trim the storey, the Boss storey and the summit to their stone: remove the empty rows at the top and the bottom (and the empty columns at the sides of the summit), so that the parts stack with no gap. Export the cut-outs as WebP with alpha, and the sky with no alpha: `cwebp -q 80 -alpha_q 90 storey.png -o storey.webp`, and `cwebp -q 80 sky.png -o sky.webp`. If ChatGPT gives a WebP and the part needs no trim, use it as-is. Put the files in `apps/web/public/heynspire/`, and keep the full-size sources in `apps/web/art/town/heynspire/`. Write the size of each file in `HEYNSPIRE_ART_SIZE` (`heynspire-art.ts`).
4. Measure the doorway of the storey and of the Boss storey, the walls, and the banners of the Boss storey. If they are not at the boxes of 14.2, change `STOREY_DOOR` and `PAINTED_PART_WIDTH` in `heynspire-art.ts`, and the wall and the seal positions in `tower-storey.tsx`, so that the door light, the Floor number and the seals fit the painted storey and the walls align.
5. Remove the ID of each new part from `UNPAINTED_HEYNSPIRE_ART`: a unit test checks the list and the files. Write the licence record (art direction 5.5) of each image in a `.webp.json` file next to it.

### 14.5 Review checklist

- [ ] The parts look like the Heynspire of the Town painting.
- [ ] The light is warm and comes from the upper left. The view is high but not scary.
- [ ] A storey stacks on itself with no seam, and the base, the storeys, the Boss storeys and the summit have the same wall width.
- [ ] A Boss storey stacks on a storey, and a storey stacks on it, with no step in the outline and no merlons.
- [ ] Floor 1 stands on the base with no gap, and the stair of the base leads into its door. The base has no door.
- [ ] The summit stands on Floor 50 with no gap, and its bottom edge is straight.
- [ ] The doorways are empty and plain, at the boxes of 14.2 (or `STOREY_DOOR` is changed).
- [ ] The cut-outs have a transparent background.
- [ ] The sky has no tower and no wall, and its left half and right third are calm.
- [ ] The images have no text and no numbers.

## 15. Hall inside

The Achievements screen ([15 — Achievements, 4](./15-achievements.md#4-achievements-screen), [GDD 11.1](./03-game-design.md#111-screens)) shows the inside of the Hall of banners (2.9) behind the pole with the 4 Category Flags and the Achievement Roll. One painting covers the full screen. It makes the Hall proud, warm and a little funny, a place where the Player's work hangs on the walls. The image is `apps/web/public/town/hall-inside.webp`, and its source is `apps/web/art/town/hall-inside.webp`. If an ID is in `UNPAINTED_ACHIEVEMENTS_ART` (`apps/web/src/features/achievements/achievements-art.ts`), the Achievements screen shows a stone hall in code with two tall red banners, in the same place.

### 15.1 Rules for the Hall art

- **One painting, a full room.** The room fills the image to all edges. There is no frame and no border.
- **View.** From the middle of the hall, at eye level, straight on. A long red carpet goes across the full width at the bottom.
- **The same Hall as the Town.** The room is the inside of the Hall of banners in the Town painting: pale stone walls, timber beams, a tall arched door and long blue and gold banners.
- **A calm center.** The flags and the roll cover most of the screen (15.2). There, the painting is a plain back wall of pale stone in soft shadow, with low contrast and no small details. Thus the flags, the parchment and the text stay easy to read. The flags are blue cloth, so the wall behind them is warm stone, not blue.
- **No Hero and no Cosmetics.** No knight, no Hero figure, no portrait and no Card Back: these are Cosmetics that come later (GDD 10). The trophies are plain cups, shields and medals with no names.
- **Value.** Mid-dark in total. The brightest areas are the high window and the trophies. The center is the darkest area.
- **Light.** From the upper left, through a small high window, as in all other art.
- **No text.** Banners and shields show only plain colors and simple shapes. No letters, numbers, runes or logo.
- **Detail and humor.** The quiet undead bell keeper of 2.9 waves from the stair at the right, next to the bell rope. The jokes stay at the sides and at the top.
- **Size.** Landscape 3:2. Make at 1536 × 1024 and export at the same size. The screen covers its full area with the image, as on the Hero screen (11.1).

### 15.2 Positions on the painting

The boxes are in percent of the 1536 × 1024 image. On a 1366 × 768 laptop screen, the flags and the roll cover about x 6 to 94 and y 10 to 86.

| Area | Box (x, y) | Content |
| --- | --- | --- |
| Safe area | x 6 to 94, y 12 to 86 | Each screen shape from 4:3 to 19.5:9 shows this area. The trophy shelves, the bell rope and the bell keeper must be in it. |
| Calm wall | x 12 to 88, y 14 to 86 | A plain back wall of pale stone blocks in soft warm shadow. The flags and the roll stand in front of it. |
| Ceiling | x 0 to 100, y 0 to 14 | Heavy dark timber beams, a row of long blue and gold banners with no symbols, and a small high window at the upper left. The title plate and the Balance Plate cover the top corners. |
| Left side | x 0 to 12, y 14 to 84 | Tall wooden shelves on stone steps with gold trophy cups, small round shields and medals on ribbons. |
| Right side | x 88 to 100, y 14 to 84 | A thick bell rope from the ceiling, a narrow stone stair, and the bell keeper on the stair. |
| Floor | x 0 to 100, y 84 to 100 | Worn grey stone slabs and a long red carpet. The Town Bar covers its lower part. |

### 15.3 Subjects

| Subject | Brief |
| --- | --- |
| Bell keeper | A small friendly skeleton in a red cap. It stands on the stair, holds the bell rope with one hand, and waves with the other. It is not scary. |
| Trophies | Plain gold cups, small round shields in blue and gold, and medals on red ribbons. No names and no numbers. |
| Banners | Long hanging banners in royal blue and gold, as on the front of the Hall in the Town painting, with no symbols. |

### 15.4 Prompts

Run `bun town:prompts` to write the prompts to `apps/web/art/town/raw/hall/` (section 3): `layout.png` (the layout sketch, with flat shapes at the boxes of 15.2), `outside-reference.png` (the Hall cut out of the Town painting) and `prompts.md`. The messages are `HALL_SETUP_PROMPT` and `HALL_PROMPT` in `scripts/town-art/prompts.ts`: a short form of 15.1 to 15.3. When you change the brief, change the messages and the layout sketch too.

### 15.5 Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `hall/prompts.md` and the references of 15.4, with GPT Image and high quality, at 1536 × 1024.
2. Select one image with the checklist in 15.6.
3. Fix problems with the edit tool of ChatGPT, by hand or with inpainting.
4. Put a screenshot of the Achievements screen over the image at 1366 × 768 and at 1920 × 1080, and check that the center is calm behind the flags and the roll.
5. Export as WebP with no alpha: `cwebp -q 80 hall-inside.png -o hall-inside.webp`. Put the file in `apps/web/public/town/`, and keep the full-size source in `apps/web/art/town/`. Then remove `hallInside` from `UNPAINTED_ACHIEVEMENTS_ART` in `apps/web/src/features/achievements/achievements-art.ts`: a unit test checks the list and the files.
6. Write the licence record (art direction 5.5) for the image.

### 15.6 Review checklist

- [ ] The center behind the flags and the roll is calm and warm, and the text stays easy to read.
- [ ] The trophy shelves, the bell rope and the bell keeper are each easy to find, and they are not in the center.
- [ ] The room looks like the inside of the Hall of banners in the Town painting.
- [ ] No Hero, no knight, no portrait and no Card Back.
- [ ] The light comes from the upper left.
- [ ] No text, letters, numbers, runes, logo or signature in the image.
- [ ] The style matches the golden references.

## 16. Bazaar inside

The Bazaar screen ([GDD 10](./03-game-design.md#10-achievements-cosmetics-and-the-bazaar), [Economy 3.5](./07-economy.md#35-bazaar)) shows the view from inside the Market (2.6) behind the list of Cosmetics: the Player stands in the open-air market square, under the awning of a stall. One painting covers the full screen. It makes the Bazaar warm, rich and a little funny, so that the Player wants to spend Heynstones. The image is `apps/web/public/town/bazaar-inside.webp`.

### 16.1 Rules for the Bazaar art

- **One painting, a full scene.** The market square fills the image to all edges. There is no frame and no border.
- **View.** From under the awning of a stall in the market square, at eye level, straight on. The front edge of the awning goes across the top. A long market counter goes across the full width at the bottom.
- **The same Market as the Town.** The scene is the Market of the Town painting (2.6), at eye level: an open-air square of pale stone paving between warm stone houses with terracotta roofs, the striped tents, the stalls, the fountain and the people who trade there. It is not a hall: there is no roof over the square. The tents keep their colors of the Town painting: orange and cream, yellow and cream, blue and white, red, and white with blue trim.
- **A calm center.** The list of Cosmetics covers most of the screen (16.2). There, the painting is the far side of the square in soft shade: plain stone house fronts with closed shutters and the stone paving, with low contrast and no small details. Thus the item plates, the Heynstone prices and the text stay easy to read. The stalls, the people and the bright light are at the left, at the right and at the top.
- **No Cosmetics.** No Card Back, no Hero portrait, no Gear look and no Board skin shows. These are the items that the Player buys here. The market shows plain goods only: fruit, bread, cloth and pots.
- **Value.** Medium in total. The brightest areas are the sunlit tents at the sides and the lanterns under the awning. The center is the darkest area, darker than the sides, so that the gold of the item plates and the cream text show clearly.
- **Light.** From the upper left, as in all other art. It is a clear morning, as in the Town painting. The sun lights the tents at the sides, the awning shades the top, and warm lanterns add small pools of light.
- **No text.** Signs and labels show only simple shapes: a coin, a fruit or a star. No letters, numbers, runes or logo.
- **Detail and humor.** Bright, warm and a little funny (art direction 1). The people and the jokes stay at the sides and at the top. The goat of 2.6 eats the cloth on the fruit stall. The orc cook of 2.6 stirs the big pot of his food stall. The fortune teller waves from the fortune teller tent.
- **Size.** Landscape 3:2. Make at 1536 × 1024 and export at the same size. The screen covers its full area with the image, as on the Packs screen (9.1), so a wide screen crops the top and the bottom, and a 4:3 screen crops the sides.

### 16.2 Positions on the painting

The boxes are in percent of the 1536 × 1024 image. The layout sketch of 16.4 shows them. On a 1366 × 768 laptop screen, the list of Cosmetics covers about x 24 to 76 and y 14 to 88. On a wider screen, more of the sides shows.

| Area | Box (x, y) | Content |
| --- | --- | --- |
| Safe area | x 6 to 94, y 12 to 86 | Each screen shape from 4:3 to 19.5:9 shows this area. The stall people, the goat, the fountain and the lanterns must be in it. |
| Calm center | x 24 to 76, y 14 to 88 | The far side of the square in soft shade: plain warm stone house fronts with closed wooden shutters, and the stone paving. No tent, no person and no fountain. The list of Cosmetics stands in front of it. |
| Awning | x 0 to 100, y 0 to 14 | The front edge of a long blue and white striped awning with a scalloped edge, hanging brass lanterns and strings of small colored pennants. The title plate and the Balance Plate cover the top corners. |
| Left side | x 0 to 24, y 14 to 88 | The orange and cream striped tent with a pointed top over a fruit stall with stacked crates of fruit and loaves of bread, and the goat that eats the cloth of the stall. Behind them, a part of the round stone fountain with blue water. |
| Right side | x 76 to 100, y 14 to 88 | The red tent with a pointed top over the orc food stall with the big pot, and the small yellow and cream striped fortune teller tent with a sign that shows only a gold star. |
| Counter | x 0 to 100, y 88 to 100 | A long worn market counter with woven baskets, a brass coin scale with small weights and a fat coin purse. The Town Bar covers its lower part. |

### 16.3 Subjects

| Subject | Brief |
| --- | --- |
| Fruit seller | A cheerful human fruit seller behind the left stall, under the orange and cream tent. She holds up an apple and calls to the Player. |
| Goat | A small white goat that pulls and eats the cloth of the left stall, as in the humor note of 2.6. The fruit seller does not look at it yet. |
| Orc cook | A big friendly cook of the Orc people at the right stall, under the red tent, with a striped apron. He stirs the big pot of his food stall with a long wooden spoon and tastes the food. |
| Fortune teller | A robed figure in the small yellow and cream striped fortune teller tent at the right, behind a small table with a glass ball. The tent has a sign with a gold star only. |
| Market goods | Woven baskets of fruit, loaves of bread, bolts of cloth, sacks, crates and clay pots on the stalls. They show that the Player trades here. |
| Fountain | The round pale stone fountain of the Town painting, with blue water. Only a part of it shows at the left, behind the fruit stall. It connects the scene to the Town. |

### 16.4 Prompts

Run `bun town:prompts` to write the prompts to `apps/web/art/town/raw/bazaar/` (section 3): `layout.png` (the layout sketch, with flat shapes at the boxes of 16.2), `outside-reference.png` (the Market cut out of the Town painting: the square with its five tents and its fountain, see 2.6) and `prompts.md` (the setup message, the painting message and a list of fixes). The messages are `BAZAAR_SETUP_PROMPT` and `BAZAAR_PROMPT` in `scripts/town-art/prompts.ts`: a short form of 16.1 to 16.3. When you change the brief, change the messages and the layout sketch too, then run the script again.

### 16.5 Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `bazaar/prompts.md` and the references of 16.4, with GPT Image and high quality, at 1536 × 1024.
2. Select one image with the checklist in 16.6.
3. Fix problems with the edit tool of ChatGPT, by hand or with inpainting (the fixes in `prompts.md`).
4. Put a screenshot of the Bazaar screen over the image at 1366 × 768 and at 1920 × 1080, and check that the center is calm behind the list of Cosmetics.
5. Export as WebP with no alpha: `cwebp -q 80 bazaar-inside.png -o bazaar-inside.webp`. Put the file in `apps/web/public/town/` as `bazaar-inside.webp`, and keep the full-size source in `apps/web/art/town/`. `bazaar-screen.tsx` shows it (cover, centered) in the place of `MarketScene`, with darker edges over it, as the Packs screen does.
6. Write the licence record (art direction 5.5) for the image.

### 16.6 Review checklist

- [ ] The center behind the list of Cosmetics is calm and dark, and the item plates and the text stay easy to read.
- [ ] The fruit seller, the goat, the orc cook and the fortune teller are each easy to find, and they and the fountain are not in the center.
- [ ] The scene looks like the Market of the Town painting at eye level: an open-air square with no roof, pale stone paving, warm stone houses, the striped tents in their Town colors and a part of the fountain.
- [ ] No Card Back, no Hero portrait, no Gear look and no Board skin shows.
- [ ] The light comes from the upper left.
- [ ] No text, letters, numbers, runes, logo or signature in the image.
- [ ] The style matches the golden references.

## 17. Seaport

The Seaport screen ([Economy 2.8](./07-economy.md#28-seaport-expeditions), [ADR-0053](../adr/0053-the-seaport-gathers-coin-on-the-device-clock.md)) shows the harbour of the Seaport quay (2.10), seen from the water, behind the Expedition plaques and the berth plate. One painting covers the full screen. It makes the Seaport busy, sunny and a little funny: the ship goes out while the Player is away, and the cargo waits on the quay. The image is `apps/web/public/town/seaport-inside.webp`, and its source is `apps/web/art/town/seaport-inside.webp`.

### 17.1 Rules for the Seaport art

- **One painting, a full scene.** The harbour fills the image to all edges. There is no frame and no border.
- **View.** From the calm water in front of the quay, at a low height, straight on. The quay is at the right, and the open sea is at the left.
- **The same harbour as the Town.** The scene is the Seaport quay of the Town painting (2.10), from the water: the stone quay along the Town wall, the long wooden piers on posts, the big ship with white sails, the small ship, the square towers with blue roofs and the warm stone houses with blue and terracotta roofs behind.
- **A calm left third.** The code draws the voyage chooser and the berth plate over the left third of the screen (17.2). There, the painting is calm open sea: soft blue water with small gentle waves, low contrast and no small details. Thus the plaques, the rewards and the text stay easy to read. The ships, the people and the details are in the right two thirds.
- **The ship of the icon.** The big ship is the ship of the `seaport` Town Bar icon (7.3): two masts, white sails, a wooden hull and a gold flag.
- **No Cosmetics and no cards.** The cargo is plain: crates, barrels, sacks and fish. No card, no Pack, no Hero portrait and no Card Back shows.
- **Value.** Medium-light in total, a clear morning. The brightest areas are the white sails and the sky. The left third is a calm mid blue, darker than the sky, so that the wood and the parchment of the plaques show clearly.
- **Light.** From the upper left, the same morning light as the Town painting.
- **No text.** Crates, sails and flags show no letters, numbers, runes or logo.
- **Detail and humor.** Bright, warm and a little funny (art direction 1). The gull of 2.10 steals a fish from an open crate, and a cat on a barrel watches it. The people and the jokes stay in the right two thirds.
- **Size.** Landscape 3:2. Make at 1536 × 1024 and export at the same size, with the same morning light as the Town painting. The screen covers its full area with the image, as on the Bazaar screen (16.1).

### 17.2 Positions on the painting

The boxes are in percent of the 1536 × 1024 image. The layout sketch of 17.4 shows them.

| Area | Box (x, y) | Content |
| --- | --- | --- |
| Safe area | x 6 to 94, y 12 to 86 | Each screen shape from 4:3 to 19.5:9 shows this area. The ships, the dock workers, the cat and the gull must be in it. |
| Calm water | x 0 to 36, y 14 to 88 | Calm open sea: soft blue water with small gentle waves and a low, plain horizon. No ship, no boat, no rock, no bird and no pier. The voyage chooser and the berth plate stand in front of it. |
| Sky | x 0 to 100, y 0 to 14 | A narrow band of clear sky with soft white clouds, and a few gulls only at the right. The title plate and the Balance Plate cover the top corners. |
| Ships | x 40 to 72, y 14 to 62 | The big two-masted cargo ship with white sails, moored along the pier, and the small one-masted ship behind it. |
| Pier | x 36 to 70, y 60 to 76 | The long wooden pier on thick posts. It goes from the quay into the water toward the left, and it stops at the edge of the calm water. |
| Town wall | x 66 to 100, y 14 to 52 | The Town wall of warm stone, the houses with blue and terracotta roofs, and the square towers with blue roofs along the quay. |
| Quay | x 66 to 100, y 52 to 88 | The stone quay with crates, barrels, sacks, a small wooden crane and bollards with coiled ropes, the dock workers, the cat and the gull. |
| Water front | x 0 to 100, y 88 to 100 | Calm water with soft reflections of the ships. The Town Bar covers its lower part. |

### 17.3 Subjects

| Subject | Brief |
| --- | --- |
| Cargo ship | The ship of the `seaport` icon: two masts, full white sails, a warm wooden hull and a small gold flag on the tallest mast. It is moored along the pier. |
| Small ship | A small one-masted ship with a white sail, moored behind the cargo ship. |
| Dock workers | A cheerful human dock worker and a big friendly orc dock worker carry one crate together on the quay. |
| Gull and cat | A gull steals a fish from an open crate (the humor note of 2.10). A cat sits on a barrel and watches it. |
| Cargo | Plain wooden crates, barrels, sacks and coiled ropes, with no marks. They show that the ship brings goods back. |
| Towers | The square stone towers with blue pyramid roofs of the Town painting, along the quay. They connect the scene to the Town. |

### 17.4 Prompts

Run `bun town:prompts` to write the prompts to `apps/web/art/town/raw/seaport/` (section 3): `layout.png` (the layout sketch, with flat shapes at the boxes of 17.2), `outside-reference.png` (the Seaport quay cut out of the Town painting at its box in 1.2, a little higher, so the sails show too) and `prompts.md` (the setup message, the painting message and a list of fixes). The messages are `SEAPORT_SETUP_PROMPT` and `SEAPORT_PROMPT` in `scripts/town-art/prompts.ts`: a short form of 17.1 to 17.3. When you change the brief, change the messages and the layout sketch too, then run the script again.

### 17.5 Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `seaport/prompts.md` and the references of 17.4, with GPT Image and high quality, at 1536 × 1024.
2. Select one image with the checklist in 17.6.
3. Fix problems with the edit tool of ChatGPT, by hand or with inpainting (the fixes in `prompts.md`).
4. When the Seaport screen exists, put a screenshot of it over the image at 1366 × 768 and at 1920 × 1080, and check that the left third is calm behind the plaques.
5. Export as WebP with no alpha: `cwebp -q 80 seaport-inside.png -o seaport-inside.webp`. Put the file in `apps/web/public/town/`, and keep the full-size source in `apps/web/art/town/`.
6. Write the licence record (art direction 5.5) for the image.

### 17.6 Review checklist

- [ ] The left third is calm open water, and the plaques and the text stay easy to read over it.
- [ ] The big ship, the small ship, the dock workers, the gull and the cat are each easy to find, and they are not in the left third.
- [ ] The scene looks like the Seaport quay of the Town painting, seen from the water: the stone quay, the long piers, the white sails and the square towers with blue roofs.
- [ ] The big ship is the ship of the `seaport` icon.
- [ ] No card, no Pack, no Hero portrait and no Card Back shows.
- [ ] The light comes from the upper left, in the same morning light as the Town painting.
- [ ] No text, letters, numbers, runes, logo or signature in the image.
- [ ] The style matches the golden references.
