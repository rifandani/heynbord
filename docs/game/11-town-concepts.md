# 11 — Town Concepts

This document gives the art brief for the Town, the first screen of the game ([GDD 11.4](./03-game-design.md#114-town)). The Town is a layered 2D painting ([web ADR-0005](../../apps/web/docs/adr/0005-the-town-is-a-layered-2d-painting.md)): one master painting, then one cut-out layer for each Building that the Player can select. The art must agree with the Building table in GDD 11.4 and with the positions in `apps/web/src/features/town/town.ts`. Section 7 gives the brief for the Town Bar icons, section 8 gives the brief for the Pack art, and section 9 gives the brief for the inside of the Card shop, behind the Packs screen.

Now the Town uses the first master painting, `apps/web/public/town/town.webp` (1986 × 941). It is the 1672 × 941 original, stretched to the side: the center 400 code units keep their shape, and the stretch increases to 1.67× at the left and right edges. This lets a wide desktop screen show the full Heynspire and the full Town Gate. The Town Gate layer `town-gate.webp` and the Card shop layer `card-shop.webp` are cut out of the painting by hand. The painting does not follow all of this brief: section 1.2 gives the positions in the current painting. A new export at 4000 × 1800 can replace it with no code change if it keeps the same composition.

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
| Card shop | x 1010 to 1209, y 436 to 612 | The cut-out layer of the Card shop: the house with the purple roof, its awnings and its stalls. The box covers the right tower of the Town Gate at its lower left, so the game cuts that corner from the selectable area, and the pointer there selects the Town Gate. |
| Card shop label | x 1010 to 1209, y 390 to 436 | The game writes "Packs" here, above the purple roof. |
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

Each screen of GDD 11.1 except Title and Settings has a Building. The Town Gate and the Card shop can be selected. The other Buildings are decoration in the plate until their screens exist.

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

`Packs` · Selectable · Cut-out layer

| Field | Brief |
| --- | --- |
| Shape | A small, narrow house with a purple roof and a large round shop window. |
| Props | Card packs in the window (no letters), a bell over the door, a short queue of customers. |
| Silhouette hook | The purple roof and the round window. |
| Humor note | A child presses its face on the window. |
| Position | Near the Town Gate, right side. In the current painting, it is at x 1010 to 1209 (box in 1.2). |
| Export | Also a layer cut out of the master painting, on a transparent background (step 5 in section 4). |

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

The game docs do not keep the image prompts of the Town. Run `bun town:prompts` to write them to `apps/web/art/town/raw/`. Git ignores this folder.

- `style-reference.png`: 4 golden references of art direction 5.1 in one image. They set the brush, the light and the palette.
- `painting/prompts.md`: the setup message, then the painting message.
- `bar/`: the prompts of the Town Bar icons (7.2).
- `packs/`: the prompts of the Pack art (8.2).
- `shop/`: the prompts of the Card shop inside (9.4).

The painting message is a short form of the briefs in sections 1 and 2. It is in `scripts/town-art/prompts.ts`. When you change a brief, change the painting message too, then run the script again.

## 4. Steps

1. Run `bun town:prompts`. Make 4 to 8 images with `painting/prompts.md` and the style reference (section 3).
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

In the order of `TOWN_SHORTCUTS`, then the Settings button.

| Shortcut | Building | Object |
| --- | --- | --- |
| `town` | None | A small town house with a royal blue roof and a gold flag |
| `campaign` | Town Gate (2.1) | The gatehouse with two round towers and open doors |
| `heynspire` | Heynspire tower (2.2) | The tall white tower with a stair and floating stones |
| `dungeons` | Dungeons cave (2.3) | The cave arch with a torch, a warning barrier and glowing eyes |
| `deck` | Library (2.4) | An open book with a fan of three cards |
| `workshop` | Workshop (2.5) | An anvil with a hammer and a glowing hot card |
| `packs` | Card shop (2.7) | A sealed card pack in purple foil |
| `hero` | Barracks (2.8) | A knight helmet with a blue plume, on a round shield |
| `achievements` | Hall of banners (2.9) | A gold trophy cup in front of a blue and gold banner |
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
- [ ] The 12 icons have the same outline thickness, view angle, light and scale.
- [ ] Each shortcut icon shows the same object as its Building in section 2.
- [ ] The Settings cogwheel does not look like the Workshop anvil.
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
- **Race stamp area.** The lower-right quarter of the front face is plain: no seal, no band end and no ornament. On a Race Pack, the game puts a round stamp at the center of that quarter, with the Race emblem of the Card Frame and a bronze rim. The stamp does not cover the gold corner plate of the Royal Pack. A Race Pack has no art of its own.
- **No cards.** No card shows out of the Pack, because a card can show a Rank.
- **Size.** Portrait 2:3. Make at 1024 × 1536. The Pack body fills about 80% of the width and 88% of the height. Export at 512 × 768.
- **No text.** No letters, numbers, runes or logo. The game shows the Pack names from the Message Catalogs, in each language.
- **Background.** Transparent, with no ground shadow. The game adds the contact shadow, so that the Pack sits on any surface.
- **States.** Make one closed image for each Pack. The code makes the hover, focus, disabled and **Free** states, and the Race stamp. When a Pack opens, the code moves the closed image (a lift, a shake, then a fade) and the face-down cards come in. There is no tear strip, no open Pack and no layer.

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
3. Fix problems by hand or with inpainting (text-like marks, extra parts, a broken outline, an ornament in the Race stamp area).
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
- **A calm center.** The Packs, their plates and the Pool strip cover the center (9.2). There, the painting is a plain dark plum curtain with soft folds, low contrast and no small details. Thus the Packs and the text stay easy to read. The details, the people and the bright light are at the left, at the right and at the top.
- **Value.** Mid-dark in total. The brightest areas are the round window and the lantern light. The center is the darkest area, darker than the sides, so that the gold of the Packs and the cream text show clearly.
- **Light.** From the upper left, through the round window, as in all other art. Warm lanterns add small pools of light.
- **The three Packs.** All packs on the shelves and in the hands of the people are the three Packs of section 8, at a small size: the kraft parcel, the purple foil and the crimson velvet. They have no Race stamp.
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
| High shelf | x 22 to 78, y 13 to 25 | Rows of the three Packs. A goblin apprentice on top of the right end. The Pool strip covers its lower edge. |
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
