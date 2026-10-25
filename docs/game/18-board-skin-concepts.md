# Board Skin Concepts

This document gives the art brief of the **Board skin** family: the 6 looks of the Board that the Bazaar sells for Heynstones ([Economy 3.5](./07-economy.md#35-bazaar), [GDD 10](./03-game-design.md#10-achievements-cosmetics-and-the-bazaar)). A Board skin changes how the Board looks and never changes gameplay.

A Board skin puts a **Lane runner** under each Lane: a painted strip with one tile for each Square ([web ADR-0012](../../apps/web/docs/adr/0012-a-board-skin-draws-lane-runners.md)). The Battle Painting of the Region stays around the Board ([Battlefield Concepts](./13-battlefield-concepts.md)). The look with no Board skin is the **Standard ground**: the bare Battle Painting, with no runner and no drawn Square.

The briefs of the other families are [Cosmetic Concepts](./16-cosmetic-concepts.md) (Card Backs) and [Hero Portrait Concepts](./17-hero-portrait-concepts.md).

## 1. The 6 Board skins

| Board skin | Item key | File | Tiles |
| --- | --- | --- | --- |
| Meadow Dawn | `meadowDawn` | `meadow-dawn.webp` | Mossy grey-green flagstones with dew, in the first pink-gold light. |
| Mesa Dusk | `mesaDusk` | `mesa-dusk.webp` | Sun-baked red clay tiles in the orange and violet light of dusk. |
| Harbor Night | `harborNight` | `harbor-night.webp` | Dark dock planks with iron nails, a few in warm lantern glow. |
| Hollow Moon | `hollowMoon` | `hollow-moon.webp` | Pale bone-white stone slabs with a cool silver sheen of the moon. |
| Spire Noon | `spireNoon` | `spire-noon.webp` | Honey-cream tower stone with a lapis-blue border, in the clear noon light above the clouds. |
| Deep Crystal | `deepCrystal` | `deep-crystal.webp` | Blue-grey slate of the mine floor with flat amethyst veins, in warm lantern light. |

The 6 skins must be easy to tell apart at **40 px**, because the Bazaar shows each one as a thumbnail of 2 × 2 tiles.

## 2. The Square sheet

Each Board skin is one **Square sheet**: a top-view painting of **6 × 4 separate tiles**. Each tile is one Square of the Board.

| Item | Value |
| --- | --- |
| Export | WebP, 1536 × 1024, opaque |
| Tile | 256 × 256 px, 6 across and 4 down, with no space between the cells |
| Joint | The dark gap at the edge of each tile, 6 to 10 px wide, inside the cell |
| Tile order | Left to right, then top to bottom: tile 0 is at the top left, tile 23 at the bottom right |

The game selects one of the 24 tiles for each Square with a fixed hash, so a Lane does not look repeated. 2 Squares next to each other never get the same tile. On a 1920 px screen, a Square is about 105 px wide. The Lane is 1 Square deep, and the gap between 2 Lanes and the Hero places stay bare.

The game adds in code: the soft edge of each runner, the contact shade under it, and the perspective of the Battle camera. The painting has none of them.

## 3. Rules for a Square sheet

- **Top view, flat.** Each tile is seen from straight above: no perspective, no horizon and no side of a stone. The Battle camera adds the 45° view.
- **Any tile next to any tile.** The game puts the tiles in a new order on each Lane. Thus no pattern, crack or plank may continue from one tile into the next. Each tile is complete in its cell, with its joint on all 4 sides.
- **Units first.** The Units, their Attack and HP line and the target markers stand on the tiles (Pillar 5). Keep the inside of each tile calm and at a middle value, with low contrast. The joints are darker. No tile is near white or near black.
- **Nothing stands up.** No rock, post, lantern, plant or figure rises from a tile. A light, a moss patch or a mark is flat on the surface.
- **Light from the upper left.** As in all other art (art direction 5.1). The time of day of a skin is in the color of the light on the tiles, not in a shadow that crosses the tiles.
- **Variety in small steps.** The 24 tiles are the same material, with small changes: a crack, a moss patch, a different grain, a little more or less light. 3 or 4 tiles carry the special light of the skin (a lantern glow, a moon sheen).
- **A joke, in at most 2 tiles.** A small, flat mark, never at the center of the tile.
- **Separate palettes.** Grey-green and pink-gold; rust red and violet; dark brown and amber on night blue; bone white and silver; honey cream and lapis blue; slate blue-grey and amethyst. No two skins look the same at a glance.
- **No text, logo, rune or signature.** Marks are shapes only.

## 4. The 6 briefs

### 4.1 Meadow Dawn

- **Material.** Old flagstones of grey-green stone (`#8a957a`), each one roughly square, set in a meadow path. Moss (`#6f8f4a`) in the joints and on some corners.
- **Light.** The first sun: a pink-gold light (`#f4c99a`) from the upper left on each stone, and dew drops that catch the light on 3 or 4 tiles.
- **Variety.** A crack, a moss patch, a few small white daisies flat in a joint, a pale lichen ring.
- **Joke.** One tile has a small, flat snail trail that curls into a spiral.
- **Palette.** Grey-green stone, moss green, pink-gold light, dark green-brown joints (`#3a3f2c`).

### 4.2 Mesa Dusk

- **Material.** Sun-baked red clay tiles (`#b5533a`), hand-made and a little uneven, as on a Red Mesas trade road. Dry dust in the joints (`#5a2e22`).
- **Light.** The last sun: a warm orange light (`#e9935a`) on the upper left of each tile, and a violet shade (`#5a3a5a`) in the joints.
- **Variety.** A chipped corner, a finger mark of the maker, a dusty patch, a small crack, a darker fired tile.
- **Joke.** One tile has a goblin bootprint baked into the clay. One tile has a tiny gold fleck that is painted rock, not gold.
- **Palette.** Rust red, ochre, dusk orange and violet shade.

### 4.3 Harbor Night

- **Material.** Dark dock planks (`#4a3524`). Each tile is a block of 3 short planks across the Lane, with 2 iron nails at each end. A darker gap (`#1c1612`) between the tiles.
- **Light.** A clear night: a cool blue light (`#3f5f7a`) on the wood from the upper left. 3 or 4 tiles have a warm lantern glow (`#ffc94a`) on one side, as from a lantern out of the image.
- **Variety.** Salt stains, a worn path in the middle of a plank, a knot, a wet patch that shows the blue light, a coil of rope that is flat on the planks.
- **Joke.** One tile has a small fish skeleton, flat on the planks, where a cat had dinner.
- **Palette.** Dark brown wood, night blue, amber lantern glow, iron grey.

### 4.4 Hollow Moon

- **Material.** Pale stone slabs (`#d8d2bf`) of an old causeway in the Hollow Marches, smooth and a little worn. Dark moss and still water in the joints (`#2f3a3a`).
- **Light.** A full moon: a cool silver sheen (`#cfd8e8`) from the upper left, and a soft green glow (`#8fd08f`) from small flat glowcaps in the joints of 3 or 4 tiles.
- **Variety.** A hairline crack, a moss patch, a faint old carved ring with no symbol in it, a wet sheen.
- **Joke.** One tile has a line of small, wet frog footprints that stop at the edge.
- **Palette.** Bone white, silver, dark teal joints, soft glowcap green. Keep the slabs at a middle value: not white, so the Units and the markers read.

### 4.5 Spire Noon

The Board skin of the Heynspire: the stone of the tower terrace ([Battlefield Concepts 1.7](./13-battlefield-concepts.md)).

- **Material.** Smooth honey-cream tower stone slabs (`#c9b48a`) of the high terrace. Each tile has a thin inset border of royal lapis blue (`#2f4f8f`) just inside its joint, with a fine gold line (`#d4a84a`) on the inner side of the border. Warm grey joints (`#4a4238`).
- **Light.** A clear high noon above the clouds: an even, bright light from the upper left, and a cool sky-blue sheen (`#a9c8e8`) on the polished stone of 3 or 4 tiles, as a reflection of the open sky.
- **Variety.** A hairline crack, a patch worn smooth by many climbers, a small chip in the blue border, a white petal of the tower vines flat on the stone, a soft vein in the stone.
- **Joke.** One tile has a single grey pigeon feather, flat near a corner. One tile has a small torn corner of a climber's map, with lines only and no letters.
- **Palette.** Honey-cream stone, lapis blue border, fine gold line, sky-blue sheen. The border is a plain band: no fleur, emblem or pattern in it. Keep the stone at a middle value: not white, so that it is not the same as Hollow Moon.

### 4.6 Deep Crystal

The Board skin of the Dungeons: the floor of the old mine under the Town ([Battlefield Concepts 1.6](./13-battlefield-concepts.md)).

- **Material.** Rough slate flagstones (`#6e6a72`) of an old mine floor, blue-grey and a little uneven. Packed earth and dust in the joints (`#2e2622`).
- **Light.** A soft warm lantern light (`#d9a066`) from the upper left on each stone, and a violet glow (`#b27ad8`) from thin amethyst veins that lie flat in the stone of 3 or 4 tiles.
- **Variety.** A thin copper ore vein (`#b87333`), a pick mark, a dusty patch, a hairline crack, a darker damp stone.
- **Joke.** One tile has a small chalk drawing of a mine cart in a corner, shapes only. One tile has a sooty goblin handprint.
- **Palette.** Slate blue-grey, copper, amethyst violet, warm lantern light. The amethyst is flat in the stone, never a crystal that stands up. Keep the slate at a middle value: not dark, so the Units and the markers read.

## 5. Prompts

Run `bun board-skin:prompts`. It writes these files to `apps/web/art/board-skins/raw/`. Git ignores that folder.

- `style-reference.png`: the 10 golden references of art direction 5.1 in one image. They set the brush, the light and the palette.
- `set-reference.png`: the first painted Square sheet, if it exists. The other sheets match it in brush, texture and value.
- `prompts.md`: the setup message, then one prompt for each Board skin in the order of 1, then a list of fixes.

Paint **Meadow Dawn** first, and use it as the set reference for the other 5. Use one ChatGPT conversation for the set. `prompts.md` marks a Board skin as painted when its WebP file is in `apps/web/public/board-skins/`.

## 6. Steps for each Board skin

1. Run `bun board-skin:prompts`.
2. Make 4 to 8 images with each prompt, with GPT Image and high quality, in landscape 3:2.
3. Select one image with the checklist in 7.
4. Put the grid on the 256 px cells: move, cut or repaint the tiles by hand until each tile fills its cell with its joint on all 4 sides.
5. Compress: `cwebp -q 82 -resize 1536 1024 <file>.png -o <file>.webp`. The file must be 1536 × 1024.
6. Put the file in `apps/web/public/board-skins/` with the name of 1, and keep the full-size source in `apps/web/art/board-skins/`.
7. Remove the item key from `UNPAINTED_BOARD_SKIN_ART` in `apps/web/src/features/battle/board-skin-art.ts`. A unit test then checks the file and its size.
8. Look at the skin in a Stage Battle and a Dungeon Battle: the Units, the target markers and the Field Effect tiles must read on it.

## 7. Review checklist

- [ ] The sheet is 6 × 4 tiles of 256 px, and each tile has its joint on all 4 sides.
- [ ] No pattern, crack or plank continues from one tile into the next.
- [ ] Top view: no perspective, no side of a stone, nothing that stands up.
- [ ] The inside of each tile is calm and at a middle value.
- [ ] The light comes from the upper left.
- [ ] The skin is easy to tell apart from the other 5 at 40 px.
- [ ] No text, logo, rune or signature.
- [ ] The style matches the golden references.
- [ ] The joke is in at most 2 tiles and is flat.
