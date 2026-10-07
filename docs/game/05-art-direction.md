# 05 — Art and Audio Direction

## 1. Visual goal

Heynbord looks like a **painted fantasy card game on a painted battlefield**, like the Flash card games that it continues. The Units stand directly on a painted Region, like figures on a painted map. Light, shadows, camera movement and spell effects make the scene feel alive.

Key words: **bright, warm, clear, handmade, a little funny.**

Not: dark, realistic, gory, noisy, neon.

## 2. 2.5D presentation

| Element | How it looks |
| --- | --- |
| **Units** | A rigged 3D model, when the card has one (see 2.2). Other cards show the card art cut out (transparent background) on a flat plane. The plane always faces the camera on the vertical axis (billboard). The painting advances to the right, and the enemy figure is a mirror image, so each Side meets the other. That mirror is the only difference between the two Sides. See [ADR-0014](../adr/0014-creature-card-paintings-advance-to-the-right.md). At the feet, a line shows the current Attack and the current HP as `2 \| 10`. A number is white when it equals the value at summon, red when it is lower, and green when it is higher. The line has a dark outline. Until a card has its cut-out, the plane shows the card art with its background, in an arched shape, with no frame and no Rank Gems. |
| **Board** | Not drawn. The ground is the Battle Painting, and the Squares are invisible. The legal Squares glow only when the Player selects a card. A Closed Lane shows as a dark band. See [web ADR-0007](../../apps/web/docs/adr/0007-the-battlefield-is-a-2d-painting.md). |
| **Heroes** | A larger cut-out figure at the end of the Lanes, with a 3D frame and an HP bar. It stands on the ground with a ring in its Side color. |
| **Cards in the Hand** | 2D UI (React), not in the 3D scene. This keeps text sharp. |
| **Effects** | 3D particles, simple shaders and light flashes. |
| **Background** | One Battle Painting for each Region: a flat 2D painting of the ground and its edges, seen from the Battle camera, with no sky. See [13 — Battlefield Concepts](./13-battlefield-concepts.md). |

### 2.1 Unit feedback without animation rigs

A cut-out Unit is a flat image, so the game shows actions with movement of the plane:

| Action | Feedback |
| --- | --- |
| Idle | Slow up-and-down movement (breath) and a small sway |
| Move | Small hops from Square to Square |
| Attack (melee) | Lean back, then a fast lunge forward, and a hit flash |
| Attack (ranged) | A projectile (arrow, bolt, orb) flies to the target |
| Hit | Shake, a red tint for a short time, and a damage number |
| Crit | A larger damage number, a short camera shake |
| Block | A shield icon and a "clang" sound |
| Death | The figure falls back flat and fades out with dust or spirit particles |
| Summon | The figure rises from the Square with a light ring in the Race color |

### 2.2 Rigged Unit models

A card can have a rigged 3D model instead of the cut-out. The model plays a clip for each action: idle, walk (Move), attack (melee and ranged), hurt (Hit) and death. The clip follows the event progress, so it keeps time with the Battle speed. The movement, tint and fade of 2.1 still apply to the model, and the Summon rise and the projectiles stay the same.

- Source: Tripo text-to-3D in a T-pose, with the subject, props and Race colors of the card concept ([10 — Card Concepts](./10-card-concepts.md)). Then auto-rig, and retarget the preset clips.
- Each model is one GLB in `apps/web/public/models/units/`, with the clips named `idle`, `walk`, `attack`, `hurt` and `death`. The list of cards with a model is in `apps/web/src/features/battle/scene/unit-models.ts`.
- Write the licence record (5.5) for each model, with the Tripo task IDs.

## 3. Camera

- Angle: a 3/4 view from behind the player's side, about 35° to 45° down.
- The Lanes go from left (player) to right (enemy). This fits landscape screens.
- The camera does a small push-in for Crits, Boss attacks and the last hit of the Battle.
- With "reduced motion" on, the camera does not move or shake.
- The camera never hides any Square. All Units must stay visible at all times.

## 4. Color

### 4.1 Race colors

| Race | Main color | Second color | Materials |
| --- | --- | --- | --- |
| Human | Royal blue | Gold | Steel, cloth banners, wood |
| Elf | Leaf green | Warm brown | Bark, leaves, flowers |
| Undead | Pale teal | Bone white | Old bronze, bone, spirit fire |
| Orc | Burnt orange | Dark red | Leather, fur, rough iron |
| Goblin | Brass | Acid green, on soot grey | Patched iron, canvas, junk |
| Feral | Slate violet | Ice white | Fur, horn, stone, ice |

### 4.2 Rank colors

Common (grey), Uncommon (green), Rare (blue), Epic (purple), Legendary (orange). The card frame shows the Rank color and pips (see GDD 5.3).

### 4.3 Damage Type colors and icons

| Damage Type | Color | Icon |
| --- | --- | --- |
| Physical | White | Sword |
| Fire | Orange-red | Flame |
| Frost | Light blue | Snowflake |
| Holy | Gold-yellow | Sun |

Always use the icon with the color, for players with color blindness.

## 5. AI art workflow

### 5.1 Style guide

The AI image tool is **GPT Image**. Use it for card art, the Town painting and each Battle Painting.

The style bible has:

1. These 10 golden reference images in `apps/web/public/creature/` and `apps/web/public/skills/`. New art must match them.

