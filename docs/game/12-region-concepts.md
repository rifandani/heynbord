# 12 — Region Concepts

This document gives the art brief for the Region Maps: the painted map of each Region that the Campaign screen shows ([GDD 11.5](./03-game-design.md#115-campaign)). A Region Map is a flat 2D painting ([web ADR-0008](../../apps/web/docs/adr/0008-the-region-map-is-a-16-9-painting-with-code-drawn-stage-markers.md)). The painting shows the land and the Trail. The game draws the Stage Markers, the progress line and all text on top of it.

Now no Region Map exists. The Campaign screen is a Stage list (`apps/web/src/features/battle/components/stage-select.tsx`). The first painting to make is Hearthvale (Region 1).

## 1. Rules for the Region art

- **One painting for each Region.** The 3 Region Maps are one set. Make them with the same view, scale, light and style.
- **View.** A high bird's-eye view, about 45° down, like a painted map. The same view as the Town. Landmarks show their front and their roof.
- **Light.** From the upper left, warm, as in all other art.
- **Size.** Landscape 16:9. Make the master at 3200 × 1800. The game uses a WebP export at 2560 × 1440, less than about 400 KB. The positions in 1.1 use a 1600 × 900 box, so 1 code unit is 2 pixels of the master.
- **The Trail.** A natural road (dirt, stone, boardwalk, bridges, steps) goes from the bottom-left edge to the Boss landmark. It has 10 clearings, one for each Stage, in order. The road does not cross itself.
- **Clearings are calm.** Each clearing is a flat open place, about 120 × 80 code units, with soft light and low contrast. The game puts a Stage Marker on it. A clearing has no objects, people or animals.
- **Landmarks.** Each clearing has one small landmark next to it, not on it. The Boss clearing has one large landmark. The landmark shows the place of its Stage ([14 — Campaign Stages](./14-campaign-stages.md)). A Region with no Stages defined yet has only proposed landmarks.
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

The painting must give a calm place for each of these layers. The positions will be in `apps/web/src/features/campaign/` (planned).

| Layer | Position | Need in the painting |
| --- | --- | --- |
| Stage Markers | On the clearing centers in 1.1 | A calm clearing with low contrast. |
| Progress line | A dashed line on the center of the painted road, from the Trail entry to clearing 10. Solid for the done part, faint for the locked part. | A clear road with no trees or roofs over it. |
| Region name and arrows | Top band | Calm far land. |
| Star chest panel | Star chest corner | Calm clouds, water or land. |

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

### 2.2 The Thornwood

`Region 2` · Elves and Orcs · Boss: the Old Bramble

| Item | Brief |
| --- | --- |
| Place | A deep, old forest with giant trees and thorn hedges. Elf villages are high in the trees. Orc hunters make camps on the forest floor. |
| Trail | A forest road of roots and moss, with rope bridges and wooden steps. It goes deeper into the forest to the Boss. |
| Landmarks | 1 a forest gate of two leaning trees · 2 an elf tree with lanterns · 3 a ring of large mushrooms · 4 a rope bridge over a ravine · 5 an orc hunting camp with drums · 6 a ring of mossy standing stones · 7 an elf village of tree houses · 8 a waterfall and a pool · 9 a thorn hedge wall with a hole broken in it |
| Boss landmark | The Old Bramble: a forest giant that sleeps on a hill of brambles. It looks like a huge old tree with a face in the bark. One eye is half open. |
| Palette | Deep emerald, moss green, teal shade, gold light that falls through the leaves, some autumn red. |
| Humor note | An orc is stuck in a thorn bush. A squirrel steals arrows from an elf archer. |
| Time and weather | A bright afternoon. Light falls through the leaves in long beams. |

### 2.3 The Hollow Marches

`Region 3` · Undead and Orcs · Boss: Queen Marrow

| Item | Brief |
| --- | --- |
| Place | Wide marshes with mist, reeds and old dead trees. The Undead of Queen Marrow rule here. Orc war bands camp on the dry hills. Strange, but not scary: the art stays bright (art direction 1). |
| Trail | Old stone roads, then long wooden boardwalks over the water, then a stone causeway to the castle island. |
| Landmarks | 1 a crooked sign post with a lantern (no letters) · 2 a sunken chapel · 3 an orc raft camp with reed roofs · 4 a long boardwalk over a bog · 5 a small graveyard with leaning stones · 6 a broken windmill on a mound · 7 a ferry with a skeleton ferryman · 8 an orc war camp with smoke · 9 an old stone bridge with green fire bowls |
| Boss landmark | The castle of Queen Marrow on an island: pale bone-white stone, thin towers, violet banners, soft green light in the windows. |
| Palette | Misty teal, violet, moss green, bone white, soft green glow. The light is still warm from the upper left. |
| Humor note | A skeleton sits and fishes on a boardwalk. A frog with a small crown sits on a lily pad. |
| Time and weather | A bright late afternoon with low mist on the water. |

## 3. Prompts

All prompts use the same ending, so that the 3 maps look like one set.

### 3.1 Hearthvale

```text
bird's-eye view of a bright fantasy valley seen from high above at about 45 degrees, painted adventure map, wide 16:9 landscape,
a sandy road comes in from the left edge near the bottom, crosses a river and a stream, and winds up and across the valley to a hill at the top right,
along the road ten small flat open clearings with short grass, each clearing empty and calm,
next to the clearings, in order: a shallow muddy river ford with stepping stones, two small wooden bridges side by side over a stream, a water mill with a burning roof and a little smoke, a wooden toll gate across the road, an outlaw camp with tents, a campfire and a very big pot, a ruined stone watchtower, an orc camp with war drums and hide tents, a narrow rocky pass with fallen rocks, a very large oak with a lookout platform,
at the end of the road on a hill a fortified timber and stone hall with a palisade, its roof shaped like a very large feathered hat,
green fields, patches of old forest, a scarecrow wearing a huge hat, small outlaws running away with a cart of pies,
leaf greens, warm yellow fields, brown wood, clear late morning,
soft white clouds frame the edges and corners of the map, calm clouds in the top right corner,
Heynbord, painterly fantasy game map illustration, bright warm light, soft brush texture, clean readable landmark silhouettes,
light from the upper left,
no dashed lines, no markers, no flags on the clearings, no shields, no numbers, no text, no letters, no logo, no frame, no UI
```

### 3.2 The Thornwood

```text
bird's-eye view of a bright fantasy deep forest seen from high above at about 45 degrees, painted adventure map, wide 16:9 landscape,
a mossy forest road of roots comes in from the left edge near the bottom and winds up and across the forest to a hill at the top right,
along the road ten small flat open clearings with moss and short grass, each clearing empty and calm,
next to the clearings: two leaning trees that make a gate, an elf tree with lanterns, a ring of large mushrooms, a rope bridge over a ravine, an orc hunting camp with drums, a ring of mossy standing stones, elf tree houses high in giant trees, a waterfall with a pool, a thorn hedge wall with a hole broken in it,
at the end of the road a huge old tree giant asleep on a hill of brambles, a face in the bark, one eye half open,
an orc stuck in a thorn bush, a squirrel stealing arrows from an elf archer,
deep emerald, moss green, teal shade, some autumn red, gold beams of light through the leaves, bright afternoon,
soft white clouds frame the edges and corners of the map, calm clouds in the top right corner,
Heynbord, painterly fantasy game map illustration, bright warm light, soft brush texture, clean readable landmark silhouettes,
light from the upper left,
no dashed lines, no markers, no flags on the clearings, no shields, no numbers, no text, no letters, no logo, no frame, no UI
```

### 3.3 The Hollow Marches

```text
bird's-eye view of bright fantasy marshlands seen from high above at about 45 degrees, painted adventure map, wide 16:9 landscape,
an old stone road comes in from the left edge near the bottom, becomes long wooden boardwalks over the water, and ends on a stone causeway to an island at the top right,
along the road ten small flat open clearings of dry grass, each clearing empty and calm,
next to the clearings: a crooked sign post with a lantern, a sunken chapel, an orc raft camp with reed roofs, a long boardwalk over a bog, a small graveyard with leaning stones, a broken windmill on a mound, a ferry with a skeleton ferryman, an orc war camp with smoke, an old stone bridge with green fire bowls,
on the island a castle of pale bone-white stone with thin towers, violet banners and soft green light in the windows,
reeds, old dead trees, low mist on the water, a skeleton fishing on a boardwalk, a frog with a tiny crown on a lily pad,
misty teal, violet, moss green, bone white, soft green glow, bright late afternoon, cute and strange, not scary,
soft white clouds frame the edges and corners of the map, calm clouds in the top right corner,
Heynbord, painterly fantasy game map illustration, bright warm light, soft brush texture, clean readable landmark silhouettes,
light from the upper left,
no dashed lines, no markers, no flags on the clearings, no shields, no numbers, no text, no letters, no logo, no frame, no UI
```

If you use the Gemini image skill (`threejs-image-generator`), give it the prompt, a 16:9 aspect, and the Town painting (`apps/web/public/town/town.jpg`) as a style reference. For Regions 2 and 3, also give it the finished Hearthvale map, so that the set matches.

## 4. Steps

1. Make 4 to 8 images with the prompt of the Region. Use the Town painting, and for Regions 2 and 3 the Hearthvale map, as style references.
2. Select one image with the checklist in 5.
3. Fix problems by hand or with inpainting: dashed lines or marks on the road, objects on a clearing, text-like marks, strange buildings.
4. Move the clearings and the Boss landmark to the positions in 1.1, by hand or with inpainting. Crop to 16:9 and export the master at 3200 × 1800.
5. Export a WebP at 2560 × 1440, less than about 400 KB (Technical Design, section 6). Name it after the Region, for example `hearthvale.webp`. Put it in `apps/web/public/campaign/`.
6. Trace the center line of the painted road from the Trail entry to clearing 10, as a list of points in the 1600 × 900 box. The game draws the progress line on these points. Put the path and the file name in the Region Map data in `apps/web/src/features/campaign/` (planned).
7. Open the Campaign screen at 4:3, 16:9, 21:9 and a phone in landscape. Check that all 10 Stage Markers are on their clearings, and that the Region name, the arrows and the Star chest panel do not cover a Stage Marker or the Boss landmark.
8. Write the licence record (art direction 5.5).

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
