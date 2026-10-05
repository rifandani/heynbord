# 13 — Battlefield Concepts

This document gives the art brief for the Battle Painting: the painted ground and background behind the Board, one for each Region. The Battle Painting is a flat 2D image behind the 3D scene ([web ADR-0007](../../apps/web/docs/adr/0007-the-battlefield-is-a-2d-painting.md)). The Units, the Heroes and the effects stand on it. The Squares are not drawn.

Now no Battle Painting exists. The Battle shows a meadow gradient in its place (`apps/web/src/features/battle/components/battle-painting.tsx`). The first painting to make is Hearthvale (Region 1).

## 1. Rules for the Battle art

- **One painting for each Region.** A Region with no painting uses the Hearthvale painting. Dungeons and Heynspire use it too, until they have their own.
- **View.** From the Battle camera: about 45° down, from the player side. The horizon is far above the top of the screen, so the painting shows only ground. **No sky.**
- **Light.** From the upper left, warm, as in all other art.
- **Size.** Landscape 16:9. Make the master at 3200 × 1800. The game uses a WebP export at 2560 × 1440, less than about 400 KB. The positions in 1.2 use a 1600 × 900 box, so 1 code unit is 2 pixels of the master.
- **No text, no people, no animals** in the open ground. The image has no labels, letters, logo or UI.
- **No Lanes and no Squares.** The open ground has no lines, paths, rows, fences or tiles. The Player must never think that the painting shows a Lane or a Square.
- **Units first.** The open ground is soft and has low contrast, so that each Unit and its Attack and HP line are easy to read on it (Pillar 5). The detail, the dark colors and the humor go to the edges.

### 1.1 Hearthvale

| Item | Brief |
| --- | --- |
| Place | A forest clearing in Hearthvale, where the outlaws of Baron Brassbelly wait for travelers. |
| Ground | A bright, even meadow with short grass, soft light patches and a few small flowers. |
| Edges | Tall old trees with thick roots, ferns and bushes. Shade under the trees. |
| Palette | Leaf greens, warm yellow light, brown bark. No single Race color is the main color. |
| Humor note | At one side edge, a small outlaw camp: a torn tent, crates with a "borrowed" chest, a cold campfire with a pot. Never in the open ground. |
| Time and weather | A clear late morning. Light falls through the leaves. |

### 1.2 Positions on the painting

The painting covers the screen and crops its edges. The positions are in the 1600 × 900 box, for the Battle camera on a 16:9 screen (`apps/web/src/features/battle/scene/layout.ts`, `cameraFrame`).

| Area | Box (x, y) | Rule |
| --- | --- | --- |
| Open ground | x 128 to 1472, y 225 to 648 | Only meadow. The Board and the Heroes stand here. |
| Board, 3 Lanes | x 272 to 1328, y 279 to 576 | The Squares of a Stage. They are not drawn. |
| Board, 4 Lanes | x 352 to 1248, y 270 to 585 | The Squares of a Dungeon or a Floor. They are not drawn. |
| Hero feet | x 240 and 1360, y 414 | Each Hero stands here on the ground, with a ring in its Side color. |
| Top band | y 0 to 225 | The edge of the forest: trunks and shade. The Top Bar covers y 0 to 108. |
| Bottom band | y 648 to 900 | Darker foreground grass, ferns and roots. The Hand Bar covers y 702 to 900. |
| Side bands | x 0 to 128, x 1472 to 1600 | Trees and bushes. A 4:3 screen shows only x 200 to 1400. |

A 21:9 screen crops the top and the bottom: it shows only y 108 to 792. The open ground stays on all screens from 4:3 to 21:9.

```text
 0          128                                          1472        1600
 +-----------+-------------------------------------------+-----------+ 0
 |  forest edge: trunks and shade    (Top Bar to y 108)               |
 +-----------+-------------------------------------------+-----------+ 225
 |   trees   |  open meadow                              |   trees   |
 |           |  H      Board (3 or 4 Lanes, not drawn)  H|  outlaw   |
 |           |                                           |  camp     |
 +-----------+-------------------------------------------+-----------+ 648
 |  foreground grass, ferns, roots   (Hand Bar from y 702)            |
 +--------------------------------------------------------------------+ 900
```

## 2. Prompt

### 2.1 Hearthvale

```text
top-down view of a bright fantasy forest clearing seen from high above at about 45 degrees, wide 16:9 landscape, no sky, no horizon,
a large open meadow of short even grass fills the center, soft warm light patches, a few tiny flowers, low contrast, nothing on the meadow,
tall old trees with thick roots and ferns frame the top edge, the left edge and the right edge, cool shade under the trees,
darker foreground grass, ferns and roots along the bottom edge,
at the right edge under the trees a small messy outlaw camp: a torn tent, wooden crates, a cold campfire with a pot,
Heynbord, painterly fantasy game battlefield illustration, bright warm light, soft brush texture,
light from the upper left through the leaves, leaf greens, warm yellow light and brown bark,
no paths, no lines, no tiles, no grid, no people, no animals, no text, no letters, no logo, no frame, no UI
```

Make the images with GPT Image. Give it this prompt, a 16:9 aspect, and 2 or 3 golden references from art direction 5.1.

## 3. Steps

1. Make 4 to 8 images with the prompt in 2.1. Use the golden references in art direction 5.1 as style references.
2. Select one image with the checklist in 4.
3. Fix problems by hand or with inpainting: paths or lines on the meadow, strange trees, text-like marks.
4. Crop to 16:9 and export the master at 3200 × 1800.
5. Export a WebP at 2560 × 1440, less than about 400 KB (Technical Design, section 6). Name it after the Region, for example `hearthvale.webp`.
6. Put it in `apps/web/public/battle/`, and set its path for the Region in `BATTLE_PAINTINGS` in `apps/web/src/features/battle/battle-painting.ts`.
7. Open a Battle at 4:3, 16:9 and a phone in landscape. Check that the Board and the Heroes stand on the open meadow, and that each Unit and its Attack and HP line are easy to read.
8. Write the licence record (art direction 5.5).

## 4. Review checklist

- [ ] The painting has no sky and no horizon.
- [ ] The open ground in 1.2 has only meadow: no paths, lines, objects, people or animals.
- [ ] Nothing in the painting looks like a Lane, a row or a Square.
- [ ] A Unit with a gold base and a Unit with a red base are both easy to see on the meadow.
- [ ] The edges are darker and have more detail than the center.
- [ ] The light comes from the upper left, as in all other art.
- [ ] No text, letters, logo or signature in the image.
- [ ] The style matches the card illustrations.