| File | What it shows |
| --- | --- |
| `creature/human/militia-recruit.webp` | Human starter |
| `creature/human/iron-bulwark.webp` | Human armor |
| `creature/human/dawn-cleric.webp` | Holy palette |
| `creature/human/crossbow-guard.webp` | Ranged Unit |
| `creature/orc/badland-pup.webp` | Small Orc |
| `creature/orc/ember-shaman.webp` | Orc caster |
| `creature/orc/howling-charger.webp` | A Unit in motion |
| `creature/orc/warchief-grukka.webp` | Boss scale |
| `skills/mage/fireball.webp` | Mage Skill |
| `skills/warrior/shield-wall.webp` | Warrior Skill |

2. The prompt script for Creature Cards (see 5.2), a fixed prompt template for Skill Cards (see 5.2.1), and the prompt script for the Region Maps and the Battle Paintings (`bun campaign:prompts`, see [12 — Region Concepts, 3](./12-region-concepts.md#3-prompts)).
3. A character sheet for each Hero, boss and important Unit (front view, colors, key shapes).
4. A list of words that are not permitted in prompts: the names of living artists, other games, and other companies' characters.

### 5.2 Prompts for Creature Cards

The game docs do not keep the prompts of Creature Cards. Run `bun creature:prompts` to write them to `apps/web/art/creature/raw/`. Git ignores this folder.

- `style-reference.png`: the 8 golden Creature Card references of 5.1 in one image.
- `<race>/prompts.md`: the setup message of the Race, then one prompt for each Creature Card of the Race.

The setup message gives the style rules of this section, and the setting and the palette of the Race ([10 — Card Concepts, 1.1](./10-card-concepts.md#11-settings)). Each card prompt has the subject line of the card in `scripts/creature-art/subjects.ts`, the art brief of the card in 10 — Card Concepts, the detail of its Base Rank and the accent of its Damage Type. Use one ChatGPT conversation for each Race: attach the style reference to the setup message, then send each card prompt in its own message. To change an image, change the brief or the subject line, then run the script again.

The figure advances to the right of the image, in a three-quarter view, so the face stays readable. The chest and the lead foot point right. The face and the weapon may turn, so a Pivot figure can look back. A fortification shows its blocking face to the right. The card art and the Unit cut-out share this Facing. Match the golden references for light, brush and palette. Take Facing from this section. Keep the light from the upper left: a horizontal flip of a finished painting would move that light. Existing paintings that advance left stay until their art pass. Militia Recruit is the first repaint.

The setting is simple and has low contrast, so that the figure separates cleanly when you remove the background (step 5.3.5).

### 5.2.1 Prompt template for Skill Cards

A Skill Card has a Class, not a Race. Its image must not show a Race, because a Hero of any Race can use it. Show the effect, with only a partial figure (hands, a back view or a silhouette). The Damage Type color is the main color. For Physical, use a neutral steel and leather palette. A Skill Card has no Unit cut-out.

```text
[effect subject], [partial figure], [action],
Heynbord [Class] skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, [Damage Type color] accents,
[setting], portrait 3:4 composition, no text, no frame
```

### 5.3 Steps for each card

1. Write the card concept in [10 — Card Concepts](./10-card-concepts.md): name, Race or Class, Role, subject, pose, props and setting. For a Creature Card, add its subject line to `scripts/creature-art/subjects.ts`. For a Skill Card, write its prompt with the template in 5.2.1.
2. Make 4 to 8 images with the prompts (5.2 or 5.2.1) and the style references.
3. Select one image with the review checklist (5.4).
4. Fix problems by hand or with inpainting (hands, weapons, extra parts).
5. Remove the background, for the Unit cut-out.
6. Make 2 exports: card art (portrait, with background) and Unit cut-out (transparent).
7. Compress the textures (see Technical Design, section 6).
8. Write the record (5.5).

### 5.4 Review checklist

- [ ] The silhouette is clear at 128 px tall.
- [ ] The Race colors are correct.
- [ ] The light comes from the upper left, as in all other art.
- [ ] The figure advances to the right. The face may turn. A fortification shows its blocking face to the right.
- [ ] No extra fingers, broken weapons or strange body parts.
- [ ] No text, logo or signature in the image.
- [ ] The image does not look like a known character from another game.
- [ ] The style matches the golden references.

### 5.5 Licence record

For each asset, record: the file name, the tool and version, the date, the prompt, the seed (if available), the licence terms of the tool, and the hand changes. Keep the record in the repository. Use only tools whose terms permit commercial use.

## 6. User interface style

- The UI uses the existing React Aria component library in `apps/web`, with a Heynbord theme.
- Panels look like parchment and wood, but text sits on flat, high-contrast areas.
- Fonts: one display font for titles (fantasy style, used only in large sizes) and one clear sans-serif font for all other text. Both fonts must support Indonesian characters.
- Countdown numbers on cards are large and bold. A Ready card has a gold glow.
- Icons are simple and flat, with the same line width.

## 7. Audio direction

### 7.1 Music

- Style: light orchestral folk. Flutes, strings, small drums. Each Region has its own theme.
- Tracks for v1: Title, Town, 3 Region Battle themes, 1 Boss theme, Victory sting, Defeat sting.
- Source: AI music tools, with the same licence record as the art. Music has low priority. The game must be complete without music.

### 7.2 Sound effects

- Source: sound effect packs with a free licence that permits commercial use (for example CC0).
- Each Battle action has a sound: summon, move, each attack type, each Damage Type, Crit, Block, death, Countdown "tick" when a card becomes Ready, End Turn.
- Each UI action has a short, soft sound.
- Races have small sound differences (for example metal for Human, wood for Elf).

### 7.3 Mix

- Separate volume controls: master, music, effects.
- At speed ×2, the game plays fewer sounds at the same time, so that the sound stays clear.
