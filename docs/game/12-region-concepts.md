# 12 — Region Concepts

This document gives the art brief for the Region Maps: the painted map of each Region that the Campaign screen shows ([GDD 11.5](./03-game-design.md#115-campaign)). A Region Map is a flat 2D painting ([web ADR-0008](../../apps/web/docs/adr/0008-the-region-map-is-a-16-9-painting-with-code-drawn-stage-markers.md)). The painting shows the land and the Trail. The game draws the Stage Markers, the progress line and all text on top of it.

Each Region has 2 paintings, and no more:

| Painting | Where the game shows it | Brief |
| --- | --- | --- |
| **Region Map** | The Campaign screen of the Region | This document |
| **Battle Painting** | Each Battle of the Region, the Boss Stage too | [13 — Battlefield Concepts](./13-battlefield-concepts.md) |

A Stage has no painting of its own. Its landmark is a small part of the Region Map, and its Battle uses the Battle Painting of its Region.

The Hearthvale Region Map exists (`apps/web/public/battle/hearthvale-region.webp`, 1672 × 941). The Campaign screen shows it (`apps/web/src/features/campaign/`). Its clearings are not at the positions of 1.1: they are measured on the painting (see 1.3). The Thornwood and The Hollow Marches have no Region Map yet.

## 1. Rules for the Region art

- **One Region Map for each Region.** The 3 Region Maps are one set. Make them with the same view, scale, light and style.
- **View.** A high bird's-eye view, about 45° down, like a painted map. The same view as the Town. Landmarks show their front and their roof.
- **Light.** From the upper left, warm, as in all other art.
- **Size.** Landscape 16:9. Make the master at 3200 × 1800. The game uses a WebP export at 2560 × 1440, less than about 400 KB. The positions in 1.1 use a 1600 × 900 box, so 1 code unit is 2 pixels of the master.
- **The Trail.** A natural road (dirt, stone, boardwalk, bridges, steps) goes from the bottom-left edge to the Boss landmark. It has 10 clearings, one for each Stage, in order. The road does not cross itself.
- **Clearings are calm.** Each clearing is a flat open place, about 120 × 80 code units, with soft light and low contrast. The game puts a Stage Marker on it. A clearing has no objects, people or animals.
- **Landmarks.** Each clearing has one small landmark next to it, not on it. The Boss clearing has one large landmark. The landmark shows the place of its Stage ([14 — Campaign Stages](./14-campaign-stages.md)). The landmarks are parts of the one Region Map, not separate images. A Region with no Stages defined yet has only proposed landmarks.
- **No markers and no lines.** The painting has no shields, flags on the clearings, dashed lines, arrows or numbers. The game draws them, because they change with the progress of the Player.
- **No text.** The image has no labels, letters, logo or UI. Signs have no letters.
- **Edges.** Soft white clouds frame the edges and the corners, as in a map. The clouds must not cover the road where it comes in at the bottom left.
- **Detail and humor.** Bright, warm and a little funny (art direction 1). Small people, animals and jokes go near the landmarks and at the edges, never on a clearing.

### 1.1 Positions on the painting

The painting covers the screen and crops its edges, as in the Town (`apps/web/src/features/town/town.ts`). The line y 864 stays on the top edge of the Town Bar. The painting below it goes under the Town Bar. The positions are in the 1600 × 900 box. **All 3 Region Maps use the same positions**, so that the game has one set of Stage Marker positions.

| Area | Box (x, y) | Rule |
| --- | --- | --- |
| Safe area | x 224 to 1376, y 295 to 864 | Each screen shape from 4:3 to 21:9 shows this area above the Town Bar. |
| Top band | y 0 to 380 | The game writes the Region name and shows the back and next arrows at the top of the screen. On a 21:9 screen, they cover y 295 to 380. No clearing here. Far land, hills and the top of the Boss landmark can be here. |
| Star chest corner | x 1300 to 1600, y 0 to 400 | The game shows the Star chest panel here. Keep it calm: sky-like clouds, water or plain land. |
| Trail area | x 240 to 1376, y 390 to 830 | All 10 clearings are fully in this area. |
| Boss landmark | x 940 to 1260, y 250 to 440 | The large landmark of the Boss, behind clearing 10. |
| Trail entry | x 0 to 260, y 760 to 864 | The road comes in from the left edge here. |
| Bottom band | y 864 to 900 | Under the Town Bar. Only road, grass or water. |
| Side bands | x 0 to 224, x 1376 to 1600 | A 4:3 screen crops them. Clouds, coast and decoration. No clearing. |

The center of each clearing:

| Clearing | Center (x, y) | Clearing | Center (x, y) |
| --- | --- | --- | --- |
| 1 | 300, 780 | 6 | 860, 690 |
| 2 | 470, 690 | 7 | 1060, 770 |
| 3 | 360, 570 | 8 | 1260, 690 |
| 4 | 540, 470 | 9 | 1300, 540 |
| 5 | 740, 540 | 10 (Boss) | 1120, 430 |

Two clearings are at least 150 units apart. On a phone in landscape, each Stage Marker is then large enough to touch, and two Stage Markers do not touch.

```text
 0          224                                              1376        1600
 +-----------+-------------------------------------------------+-----------+ 0
 |  clouds, far hills        (Region name and arrows)          | Star chest|
 |                                    [ BOSS LANDMARK ]        |  corner   |
 +- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -+- - - - - -+ 380
 |           |           4                      10 (Boss)      |           |
 |  clouds   |      3          5                          9    |  clouds   |
 |           |        2           6                   8        |           |
 |  road ===>|  1                      7                       |           |
 +-----------+-------------------------------------------------+-----------+ 864
 |  under the Town Bar: road, grass or water                               |
 +-------------------------------------------------------------------------+ 900
```

### 1.2 What the game draws on the painting

The painting must give a calm place for each of these layers. The positions are in `apps/web/src/features/campaign/region-map.ts`.

| Layer | Position | Need in the painting |
| --- | --- | --- |
| Stage Markers | On the clearing centers in 1.1 | A calm clearing with low contrast. |
| Progress line | A dashed line on the center of the painted road, from the Trail entry to clearing 10. Solid for the done part, faint for the locked part. | A clear road with no trees or roofs over it. |
| Region name and arrows | Top band | Calm far land. |
| Star chest panel | Star chest corner | Calm clouds, water or land. |

### 1.3 Measured positions

The positions in 1.1 are the target for a new painting. A generated painting does not put its clearings at exactly these positions, so the game uses the positions measured on each final painting. They are in `REGION_MAPS` in `apps/web/src/features/campaign/region-map.ts`: the clearing centers (`stops`) and the center line of the road to each clearing (`legs`), in the 1600 × 900 box.

Hearthvale, measured on its painting:

| Clearing | Center (x, y) | Clearing | Center (x, y) |
| --- | --- | --- | --- |
| 1 | 357, 720 | 6 | 865, 575 |
| 2 | 470, 630 | 7 | 1130, 718 |
| 3 | 418, 438 | 8 | 1305, 685 |
| 4 | 575, 360 | 9 | 1375, 447 |
| 5 | 800, 428 | 10 (Boss) | 1115, 250 |

The Boss clearing is in the top band, in front of Brassbelly Hall. Clearings 1 and 2 are 144 units apart. The screen does not use the safe area of 1.1: it places the painting so that each Stage Marker stays on the screen, above the Town Bar and clear of the Region banner and the Star chest plate (web ADR-0008). Unit tests in `region-map.unit.test.ts` check this for each screen shape, and check that no two Stage Markers touch.

## 2. Regions

The Regions, enemies and Bosses come from GDD 3.3. The names are draft names.

### 2.1 Hearthvale

`Region 1` · Human outlaws and Orc sellswords · Boss: Baron Brassbelly · Stages in [14 — Campaign Stages, 2.1](./14-campaign-stages.md#21-stages)

| Item | Brief |
| --- | --- |
| Place | A green valley of farms, small villages and old forest, near the coast of the Town. The outlaws of Baron Brassbelly stop the travelers on its roads. |
| Trail | A sandy farm road that crosses a river and a stream, then a forest road through a rocky pass, then a log road up a hill to the hall. |
| Landmarks | 1 The Muddy Ford: a shallow, muddy river ford with stepping stones · 2 Two Bridges: two small wooden bridges side by side over a stream · 3 The Burning Mill: a water mill with a burning roof and a little smoke · 4 The Toll Gate: a wooden toll gate across the road · 5 The Outlaw Camp: tents, a campfire and a very big pot · 6 The Old Watchtower: a ruined stone watchtower · 7 The Sellsword Camp: an Orc camp with war drums and hide tents · 8 The Rockfall Pass: a narrow rocky pass with fallen rocks next to the road · 9 The Great Oak: a very large oak with a lookout platform |
| Boss landmark | Brassbelly Hall: a fortified timber and stone hall on a hill, with a palisade. Its roof has the shape of a very large hat, with a feather. |
| Palette | Leaf greens, warm yellow fields, brown wood, blue streams. No single Race color is the main color. |
| Humor note | A scarecrow in a copy of the Baron's large hat. Outlaws run away with a cart of pies. |
| Time and weather | A clear late morning. Soft white clouds. |
| Battle Painting | A forest clearing where the outlaws wait for travelers. Brief in [13 — Battlefield Concepts, 1.1](./13-battlefield-concepts.md#11-hearthvale). |

### 2.2 The Thornwood

`Region 2` · Elves and Feral creatures · Boss: the Old Bramble

| Item | Brief |
| --- | --- |
| Place | A deep, old forest with giant trees and thorn hedges. Elf villages are high in the trees. Feral creatures live in the caves and hollows under the roots: giant spiders, cave bears and old trolls. |
| Trail | A forest road of roots and moss, with rope bridges and wooden steps. It goes deeper into the forest to the Boss. |
| Landmarks | 1 a forest gate of two leaning trees · 2 an elf tree with lanterns · 3 a ring of large mushrooms · 4 a rope bridge over a ravine · 5 a dark cave mouth under giant roots, with a big web across it · 6 a ring of mossy standing stones · 7 an elf village of tree houses · 8 a waterfall and a pool · 9 a thorn hedge wall with a hole broken in it |
| Boss landmark | The Old Bramble: a forest giant that sleeps on a hill of brambles. It looks like a huge old tree with a face in the bark. One eye is half open. |
| Palette | Deep emerald, moss green, teal shade, gold light that falls through the leaves, some autumn red. |
| Humor note | A cave bear is stuck in a thorn bush. A squirrel steals arrows from an elf archer. |
| Time and weather | A bright afternoon. Light falls through the leaves in long beams. |
| Battle Painting | Proposed: a soft, mossy glade between giant trees, with roots, thorn hedges and a cave mouth at the edges. No brief in 13 yet. Until it has its painting, the Region uses the Hearthvale Battle Painting. |

### 2.3 The Hollow Marches

`Region 3` · Undead and Goblins · Boss: Queen Marrow

| Item | Brief |
| --- | --- |
| Place | Wide marshes with mist, reeds and old dead trees. The Undead of Queen Marrow rule here. Goblins dig mines under the dry hills and sell junk to anyone who pays. Strange, but not scary: the art stays bright (art direction 1). |
| Trail | Old stone roads, then long wooden boardwalks over the water, then a stone causeway to the castle island. |
| Landmarks | 1 a crooked sign post with a lantern (no letters) · 2 a sunken chapel · 3 a goblin raft workshop with reed roofs and a smoking chimney · 4 a long boardwalk over a bog · 5 a small graveyard with leaning stones · 6 a broken windmill on a mound · 7 a ferry with a skeleton ferryman · 8 a goblin mine entrance in a dry hill, with rail tracks and smoke · 9 an old stone bridge with green fire bowls |
| Boss landmark | The castle of Queen Marrow on an island: pale bone-white stone, thin towers, violet banners, soft green light in the windows. |
| Palette | Misty teal, violet, moss green, bone white, soft green glow. The light is still warm from the upper left. |
| Humor note | A skeleton sits and fishes on a boardwalk. A frog with a small crown sits on a lily pad. |
| Time and weather | A bright late afternoon with low mist on the water. |
| Battle Painting | Proposed: a dry, grassy island in the marsh, with reeds, still water, dead trees and low mist at the edges. No brief in 13 yet. Until it has its painting, the Region uses the Hearthvale Battle Painting. |

## 3. Prompts

The game docs do not keep the image prompts of the Region Maps. Run `bun campaign:prompts` to write them to `apps/web/art/campaign/raw/`. Git ignores this folder.

- `map-style-reference.png`: the Town painting. It sets the style and the camera.
- `map-set-reference.png`: the Hearthvale Region Map. Regions 2 and 3 attach it, so that the set matches.
- `<region>/prompts.md`: the Region Map conversation, then the Battle Painting conversation ([13 — Battlefield Concepts](./13-battlefield-concepts.md)).

The Region Map prompts come from the brief of the Region in section 2, the clearing centers in 1.1, and the scene line of the Region in `scripts/campaign-art/scenes.ts`: the land, the road, the ground of the clearings and the Boss landmark, in a few words. Add a scene line when you add a Region. To change an image, change the brief or the scene line, then run the script again.

Use one ChatGPT conversation for each Region Map. Attach the layout sketch `apps/web/art/campaign/region-map-layout-3x2.png`, the style reference and (for Regions 2 and 3) the set reference to the setup message. The sketch sets the composition: the road, the 10 clearings (pale ovals), the Boss hill (brown house), the far land (dark green) and the clouds (white). ChatGPT cannot make 16:9, so the sketch is 1536 × 1024, with the 1600 × 900 box of 1.1 in the middle. Crop the top and the bottom to 16:9. The sketch in the same box at 16:9 is `region-map-layout-16x9.png`.

The prompts are short. A long list of rules, counts and "no" words gives bad results, because the model adds the items that the "no" words name. Do not try to get the Stage positions from the words: get them from the sketch. Make the base painting first. Then add each landmark of section 2 and each joke with one edit message. One small edit at a time is much easier for the model than 10 items in one prompt.

## 4. Steps

1. Make 4 to 8 base images with the prompts of the Region and the reference images (section 3).
2. Select one image with the checklist in 5.
3. Add the landmarks and the jokes of the Region with the edit messages (section 3). Fix problems by hand or with inpainting: dashed lines or marks on the road, objects on a clearing, text-like marks, strange buildings.
4. Move the clearings and the Boss landmark near the positions in 1.1, by hand or with inpainting. Crop to 16:9 and export the master at 3200 × 1800.
5. Export a WebP at 2560 × 1440, less than about 400 KB (Technical Design, section 6). Name it after the Region, for example `hearthvale.webp`. Put it in `apps/web/public/campaign/`.
6. Measure the center of each clearing, and trace the center line of the painted road from the Trail entry to clearing 10, as lists of points in the 1600 × 900 box (1.3). The game draws the Stage Markers and the progress line on these points. Put them and the file name in `REGION_MAPS` in `apps/web/src/features/campaign/region-map.ts`, and run its unit tests.
7. Open the Campaign screen at 4:3, 16:9, 21:9 and a phone in landscape. Check that all 10 Stage Markers are on their clearings, and that the Region name, the arrows and the Star chest panel do not cover a Stage Marker or the Boss landmark.
8. Write the licence record (art direction 5.5).
9. If the Region has no Battle Painting, make it with [13 — Battlefield Concepts](./13-battlefield-concepts.md). Do not make a painting for each Stage.

## 5. Review checklist

- [ ] The road comes in at the bottom left, goes through 10 clearings in order and ends at the Boss landmark.
- [ ] The road does not cross itself, and no tree or roof hides it.
- [ ] Each clearing is empty, flat and calm, at its position in 1.1.
- [ ] Each clearing has one small landmark next to it, and the Boss landmark is easy to find.
- [ ] The top band and the Star chest corner are calm.
- [ ] No dashed lines, markers, shields, flags on clearings or numbers in the image.
- [ ] The light comes from the upper left, as in all other art.
- [ ] No text, letters, logo or signature in the image.
- [ ] The image does not look like a known map from another game.
- [ ] The style matches the Town painting and the other Region Maps.
