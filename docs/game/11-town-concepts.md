# 11 — Town Concepts

This document gives the art brief for the Town, the first screen of the game ([GDD 11.4](./03-game-design.md#114-town)). The Town is a layered 2D painting ([web ADR-0005](../../apps/web/docs/adr/0005-the-town-is-a-layered-2d-painting.md)): one master painting, then one cut-out layer for each Building that the Player can select. The art must agree with the Building table in GDD 11.4 and with the positions in `apps/web/src/features/town/town.ts`. Section 7 gives the brief for the Town Bar icons.

Now the Town uses the first master painting, `apps/web/public/town/town.webp` (1986 × 941). It is the 1672 × 941 original, stretched to the side: the center 400 code units keep their shape, and the stretch increases to 1.67× at the left and right edges. This lets a wide desktop screen show the full Heynspire and the full Town Gate. The Town Gate layer `town-gate.webp` is cut out of the original by hand. The painting does not follow all of this brief: section 1.2 gives the positions in the current painting. A new export at 4000 × 1800 can replace it with no code change if it keeps the same composition.

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
| Safe area | x 374 to 1526, y 136 to 864 | Each screen shape from 4:3 to 19.5:9 shows this area above the Town Bar. All selectable Buildings must be in it. |
| Town Gate | x 720 to 1064, y 520 to 864 | The cut-out layer of the Town Gate: the two towers, the arch, the doors and the guards. The wall is not in the layer. |
| Town Gate label | x 720 to 1064, y 474 to 520 | The game writes "Campaign" here, on the tips of the two tower roofs. |
| Balance Plate corner | x 1280 to 1900, y 0 to 320 | The game shows the Balance Plate at the top right of the screen. On a 19.5:9 phone it covers about this box. Do not put a selectable Building or its label in it. |
| Sky | Above the safe area | A screen wider than about 2.2:1 above the Town Bar crops it first. On a 19.5:9 phone, the top of the Heynspire is also cropped. |
| Edges | Outside the safe area | A screen can crop them. Decoration Buildings can be here, for example the Dungeons cave. |

```text
 0                  475                 950                1425               1900
 ┌───────────────────────────────────────────────────────────────────────────────┐ 0
 │ sky, clouds      [Heynspire castle on the hill]                               │
 │                                                          sea, ships, piers    │
 │   [Barracks, yard]          [Hall of banners]                                 │
 │                 [Library]          [Card shop]        [Market, fountain]      │
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

Each screen of GDD 11.1 except Title and Settings has a Building. In v1, only the Town Gate can be selected. The other Buildings are decoration in the plate until their screens exist.

### 2.1 Town Gate

`Campaign` · Selectable in v1 · Cut-out layer

| Field | Brief |
| --- | --- |
| Shape | A large stone gatehouse with two round towers. The towers have blue conical roofs and gold flags. The gate is open, with wooden doors. |
| Props | A gold crest above the arch, banners on the towers, a small guard house, a sign post with arrows that point out of the Town (no letters). |
| Story cue | The road goes out of the gate and down to the bottom left, toward far meadows. It says "go out and fight" with no text. |
| Silhouette hook | The two tower roofs and the open arch. |
| Humor note | A sleepy guard sits on a stool next to the gate, with a cat on his lap. |
| Position | The center of the painting, in the town wall, on the ground line (box in 1.2). |
| Export | Also a layer cut out of the master painting, on a transparent background (step 5 in section 4). |

### 2.2 Heynspire tower

`Heynspire` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A very tall, thin white stone tower with blue roofs. It goes up into the clouds, and the top is not visible. |
| Props | Small windows with light, floating stones around the top, a long stair around the tower. |
| Silhouette hook | The tallest shape in the image. |
| Humor note | A tired climber sits on the stair halfway up, with a water bottle. |
| Position | On a hill at the back left (about x 400 to 500). |

### 2.3 Dungeons cave

`Dungeons` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A dark cave in grey rocks, with old ruined pillars at the entrance. |
| Props | A wooden barrier with a warning skull (cute, not scary), torches, a pick and a lantern on the ground. |
| Silhouette hook | The black arch of the cave. |
| Humor note | Two small glowing eyes look out from the dark. |
| Position | The right edge (about x 1620 to 1900, y 550 to 720). A screen can crop it. |

### 2.4 Library

`Collection and Deck builder` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A stone library with a blue roof and tall arched windows. |
| Props | Book stacks at the door, a small card table outside with two players, a chimney. |
| Silhouette hook | The row of tall arched windows. |
| Humor note | A stack of books is taller than the door. |
| Position | Left of the Town Gate, inside the wall (about x 540 to 670). |

### 2.5 Workshop

`Workshop` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A timber workshop with a brown roof and a tall stone chimney. |
| Props | An anvil and a work bench outside, glowing sparks at the door, barrels and crates, a goblin tinker's junk cart full of gears and pots. |
| Silhouette hook | The tall chimney. |
| Humor note | A small dwarf-like smith hits a glowing card on the anvil. |
| Position | Right of the Town Gate, inside the wall (about x 980 to 1100). |

### 2.6 Market

`Bazaar` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A market square with tents in orange, yellow and blue. |
| Props | Fruit, cloth, a fortune teller tent, an orc food stall with a big pot. |
| Silhouette hook | The group of pointed tent tops. |
| Humor note | A goat eats the cloth on one stall. A wild boulder tortoise sleeps on the road to the Market, and the townsfolk walk around it. |
| Position | The right side, near the sea (about x 1120 to 1320). |

### 2.7 Card shop

`Packs` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A small, narrow house with a purple roof and a large round shop window. |
| Props | Card packs in the window (no letters), a bell over the door, a short queue of customers. |
| Silhouette hook | The purple roof and the round window. |
| Humor note | A child presses its face on the window. |
| Position | Near the Town Gate, right side (about x 900 to 970). |

### 2.8 Barracks

`Hero` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A long stone barracks with a red-brown roof and a fenced training yard. |
| Props | Straw training dummies, a weapon rack, a chimney. |
| Silhouette hook | The fence and the dummies. |
| Humor note | One dummy wears a cooking pot as a helmet. |
| Position | The far left, inside the wall (about x 300 to 460). |

### 2.9 Hall of banners

`Achievements` · Decoration in v1

| Field | Brief |
| --- | --- |
| Shape | A wide hall with a red roof and many long banners in blue and gold on its front. |
| Props | Trophies on the steps (cups and shields), a bell on the roof. |
| Silhouette hook | The row of long banners. |
| Humor note | A quiet undead bell keeper waves from the roof. |
| Position | Behind the Town Gate. Its roof must stay low, under the Town Gate label area (y 474 to 520). |

## 3. Prompts

### 3.1 Master painting

```text
bird's-eye view of a bright fantasy hub town on a green hillside next to the sea, seen from high above at about 45 degrees, wide 2.1:1 landscape,
in the center foreground a large stone town gate with two round towers, blue conical roofs and small gold flags, open wooden doors, a sleepy guard on a stool with a cat on his lap,
a sandy road leaves the gate and winds down to the bottom left toward far green meadows,
a curved stone town wall with small towers runs from left to right behind the gate,
inside the wall: a long stone barracks with a fenced training yard and straw dummies at the far left, a stone library with a blue roof and tall arched windows left of the gate, a wide hall with long blue and gold banners and a low red roof behind the gate, a small narrow card shop with a purple roof and a round window right of the gate, a timber workshop with a tall stone chimney, an anvil outside and a small goblin tinker's junk cart on the right, a market square with orange, yellow and blue tents near the sea on the right, a giant mossy boulder tortoise asleep on the road to the market with townsfolk walking around it,
a very tall thin white stone tower with blue roofs on a hill at the back left, its top lost in the clouds,
a dark cave with old ruined pillars in grey rocks at the right edge,
a calm blue sea with a far island and small sail boats at the back right, soft white clouds in a clear morning sky,
round trees and flower bushes, small happy townsfolk and animals on the roads,
Heynbord, painterly fantasy town map illustration, bright warm light, soft brush texture, clean readable building silhouettes,
light from the upper left, warm stone, terracotta and royal blue roofs, gold accents, green hills,
each building separated by open space, calm sky above the gate, no text, no letters, no labels, no logo, no frame, no UI
```

## 4. Steps

1. Make 4 to 8 images with the prompt in 3.1. Use the golden references as style references.
2. Select one image with the checklist in 5.
3. Fix problems by hand or with inpainting (text-like marks, strange buildings, broken roofs).
4. Scale the image so that the Town Gate fills its box in 1.2. Crop to 2.1:1 and export at 3800 × 1800.
5. Cut the Town Gate layer out of the master painting with an outline, at the box in 1.2, and export it as WebP with transparency. The layer is the same art as the painting, so it aligns exactly. On hover it grows from its base, so no hole shows in the painting below it.
6. Compress the files (Technical Design, section 6). Put them in `apps/web/public/town/`, and change the file names in `town.ts` (`PAINTING_IMAGE` and `SELECTABLE_BUILDINGS`).
7. Check the chimney points and the sea area (1.3). Change the ambient constants if necessary.
8. Write the licence record (art direction 5.5) for the master painting and each cut-out.

## 5. Review checklist

- [ ] All 9 Buildings of section 2 are in the image, and each is easy to find.
- [ ] The base of the Town Gate is on the ground line, and the label area above it is readable.
- [ ] All selectable Buildings are in the safe area.
- [ ] Below the ground line, there is only road and trees.
- [ ] The light comes from the upper left, as in all other art.
- [ ] No text, letters, logo or signature in the image.
- [ ] The image does not look like a known town from another game.
- [ ] The style matches the golden references.

## 6. When the Town changes

- When a screen comes (for example the Workshop), cut its Building out of the same master painting into a new layer, and add the Building to `SELECTABLE_BUILDINGS` in `town.ts`. Its box must be in the safe area.
- When you add a screen with no Building in section 2, add its brief here first. Then paint it into the master painting with inpainting, in the same style.
- When you change the painting, check the ambient layers (1.3) again.

## 7. Town Bar icons

The Town Bar (GDD 11.4) has one shortcut for each entry of `TOWN_SHORTCUTS` in `town.ts`. Each shortcut shows its painted icon, so that the bar looks like a part of the painted world. Each icon shows the same object as its Building in section 2, so the bar and the Town agree.

The Settings button at the right end of the bar also has a painted icon. It replaces the language and sound buttons. It opens the Settings dialog in the center of the screen (GDD 11.4), where the Player sets the audio, the language and the other options. Settings has no Building, so its icon shows a different object (7.3).

The painted icons show at 66 px (48 px on a phone), and they stand out of the top edge of the bar. `DESIGN.md` (Navigation) gives the Shortcut size and states.

### 7.1 Rules for the icons

- **One object for each icon.** No scene, no ground, no frame and no badge circle. The background is transparent.
- **View.** A slight three-quarter view from above, about 30° down. The bottom edge of the object is flat, so that it sits on the bar.
- **Light.** From the upper left, as in all other art.
- **Outline.** A thick dark brown outline (`#2e1d10`, the dark end of the Town Bar wood) around each object. All icons have the same outline thickness.
- **Size.** Square 1:1. Make at 1024 × 1024. The object fills about 85% of the canvas.
- **No text.** No letters, numbers, runes or logo. The game shows the shortcut names from the Message Catalogs, in each language.
- **States.** Make one image for each icon. The code makes the current, hover, focus and locked states (DESIGN.md Navigation).

### 7.2 Icon template

Put the subject from 7.3 in `[SUBJECT]`.

```text
A single hand-painted fantasy game menu icon: [SUBJECT].
Chunky, toy-like proportions with a bold, simple silhouette that stays readable at 48 pixels.
Seen from a slight three-quarter top-down view, about 30 degrees down.
Thick dark brown outline (#2e1d10) around the whole object, painterly soft brush shading inside,
glossy highlights on metal and gems, a warm rim light on the edges.
Light from the upper left. Bright, warm and a little funny. Not dark, not realistic, no gore, no neon.
Palette of warm stone, polished gold and bronze, warm tavern wood, royal blue, terracotta and parchment cream.
The object is centered and fills about 85% of the square canvas. Its bottom edge is flat and level,
so it can sit on a dark carved wood menu bar and stand out of the top edge of the bar.
Small contact shadow under the object only.
Transparent background, isolated object, no scene, no ground, no frame, no border, no badge circle,
no text, no letters, no numbers, no runes, no logo, no watermark.
Square 1:1.
```

### 7.3 Icon subjects

In the order of `TOWN_SHORTCUTS`, then the Settings button.

| Shortcut | Building | `[SUBJECT]` |
| --- | --- | --- |
| `town` | None | a cozy little town house of warm stone and timber with a royal blue roof, a small gold flag on top, a round wooden door, a glowing window and a tiny flower box |
| `campaign` | Town Gate (2.1) | a small stone gatehouse with two round towers, blue conical roofs and tiny gold flags, the wooden doors open, and a sandy road that comes out of the arch toward the viewer |
| `heynspire` | Heynspire tower (2.2) | a very tall, thin white stone tower with blue roofs and a spiral stair around it, small glowing windows, and three small floating stones around its top, with a soft white cloud around the peak |
| `dungeons` | Dungeons cave (2.3) | a dark cave arch in grey rocks with two broken old pillars, a lit torch on one side, a cute (not scary) wooden warning barrier with a small skull, and two small glowing yellow eyes in the dark |
| `deck` | Library (2.4) | an open thick leather book with gold corners, with a fan of three fantasy playing cards that comes out of its pages; the card backs are royal blue with a gold pattern and no symbols |
| `workshop` | Workshop (2.5) | a heavy iron anvil on a wooden stump, with a smith hammer that leans on it and a glowing orange-hot card on top that throws small sparks |
| `packs` | Card shop (2.7) | a sealed fantasy card pack wrapped in purple foil with gold trim, a red wax seal in the middle, and a small sparkle on the shiny wrapper; the top edge is crimped |
| `hero` | Barracks (2.8) | a polished steel knight helmet with a gold crest band and a tall royal blue plume, set on a small round wooden shield |
| `achievements` | Hall of banners (2.9) | a gold trophy cup with two handles, in front of a long hanging banner in royal blue and gold with a swallow-tail end; small sparkles on the cup |
| `bazaar` | Market (2.6) | a small market tent with orange, yellow and blue stripes and a pointed top with a little pennant, and a fat coin purse in front with gold coins that spill out |
| `settings` | None | a chunky polished bronze cogwheel with eight rounded teeth and a round royal blue gem in its center hub, that stands upright in a small slot of a short wooden block; no tools and no other objects |

### 7.4 Steps

1. Make 4 to 8 images of the `town` icon with the template in 7.2. Use the golden references as style references. Select one with the checklist in 7.5.
2. Make each of the other icons with the `town` icon as a reference image. Add this line at the start of the prompt: "Match the attached icon exactly in style, outline thickness, light, view angle and scale."
3. Use GPT Image with a transparent background and high quality, at 1024 × 1024.
4. Fix problems by hand or with inpainting (text-like marks, extra parts, a broken outline).
5. Export each icon as WebP with transparency at 128 × 128 (2× the largest shortcut size). Compress the files (Technical Design, section 6). Put them in `apps/web/public/town/bar/`, with the shortcut ID as the file name (for example `campaign.webp`, and `settings.webp` for the Settings button). Keep the full-size sources in `apps/web/art/town/bar/`, not in `public/`: the server sends each file in `public/` to the browser.
6. Write the licence record (art direction 5.5) for each icon.

### 7.5 Review checklist

- [ ] Each icon is clear at 48 px and at 32 px.
- [ ] The 11 icons have the same outline thickness, view angle, light and scale.
- [ ] Each shortcut icon shows the same object as its Building in section 2.
- [ ] The Settings cogwheel does not look like the Workshop anvil.
- [ ] The light comes from the upper left.
- [ ] The background is transparent, and the bottom edge of the object is flat.
- [ ] No text, letters, runes, logo or signature in the image.
- [ ] The icons do not look like the icons of another game.
- [ ] The style matches the golden references.
