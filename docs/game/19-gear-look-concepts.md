# Gear Look Concepts

This document gives the art brief of the **Gear look** family: the 6 looks of the Gear that the Bazaar sells for Heynstones ([Economy 3.5](./07-economy.md#35-bazaar), [GDD 10](./03-game-design.md#10-achievements-cosmetics-and-the-bazaar)). A Gear look changes how the Gear looks and never changes gameplay: it changes no Gear level and no stat.

A Gear look is one painted icon for each of the 4 Gear items: the Weapon, the Armor, the Trinket and the Banner, all in one material ([web ADR-0013](../../apps/web/docs/adr/0013-a-gear-look-is-a-set-of-4-gear-icons.md)). The icons replace the 4 icons on the Gear plates of the Hero screen. The look with no Gear look is the **Standard kit**: the 4 Gear icons of [Town Concepts 12](./11-town-concepts.md#12-gear-icons), in royal blue, gold and steel.

The briefs of the other families are [Cosmetic Concepts](./16-cosmetic-concepts.md) (Card Backs), [Hero Portrait Concepts](./17-hero-portrait-concepts.md) and [Board Skin Concepts](./18-board-skin-concepts.md).

## 1. The 6 Gear looks

| Gear look | Item key | Folder | Material |
| --- | --- | --- | --- |
| Copper Rim | `copperRim` | `copper-rim/` | Hammered copper with a bright rolled rim, oxblood leather, a little verdigris, an amber stone. |
| Iron Vine | `ironVine` | `iron-vine/` | Dark wrought iron with bold vine scrolls and small green enamel leaves, a green stone. |
| Stag Leather | `stagLeather` | `stag-leather/` | Tan boiled leather with cream stitches, pale horn, brass rivets. |
| Gold Inlay | `goldInlay` | `gold-inlay/` | Blackened steel with bold gold inlay lines, black leather, a deep teal stone. |
| Moonstone | `moonstone` | `moonstone/` | Pale brushed silver with milky moonstones, pale lavender leather. |
| Royal Plate | `royalPlate` | `royal-plate/` | Polished white steel with gold fluting, crimson cloth with a white edge, a ruby. |

The 6 looks must be easy to tell apart at **40 px**, because the Bazaar shows the Armor icon of each look as a 40 px thumbnail.

## 2. The icons

Each Gear look is 4 icons, one for each Gear item, in a folder of `apps/web/public/gear-looks/`.

| Item | Value |
| --- | --- |
| Files | `weapon.webp`, `armor.webp`, `trinket.webp`, `banner.webp` |
| Export | WebP with alpha, 256 × 256 |
| Source | 1024 × 1024 PNG with a transparent background, in `apps/web/art/gear-looks/<folder>/` |
| On screen | 96 px on a Gear plate of the Hero screen (44 px on a short screen), 56 px on the Bazaar shelf (40 px on a short screen) |

A Gear look shows only when all 4 icons are painted. Until then, the Hero screen shows the Standard kit, and the Bazaar does not offer the look.

## 3. Rules for a Gear look icon

- **The same 4 objects.** The Weapon is always a short broad sword on its diagonal with the tip to the upper right. The Armor is a breastplate with 2 straps, the Trinket a round amulet on a short chain or cord, and the Banner a small swallowtail pennant on a short pole. Only the material, the color and the ornament change, so the Player knows each item at once.
- **The same set as the Standard kit.** The same thick dark brown outline (`#2e1d10`), view, light, brush and size on the canvas as the Standard kit icons (Town Concepts 12.1). The object fills about 80% of the canvas.
- **No Class.** No staff, no bow, no axe, no shield, no holy symbol and no Class emblem. A Gear look serves all 4 Classes, as the Gear does.
- **No royal blue.** It is the color of the Standard kit. Each look has its own hue and value: copper and oxblood; iron grey and moss green; tan and cream; black and gold; silver and lavender; white steel, crimson and gold.
- **Plain items.** No magic glow, no runes and no damage. A moonstone has a sheen of reflected light, not a glow.
- **Bold ornament.** A scroll, a rim, a stitch line or an inlay must read at 44 px. No fine filigree. No joke mark: an icon is too small.
- **Light from the upper left.** As in all other art (art direction 5.1).
- **One object for each icon.** No scene, no ground, no shadow, no frame and no badge circle. The background is transparent.
- **No text, logo, rune or signature.**

## 4. The 6 briefs

### 4.1 Copper Rim

- **Material.** Warm hammered copper (`#b8693a`) with a bright rolled copper rim on each edge, and a little green verdigris (`#5f9a86`) in the seams.
- **Weapon.** A hammered copper blade with a bright rim along its edges, a copper cross-guard, an oxblood leather grip.
- **Armor.** A hammered copper breastplate with a bright rim and 2 oxblood leather straps.
- **Trinket.** A hammered copper amulet with a rolled rim and one large amber stone.
- **Banner.** An oxblood pennant (`#6a2a24`) with a copper border, on a dark wooden pole with a copper tip.
- **Palette.** Copper, oxblood red, a little verdigris, amber.

### 4.2 Iron Vine

- **Material.** Dark grey wrought iron (`#4a4f52`) with bold curling vine scrolls and small green enamel leaves.
- **Weapon.** A dark iron blade, a cross-guard of curling iron vine, a moss green leather grip.
- **Armor.** A wrought iron breastplate with bold vine scrolls across the chest and 2 moss green straps.
- **Trinket.** A ring of curled iron vine with one large moss green stone.
- **Banner.** A moss green pennant (`#4f7a3a`) with an iron vine border, on an iron pole with a leaf-shaped tip.
- **Palette.** Iron grey, moss green, a little enamel green.

### 4.3 Stag Leather

- **Material.** Tan boiled leather (`#9a6a3c`) with big cream stitches (`#efe0c0`), pale cream horn and brass rivets.
- **Weapon.** A polished steel blade, a leather-wrapped cross-guard with brass rivets, a pale horn grip.
- **Armor.** A boiled leather breastplate with cream stitches at its edges, brass rivets and 2 dark brown straps.
- **Trinket.** A carved horn disc in a stitched leather setting with a brass ring, on a leather cord.
- **Banner.** A tan suede pennant with a stitched cream border, on a wooden pole with a horn tip.
- **Palette.** Tan, cream, dark brown, brass. It is a rugged look, not a hunter's look: no bow, no quiver and no antler crown.

### 4.4 Gold Inlay

- **Material.** Blackened steel (`#2b2a30`) with bold gold inlay lines (`#e3b04b`), black leather and a deep teal stone (`#1f6a6a`). It is the darkest look.
- **Weapon.** A blackened blade with one gold inlay line along its middle, a cross-guard with gold scrolls, a black grip, a teal stone in the pommel.
- **Armor.** A blackened steel breastplate with bold gold inlay scrolls and 2 black leather straps.
- **Trinket.** A blackened steel amulet with a gold inlay ring and one large teal stone, on a gold chain.
- **Banner.** A black pennant with a gold inlay border, on a black pole with a gold tip.
- **Palette.** Black steel, gold, deep teal. Keep a warm rim light on the edges, so the dark icons read on the dark plate.

### 4.5 Moonstone

- **Material.** Pale brushed silver (`#c9d0d8`), milky white moonstones (`#e6eef5`) with a soft blue sheen, pale lavender leather (`#a99cc9`). It is the lightest look.
- **Weapon.** A pale silver blade, a silver cross-guard with 2 small moonstones, a lavender grip.
- **Armor.** A brushed silver breastplate with one large moonstone at the center of the chest and 2 lavender straps.
- **Trinket.** A pale silver amulet with one large moonstone, on a silver chain.
- **Banner.** A pale lavender pennant with a silver border, on a pale wooden pole with a silver tip and a small moonstone.
- **Palette.** Silver, pearl white, pale lavender. No stars, no moons and no glow: it is a stone, not a spell.

### 4.6 Royal Plate

- **Material.** Polished white steel with gold fluted lines, deep crimson leather and cloth (`#8c1c2c`) with a thin white edge, and a ruby. It is the grandest look.
- **Weapon.** A polished white steel blade, a fluted gold cross-guard, a crimson grip, a ruby in the gold pommel.
- **Armor.** A white steel breastplate with gold fluted lines down the chest, a gold trim and 2 crimson straps.
- **Trinket.** A fluted gold amulet with one large ruby, on a heavy gold chain.
- **Banner.** A crimson pennant with a gold border and a thin white edge, on a white pole with a gold tip.
- **Palette.** White steel, crimson, gold. No royal blue, so that it is not the same as the Standard kit. No crown and no crest.

## 5. Prompts

Run `bun gear-look:prompts`. It writes these files to `apps/web/art/gear-looks/raw/`. Git ignores that folder.

- `set-reference.png`: the 4 icons of the Standard kit in a 2 × 2 grid, on a transparent canvas. Each look keeps their objects, outline, view and size.
- `prompts.md`: for each Gear look in the order of 1, a setup message and one prompt for each Gear item, then a list of fixes.

The prompts are in `scripts/gear-look-art/`. When you change a brief in 4, change `concepts.ts` too. The icon prompt is the Standard kit prompt (`gearIconPromptOf` in `scripts/town-art/prompts.ts`) with the subject of the look.

Use one ChatGPT conversation for each Gear look: attach `set-reference.png`, send the setup message of the look, then send each icon prompt in its own message. Paint **Copper Rim** first.

## 6. Steps for each Gear look

1. Run `bun gear-look:prompts`.
2. Make 4 to 8 images with each prompt, with GPT Image and high quality, at 1024 × 1024 with a transparent background.
3. Select one image for each icon with the checklist in 7.
4. Fix problems by hand or with inpainting: a changed object, royal blue, a glow, fine detail that does not read.
5. Keep the full-size sources in `apps/web/art/gear-looks/<folder>/` (`weapon.png`, `armor.png`, `trinket.png`, `banner.png`).
6. Compress each icon: `cwebp -q 85 -alpha_q 100 -resize 256 256 weapon.png -o weapon.webp`. Each file must be 256 × 256.
7. Put the 4 files in `apps/web/public/gear-looks/<folder>/`.
8. When all 4 icons are in place, remove the item key from `UNPAINTED_GEAR_LOOK_ART` in `apps/web/src/features/hero/gear-look-art.ts`. A unit test then checks the 4 files and their size.
9. Look at the icons on the Hero screen and on the Bazaar shelf, at 1366 × 768 and on a short screen.
10. Write the licence record (art direction 5.5).

## 7. Review checklist

- [ ] The 4 icons are the objects of the Standard kit: a sword, a breastplate, an amulet and a pennant.
- [ ] The outline, the view, the light and the size match the Standard kit.
- [ ] No item shows a Class, and no icon has royal blue.
- [ ] No magic glow, no runes and no damage.
- [ ] Each item is easy to know at 44 px, and the look is easy to tell apart from the other 5 at 40 px.
- [ ] The background is transparent, with clean edges on a dark plate.
- [ ] No text, letters, runes or logo.
