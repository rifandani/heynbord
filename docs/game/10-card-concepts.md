# 10 — Card Concepts

This document gives the gameplay draft and art brief for each Creature Card in the v1 set, and for each implemented Skill Card. Use it for step 1 of the AI art workflow ([05 — Art and Audio Direction, 5.3](./05-art-direction.md#53-steps-for-each-card)). Implemented values come from `packages/rules/src/content/cards.ts`. Values marked **provisional** are design inputs until the rules package implements and simulates them. When a card exists in `cards.ts` and its line here is **provisional**, `cards.ts` keeps the previous values until that line is implemented. The card names and flavor text move to the `en-US` Message Catalog with implementation. The art must agree with them.

The provisional set is budget-valid and simulation-ready. It is not balance-approved. Balance approval needs the main Matchups and Stage simulations in GDD 13 after implementation.

## 1. Rules for all cards

- **One image for each card.** Rank belongs to one card copy, and the card frame shows it. The image does not change with Rank.
- **Base Rank sets the detail.** Common: plain, worn gear and a simple scene. Uncommon: some trim and one extra detail. Rare: ornate gear with gold or metal trim. Epic: a heroic scene with dramatic composition and more detail. The style and the light do not change.
- **Light.** From the upper left in all images.
- **Facing.** A Creature Card and a Token advance to the right of the image, in a three-quarter view. The chest and the lead foot point right. The face and the weapon may turn. A fortification shows its blocking face to the right. Forward in a pose means this direction. The card art and the Unit cut-out share it. See [ADR-0014](../adr/0014-creature-card-paintings-advance-to-the-right.md). A Skill Card has no Unit. When it shows travel, a throw, or a back view, that travel still goes to the right.
- **Size.** Portrait 3:4 (card art is 768 × 1024).
- **Gender.** The flavor text sets the gender of some figures. For the other figures, this document selects a gender, so that the set has a balanced mix.
- **Creature Cards** use the template in 5.2. They make 2 exports: card art and a Unit cut-out. The silhouette must be clear at 128 px tall.
- **Skill Cards** use the template in 5.2.1. They show the effect with a partial figure that has no Race. They have no Unit cut-out.
- **Provisional power.** A Summon or a Last Breath that summons uses 80% of the Token power at the Base Rank of its Card. All provisional Cards must stay within 10% of their Countdown budget.

### 1.1 Settings

| Group | Setting | Palette |
| --- | --- | --- |
| Human | A river town: stone bridges, timber houses, blue and gold banners, a calm river | Royal blue and gold. Steel, cloth banners, wood |
| Elf | An ancient green forest: immense roots, canopy bridges, amber sun shafts, moss and quiet pools | Leaf green, amber and pale gold. Living wood, leaves, silver |
| Undead | The Hollow Marches: flooded grave roads, dead willows, ruined courts, barrows and cold mist | Pale teal and moonlit blue. Rusted iron, old cloth, bone |
| Orc | Red badlands: dusty mesas, dry ground, bone and hide totems | Burnt orange and dark red. Leather, fur, rough iron |
| Goblin | The hill mines: tunnels, rail tracks, junk-heap workshops and lantern light | Soot grey, brass and acid green. Patched iron, canvas, junk |
| Feral | The wild peaks and deep caves: cliffs, glaciers, cave mouths and old bones | Slate violet and ice white. Fur, horn, stone and ice |
| Skill Cards | A neutral battlefield: green grass and a Lane of grey stone tiles, with no banners | The Damage Type color (Fire: orange-red, Frost: light blue). Physical: neutral steel and leather |

## 2. Human Creature Cards

Identity: proud and stubborn humans and stout folk of the river towns. They love banners and long speeches. They hold the line.

### 2.1 Militia Recruit

`human.militiaRecruit` · Frontliner · Common · Countdown 1 · Attack 2 · HP 4 · Speed 2 · Melee · Physical

> "I brought my own pitchfork!"

| Field | Brief |
| --- | --- |
| Subject | A young farm man, thin, with a big eager smile. Not a soldier yet. |
| Pose | He stands tall and proud, advancing to the right, and holds a pitchfork forward like a spear. His free hand points at the pitchfork. |
| Props | A pitchfork, a padded jacket that is too large, a cooking pot as a helmet, a small blue arm band. |
| Gameplay cues | The cheapest card: very plain gear, nothing ornate. |
| Silhouette hook | The pot helmet and the tall pitchfork. |
| Humor note | He is very proud of a farm tool. |
| Setting | A muddy village road at the edge of the river town. |

```text
young eager farm man with a big proud smile, padded jacket too large for him, cooking pot as a helmet, holding a pitchfork forward like a spear and pointing at it,
Human of Heynbord, standing tall and proud, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, muddy village road at the edge of a river town, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.2 Shieldbearer

`human.shieldbearer` · Frontliner · Common · Countdown 2 · Attack 1 · HP 7 · Melee · Physical · Armor 1 · Knockback 1 at Common, 2 at Epic, 3 at Legendary

> Her shield has more dents than a tin pot.

| Field | Brief |
| --- | --- |
| Subject | A strong, calm woman soldier with a wide stance. |
| Pose | She crouches a little behind a large round shield, with a short sword low at her side. |
| Props | A large round shield with many dents and a faded blue and gold paint, a short sword, a simple steel cap, a mail shirt. |
| Gameplay cues | The large shield is ready to bash and push. Armor 1: the shield is the main shape. Low Attack: the sword is small and low. |
| Silhouette hook | The large round shield that covers most of her body. |
| Humor note | The shield has many visible dents, but she is not worried. |
| Setting | A stone bridge over the river. |

```text
strong calm woman soldier, mail shirt and simple steel cap, large round shield covered in many dents with faded paint, short sword held low,
Human of Heynbord, slight crouch behind the shield, wide stance, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, stone bridge over a river town, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.3 Crossbow Guard

`human.crossbowGuard` · Shooter · Common · Countdown 2 · Attack 3 · HP 4 · Range 3 · Physical

> Never late. Never misses. Sometimes asleep.

| Field | Brief |
| --- | --- |
| Subject | A woman town guard who looks sleepy. |
| Pose | She aims a crossbow, steady and correct. One eye is half closed, and a small yawn shows. |
| Props | A crossbow, a quiver of bolts at her hip, a blue tabard with a gold trim, a kettle hat that is a little crooked. |
| Gameplay cues | A ranged Unit: the crossbow points at a far target. |
| Silhouette hook | The horizontal crossbow and the wide kettle hat. |
| Humor note | Her body is perfect for the shot, but her face is half asleep. |
| Setting | The top of a town wall, with a banner behind her. |

```text
sleepy woman town guard, blue tabard with gold trim, crooked kettle hat, quiver of bolts at the hip, aiming a crossbow steady and true with one eye half closed and a small yawn,
Human of Heynbord, aiming pose, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, top of a river town wall with a banner, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.4 Halberdier

`human.halberdier` · Striker · Common · Countdown 3 · Attack 4 · HP 6 · Melee · Physical · Retaliation

> Touch the banner and you touch the blade.

| Field | Brief |
| --- | --- |
| Subject | A veteran man soldier with a grey mustache and a stern face. |
| Pose | A guard pose. He holds a halberd ready to strike back, and a small banner hangs from the halberd. |
| Props | A halberd with a small blue and gold banner below the blade, a breastplate, a padded coat. |
| Gameplay cues | Retaliation: a ready, defensive pose that says "come closer and I hit back". |
| Silhouette hook | The tall halberd blade with the banner. |
| Humor note | He protects the banner as if it is his child. |
| Setting | A town square with banners. |

```text
veteran man soldier with a grey mustache and stern face, breastplate over a padded coat, halberd with a small blue and gold banner tied below the blade,
Human of Heynbord, ready guard pose about to strike back, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, river town square with banners, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.5 Dawn Cleric

`human.dawnCleric` · Support · Uncommon · Countdown 3 · Attack 2 · HP 8 · Range 2 · Holy · Regeneration 1

> She sings at sunrise. Nobody asked her to.

| Field | Brief |
| --- | --- |
| Subject | A cheerful round-faced woman priest. |
| Pose | She sings with her mouth wide open and one arm up. Her other hand holds a staff. |
| Props | A staff with a sun disc on top, white and blue robes with a gold trim, a small hymn book on a cord. |
| Gameplay cues | Holy damage: a soft gold-yellow glow from the sun disc. Regeneration: small gold sparks around her. Uncommon: gold trim on the robe. |
| Silhouette hook | The round sun disc on the staff and the raised arm. |
| Humor note | She sings very loudly. A small bird near her covers its head with a wing. |
| Setting | A riverbank at sunrise. |

```text
cheerful round-faced woman priest singing loudly with her mouth wide open and one arm raised, white and blue robes with gold trim, staff topped with a glowing sun disc, small gold sparks around her, a small bird nearby covering its head with a wing,
Human of Heynbord, singing pose, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette, gold-yellow holy glow,
light from the upper left, riverbank at sunrise, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.6 River Knight

`human.riverKnight` · Runner · Uncommon · Countdown 4 · Attack 5 · HP 8 · Speed 2 · Melee · Physical · Charge

> His horse is braver than he is.

| Field | Brief |
| --- | --- |
| Subject | A young man knight on a big, bold horse. |
| Pose | The horse charges forward with joy. The knight holds the reins tightly and leans back, with wide eyes. His lance still points forward. |
| Props | A lance, a blue and gold horse cloth, light plate armor, a helmet with the visor up. |
| Gameplay cues | Charge and Speed 2: water splashes and motion. Uncommon: a gold trim on the horse cloth. |
| Silhouette hook | The horse and rider shape with the long lance. |
| Humor note | The horse is brave and happy. The knight is nervous. |
| Setting | A shallow river ford, with water splashing. |

```text
young nervous man knight in light plate armor with visor up, wide eyes, leaning back and gripping the reins, lance pointing forward, riding a big bold joyful warhorse with a blue and gold horse cloth,
Human of Heynbord, galloping charge through splashing water, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, shallow river ford, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.7 Gate Warden

`human.gateWarden` · Frontliner · Uncommon · Countdown 3 · Attack 3 · HP 9 · Melee · Physical · Pivot

> Nobody gets past. Nobody gets behind, either.

| Field | Brief |
| --- | --- |
| Subject | A tall, sharp-eyed woman guard. |
| Pose | Her chest and lead foot advance to the right. She looks back over her shoulder, and her glaive sweeps out to the side. |
| Props | A glaive, a large iron ring of keys at her belt, a long blue coat over mail, a gold gate badge. |
| Gameplay cues | Pivot: she watches behind and to the side, and the weapon sweeps sideways. |
| Silhouette hook | The sideways glaive and the ring of keys. |
| Humor note | She sees everything, also behind her. |
| Setting | A large town gate with a portcullis. |

```text
tall sharp-eyed woman gate guard, long blue coat over mail, gold gate badge, large iron ring of keys at her belt, chest and lead foot advancing to the right, glaive sweeping out to the side,
Human of Heynbord, looking back over her shoulder, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, large river town gate with a portcullis, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.8 Iron Bulwark

`human.ironBulwark` · Frontliner · Epic · Countdown 6 · Attack 5 · HP 15 · Melee · Physical · Armor 2 · Retaliation

> A wall that complains about the weather.

Purpose: the archetypal Human Epic and strongest defensive Creature Card.

| Field | Brief |
| --- | --- |
| Subject | An old stout-folk man: short, very broad and strong. A grey beard comes out under his helmet. |
| Pose | He stands firm behind a tower shield and frowns up at a small rain cloud. |
| Props | Very heavy full plate with gold trim, a tall tower shield with short spikes, a heavy mace. A small rain cloud rains only on him. |
| Gameplay cues | Armor 2: the heaviest armor in the set. Retaliation: spikes on the shield. Epic: a heroic scene with dramatic composition, and the most ornate human armor in the set. |
| Silhouette hook | A wide block shape: the tower shield and the very broad body. |
| Humor note | He is like a wall, but he complains about a small rain cloud. |
| Setting | A stone town wall in light rain. |

```text
old stout-folk man, short and very broad, grey beard under a heavy helmet, very heavy full plate armor with ornate gold trim, tall spiked tower shield, heavy mace, frowning up at a small rain cloud that rains only on him,
Human of Heynbord, standing firm behind the shield, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, stone river town wall in light rain, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.9 Town Barricade

`human.townBarricade` · Wall · Common · Countdown 1 · Attack 0 · HP 11 · Speed 0 · Melee · Physical · Wall

> The passage permit is under the sandbags.

Purpose: a cheap Lane block. Power 11, budget 11, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A rough timber barricade made by town guards. |
| Pose | It fills a narrow stone Lane. |
| Props | Crossed beams, sandbags, a dented shield, blue cloth and a cooking-pot helmet. |
| Gameplay cues | The broad fixed shape shows Wall. Plain worn parts show Common. |
| Silhouette hook | Crossed beams and the pot helmet. |
| Humor note | Permit papers wait behind the barricade. |
| Setting | A stone bridge in the river town. |

```text
rough timber town barricade filling a narrow stone lane, crossed beams, sandbags, one dented round shield, blue cloth strips, cooking-pot helmet on top, permit papers behind it,
Human fortification of Heynbord, broad clear blocking shape, blocking face to the right, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, soft brush texture, royal blue and gold palette,
light from the upper left, stone bridge over a calm river, simple low-contrast background,
portrait 3:4 composition, no readable text, no frame
```

### 2.10 Bridge Pikeman

`human.bridgePikeman` · Striker · Uncommon · Countdown 3 · Attack 5 · HP 6 · Speed 1 · Melee · Physical · Knockback 1, 2 at Epic, 3 at Legendary

> Please enter the queue. The back of the queue.

Purpose: a Striker that pushes the enemy off the bridge. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A focused woman soldier. |
| Pose | A forward thrust. |
| Props | Long pike, mail coat, blue sash and brass shoulder guards. |
| Gameplay cues | The pike pushes the foe back. |
| Silhouette hook | The long low pike line. |
| Humor note | The queue markers behind her are perfectly straight. |
| Setting | A river-town bridge checkpoint. |

```text
focused woman bridge soldier in a mail coat with a blue sash and small brass shoulder guards, a forward thrust with a very long pike, neat queue markers behind her,
Human of Heynbord, forward thrust, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, soft brush texture, royal blue and gold palette,
light from the upper left, river-town bridge checkpoint, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.11 Banner Chaplain

`human.bannerChaplain` · Support · Uncommon · Countdown 3 · Attack 2 · HP 7 · Speed 1 · Range 2 · Holy · Rally 1

> The sermon ends when morale improves.

Purpose: a low-cost Rally source and Holy attacker. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | A stout, enthusiastic man chaplain. |
| Pose | He raises a banner-staff and gives a forceful speech. |
| Props | Sun-disc banner, white and blue robes, gold trim and a small bell. |
| Gameplay cues | Nearby guards stand taller; gold light leaves the sun disc. |
| Silhouette hook | Tall banner and round sun disc. |
| Humor note | His speech scroll crosses the ground. |
| Setting | A river-town square. |

```text
stout enthusiastic man chaplain in white and blue robes with gold trim, raising a tall banner-staff topped with a glowing sun disc, long speech scroll unrolling across the ground, nearby guards standing taller,
Human of Heynbord, commanding pose, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, royal blue and gold palette, soft gold-yellow holy glow,
light from the upper left, river-town square with banners, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.12 King's Courier

`human.kingsCourier` · Runner · Rare · Countdown 4 · Attack 4 · HP 8 · Speed 4 · Melee · Physical · Charge

> The message says urgent. She was already running.

Purpose: maximum Human Speed with less Attack than River Knight. Power 27, budget 26, deviation +3.8%.

| Field | Brief |
| --- | --- |
| Subject | A lean woman royal courier. |
| Pose | She sprints across a bridge with one foot in the air. |
| Props | Short spear, sealed scroll case, blue riding coat and ornate gold clasps. |
| Gameplay cues | Loose papers, water spray and the streaming coat show Speed 4 and Charge. |
| Silhouette hook | Forward spear and long coat. |
| Humor note | A tired horse watches her pass. |
| Setting | A bridge and riverside road. |

```text
lean woman royal courier in a blue riding coat with ornate gold clasps, sealed scroll case at her hip, sprinting at extreme speed with a short spear forward, loose papers and water spray behind her, tired horse watching,
Human of Heynbord, fast forward-running pose, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, soft brush texture, royal blue and gold palette,
light from the upper left, river-town bridge and riverside road, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.13 Pavise Arbalist

`human.paviseArbalist` · Shooter · Rare · Countdown 4 · Attack 5 · HP 6 · Speed 1 · Range 4 · Physical · Armor 1 · Hobble 1 at Rare, 2 at Epic, 3 at Legendary

> He brings his own wall and calls it a firing position.

Purpose: a durable long-range Shooter. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A patient older man arbalist. |
| Pose | He kneels behind a tall pavise and aims a heavy crossbow. |
| Props | Windlass crossbow, barbed bolts, ornate pavise, mail sleeves and bolt case. |
| Gameplay cues | The long aim shows Range 4; the shield shows Armor 1; the barbed bolts show Hobble. |
| Silhouette hook | Tall shield and horizontal crossbow. |
| Humor note | A stool and tea cup wait behind the shield. |
| Setting | A river-town wall. |

```text
patient older man arbalist with mail sleeves, kneeling behind a tall ornate blue and gold pavise, aiming a heavy windlass crossbow loaded with barbed bolts, bolt case nearby, small stool and tea cup behind the shield,
Human of Heynbord, steady protected firing pose, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, soft brush texture, royal blue and gold palette,
light from the upper left, top of a river-town wall, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.14 Dawn Reliquary

`human.dawnReliquary` · Wall · Rare · Countdown 4 · Attack 0 · HP 16 · Speed 0 · Melee · Holy · Armor 2 · Wall · Last Breath: deal 2 Holy damage

> Even broken, it gets the last word.

Purpose: a premium Wall that damages the nearest enemy Unit ahead when it leaves. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A large armored roadside reliquary. |
| Pose | It stands across the Lane like a sealed gate. |
| Props | Oak doors, steel bands, sun emblem, candles and blue prayer cloths. |
| Gameplay cues | Thick bands show Armor; gold light in cracks shows Last Breath. |
| Silhouette hook | Tall arched shrine and round sun emblem. |
| Humor note | One candle stays upright despite the damage. |
| Setting | A stone approach to a river-town temple. |

```text
large armored roadside reliquary standing across a stone lane like a sealed gate, thick oak doors with ornate steel bands, round gold sun emblem, blue prayer cloths and candles, cracks releasing holy light, one candle perfectly upright,
Human sacred fortification of Heynbord, tall broad blocking shape, blocking face to the right, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, royal blue and gold palette, strong gold-yellow holy glow,
light from the upper left, stone approach to a river-town temple, simple low-contrast background,
portrait 3:4 composition, no readable text, no frame
```

### 2.15 Marshal Elian Voss (draft)

`human.marshalElianVoss` · Support · Epic · Countdown 6 · Attack 4 · HP 12 · Speed 1 · Range 2 · Holy · Armor 1 · Rally 2 · Unique

> Hold the line. I have six more reasons.

Purpose: the named Human Epic and Rally capstone. Power 35, budget 36, deviation -2.8%.

| Field | Brief |
| --- | --- |
| Subject | An older Human officer with a close grey beard. |
| Pose | He raises his sword and plants a forked sun-banner on broken bridge stones. |
| Props | Blue officer coat, fitted plate, command sword, banner and six speech scrolls. |
| Gameplay cues | Soldiers reform behind him; the sword sends a Holy arc forward. |
| Silhouette hook | Raised sword, square shoulders and tall banner. |
| Humor note | Six prepared speeches hang from his belt. |
| Setting | A bridge under attack. |

```text
Marshal Elian Voss, tall older human officer with a close grey beard, blue officer coat over fitted plate with ornate gold trim, raising a command sword that sends a holy arc forward, planting a forked sun-banner, six rolled speeches at his belt, soldiers reforming behind him,
Human of Heynbord, heroic commanding stance on broken bridge stones, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, dramatic Epic composition, clean silhouette, royal blue and gold palette,
light from the upper left, river-town bridge under attack with banners and river spray, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

## 3. Orc Creature Cards

Identity: orc tribes of the badlands, and the beasts that fight with them. Fast, loud and always hungry. They rush the enemy Hero. High attack, low HP. They still hit the Unit that kills them.

### 3.1 Badland Pup

`orc.badlandPup` · Runner · Common · Countdown 1 · Attack 3 · HP 1 · Speed 2 · Melee · Physical · Last Breath 1

> Small, loud and already biting.

Purpose: a one-HP trade. Last Breath 1 hits the nearest enemy Unit ahead when it leaves. Power 12, budget 11, deviation +9.1%.

| Field | Brief |
| --- | --- |
| Subject | A young badland wolf pup with very big ears and big paws. |
| Pose | It jumps forward with its mouth open, ready to bite. |
| Props | A spiked leather collar that is too big for it, orange war paint stripes. |
| Gameplay cues | High Attack and HP 1: small body, big teeth. Speed 2: a jump with dust behind it. A spare fang on the collar shows Last Breath. |
| Silhouette hook | The big ears and the open mouth. |
| Humor note | It is very small, but it acts very fierce. |
| Setting | Dusty red ground in the badlands. |

```text
young badland wolf pup with very big ears and big paws, spiked leather collar too big for it, orange war paint stripes, mouth open ready to bite,
Orc of Heynbord, leaping forward with dust behind it, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, dusty red badlands ground, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.2 Scrap Raider

`orc.scrapRaider` · Runner · Common · Countdown 2 · Attack 3 · HP 4 · Speed 2 · Melee · Physical · Heroic 1 · Last Breath 1

> Everything shiny is his now.

Purpose: a fast Hero runner that still hits when he falls. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A thin, fast orc man with a big grin. |
| Pose | He runs forward with a cleaver and carries a full sack over his shoulder. |
| Props | A cleaver, a sack full of shiny things (spoons, pans, a small bell), many stolen rings and necklaces, scrap-metal armor. |
| Gameplay cues | Speed 2: a running pose. Heroic 1: he looks ahead to the right, at a bigger prize. A hidden blade in the sack shows Last Breath. |
| Silhouette hook | The large sack on his back. |
| Humor note | He wears many stolen shiny things, also a spoon as an earring. |
| Setting | A badland trail. |

```text
thin fast orc man with a big grin, scrap-metal armor, many stolen rings and necklaces, a spoon as an earring, cleaver in one hand, large sack full of shiny spoons and pans over his shoulder,
Orc of Heynbord, running forward, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, red badlands trail, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.3 Ember Shaman

`orc.emberShaman` · Shooter · Common · Countdown 3 · Attack 4 · HP 6 · Range 3 · Fire

> She cooks dinner and enemies the same way.

| Field | Brief |
| --- | --- |
| Subject | A big, kind-faced orc woman. |
| Pose | She throws a ball of fire forward from a big ladle. A cooking pot sits on a fire next to her. |
| Props | A large wooden ladle as a staff, a cooking pot over a fire, an apron over fur robes, bone beads. |
| Gameplay cues | Fire damage and range: an orange-red fire ball that flies at the target, with embers. |
| Silhouette hook | The ladle and the round pot. |
| Humor note | She uses the same ladle for soup and for fire. |
| Setting | A badland camp at dusk, with a campfire. |

```text
big kind-faced orc woman, apron over fur robes, bone beads, flinging a ball of fire from a large wooden ladle, cooking pot over a fire beside her, orange-red embers,
Orc of Heynbord, throwing pose, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, badland camp at dusk with a campfire, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.4 Howling Charger

`orc.howlingCharger` · Striker · Uncommon · Countdown 3 · Attack 4 · HP 6 · Speed 2 · Melee · Physical · Charge

> You hear it long before you see it.

| Field | Brief |
| --- | --- |
| Subject | A war boar with big tusks. It has no rider. |
| Pose | It charges forward with its head low and its mouth open in a loud scream. |
| Props | An orc war banner tied to its back, leather straps, iron caps on its tusks. |
| Gameplay cues | Charge: a fast run and a big dust cloud. Uncommon: the war banner. |
| Silhouette hook | The low head with tusks and the banner on the back. |
| Humor note | Lines in the air show the scream. Small rocks shake. |
| Setting | Open badlands with a dust cloud. |

```text
war boar with big iron-capped tusks, no rider, orc war banner tied to its back with leather straps, head low, mouth open in a loud scream, big dust cloud,
Orc of Heynbord, charging forward at full speed, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, open red badlands, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.5 Skyreaver

`orc.skyreaver` · Runner · Uncommon · Countdown 3 · Attack 3 · HP 5 · Speed 2 · Melee · Physical · Flying · Heroic 1

> It steals hats from very high up.

| Field | Brief |
| --- | --- |
| Subject | A large vulture-like bird with a bald head and wide wings. |
| Pose | It flies with its wings wide open. It holds a stolen hat in its talons and wears a second stolen hat on its head. |
| Props | Orange and red tribal paint on the wings, a fancy stolen hat with a feather. |
| Gameplay cues | Flying: wings fully open, and no ground under it. Heroic 1: it dives toward a far target. |
| Silhouette hook | The wide wing span and the hat. |
| Humor note | It is very proud of its stolen hats. |
| Setting | A badland sky above mesas. |

```text
large vulture-like bird with a bald head and wide wings, orange and red tribal paint on the wings, wearing a fancy stolen feathered hat, holding another stolen hat in its talons,
Orc of Heynbord, flying with wings fully spread, diving forward, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, badland sky above red mesas, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.6 Pack Stalker

`orc.packStalker` · Striker · Uncommon · Countdown 2 · Attack 3 · HP 3 · Speed 2 · Melee · Physical · Pivot · Last Breath 1

> It always knows where you are. Mostly behind you.

Purpose: the Orc Pivot Unit, and a trade that still hits. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A lean striped hyena with a sloped back. |
| Pose | Its chest points right in a low crouch. Its head turns back over its shoulder, with a sly grin. |
| Props | A leather harness with small bone charms, orange paint marks. |
| Gameplay cues | Pivot: the head turns back. The chest still points right. A loose fang on the harness shows Last Breath. |
| Silhouette hook | The sloped back and the head turned back. |
| Humor note | It grins as if it knows a secret about you. |
| Setting | Tall dry grass in the badlands. |

```text
lean striped hyena with a sloped back, leather harness with small bone charms, orange paint marks, sly grin, chest pointing right, head turned back over its shoulder,
Orc of Heynbord, low stalking crouch, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, tall dry grass in the red badlands, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.7 Tusk Brute

`orc.tuskBrute` · Striker · Common · Countdown 4 · Attack 6 · HP 8 · Melee · Physical · Heroic 2

> Doors are only a suggestion.

| Field | Brief |
| --- | --- |
| Subject | A very big, very strong orc woman with large tusks. |
| Pose | She walks through a broken wooden door. Pieces of the door fly around her. |
| Props | A big wooden club, rough iron shoulder plates, a fur belt. |
| Gameplay cues | High Attack: the biggest orc body in the set after Grukka. Heroic 2: she moves forward, toward the enemy Hero. Common: rough, plain gear. |
| Silhouette hook | The large body, the tusks and the door frame around her. |
| Humor note | The door is still on its hinges, but she is through it. |
| Setting | A broken door of a fort. |

```text
very big strong orc woman with large tusks, rough iron shoulder plates, fur belt, big wooden club, smashing through a wooden door with splinters flying around her,
Orc of Heynbord, stepping forward through the broken door, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, broken fort door in the badlands, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.8 Warchief Grukka

`orc.warchiefGrukka` · Striker · Epic · Countdown 6 · Attack 8 · HP 12 · Speed 2 · Melee · Physical · Charge · Heroic 2 · Unique

> "Lunch first. Then glory."

| Field | Brief |
| --- | --- |
| Subject | Grukka, the warchief: a huge, old, happy orc man. See the character sheet in 3.8.1. |
| Pose | He jumps down from a rock to charge, with his axe high. He bites a roast leg in his other hand. |
| Props | A big double axe, a roast leg, a skull-and-horn helmet, a war cloak. |
| Gameplay cues | Charge: a jump into battle. Heroic 2: he looks far ahead, at the enemy Hero. Epic: a heroic scene with war banners and drums behind him. |
| Silhouette hook | The horned helmet, the high axe and the roast leg. |
| Humor note | He is in the middle of a heroic charge, and he still eats his lunch. |
| Setting | A badland cliff with tribe banners and war drums behind him. |

#### 3.8.1 Character sheet: Warchief Grukka

| Item | Description |
| --- | --- |
| Body | Very large and wide, with a big belly and very strong arms. He is older: some grey in his braided beard. |
| Face | A big happy grin, large tusks with gold rings, small kind eyes, a scar across his nose. |
| Head | A helmet made from a big beast skull with two curved horns. |
| Clothes | A dark red war cloak with a fur collar, leather and rough iron armor, a wide belt with a big iron buckle. |
| Colors | Burnt orange skin paint and dark red cloth. Gold only on the tusk rings, the buckle and the axe. |
| Signature props | A big double axe in his right hand. A roast leg in his left hand. He always has food. |
| Key shapes | The two horns, the round belly, the double axe. |
| Personality | Loud, warm and hungry. His warriors love him. He never hurries lunch. |

```text
Warchief Grukka, huge old happy orc man with a big belly, braided beard with some grey, large tusks with gold rings, scar across his nose, beast-skull helmet with two curved horns, dark red war cloak with fur collar, raising a big double axe in his right hand and biting a roast leg in his left hand,
Orc of Heynbord, leaping down from a rock into a heroic charge, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, badland cliff with tribe banners and war drums behind him, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.9 Dusthide Brawler

`orc.dusthideBrawler` · Frontliner · Common · Countdown 2 · Attack 3 · HP 8 · Speed 1 · Melee · Physical

> He mistakes every warning for applause.

Purpose: limited Orc Lane protection without Armor. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A broad orc man with a pleased grin. |
| Pose | He plants both feet in a camp entrance. |
| Props | Short cudgel, worn hide vest and rough belt. |
| Gameplay cues | Wide body shows HP; small cudgel shows moderate Attack. |
| Silhouette hook | Broad shoulders and raised cudgel. |
| Humor note | He thinks enemy threats are cheers. |
| Setting | An Orc camp between red rocks. |

```text
broad sturdy orc man with a pleased grin, worn hide vest and rough belt, holding a short wooden cudgel, feet planted wide in a camp entrance,
Orc of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, soft brush texture, burnt orange and dark red palette,
light from the upper left, red badland camp entrance, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.10 Cinderhorn Ram

`orc.cinderhornRam` · Runner · Uncommon · Countdown 3 · Attack 3 · HP 5 · Speed 2 · Melee · Fire · Charge

> It never waits for the gate to open.

Purpose: a fast Fire attacker. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A muscular black-wool badland ram. |
| Pose | It charges through a wooden fence. |
| Props | Charred harness, iron horn rings and glowing horn tips. |
| Gameplay cues | Dust and boards show Charge; embers show Fire. |
| Silhouette hook | Large curled horns and low head. |
| Humor note | An open gate stands beside the broken fence. |
| Setting | A badland livestock enclosure. |

```text
muscular badland ram with black wool, large curled horns with glowing ember-red tips, charred leather harness and iron horn rings, charging through a wooden fence beside an open gate, broken boards and embers flying,
Orc of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, burnt orange and dark red palette, orange-red fire accents,
light from the upper left, badland livestock enclosure, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.11 Warhowler Drummer

`orc.warhowlerDrummer` · Support · Uncommon · Countdown 2 · Attack 3 · HP 5 · Speed 1 · Melee · Physical · Rally 1

> She only knows one rhythm: faster.

Purpose: a low-Countdown rush enabler. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A compact orc woman with a fierce, joyful face. |
| Pose | She marches and strikes a drum at her hip. |
| Props | Hide drum, bone sticks and red feather trim. |
| Gameplay cues | Nearby warriors surge forward with the beat. |
| Silhouette hook | Round side drum and raised sticks. |
| Humor note | One warrior covers his ears while charging. |
| Setting | A trail between mesas. |

```text
compact fierce orc woman with a joyful howl, worn leather gear with red feather trim, hide drum at her hip, two bone drumsticks raised, blurred warriors rushing behind her and one covering his ears,
Orc of Heynbord, marching forward, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, soft brush texture, burnt orange and dark red palette,
light from the upper left, red badland trail between mesas, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.12 Ashspit Hunter

`orc.ashspitHunter` · Shooter · Rare · Countdown 4 · Attack 5 · HP 7 · Speed 1 · Range 4 · Fire

> He measures range by how far the eyebrows burn.

Purpose: a long-range Fire threat. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A lean orc man with one singed eyebrow. |
| Pose | He braces a long fire tube. |
| Props | Iron fire tube, brass trim, ember basket and leather coat. |
| Gameplay cues | The long weapon shows Range 4; its trail shows Fire. |
| Silhouette hook | Horizontal tube and ember basket. |
| Humor note | His remaining eyebrow shows concern. |
| Setting | A ledge above a canyon. |

```text
lean orc man with one singed eyebrow, decorated leather coat, bracing a long rough-iron fire tube connected to an ember basket, narrow jet of flame toward a distant target,
Orc of Heynbord, steady ranged pose, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, burnt orange and dark red palette, orange-red fire accents,
light from the upper left, high ledge above a red badland canyon, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.13 Mesa Pit-Fighter

`orc.mesaPitFighter` · Frontliner · Rare · Countdown 4 · Attack 4 · HP 12 · Speed 1 · Melee · Physical · Retaliation

> Hit her once. That is how counting lessons start.

Purpose: an aggressive Frontliner that protects through threat. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A tall orc woman with a broken-tusk grin. |
| Pose | She advances to the right, absorbs a hit, and the counter-punch goes to the right. |
| Props | Iron gauntlets, red pit sash and trophy bells. |
| Gameplay cues | The counter-swing shows Retaliation. |
| Silhouette hook | Large hooked fists. |
| Humor note | Tally marks count her attackers. |
| Setting | A red-stone fighting pit. |

```text
tall heavily muscled orc woman with a broken-tusk grin, red pit sash, ornate rough-iron hooked gauntlets with tally marks, advancing to the right, absorbing a strike on one arm while the counter-punch goes to the right,
Orc of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, soft brush texture, burnt orange and dark red palette,
light from the upper left, circular fighting pit cut into red stone, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.14 Pyreaxe Ravager

`orc.pyreaxeRavager` · Striker · Rare · Countdown 5 · Attack 7 · HP 8 · Speed 1 · Melee · Fire · Heroic 2

> The axe is hot. Her temper is hotter.

Purpose: a heavy Fire finisher. Power 31, budget 31, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A fierce orc woman with a high red crest. |
| Pose | She advances with a burning two-handed axe. |
| Props | Ember-grooved axe, metal trim and scorched cloak. |
| Gameplay cues | The large axe shows Attack; her forward gaze shows Heroic. |
| Silhouette hook | High crest and broad flaming axe. |
| Humor note | The axe also roasts one mushroom. |
| Setting | A burning fort barricade. |

```text
fierce orc woman with a high dark-red hair crest, ornate rough-iron gear and scorched cloak, raising a large two-handed axe with ember-filled grooves and a burning blade, one roasted mushroom on a small attached skewer,
Orc of Heynbord, advancing toward a distant enemy, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette, burnt orange and dark red palette, orange-red fire accents,
light from the upper left, burning barricade before a badland fort, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.15 Warband Standard-Bearer

`orc.warbandStandardBearer` · Support · Epic · Countdown 6 · Attack 5 · HP 11 · Speed 1 · Melee · Physical · Charge · Heroic 2 · Rally 2

> Follow the banner. Ignore where it is going.

Purpose: the archetypal Orc Epic: immediate movement, stronger allies and Hero pressure. Power 36, budget 36, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A huge orc man with braided black hair. |
| Pose | He charges downhill with a towering standard. |
| Props | Hide banner, horned crossbar, trophy shields, iron armor and fur cloak. |
| Gameplay cues | The following warband shows Rally; the distant fort shows Heroic. |
| Silhouette hook | Very tall forked banner. |
| Humor note | The banner and warband point in different directions. |
| Setting | An Epic badland ridge assault. |

```text
huge confident orc man with braided black hair, ornate rough-iron armor and dark-red fur cloak, carrying a monumental hide war standard with horned crossbar and trophy shields, charging downhill to the right while the warband follows to the right, the banner cloth points back the other way,
Orc of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly fantasy card illustration, bright warm light, dramatic Epic composition, clean silhouette, burnt orange and dark red palette,
light from the upper left, badland ridge assault with drums and banners, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

## 4. Elf Creature Cards

Identity: patient forest people and plant spirits. They control movement from range, heal, and poison. All values in this section are **provisional**.

### 4.1 Rootbound Guard

`elf.rootboundGuard` · Frontliner · Common · Countdown 3 · Attack 3 · HP 7 · Speed 1 · Melee · Physical · Armor 1 · Entangle

> He has held this path since it was somewhere else.

Purpose: an Elf Lane anchor. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | A broad old plant guardian in bark armor. |
| Pose | It stands rooted behind a leaf shield. |
| Props | Leaf shield, branch spear and boot-shaped training post. |
| Gameplay cues | Roots show Entangle; bark cuirass shows Armor. |
| Silhouette hook | Square trunk and broad shield. |
| Humor note | A snail uses it as a milestone. |
| Setting | An ancient forest path. |

```text
broad old plant guardian rooted across a forest path, bark cuirass, large leaf shield and short branch spear, roots around a boot-shaped training post, snail on one shoulder,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient green forest, amber light from the upper left, clean square silhouette, plain Common detail,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.2 Bramble Duelist

`elf.brambleDuelist` · Striker · Common · Countdown 2 · Attack 4 · HP 4 · Speed 2 · Melee · Physical

> One cut for honor. Two because the hedge was rude.

Purpose: a simple fast Elf attacker. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A young elf woman. |
| Pose | She makes a quick fencing lunge. |
| Props | Thorn rapier and worn green coat. |
| Gameplay cues | The exposed fast stance shows high Attack and low HP. |
| Silhouette hook | Narrow rapier line. |
| Humor note | She duels a hedge that holds a wooden spoon. |
| Setting | A forest clearing. |

```text
young elegant elf woman making a quick fencing lunge, worn green coat and slender thorn rapier, loose leaves trailing, dueling a bramble hedge that holds a wooden spoon, calm deadpan expression,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient green forest clearing, amber light from the upper left, clean narrow silhouette,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.3 Fernwing Courier

`elf.fernwingCourier` · Runner · Common · Countdown 2 · Attack 3 · HP 3 · Speed 2 · Melee · Physical · Flying

> The message says urgent. The parcel is a sandwich.

Purpose: cheap Flying Hero pressure. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A small leaf spirit courier. |
| Pose | It dives between branches. |
| Props | Fern wings, satchel and official parcel. |
| Gameplay cues | Wide wings and no ground contact show Flying. |
| Silhouette hook | A V-shaped wing span. |
| Humor note | A sandwich shows from the parcel. |
| Setting | The high forest canopy. |

```text
small elegant leaf spirit courier diving between branches, broad fern wings spread in a V, tiny worn satchel and sealed parcel with a sandwich corner visible, serious official expression,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient green forest canopy, amber light from the upper left, clean flying silhouette, plain Common detail,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.4 Mossbow Lookout

`elf.mossbowLookout` · Shooter · Common · Countdown 3 · Attack 3 · HP 6 · Speed 1 · Range 4 · Physical · Entangle

> He can hear a boot step. He cannot hear advice.

Purpose: long-range movement control. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | An elf man scout. |
| Pose | He kneels for a long bow shot. |
| Props | Moss-covered longbow, leaf cloak and vine arrow. |
| Gameplay cues | The vine arrow shows Entangle. |
| Silhouette hook | Long horizontal bow. |
| Humor note | A bird gives advice beside his ear. |
| Setting | A high root platform. |

```text
elegant elf man lookout kneeling on a high root platform, plain leaf cloak and moss-covered longbow, drawing a vine-wrapped arrow, small bird loudly advising beside his ear,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient green forest, amber light from the upper left, clean longbow silhouette,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.5 Acorn Tender

`elf.acornTender` · Shooter · Common · Countdown 3 · Attack 3 · HP 4 · Speed 1 · Range 2 · Holy · Poison

> Growth takes patience. Wilt takes less.

Purpose: a Holy shooter that applies Poison. Power 19, budget 21, deviation -9.5%.

| Field | Brief |
| --- | --- |
| Subject | An elder elf woman gardener. |
| Pose | She raises one glowing acorn. |
| Props | Crooked watering can, pruning knife and plain robe. |
| Gameplay cues | Green sap on the pruning knife shows Poison. |
| Silhouette hook | Raised acorn and watering can. |
| Humor note | She glares at an acorn as if it is late. |
| Setting | A nursery grove. |

```text
elder elegant elf woman gardener raising one softly glowing acorn, plain green robe, crooked watering can and small pruning knife coated in green sap, a leaf wilting where the knife passed, stern look at another unopened acorn,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient forest nursery, amber and gentle holy light from the upper left, clean silhouette,
soft brush texture, leaf green and pale gold palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.6 Glade Turnblade

`elf.gladeTurnblade` · Striker · Uncommon · Countdown 3 · Attack 5 · HP 5 · Speed 1 · Melee · Physical · Pivot

> Behind him is only another front.

Purpose: the Elf Pivot Unit. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | An elf man guard. |
| Pose | His chest and lead foot advance to the right. He looks back, and the glaive sweeps behind him. |
| Props | Crescent glaive and green coat with amber trim. |
| Gameplay cues | Front and rear sight lines show Pivot. |
| Silhouette hook | Circular blade path. |
| Humor note | Two practice dummies both think they are first. |
| Setting | A forked forest path. |

```text
elegant elf man guard, chest and lead foot advancing to the right, looking back in a precise cut, crescent glaive sweeping behind him, green coat with amber trim, alert eyes checking front and rear, two practice dummies on opposite sides,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient forest forked path, amber light from the upper left, circular action silhouette,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.7 Canopy Skirmisher

`elf.canopySkirmisher` · Runner · Uncommon · Countdown 3 · Attack 4 · HP 4 · Speed 2 · Melee · Physical · Flying

> The stairs were deemed inefficient.

Purpose: mobile pressure with fragile stats. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | An elf woman with leaf-glider wings. |
| Pose | She dives with a short spear. |
| Props | Leaf wings, short spear and amber-trim harness. |
| Gameplay cues | Spread wings show Flying. |
| Silhouette hook | Triangular wings and spear. |
| Humor note | An unused rope ladder hangs behind her. |
| Setting | A canopy bridge. |

```text
elegant elf woman skirmisher diving from the canopy, leaf-glider wings spread wide, short spear forward, green harness with amber trim, unused rope ladder behind her, calm practical expression,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient green forest canopy bridge, amber light from the upper left, clean triangular silhouette,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.8 Thornline Archer

`elf.thornlineArcher` · Shooter · Uncommon · Countdown 3 · Attack 3 · HP 6 · Speed 1 · Range 4 · Physical · Poison

> The arrow leaves. The ache stays.

Purpose: reliable ranged Poison. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | An elf man archer. |
| Pose | He makes a composed standing shot. |
| Props | Recurved thorn bow with amber trim and a poisoned arrow. |
| Gameplay cues | Green sap on the arrow shows Poison. |
| Silhouette hook | Hooked bow shape. |
| Humor note | A flower on his training post has wilted. |
| Setting | A woodland firing line. |

```text
elegant elf man archer making a composed standing shot, recurved thorn bow with amber trim, arrow leaving a green sap trail toward a distant training post, perfectly formal posture,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient woodland firing line, amber light from the upper left, clean hooked-bow silhouette,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.9 Dewkeeper

`elf.dewkeeper` · Support · Uncommon · Countdown 3 · Attack 2 · HP 8 · Speed 1 · Range 3 · Holy · Regeneration 1

> She collects morning dew. Afternoon dew is paperwork.

Purpose: a durable Holy support. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | An elf woman healer. |
| Pose | She lifts a crystal bowl. |
| Props | Crystal bowl, reed staff and amber-trim robe. |
| Gameplay cues | Luminous dew closes a small wound. |
| Silhouette hook | Bowl and tall staff. |
| Humor note | One bottle in her orderly set is ignored. |
| Setting | A misty grove. |

```text
elegant elf woman dewkeeper lifting a crystal bowl of luminous morning dew, reed staff and green robe with amber trim, holy droplets closing a small wound, ordered bottles with one ignored,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient misty forest, amber light from the upper left, clear bowl-and-staff silhouette,
soft brush texture, leaf green and pale gold palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.10 Bramble Nest

`elf.brambleNest` · Wall · Uncommon · Countdown 3 · Attack 0 · HP 19 · Speed 0 · Melee · Physical · Wall · Regeneration 1

> It is not blocking the path. It is the path now.

Purpose: a Wall that grows back. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A dense living bramble arch. |
| Pose | It fills an old forest road. |
| Props | Thorn arch, seed pods and amber ribbons. |
| Gameplay cues | Fresh shoots closing a cut show Regeneration. |
| Silhouette hook | Wide fixed arch. |
| Humor note | A direction sign points into the hedge. |
| Setting | An old forest road. |

```text
dense living bramble nest rooted across an old forest road, broad thorn arch with seed pods and amber ribbons, fresh green shoots closing a cut in the arch, blank direction sign pointing into the hedge,
Elf fortification of Heynbord, blocking face to the right, centered,
painterly storybook fantasy card illustration, ancient green forest, amber light from the upper left, wide immovable silhouette,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.11 Amberwing Dart

`elf.amberwingDart` · Runner · Rare · Countdown 3 · Attack 4 · HP 3 · Speed 2 · Melee · Physical · Flying · Entangle

> It stops armies and loses arguments with windows.

Purpose: fast Flying control with very low HP. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A dragonfly-like plant spirit. |
| Pose | It makes a steep attack dive. |
| Props | Amber-veined wings, thorn lance and trailing vines. |
| Gameplay cues | Vines show Entangle; four wings show Flying. |
| Silhouette hook | Crossed wing span. |
| Humor note | One wing has a window-shaped repair. |
| Setting | A canopy gap. |

```text
elegant dragonfly plant spirit in a steep attack dive, four ornate leaf wings with amber veins, thorn lance at its head, fine vines trailing toward a target, one wing with a window-shaped repair,
Elf spirit of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient forest canopy gap, amber light from the upper left, crisp crossed-wing silhouette, Rare ornate detail,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.12 Elderbranch Bowmaster

`elf.elderbranchBowmaster` · Shooter · Rare · Countdown 4 · Attack 5 · HP 5 · Speed 1 · Range 5 · Physical · Poison

> She waits for the perfect shot. Lunch waits too.

Purpose: maximum-range Poison. Power 25, budget 26, deviation -3.8%.

| Field | Brief |
| --- | --- |
| Subject | An older elf woman master archer. |
| Pose | She draws from a high branch. |
| Props | Ornate branch bow, metal fittings and a long poisoned arrow. |
| Gameplay cues | The long sight line shows Range 5. Green sap on the arrow shows Poison. |
| Silhouette hook | Tall bow. |
| Humor note | Squirrels inspect her untouched picnic. |
| Setting | The crown canopy. |

```text
older elegant elf woman bowmaster drawing an ornate living-branch longbow from a high perch, gold-metal fittings and layered green cloak, long arrow with a green sap drip aimed through distant trees, untouched picnic inspected by squirrels,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient crown canopy, amber light from the upper left, strong tall-bow silhouette, Rare ornate detail,
soft brush texture, leaf green and amber palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.13 Seedwind Shepherd

`elf.seedwindShepherd` · Support · Rare · Countdown 4 · Attack 1 · HP 11 · Speed 1 · Range 3 · Holy · Flying · Regeneration 1

> Every seed has a destination. He stays to water them.

Purpose: a durable Flying healer. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | An elf man seed shepherd. |
| Pose | He floats under a seed sail. |
| Props | Seed sail, ornate staff, gold-trim cloak and tiny baton. |
| Gameplay cues | Holy dew closing a cut shows Regeneration. |
| Silhouette hook | Broad sail and staff. |
| Humor note | He directs seeds like road traffic. |
| Setting | A canopy wind corridor. |

```text
elegant elf man seedwind shepherd floating beneath a translucent seed sail, ornate seed staff and green cloak with gold trim, holy dew closing a cut on his arm, guiding other seeds with a tiny baton, broad sturdy frame,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ancient forest wind corridor, amber holy light from the upper left, clean sail-and-staff silhouette, Rare detail,
soft brush texture, leaf green and pale gold palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.14 Canopy Longbow Guard

`elf.canopyLongbowGuard` · Shooter · Epic · Countdown 5 · Attack 6 · HP 7 · Speed 1 · Range 5 · Physical · First Strike · Entangle

> The warning shot was yesterday.

Purpose: the archetypal Elf Epic: maximum range and approach denial. Power 32, budget 31, deviation +3.2%.

| Field | Brief |
| --- | --- |
| Subject | An elf woman canopy sentinel. |
| Pose | She draws at an attacker below. |
| Props | Monumental living longbow and layered leaf armor. |
| Gameplay cues | The ready shot shows First Strike; the vine arrow shows Entangle. |
| Silhouette hook | A dramatic bow arc. |
| Humor note | A second warning arrow is already beside a broken bell. |
| Setting | A colossal canopy gate. |

```text
heroic elegant elf woman canopy sentinel drawing a monumental living longbow at an attacker below, ornate layered leaf armor, powerful vine-wrapped arrow ready, second arrow beside a broken warning bell,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, colossal ancient forest gate, dramatic amber light from the upper left, bold bow-arc silhouette, rich Epic detail,
soft brush texture, leaf green and gold palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 4.15 Lethiel, First Gardener (draft)

`elf.lethielFirstGardener` · Support · Epic · Countdown 4 · Attack 1 · HP 14 · Speed 1 · Range 2 · Holy · Unique · Regeneration 2

> The forest grew wild. Lethiel called it adequate.

Purpose: the named Elf Epic and a durable healer. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | An ancient elf gardener. |
| Pose | Lethiel touches the ground with a luminous staff. |
| Props | Leaf mantle, seed crown, silver pruning hook and tiny ruler. |
| Gameplay cues | Holy light closing a split in the bark shows Regeneration. |
| Silhouette hook | Seed crown and tall staff. |
| Humor note | Lethiel measures a colossal tree and approves. |
| Setting | A primeval garden. |

```text
Lethiel the First Gardener, ancient elegant elf, luminous living staff, ceremonial leaf mantle, seed crown and silver pruning hook, holy light closing a split in the bark beside him, measuring a colossal tree with a tiny ruler and showing restrained approval,
Elf of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, primeval green forest garden, dramatic amber light from the upper left, bold crown-and-staff silhouette, rich Epic detail,
soft brush texture, leaf green and pale gold palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

## 5. Undead Creature Cards

Identity: old spirits in bones and armor. They use many cheap Units, Swarm, Rebirth, Summon and Frost. All values in this section are **provisional**.

### 5.1 Graveyard Drudge

`undead.graveyardDrudge` · Frontliner · Common · Countdown 1 · Attack 1 · HP 5 · Speed 1 · Melee · Physical · Swarm 1

> He works better when somebody watches.

Purpose: a cheap blocker that rewards a crowded Lane. Power 11, budget 11, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A broad skeleton laborer in a patched burial coat. |
| Pose | He braces behind a shovel while a smaller skeleton watches. |
| Props | Blunt shovel, rope belt and rusted shoulder plate. |
| Gameplay cues | Two figures show Swarm; the broad body shows HP. |
| Silhouette hook | Round shoulders and tall shovel. |
| Humor note | He checks that his helper still works. |
| Setting | A muddy grave path. |

```text
broad skeleton graveyard laborer in a patched burial coat, bracing behind a blunt shovel, smaller skeleton helper behind him, rusted shoulder plate and rope belt, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, misty Hollow Marches, pale teal moonlight from the upper left, clear broad silhouette,
soft brush texture, rusted iron and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.2 Rattleknife

`undead.rattleknife` · Striker · Common · Countdown 1 · Attack 3 · HP 2 · Speed 1 · Melee · Physical · Swarm 1

> One knife is a hobby. Two is a plan.

Purpose: a cheap Swarm attacker. Power 12, budget 11, deviation +9.1%.

| Field | Brief |
| --- | --- |
| Subject | A thin skeleton cutpurse. |
| Pose | He lunges while his loose hand prepares a final throw. |
| Props | Chipped dinner knife, empty purse and worn hood. |
| Gameplay cues | A smaller skeleton at his elbow shows Swarm. |
| Silhouette hook | Long arm and forward knife. |
| Humor note | The empty purse has a painted Coin symbol. |
| Setting | A crooked marsh toll road. |

```text
thin skeleton cutpurse lunging with a chipped dinner knife, a smaller skeleton crowding his elbow, worn hood and empty purse with a painted coin symbol, eager bony grin, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, misty Hollow Marches toll road, pale teal moonlight from the upper left, sharp forward silhouette,
soft brush texture, rusted iron and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no readable text, no frame
```

### 5.3 Coffin-Lid Skater

`undead.coffinLidSkater` · Runner · Common · Countdown 1 · Attack 2 · HP 1 · Speed 1 · Melee · Physical · Charge

> The hill was steeper when he was alive.

Purpose: fragile early Hero pressure. Power 10, budget 11, deviation -9.1%.

| Field | Brief |
| --- | --- |
| Subject | A small skeleton on a coffin lid. |
| Pose | He slides to the right down the hill. |
| Props | Coffin lid, bent-spoon rudder and long scarf. |
| Gameplay cues | Mud spray and the steep angle show Charge. |
| Silhouette hook | Long lid and scarf. |
| Humor note | A loose cart wheel chases him. |
| Setting | A wet Marches causeway. |

```text
small skeleton riding a loose wooden coffin lid to the right down a wet causeway, leaning into the slide, bent spoon used as a rudder, long torn scarf streaming behind him, stray cart wheel chasing, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, misty Hollow Marches, pale teal moonlight from the upper left, strong diagonal silhouette,
soft brush texture, mud and old wood, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.4 Hushbow

`undead.hushbow` · Shooter · Common · Countdown 2 · Attack 2 · HP 2 · Speed 1 · Range 2 · Physical · Summon Skeleton

> Quiet in life. Considerably noisier afterward.

Purpose: a short-range Shooter that summons a Skeleton beside it. Power 15.6, budget 16, deviation -2.5%.

| Field | Brief |
| --- | --- |
| Subject | A skeleton archer in grave cloth. |
| Pose | It draws a short bow. |
| Props | Bow, wrapped bells and bone-filled quiver. |
| Gameplay cues | A second skull in the quiver shows Summon. |
| Silhouette hook | Bow arc and tall quiver. |
| Humor note | It asks for silence without lips. |
| Setting | Reed-filled burial ground. |

```text
skeleton archer wrapped in faded grave cloth, drawing a short bow, bells wrapped to keep them quiet, second skull peering from a bone-filled quiver, finger raised for silence, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, misty burial reeds, pale teal moonlight from the upper left, clear bow silhouette,
soft brush texture, rusted bracers and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.5 Grave Bell Tender

`undead.graveBellTender` · Support · Common · Countdown 2 · Attack 1 · HP 5 · Speed 1 · Melee · Physical · Summon Skeleton

> One ring for supper. Two for reinforcements.

Purpose: efficient two-body Lane setup. Power 14.6, budget 16, deviation -8.8%.

| Field | Brief |
| --- | --- |
| Subject | A stooped skeleton sexton. |
| Pose | It rings a handbell while a Skeleton rises. |
| Props | Large bell, key chain and patched cloak. |
| Gameplay cues | The second Unit shows Summon. |
| Silhouette hook | Bell above a bent body. |
| Humor note | The new Skeleton carries a dinner bowl. |
| Setting | A flooded cemetery. |

```text
stooped skeleton sexton ringing a large handbell, another small skeleton climbing from soft earth with a dinner bowl, patched cloak and iron key chain, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, flooded Hollow Marches cemetery, pale teal moonlight from the upper left, raised-bell silhouette,
soft brush texture, rusted metal and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.6 Backwatch Bailiff

`undead.backwatchBailiff` · Frontliner · Uncommon · Countdown 2 · Attack 2 · HP 6 · Speed 1 · Melee · Physical · Pivot

> Nobody passes without the correct expired permit.

Purpose: the Undead Pivot Unit. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A tall skeletal road bailiff. |
| Pose | Its chest and feet advance to the right. Its skull and polearm turn back. |
| Props | Hooked polearm, key ring and teal-trimmed coat. |
| Gameplay cues | The twisted pose shows Pivot. |
| Silhouette hook | Wide horizontal polearm. |
| Humor note | It presents a blank permit to a crow. |
| Setting | A broken marsh checkpoint. |

```text
tall skeletal road bailiff, chest and feet advancing to the right, skull turned back, hooked polearm sweeping behind, iron key ring and rusted coat with pale teal trim, offering a blank permit to a confused crow,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, misty Hollow Marches checkpoint, pale teal moonlight from the upper left, wide silhouette,
soft brush texture, rusted iron and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.7 Chattering Cohort

`undead.chatteringCohort` · Striker · Uncommon · Countdown 2 · Attack 4 · HP 3 · Speed 1 · Melee · Physical · Swarm 1

> They agree on everything, very loudly.

Purpose: the main cheap Swarm attacker. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | Three eager skeleton soldiers around one sword. |
| Pose | They all lean and advance to the right. |
| Props | Oversized sword, mismatched helmets and teal cloth. |
| Gameplay cues | The group composition shows Swarm. |
| Silhouette hook | Three skulls and one long blade. |
| Humor note | Their free hands point different ways. |
| Setting | A narrow causeway. |

```text
three eager skeleton soldiers crowded around one oversized rusted sword, mismatched helmets and pale teal cloth knots, all advancing to the right and leaning forward, free hands pointing different ways, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, narrow misty causeway, pale teal moonlight from the upper left, clear three-skull silhouette,
soft brush texture, rusted iron and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.8 Pale Galloper

`undead.paleGalloper` · Runner · Uncommon · Countdown 2 · Attack 2 · HP 2 · Speed 2 · Melee · Frost · Charge

> The rider asked for a slower horse.

Purpose: fast Frost tempo and Hero pressure. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A nervous skeleton on a spectral marsh pony. |
| Pose | The pony charges while the rider leans back. |
| Props | Frosted saddle, empty scroll tube and rusted cap. |
| Gameplay cues | Ice spray shows Frost and Charge. |
| Silhouette hook | Small rider over long pony legs. |
| Humor note | The pony is braver than the rider. |
| Setting | A frozen marsh ford. |

```text
nervous skeleton courier leaning backward on a joyful spectral marsh pony charging through shallow ice, frosted saddle, empty scroll tube and rusted cap, pale blue frost spray, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, frozen Hollow Marches ford, pale teal moonlight from the upper left, strong horse-and-rider silhouette,
soft brush texture, frost and rusted metal, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.9 Rime-Eye Archer

`undead.rimeEyeArcher` · Shooter · Uncommon · Countdown 2 · Attack 2 · HP 3 · Speed 1 · Range 3 · Frost

> She closes one eye. The other is already frozen open.

Purpose: cheap ranged Frost control. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A skeletal woman archer with one frost eye. |
| Pose | She holds a calm full draw. |
| Props | Longbow, icy arrow and rusted scale vest. |
| Gameplay cues | The icy arrowhead shows Frost. |
| Silhouette hook | Tall bow and narrow body. |
| Humor note | A frozen moth rests on her open eye. |
| Setting | A dead willow bank. |

```text
skeletal woman archer at full draw, one eye glowing with frost and a frozen moth resting over it, longbow and icy arrow, rusted scale vest with a silver-teal clasp, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, dead willow bank in the Hollow Marches, pale teal moonlight from the upper left, clear ranged silhouette,
soft brush texture, frost and rusted iron, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.10 Ossuary Piper

`undead.ossuaryPiper` · Support · Uncommon · Countdown 2 · Attack 2 · HP 6 · Speed 1 · Melee · Physical · Rally 1

> Nobody knows the tune. Everybody marches.

Purpose: a Swarm payoff and Lane support. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A cheerful broad skeleton musician. |
| Pose | It marches with crooked bone pipes. |
| Props | Pipe bundle, small drum, teal sash and rusted breastplate. |
| Gameplay cues | Nearby skeletons stand taller with the music. |
| Silhouette hook | Fan-shaped pipes. |
| Humor note | A frog tries to match the tune. |
| Setting | A marsh funeral road. |

```text
cheerful broad skeleton musician marching while playing crooked bone pipes, small drum at the hip, pale teal sash and rusted breastplate, nearby skeletons marching with confidence, frog trying to sing, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, misty funeral road, pale teal moonlight from the upper left, fan-shaped pipe silhouette,
soft brush texture, rusted iron and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.11 Coffin Lancer

`undead.coffinLancer` · Frontliner · Rare · Countdown 2 · Attack 1 · HP 4 · Speed 1 · Melee · Physical · Armor 1 · Rebirth

> The coffin is defensive equipment.

Purpose: a compact persistent blocker. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | An armored skeleton knight. |
| Pose | It kneels behind a coffin shield with a lance level. |
| Props | Ornate lance, coffin and tarnished silver trim. |
| Gameplay cues | The coffin shows Armor; a pale double image shows Rebirth. |
| Silhouette hook | Coffin rectangle and long lance. |
| Humor note | A pillow remains inside the shield. |
| Setting | A ruined noble crypt. |

```text
armored skeleton knight kneeling behind an upright coffin used as a shield, long ornate rusted lance held level, tarnished silver trim, faint pale double-image rising behind, pillow still tied inside the coffin, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, ruined Hollow Marches crypt, pale teal moonlight from the upper left, coffin-and-lance silhouette, Rare detail,
soft brush texture, rusted iron and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.12 Winter Maw

`undead.winterMaw` · Striker · Rare · Countdown 3 · Attack 4 · HP 2 · Speed 1 · Melee · Frost · First Strike · Swarm 1

> It brings enough cold for the whole pack.

Purpose: a fragile anti-melee finisher and Swarm payoff. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A large spectral hound with a second hound behind. |
| Pose | The first hound springs ahead. |
| Props | Broken ornate collar and rusted chain. |
| Gameplay cues | The first leap shows First Strike; the pack shows Swarm. |
| Silhouette hook | Open jaws and icy mane. |
| Humor note | The second hound carries a frozen stick. |
| Setting | A frost-covered barrow field. |

```text
large spectral grave hound springing ahead with pale frost around its jaws, second hound behind carrying a frozen stick, ornate broken collar and short rusted chain, dynamic first leap, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, frost-covered barrow field, pale teal moonlight from the upper left, clear hound silhouette, Rare detail,
soft brush texture, frost and mist, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.13 Lantern Widow

`undead.lanternWidow` · Support · Rare · Countdown 3 · Attack 1 · HP 2 · Speed 1 · Melee · Frost · Summon Restless Wisp

> She always leaves a light on for the late.

Purpose: Frost support that creates a mobile second threat. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | An elegant skeletal widow. |
| Pose | She opens an ornate lantern. |
| Props | Lantern, mourning dress, veil pins and empty tea cup. |
| Gameplay cues | A Restless Wisp leaves the lantern through frost vapor. |
| Silhouette hook | Tall veil and hanging lantern. |
| Humor note | She offers the Wisp tea. |
| Setting | A sunken manor garden. |

```text
elegant skeletal widow in a faded mourning dress opening an ornate lantern, pale teal Restless Wisp floating out through frost vapor, rusted silver veil pins, offering an empty teacup, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, sunken Hollow Marches garden, pale teal moonlight from the upper left, tall veil-and-lantern silhouette, Rare detail,
soft brush texture, old cloth and rusted silver, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 5.14 Sir Odo, the Last Taxman (draft)

`undead.sirOdoLastTaxman` · Striker · Epic · Countdown 4 · Attack 6 · HP 5 · Speed 2 · Melee · Physical · Unique · Rebirth

> Death excuses neither payment nor the late fee.

Purpose: the named Undead Epic and persistent finisher. Rebirth brings him back at 1 HP. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A tall skeletal tax knight with a false mustache. |
| Pose | He charges down ruined court steps. |
| Props | Quill lance, ledger shield, Coin chain and ornate plate. |
| Gameplay cues | A spectral second Odo shows Rebirth. |
| Silhouette hook | Quill lance and square shield. |
| Humor note | He offers a receipt during the charge. |
| Setting | A collapsed toll court. |

```text
Sir Odo the skeletal tax knight charging down ruined courthouse steps, severe false mustache fixed to his helmet, quill-shaped lance, square ledger shield with blank pages, ornate rusted plate and coin chain, spectral second form rising, offering a blank receipt, friendly macabre humor,
Undead of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, dramatic Hollow Marches fog, pale teal moonlight from the upper left, heroic silhouette, rich Epic detail,
soft brush texture, rusted iron and old cloth, simple low-contrast background,
portrait 3:4 composition, no gore, no readable text, no frame
```

### 5.15 Bone Rampart

`undead.boneRampart` · Wall · Epic · Countdown 3 · Attack 0 · HP 10 · Speed 0 · Melee · Physical · Wall · Armor 2 · Rebirth

> Please use the other Lane.

Purpose: the archetypal Undead Epic and persistent Swarm shield. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A towering barricade with orderly skeleton workers. |
| Pose | It fills a flooded causeway. |
| Props | Rusted shields, coffin planks, chains and teal pennants. |
| Gameplay cues | A spectral rebuilt outline shows Rebirth. |
| Silhouette hook | Massive stepped wall. |
| Humor note | A blank arrow sign points around it. |
| Setting | A narrow flooded causeway. |

```text
towering undead rampart made from interlocked rusted shields, coffin planks and chains, orderly skeleton workers repairing the top, pale teal pennants, spectral rebuilt outline behind it, blank arrow sign pointing around the wall, friendly macabre humor,
Undead fortification of Heynbord, blocking face to the right, centered,
painterly storybook fantasy card illustration, flooded Hollow Marches causeway, pale teal moonlight from the upper left, massive stepped silhouette, rich Epic detail,
soft brush texture, rusted iron and old wood, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

## 6. Goblin Creature Cards

Identity: goblins of the hill mines. Tinkers, thieves and bomb makers. Small, clever and greedy. They make the enemy plan slower with Sabotage, traps (Hobble) and bombs (Last Breath and Fire). All values in this section are **provisional**.

### 6.1 Ankle Snatcher

`goblin.ankleSnatcher` · Runner · Common · Countdown 1 · Attack 2 · HP 2 · Speed 2 · Melee · Physical · Hobble 1

> Ankles are the easiest part of a knight to reach.

Purpose: a cheap fast trap that slows the first enemy Runner. Power 11, budget 11, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A small goblin girl with a long hook. |
| Pose | She runs low and hooks forward at ankle height. |
| Props | A hook made from a bent pipe, a coil of rope, patched goggles on her forehead. |
| Gameplay cues | The hook at ankle height shows Hobble. The long stride shows Speed 2. |
| Silhouette hook | The long hook and the big ears. |
| Humor note | One boot already hangs from the hook. |
| Setting | A narrow mine tunnel mouth with lanterns. |

```text
small eager goblin girl running low and hooking forward at ankle height with a long bent-pipe hook, a single caught boot hanging from the hook, coil of rope, patched goggles on her forehead, big ears,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, narrow hill mine tunnel mouth with lanterns, warm lantern light from the upper left, long clear silhouette, plain Common detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.2 Fuse Runner

`goblin.fuseRunner` · Runner · Common · Countdown 1 · Attack 1 · HP 2 · Speed 2 · Melee · Physical · Last Breath 3

> The fuse is long. The plan is short.

Purpose: a one-Countdown bomb. Last Breath 3 hits the nearest enemy Unit ahead when it leaves. Power 11, budget 11, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A skinny goblin man with a round bomb that is bigger than his head. |
| Pose | He runs forward on his toes, with the bomb in both arms. |
| Props | A round black bomb with a short lit fuse, soot on his face, a long scarf. |
| Gameplay cues | The lit fuse shows Last Breath. |
| Silhouette hook | The round bomb and the thin legs. |
| Humor note | He looks at the fuse, not where he runs. |
| Setting | A dusty mine rail track. |

```text
skinny goblin man running forward on his toes, hugging a round black bomb bigger than his head with a short lit fuse, soot on his face, long scarf streaming, eyes fixed on the fuse instead of the road,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, dusty hill mine rail track, warm lantern light from the upper left, round clear silhouette, plain Common detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.3 Junk Slinger

`goblin.junkSlinger` · Shooter · Common · Countdown 2 · Attack 3 · HP 3 · Speed 1 · Range 3 · Physical · Hobble 1

> One goblin's junk is another knight's limp.

Purpose: a cheap Shooter that slows the Unit it hits. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | An old goblin woman with a big sling. |
| Pose | She swings the sling above her head. |
| Props | A sling, a bag of bent nails, bolts and spoons, a patched apron. |
| Gameplay cues | A small trap spring in the bag shows Hobble. The sling shows Range. |
| Silhouette hook | The circle of the sling. |
| Humor note | One of her "stones" is her own false tooth. |
| Setting | A junk heap outside a mine. |

```text
old goblin woman swinging a sling above her head, bag of bent nails, bolts and spoons with a small trap spring on top, patched apron, a false tooth flying out with the junk, determined grin,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, junk heap outside a hill mine, warm lantern light from the upper left, clear circular sling silhouette, plain Common detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.4 Tunnel Saboteur

`goblin.tunnelSaboteur` · Support · Common · Countdown 2 · Attack 2 · HP 5 · Speed 1 · Melee · Physical · Sabotage 1

> He does not fight your army. He fights your schedule.

Purpose: the first Sabotage card. When it comes from its Card, the enemy card with the lowest Countdown gets +1 Countdown. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A round goblin man in a miner's helmet that is too big. |
| Pose | He climbs up out of a hole in the road. |
| Props | Big pliers, a cut rope, an hourglass that he turns upside down. |
| Gameplay cues | The hourglass shows Sabotage: the enemy card comes later. |
| Silhouette hook | The helmet lamp and the pliers. |
| Humor note | He winks while he turns the hourglass. |
| Setting | A fresh hole in a battlefield road. |

```text
round goblin man in a miner's helmet too big for him, climbing up out of a fresh hole in a road, big pliers in one hand, turning an hourglass upside down with the other, cut rope over his shoulder, sly wink,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, road near a hill mine, warm lantern light from the upper left, clear silhouette with helmet lamp, plain Common detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.5 Scrap-Plate Guard

`goblin.scrapPlateGuard` · Frontliner · Common · Countdown 2 · Attack 2 · HP 6 · Speed 1 · Melee · Physical · Armor 1

> Armor is armor. Even if it was a stove.

Purpose: a cheap Goblin Lane anchor. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A stocky goblin woman in armor made from stove plates. |
| Pose | She braces behind a shield made from a cart wheel. |
| Props | A cart-wheel shield, a stove door on her chest, a short pick. |
| Gameplay cues | The stove plates show Armor. |
| Silhouette hook | The round wheel shield and a stove pipe on her helmet. |
| Humor note | A small kettle still steams on her shoulder plate. |
| Setting | A mine yard. |

```text
stocky goblin woman bracing behind a shield made from a wooden cart wheel, armor made from iron stove plates with a stove door on her chest, stove pipe on her helmet, short pick, small kettle steaming on her shoulder plate,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, hill mine yard, warm lantern light from the upper left, round sturdy silhouette, plain Common detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.6 Sidestep Shiv

`goblin.sidestepShiv` · Striker · Uncommon · Countdown 2 · Attack 3 · HP 3 · Speed 2 · Melee · Physical · Pivot

> Front door? Never heard of it.

Purpose: the Goblin Pivot Unit. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A thin goblin man with two small knives. |
| Pose | His chest and lead foot point right. He looks back over his shoulder, with one knife ready behind him. |
| Props | Two small knives, a dark hood, a belt with many pockets and one brass buckle. |
| Gameplay cues | Pivot: the face looks back. The chest still points right. |
| Silhouette hook | The long nose and the knives out to the sides. |
| Humor note | One pocket is full of other people's spoons. |
| Setting | Between mine carts in a tunnel. |

```text
thin goblin man, chest and lead foot pointing right, looking back over his shoulder, small knife ready behind him and another out to the side, dark hood, belt with many pockets and one brass buckle, a pocket full of stolen spoons, long nose, sly grin,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, between mine carts in a hill mine tunnel, warm lantern light from the upper left, sharp angular silhouette, Uncommon detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.7 Junk Barricade

`goblin.junkBarricade` · Wall · Uncommon · Countdown 2 · Attack 0 · HP 12 · Speed 0 · Melee · Physical · Wall · Sabotage 1

> Built in one night. Paid for by nobody.

Purpose: the Goblin Wall. It also delays an enemy card when it comes in. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A tall barricade of junk: carts, barrels, pots and an old door. |
| Pose | It fills a mine road. A goblin on top pulls a long rope. |
| Props | Barrels, a broken mine cart, ropes, a pointing-hand sign with no letters. |
| Gameplay cues | The rope runs off the image to the enemy side and pulls something away: Sabotage. |
| Silhouette hook | A heap with a pointed top. |
| Humor note | The sign shows a hand that says "stop", and the hand is upside down. |
| Setting | A mine road. |

```text
tall goblin barricade made from barrels, a broken mine cart, pots and an old door, a small goblin on top pulling a long rope that runs off to the right, upside-down pointing-hand sign with no letters,
Goblin fortification of Heynbord, blocking face to the right, centered,
painterly storybook fantasy card illustration, hill mine road, warm lantern light from the upper left, pointed heap silhouette, Uncommon detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.8 Bomb Lobber

`goblin.bombLobber` · Shooter · Uncommon · Countdown 3 · Attack 4 · HP 4 · Speed 1 · Range 3 · Fire

> Catch!

Purpose: a ranged Fire Shooter that Burns its target. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | A broad goblin woman with a big wooden ladle. |
| Pose | She throws a lit bomb forward with the ladle. |
| Props | The ladle, a basket of small round bombs, smoked goggles. |
| Gameplay cues | The lit bombs show Fire. The high arc shows Range. |
| Silhouette hook | The long ladle. |
| Humor note | She covers one ear with her free hand. |
| Setting | A rocky slope above a mine. |

```text
broad goblin woman throwing a small lit bomb forward with a big wooden ladle, basket of round bombs at her hip, smoked goggles, covering one ear with her free hand, bomb flying in a high arc with a spark trail,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, rocky slope above a hill mine, warm lantern light from the upper left, long ladle silhouette, Uncommon detail,
soft brush texture, soot grey, brass and acid green palette with orange-red fire accents, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.9 Grease Trapper

`goblin.greaseTrapper` · Support · Uncommon · Countdown 3 · Attack 3 · HP 6 · Speed 1 · Melee · Physical · Hobble 2 · Sabotage 1

> Mind the floor.

Purpose: slows a Unit for 2 End Steps, and delays an enemy card when it comes in. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | A short goblin man with a grease bucket and a big spring trap. |
| Pose | He spreads grease on the ground with a mop. |
| Props | A bucket of black grease, a mop, a big spring trap with no teeth on his back, a small hourglass on his belt. |
| Gameplay cues | The trap and the grease show Hobble. The hourglass shows Sabotage. |
| Silhouette hook | The mop and the round trap on his back. |
| Humor note | He slips a little on his own grease. |
| Setting | A mine tunnel floor. |

```text
short goblin man spreading black grease on the ground with a mop, bucket of grease, big round toothless spring trap on his back, small hourglass on his belt, slipping a little on his own grease with a surprised face,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, hill mine tunnel floor, warm lantern light from the upper left, clear silhouette with mop and round trap, Uncommon detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.10 Rocket Barrel Rider

`goblin.rocketBarrelRider` · Runner · Uncommon · Countdown 3 · Attack 3 · HP 4 · Speed 3 · Melee · Fire · Last Breath 2

> Steering is a later invention.

Purpose: the fastest Goblin Runner. Its Fire hits Burn, and Last Breath 2 hits when it falls. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A young goblin woman who rides a barrel with a rocket on the back. |
| Pose | She flies low and forward on the barrel and holds on with both hands. |
| Props | A powder barrel, a flame out of the back, a leather cap with goggles, a scarf. |
| Gameplay cues | The flame trail shows Speed 3 and Fire. The powder barrel shows Last Breath. |
| Silhouette hook | The barrel and the long flame trail. |
| Humor note | Her eyes are shut tight. |
| Setting | A mine rail track that goes down a slope. |

```text
young goblin woman riding a powder barrel with a rocket flame out of the back, flying low and forward, holding on with both hands, leather cap with goggles, scarf streaming, eyes shut tight,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, hill mine rail track going down a slope, warm lantern light from the upper left, long horizontal silhouette with flame trail, Uncommon detail,
soft brush texture, soot grey, brass and acid green palette with orange-red fire accents, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.11 Mine Sapper

`goblin.mineSapper` · Striker · Rare · Countdown 4 · Attack 5 · HP 6 · Speed 2 · Melee · Fire · Last Breath 3

> Every wall has a weak spot. I bring my own.

Purpose: a Fire Striker that hits hard and explodes when it falls. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A strong goblin man with a big pick and powder kegs on his back. |
| Pose | He swings the pick forward. |
| Props | A long pick with brass trim, a back frame of small powder kegs, a lit pipe. |
| Gameplay cues | The kegs show Last Breath. The glowing pick head shows Fire. |
| Silhouette hook | The pick and the stack of kegs. |
| Humor note | He lights his pipe with one of the fuses. |
| Setting | A deep mine face with brass lanterns. |

```text
strong goblin man swinging a long pick with brass trim and a glowing hot head, back frame stacked with small powder kegs, lighting his pipe with one of the fuses, ornate leather and brass gear,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, deep hill mine face with brass lanterns, warm lantern light from the upper left, strong silhouette with pick and kegs, ornate Rare detail,
soft brush texture, soot grey, brass and acid green palette with orange-red fire accents, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.12 Spyglass Sniper

`goblin.spyglassSniper` · Shooter · Rare · Countdown 4 · Attack 4 · HP 7 · Speed 1 · Range 4 · Physical · Sabotage 1

> I see your plans. I do not like them.

Purpose: a long-range Shooter that delays an enemy card. Power 25, budget 26, deviation -3.8%.

| Field | Brief |
| --- | --- |
| Subject | An old goblin woman with a long crossbow. |
| Pose | She aims, with one eye at a brass spyglass on the crossbow. |
| Props | A long crossbow with a brass spyglass, a notebook full of drawings with no letters, goggles with many lenses. |
| Gameplay cues | The spyglass shows Range 4. The notebook of stolen plans shows Sabotage. |
| Silhouette hook | The long crossbow and the spyglass. |
| Humor note | A small bird sits on the end of the crossbow. |
| Setting | A high rock above the mine entrance. |

```text
old goblin woman aiming a long crossbow with a brass spyglass mounted on top, goggles with many lenses, notebook of drawings with no letters at her belt, small bird perched on the end of the crossbow, ornate brass fittings,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, high rock above a hill mine entrance, warm lantern light from the upper left, long horizontal silhouette, ornate Rare detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.13 Junk Walker

`goblin.junkWalker` · Frontliner · Rare · Countdown 4 · Attack 4 · HP 10 · Speed 1 · Melee · Physical · Armor 2

> It walks. Mostly forward.

Purpose: the Goblin Lane anchor with Armor 2. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A goblin woman who drives a walking machine made from boiler plates. |
| Pose | The machine takes a heavy step forward with a big claw arm. |
| Props | A round boiler body, pipe legs, a claw arm, an open seat with levers, brass gauges and rivets. |
| Gameplay cues | The thick plates show Armor 2. |
| Silhouette hook | The round boiler and the two pipe legs. |
| Humor note | A second goblin runs behind with an oil can. |
| Setting | A mine yard with a crane. |

```text
goblin woman driving a walking machine made from riveted boiler plates, round boiler body on two pipe legs, big claw arm, open seat with levers, brass gauges, a second small goblin running behind with an oil can,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, hill mine yard with a wooden crane, warm lantern light from the upper left, round heavy silhouette, ornate Rare detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.14 Grand Gearjammer

`goblin.grandGearjammer` · Support · Epic · Countdown 4 · Attack 3 · HP 8 · Speed 1 · Range 3 · Physical · Sabotage 2

> Every plan has gears. We have more.

Purpose: the archetypal Goblin Epic. Sabotage 2 makes the enemy's next card 2 Turns later. Power 27, budget 26, deviation +3.8%.

| Field | Brief |
| --- | --- |
| Subject | A big goblin war cart with a gear cannon and a crew of three goblins. |
| Pose | The cart rolls forward, and the cannon shoots gears and springs. |
| Props | A cart with large brass gears, a gear cannon, levers, three goblins at work. |
| Gameplay cues | Flying gears and broken clocks show Sabotage. The cannon shows Range. |
| Silhouette hook | The big gear on top of the cart. |
| Humor note | One goblin loads the cannon with an alarm clock. |
| Setting | The main mine hall with chains and lanterns. |

```text
big goblin war cart rolling forward, gear cannon firing brass gears, springs and broken clocks, three goblin crew pulling levers, one loading the cannon with an alarm clock, large brass gear on top, heroic dramatic composition,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, main hill mine hall with chains and lanterns, warm lantern light from the upper left, bold silhouette with big gear, rich Epic detail,
soft brush texture, soot grey, brass and acid green palette, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 6.15 Boss Snikkit, the Mine King (draft)

`goblin.bossSnikkit` · Striker · Epic · Countdown 5 · Attack 5 · HP 8 · Speed 2 · Melee · Fire · Unique · Sabotage 1 · Last Breath 3

> "Everything down here is mine. That is the joke. Laugh."

Purpose: the named Goblin Epic. He delays an enemy card when he comes in, Burns what he hits, and explodes when he falls. Power 32, budget 31, deviation +3.2%.

| Field | Brief |
| --- | --- |
| Subject | Boss Snikkit, the mine king: a small old goblin man with a large crown made from a bucket. |
| Pose | He rides a mine cart full of bombs down the rails and points forward with his scepter. |
| Props | A mine-cart throne, a bucket crown with glass gems, a scepter that is a lit torch, a pile of bombs, a stolen hourglass on a chain. |
| Gameplay cues | The torch shows Fire. The bombs show Last Breath. The hourglass shows Sabotage. Epic: a heroic scene with cheering goblins. |
| Silhouette hook | The tall bucket crown and the cart. |
| Humor note | The crown is too big and falls over one eye. |
| Setting | A mine rail in the main hall, with cheering goblins. |

```text
Boss Snikkit the goblin mine king, small old goblin man with a large bucket crown set with glass gems slipping over one eye, riding a mine cart throne full of bombs down the rails, pointing forward with a lit torch scepter, stolen hourglass on a chain, cheering goblins behind, heroic dramatic composition,
Goblin of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, rail in the main hill mine hall, warm lantern light from the upper left, heroic silhouette with tall crown, rich Epic detail,
soft brush texture, soot grey, brass and acid green palette with orange-red fire accents, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

## 7. Feral Creature Cards

Identity: wild creatures of the peaks and the deep caves. They serve no people. Under the Accord, a wild creature that comes onto a marked lane field fights for the Hero who called it, for that one Battle. They are few, huge and slow: high Countdown, high Attack and HP. They Trample, regenerate and bring the cold. All values in this section are **provisional**.

Feral cards have no Countdown 1. Commons are Countdown 2 to 3, Uncommons 3 to 4, Rares 4 to 5 and Epics 6. A Feral figure wears no armor and carries no tools of a people. The art can show the lure that called it: bait, a horn or a torch.

### 7.1 Bristleback Boar

`feral.bristlebackBoar` · Runner · Common · Countdown 2 · Attack 3 · HP 3 · Speed 2 · Melee · Physical · Trample

> It does not go around things.

Purpose: the only Feral Runner. Trample lets a kill also hit the Unit behind. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A wild mountain boar with a ridge of stiff bristles. |
| Pose | It charges forward with its head down. |
| Props | Boards of a broken fence fly around it. |
| Gameplay cues | The broken fence shows Trample. The dust shows Speed 2. |
| Silhouette hook | The bristle ridge and the low head. |
| Humor note | An apple, the bait that called it, is stuck on one tusk. |
| Setting | A rocky mountain path. |

```text
wild mountain boar with a ridge of stiff bristles charging forward head down, boards of a broken fence flying around it, an apple stuck on one tusk, dust behind it,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, rocky mountain path, cool light from the upper left, low clear silhouette, plain Common detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.2 Crag Lizard

`feral.cragLizard` · Frontliner · Common · Countdown 2 · Attack 2 · HP 7 · Speed 1 · Melee · Physical · Armor 1

> It sat on this rock for a hundred years. Now it is your rock.

Purpose: a cheap Feral blocker with Armor. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A large grey lizard with plates like rock. |
| Pose | It walks forward low, with its mouth open in a hiss. |
| Props | None. Snow on its back plates. |
| Gameplay cues | The rock plates show Armor. |
| Silhouette hook | The low wide body and the plated back. |
| Humor note | A small bird sits on its back, and the lizard does not know. |
| Setting | Grey cliffs with patches of snow. |

```text
large stone-grey lizard with rock-like back plates walking forward low, mouth open in a hiss, snow on its plates, small bird sitting on its back unnoticed,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, grey cliffs with patches of snow, cool light from the upper left, low wide silhouette, plain Common detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.3 Frostfang Lynx

`feral.frostfangLynx` · Striker · Common · Countdown 2 · Attack 4 · HP 3 · Speed 1 · Melee · Frost · Bleed 1

> You will not hear it. You will feel the cold first.

Purpose: a cheap Frost Striker that Freezes its target and makes it Bleeding, so that a healer or a Regeneration Unit heals less. Bleed is 1 up to Rare, 2 at Epic and 3 at Legendary ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A white mountain lynx with long ear tufts and ice-blue fangs. |
| Pose | It jumps forward with its claws out. |
| Props | None. Frost breath and frosty claws. |
| Gameplay cues | The frost on its claws and breath shows Frost. The long claws show Bleed. |
| Silhouette hook | The ear tufts and the long jump. |
| Humor note | A lump of snow sits on its head after a jump through a snowbank. |
| Setting | A snowy ledge. |

```text
white mountain lynx with long ear tufts and ice-blue fangs leaping forward with claws out, frosty breath and frost on its claws, a lump of snow on its head,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, snowy mountain ledge, cool light from the upper left, long leaping silhouette, plain Common detail,
soft brush texture, slate violet and ice white palette with light blue frost accents, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.4 Cave Bear

`feral.caveBear` · Frontliner · Common · Countdown 3 · Attack 3 · HP 10 · Speed 1 · Melee · Physical · Regeneration 1

> It woke up hungry. It is still waking up.

Purpose: a durable Feral front that heals 1 HP in each Start Step. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | A huge brown cave bear with sleepy eyes. |
| Pose | It walks forward on all fours out of a cave, half in a yawn. |
| Props | A honeycomb in its mouth: the bait. |
| Gameplay cues | Moss and old healed scars show Regeneration. |
| Silhouette hook | The big shoulder hump and the round head. |
| Humor note | It still has not opened both eyes. |
| Setting | A cave mouth with frost. |

```text
huge brown cave bear with sleepy half-open eyes walking forward on all fours out of a cave, half yawning around a honeycomb in its mouth, moss and old healed scars on its fur,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, frosty cave mouth, cool light from the upper left, big humped silhouette, plain Common detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.5 Web Spitter

`feral.webSpitter` · Shooter · Common · Countdown 3 · Attack 3 · HP 8 · Speed 1 · Range 2 · Physical · Entangle

> Stay for dinner.

Purpose: a short-range Shooter that Entangles. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | A giant cave spider, round and furry, with many shiny eyes. Friendly cartoon shapes, not scary. |
| Pose | It spits a sticky web line forward. |
| Props | Web lines. A helmet that it caught hangs in a web. |
| Gameplay cues | The web shows Entangle. The spit line shows Range. |
| Silhouette hook | The round body and the long arched legs. |
| Humor note | It looks proud of the caught helmet. |
| Setting | A dark cave with blue crystals. |

```text
giant round furry cave spider with many shiny friendly eyes spitting a sticky web line forward, a caught helmet hanging in a web behind it, looking proud, friendly cartoon shapes, not scary,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, dark cave with blue crystals, cool light from the upper left, round body with arched legs silhouette, plain Common detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.6 Boulder Tortoise

`feral.boulderTortoise` · Wall · Uncommon · Countdown 3 · Attack 0 · HP 14 · Speed 0 · Melee · Physical · Wall · Armor 1 · Regeneration 2

> It moves for nobody. It hardly moves for itself.

Purpose: the Feral Wall. It heals 2 HP in each Start Step. Power 21, budget 21, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A giant mountain tortoise with a shell like a boulder. |
| Pose | It sleeps across a mountain pass. |
| Props | Moss and small trees on the shell. |
| Gameplay cues | The stone shell shows Armor. New moss that grows over cracks shows Regeneration. |
| Silhouette hook | A dome. |
| Humor note | A mountain goat stands on top of it. |
| Setting | A narrow mountain pass. |

```text
giant mountain tortoise asleep across a narrow pass, boulder-like stone shell covered with moss and small trees, fresh moss growing over cracks, a mountain goat standing on top,
Feral fortification of Heynbord, blocking face to the right, centered,
painterly storybook fantasy card illustration, narrow mountain pass, cool light from the upper left, massive dome silhouette, Uncommon detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.7 Tailsweep Basilisk

`feral.tailsweepBasilisk` · Striker · Uncommon · Countdown 3 · Attack 4 · HP 7 · Speed 1 · Melee · Physical · Pivot

> Look it in the eye? It looks at your ankles.

Purpose: the Feral Pivot Unit. Its tail hits Units behind it and next to it. Power 20, budget 21, deviation -4.8%.

| Field | Brief |
| --- | --- |
| Subject | A long, low basilisk with a heavy club tail. |
| Pose | Its body advances to the right. Its tail swings back. |
| Props | None. Rocks fly from the tail swing. |
| Gameplay cues | Pivot: the tail swing goes behind and to the side. |
| Silhouette hook | The long S-shaped body and the club tail. |
| Humor note | It looks bored while the rocks fly. |
| Setting | A cave floor with crystals. |

```text
long low basilisk lizard advancing to the right, heavy club tail swinging backward, rocks flying from the swing, bored half-lidded eyes, S-shaped body,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, cave floor with crystals, cool light from the upper left, S-shaped silhouette with club tail, Uncommon detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.8 Cave Troll

`feral.caveTroll` · Frontliner · Uncommon · Countdown 4 · Attack 4 · HP 12 · Speed 1 · Melee · Physical · Regeneration 2

> Cut it. Wait. Cut it again.

Purpose: a durable Feral front that heals 2 HP in each Start Step. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A large grey cave troll with long arms and a small head. It is wild: no armor and no tribe marks. |
| Pose | It walks forward on its knuckles, with a stalactite as a club. |
| Props | A broken stalactite. |
| Gameplay cues | A cut on its arm that closes shows Regeneration. |
| Silhouette hook | The long arms and the bent back. |
| Humor note | It chews on a lost shield. |
| Setting | A damp cave. |

```text
large grey wild cave troll with long arms and a small head walking forward on its knuckles, a broken stalactite used as a club, a cut on its arm closing up, chewing on a lost shield, no armor and no tribe marks,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, damp cave, cool light from the upper left, hunched long-armed silhouette, Uncommon detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.9 Crag Rhino

`feral.cragRhino` · Striker · Uncommon · Countdown 4 · Attack 5 · HP 10 · Speed 1 · Melee · Physical · Trample

> The road ends where it stops.

Purpose: a heavy Trample Striker. Power 25, budget 26, deviation -3.8%.

| Field | Brief |
| --- | --- |
| Subject | A woolly mountain rhino with a stone-grey horn. |
| Pose | It charges forward with its head low. |
| Props | One broken shield on its horn, and a second shield that flies behind it. |
| Gameplay cues | The two shields show Trample. |
| Silhouette hook | The big horn. |
| Humor note | An empty helmet spins in the air. |
| Setting | A high stony plain. |

```text
woolly mountain rhino with a stone-grey horn charging forward head low, one broken shield stuck on its horn and a second shield flying behind it, empty helmet spinning in the air,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, high stony plain, cool light from the upper left, heavy horned silhouette, Uncommon detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.10 Frost Elk Matriarch

`feral.frostElkMatriarch` · Support · Uncommon · Countdown 4 · Attack 3 · HP 11 · Speed 1 · Melee · Frost · Rally 1

> Where she walks, the herd follows.

Purpose: the Feral Support. Rally 1 gives the other friendly Units in her Lane +1 Attack. Her Frost hits Freeze. Power 25, budget 26, deviation -3.8%.

| Field | Brief |
| --- | --- |
| Subject | A tall old elk cow with antlers of ice. |
| Pose | She walks forward with her head high and calls. |
| Props | None. Breath mist from the call. |
| Gameplay cues | The call shows Rally. The ice antlers show Frost. |
| Silhouette hook | The wide ice antlers. |
| Humor note | Two young elk copy her pose behind her. |
| Setting | A frozen meadow. |

```text
tall old elk cow with wide antlers of ice walking forward with her head high, calling with a cloud of breath mist, two young elk copying her pose behind her,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, frozen mountain meadow, cool light from the upper left, wide antler silhouette, Uncommon detail,
soft brush texture, slate violet and ice white palette with light blue frost accents, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.11 Avalanche Yeti

`feral.avalancheYeti` · Striker · Rare · Countdown 4 · Attack 6 · HP 9 · Speed 1 · Melee · Physical · Trample

> It came down with the snow. The snow was the smaller problem.

Purpose: a Rare Trample Striker with high Attack. Power 26, budget 26, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A big white yeti with long fur. |
| Pose | It charges forward through a wall of snow, with its arms wide. |
| Props | Ice crystals in its fur, a stolen scarf. |
| Gameplay cues | Snow and shields thrown to the sides show Trample. |
| Silhouette hook | The huge shoulders and the wide arms. |
| Humor note | The stolen scarf is much too small for it. |
| Setting | A snowy slope with an avalanche behind it. |

```text
big white yeti with long fur charging forward through a wall of snow with arms wide, shields thrown to the sides, ice crystals glittering in its fur, a stolen scarf much too small for it,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, snowy slope with an avalanche behind, cool light from the upper left, huge broad-shouldered silhouette, ornate Rare detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.12 Woolly Mammoth

`feral.woollyMammoth` · Frontliner · Rare · Countdown 5 · Attack 5 · HP 14 · Speed 1 · Melee · Physical · Armor 1 · Trample

> It does not stop. Plan around it.

Purpose: a Rare front that also Tramples. Power 32, budget 31, deviation +3.2%.

| Field | Brief |
| --- | --- |
| Subject | A woolly mammoth with long curved tusks. |
| Pose | It walks forward with heavy steps, with its tusks low. |
| Props | A fence that broke over its tusks. |
| Gameplay cues | Thick matted fur with ice shows Armor. The broken fence shows Trample. |
| Silhouette hook | The high dome head and the long tusks. |
| Humor note | A bird's nest sits in its fur. |
| Setting | A glacier valley. |

```text
woolly mammoth with long curved tusks walking forward with heavy steps, tusks low, a broken wooden fence draped over the tusks, thick matted fur with ice, a bird's nest in its fur,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, glacier valley, cool light from the upper left, high domed silhouette with long tusks, ornate Rare detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.13 Rimebreath Drake

`feral.rimebreathDrake` · Shooter · Rare · Countdown 5 · Attack 5 · HP 9 · Speed 1 · Range 3 · Frost · Flying

> Its breath is the weather.

Purpose: a Flying Frost Shooter. Power 31, budget 31, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A slim young ice drake with wide wings. |
| Pose | It flies forward and breathes a cone of frost. |
| Props | None. Icicles on its nose. |
| Gameplay cues | The wings show Flying. The frost breath shows Frost and Range. |
| Silhouette hook | The wide wings and the long neck. |
| Humor note | Its own breath froze an icicle onto its nose. |
| Setting | High cliffs above the clouds. |

```text
slim young ice drake with wide wings flying forward and breathing a cone of frost, an icicle frozen onto its own nose, long neck, frost crystals in the air,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, high cliffs above the clouds, cool light from the upper left, wide-winged silhouette, ornate Rare detail,
soft brush texture, slate violet and ice white palette with light blue frost accents, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.14 Mountain Colossus

`feral.mountainColossus` · Frontliner · Epic · Countdown 6 · Attack 6 · HP 16 · Speed 1 · Melee · Physical · Regeneration 2 · Trample

> The mountain stood up. Then it walked.

Purpose: the archetypal Feral Epic: a huge front that heals and Tramples. Power 37, budget 36, deviation +2.8%.

| Field | Brief |
| --- | --- |
| Subject | A wild, old giant of living rock and moss. No clothes and no tools. |
| Pose | It takes a huge step forward, with one fist down. |
| Props | Rubble that flies from its step. |
| Gameplay cues | New stone that grows over cracks shows Regeneration. The rubble shows Trample. Epic: a heroic scene under storm clouds. |
| Silhouette hook | The huge shoulders and the small head. |
| Humor note | A small village of birds lives on its shoulder. |
| Setting | A mountain pass under storm clouds. |

```text
wild old giant of living rock and moss taking a huge step forward with one fist down, rubble flying, new stone growing over cracks, a small village of bird nests on its shoulder, heroic dramatic composition,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, mountain pass under storm clouds, cool light from the upper left, massive silhouette with huge shoulders and small head, rich Epic detail,
soft brush texture, slate violet and ice white palette, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 7.15 Old Frostmaw (draft)

`feral.oldFrostmaw` · Striker · Epic · Countdown 6 · Attack 8 · HP 13 · Speed 1 · Melee · Frost · Unique · Trample · Bleed 2

> Every village has a story about it. Every story is too small.

Purpose: the named Feral Epic: a huge Frost Striker that Tramples, and its bite makes the target Bleeding. Bleed is 2 at Epic and 3 at Legendary ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). Its HP went from 14 to 13 to pay for Bleed. Power 39, budget 36, deviation +8.3%.

| Field | Brief |
| --- | --- |
| Subject | Old Frostmaw: a huge, old, white cave wyrm with no wings and a crown of icicles. |
| Pose | It comes out of an ice cave with its jaws open. |
| Props | Broken ice pillars. A very small hunting horn hangs from one tooth. |
| Gameplay cues | The ice breath shows Frost. The broken ice pillars show Trample. The open jaws and the long fangs show Bleed. Epic: a heroic scene. |
| Silhouette hook | The long neck and the icicle crown. |
| Humor note | The horn is the lure that called it. The hunter who blew it is gone. |
| Setting | A great ice cave. |

```text
Old Frostmaw, huge old white cave wyrm with no wings and a crown of icicles, coming out of a great ice cave with jaws open and icy breath, broken ice pillars around it, a very small hunting horn hanging from one tooth, heroic dramatic composition,
Feral of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, great ice cave, cool light from the upper left, long-necked silhouette with icicle crown, rich Epic detail,
soft brush texture, slate violet and ice white palette with light blue frost accents, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

## 8. Tokens

Tokens are not collectible Cards. They use the Rank of the Card or effect that makes them, and disappear when they die. Their Rank profiles and power values are **provisional**.

### 8.1 Skeleton

`token.skeleton` · Melee · Physical · Swarm 1

| Rank | Attack | HP | Speed | Power |
| --- | ---: | ---: | ---: | ---: |
| Common | 1 | 1 | 1 | 7 |
| Uncommon | 1 | 2 | 1 | 8 |
| Rare | 2 | 2 | 1 | 10 |
| Epic | 2 | 3 | 2 | 13 |
| Legendary | 3 | 4 | 2 | 16 |

Purpose: cheap Lane mass that is weak alone.

```text
small eager Skeleton soldier with a bucket helmet covering one eye socket, chipped sword held too high, round wooden lid shield and pale teal neck cloth, chest advancing to the right, glancing back toward an ally for courage, friendly macabre humor,
Undead Token of Heynbord, three-quarter view advancing to the right, full body, centered,
painterly storybook fantasy card illustration, misty grave path, pale teal moonlight from the upper left, simple clear silhouette,
soft brush texture, rusted metal and old wood, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

### 8.2 Restless Wisp

`token.restlessWisp` · Melee · Frost · Flying

| Rank | Attack | HP | Speed | Power |
| --- | ---: | ---: | ---: | ---: |
| Common | 1 | 1 | 1 | 12 |
| Uncommon | 1 | 2 | 1 | 13 |
| Rare | 2 | 2 | 1 | 15 |
| Epic | 2 | 3 | 2 | 18 |
| Legendary | 3 | 4 | 2 | 21 |

Purpose: a mobile Frost Token.

```text
small teardrop-shaped pale teal Restless Wisp with a friendly skull-like face, floating above marsh water while dragging a tiny rusted helmet on a short chain, icy trail and frost motes, friendly macabre humor,
Undead Token of Heynbord, three-quarter view advancing to the right, centered,
painterly storybook fantasy card illustration, misty Hollow Marches, pale teal moonlight from the upper left, clear luminous silhouette,
soft brush texture, frost and rusted metal, simple low-contrast background,
portrait 3:4 composition, no gore, no text, no frame
```

## 9. Warrior Skill Cards

Identity: buffs and tempo. Physical, so the palette is neutral steel and leather.

### 9.1 War Drums

`warrior.warDrums` · Warrior · Common · Countdown 2 · No target · The Countdown of 2 random cards in your Hand goes down by 1.

> Boom. Boom. Move faster.

| Field | Brief |
| --- | --- |
| Effect subject | A large war drum. Rings of sound go out from it. |
| Partial figure | Two strong arms in leather bracers hit the drum with sticks. |
| Action | The sticks hit the drum. Two sound rings go out. Two cards in the air near the drum glow and move faster. |
| Setting | A neutral battlefield. Small blurred soldier shapes march quickly to the right in the background. |
| Palette | Neutral steel and leather, warm wood. |

```text
large wooden war drum with sound rings rippling out, two glowing playing cards nearby,
two strong arms in leather bracers striking the drum with sticks, mid-strike,
Heynbord Warrior skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, neutral steel and leather accents,
neutral battlefield with green grass and a lane of grey stone tiles, blurred shapes marching to the right in the background, portrait 3:4 composition, no text, no frame
```

### 9.2 Shield Wall

`warrior.shieldWall` · Warrior · Common · Countdown 2 · A friendly Lane · Friendly Units in a Lane get Armor 1 for the next 2 enemy Turns.

> Lock shields and hold.

| Field | Brief |
| --- | --- |
| Effect subject | A line of plain round shields that lock together along a Lane. |
| Partial figure | A back view of arms and shoulders. The shields face to the right. Plain shields with no emblem. |
| Action | The shields lock together. A soft steel shine runs along the line. |
| Setting | A neutral battlefield. The line goes along a Lane of grey stone tiles. |
| Palette | Neutral steel and leather. |

```text
a long line of plain round steel shields locking together edge to edge, shield faces toward the right, a soft steel shine running along the line,
back view of arms and shoulders holding the shields and facing to the right, no emblems,
Heynbord Warrior skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, neutral steel and leather accents,
neutral battlefield with green grass and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

### 9.3 Spear Throw

`warrior.spearThrow` · Warrior · Uncommon · Countdown 3 · An enemy Unit · Deal 4 Physical damage to an enemy Unit.

> Aim for the loud one.

| Field | Brief |
| --- | --- |
| Effect subject | A spear in flight, with a motion trail. |
| Partial figure | A back view of a thrower who faces to the right. The arm is at the end of the throw. |
| Action | The spear flies to the right, to a far, dark silhouette that shouts with its mouth wide open. |
| Setting | A neutral battlefield. |
| Palette | Neutral steel and leather. Uncommon: a small brass trim on the spear. |

```text
a spear with a brass trim flying to the right with a motion trail toward a distant dark silhouette shouting with its mouth wide open,
back view of a thrower facing to the right, arm fully extended at the end of the throw,
Heynbord Warrior skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, neutral steel and leather accents,
neutral battlefield with green grass and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

## 10. Mage Skill Cards

Identity: area damage. The palette is the Damage Type color.

### 10.1 Fireball

`mage.fireball` · Mage · Common · Countdown 3 · An enemy Unit · Deal 3 Fire damage to an enemy Unit and the next Square behind it.

> A warm welcome.

| Field | Brief |
| --- | --- |
| Effect subject | A large fireball, with a long tail of flame. |
| Partial figure | Two open hands in robe sleeves push the fireball to the right. |
| Action | The fireball flies to the right. Its tail covers two stone tiles of the Lane. |
| Setting | A neutral battlefield. |
| Palette | Orange-red fire, with warm light on the hands. |

```text
large fireball with a long tail of flame flying to the right over two grey stone tiles,
two open hands in robe sleeves pushing the fireball to the right, warm light on the hands,
Heynbord Mage skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, orange-red fire accents,
neutral battlefield with green grass and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

### 10.2 Frost Bolt

`mage.frostBolt` · Mage · Common · Countdown 2 · An enemy Unit · Deal 2 Frost damage to an enemy Unit.

> Stay a while.

| Field | Brief |
| --- | --- |
| Effect subject | A sharp bolt of ice with frost crystals around it. |
| Partial figure | One hand points two fingers to the right. The bolt comes from the fingers. |
| Action | The bolt flies to the right and hits the feet of a far, dark silhouette. Ice holds the feet to the ground. |
| Setting | A neutral battlefield with frost on the grass. |
| Palette | Light blue frost. |

```text
sharp bolt of ice with frost crystals flying to the right, a distant dark silhouette with its feet frozen to the ground,
one hand pointing two fingers to the right with the bolt leaving the fingertips,
Heynbord Mage skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, light blue frost accents,
neutral battlefield with green grass touched by frost and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

### 10.3 Flame Wave

`mage.flameWave` · Mage · Uncommon · Countdown 4 · An enemy Lane · Deal 2 Fire damage to all enemy Units in a Lane.

> The whole lane gets a turn.

| Field | Brief |
| --- | --- |
| Effect subject | A long, low wave of fire that rolls down a full Lane. |
| Partial figure | A back view of a robed silhouette that faces to the right and sweeps a staff. |
| Action | The wave starts at the staff and rolls to the right along all the stone tiles of the Lane. |
| Setting | A neutral battlefield. The Lane is long and goes into the distance. |
| Palette | Orange-red fire. Uncommon: a small gold trim on the staff. |

```text
a long low wave of fire rolling to the right down a full lane of grey stone tiles,
back view of a robed silhouette facing to the right and sweeping a staff with a small gold trim,
Heynbord Mage skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, orange-red fire accents,
neutral battlefield with green grass and a long lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

## 11. When cards change

- When you add a card to `cards.ts`, add its entry here before you make the art.
- When you change a name or flavor text in the Message Catalog, look at the entry here again. The image must still agree with the text.
- When a Keyword or a Damage Type of a card changes, update the gameplay cues and the prompt.
