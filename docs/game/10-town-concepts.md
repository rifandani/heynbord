# 10 — Town Concepts

This document gives the art brief for the Town, the first screen of the game ([GDD 11.4](./03-game-design.md#114-town)). The Town is a layered 2D painting ([web ADR-0005](../../apps/web/docs/adr/0005-the-town-is-a-layered-2d-painting.md)): one master painting, then one cut-out layer for each Building that the Player can select. The art must agree with the Building table in GDD 11.4 and with the positions in `apps/web/src/features/town/town.ts`.

Now the Town uses the first master painting, `apps/web/public/town/town.jpg` (1672 × 941). The Town Gate layer `town-gate.webp` is cut out of it by hand. The painting does not follow all of this brief: section 1.2 gives the positions in the current painting. A new export at 3200 × 1800 can replace it with no code change if it keeps the same composition.

## 1. Rules for the Town art

- **One master painting.** Make the full Town in one image, so that all Buildings have the same light, scale and style. Do not make each Building in a separate image.
- **View.** A high bird's-eye view, about 45° down, like a painted map of a town. All Buildings show their front and their roof.
- **Light.** From the upper left, as in all other art.
- **Size.** Landscape 16:9. Export at 3200 × 1800. The code uses a 1600 × 900 coordinate box, so 1 code unit is 2 pixels.
- **No text.** The image has no labels, signs with letters, logo or UI. The game shows the Building labels as text from the Message Catalogs, in each language.
- **Each Building is clear.** Each Building has its own silhouette and some open space around it, so that a Player can find it at a small size (a phone in landscape).
- **Detail and humor.** Bright, warm and a little funny (art direction 1). Small people, animals and jokes are good. They must not hide the Buildings.

### 1.1 Setting and palette

| Item | Brief |
| --- | --- |
| Place | A free town on a green hillside next to the sea. All peoples of Heynbord come here to trade and to start their adventures. |
| Architecture | Mainly warm stone and timber, with terracotta and blue roofs. Small signs of each Race: an orc food stall in the market, elf trees with lanterns, a quiet undead bell keeper on the hall. |
| Palette | Warm stone, terracotta, royal blue roofs, gold banners, green hills, blue sea. No single Race color is the main color. |
| Time and weather | A clear morning. Soft white clouds. |

### 1.2 Positions on the painting

The painting covers the screen and crops its edges (GDD 11.4). The positions are in the 1600 × 900 code box, for the current painting.

| Area | Box (x, y) | Rule |
| --- | --- | --- |
| Ground line | y 864 | The base of the Town Gate. The game keeps this line on the top edge of the Town Bar, on all screens. The painting below it goes under the Town Bar. Put only road and trees there. |
| Safe area | x 224 to 1376, y 251 to 864 | Each screen shape from 4:3 to 19.5:9 shows this area above the Town Bar. All selectable Buildings must be in it. |
| Town Gate | x 570 to 914, y 520 to 864 | The cut-out layer of the Town Gate: the two towers, the arch, the doors and the guards. The wall is not in the layer. |
| Town Gate label | x 570 to 914, y 474 to 520 | The game writes "Campaign" here, on the tips of the two tower roofs. |
| Sky | Above the safe area | A wide screen crops it first. On a 19.5:9 phone, the top of the castle hill is also cropped. |
| Edges | Outside the safe area | A screen can crop them. Decoration Buildings can be here, for example the Dungeons cave. |

```text
 0                  400                 800                1200               1600
 ┌───────────────────────────────────────────────────────────────────────────────┐ 0
 │ sky, clouds      [Heynspire castle on the hill]                               │
 │                                                          sea, ships, piers    │
 │   [Barracks, yard]          [Hall of banners]                                 │
 │                 [Library]          [Card shop]        [Market, fountain]      │
 │                          "Campaign"                 [Workshop, forge smoke]   │ 474
 │  ═══════ town wall ════════╗ [ TOWN GATE ] ╔══════════ town wall ═══ [Cave] ◄─│ 520
 │     trees                  ║  x 570-914    ║                          (edge)   │
 │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ground line y 864: top of the Town Bar ─ ─ ─ ─ ─ ─ │ 864
 └───────────────────────────────────────────────────────────────────────────────┘ 900
```

### 1.3 Ambient layers

The game adds motion on separate layers over the painting. The painting must give a place for each layer. If the positions change, update the constants in `apps/web/src/features/town/components/town-screen.tsx`.

| Layer | Position in the code box | Need in the painting |
| --- | --- | --- |
| Chimney smoke | Workshop forge chimney (1414, 472) | A chimney top. The puffs continue the smoke in the painting. |
| Light on the sea | x 1340 to 1589, y 218 to 251 | Open sea with no buildings or ships in front of it. A phone crops it. |
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
| Position | The right edge (about x 1420 to 1600, y 550 to 720). A screen can crop it. |

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
| Props | An anvil and a work bench outside, glowing sparks at the door, barrels and crates. |
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
| Humor note | A goat eats the cloth on one stall. |
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
bird's-eye view of a bright fantasy hub town on a green hillside next to the sea, seen from high above at about 45 degrees, wide 16:9 landscape,
in the center foreground a large stone town gate with two round towers, blue conical roofs and small gold flags, open wooden doors, a sleepy guard on a stool with a cat on his lap,
a sandy road leaves the gate and winds down to the bottom left toward far green meadows,
a curved stone town wall with small towers runs from left to right behind the gate,
inside the wall: a long stone barracks with a fenced training yard and straw dummies at the far left, a stone library with a blue roof and tall arched windows left of the gate, a wide hall with long blue and gold banners and a low red roof behind the gate, a small narrow card shop with a purple roof and a round window right of the gate, a timber workshop with a tall stone chimney and an anvil outside on the right, a market square with orange, yellow and blue tents near the sea on the right,
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
4. Scale the image so that the Town Gate fills its box in 1.2. Crop to 16:9 and export at 3200 × 1800.
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
