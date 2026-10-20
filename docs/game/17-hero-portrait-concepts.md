# Hero Portrait Concepts

This document gives the art brief of the **Hero portrait** family: the 7 faces that the Bazaar sells for Heynstones ([Economy 3.5](./07-economy.md#35-bazaar), [GDD 10](./03-game-design.md#10-achievements-cosmetics-and-the-bazaar)). A Hero portrait changes how the Player's Hero looks and never changes gameplay.

The brief of the Card Back family is [Cosmetic Concepts](./16-cosmetic-concepts.md).

The game keeps the bronze frame, the gold line and the plate in code. A painting is the **face** of the portrait, inside that frame. The face of the Standard portrait is in code: the gold plate of the Player side with the Class glyph.

## 1. The 7 Hero portraits

| Hero portrait | Item key | File | Face |
| --- | --- | --- | --- |
| Dawn Gaze | `dawnGaze` | `dawn-gaze.webp` | A young scout at first light, a sun-bleached hood pushed back. |
| Verdant Crest | `verdantCrest` | `verdant-crest.webp` | A weathered ranger with a crest of leaves and feathers at the shoulder. |
| Mesa Shade | `mesaShade` | `mesa-shade.webp` | A desert traveler under a wide brim, the lower face in a sand veil. |
| Salt Wind | `saltWind` | `salt-wind.webp` | An old sailor with cropped grey hair and a salt-crusted collar. |
| Lantern Keeper | `lanternKeeper` | `lantern-keeper.webp` | An older keeper in a leather hood, lit from below by a lantern. |
| Tent Rings | `tentRings` | `tent-rings.webp` | A market trader with gold hoops, rings and a bright headscarf. |
| Gold Crest | `goldCrest` | `gold-crest.webp` | A noble veteran with a short silver beard and a gold circlet. |

The 7 faces must be easy to tell apart at **40 px wide**, because the Top Bar shows the portrait as a 40 px square. They must also look right on the Hero screen, at about 92 px wide.

## 2. Rules for a Hero portrait painting

- **The face only.** The painting fills the plate. It does not draw the bronze frame, the gold line or any ornament. Those stay in code, the same for all 7 faces.
- **One face for all 4 Classes.** The Player's Hero is the Player, not the Class, and the Class changes with the Active Deck. A portrait shows no Class gear: no wizard hat, no priest mitre, no warrior helm, no Class emblem. A plain hood, a scarf, a hat or a circlet is enough.
- **A head and shoulders, three-quarter view.** The head is the subject: it takes the middle of the image. The eyes sit on a line about **38%** down from the top. The bottom 38% is the shoulders and the clothing.
- **The square crop.** The Top Bar shows the middle 75% of the height of the image, from 12.5% to 87.5%. Keep the eyes and the mouth inside that band, so the face reads in the square.
- **A calm bottom edge.** The plate shows the image with `object-cover`, and the Board banner crops a little at the sides and the foot. Keep the shoulders plain and dark at the bottom, with no important detail in the last 8%.
- **Bold shapes.** Large forms and few details. The face must read at 40 px. No fine embroidery, no small text-like marks.
- **Light from the upper left.** As in all other art (art direction 5.1), warm and clear. A portrait may be cooler or warmer than the others, but the light comes from the same side.
- **Separate palettes.** Each portrait has its own hue and value: warm gold; moss green; red rock and sand; sea blue; lantern amber; market orange and magenta; deep blue and gold. No two portraits look the same at a glance.
- **No text, logo, rune or signature.** No letter, no number and no written mark on the clothing or the skin.
- **The edges keep 4% clear.** The Board banner crops about 2.4% of each side, and the rounded plate cuts the corners. No important part goes in that margin.

## 3. The 7 briefs

### 3.1 Dawn Gaze

- **Subject.** A young scout who watched the sunrise from a ridge, warm and awake.
- **Face.** A narrow face, amber eyes, a small scar on one brow, a thin braid at the temple. A calm, straight look at the viewer.
- **Clothing.** A sun-bleached cream hood pushed back on the shoulders, over a warm orange tunic. A thin leather cord at the neck.
- **Palette.** Peach `#f0b98a`, gold `#e9c46a`, cream `#f3e2c0`, a dark warm brown for the hood shadow.
- **Light.** The first sun, low from the upper left, on the cheek and the brow.

### 3.2 Verdant Crest

- **Subject.** A ranger of the deep woods, weathered and quiet.
- **Face.** A long face, green-grey eyes, wind-burnt skin, a short beard with a few pale strands.
- **Clothing.** A moss-green scarf, a leather jerkin, and a shoulder crest of 3 leaves and 2 long feathers, in bronze and cream. The crest is a shape, not a device.
- **Palette.** Moss `#4c6b3c`, bronze `#a87c3e`, cream, a dark forest green.
- **Light.** A soft light through leaves, from the upper left.

### 3.3 Mesa Shade

- **Subject.** A desert traveler who knows the heat, calm behind a veil.
- **Face.** Only the eyes and the brow show: dark eyes, strong brows, sun-dark skin. The sand veil covers the lower face.
- **Clothing.** A wide-brim hat of pale straw with a red band, a sand veil of cream cloth, a dark red shawl.
- **Palette.** Red rock `#b5533a`, sand `#d9b483`, cream, a deep violet in the shade `#3a2a4a`.
- **Light.** Harsh sun from the upper left, half of the face in deep shade.

### 3.4 Salt Wind

- **Subject.** An old sailor who came back from one more voyage.
- **Face.** A broad face, sea-grey eyes, deep lines, a small smile, cropped grey hair and a short grey beard.
- **Clothing.** A dark blue coat with a salt-crusted collar, a rope necklace with a shell, a wool cap pushed back.
- **Palette.** Sea blue `#2f5d73`, white `#f2ede0`, rope tan `#c8a06a`, a dark navy.
- **Light.** A clear cold light from the upper left, with a little spray in the air.

### 3.5 Lantern Keeper

- **Subject.** The keeper of a lighthouse or a shrine, kind and a little tired.
- **Face.** An older face, warm brown eyes, soot on one cheek, a small burn scar on the chin.
- **Clothing.** A dark leather hood over a wool cowl, a brass lantern out of frame at the lower left that lights the face from below.
- **Palette.** Amber `#ffc94a`, dark leather `#4a3220`, black, a little cream in the cowl.
- **Light.** The lantern from below left is the only strong light, with a faint cool light from the upper left.

### 3.6 Tent Rings

- **Subject.** A market trader who enjoys the deal.
- **Face.** A round face, dark eyes, a confident grin, a gold hoop in each ear and 3 rings on the fingers that rest at the chin.
- **Clothing.** A bright headscarf, a striped shawl of orange and magenta, a brass chain.
- **Palette.** Orange `#d97a3a`, magenta `#a83a6a`, brass `#e9c46a`, a dark plum in the folds.
- **Light.** Warm market light from the upper left, a little gold bounce from below.

### 3.7 Gold Crest

- **Subject.** A noble veteran who earned the circlet.
- **Face.** A square face, pale grey eyes, a short silver beard, a scar through one eyebrow.
- **Clothing.** A deep blue high collar with a fur edge, a gold circlet with one dark stone, a heavy gold chain.
- **Palette.** Gold `#e9c46a`, deep blue `#1d2b4a`, ivory `#f3e6c4`, a dark blue in the fur.
- **Light.** A formal, even light from the upper left, with a gold rim on the circlet.

## 4. The portrait plate

The plate is 3:4. The bronze frame takes 3 px and the gold line 1 px at the size of the screen, so the painting fills the window inside them: about 96% of the width and the height.

The export is 600 × 800 (3:4). The Board banner is 320 × 448 (0.71), so `object-cover` crops about 2.4% of each side. The Top Bar square crops the top and the bottom to the middle 75% of the height. Keep the important parts out of both crops (2).

## 5. Prompts

Run `bun hero-portrait:prompts`. It writes these files to `apps/web/art/hero-portraits/raw/`. Git ignores that folder.

- `style-reference.png`: the 10 golden references of art direction 5.1 in one image. They set the brush, the light and the palette.
- `set-reference.png`: the first painted Hero portrait, if it exists. The other faces match it in brush, texture and value.
- `prompts.md`: the setup message, then one prompt for each Hero portrait in the order of 1, then a list of fixes.

Paint **Dawn Gaze** first, and use it as the set reference for the other 6. Use one ChatGPT conversation for the set: attach `style-reference.png` and the setup message, then send each prompt in its own message.

## 6. Steps for each Hero portrait

1. Run `bun hero-portrait:prompts`.
2. Make 4 to 8 images with each prompt, with GPT Image and high quality, at 1536 × 1024.
3. Select one image with the checklist in 7.
4. Fix problems by hand or with inpainting: a face that reads as another Class, a busy bottom edge, a wrong light.
5. Crop the face to 3:4. Do not add a frame, a line or a glyph.
6. Compress: `cwebp -q 80 -resize 600 800 <file>.png -o <file>.webp`. The file must be 600 × 800.
7. Put the file in `apps/web/public/hero-portraits/` with the name of 1, and keep the full-size source in `apps/web/art/hero-portraits/`.
8. Remove the item key from `UNPAINTED_HERO_PORTRAIT_ART` in `apps/web/src/features/hero/hero-portrait-art.ts`. A unit test then checks the file and its size.
9. Write the licence record (art direction 5.5).

## 7. Review checklist

- [ ] The face reads at 40 px wide.
- [ ] The portrait shows no Class gear, no Class emblem and no Class color.
- [ ] The eyes sit about 38% down, inside the square crop of the Top Bar.
- [ ] The bottom edge is plain and dark.
- [ ] No frame, no gold line, no glyph and no ornament in the image.
- [ ] The light comes from the upper left.
- [ ] The portrait is easy to tell apart from the other 6 at a glance.
- [ ] The important parts are 4% away from each edge.
- [ ] No text, logo, rune or signature.
- [ ] The style matches the golden references.
