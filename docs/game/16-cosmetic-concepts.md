# Cosmetic Concepts

This document gives the art brief of the Cosmetics of v1: the items that change how the game looks ([GDD 10](./03-game-design.md#10-achievements-cosmetics-and-the-bazaar), [Economy 3.5](./07-economy.md#35-bazaar)). A Cosmetic never changes gameplay.

v1 has 4 families: Card Back, Hero portrait, Gear look and Board skin. This document has the brief of the **Card Back** family. The Hero portrait family is in [Hero Portrait Concepts](./17-hero-portrait-concepts.md), the Board skin family is in [Board Skin Concepts](./18-board-skin-concepts.md), and the Gear look family is in [Gear Look Concepts](./19-gear-look-concepts.md).

The game keeps the bronze frame, the bevel, the inner gold line and the Heynbord emblem in code. A painting is the **face** of a Card Back, inside that frame. The face of the Standard Back is in code: dark leather with a gold diamond tooling.

## 1. The 8 Card Backs

| Card Back | Item key | File | Face |
| --- | --- | --- | --- |
| Tent Stripes | `tentStripes` | `tent-stripes.webp` | The striped cloth of the market tents. |
| Gold Fleur | `goldFleur` | `gold-fleur.webp` | Navy velvet with a gold fleur lattice. |
| Sea Chart | `seaChart` | `sea-chart.webp` | An old chart on parchment, in sepia ink. |
| Lantern Sails | `lanternSails` | `lantern-sails.webp` | A night sea with cream sails and lanterns. |
| Goat-bitten Back | `goatBite` | `goat-bite.webp` | Worn leather with a chewed corner. |
| Duel Monster | `duelMonster` | `duel-monster.webp` | Plain chestnut brown with a charcoal oval and a narrow bronze-tan border. |
| Duel Monster V2 | `duelMonsterV2` | `duel-monster-v2.webp` | A dark ember vortex around a calm charcoal center. |
| Vanguard | `vanguard` | `vanguard.webp` | Black and midnight blue with broad cyan orbital geometry and a calm center. |

The 8 faces must be easy to tell apart at 55 px, because the Bazaar shows each one as a thumbnail. They must also look right at the full size of a card on the shelf.

3 of the 8 are **Premium card backs** ([Economy 3.5](./07-economy.md#35-bazaar)): Duel Monster, Duel Monster V2 and Vanguard. A Premium card back costs twice a normal card back, so it has the most detail of the family. 5 are normal card backs.

## 2. Rules for a Card Back painting

- **The face only.** The painting covers the art window of the Card Back. It does not draw the game frame, bevel, inner gold line or emblem. Those stay in code. A brief may ask for a flat printed border inside the face.
- **A calm center.** The Heynbord emblem sits at the center of the face, in gold, at 4.6 em of the 9 em width. Keep the middle 45% of the width calm and darker or plainer, so the emblem reads. A radial darkening, a plain panel or open water is enough.
- **A flat object.** The face is flat and straight on: no perspective, no thickness, no page curl, no glossy 3D card. It is a print on the back of a card.
- **Light from the upper left.** As in all other art (art direction 5.1). A painting may have a woven or a worn texture, but no light that fights the bronze bevel.
- **Bold shapes.** Wide bands, large motifs and few details. A fine pattern that closes into gray at 55 px is wrong. No small text-like marks, no tiny figures.
- **Separate palettes.** Each back has its own value and hue: warm orange and cream; deep navy and gold; pale parchment and sepia; deep teal and cream; tan leather; chestnut and copper; black and ember orange; black, midnight blue and cyan. No two backs look the same at a glance.
- **No text, logo or signature.** Signs and marks are shapes only: a compass rose, an eyelet, a hoofprint.
- **A joke, at the edge.** The humor stays small and at the edge, so the center stays calm. The goat of the Market is the joke of the set.
- **The edges keep 4% clear.** The game fits the face with `object-cover`, so it crops a little of each side. No important part goes in that margin, except a border that the brief asks for.

## 3. The 8 briefs

### 3.1 Tent Stripes

- **Subject.** The striped cloth of the market tents of the Town (11 — Town Concepts 2.6), seen close: the back of a card covered in tent cloth.
- **Pattern.** Wide vertical stripes, about 6 across the face. Warm orange `#d97a3a` and cream `#f3e2c0`, with a dark seam `#7a3f1e` between two stripes. A fine woven texture, a little sun fading at the top.
- **Center.** The middle stripe is cream and plain, and the emblem sits on it.
- **Details.** A brass eyelet at the top center, as on a tent wall. One coarse sewn patch at the lower left, with 5 or 6 big stitches.
- **Palette.** Orange, cream, one dark seam, brass.

### 3.2 Gold Fleur

- **Subject.** The expensive back: the velvet of a noble's tent, printed with gold.
- **Pattern.** Deep midnight blue velvet `#1d2b4a` with a lattice of gold fleur-de-lis `#e9c46a`, and thin double gold rules between the rows. A faint brocade sheen, never a metal glare.
- **Center.** The lattice opens into a plain navy medallion of about 45% of the width, with a thin gold ring.
- **Details.** The gold is printed, not raised: no embossing, no shadow behind the motif.
- **Palette.** Midnight blue, gold, a darker blue in the velvet folds.

### 3.3 Sea Chart

- **Subject.** An old sea chart, printed on the back of a card. It looks like a map that a captain folded too often.
- **Pattern.** Aged parchment `#e8d4a8` with a sepia coast at the edges, thin latitude lines, a small compass rose at the lower right, a red X, and a tiny ship at the top left.
- **Center.** Open water with a faint round stain, so the emblem reads. No coast in the middle.
- **Joke.** The coast at the top edge has the shape of a goat head, very subtle: two horns and a beard.
- **Palette.** Parchment, sepia `#6b4a2a`, one red mark, a little blue in the water.

### 3.4 Lantern Sails

- **Subject.** A night at sea, from the deck: sails and lantern light.
- **Pattern.** Deep teal water `#0f3b3f` with a thin gold horizon at 60% of the height, 2 cream sails `#f3e2c0` at the left, a few stars, and a small gold moon at the upper right.
- **Center.** Dark, calm water with a soft reflection of the moon, so the emblem reads.
- **Details.** 3 small lanterns along the bottom edge, each with a warm glow `#ffc94a` and a dark cage. The glow stays low, away from the emblem.
- **Palette.** Deep teal, cream, warm lantern gold, a darker teal in the water.

### 3.5 Goat-bitten Back

- **Subject.** The plain leather back of a card that a goat found first.
- **Pattern.** Worn tan leather `#b98a5a` with a stitched hide border in `#7a4a24`, a darker edge, and a fine grain. A faint cup ring at the center, as on a tavern table.
- **The bite.** The lower right corner is chewed: a torn edge, teeth marks, frayed fibers and a pale inner layer where the leather is gone. 2 short goat hairs and a small hoofprint near it.
- **Center.** Plain leather, a little lighter than the edges, with the cup ring. The emblem sits in it.
- **Palette.** Tan leather, dark brown, the pale inner layer, a hint of green in the hoofprint.

### 3.6 Duel Monster

- **Subject.** An original enchanted dueling-card back, painted as a flat printed face.
- **Pattern.** A plain matte chestnut-brown field with subtle painted grain and a large charcoal oval at the center. Add a narrow flat bronze-tan border at the perimeter and a thin dark-brown inner keyline.
- **Center.** Keep the oval dark and empty so the Heynbord emblem reads. Keep the field around it plain, without swirls, arcs or flecks.
- **Palette.** Chestnut brown, charcoal and muted bronze-tan.
- **Border.** The border is printed art, not the game frame or a 3D bevel.

### 3.7 Duel Monster V2

- **Subject.** A faster, more energetic version of the dueling-card back.
- **Pattern.** Obsidian black and deep brown with broad ember-orange, burnt-copper and amber brush bands in a loose vortex around a quiet charcoal oval. Keep the strokes large and sparse.
- **Center.** Keep the middle 45% of the width dark and plain for the Heynbord emblem.
- **Palette.** Black, deep brown, ember orange, copper and amber.

### 3.8 Vanguard

- **Subject.** An original fantasy Card Back face with the energy of angular orbital geometry. The user-provided image is a broad visual reference for the black-and-cyan palette and geometric feeling only.
- **Pattern.** A deep black and midnight-blue field with a few large, broken cyan rings, stepped arcs and radial lines. Use broad, luminous strokes and open gaps. Make an original arrangement.
- **Center.** Keep the middle 45% of the width dark, calm and mostly plain for the Heynbord emblem.
- **Restrictions.** Do not include or imitate the reference's Cardfight Vanguard wordmark, text, logo, symbol, frame, border or exact layout. No letters or small text-like marks.
- **Palette.** Black, midnight blue, bright cyan and a small amount of soft blue light.

## 4. The art window

The Card Back is 9 em × 12.6 em. The bronze bevel takes 0.36 em, the inner gold line 0.14 em, and the inner tooled line sits 0.45 em inside the face. The emblem is 4.6 em wide at the center. The painting fills the window inside the gold line: about 8 em × 11.6 em.

The export is 600 × 800 (3:4). The window is a little taller (0.69), so `object-cover` crops about 4% of each side. Keep the important parts out of that margin (2).

## 5. Prompts

Run `bun card-back:prompts`. It writes these files to `apps/web/art/card-backs/raw/`. Git ignores that folder.

- `style-reference.png`: the 10 golden references of art direction 5.1 in one image. They set the brush, the light and the palette.
- `set-reference.png`: the first painted Card Back, if it exists. The other faces match it in brush, texture and value.
- `prompts.md`: the setup message, then one prompt for each Card Back in the order of 1, then a list of fixes.

Paint **Tent Stripes** first, and use it as the set reference for the other 7. Use one ChatGPT conversation for the set: attach `style-reference.png`, `set-reference.png` and the setup message, then send each prompt in its own message.

## 6. Steps for each Card Back

1. Run `bun card-back:prompts`.
2. Make 4 to 8 images with each prompt, with GPT Image and high quality, in portrait 3:4.
3. Select one image with the checklist in 7.
4. Fix problems by hand or with inpainting: a busy center, a pattern that closes at 55 px, a wrong light.
5. Crop the face to 3:4. Do not add a game frame, a bevel or the emblem. Add a flat printed border only when the brief asks for it.
6. Compress: `cwebp -q 80 -resize 600 800 <file>.png -o <file>.webp`. The file must be 600 × 800.
7. Put the file in `apps/web/public/card-backs/` with the name of 1, and keep the full-size source in `apps/web/art/card-backs/`.
8. Remove the item key from `UNPAINTED_CARD_BACK_ART` in `apps/web/src/features/battle/card-back-art.ts`. A unit test then checks the file and its size.

## 7. Review checklist

- [ ] The face is flat and straight on: no perspective, no thickness, no 3D card.
- [ ] The middle 45% of the width is calm, and the gold emblem reads on it.
- [ ] No frame, no bevel, no emblem and no inner line in the image.
- [ ] The light comes from the upper left.
- [ ] The Card Back is easy to tell apart from the other 7 at 55 px.
- [ ] The important parts are 4% away from each edge.
- [ ] No text, logo, rune or signature.
- [ ] The style matches the golden references.
- [ ] The joke is small and at the edge.
