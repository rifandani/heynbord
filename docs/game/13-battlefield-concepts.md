# 13 — Battlefield Concepts

This document gives the art brief for the Battle Painting: the painted ground and background behind the Board, one for each Region and one for the Dungeons. The Battle Painting is a flat 2D image behind the 3D scene ([web ADR-0006](../../apps/web/docs/adr/0006-the-battlefield-is-a-2d-painting.md)). The Units, the Heroes and the effects stand on it. The Squares are not drawn.

All 6 Battle Paintings exist in `apps/web/public/battle/`: `hearthvale.webp` (1672 × 941), and `red-mesas.webp`, `glowcap-hollows.webp`, `thornwood.webp`, `hollow-marches.webp` and `dungeon-cave.webp` (1536 × 864, the middle 16:9 band of the 1536 × 1024 image from ChatGPT). `BATTLE_PAINTINGS` in `apps/web/src/features/battle/battle-painting.ts` gives each Region its painting. A Region with no entry uses the Hearthvale painting. `DUNGEON_PAINTING` in the same file gives all Dungeon Battles the Dungeon cave painting (1.6). Its full 3:2 source is `apps/web/art/town/dungeon-cave-battle.webp`. `HEYNSPIRE_PAINTING` gives all Heynspire Floor Battles `heynspire.webp` (1536 × 864), the Heynspire terrace (1.7). It is the 16:9 band from y 40 of its 1536 × 1024 source, not the middle band, so that the climber on the stair at the top left stays in the image. Its full 3:2 source is `apps/web/art/town/heynspire-battle.webp`. If no painting loads, the Battle shows a meadow gradient (`apps/web/src/features/battle/components/battle-painting.tsx`).

## 1. Rules for the Battle art

- **One painting for each Region.** All Stages of the Region use it, the Boss Stage too. A Stage has no Battle Painting of its own. A Region with no painting uses the Hearthvale painting.
- **One painting for Heynspire.** All Floor Battles use the Heynspire painting (1.7). Until it exists, they use a copy of the Hollow Marches painting, the last Region before Heynspire.
- **One painting for the Dungeons.** All Dungeons are in the Dungeons cave of the Town, so all Dungeon Battles use the Dungeon cave painting (1.6).
- **View.** From the Battle camera: about 45° down, from the player side. The horizon is far above the top of the screen, so the painting shows only ground. **No sky.**
- **Light.** From the upper left, warm, as in all other art.
- **Size.** Landscape 16:9. Make the master at 3200 × 1800. The game uses a WebP export at 2560 × 1440, less than about 400 KB. The positions in 1.8 use a 1600 × 900 box, so 1 code unit is 2 pixels of the master.
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

### 1.2 The Red Mesas

| Item | Brief |
| --- | --- |
| Place | A flat canyon floor in the Red Mesas, between the Orc mesas and the Goblin mines. |
| Ground | A flat, dusty clay floor between the mesas, with small stones. Soft, even light. |
| Edges | Red mesa walls, rail tracks, scrap piles, an orc banner pole and a goblin mine cart. Shade at the foot of the walls. |
| Palette | Rust red, ochre, dusty orange, soft teal shade. No single Race color is the main color. |
| Humor note | At one side edge, a goblin hides in a mine cart with a sack of rocks painted gold. Never in the open ground. |
| Time and weather | A bright, dry midday. Warm light from the upper left. |

### 1.3 The Glowcap Hollows

| Item | Brief |
| --- | --- |
| Place | A mossy floor in the Glowcap Hollows, where the Goblin tunnels break out into the old Elf grove. |
| Ground | A soft, even floor of short moss, with a few tiny pale flowers. Soft, even light. |
| Edges | Giant mushrooms that glow soft cyan and violet, thick roots, mossy rocks, small glowing pools and a goblin tunnel exit with a broken mine cart. Shade under the mushroom caps. |
| Palette | Moss green, deep violet and blue shade, soft cyan and green glow, warm brown roots. No single Race color is the main color. |
| Humor note | At one side edge, a goblin uses a glowing mushroom as a lamp, and a tiny mushroom spirit sits on its helmet. Never in the open ground. |
| Time and weather | A bright late afternoon. The edges are in soft shade, so the mushrooms glow. Warm light from the upper left. |

### 1.4 The Thornwood

| Item | Brief |
| --- | --- |
| Place | A glade between the giant trees of the Thornwood, near the caves of the Feral creatures. |
| Ground | A soft, mossy glade with short grass and a few fallen leaves. Soft light patches. |
| Edges | Trunks of giant trees, thick roots, thorn hedges, mossy standing stones and a dark cave mouth under the roots. Shade under the trees. |
| Palette | Deep emerald, moss green, teal shade, gold light, some autumn red at the edges. No single Race color is the main color. |
| Humor note | At one side edge, a cave bear is stuck in a thorn bush, and a squirrel runs away with an elf arrow. Never in the open ground. |
| Time and weather | A bright afternoon. Light falls through the leaves from the upper left. |

### 1.5 The Hollow Marches

| Item | Brief |
| --- | --- |
| Place | A dry, grassy island in the Hollow Marches, between still water and old dead trees. |
| Ground | Firm, flat ground with short, pale green and gold grass. Soft, even light. |
| Edges | Still water with reeds and lily pads, old dead trees, pale stones, a broken boardwalk and low mist on the water. |
| Palette | Misty teal, moss green, pale gold grass, violet shade, bone white, soft green glow. No single Race color is the main color. |
| Humor note | At one side edge, a skeleton sits on the broken boardwalk and fishes. A frog with a small crown sits on a lily pad next to it. Never in the open ground. |
| Time and weather | A bright late afternoon. Low mist on the water at the edges, never on the open ground. |

### 1.6 The Dungeon cave

| Item | Brief |
| --- | --- |
| Place | A wide hall deep in an old mine cave, with grey rock, old timber and small glowing mushrooms (see 11 — Town Concepts 2.3 and 13: the same cave as the Town and the Dungeons screen). |
| Ground | A flat, even floor of packed earth and smooth grey stone, with a little dust. Soft, even light. |
| Edges | Rough grey rock walls, old timber props and beams, brass lanterns on the props, crates and barrels, a short mine cart track with a cart full of grey rocks, small clusters of glowcap mushrooms with a soft green glow, and the dark mouth of a side tunnel. Shade at the foot of the walls. |
| Palette | Warm grey stone, packed earth brown, warm timber, lantern gold, soft glowcap green. No single Race color is the main color. |
| Humor note | At one side edge, a goblin miner sleeps in a mine cart with a candle on his hard hat, and two small glowing eyes look out of the side tunnel. Never in the open ground. |
| Time and weather | Inside the cave, bright and friendly, not dark or scary. Warm lantern light, and a wide shaft of daylight from a hole in the rock roof at the upper left falls on the open ground. |

### 1.7 Heynspire

| Item | Brief |
| --- | --- |
| Place | A wide, round terrace of white stone high on the Heynspire tower, above the clouds (see 11 — Town Concepts 2.2 and 14: the same tower as the Town and the Heynspire screen). |
| Ground | A flat, even floor of smooth pale stone, worn soft by many feet, with a little dust. Soft, even light. No joints, slabs or pattern that looks like Squares. |
| Edges | A low stone wall with blue banners, the outside stair that goes up and down out of the image, floating stones with small flags, and the tops of clouds far below. Shade at the foot of the wall. |
| Palette | White and pale gold stone, royal blue roofs and banners, sky blue, soft cloud white. No single Race color is the main color. |
| Humor note | At one side edge, a tired young climber with a big backpack sits on the top step of the stair with a water bottle and fans himself with his map (see 11 — Town Concepts 2.2: the climber of the Town painting). Never in the open ground. |
| Time and weather | A clear, bright morning above the clouds, with light from the upper left. A light wind moves the banners. |

### 1.8 Positions on the painting

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

## 2. Prompts

The game docs do not keep the image prompts of the Battle Paintings. Run `bun campaign:prompts` to write them to `apps/web/art/campaign/raw/` ([12 — Region Concepts, 3](./12-region-concepts.md#3-prompts)). Git ignores this folder.

- `battle-style-reference.png`: 3 golden references of art direction 5.1 in one image.
- `battle-set-reference.png`: the Hearthvale Battle Painting. The other Regions attach it, so that the set matches.
- `<region>/prompts.md`, section "Battle Painting": the setup message, with the rules of section 1, then the painting message, with the brief of the Region.

The script makes a Battle Painting prompt for each Region that has a brief in section 1. The Battle Painting prompts of the Dungeon cave (1.6) and of Heynspire (1.7) are not here: run `bun town:prompts`. They are in `apps/web/art/town/raw/cave/prompts.md` and `apps/web/art/town/raw/heynspire/prompts.md`, after the inside painting of the Building (11 — Town Concepts 3). To add a Region, write its brief as a `### 1.N <Region name>` table with the fields Place, Ground, Edges, Palette, Humor note, and Time and weather. Then run the script again.

## 3. Steps

1. Make 4 to 8 images with the prompts of the Region (section 2).
2. Select one image with the checklist in 4.
3. Fix problems by hand or with inpainting: paths or lines on the meadow, strange trees, text-like marks.
4. Crop to 16:9 and export the master at 3200 × 1800.
5. Export a WebP at 2560 × 1440, or at the size of the crop if the image is smaller, less than about 400 KB (Technical Design, section 6). Name it after the Region, for example `red-mesas.webp`. The Dungeon cave painting is `dungeon-cave.webp`, and the Heynspire painting is `heynspire.webp`.
6. Put it in `apps/web/public/battle/`, and set its path for the Region in `BATTLE_PAINTINGS` in `apps/web/src/features/battle/battle-painting.ts`. For the Dungeon cave, the path is `DUNGEON_PAINTING` in the same file. For Heynspire, replace the file of `HEYNSPIRE_PAINTING`, and keep the full 3:2 source as `apps/web/art/town/heynspire-battle.webp`.
7. Open a Battle at 4:3, 16:9 and a phone in landscape. Check that the Board and the Heroes stand on the open meadow, and that each Unit and its Attack and HP line are easy to read.
8. Write the licence record (art direction 5.5).

## 4. Review checklist

- [ ] The painting has no sky and no horizon.
- [ ] The open ground in 1.8 has only meadow or plain floor: no paths, lines, objects, people or animals.
- [ ] Nothing in the painting looks like a Lane, a row or a Square.
- [ ] A Unit with a gold base and a Unit with a red base are both easy to see on the meadow.
- [ ] The edges are darker and have more detail than the center.
- [ ] The light comes from the upper left, as in all other art.
- [ ] No text, letters, logo or signature in the image.
- [ ] The style matches the card illustrations.
