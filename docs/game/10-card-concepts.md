# 10 — Card Concepts

This document gives the gameplay draft and art brief for each Creature Card and Token in the v1 set, and for each implemented Skill Card. Use it for step 1 of the AI art workflow ([05 — Art and Audio Direction, 5.3](./05-art-direction.md#53-steps-for-each-card)). This document does not keep image prompts. `bun creature:prompts` makes the prompts of Creature Cards and Tokens from the briefs ([05, 5.2](./05-art-direction.md#52-prompts-for-creature-cards)), and `bun skill:prompts` makes the prompts of Skill Cards ([05, 5.2.1](./05-art-direction.md#521-prompts-for-skill-cards)). Implemented values come from `packages/rules/src/content/cards.ts`. Values marked **provisional** are design inputs until the rules package implements and simulates them. When a card exists in `cards.ts` and its line here is **provisional**, `cards.ts` keeps the previous values until that line is implemented. The card names and flavor text move to the `en-US` Message Catalog with implementation. The art must agree with them.

The provisional set is budget-valid and simulation-ready. It is not balance-approved. Balance approval needs the main Matchups and Stage simulations in GDD 13 after implementation.

## 1. Rules for all cards

- **One image for each card.** Rank belongs to one card copy, and the card frame shows it. The image does not change with Rank.
- **Base Rank sets the detail.** Common: plain, worn gear and a simple scene. Uncommon: some trim and one extra detail. Rare: ornate gear with gold or metal trim. Epic: a heroic scene with dramatic composition and more detail. Legendary: a heroic scene with dramatic composition, the most detail and an orange gem. The style and the light do not change.
- **Light.** From the upper left in all images.
- **Facing.** A Creature Card and a Token advance to the right of the image, in a three-quarter view. The chest and the lead foot point right. The face and the weapon may turn. A fortification shows its blocking face to the right. Forward in a pose means this direction. The card art and the Unit cut-out share it. See [ADR-0014](../adr/0014-creature-card-paintings-advance-to-the-right.md). A Skill Card has no Unit. When it shows travel, a throw, or a back view, that travel still goes to the right.
- **Size.** Portrait 3:4 (card art is 600 × 800).
- **Gender.** The flavor text sets the gender of some figures. For the other figures, this document selects a gender, so that the set has a balanced mix.
- **Creature Cards and Tokens** use the prompts of 5.2. They make 2 exports: card art and a Unit cut-out. The silhouette must be clear at 128 px tall.
- **Skill Cards** use the prompts of 5.2.1. They show the effect with a partial figure that has no Race. They have no Unit cut-out.
- **Provisional power.** A Summon or a Last Breath that summons uses 50% of the Token power at the Base Rank of its Card. All provisional Cards must stay within 10% of their Countdown budget.
- **Power Budget `19 + 3 × (Countdown − 3)`** (the same as `10 + 3 × Countdown`). The base was 21 before [ADR-0030](../adr/0030-keywords-set-speed-and-range-and-there-are-no-roles.md): the Base Speed 2 is now free. The Human, Orc, Goblin, Feral, Elf and Undead values are the fit of `packages/rules/scripts/fit-budget.ts` to this budget ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md), [08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). The Undead values use `--hp-per-attack 2`: the fit selects 1 Attack for each 2 HP at the Base Rank, not the shape of the old line. The old Undead shapes (for example 4/3 and 5/3) lost almost all Matchups ([08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). A Token has no budget of its own. Only the cards that summon it have a budget.
- **Common values and Power Points.** The Attack and HP on each line are Common values. The Power on each line measures Attack and HP at the Base Rank of the card, with the Rank scale of GDD 5.3 ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)). Thus an Uncommon, Rare or Epic card has lower Common Attack and HP than a Common card of the same power.

### 1.1 Settings

| Group | Setting | Palette |
| --- | --- | --- |
| Human | A river town: stone bridges, timber houses, blue and gold banners, a calm river | Royal blue and gold. Steel, cloth banners, wood |
| Elf | An ancient green forest: immense roots, canopy bridges, amber sun shafts, moss and quiet pools | Leaf green, amber and pale gold. Living wood, leaves, silver |
| Undead | The Hollow Marches: flooded grave roads, dead willows, ruined courts, barrows and cold mist | Pale teal and moonlit blue. Rusted iron, old cloth, bone |
| Orc | Red badlands: dusty mesas, dry ground, bone and hide totems | Burnt orange and dark red. Leather, fur, rough iron |
| Goblin | The hill mines: cool grey-blue tunnels, rail tracks, junk-heap workshops, brass lanterns and jars of acid-green lamp oil. No red earth and no desert | Soot grey and slate blue, brass and acid green. Patched iron, canvas, brass, junk |
| Feral | The wild peaks and deep caves: cliffs, glaciers, cave mouths and old bones | Slate violet and ice white. Fur, horn, stone and ice |
| Skill Cards | A neutral battlefield: green grass and a Lane of grey stone tiles, with no banners | The Damage Type color (Fire: orange-red, Frost: light blue, Holy: gold-yellow, Lightning: electric cyan with a white core). Physical: neutral steel and leather |

## 2. Human Creature Cards

Identity: proud and stubborn humans and stout folk of the river towns. They love banners and long speeches. They hold the line.

### 2.1 Militia Recruit

`human.militiaRecruit` · Common · Countdown 1 · Attack 3 · HP 8 · Physical · Heavy

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

### 2.2 Shieldbearer

`human.shieldbearer` · Common · Countdown 2 · Attack 1 · HP 9 · Physical · Heavy · Bulwark 1 · Knockback 1 at Common, 2 at Epic, 3 at Legendary

> Her shield has more dents than a tin pot.

| Field | Brief |
| --- | --- |
| Subject | A strong, calm woman soldier with a wide stance. |
| Pose | She crouches a little behind a large round shield, with a short sword low at her side. |
| Props | A large round shield with many dents and a faded blue and gold paint, a short sword, a simple steel cap, a mail shirt. |
| Gameplay cues | The large shield is ready to bash and push. Bulwark 1: the shield is the main shape. Low Attack: the sword is small and low. |
| Silhouette hook | The large round shield that covers most of her body. |
| Humor note | The shield has many visible dents, but she is not worried. |
| Setting | A stone bridge over the river. |

### 2.3 Crossbow Guard

`human.crossbowGuard` · Common · Countdown 2 · Attack 4 · HP 5 · Physical · Long-range

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

### 2.4 Halberdier

`human.halberdier` · Common · Countdown 3 · Attack 4 · HP 6 · Physical · Retaliate

> Touch the banner and you touch the blade.

| Field | Brief |
| --- | --- |
| Subject | A veteran man soldier with a grey mustache and a stern face. |
| Pose | A guard pose. He holds a halberd ready to strike back, and a small banner hangs from the halberd. |
| Props | A halberd with a small blue and gold banner below the blade, a breastplate, a padded coat. |
| Gameplay cues | Retaliate: a ready, defensive pose that says "come closer and I hit back". |
| Silhouette hook | The tall halberd blade with the banner. |
| Humor note | He protects the banner as if it is his child. |
| Setting | A town square with banners. |

### 2.5 Dawn Cleric

`human.dawnCleric` · Uncommon · Countdown 3 · Attack 2 · HP 8 · Holy · Mid-range · Regenerate 1

> She sings at sunrise. Nobody asked her to.

| Field | Brief |
| --- | --- |
| Subject | A cheerful round-faced woman priest. |
| Pose | She sings with her mouth wide open and one arm up. Her other hand holds a staff. |
| Props | A staff with a sun disc on top, white and blue robes with a gold trim, a small hymn book on a cord. |
| Gameplay cues | Holy damage: a soft gold-yellow glow from the sun disc. Regenerate: small gold sparks around her. Uncommon: gold trim on the robe. |
| Silhouette hook | The round sun disc on the staff and the raised arm. |
| Humor note | She sings very loudly. A small bird near her covers its head with a wing. |
| Setting | A riverbank at sunrise. |

### 2.6 River Knight

`human.riverKnight` · Uncommon · Countdown 4 · Attack 4 · HP 6 · Physical · Swift · Charge 1 up to Rare, 2 at Epic, 3 at Legendary

> His horse is braver than he is.

| Field | Brief |
| --- | --- |
| Subject | A young man knight on a big, bold horse. |
| Pose | The horse charges forward with joy. The knight holds the reins tightly and leans back, with wide eyes. His lance still points forward. |
| Props | A lance, a blue and gold horse cloth, light plate armor, a helmet with the visor up. |
| Gameplay cues | Charge and Swift: water splashes and motion. Uncommon: a gold trim on the horse cloth. |
| Silhouette hook | The horse and rider shape with the long lance. |
| Humor note | The horse is brave and happy. The knight is nervous. |
| Setting | A shallow river ford, with water splashing. |

### 2.7 Gate Warden

`human.gateWarden` · Uncommon · Countdown 3 · Attack 3 · HP 8 · Physical · Heavy · Pivot

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

### 2.8 Iron Bulwark

`human.ironBulwark` · Epic · Countdown 6 · Attack 2 · HP 6 · Physical · Heavy · Bulwark 2 · Retaliate

> A wall that complains about the weather.

Purpose: the archetypal Human Epic and strongest defensive Creature Card.

| Field | Brief |
| --- | --- |
| Subject | An old stout-folk man: short, very broad and strong. A grey beard comes out under his helmet. |
| Pose | He stands firm behind a tower shield and frowns up at a small rain cloud. |
| Props | Very heavy full plate with gold trim, a tall tower shield with short spikes, a heavy mace. A small rain cloud rains only on him. |
| Gameplay cues | Bulwark 2: the heaviest armor in the set. Retaliate: spikes on the shield. Epic: a heroic scene with dramatic composition, and the most ornate human armor in the set. |
| Silhouette hook | A wide block shape: the tower shield and the very broad body. |
| Humor note | He is like a wall, but he complains about a small rain cloud. |
| Setting | A stone town wall in light rain. |

### 2.9 Town Barricade

`human.townBarricade` · Common · Countdown 1 · Attack 0 · HP 14 · Physical · Wall

> The passage permit is under the sandbags.

Purpose: a cheap Lane block. Power 14, budget 13, deviation +7.7%.

| Field | Brief |
| --- | --- |
| Subject | A rough timber barricade made by town guards. |
| Pose | It fills a narrow stone Lane. |
| Props | Crossed beams, sandbags, a dented shield, blue cloth and a cooking-pot helmet. |
| Gameplay cues | The broad fixed shape shows Wall. Plain worn parts show Common. |
| Silhouette hook | Crossed beams and the pot helmet. |
| Humor note | Permit papers wait behind the barricade. |
| Setting | A stone bridge in the river town. |

### 2.10 Bridge Pikeman

`human.bridgePikeman` · Uncommon · Countdown 3 · Attack 4 · HP 5 · Physical · Knockback 1, 2 at Epic, 3 at Legendary

> Please enter the queue. The back of the queue.

Purpose: a melee attacker that pushes the enemy off the bridge. Power 19, budget 19, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A focused woman soldier. |
| Pose | A forward thrust. |
| Props | Long pike, mail coat, blue sash and brass shoulder guards. |
| Gameplay cues | The pike pushes the foe back. |
| Silhouette hook | The long low pike line. |
| Humor note | The queue markers behind her are perfectly straight. |
| Setting | A river-town bridge checkpoint. |

### 2.11 Banner Chaplain

`human.bannerChaplain` · Uncommon · Countdown 3 · Attack 2 · HP 8 · Holy · Mid-range · Rally 1

> The sermon ends when morale improves.

Purpose: a low-cost Rally source and Holy attacker. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | A stout, enthusiastic man chaplain. |
| Pose | He raises a banner-staff and gives a forceful speech. |
| Props | Sun-disc banner, white and blue robes, gold trim and a small bell. |
| Gameplay cues | Nearby guards stand taller; gold light leaves the sun disc. |
| Silhouette hook | Tall banner and round sun disc. |
| Humor note | His speech scroll crosses the ground. |
| Setting | A river-town square. |

### 2.12 King's Courier

`human.kingsCourier` · Rare · Countdown 4 · Attack 2 · HP 6 · Physical · Fleet · Charge 1 up to Rare, 2 at Epic, 3 at Legendary

> The message says urgent. She was already running.

Purpose: maximum Human Speed with less Attack than River Knight. Power 20, budget 22, deviation -9.1%.

| Field | Brief |
| --- | --- |
| Subject | A lean woman royal courier. |
| Pose | She sprints across a bridge with one foot in the air. |
| Props | Short spear, sealed scroll case, blue riding coat and ornate gold clasps. |
| Gameplay cues | Loose papers, water spray and the streaming coat show Fleet and Charge. |
| Silhouette hook | Forward spear and long coat. |
| Humor note | A tired horse watches her pass. |
| Setting | A bridge and riverside road. |

### 2.13 Pavise Arbalist

`human.paviseArbalist` · Rare · Countdown 4 · Attack 3 · HP 6 · Physical · Long-range · Bulwark 1 · Hobble 1 at Rare, 2 at Epic, 3 at Legendary

> He brings his own wall and calls it a firing position.

Purpose: a durable Long-range Unit. Power 23, budget 22, deviation +4.5%.

| Field | Brief |
| --- | --- |
| Subject | A patient older man arbalist. |
| Pose | He kneels behind a tall pavise and aims a heavy crossbow. |
| Props | Windlass crossbow, barbed bolts, ornate pavise, mail sleeves and bolt case. |
| Gameplay cues | The long aim shows Long-range; the shield shows Bulwark 1; the barbed bolts show Hobble. |
| Silhouette hook | Tall shield and horizontal crossbow. |
| Humor note | A stool and tea cup wait behind the shield. |
| Setting | A river-town wall. |

### 2.14 Dawn Reliquary

`human.dawnReliquary` · Rare · Countdown 4 · Attack 0 · HP 9 · Holy · Bulwark 2 · Wall · Last Breath: deal 2 Holy damage

> Even broken, it gets the last word.

Purpose: a premium Wall that damages the nearest enemy Unit ahead when it leaves. Power 23, budget 22, deviation +4.5%.

| Field | Brief |
| --- | --- |
| Subject | A large armored roadside reliquary. |
| Pose | It stands across the Lane like a sealed gate. |
| Props | Oak doors, steel bands, sun emblem, candles and blue prayer cloths. |
| Gameplay cues | Thick bands show Bulwark; gold light in cracks shows Last Breath. |
| Silhouette hook | Tall arched shrine and round sun emblem. |
| Humor note | One candle stays upright despite the damage. |
| Setting | A stone approach to a river-town temple. |

### 2.15 Marshal Elian Voss (draft)

`human.marshalElianVoss` · Epic · Countdown 6 · Attack 1 · HP 6 · Holy · Mid-range · Bulwark 1 · Rally 2 · Unique

> Hold the line. I have six more reasons.

Purpose: the named Human Epic and Rally capstone. Power 27, budget 28, deviation -3.6%.

| Field | Brief |
| --- | --- |
| Subject | An older Human officer with a close grey beard. |
| Pose | He raises his sword and plants a forked sun-banner on broken bridge stones. |
| Props | Blue officer coat, fitted plate, command sword, banner and six speech scrolls. |
| Gameplay cues | Soldiers reform behind him; the sword sends a Holy arc forward. |
| Silhouette hook | Raised sword, square shoulders and tall banner. |
| Humor note | Six prepared speeches hang from his belt. |
| Setting | A bridge under attack. |

### 2.16 Ser Aldric Stonewall

`human.serAldricStonewall` · Legendary · Countdown 6 · Attack 3 · HP 5 · Physical · Unique · Iron Guard · Specialist (Warrior)

> Hold the line. Then hold the line again.

Purpose: the Human Specialist. He is the wall that the Human identity wants: Iron Guard stops a large hit, and the Warrior Class gives him the tempo Skill Cards. Power 29, budget 28, deviation +3.6% ([ADR-0050](../adr/0050-a-base-rank-legendary-creature-card-is-a-specialist.md)).

| Field | Brief |
| --- | --- |
| Subject | An older Human knight with a scarred bald head and a short grey beard. |
| Pose | He plants a tower shield in a gate and leans into it. Arrows break on the shield. |
| Props | Blue and gold tower shield, mended plate, a broken banner behind him and a line of spent arrows. |
| Gameplay cues | The arrows bend and fall at the shield edge to show Iron Guard. Legendary: an orange gem and a heroic last stand. |
| Silhouette hook | The wide tower shield and the low stance. |
| Humor note | Someone painted a small door knocker on the shield. |
| Setting | The gate of a river town at dusk. |

## 3. Orc Creature Cards

Identity: orc tribes of the badlands. Fast, loud and always hungry. They rush the enemy Hero. High attack, low HP. They still hit the Unit that kills them.

Each Orc figure is an orc. The art shows no animals, mounts or beasts, because animals are the look of the Feral cards.

### 3.1 Badland Runt

`orc.badlandRunt` · Common · Countdown 1 · Attack 4 · HP 2 · Physical · Swift · Last Breath 1

> Small, loud and already biting.

Purpose: a one-HP trade. Last Breath 1 hits the nearest enemy Unit ahead when it leaves. Power 13, budget 13, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A young orc boy, the smallest of the warband, with big ears and small new tusks. |
| Pose | He jumps forward with his mouth open in a war cry, ready to bite. |
| Props | An adult iron helmet that is too big for him, a short bone knife, orange war paint stripes. |
| Gameplay cues | High Attack and HP 1: small body, big war cry. Swift: a jump with dust behind him. A spare knife in his boot shows Last Breath. |
| Silhouette hook | The big helmet and the open mouth. |
| Humor note | He is very small, but he acts very fierce. The helmet falls over one eye. |
| Setting | Dusty red ground in the badlands. |

### 3.2 Scrap Raider

`orc.scrapRaider` · Common · Countdown 2 · Attack 3 · HP 5 · Physical · Swift · Heroic 1 at Common and Uncommon, 2 at Rare, 3 at Epic, 4 at Legendary · Last Breath 1

> Everything shiny is his now.

Purpose: a fast Unit that hits the Hero and still hits when he falls. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A thin, fast orc man with a big grin. |
| Pose | He runs forward with a cleaver and carries a full sack over his shoulder. |
| Props | A cleaver, a sack full of shiny things (spoons, pans, a small bell), many stolen rings and necklaces, scrap-metal armor. |
| Gameplay cues | Swift: a running pose. Heroic: he looks ahead to the right, at a bigger prize. A hidden blade in the sack shows Last Breath. |
| Silhouette hook | The large sack on his back. |
| Humor note | He wears many stolen shiny things, also a spoon as an earring. |
| Setting | A badland trail. |

### 3.3 Ember Shaman

`orc.emberShaman` · Common · Countdown 3 · Attack 4 · HP 6 · Fire · Long-range

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

### 3.4 Howling Charger

`orc.howlingCharger` · Uncommon · Countdown 3 · Attack 3 · HP 7 · Physical · Swift · Charge 1 up to Rare, 2 at Epic, 3 at Legendary

> You hear him long before you see him.

| Field | Brief |
| --- | --- |
| Subject | A big, heavy orc man with large tusks. |
| Pose | He charges forward with his head low and his mouth open in a loud howl. |
| Props | An orc war banner tied to his back, leather straps, iron caps on his tusks, a spiked round shield held in front like a ram. |
| Gameplay cues | Charge: a fast run and a big dust cloud. Uncommon: the war banner. |
| Silhouette hook | The low head with tusks, the round shield and the banner on the back. |
| Humor note | Lines in the air show the scream. Small rocks shake. |
| Setting | Open badlands with a dust cloud. |

### 3.5 Skyreaver

`orc.skyreaver` · Uncommon · Countdown 3 · Attack 3 · HP 3 · Physical · Swift · Flying · Heroic 1 at Uncommon, 2 at Rare, 3 at Epic, 4 at Legendary

> She steals hats from very high up.

| Field | Brief |
| --- | --- |
| Subject | A lean orc woman who flies a glider. |
| Pose | She glides under wide glider wings of stretched hide on a bone frame, like a big kite. She holds a stolen hat on a long hook and wears a second stolen hat on her head. |
| Props | Orange and red tribal paint on the glider wings, a long snatching hook, a fancy stolen hat with a feather, flying goggles. |
| Gameplay cues | Flying: glider wings fully open, and no ground under her. Heroic: she dives toward a far target. |
| Silhouette hook | The wide glider wing span and the hat. |
| Humor note | She is very proud of her stolen hats. |
| Setting | A badland sky above mesas. |

### 3.6 Pack Stalker

`orc.packStalker` · Uncommon · Countdown 2 · Attack 2 · HP 5 · Physical · Swift · Pivot · Last Breath 1

> He always knows where you are. Mostly behind you.

Purpose: the Orc Pivot Unit, and a trade that still hits. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A lean orc tracker man with a hunched back. |
| Pose | His chest points right in a low crouch. His head turns back over his shoulder, with a sly grin. One hooked hand axe is ready in front, and one behind him. |
| Props | Two hooked hand axes, a hood of hide with orange paint stripes, a leather harness with small bone charms. |
| Gameplay cues | Pivot: the head turns back and one axe guards the rear. The chest still points right. A spare blade on the harness shows Last Breath. |
| Silhouette hook | The hunched back, the hood and the head turned back. |
| Humor note | He grins as if he knows a secret about you. |
| Setting | Tall dry grass in the badlands. |

### 3.7 Tusk Brute

`orc.tuskBrute` · Common · Countdown 4 · Attack 5 · HP 8 · Physical · Heroic 1 at Common and Uncommon, 2 at Rare, 3 at Epic, 4 at Legendary

> Doors are only a suggestion.

| Field | Brief |
| --- | --- |
| Subject | A very big, very strong orc woman with large tusks. |
| Pose | She walks through a broken wooden door. Pieces of the door fly around her. |
| Props | A big wooden club, rough iron shoulder plates, a fur belt. |
| Gameplay cues | High Attack: the biggest orc body in the set after Grukka. Heroic: she moves forward, ready for the next fight. Common: rough, plain gear. |
| Silhouette hook | The large body, the tusks and the door frame around her. |
| Humor note | The door is still on its hinges, but she is through it. |
| Setting | A broken door of a fort. |

### 3.8 Warchief Grukka

`orc.warchiefGrukka` · Epic · Countdown 6 · Attack 3 · HP 5 · Physical · Swift · Charge 2 at Epic, 3 at Legendary · Heroic 3 at Epic, 4 at Legendary · Unique

> "Lunch first. Then glory."

| Field | Brief |
| --- | --- |
| Subject | Grukka, the warchief: a huge, old, happy orc woman. She is the leader of all the tribes. See the character sheet in 3.8.1. |
| Pose | She jumps down from a high rock ledge to charge, in the air above the battle. Her lead foot points right. Her axe is high above her head. She bites a roast leg in her other hand. Her long cloak opens behind her like a banner. |
| Props | A big double axe with gold inlay, a roast leg, a beast-skull helmet with two curved horns, a long dark red war cloak with a fur mantle, a necklace of gold-ringed trophy tusks. |
| Gameplay cues | Charge: she jumps into battle, and dust and small rocks fall from the ledge. Heroic: she looks far ahead to the right, at the next fight. Unique: she is the only orc with a horned skull helmet and a trophy-tusk necklace. Epic: a heroic scene. Her warband cheers on the cliff behind her, with tall tribe banners and big war drums. |
| Silhouette hook | The two horns, the high axe, the roast leg and the open cloak, in the air against the sky. |
| Humor note | She is in the middle of a heroic charge, and she still eats her lunch. Her warriors below hold out more food for her. |
| Setting | The top of a badland cliff at sunset, with a big orange sky. |

#### 3.8.1 Character sheet: Warchief Grukka

| Item | Description |
| --- | --- |
| Body | Very large and wide, round and heavy, with a big belly and very strong arms. She is old, much older than the other orcs. |
| Face | A big happy grin with large tusks that have gold rings. Small kind eyes with deep laugh lines. A scar across her nose. Three burnt-orange paint stripes on each cheek. |
| Hair | Long grey-white hair in thick braids, with bone beads and gold beads. The braids come out below the helmet. |
| Head | A helmet made from a big beast skull with two large curved horns. The horns are the tallest shape in the image. |
| Clothes | Heavy rough-iron and leather armor that covers her chest and belly. A long dark red war cloak with a thick fur mantle on the shoulders. A wide belt with a big gold buckle. |
| Colors | Dark red cloth and gold are the main colors. Burnt orange skin paint. Grey-white hair. Gold on the tusk rings, the beads, the buckle, the trophy tusks and the axe. |
| Signature props | A big double axe in her right hand. A roast leg in her left hand. She always has food. |
| Key shapes | The two horns, the round belly, the double axe, the open cloak. |
| Personality | Loud, warm and hungry. Her warriors love her. She never hurries lunch. |
| Not Tusk Brute | Grukka must not look like the Tusk Brute. No door, no club, no bare stomach, no young muscular body, no brown leather top, no low camera angle. Show her at eye level, in the air, in a three-quarter view. |

### 3.9 Bonestake Palisade

`orc.bonestakePalisade` · Common · Countdown 2 · Attack 0 · HP 14 · Physical · Wall · Last Breath 3

> The stakes are for enemies. The sausages are for later.

Purpose: the Orc Wall. It stops a Lane for the Orc rush, and when it falls, its stakes hit the enemy in front. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A rough palisade of sharpened stakes made by orcs. |
| Pose | It fills a dusty pass between red rocks. The stakes lean forward to the right. |
| Props | Sharpened wooden stakes, lashed hide panels, rough iron spikes, a horned bone totem at the center, and sausages on the tips of some stakes. |
| Gameplay cues | The broad fixed shape shows Wall. Stakes that lean toward the enemy show Last Breath. Plain worn parts show Common. |
| Silhouette hook | A row of leaning stakes with the horned totem above it. |
| Humor note | The orcs keep their lunch on the stakes. |
| Setting | A dusty pass in the red badlands. |

### 3.10 Cinderhorn Breaker

`orc.cinderhornBreaker` · Uncommon · Countdown 3 · Attack 3 · HP 4 · Fire · Swift · Charge 1 up to Rare, 2 at Epic, 3 at Legendary

> She never waits for the gate to open.

Purpose: a fast Fire attacker. Power 19, budget 19, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A muscular orc woman with a short battering ram. |
| Pose | She charges through a wooden fence, with the battering ram held low in front of her. |
| Props | A battering ram of black wood with an iron cap of two curled horns, glowing ember-red horn tips, charred leather harness and iron rings. |
| Gameplay cues | Dust and boards show Charge; embers show Fire. |
| Silhouette hook | The curled horn cap of the ram, held low in front. |
| Humor note | An open gate stands beside the broken fence. |
| Setting | A wooden stockade of a badland camp. |

### 3.11 Warhowler Drummer

`orc.warhowlerDrummer` · Uncommon · Countdown 2 · Attack 2 · HP 7 · Physical · Rally 1

> She only knows one rhythm: faster.

Purpose: a low-Countdown rush enabler. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A compact orc woman with a fierce, joyful face. |
| Pose | She marches and strikes a drum at her hip. |
| Props | Hide drum, bone sticks and red feather trim. |
| Gameplay cues | Nearby warriors surge forward with the beat. |
| Silhouette hook | Round side drum and raised sticks. |
| Humor note | One warrior covers his ears while charging. |
| Setting | A trail between mesas. |

### 3.12 Ashspit Hunter

`orc.ashspitHunter` · Rare · Countdown 4 · Attack 4 · HP 4 · Fire · Long-range

> He measures range by how far the eyebrows burn.

Purpose: a ranged Fire threat. Power 23, budget 22, deviation +4.5%.

| Field | Brief |
| --- | --- |
| Subject | A lean orc man with one singed eyebrow. |
| Pose | He braces a long fire tube. |
| Props | Iron fire tube, brass trim, ember basket and leather coat. |
| Gameplay cues | The long weapon shows Long-range; its trail shows Fire. |
| Silhouette hook | Horizontal tube and ember basket. |
| Humor note | His remaining eyebrow shows concern. |
| Setting | A ledge above a canyon. |

### 3.13 Mesa Pit-Fighter

`orc.mesaPitFighter` · Rare · Countdown 4 · Attack 3 · HP 7 · Physical · Heavy · Retaliate

> Hit her once. That is how counting lessons start.

Purpose: an aggressive Heavy Unit that protects through threat. Power 20, budget 22, deviation -9.1%.

| Field | Brief |
| --- | --- |
| Subject | A tall orc woman with a broken-tusk grin. |
| Pose | She advances to the right, absorbs a hit, and the counter-punch goes to the right. |
| Props | Iron gauntlets, red pit sash and trophy bells. |
| Gameplay cues | The counter-swing shows Retaliate. |
| Silhouette hook | Large hooked fists. |
| Humor note | Tally marks count her attackers. |
| Setting | A red-stone fighting pit. |

### 3.14 Pyreaxe Ravager

`orc.pyreaxeRavager` · Rare · Countdown 5 · Attack 4 · HP 5 · Fire · Heroic 2 at Rare, 3 at Epic, 4 at Legendary

> The axe is hot. Her temper is hotter.

Purpose: a heavy Fire finisher. Power 26, budget 25, deviation +4.0%.

| Field | Brief |
| --- | --- |
| Subject | A fierce orc woman with a high red crest. |
| Pose | She advances with a burning two-handed axe. |
| Props | Ember-grooved axe, metal trim and scorched cloak. |
| Gameplay cues | The large axe shows Attack; her forward gaze shows Heroic. |
| Silhouette hook | High crest and broad flaming axe. |
| Humor note | The axe also roasts one mushroom. |
| Setting | A burning fort barricade. |

### 3.15 Warband Standard-Bearer

`orc.warbandStandardBearer` · Epic · Countdown 6 · Attack 2 · HP 4 · Physical · Charge 2 at Epic, 3 at Legendary · Heroic 3 at Epic, 4 at Legendary · Rally 2

> Follow the banner. Ignore where it is going.

Purpose: the archetypal Orc Epic: immediate movement, stronger allies and Hero pressure. Power 27, budget 28, deviation -3.6%.

| Field | Brief |
| --- | --- |
| Subject | A huge orc man with braided black hair. |
| Pose | He charges downhill with a towering standard. |
| Props | Hide banner, horned crossbar, trophy shields, iron armor and fur cloak. |
| Gameplay cues | The following warband shows Rally; the distant fort shows Heroic. |
| Silhouette hook | Very tall forked banner. |
| Humor note | The banner and warband point in different directions. |
| Setting | An Epic badland ridge assault. |

### 3.16 Ashcaller Grosh

`orc.ashcallerGrosh` · Legendary · Countdown 5 · Attack 2 · HP 4 · Fire · Unique · Bolt 2 · Specialist (Mage)

> Everything burns. Some things burn on a schedule.

Purpose: the Orc Specialist. Bolt 2 gives the Orc identity a Mage: damage that arrives in each Start Phase, without an attack. Power 25, budget 25, deviation 0% ([ADR-0050](../adr/0050-a-base-rank-legendary-creature-card-is-a-specialist.md)).

| Field | Brief |
| --- | --- |
| Subject | A tall, thin Orc shaman with white ash paint and burned hands. |
| Pose | He holds a staff over a brass brazier and calls two fire bolts from the coals. |
| Props | Ash-caked staff, brass brazier, hanging iron runes and a small hourglass. |
| Gameplay cues | Two fire bolts show Bolt 2. The hourglass shows the Start Phase. Legendary: an orange gem and a heroic scene. |
| Silhouette hook | The raised staff and the two bolts. |
| Humor note | He keeps a list of things to burn, and the list is on fire. |
| Setting | A red mesa camp with a cold wind. |

## 4. Elf Creature Cards

Identity: patient forest people and plant spirits. They control movement from range, heal, and poison. All values in this section are **provisional**.

### 4.1 Rootbound Guard

`elf.rootboundGuard` · Common · Countdown 3 · Attack 3 · HP 9 · Physical · Heavy · Bulwark 1 · Regenerate 1

> He has held this path since it was somewhere else.

Purpose: an Elf Lane anchor. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | A broad old plant guardian in bark armor. |
| Pose | It stands rooted behind a leaf shield. |
| Props | Leaf shield, branch spear and boot-shaped training post. |
| Gameplay cues | Roots in the ground show Regenerate; bark cuirass shows Bulwark. |
| Silhouette hook | Square trunk and broad shield. |
| Humor note | A snail uses it as a milestone. |
| Setting | An ancient forest path. |

### 4.2 Bramble Duelist

`elf.brambleDuelist` · Common · Countdown 2 · Attack 5 · HP 5 · Physical

> One cut for honor. Two because the hedge was rude.

Purpose: a simple Elf attacker. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A young elf woman. |
| Pose | She makes a quick fencing lunge. |
| Props | Thorn rapier and worn green coat. |
| Gameplay cues | The exposed fast stance shows high Attack and low HP. |
| Silhouette hook | Narrow rapier line. |
| Humor note | She duels a hedge that holds a wooden spoon. |
| Setting | A forest clearing. |

### 4.3 Fernwing Courier

`elf.fernwingCourier` · Common · Countdown 2 · Attack 3 · HP 3 · Physical · Swift · Flying

> The message says urgent. The parcel is a sandwich.

Purpose: cheap Flying Hero pressure. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A small leaf spirit courier. |
| Pose | It dives between branches. |
| Props | Fern wings, satchel and official parcel. |
| Gameplay cues | Wide wings and no ground contact show Flying. |
| Silhouette hook | A V-shaped wing span. |
| Humor note | A sandwich shows from the parcel. |
| Setting | The high forest canopy. |

### 4.4 Mosspitcher Lookout

`elf.mosspitcherLookout` · Common · Countdown 3 · Attack 3 · HP 8 · Physical · Long-range · Regenerate 1

> He can hear a boot step. He cannot hear advice.

Purpose: a durable Elf Long-range Unit that heals. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | A squat pitcher-plant spirit with a mossy body. No bow. |
| Pose | He leans forward and spits a sticky moss ball in a high arc to the right. His root toes spread flat on the planks to feel for boot steps. |
| Props | Pitcher-shaped body with a leaf lid like a hat, moss coat, root toes and a small cluster of moss balls. |
| Gameplay cues | The moss coat grows back: Regenerate. The high arc of the moss ball shows Range. |
| Silhouette hook | A tall pitcher body with a tilted lid. |
| Humor note | A small bird sits on his lid and gives advice. He holds the lid shut on that side. |
| Setting | A high root platform. |

### 4.5 Acorn Tender

`elf.acornTender` · Common · Countdown 3 · Attack 3 · HP 6 · Holy · Long-range · Poison

> Growth takes patience. Wilt takes less.

Purpose: a Holy Long-range Unit that applies Poison. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | An elder elf woman gardener. |
| Pose | She raises one glowing acorn. |
| Props | Crooked watering can, pruning knife and plain robe. |
| Gameplay cues | Green sap on the pruning knife shows Poison. |
| Silhouette hook | Raised acorn and watering can. |
| Humor note | She glares at an acorn as if it is late. |
| Setting | A nursery grove. |

### 4.6 Glade Turnblade

`elf.gladeTurnblade` · Uncommon · Countdown 3 · Attack 4 · HP 4 · Physical · Pivot

> Behind him is only another front.

Purpose: the Elf Pivot Unit. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | An elf man guard. |
| Pose | His chest and lead foot advance to the right. He looks back, and the glaive sweeps behind him. |
| Props | Crescent glaive and green coat with amber trim. |
| Gameplay cues | Front and rear sight lines show Pivot. |
| Silhouette hook | Circular blade path. |
| Humor note | Two practice dummies both think they are first. |
| Setting | A forked forest path. |

### 4.7 Canopy Skirmisher

`elf.canopySkirmisher` · Uncommon · Countdown 3 · Attack 3 · HP 3 · Physical · Swift · Flying

> The stairs were deemed inefficient.

Purpose: mobile pressure with fragile stats. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | An elf woman with leaf-glider wings. |
| Pose | She dives with a short spear. |
| Props | Leaf wings, short spear and amber-trim harness. |
| Gameplay cues | Spread wings show Flying. |
| Silhouette hook | Triangular wings and spear. |
| Humor note | An unused rope ladder hangs behind her. |
| Setting | A canopy bridge. |

### 4.8 Thornline Archer

`elf.thornlineArcher` · Uncommon · Countdown 3 · Attack 3 · HP 4 · Physical · Long-range · Poison

> The arrow leaves. The ache stays.

Purpose: reliable ranged Poison. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | An elf man archer. |
| Pose | He makes a composed standing shot. |
| Props | Recurved thorn bow with amber trim and a poisoned arrow. |
| Gameplay cues | Green sap on the arrow shows Poison. |
| Silhouette hook | Hooked bow shape. |
| Humor note | A flower on his training post has wilted. |
| Setting | A woodland firing line. |

### 4.9 Dewkeeper

`elf.dewkeeper` · Uncommon · Countdown 3 · Attack 2 · HP 8 · Holy · Mid-range · Regenerate 1

> She collects morning dew. Afternoon dew is paperwork.

Purpose: a durable Holy support. Power 19, budget 19, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | An elf woman healer. |
| Pose | She lifts a crystal bowl. |
| Props | Crystal bowl, reed staff and amber-trim robe. |
| Gameplay cues | Luminous dew closes a small wound. |
| Silhouette hook | Bowl and tall staff. |
| Humor note | One bottle in her orderly set is ignored. |
| Setting | A misty grove. |

### 4.10 Bramble Nest

`elf.brambleNest` · Uncommon · Countdown 3 · Attack 0 · HP 15 · Physical · Wall · Regenerate 1

> It is not blocking the path. It is the path now.

Purpose: a Wall that grows back. Power 20, budget 19, deviation +5.3%.

| Field | Brief |
| --- | --- |
| Subject | A dense living bramble arch. |
| Pose | It fills an old forest road. |
| Props | Thorn arch, seed pods and amber ribbons. |
| Gameplay cues | Fresh shoots closing a cut show Regenerate. |
| Silhouette hook | Wide fixed arch. |
| Humor note | A direction sign points into the hedge. |
| Setting | An old forest road. |

### 4.11 Amberwing Dart

`elf.amberwingDart` · Rare · Countdown 3 · Attack 2 · HP 3 · Physical · Swift · Flying · Poison

> It stops armies and loses arguments with windows.

Purpose: a fast Flying Poison attacker with low HP. Power 19, budget 19, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A dragonfly-like plant spirit. |
| Pose | It makes a steep attack dive. |
| Props | Amber-veined wings, thorn lance and trailing vines. |
| Gameplay cues | The amber on the thorn lance shows Poison; four wings show Flying. |
| Silhouette hook | Crossed wing span. |
| Humor note | One wing has a window-shaped repair. |
| Setting | A canopy gap. |

### 4.12 Elderreed Dartmaster

`elf.elderreedDartmaster` · Rare · Countdown 4 · Attack 3 · HP 7 · Physical · Long-range · Poison

> She waits for the perfect shot. Lunch waits too.

Purpose: durable ranged Poison. Power 23, budget 22, deviation +4.5%.

| Field | Brief |
| --- | --- |
| Subject | An older elf woman, a master of the blowpipe. No bow. |
| Pose | She crouches along a high branch and aims a very long reed blowpipe to the right, with calm cheeks and one eye closed. |
| Props | Reed blowpipe longer than she is tall with gold-metal bands, a belt case of thorn darts and a layered green cloak. |
| Gameplay cues | The long straight blowpipe shows Long-range. Green sap on the thorn darts shows Poison. |
| Silhouette hook | One very long, thin horizontal line. |
| Humor note | Squirrels inspect her untouched picnic. |
| Setting | The crown canopy. |

### 4.13 Seedwind Shepherd

`elf.seedwindShepherd` · Rare · Countdown 4 · Attack 1 · HP 7 · Holy · Mid-range · Flying · Regenerate 1

> Every seed has a destination. He stays to water them.

Purpose: a durable Flying healer. Power 21, budget 22, deviation -4.5%.

| Field | Brief |
| --- | --- |
| Subject | An elf man seed shepherd. |
| Pose | He floats under a seed sail. |
| Props | Seed sail, ornate staff, gold-trim cloak and tiny baton. |
| Gameplay cues | Holy dew closing a cut shows Regenerate. |
| Silhouette hook | Broad sail and staff. |
| Humor note | He directs seeds like road traffic. |
| Setting | A canopy wind corridor. |

### 4.14 Canopy Vinewarden

`elf.canopyVinewarden` · Epic · Countdown 5 · Attack 3 · HP 3 · Physical · Long-range · First Strike · Entangle

> The warning was yesterday.

Purpose: the archetypal Elf Epic: approach denial, and one of the 2 Elf cards with Entangle (ADR-0022, ADR-0026). Power 23, budget 25, deviation -8.0%.

| Field | Brief |
| --- | --- |
| Subject | An elf woman canopy sentinel who commands the living gate. No bow. |
| Pose | She stands on the gate arch and thrusts one open hand forward. A huge braid of thorned vines grows from the gate and lashes down to the right at an attacker below. |
| Props | Layered leaf armor with silver trim, a living vine braid as thick as a tree trunk and a silver bracer on the lead arm. |
| Gameplay cues | The vines hit before the attacker can lift his axe: First Strike. The vines coil around him: Entangle. The long reach of the vine shows Long-range. |
| Silhouette hook | A huge S-curve of vine from her hand. |
| Humor note | Yesterday's warning bell hangs broken in a knot of vine. |
| Setting | A colossal canopy gate. |

### 4.15 Lethiel, First Gardener (draft)

`elf.lethielFirstGardener` · Epic · Countdown 5 · Attack 1 · HP 6 · Holy · Mid-range · Unique · Entangle · Regenerate 2

> The forest grew wild. Lethiel called it adequate.

Purpose: the named Elf Epic and a durable healer. She has Entangle, the Elf Race Keyword (ADR-0026). Power 24, budget 25, deviation -4.0%.

| Field | Brief |
| --- | --- |
| Subject | An ancient elf gardener. |
| Pose | Lethiel touches the ground with a luminous staff. |
| Props | Leaf mantle, seed crown, silver pruning hook and tiny ruler. |
| Gameplay cues | Holy light closing a split in the bark shows Regenerate. For the next art pass: roots rise around her staff to show Entangle. The current art does not change. |
| Silhouette hook | Seed crown and tall staff. |
| Humor note | Lethiel measures a colossal tree and approves. |
| Setting | A primeval garden. |

### 4.16 Warden Saelith

`elf.wardenSaelith` · Legendary · Countdown 5 · Attack 2 · HP 5 · Physical · Unique · Long-range · Spawnbane 2 · Specialist (Ranger)

> Every gate has a warden. This one shoots first.

Purpose: the Elf Specialist. She punishes the enemy summon: Spawnbane 2 hits each Unit from a Creature Card before it can use Sabotage or Summon, and Long-range keeps her behind the front. Power 25, budget 25, deviation 0% ([ADR-0050](../adr/0050-a-base-rank-legendary-creature-card-is-a-specialist.md)).

| Field | Brief |
| --- | --- |
| Subject | A tall Elf warden with a braided dark braid and a leaf-shaped mask on her belt. |
| Pose | She draws a longbow on a root bridge and aims down at a summoning circle. |
| Props | Longbow, green and amber arrow, root bridge, a broken summoning circle below. |
| Gameplay cues | The long shot shows Long-range. The arrow splits the circle to show Spawnbane. Legendary: an orange gem and a heroic scene. |
| Silhouette hook | The drawn longbow and the high braid. |
| Humor note | A small sign on the bridge says "No summoning. Yes, we mean you." |
| Setting | An ancient forest gate at first light. |

## 5. Undead Creature Cards

Identity: old spirits in bones and armor. They use many cheap Units, Swarm, Rebirth, Summon and Frost. All values in this section are **provisional**.

### 5.1 Graveyard Drudge

`undead.graveyardDrudge` · Common · Countdown 1 · Attack 3 · HP 7 · Physical · Heavy · Swarm 1

> He works better when somebody watches.

Purpose: a cheap blocker that rewards a crowded Lane. Power 12, budget 13, deviation -7.7%.

| Field | Brief |
| --- | --- |
| Subject | A broad skeleton laborer in a patched burial coat. |
| Pose | He braces behind a shovel while a smaller skeleton watches. |
| Props | Blunt shovel, rope belt and rusted shoulder plate. |
| Gameplay cues | Two figures show Swarm; the broad body shows HP. |
| Silhouette hook | Round shoulders and tall shovel. |
| Humor note | He checks that his helper still works. |
| Setting | A muddy grave path. |

### 5.2 Rattleknife

`undead.rattleknife` · Common · Countdown 1 · Attack 3 · HP 6 · Physical · Swarm 1

> One knife is a hobby. Two is a plan.

Purpose: a cheap Swarm attacker. Power 13, budget 13, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A thin skeleton cutpurse. |
| Pose | He lunges while his loose hand prepares a final throw. |
| Props | Chipped dinner knife, empty purse and worn hood. |
| Gameplay cues | A smaller skeleton at his elbow shows Swarm. |
| Silhouette hook | Long arm and forward knife. |
| Humor note | The empty purse has a painted Coin symbol. |
| Setting | A crooked marsh toll road. |

### 5.3 Coffin-Lid Skater

`undead.coffinLidSkater` · Common · Countdown 1 · Attack 3 · HP 6 · Physical · Charge 1 up to Rare, 2 at Epic, 3 at Legendary

> The hill was steeper when he was alive.

Purpose: cheap early Hero pressure. Power 13, budget 13, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A small skeleton on a coffin lid. |
| Pose | He slides to the right down the hill. |
| Props | Coffin lid, bent-spoon rudder and long scarf. |
| Gameplay cues | Mud spray and the steep angle show Charge. |
| Silhouette hook | Long lid and scarf. |
| Humor note | A loose cart wheel chases him. |
| Setting | A wet Marches causeway. |

### 5.4 Hushbow

`undead.hushbow` · Common · Countdown 2 · Attack 3 · HP 5 · Physical · Long-range · Summon Skeleton

> Quiet in life. Considerably noisier afterward.

Purpose: a cheap Long-range Unit that summons a Skeleton beside it. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A skeleton archer in grave cloth. |
| Pose | It draws a short bow. |
| Props | Bow, wrapped bells and bone-filled quiver. |
| Gameplay cues | A second skull in the quiver shows Summon. |
| Silhouette hook | Bow arc and tall quiver. |
| Humor note | It asks for silence without lips. |
| Setting | Reed-filled burial ground. |

### 5.5 Grave Bell Tender

`undead.graveBellTender` · Common · Countdown 2 · Attack 3 · HP 7 · Physical · Summon Skeleton

> One ring for supper. Two for reinforcements.

Purpose: efficient two-body Lane setup. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A stooped skeleton sexton. |
| Pose | It rings a handbell while a Skeleton rises. |
| Props | Large bell, key chain and patched cloak. |
| Gameplay cues | The second Unit shows Summon. |
| Silhouette hook | Bell above a bent body. |
| Humor note | The new Skeleton carries a dinner bowl. |
| Setting | A flooded cemetery. |

### 5.6 Backwatch Bailiff

`undead.backwatchBailiff` · Uncommon · Countdown 2 · Attack 3 · HP 5 · Physical · Heavy · Pivot

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

### 5.7 Chattering Cohort

`undead.chatteringCohort` · Uncommon · Countdown 2 · Attack 3 · HP 7 · Physical · Swarm 1

> They agree on everything, very loudly.

Purpose: the main cheap Swarm attacker. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | Three eager skeleton soldiers around one sword. |
| Pose | They all lean and advance to the right. |
| Props | Oversized sword, mismatched helmets and teal cloth. |
| Gameplay cues | The group composition shows Swarm. |
| Silhouette hook | Three skulls and one long blade. |
| Humor note | Their free hands point different ways. |
| Setting | A narrow causeway. |

### 5.8 Pale Galloper

`undead.paleGalloper` · Uncommon · Countdown 2 · Attack 2 · HP 4 · Frost · Swift · Charge 1 up to Rare, 2 at Epic, 3 at Legendary

> The rider asked for a slower horse.

Purpose: fast Frost tempo and Hero pressure. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A nervous skeleton on a spectral marsh pony. |
| Pose | The pony charges while the rider leans back. |
| Props | Frosted saddle, empty scroll tube and rusted cap. |
| Gameplay cues | Ice spray shows Frost and Charge. |
| Silhouette hook | Small rider over long pony legs. |
| Humor note | The pony is braver than the rider. |
| Setting | A frozen marsh ford. |

### 5.9 Rime-Eye Reaper

`undead.rimeEyeReaper` · Uncommon · Countdown 2 · Attack 3 · HP 5 · Frost

> She closes one eye. The other is already frozen open.

Purpose: cheap melee Frost control. Its high Attack kills a Frozen target fast, so the Freeze lock ends fast. Power 17, budget 16, deviation +6.3%.

This card was a Ranged Frost Unit with Range 3, Rime-Eye Archer. No Ranged Unit has Frost damage ([ADR-0025](../adr/0025-no-ranged-unit-has-frost-damage.md), issue #28).

| Field | Brief |
| --- | --- |
| Subject | A skeletal woman reaper with one frost eye. |
| Pose | She steps forward into a low scythe sweep. |
| Props | Frosted grave scythe, rusted scale vest and silver-teal clasp. |
| Gameplay cues | Frost on the scythe blade shows Frost. |
| Silhouette hook | Curved scythe and narrow body. |
| Humor note | A frozen moth rests on her open eye. |
| Setting | A dead willow bank. |

### 5.10 Ossuary Piper

`undead.ossuaryPiper` · Uncommon · Countdown 2 · Attack 3 · HP 5 · Physical · Rally 1

> Nobody knows the tune. Everybody marches.

Purpose: a Swarm payoff and Lane support. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A cheerful broad skeleton musician. |
| Pose | It marches with crooked bone pipes. |
| Props | Pipe bundle, small drum, teal sash and rusted breastplate. |
| Gameplay cues | Nearby skeletons stand taller with the music. |
| Silhouette hook | Fan-shaped pipes. |
| Humor note | A frog tries to match the tune. |
| Setting | A marsh funeral road. |

### 5.11 Coffin Lancer

`undead.coffinLancer` · Rare · Countdown 2 · Attack 1 · HP 5 · Physical · Heavy · Bulwark 1 · Rebirth

> The coffin is defensive equipment.

Purpose: a compact persistent blocker. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | An armored skeleton knight. |
| Pose | It kneels behind a coffin shield with a lance level. |
| Props | Ornate lance, coffin and tarnished silver trim. |
| Gameplay cues | The coffin shows Bulwark; a pale double image shows Rebirth. |
| Silhouette hook | Coffin rectangle and long lance. |
| Humor note | A pillow remains inside the shield. |
| Setting | A ruined noble crypt. |

### 5.12 Winter Maw

`undead.winterMaw` · Rare · Countdown 3 · Attack 2 · HP 4 · Frost · First Strike · Swarm 1

> It brings enough cold for the whole pack.

Purpose: an anti-melee finisher and Swarm payoff. Power 20, budget 19, deviation +5.3%.

| Field | Brief |
| --- | --- |
| Subject | A large spectral hound with a second hound behind. |
| Pose | The first hound springs ahead. |
| Props | Broken ornate collar and rusted chain. |
| Gameplay cues | The first leap shows First Strike; the pack shows Swarm. |
| Silhouette hook | Open jaws and icy mane. |
| Humor note | The second hound carries a frozen stick. |
| Setting | A frost-covered barrow field. |

### 5.13 Lantern Widow

`undead.lanternWidow` · Rare · Countdown 3 · Attack 1 · HP 4 · Frost · Summon Restless Wisp

> She always leaves a light on for the late.

Purpose: Frost support that creates a mobile second threat. Power 17.5, budget 19, deviation -7.9%.

| Field | Brief |
| --- | --- |
| Subject | An elegant skeletal widow. |
| Pose | She opens an ornate lantern. |
| Props | Lantern, mourning dress, veil pins and empty tea cup. |
| Gameplay cues | A Restless Wisp leaves the lantern through frost vapor. |
| Silhouette hook | Tall veil and hanging lantern. |
| Humor note | She offers the Wisp tea. |
| Setting | A sunken manor garden. |

### 5.14 Sir Odo, the Last Taxman

`undead.sirOdoLastTaxman` · Epic · Countdown 4 · Attack 2 · HP 4 · Physical · Unique · Charge 2 at Epic, 3 at Legendary · Rebirth

> Death excuses neither payment nor the late fee.

Purpose: the named Undead Epic and a large finisher that comes back slowly. Charge gives him a fast first Turn. Rebirth brings him back at 1 HP, and the reborn Odo does not get Charge again. Power 22, budget 22, deviation 0%.

He had Speed 2 before, and then Speed 1 ([ADR-0024](../adr/0024-speed-1-is-the-default.md), issue #35). Now he has the Base Speed 2 and no Speed Keyword, the same as most Units ([ADR-0030](../adr/0030-keywords-set-speed-and-range-and-there-are-no-roles.md)).

| Field | Brief |
| --- | --- |
| Subject | A tall skeletal tax knight with a false mustache. |
| Pose | He charges down ruined court steps. |
| Props | Quill lance, ledger shield, Coin chain and ornate plate. |
| Gameplay cues | The charge down the steps shows Charge. A spectral second Odo shows Rebirth. |
| Silhouette hook | Quill lance and square shield. |
| Humor note | He offers a receipt during the charge. |
| Setting | A collapsed toll court. |

### 5.15 Bone Rampart

`undead.boneRampart` · Epic · Countdown 3 · Attack 0 · HP 5 · Physical · Wall · Bulwark 2 · Rebirth

> Please use the other Lane.

Purpose: the archetypal Undead Epic and persistent Swarm shield. Power 20, budget 19, deviation +5.3%.

| Field | Brief |
| --- | --- |
| Subject | A towering barricade with orderly skeleton workers. |
| Pose | It fills a flooded causeway. |
| Props | Rusted shields, coffin planks, chains and teal pennants. |
| Gameplay cues | A spectral rebuilt outline shows Rebirth. |
| Silhouette hook | Massive stepped wall. |
| Humor note | A blank arrow sign points around it. |
| Setting | A narrow flooded causeway. |

### 5.16 Pale Cantor Ysolde

`undead.paleCantorYsolde` · Legendary · Countdown 5 · Attack 3 · HP 4 · Physical · Unique · Soul Harvest · Specialist (Priest)

> She sings the dead into a better shape.

Purpose: the Undead Specialist. Soul Harvest makes her grow with each kill, and the Priest Class gives her the healing and Ward that an Undead front needs. Power 25, budget 25, deviation 0% ([ADR-0050](../adr/0050-a-base-rank-legendary-creature-card-is-a-specialist.md)).

| Field | Brief |
| --- | --- |
| Subject | A pale, calm Undead cantor in a high-collared coat, with a silver hymn book. |
| Pose | She sings with one hand raised. Pale threads leave a fallen foe and enter her chest. |
| Props | Silver hymn book, tattered teal stole, a ring of bowed ghostly heads. |
| Gameplay cues | The threads show Soul Harvest. Her posture is steady, not fierce. Legendary: an orange gem and a heroic scene. |
| Silhouette hook | The raised hand and the open hymn book. |
| Humor note | The ghostly choir is slightly off-key, and she notices. |
| Setting | A flooded grave court with dead willows. |

## 6. Goblin Creature Cards

Identity: goblins of the hill mines. Tinkers, thieves and bomb makers. Small, clever and greedy. They make the enemy plan slower with Sabotage, traps (Hobble) and bombs (Last Breath and Fire). All values in this section are **provisional**.

Goblin art must not look like Orc art. Each Goblin figure is very small: about half the height of a human, with a large round head, thin arms and legs, long fingers and big feet that are often bare. Each Goblin figure has ash-grey skin with a cool blue tint, never green or olive skin. Each Goblin figure has very large round amber eyes that shine a little, like the eyes of a cat in a dark tunnel, a long pointed nose, small crooked front teeth and no tusks. Each Goblin figure has long soft ears that hang down to the shoulders, and white tufts of hair. The art shows no war paint, no fur, no bones, no tribal charms and no big muscles, because these are the look of the Orc cards. A Goblin figure wears canvas work clothes with many pockets, brass goggles and tool belts, with armor and tools made from found objects that are too big for it. In the art, acid green comes from lamp oil, glass jars and fuse sparks, never from skin. A Goblin figure looks clever, nervous and proud of its inventions, not fierce.

### 6.1 Ankle Snatcher

`goblin.ankleSnatcher` · Common · Countdown 1 · Attack 3 · HP 3 · Physical · Swift · Hobble 1

> Ankles are the easiest part of a knight to reach.

Purpose: a cheap fast trap that slows the first fast enemy Unit. Power 12, budget 13, deviation -7.7%.

| Field | Brief |
| --- | --- |
| Subject | A small goblin girl with a long hook. |
| Pose | She runs low and hooks forward at ankle height. |
| Props | A hook made from a bent pipe, a coil of rope, patched goggles on her forehead. |
| Gameplay cues | The hook at ankle height shows Hobble. The long stride shows Swift. |
| Silhouette hook | The long hook and the long ears that stream back. |
| Humor note | One boot already hangs from the hook. |
| Setting | A narrow mine tunnel mouth with lanterns. |

### 6.2 Fuse Runner

`goblin.fuseRunner` · Common · Countdown 1 · Attack 2 · HP 4 · Physical · Swift · Last Breath 3

> The fuse is long. The plan is short.

Purpose: a one-Countdown bomb. Last Breath 3 hits the nearest enemy Unit ahead when it leaves. Power 13, budget 13, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A skinny goblin man with a round bomb that is bigger than his head. |
| Pose | He runs forward on his toes, with the bomb in both arms. |
| Props | A round black bomb with a short lit fuse, soot on his face, a long scarf. |
| Gameplay cues | The lit fuse shows Last Breath. |
| Silhouette hook | The round bomb and the thin legs. |
| Humor note | He looks at the fuse, not where he runs. |
| Setting | A dusty mine rail track. |

### 6.3 Junk Slinger

`goblin.junkSlinger` · Common · Countdown 2 · Attack 4 · HP 4 · Physical · Long-range · Hobble 1

> One goblin's junk is another knight's limp.

Purpose: a cheap Long-range Unit that slows the Unit it hits. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | An old goblin woman with a big sling. |
| Pose | She swings the sling above her head. |
| Props | A sling, a bag of bent nails, bolts and small gears, a patched apron. |
| Gameplay cues | A small trap spring in the bag shows Hobble. The sling shows Range. |
| Silhouette hook | The circle of the sling. |
| Humor note | One of her "stones" is her own false tooth. |
| Setting | A junk heap outside a mine. |

### 6.4 Tunnel Saboteur

`goblin.tunnelSaboteur` · Common · Countdown 2 · Attack 3 · HP 7 · Physical · Sabotage 1

> He does not fight your army. He fights your schedule.

Purpose: the first Sabotage card. When it comes from its Card, the enemy card with the lowest Countdown gets +1 Countdown. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A round goblin man in a miner's helmet that is too big. |
| Pose | He climbs up out of a hole in the road. |
| Props | Big pliers, a cut rope, an hourglass that he turns upside down. |
| Gameplay cues | The hourglass shows Sabotage: the enemy card comes later. |
| Silhouette hook | The helmet lamp and the pliers. |
| Humor note | He winks while he turns the hourglass. |
| Setting | A fresh hole in a battlefield road. |

### 6.5 Scrap-Plate Guard

`goblin.scrapPlateGuard` · Common · Countdown 2 · Attack 3 · HP 8 · Physical · Heavy · Bulwark 1

> Armor is armor. Even if it was a stove.

Purpose: a cheap Goblin Lane anchor. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A small, round goblin woman in armor made from stove plates that is much too big for her. |
| Pose | She braces behind a shield made from a cart wheel. |
| Props | A cart-wheel shield, a stove door on her chest, a short pick. |
| Gameplay cues | The stove plates show Bulwark. |
| Silhouette hook | The round wheel shield and a stove pipe on her helmet. |
| Humor note | A small kettle still steams on her shoulder plate. |
| Setting | A mine yard. |

### 6.6 Sidestep Shiv

`goblin.sidestepShiv` · Uncommon · Countdown 2 · Attack 3 · HP 4 · Physical · Pivot

> Front door? Never heard of it.

Purpose: the Goblin Pivot Unit. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A thin goblin man with two small knives. |
| Pose | His chest and lead foot point right. He looks back over his shoulder, with one knife ready behind him. |
| Props | Two small knives, a dark hood, a belt with many pockets and one brass buckle. |
| Gameplay cues | Pivot: the face looks back. The chest still points right. |
| Silhouette hook | The long nose and the knives out to the sides. |
| Humor note | One pocket is full of other people's keys. |
| Setting | Between mine carts in a tunnel. |

### 6.7 Junk Barricade

`goblin.junkBarricade` · Uncommon · Countdown 2 · Attack 0 · HP 11 · Physical · Wall · Sabotage 1

> Built in one night. Paid for by nobody.

Purpose: the Goblin Wall. It also delays an enemy card when it comes in. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A tall barricade of junk: carts, barrels, pots and an old door. |
| Pose | It fills a mine road. A goblin on top pulls a long rope. |
| Props | Barrels, a broken mine cart, ropes, a pointing-hand sign with no letters. |
| Gameplay cues | The rope runs off the image to the enemy side and pulls something away: Sabotage. |
| Silhouette hook | A heap with a pointed top. |
| Humor note | The sign shows a hand that says "stop", and the hand is upside down. |
| Setting | A mine road. |

### 6.8 Bomb Lobber

`goblin.bombLobber` · Uncommon · Countdown 3 · Attack 3 · HP 4 · Fire · Long-range

> Catch!

Purpose: a Long-range Fire Unit that Burns its target. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | A plump goblin woman with a big racket made from a barrel hoop and wire. |
| Pose | She hits a lit bomb forward with the racket, like a ball. |
| Props | The racket, a basket of small round bombs, smoked goggles. |
| Gameplay cues | The lit bombs show Fire. The high arc shows Range. |
| Silhouette hook | The round racket. |
| Humor note | She covers one ear with her free hand. |
| Setting | A rocky slope above a mine. |

### 6.9 Grease Trapper

`goblin.greaseTrapper` · Uncommon · Countdown 3 · Attack 3 · HP 5 · Physical · Hobble 2 · Sabotage 1

> Mind the floor.

Purpose: slows a Unit for 2 End Phases, and delays an enemy card when it comes in. Power 20, budget 19, deviation +5.3%.

| Field | Brief |
| --- | --- |
| Subject | A short goblin man with a grease bucket and a big spring trap. |
| Pose | He spreads grease on the ground with a mop. |
| Props | A bucket of black grease, a mop, a big spring trap with no teeth on his back, a small hourglass on his belt. |
| Gameplay cues | The trap and the grease show Hobble. The hourglass shows Sabotage. |
| Silhouette hook | The mop and the round trap on his back. |
| Humor note | He slips a little on his own grease. |
| Setting | A mine tunnel floor. |

### 6.10 Rocket Barrel Rider

`goblin.rocketBarrelRider` · Uncommon · Countdown 3 · Attack 3 · HP 3 · Fire · Swift · Last Breath 2

> Steering is a later invention.

Purpose: a fast Goblin Unit that hits the Hero. Its Fire hits Burn, and Last Breath 2 hits when it falls. Power 19, budget 19, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A young goblin woman who rides a barrel with a rocket on the back. |
| Pose | She flies low and forward on the barrel and holds on with both hands. |
| Props | A powder barrel, a flame out of the back, a leather cap with goggles, a scarf. |
| Gameplay cues | The flame trail shows Swift and Fire. The powder barrel shows Last Breath. |
| Silhouette hook | The barrel and the long flame trail. |
| Humor note | Her eyes are shut tight. |
| Setting | A mine rail track that goes down a slope. |

### 6.11 Mine Sapper

`goblin.mineSapper` · Rare · Countdown 4 · Attack 3 · HP 5 · Fire · Last Breath 3

> Every wall has a weak spot. I bring my own.

Purpose: a Fire attacker that hits hard and explodes when it falls. Power 21, budget 22, deviation -4.5%.

| Field | Brief |
| --- | --- |
| Subject | A wiry goblin man with a big pick and a stack of powder kegs on his back that is taller than he is. |
| Pose | He swings the pick forward. |
| Props | A long pick with brass trim, a back frame of small powder kegs, a lit pipe. |
| Gameplay cues | The kegs show Last Breath. The glowing pick head shows Fire. |
| Silhouette hook | The pick and the stack of kegs. |
| Humor note | He lights his pipe with one of the fuses. |
| Setting | A deep mine face with brass lanterns. |

### 6.12 Spyglass Sniper

`goblin.spyglassSniper` · Rare · Countdown 4 · Attack 3 · HP 6 · Physical · Long-range · Sabotage 1

> I see your plans. I do not like them.

Purpose: a Long-range Unit that delays an enemy card. Power 23, budget 22, deviation +4.5%.

| Field | Brief |
| --- | --- |
| Subject | An old goblin woman with a long crossbow. |
| Pose | She aims, with one eye at a brass spyglass on the crossbow. |
| Props | A long crossbow with a brass spyglass, a notebook full of drawings with no letters, goggles with many lenses. |
| Gameplay cues | The spyglass shows Long-range. The notebook of stolen plans shows Sabotage. |
| Silhouette hook | The long crossbow and the spyglass. |
| Humor note | A small bird sits on the end of the crossbow. |
| Setting | A high rock above the mine entrance. |

### 6.13 Junk Walker

`goblin.junkWalker` · Rare · Countdown 4 · Attack 3 · HP 6 · Physical · Heavy · Bulwark 2

> It walks. Mostly forward.

Purpose: the Goblin Lane anchor with Bulwark 2. Power 21, budget 22, deviation -4.5%.

| Field | Brief |
| --- | --- |
| Subject | A goblin woman who drives a walking machine made from boiler plates. |
| Pose | The machine takes a heavy step forward with a big claw arm. |
| Props | A round boiler body, pipe legs, a claw arm, an open seat with levers, brass gauges and rivets. |
| Gameplay cues | The thick plates show Bulwark 2. |
| Silhouette hook | The round boiler and the two pipe legs. |
| Humor note | A second goblin runs behind with an oil can. |
| Setting | A mine yard with a crane. |

### 6.14 Grand Gearjammer

`goblin.grandGearjammer` · Epic · Countdown 4 · Attack 2 · HP 3 · Physical · Mid-range · Sabotage 2

> Every plan has gears. We have more.

Purpose: the archetypal Goblin Epic. Sabotage 2 makes the enemy's next card 2 Turns later. Power 22, budget 22, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A big goblin war cart with a gear cannon and a crew of three goblins. |
| Pose | The cart rolls forward, and the cannon shoots gears and springs. |
| Props | A cart with large brass gears, a gear cannon, levers, three goblins at work. |
| Gameplay cues | Flying gears and broken clocks show Sabotage. The cannon shows Range. |
| Silhouette hook | The big gear on top of the cart. |
| Humor note | One goblin loads the cannon with an alarm clock. |
| Setting | The main mine hall with chains and lanterns. |

### 6.15 Boss Snikkit

`goblin.bossSnikkit` · Epic · Countdown 5 · Attack 2 · HP 4 · Fire · Unique · Sabotage 1 · Last Breath 3

> "Everything down here is mine. That is the joke. Laugh."

Purpose: the named Goblin Epic. He delays an enemy card when he comes in, Burns what he hits, and explodes when he falls. Power 25, budget 25, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | Boss Snikkit: the goblin mine king, a small old goblin man with a large crown made from a bucket. |
| Pose | He rides a mine cart full of bombs down the rails and points forward with his scepter. |
| Props | A mine-cart throne, a bucket crown with glass gems, a scepter that is a lit torch, a pile of bombs, a stolen hourglass on a chain. |
| Gameplay cues | The torch shows Fire. The bombs show Last Breath. The hourglass shows Sabotage. Epic: a heroic scene with cheering goblins. |
| Silhouette hook | The tall bucket crown and the cart. |
| Humor note | The crown is too big and falls over one eye. |
| Setting | A mine rail in the main hall, with cheering goblins. |

### 6.16 Grix Ratwhistle

`goblin.grixRatwhistle` · Legendary · Countdown 6 · Attack 4 · HP 4 · Physical · Unique · Hero's Bane · Specialist (Ranger)

> He does not aim at you. He aims at the one behind you.

Purpose: the Goblin Specialist. Hero's Bane puts 1 Physical damage on the enemy Hero in each Start Phase, so a Goblin Deck can win without crossing the Board. Power 28, budget 28, deviation 0% ([ADR-0050](../adr/0050-a-base-rank-legendary-creature-card-is-a-specialist.md)).

| Field | Brief |
| --- | --- |
| Subject | A small, wiry Goblin ranger with a long nose, brass goggles and a whistle on a cord. |
| Pose | He kneels on a crate and aims a long, patched rifle over the viewer, past the front line. |
| Props | Long rifle, rat companions with tiny whistles, a range chart, a bent scope. |
| Gameplay cues | The shot goes past the nearest Unit to a distant banner to show Hero's Bane. Legendary: an orange gem and a heroic scene. |
| Silhouette hook | The long rifle and the tall goggles. |
| Humor note | The range chart has one entry: "hero, far". |
| Setting | A mine workshop with rails and hanging lamps. |

## 7. Feral Creature Cards

Identity: wild creatures of the peaks and the deep caves. They serve no people. Under the Accord, a wild creature that comes onto a marked lane field fights for the Hero who called it, for that one Battle. They are few, huge and slow: high Countdown, high Attack and HP. They Trample, regenerate and bring the cold. All values in this section are **provisional**. The 7 cards of the Wild Hunt Archetype got their values in issue #80 ([08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)).

Feral cards have no Countdown 1. Commons are Countdown 2 to 3, Uncommons 3 to 4, Rares 4 to 5 and Epics 6. A Feral figure wears no armor and carries no tools of a people. The art can show the lure that called it: bait, a horn or a torch.

### 7.1 Bristleback Boar

`feral.bristlebackBoar` · Common · Countdown 2 · Attack 3 · HP 6 · Physical · Swift · Trample

> It does not go around things.

Purpose: the only fast Feral Unit. Trample lets a kill also hit the Unit behind. Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A wild mountain boar with a ridge of stiff bristles. |
| Pose | It charges forward with its head down. |
| Props | Boards of a broken fence fly around it. |
| Gameplay cues | The broken fence shows Trample. The dust shows Swift. |
| Silhouette hook | The bristle ridge and the low head. |
| Humor note | An apple, the bait that called it, is stuck on one tusk. |
| Setting | A rocky mountain path. |

### 7.2 Crag Lizard

`feral.cragLizard` · Common · Countdown 2 · Attack 2 · HP 10 · Physical · Heavy · Bulwark 1

> It sat on this rock for a hundred years. Now it is your rock.

Purpose: a cheap Feral blocker with Bulwark. Power 15, budget 16, deviation -6.3%.

| Field | Brief |
| --- | --- |
| Subject | A large grey lizard with plates like rock. |
| Pose | It walks forward low, with its mouth open in a hiss. |
| Props | None. Snow on its back plates. |
| Gameplay cues | The rock plates show Bulwark. |
| Silhouette hook | The low wide body and the plated back. |
| Humor note | A small bird sits on its back, and the lizard does not know. |
| Setting | Grey cliffs with patches of snow. |

### 7.3 Frostfang Lynx

`feral.frostfangLynx` · Common · Countdown 2 · Attack 4 · HP 5 · Frost · Bleed 1

> You will not hear it. You will feel the cold first.

Purpose: a cheap Frost attacker that Freezes its target and makes it Bleeding, so that a healer or a Regenerate Unit heals less. Bleed is 1 up to Rare, 2 at Epic and 3 at Legendary ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). Power 17, budget 16, deviation +6.3%.

| Field | Brief |
| --- | --- |
| Subject | A white mountain lynx with long ear tufts and ice-blue fangs. |
| Pose | It jumps forward with its claws out. |
| Props | None. Frost breath and frosty claws. |
| Gameplay cues | The frost on its claws and breath shows Frost. The long claws show Bleed. |
| Silhouette hook | The ear tufts and the long jump. |
| Humor note | A lump of snow sits on its head after a jump through a snowbank. |
| Setting | A snowy ledge. |

### 7.4 Cave Bear

`feral.caveBear` · Common · Countdown 2 · Attack 3 · HP 10 · Physical · Heavy · Regenerate 1

> It woke up hungry. It is still waking up.

Purpose: a durable Feral front that heals 1 HP in each Start Phase. Power 16, budget 16, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A huge brown cave bear with sleepy eyes. |
| Pose | It walks forward on all fours out of a cave, half in a yawn. |
| Props | A honeycomb in its mouth: the bait. |
| Gameplay cues | Moss and old healed scars show Regenerate. |
| Silhouette hook | The big shoulder hump and the round head. |
| Humor note | It still has not opened both eyes. |
| Setting | A cave mouth with frost. |

### 7.5 Web Spitter

`feral.webSpitter` · Common · Countdown 3 · Attack 4 · HP 7 · Physical · Long-range · Regenerate 1

> Stay for dinner.

Purpose: a durable Feral Long-range Unit that heals. Power 19, budget 19, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A giant cave spider, round and furry, with many shiny eyes. Friendly cartoon shapes, not scary. |
| Pose | It spits a sticky web line forward. |
| Props | Web lines. A helmet that it caught hangs in a web. |
| Gameplay cues | The round, thick body shows high HP and Regenerate. The spit line shows Range. |
| Silhouette hook | The round body and the long arched legs. |
| Humor note | It looks proud of the caught helmet. |
| Setting | A dark cave with blue crystals. |

### 7.6 Boulder Tortoise

`feral.boulderTortoise` · Uncommon · Countdown 3 · Attack 0 · HP 11 · Physical · Wall · Bulwark 1 · Regenerate 2

> It moves for nobody. It hardly moves for itself.

Purpose: the Feral Wall. It heals 2 HP in each Start Phase. Power 20, budget 19, deviation +5.3%.

| Field | Brief |
| --- | --- |
| Subject | A giant mountain tortoise with a shell like a boulder. |
| Pose | It sleeps across a mountain pass. |
| Props | Moss and small trees on the shell. |
| Gameplay cues | The stone shell shows Bulwark. New moss that grows over cracks shows Regenerate. |
| Silhouette hook | A dome. |
| Humor note | A mountain goat stands on top of it. |
| Setting | A narrow mountain pass. |

### 7.7 Tailsweep Basilisk

`feral.tailsweepBasilisk` · Uncommon · Countdown 3 · Attack 3 · HP 6 · Physical · Pivot

> Look it in the eye? It looks at your ankles.

Purpose: the Feral Pivot Unit. Its tail hits Units behind it and next to it. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | A long, low basilisk with a heavy club tail. |
| Pose | Its body advances to the right. Its tail swings back. |
| Props | None. Rocks fly from the tail swing. |
| Gameplay cues | Pivot: the tail swing goes behind and to the side. |
| Silhouette hook | The long S-shaped body and the club tail. |
| Humor note | It looks bored while the rocks fly. |
| Setting | A cave floor with crystals. |

### 7.8 Cave Troll

`feral.caveTroll` · Uncommon · Countdown 3 · Attack 3 · HP 7 · Physical · Heavy · Regenerate 2

> Cut it. Wait. Cut it again.

Purpose: a durable Feral front that heals 2 HP in each Start Phase. Power 18, budget 19, deviation -5.3%.

| Field | Brief |
| --- | --- |
| Subject | A large grey cave troll with long arms and a small head. It is wild: no armor and no tribe marks. |
| Pose | It walks forward on its knuckles, with a stalactite as a club. |
| Props | A broken stalactite. |
| Gameplay cues | A cut on its arm that closes shows Regenerate. |
| Silhouette hook | The long arms and the bent back. |
| Humor note | It chews on a lost shield. |
| Setting | A damp cave. |

### 7.9 Crag Rhino

`feral.cragRhino` · Uncommon · Countdown 3 · Attack 4 · HP 5 · Physical · Trample

> The road ends where it stops.

Purpose: a large Trample attacker. Power 19, budget 19, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A woolly mountain rhino with a stone-grey horn. |
| Pose | It charges forward with its head low. |
| Props | One broken shield on its horn, and a second shield that flies behind it. |
| Gameplay cues | The two shields show Trample. |
| Silhouette hook | The big horn. |
| Humor note | An empty helmet spins in the air. |
| Setting | A high stony plain. |

### 7.10 Frost Elk Matriarch

`feral.frostElkMatriarch` · Uncommon · Countdown 3 · Attack 3 · HP 5 · Frost · Rally 1

> Where she walks, the herd follows.

Purpose: the Feral Rally Unit. Rally 1 gives the other friendly Units in her Lane +1 Attack. Her Frost hits Freeze. Power 20, budget 19, deviation +5.3%.

| Field | Brief |
| --- | --- |
| Subject | A tall old elk cow with antlers of ice. |
| Pose | She walks forward with her head high and calls. |
| Props | None. Breath mist from the call. |
| Gameplay cues | The call shows Rally. The ice antlers show Frost. |
| Silhouette hook | The wide ice antlers. |
| Humor note | Two young elk copy her pose behind her. |
| Setting | A frozen meadow. |

### 7.11 Avalanche Yeti

`feral.avalancheYeti` · Rare · Countdown 4 · Attack 4 · HP 5 · Physical · Trample

> It came down with the snow. The snow was the smaller problem.

Purpose: a Rare Trample attacker with high Attack. Power 22, budget 22, deviation 0%.

| Field | Brief |
| --- | --- |
| Subject | A big white yeti with long fur. |
| Pose | It charges forward through a wall of snow, with its arms wide. |
| Props | Ice crystals in its fur, a stolen scarf. |
| Gameplay cues | Snow and shields thrown to the sides show Trample. |
| Silhouette hook | The huge shoulders and the wide arms. |
| Humor note | The stolen scarf is much too small for it. |
| Setting | A snowy slope with an avalanche behind it. |

### 7.12 Woolly Mammoth

`feral.woollyMammoth` · Rare · Countdown 5 · Attack 3 · HP 8 · Physical · Heavy · Bulwark 1 · Trample

> It does not stop. Plan around it.

Purpose: a Rare front that also Tramples. Power 24, budget 25, deviation -4.0%.

| Field | Brief |
| --- | --- |
| Subject | A woolly mammoth with long curved tusks. |
| Pose | It walks forward with heavy steps, with its tusks low. |
| Props | A fence that broke over its tusks. |
| Gameplay cues | Thick matted fur with ice shows Bulwark. The broken fence shows Trample. |
| Silhouette hook | The high dome head and the long tusks. |
| Humor note | A bird's nest sits in its fur. |
| Setting | A glacier valley. |

### 7.13 Rimebreath Drake

`feral.rimebreathDrake` · Rare · Countdown 5 · Attack 3 · HP 6 · Frost · Flying

> Its breath is the weather.

Purpose: a Flying Frost attacker. Power 24, budget 25, deviation -4.0%. No Ranged Unit has Frost ([ADR-0025](../adr/0025-no-ranged-unit-has-frost-damage.md)).

| Field | Brief |
| --- | --- |
| Subject | A slim young ice drake with wide wings. |
| Pose | It flies forward and breathes a cone of frost. |
| Props | None. Icicles on its nose. |
| Gameplay cues | The wings show Flying. The frost breath shows Frost. |
| Silhouette hook | The wide wings and the long neck. |
| Humor note | Its own breath froze an icicle onto its nose. |
| Setting | High cliffs above the clouds. |

### 7.14 Mountain Colossus

`feral.mountainColossus` · Epic · Countdown 6 · Attack 2 · HP 8 · Physical · Heavy · Regenerate 2 · Trample

> The mountain stood up. Then it walked.

Purpose: the archetypal Feral Epic: a huge front that heals and Tramples. Power 27, budget 28, deviation -3.6%.

| Field | Brief |
| --- | --- |
| Subject | A wild, old giant of living rock and moss. No clothes and no tools. |
| Pose | It takes a huge step forward, with one fist down. |
| Props | Rubble that flies from its step. |
| Gameplay cues | New stone that grows over cracks shows Regenerate. The rubble shows Trample. Epic: a heroic scene under storm clouds. |
| Silhouette hook | The huge shoulders and the small head. |
| Humor note | A small village of birds lives on its shoulder. |
| Setting | A mountain pass under storm clouds. |

### 7.15 Old Frostmaw (draft)

`feral.oldFrostmaw` · Epic · Countdown 6 · Attack 3 · HP 6 · Frost · Unique · Trample · Bleed 2

> Every village has a story about it. Every story is too small.

Purpose: the named Feral Epic: a huge Frost attacker that Tramples, and its bite makes the target Bleeding. Bleed is 2 at Epic and 3 at Legendary ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). Its Common HP went from 14 to 13 to pay for Bleed. Then ADR-0020 lowered its Common Attack and HP. Power 29, budget 28, deviation +3.6%.

| Field | Brief |
| --- | --- |
| Subject | Old Frostmaw: a huge, old, white cave wyrm with no wings and a crown of icicles. |
| Pose | It comes out of an ice cave with its jaws open. |
| Props | Broken ice pillars. A very small hunting horn hangs from one tooth. |
| Gameplay cues | The ice breath shows Frost. The broken ice pillars show Trample. The open jaws and the long fangs show Bleed. Epic: a heroic scene. |
| Silhouette hook | The long neck and the icicle crown. |
| Humor note | The horn is the lure that called it. The hunter who blew it is gone. |
| Setting | A great ice cave. |

### 7.16 Gorehorn Red Maw

`feral.gorehornRedMaw` · Legendary · Countdown 6 · Attack 2 · HP 6 · Physical · Unique · Vampirism · Specialist (Priest)

> It eats what it kills. Then it keeps the leftovers.

Purpose: the Feral Specialist. Vampirism turns each Physical hit into HP, so a huge Feral Unit stays on the Board without a healer. Power 27, budget 28, deviation -3.6% ([ADR-0050](../adr/0050-a-base-rank-legendary-creature-card-is-a-specialist.md)).

| Field | Brief |
| --- | --- |
| Subject | A huge, shaggy red-furred beast with two forward horns and a wide, stained jaw. |
| Pose | It lowers its head and charges, and red light runs from its horns back into its chest. |
| Props | Broken cave bones, a trampled banner, red light threads. |
| Gameplay cues | The red threads from the wound to the beast show Vampirism. The heavy stance shows the high HP. Legendary: an orange gem and a heroic scene. |
| Silhouette hook | The two forward horns and the huge shoulders. |
| Humor note | It drags a very small, very bent dinner plate. |
| Setting | A deep cave mouth at dusk. |

## 8. Tokens

Tokens are not collectible Cards. They use the Rank of the Card or effect that makes them, and disappear when they die. Their Rank profiles and power values are **provisional**. The ID line of a Token gives its Race, so that its art uses the setting and the palette of that Race (1.1). A Token has no Base Rank: its art uses the Common detail, because it is cheap Lane mass. Each Token has the Base Speed 2 and no Speed Keyword, the same as each Unit ([ADR-0030](../adr/0030-keywords-set-speed-and-range-and-there-are-no-roles.md)): it appears behind the Unit that summons it, and it must get to the front.

### 8.1 Skeleton

`token.skeleton` · Undead · Physical · Swarm 1

| Rank | Attack | HP | Power |
| --- | ---: | ---: | ---: |
| Common | 1 | 1 | 4 |
| Uncommon | 1 | 2 | 5 |
| Rare | 2 | 2 | 7 |
| Epic | 2 | 3 | 8 |
| Legendary | 3 | 4 | 11 |

Purpose: cheap Lane mass that is weak alone. It has the Base Speed 2: the Skeleton appears behind the Unit that summons it, and a ground Unit stops only in an empty Square. With Speed 1, it cannot move while that Unit stays in its Square.

| Field | Brief |
| --- | --- |
| Subject | A small, eager skeleton soldier. |
| Pose | He advances with his sword held too high, and looks back at an ally for courage. |
| Props | A bucket helmet that covers one eye socket, a chipped sword, a round wooden lid as a shield and a pale teal neck cloth. |
| Gameplay cues | The small, thin body shows low HP. The look back to an ally shows Swarm. |
| Silhouette hook | The bucket helmet and the raised sword. |
| Humor note | He is brave only while his friends follow him. |
| Setting | A misty grave path. |

### 8.2 Restless Wisp

`token.restlessWisp` · Undead · Frost · Flying

| Rank | Attack | HP | Power |
| --- | ---: | ---: | ---: |
| Common | 1 | 1 | 10 |
| Uncommon | 1 | 2 | 11 |
| Rare | 2 | 2 | 13 |
| Epic | 2 | 3 | 14 |
| Legendary | 3 | 4 | 17 |

Purpose: a mobile Frost Token. It has the Base Speed 2, the same as each Token (8).

| Field | Brief |
| --- | --- |
| Subject | A small, teardrop-shaped spirit of pale teal light with a friendly face like a skull. |
| Pose | It floats forward above marsh water. |
| Props | A tiny rusted helmet on a short chain, a trail of ice and frost motes. |
| Gameplay cues | The float above the water shows Flying. The icy trail shows Frost. |
| Silhouette hook | The teardrop shape and the helmet on the chain. |
| Humor note | The helmet is all that stays of its old body, and it pulls it everywhere. |
| Setting | Misty marsh water in the Hollow Marches. |

## 9. Warrior Skill Cards

Identity: buffs and tempo. Physical, so the palette is neutral steel and leather.

### 9.1 War Drums

`warrior.warDrums` · Warrior · Uncommon · Countdown 2 · No target · Its effect improves with its Rank.

> Boom. Boom. Move faster.

| Field | Brief |
| --- | --- |
| Effect subject | A large war drum. Rings of sound go out from it. |
| Partial figure | Two strong arms in leather bracers hit the drum with sticks. |
| Action | The sticks hit the drum. Sound rings go out. One, two or three cards in the air near the drum glow and move faster. |
| Setting | A neutral battlefield. Small blurred soldier shapes march quickly to the right in the background. |
| Palette | Neutral steel and leather, warm wood. |

| Rank | Effect |
| --- | --- |
| Uncommon | The Countdown of 1 random card in your Hand goes down by 2. |
| Rare | The Countdown of 2 random cards in your Hand goes down by 2. |
| Epic | The Countdown of 3 random cards in your Hand goes down by 2. |
| Legendary | The Countdown of 3 random cards in your Hand goes down by 3. |

### 9.2 Shield Wall

`warrior.shieldWall` · Warrior · Common · Countdown 2 · A friendly Lane · Friendly Units in a Lane get Bulwark 1 at Common, 2 at Uncommon, 3 at Rare, 4 at Epic and 5 at Legendary for the next 2 enemy Turns.

> Lock shields and hold.

| Field | Brief |
| --- | --- |
| Effect subject | A line of plain round shields that lock together along a Lane. |
| Partial figure | A back view of arms and shoulders. The shields face to the right. Plain shields with no emblem. |
| Action | The shields lock together. A soft steel shine runs along the line. |
| Setting | A neutral battlefield. The line goes along a Lane of grey stone tiles. |
| Palette | Neutral steel and leather. |

### 9.3 Spear Throw

`warrior.spearThrow` · Warrior · Common · Countdown 2 · An enemy Unit · Deal 5 Physical damage at Common, 6 at Uncommon, 7 at Rare, 8 at Epic and 9 at Legendary.

> Aim for the loud one.

| Field | Brief |
| --- | --- |
| Effect subject | A spear in flight, with a motion trail. |
| Partial figure | A back view of a thrower who faces to the right. The arm is at the end of the throw. |
| Action | The spear flies to the right, to a far, dark silhouette that shouts with its mouth wide open. |
| Setting | A neutral battlefield. |
| Palette | Neutral steel and leather. |

### 9.4 Shoulder Charge

`warrior.shoulderCharge` · Warrior · Common · Countdown 2 · An enemy Unit · Deal 3 Physical damage at Common, 4 at Uncommon, 5 at Rare, 6 at Epic and 7 at Legendary. If it takes damage and survives, push it 1 Square, or 2 Squares at Legendary, back toward its Hero.

> Shoulders first. Questions later.

| Field | Brief |
| --- | --- |
| Effect subject | A plain steel pauldron that hits a dark armored silhouette, with a curved shock burst at the point of impact. |
| Partial figure | A side view, cropped at the neck: the shoulder, the upper arm and the back of a warrior in leather and a plain steel pauldron. The body leans low and runs to the right. No head shows. |
| Action | The shoulder hits the chest of a dark armored silhouette at the right. The silhouette lifts off its feet and slides back one stone tile to the right. Two short skid lines of dust on that tile show the push. Short motion lines go to the left behind the warrior. At Legendary, show the silhouette pushed two Squares. |
| Setting | A neutral battlefield, in a close, low view of the stone tiles of a Lane. |
| Palette | Neutral steel and leather, brown dust. |

### 9.5 Shield Bash

`warrior.shieldBash` · Warrior · Common · Countdown 2 · An enemy Unit · Deal 2 Physical damage at Common, 3 at Uncommon, 4 at Rare, 5 at Epic and 6 at Legendary. Friendly Units in its Lane get Bulwark 1 at Common, Uncommon and Rare, 2 at Epic and 3 at Legendary for the next enemy Turn.

> A shield is also a door that you can slam.

| Field | Brief |
| --- | --- |
| Effect subject | One plain heater shield of wood planks with a steel rim and a round steel boss, with no emblem. A heater shield has a flat top edge and two sides that curve down to a point at the bottom. The shield slams forward to the right. It is one heater shield, not round shields in a line. |
| Partial figure | A close, low side view from the left of the warrior. The shield is the nearest and largest object and fills the left half of the image. Its front face, with the boss, turns to the right and a little toward the viewer. The warrior is behind the shield: only the leather sleeve at the elbow and the edge of the left shoulder show past the left edge of the shield. The arm and the hand are behind the shield. They do not show on the front face of the shield and do not go through it. Real proportions: the shield is as tall as from the shoulder to the hip of the warrior, and the arm is normal human size next to it. |
| Action | One enemy stands at the right: a full-body, dark, low-detail silhouette of a soldier in plain armor, with both feet on the stone tiles. It holds one straight sword in both hands, up in front of its chest. The boss of the shield slams into the flat of the blade. The sword stays straight and in one piece, and the impact pushes it back against the chest of the enemy. The enemy staggers back to the right. A ring of steel shine goes out from the point of impact. Show no other figures. |
| Setting | A neutral battlefield. The stone tiles of a Lane go to the right. |
| Palette | Neutral steel and leather, warm wood. |

### 9.6 Cleave

`warrior.cleave` · Warrior · Uncommon · Countdown 3 · An enemy Unit · Deal 4 Physical damage to an enemy Unit and the next Square behind it. Damage by Rank: Uncommon 4, Rare 5, Epic 6, Legendary 7.

> One swing, two problems.

| Field | Brief |
| --- | --- |
| Effect subject | A wide, bright crescent trail of an axe swing that cuts across two dark silhouettes. The crescent is the largest shape in the image. |
| Partial figure | Two strong arms in leather bracers come in from the bottom-left corner. They grip a large two-handed axe at the end of a wide, flat swing to the right. |
| Action | The crescent trail goes from the axe head to the right, through two dark silhouettes that stand one behind the other on the same Lane. Both silhouettes reel back. No blood. |
| Setting | A neutral battlefield. The Lane goes to the right into the distance, so the second silhouette is smaller than the first. |
| Palette | Neutral steel and leather. Uncommon: a small brass trim on the axe head. |

### 9.7 Ground Slam

`warrior.groundSlam` · Warrior · Uncommon · Countdown 3 · An enemy Lane · Deal 2 Physical damage to all enemy Units in a Lane. Damage by Rank: Uncommon 2, Rare 3, Epic 4, Legendary 5.

> The ground agrees with me.

| Field | Brief |
| --- | --- |
| Effect subject | A long crack that runs through all the stone tiles of a Lane, with broken tiles that jump up and plumes of dust. |
| Partial figure | Two forearms in leather bracers come in from the bottom-left corner. The elbows are out of the image. The two fists in leather gauntlets hold the haft of a plain war hammer with a normal two-handed grip, as at the end of a downward swing with a sledgehammer: one fist at the end of the haft, the other fist one hand's width nearer the head. A long, bare part of the haft goes from the front fist to the head. Its head hits a stone tile in the foreground. |
| Proportion | Real human proportions and anatomy. Each fist is about half as wide as the hammer head. The haft is longer than a forearm. Each wrist is straight, in line with its forearm. The fingers close around the haft and the thumb closes over the fingers. |
| Action | The hammer hits the ground. The crack runs from the hammer head to the right along the full Lane into the distance. Small, dark, far silhouettes along the Lane lose their footing and fall as the tiles jump under them. |
| Setting | A neutral battlefield. The Lane is long and goes into the distance. |
| Palette | Neutral steel and leather, grey stone, brown dust. Uncommon: small brass bands on the hammer haft. |

### 9.8 Call to Arms

`warrior.callToArms` · Warrior · Rare · Countdown 3 · A friendly Lane · Friendly Units in a Lane get +4 Attack at Rare, +5 at Epic and +6 at Legendary until the end of your next Turn.

> One horn. Every blade answers.

| Field | Brief |
| --- | --- |
| Effect subject | A long, curved war horn, raised high and blown hard. Along the Lane in front of it, a row of soldiers lift their blades at the same moment, and each blade flashes with warm light. The horn and the row of raised blades are the two main shapes. No banners and no flags. |
| Partial figure | A back view from behind and to the left of a warrior, cropped at the waist, in the left third of the image. The warrior wears a closed plain steel helmet, a leather coat and a steel pauldron. Both hands hold the horn to the mouthpiece under the helmet, and the bell of the horn points up and to the right. |
| Proportion | Real human proportions and anatomy. The horn is as long as the warrior's arm. Five fingers on each hand. |
| Action | The horn sounds. Wide, soft, curved waves of warm light go out from the bell to the right, over the Lane. Four soldiers stand in a row along the Lane, in three-quarter back views, in closed plain helmets, and face to the right. As the waves reach them, they raise their swords and spears high together. Each raised blade catches a bright flash of light. Far at the right, small dark enemy silhouettes stop and step back. |
| Setting | A neutral battlefield in a low view behind the line. The Lane of grey stone tiles goes from the warrior to the right into the distance. |
| Palette | Neutral steel and leather, a dark brown horn, and warm white-gold flashes on the blades. Rare: gold bands on the horn and a gold trim on the warrior's pauldron. |

### 9.9 Expose Weakness

`warrior.exposeWeakness` · Warrior · Rare · Countdown 2 · An enemy Unit · An enemy Unit becomes Exposed 2: each Physical hit on it deals 2 more damage, after Bulwark, until the end of your next Turn. Exposed by Rank: Rare 2, Epic 3, Legendary 4.

> There. Under the strap. Hit there.

| Field | Brief |
| --- | --- |
| Effect subject | A weak point in the armor of a large, dark enemy: under the leather strap at the side of its breastplate, a zigzag crack in the steel plate glows rose-red from inside. A thin ring of rose-red light circles the crack, like an aim mark. The crack is the brightest shape in the image. |
| Partial figure | An over-the-shoulder view from behind and to the left of a warrior. The warrior is in the left foreground, cropped at the chest: the back of a closed plain steel helmet, a leather coat and a steel pauldron. The warrior's right arm points a plain sword straight at the crack. Only the sword and the gloved hand on its grip show past the shoulder. |
| Proportion | Real human proportions and anatomy. The hand on the grip is as wide as the sword guard. Five fingers on each hand. |
| Action | The enemy stands in the middle distance at the right, in a side view that faces to the left, toward the warrior. It is a full-body, dark, heavily armored silhouette with a closed helmet and no face. It raises a large axe high over its head with both arms, so its side under the arm is open, and the strap and the crack show. The sword tip points at the crack from far away and does not touch it. Thin rose-red lines of light go from the crack across the plate, so the whole plate looks weak. No blood, no wound and no skin. |
| Setting | A neutral battlefield, soft and out of focus behind the enemy. |
| Palette | Neutral steel and leather, with dark steel on the enemy and a rose-red glow in the crack, the color of a pink rose. Rare: a gold trim on the warrior's pauldron and on the sword guard. |

### 9.10 Onslaught

`warrior.onslaught` · Warrior · Epic · Countdown 2 · A friendly Lane · Each friendly Unit in a Lane takes one more action now: it moves and attacks, from the front Unit to the back Unit. At Legendary, each gets +1 Attack until the end of your next Turn.

> Again! Before they stand!

| Field | Brief |
| --- | --- |
| Effect subject | A whole line of armored soldiers that rushes to the right along a Lane, one behind the other, and crashes a second time into enemies that are still on the ground. It is a large, heroic charge, with dust and motion that fill the full width of the image. The line of soldiers is the largest shape. |
| Partial figure | A commander at the bottom left, seen from behind and to the left, cropped at the waist. The commander wears a closed steel helmet with a short crest and a dark cloak, and points a sword high and forward to the right, with the mouth of the helmet toward the line, as if to shout. |
| Proportion | Real human proportions and anatomy. The commander is a little smaller than the nearest soldier in the line. Five fingers on each hand. |
| Action | A wide view from the side and a little above. The Lane of grey stone tiles goes from the bottom left to the right into the distance. Five soldiers in closed plain helmets, steel and leather, with plain round shields and swords, run at full speed to the right in a line along the Lane. Each soldier leans forward, with the shield in front. Long motion lines and trails of brown dust go to the left behind each soldier. At the right end, the front soldier slams a shield into dark enemy silhouettes that are on one knee and try to stand. The enemies fall back to the right. Broken spears and dropped shields of the enemy lie on the tiles. No blood. |
| Setting | A neutral battlefield in a wide, dramatic view. Dark storm clouds open, and a shaft of sunlight from the upper left lights the line of soldiers. |
| Palette | Neutral steel and leather, brown dust, a dark storm sky and warm sunlight, with dark enemies. Epic: a heroic scene, with gold trim on the commander's helmet crest, cloak clasp and sword guard. |

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

### 10.2 Frost Bolt

`mage.frostBolt` · Mage · Common · Countdown 2 · An enemy Unit · Deal 3 Frost damage to an enemy Unit.

> Stay a while.

| Field | Brief |
| --- | --- |
| Effect subject | A sharp bolt of ice with frost crystals around it. |
| Partial figure | One hand points two fingers to the right. The bolt comes from the fingers. |
| Action | The bolt flies to the right and hits the feet of a far, dark silhouette. Ice holds the feet to the ground. |
| Setting | A neutral battlefield with frost on the grass. |
| Palette | Light blue frost. |

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

### 10.4 Frost Shards

`mage.frostShards` · Mage · Common · Countdown 2 · An enemy Unit · Deal 2 Frost damage to an enemy Unit and the next Square behind it.

> Small, sharp and very cold.

| Field | Brief |
| --- | --- |
| Effect subject | A fan-shaped spray of many small, sharp ice shards. It is many small shards, not one bolt. |
| Partial figure | One open hand in a robe sleeve at the bottom left, palm up, seen from below. The fingers flick open as if they throw seeds. |
| Action | The shards spray from the palm to the right in a fan and hit two dark silhouettes that stand one behind the other on the same Lane. A crust of frost covers the front of both silhouettes, and they stop in place. |
| Setting | A neutral battlefield, in a low view close to the grass. Frost on the grass under the spray. |
| Palette | Light blue frost. |

### 10.5 Frost Wave

`mage.frostWave` · Mage · Uncommon · Countdown 3 · An enemy Lane · Deal 2 Frost damage to all enemy Units in a Lane.

> The whole lane stands still.

| Field | Brief |
| --- | --- |
| Effect subject | A low, curling wave of ice that freezes as it runs down a full Lane and leaves a road of frozen tiles behind it. |
| Partial figure | Two hands in robe sleeves press flat on the stone tiles at the bottom left, palms down. Frost spreads from the fingers. No staff. |
| Action | The ice wave starts at the hands and runs to the right along all the stone tiles of the Lane into the distance. Small, dark, far silhouettes along the Lane stand frozen in ice up to the knees. |
| Setting | A neutral battlefield. The Lane is long and goes into the distance. |
| Palette | Light blue frost and white ice. Uncommon: a small silver trim on the sleeve cuffs. |

### 10.6 Spark

`mage.spark` · Mage · Common · Countdown 1 · An enemy Unit · Deal 2 Lightning damage to an enemy Unit. Lightning makes it Paralyzed: it does not attack in its next action.

> Hold still. You have no choice.

| Field | Brief |
| --- | --- |
| Effect subject | One small, fast spark of lightning: a short, thin, jagged bolt that jumps from a finger snap to an enemy. It is small and quick, not a large blast. The bright snap at the fingers and the stiff enemy are the two main shapes. |
| Partial figure | One hand in a plain robe sleeve at the bottom left, close to the viewer, in a side view. The thumb and the middle finger have just snapped. A small bright star of light flashes at the fingertips. |
| Proportion | Real human proportions and anatomy. The hand is normal human size, no larger than one quarter of the image width. Five fingers. |
| Action | The short bolt jumps level to the right over the grass, with a thin motion streak behind it, and hits the raised arm of a dark silhouette in the middle distance at the right. The silhouette swings a club over its head, but it stops stiff in the middle of the swing: small thin arcs of lightning crawl over its arm and the club, and its fingers spread open. The club does not hit. |
| Setting | A neutral battlefield in a low view. A dark, calm afternoon sky, so that the small spark is bright against it. |
| Palette | Electric cyan-white lightning, the color of a neon tube, with a white core. Not purple and not pale blue. Plain cloth on the sleeve and a dark silhouette. |

### 10.7 Arc Lightning

`mage.arcLightning` · Mage · Uncommon · Countdown 3 · An enemy Unit · Deal 3 Lightning damage to an enemy Unit and to the enemy Units in the same Column in the Lanes next to it. Damage by Rank: Uncommon 3, Rare 4, Epic 5, Legendary 5. Lightning makes each Unit Paralyzed: it does not attack in its next action.

> It never strikes once.

| Field | Brief |
| --- | --- |
| Effect subject | A chain of lightning that jumps from one enemy to the next: one bolt hits the middle enemy, then forks into two arcs that jump to the enemy on each side of it. The three linked arcs are the largest shape in the image. |
| Partial figure | A back view of a robed figure from behind and to the left, cropped at the waist, in the left foreground. The hood is up. One arm points forward to the right with the fingers spread open, and the bolt comes from the fingers. No staff. |
| Proportion | Real human proportions and anatomy. The figure is cropped at the waist and takes no more than one third of the image width. Five fingers on the hand. |
| Action | Three Lanes of grey stone tiles go side by side to the right, with grass between them. On each Lane, one dark, armored silhouette stands at the same distance: one near Lane, one middle Lane and one far Lane, so they stand in a line across the Lanes. The main bolt goes from the fingers to the middle silhouette. From it, one arc jumps to the near silhouette and one arc jumps to the far silhouette. All three silhouettes stand stiff, with their weapons stopped in the air and thin arcs that crawl over their armor. |
| Setting | A neutral battlefield in a wide, low view. A dull grey sky. |
| Palette | Electric cyan-white lightning, the color of a neon tube, with a white core. Not purple and not pale blue. A plain dark robe and dark silhouettes. Uncommon: a small silver trim on the sleeve cuff. |

### 10.8 Wildfire

`mage.wildfire` · Mage · Rare · Countdown 4 · An area · Select an area of 2 Lanes × 2 Columns. For 2 Turns, in each of your End Phases, each enemy Unit in the area takes 2 Fire damage. Damage by Rank: Rare 2, Epic 3, Legendary 3.

> The grass had it coming.

| Field | Brief |
| --- | --- |
| Effect subject | A square patch of the battlefield that burns: a carpet of low, hungry flames on the grass and on the stone tiles, with a clear straight edge. Inside the square, everything burns. Outside it, the grass is still green and calm. The burning square on the ground is the largest shape. It is an area on the ground, not a ball of fire and not a wave. |
| Partial figure | One hand in a robe sleeve at the top left, palm down, with the fingers open. It has just let one small glowing ember fall. |
| Proportion | Real human proportions and anatomy. The hand is normal human size, no larger than one fifth of the image width. Five fingers. |
| Action | A high view from above and to the left, so the square shape of the area reads on the ground. The square covers two Lanes of grey stone tiles and the grass between them, two Squares long. The ember falls into the dry grass at the near corner, and the fire runs from there over the full square. Three dark silhouettes stand inside the square. They jump and hop from foot to foot, and lift their boots from the flames. Thin smoke rises. No blood. |
| Setting | A neutral battlefield on a dry, warm day, with long dry grass. |
| Palette | Orange-red fire with yellow at the base of the flames, black scorched grass inside the square, and green grass outside it. Rare: fine gold embroidery on the sleeve cuff. |

### 10.9 Thunderstorm

`mage.thunderstorm` · Mage · Rare · Countdown 5 · No target · Deal 3 Lightning damage to 3 random different enemy Units. Damage by Rank: Rare 3, Epic 4, Legendary 4. Lightning makes each Unit Paralyzed: it does not attack in its next action.

> Somebody always gets struck.

| Field | Brief |
| --- | --- |
| Effect subject | A dark, heavy storm cloud that fills the top third of the image, with three bolts of lightning that strike down from it at three different places on the battlefield. The bolts come from above. They are the brightest shapes in the image. |
| Partial figure | A small robed figure at the bottom left, seen from behind, cropped at the waist. The hood is up. One arm raises a plain wooden staff high to the cloud. A thin thread of lightning links the tip of the staff to the cloud. |
| Proportion | Real human proportions and anatomy. The figure is small, no larger than one fifth of the image height. Five fingers on the hand. |
| Action | A wide view of the enemy side of the battlefield, a little from above. Six dark, armored silhouettes stand far apart on the Lanes of grey stone tiles. Three of them, at random places (one near, one in the middle distance and one far), are struck: each one stands stiff and bright inside its bolt, with small arcs that jump over the armor. One more silhouette holds a shield over its head and looks up in fear. The other two are not struck. No blood. |
| Setting | A neutral battlefield under a storm. Wind bends the grass. The light comes from the bolts and from a thin gap in the clouds at the upper left. |
| Palette | Electric cyan-white lightning, the color of a neon tube, with a white core. Not purple and not pale blue. A dark slate-grey storm cloud, dark silhouettes and a plain dark robe. Rare: a gold trim on the staff head. |

### 10.10 Blizzard

`mage.blizzard` · Mage · Epic · Countdown 6 · An area · Select an area of 3 Lanes × 2 Columns. For 2 Turns, in each of your End Phases, each enemy Unit in the area takes 2 Frost damage. Damage by Rank: Epic 2, Legendary 3. Frost makes each Unit Frozen.

> Nobody goes anywhere today.

| Field | Brief |
| --- | --- |
| Effect subject | A huge, howling blizzard that turns over a wide part of the battlefield: a wall of white snow and ice wind that turns in a circle, over three Lanes at the same time, and stands on a deep field of snow with a clear edge. Inside it, all is white snow and ice. Outside it, the grass is green. It is the largest and most dramatic Mage image, much larger than the Frost Wave. |
| Partial figure | A mage at the bottom left, seen from behind and to the left, cropped at the waist. The hood is up, and a long cloak blows to the right in the wind. Both arms are out in front, with open hands, as if they turn the storm. No staff. |
| Proportion | Real human proportions and anatomy. The mage is a little larger than one quarter of the image height. Five fingers on each hand. |
| Action | A wide view from the side and a little above. Three Lanes of grey stone tiles go from the left to the right into the distance. Over the middle of the image, the blizzard covers all three Lanes, two Squares long. Snow lies deep on the tiles, and its edge is a clear line on the grass. Five dark, armored silhouettes stand inside the blizzard. They are frozen in the middle of a step, with ice up to the knees, frost on the helmets and long icicles on their weapons. One enemy at the edge of the snow tries to pull one boot out of the ice. No blood. |
| Setting | A neutral battlefield in a wide, dramatic view. Dark grey-blue storm clouds above the blizzard. At the upper left, a cold shaft of sunlight lights the mage. |
| Palette | Light blue frost, white snow and white ice, with a grey-blue storm sky and dark silhouettes. Epic: a heroic scene, with silver trim on the cloak and on the sleeve cuffs, and small ice crystals that glitter in the light. |

## 11. Ranger Skill Cards

Identity: control and Hero damage. Physical, so the palette is neutral steel and leather, with forest-green fletching as the Ranger mark on each card. The partial figure is a hooded archer, seen from behind or as hands only, with no pointed ears, no tusks and no other sign of a Race.

### 11.1 Pinning Shot

`ranger.pinningShot` · Ranger · Common · Countdown 2 · An enemy Unit · Deal 6 Physical damage to an enemy Unit. If it takes damage and survives, it becomes Entangled.

> Stay right there.

| Field | Brief |
| --- | --- |
| Effect subject | An arrow with green fletching that goes through a plain rope net and pins the net to the ground. |
| Partial figure | Hands that release a bowstring, seen from behind, at the left edge of the image. |
| Action | The arrow pins the net over the feet of a far, dark silhouette at the right. The view is close: the net, the arrow shaft and the green fletching fill the bottom half of the image. Plain ropes only, with no vines and no leaves. |
| Setting | A neutral battlefield. |
| Palette | Neutral steel and leather, rough brown rope, with green fletching. |

### 11.2 Warning Shot

`ranger.warningShot` · Ranger · Common · Countdown 3 · An enemy Unit · Deal 8 Physical damage at Common, 9 at Uncommon, 10 at Rare, 12 at Epic and 14 at Legendary to an enemy Unit. If it survives, push it 2 Squares back toward its Hero, also when it takes no damage.

> The next one will not miss.

| Field | Brief |
| --- | --- |
| Effect subject | An arrow with green fletching that hits the ground in front of a far, dark silhouette. |
| Partial figure | A back view of a hooded archer at full draw, facing to the right. |
| Action | The arrow hits the ground. A burst of dirt pushes the silhouette back, and it stumbles to the right. |
| Setting | A neutral battlefield. A Lane of grey stone tiles shows the distance between the arrow and the silhouette. |
| Palette | Neutral steel and leather, brown dirt, with green fletching. |

### 11.3 Long Shot

`ranger.longShot` · Ranger · Uncommon · Countdown 4 · The enemy Hero · Deal 12 damage to the enemy Hero.

> Over their heads, into the Hero.

| Field | Brief |
| --- | --- |
| Effect subject | A single large arrow with green fletching in a high arc over the battlefield, with a long, bright arc trail. The arrow and its trail are the largest shape in the image and are easy to read at 128 px tall. |
| Partial figure | A back view of a hooded archer who aims high, facing to the right, small in the bottom-left corner. The archer has a correct archery stance for a high shot. The aiming line goes 45 degrees up and to the right. The bow arm extends straight along this line, with the hand closed around the bow grip. The draw hand pulls the string back to the cheek, and the draw elbow is behind the head, on the same line. The bow is at a right angle to the aiming line, so its top tip leans back to the left. It is not vertical. The string is taut. The archer has already nocked the next arrow. It sits on the bow grip, is nocked on the string, and lies on the aiming line, with its arrowhead pointing 45 degrees up and to the right. Five fingers on each hand. |
| Action | The arc trail starts at the bow grip, just in front of the nocked arrowhead, not at a tip of the bow. Its first part continues the aiming line, 45 degrees up and to the right. Then it curves over the upper half of the image to the right. The flying arrow is near the top of the arc. Far below and to the right, the small blurred Units of the Lanes and a far, dark, caped silhouette, backlit, with no crown. The silhouette stands on a small rise behind the enemy Lanes and is larger than the Units. No banner. |
| Setting | A neutral battlefield, seen from far, with all the Lanes. |
| Palette | Neutral steel and leather, with green fletching. Uncommon: a small brass trim on the bow. |

### 11.4 Quick Shot

`ranger.quickShot` · Ranger · Common · Countdown 1 · An enemy Unit · Deal 5 Physical damage at Common, 6 at Uncommon, 7 at Rare, 8 at Epic and 9 at Legendary to an enemy Unit.

> Draw, loose, draw again.

| Field | Brief |
| --- | --- |
| Effect subject | A fast arrow with green fletching that flies level across the image, with sharp, straight white speed lines. It is a flat, straight shot, not an arc. |
| Partial figure | The hands of a hooded archer at the left, in a side view. The aiming line is level, to the right. The bow is vertical, at a right angle to the aiming line, and the string still vibrates (a small motion blur). The draw hand has already left the string and pulls the next arrow from a quiver at the hip. Five fingers on each hand. |
| Action | The speed lines start at the bow grip and go level to the right. The arrow hits the shoulder of a dark silhouette at middle distance at the right, with a small spark. |
| Setting | A neutral battlefield, in a level view at the height of a Unit. |
| Palette | Neutral steel and leather, with green fletching. |

### 11.5 Harrying Shot

`ranger.harryingShot` · Ranger · Common · Countdown 2 · An enemy Unit · Deal 4 Physical damage to an enemy Unit and 4 damage to the enemy Hero at Common; 5 and 4 at Uncommon; 6 and 4 at Rare; 7 and 5 at Epic; 8 and 6 at Legendary.

> One for the beast. One for its master.

| Field | Brief |
| --- | --- |
| Effect subject | Two arrows with green fletching from one bow, on two trails that split like a fork. One trail ends in a dark beast. The other goes past the beast to its master. |
| Partial figure | At the left edge, the bow hand of a hooded archer, seen from behind. The bow is vertical and the string still vibrates. |
| Action | Both trails start at the bow grip. The lower trail goes down and to the right into the shoulder of a large, dark, snarling beast silhouette in the middle of the image. The upper trail goes straight to the right, over the back of the beast, to a small, far, dark, caped silhouette on a rise at the top right. The beast is the largest silhouette. No blood. |
| Setting | A neutral battlefield. |
| Palette | Neutral steel and leather, with green fletching. |

### 11.6 Barbed Arrow

`ranger.barbedArrow` · Ranger · Uncommon · Countdown 3 · An enemy Unit · Deal 5 Physical damage to an enemy Unit. If it takes damage and survives, it becomes Bleeding 3.

> It comes out the hard way.

| Field | Brief |
| --- | --- |
| Effect subject | A close view of a barbed arrowhead in flight: a black iron head with hooked barbs that glint. The arrowhead is the largest shape in the image. |
| Partial figure | Far behind at the left, small and blurred: the hands of a hooded archer that release the string. |
| Action | The arrow flies to the right, with its head and green fletching in sharp focus. At the right, a second barbed arrow is stuck in a dark wooden shield of a far silhouette. Its barbs hook into the wood and split it. No blood and no wound. |
| Setting | A neutral battlefield, out of focus behind the arrow. |
| Palette | Neutral steel and leather, black iron, with green fletching. Uncommon: a small brass ring behind the arrowhead. |

### 11.7 Skybreaker

`ranger.skybreaker` · Ranger · Uncommon · Countdown 3 · An enemy Unit · Deal 7 Physical damage at Uncommon, 9 at Rare, 11 at Epic and 14 at Legendary to an enemy Unit. If it is a Flying Unit and survives, it becomes Grounded 2, also when it takes no damage: it does not fly for 2 Turns.

> What flies can fall.

| Field | Brief |
| --- | --- |
| Effect subject | An arrow with green fletching that goes through the wing of a dark winged silhouette high in the air. A burst of torn feathers comes out of the wing. |
| Partial figure | A hooded archer, low at the bottom left, in a side view from behind. The bow points steeply up and to the right. The archer has just released. |
| Action | The arrow trail starts at the bow and goes up to the right. The hit wing folds, and the silhouette falls down to the right, toward the stone tiles of the Lane. A small shadow on the tiles shows where it will land. |
| Setting | A neutral battlefield with an open sky. The stone tiles of the Lane are at the bottom of the image. |
| Palette | Neutral steel and leather, dark feathers, with green fletching. Uncommon: a small brass trim on the bow tips. |

### 11.8 Venom Arrow

`ranger.venomArrow` · Ranger · Rare · Countdown 4 · An enemy Unit · Deal 4 Physical damage at Rare, 5 at Epic and 6 at Legendary. If it survives, it gains 5 Poison stacks at Rare, 6 at Epic and 7 at Legendary, also when it takes no damage.

> The arrow is small. The poison is not.

| Field | Brief |
| --- | --- |
| Effect subject | A small, thin arrow with green fletching, stuck in the shoulder plate of a large, dark, armored soldier. From the point where the arrow goes in, glowing yellow-green poison spreads over the dark armor in a large web of veins, and thick yellow-green drops drip from it. The poison shape is much larger than the arrow. The image has one arrow only. |
| Partial figure | Far behind at the left, small and out of focus: a back view of a hooded archer who lowers a bow just after the shot. The archer is the only figure at the left. No hand in the foreground, and no hand holds an arrow. |
| Action | The soldier is close, in the foreground at the right, in a side view that faces to the left, toward the archer. It wears a closed helmet, with no face. It is cropped below the chest, so its arms and hands are out of the image. The arrow shaft points back to the left, toward the archer, so the shot clearly comes from the archer. The soldier staggers a little. Thin yellow-green wisps rise from the poison veins. No blood, no wound and no skin. |
| Setting | A neutral battlefield, soft and out of focus behind the soldier. |
| Palette | Neutral steel and leather, with green fletching and a bright yellow-green poison accent, the color of a fresh lime. The poison is brighter and more yellow than the fletching. The armor is dark and in shadow, so the poison is the brightest shape. Rare: a thin gold band on the arrow shaft behind the fletching, and gold trim on the archer's bow. |

### 11.9 Hunter's Focus

`ranger.huntersFocus` · Ranger · Rare · Countdown 4 · A friendly Unit · Give a friendly Unit +4 Attack at Rare, +5 at Epic and +6 at Legendary, and +1 Range, until the end of your next Turn. A Melee Unit attacks as a Ranged Unit.

> Breathe out. Then let go.

| Field | Brief |
| --- | --- |
| Effect subject | A thin ring of green-gold light, like the reticle of a hunter's sight, that closes around the bow hand and the eyes of one friendly archer. From the ring, a straight, faint ruled line of the same light goes far to the right, past a row of small wooden range stakes in the ground, and ends one stake farther than the others. The ring and the line are the brightest shapes and are easy to read at 128 px tall. |
| Partial figure | A back view of a hooded archer, seen from behind and a little to the left, cropped at the knees, in the left half of the image. The archer is calm and still, at full draw, and aims level to the right. The bow arm extends straight along the aiming line, with the hand closed around the bow grip. The bow is vertical, at a right angle to the aiming line. The draw hand holds the string at the cheek, under the hood. One arrow with green fletching is nocked and lies on the aiming line. Five fingers on each hand. |
| Action | A soft green-gold glow rises from the archer's shoulders and bow, as from a blessing on a friendly Unit, not from a hit. The ruled line of light starts at the arrowhead and goes level to the right. Four short wooden stakes stand in a row along a Lane of grey stone tiles, at equal distances. The line of light goes past the last stake and ends at a small bright point in the far, empty Lane. No enemy, no hit and no blood. The image has one arrow only, and it is still on the string. |
| Setting | A neutral battlefield at dawn, in a low, level view at the height of the archer's eyes. The background is soft and out of focus, so the ring and the line are the sharpest shapes. |
| Palette | Neutral steel and leather, with green fletching and a green-gold light. Rare: gold inlay along the bow limbs and a gold trim on the bracer. |

### 11.10 Rain of Arrows

`ranger.rainOfArrows` · Ranger · Epic · Countdown 6 · An enemy Lane · Deal 3 Physical damage to all enemy Units in a Lane at Epic, and 5 at Legendary. Each Unit that takes damage and survives becomes Entangled.

> Look up. Too late.

| Field | Brief |
| --- | --- |
| Effect subject | A huge volley of hundreds of arrows with green fletching that comes down on a whole Lane. The volley is a dense, dark, wide wedge against a bright sky. It fills the top two thirds of the image and is the largest shape. The arrowheads catch the sunlight. |
| Partial figure | A small back view of a hooded archer at the bottom left, on a rise, with the bow raised high just after the release. The cloak blows to the right. Behind the archer, on the same rise, the small dark shapes of more archers lower their bows. Five fingers on each hand. |
| Action | The volley comes from the upper left and comes down to the right, onto a long Lane of grey stone tiles that goes from the middle of the image into the distance at the right. Four small, dark silhouettes stand in a row along the Lane. They look up and raise their arms and shields. The first arrows are already stuck in the tiles around their feet and pin their cloaks and boots to the ground, so they cannot move. No ropes, no vines and no blood. |
| Setting | A neutral battlefield in a wide, dramatic view. Dark storm clouds open, and a shaft of sunlight from the upper left lights the volley and the Lane. |
| Palette | Neutral steel and leather, with green fletching, a dark storm sky and warm sunlight. Epic: a heroic scene, with gold trim on the archer's bow and cloak clasp. |

## 12. Priest Skill Cards

Identity: healing, protection and Holy damage. The palette is Holy gold-yellow light with a sun motif. The partial figure has plain cream-white linen sleeves and a rope belt, and a small gold sun pendant on a cord is the Priest mark on each card. It has no blue cloth, no staff and no sun disc, so it does not look like Dawn Cleric or the Mage, and it has no sign of a Race. A friendly Unit in the image is a back view of a soldier in a closed full helmet and a cloak.

### 12.1 Mend

`priest.mend` · Priest · Common · Countdown 2 · A friendly Unit · Heal 8 HP to a friendly Unit. Heal by Rank: Common 8, Uncommon 10, Rare 12, Epic 14, Legendary 16.

> Rise. You are not done yet.

| Field | Brief |
| --- | --- |
| Effect subject | A warm stream of gold light that flows into a wounded soldier and lifts the soldier up. |
| Partial figure | An open hand in a cream-white linen sleeve at the left edge of the image, palm to the right, with the gold sun pendant on a cord at the wrist. |
| Action | The stream of light goes from the palm to the right, into the back of a soldier at the right. The soldier, seen from behind in a closed full helmet and a cloak, gets up from one knee. A cut on the soldier's arm closes in the light. |
| Setting | A neutral battlefield. |
| Palette | Holy gold-yellow light, with a few small soft green-white plus-shaped heal motes around the soldier. |

### 12.2 Smite

`priest.smite` · Priest · Common · Countdown 2 · An enemy Unit · Deal 3 Holy damage to an enemy Unit. If it dies, it does not come back with Rebirth.

> No armor hides you from the light.

| Field | Brief |
| --- | --- |
| Effect subject | A thick, vertical shaft of sunlight that strikes straight down through heavy armor. |
| Partial figure | A raised hand in a cream-white linen sleeve at the left edge of the image, with the gold sun pendant on a cord at the wrist. |
| Action | The shaft of sunlight comes straight down from the sky, vertical, not slanted. It hits a far, dark, heavily armored silhouette at the right of the image. The light shines through the armor: gold light comes out of the seams and through the plates. No thrown object and no weapon. |
| Setting | A neutral battlefield. |
| Palette | Holy gold-yellow light, with dark steel on the silhouette. |

### 12.3 Sanctuary

`priest.sanctuary` · Priest · Uncommon · Countdown 3 · A friendly Unit · A friendly Unit gets Ward 9: it absorbs the next 9 damage. Ward by Rank: Uncommon 9, Rare 11, Epic 13, Legendary 15.

> Stand within the light.

| Field | Brief |
| --- | --- |
| Effect subject | A clear dome of gold light over a soldier, on a circle of gold light on the ground. The dome is light only: no steel, no shield shape. |
| Partial figure | A hand in a cream-white linen sleeve at the left edge of the image, with the gold sun pendant on a cord at the wrist. |
| Action | A ribbon of light goes from the hand to the right and forms the dome over a soldier, seen from behind in a closed full helmet and a cloak. A dark enemy blade comes in from the right and stops on the dome. The light ripples where the blade hits it. |
| Setting | A neutral battlefield. The gold circle lies on the grey stone tiles of a Lane. |
| Palette | Holy gold-yellow light. Uncommon: a small brass trim on the sun pendant and on the sleeve cuff. |

### 12.4 Blessing of Light

`priest.blessingOfLight` · Priest · Common · Countdown 1 · A friendly Unit · A friendly Unit gets Ward 4: it absorbs the next 4 damage. Ward by Rank: Common 4, Uncommon 5, Rare 6, Epic 7, Legendary 8.

> A little light goes a long way.

| Field | Brief |
| --- | --- |
| Effect subject | A rounded heater shield of gold light with a small sun mark at its center. The shield floats in the air in front of the soldier's chest, a short distance from the body. Nothing holds it: it is not on an arm and not in a hand. It is about as wide as the soldier's shoulders. The shield is light only: no metal, no rivets and no rim. A thin gold glow outlines the soldier's armor. No dome. |
| Partial figure | Only a hand and a forearm in a cream-white linen sleeve, from the left edge of the image. The fingertips touch the back of the soldier's left shoulder. The gold sun pendant on a cord hangs from the wrist. |
| Action | A three-quarter back view from behind and to the left of the soldier. The soldier, in a closed full helmet and a cloak, stands at the center-right of the image, from the head to the knees, and faces to the right. Gold light goes from the fingertips into the shoulder, runs along the armor and comes out in front of the soldier, where the shield of light forms. The shield is at the right of the soldier, between the soldier and the battlefield. Its front faces to the right, at an angle to the viewer, so the sun mark shows. |
| Setting | A neutral battlefield, in a calm moment before a fight. The camera is at the height of the soldier's chest. |
| Palette | Holy gold-yellow light, with plain steel and a grey cloak on the soldier. |
| Proportion | Real human proportions and anatomy. The hand is at the same distance from the viewer as the soldier, so it is normal human size: about as wide as the soldier's helmet. No large arm or sleeve in the foreground. The soldier has two arms at the sides, and the cloak hangs straight down the back. |

### 12.5 Radiant Strike

`priest.radiantStrike` · Priest · Common · Countdown 2 · An enemy Unit · Deal 2 Holy damage to an enemy Unit. Heal 2 HP to each friendly Unit in its Lane.

> Light that cuts. Light that mends.

| Field | Brief |
| --- | --- |
| Effect subject | A thin crescent of gold light that flies to the right and cuts a dark silhouette, and a soft wave of gold light that comes back from the hit. |
| Partial figure | A hand in a cream-white linen sleeve comes in from the bottom-left corner, at the end of a flat sweep with the edge of the hand forward. The gold sun pendant on a cord swings from the wrist. |
| Action | The crescent of light flies from the hand to the right and cuts across a dark silhouette far down the Lane. From the hit, a soft gold glow runs back along the stone tiles of the same Lane to two friendly soldiers in the foreground, seen from behind in closed full helmets and cloaks. A few small soft green-white plus-shaped heal motes rise around them. No blood. |
| Setting | A neutral battlefield. The Lane goes to the right into the distance. |
| Palette | Holy gold-yellow light, with small green-white heal motes. |

### 12.6 Penance

`priest.penance` · Priest · Uncommon · Countdown 2 · An enemy Unit · Deal Holy damage to an enemy Unit, equal to the Attack of that Unit.

> Your own strength, returned to you.

| Field | Brief |
| --- | --- |
| Effect subject | A huge dark brute silhouette whose own raised weapon turns into gold light. The light cracks through the weapon and runs back down the arms into its body. |
| Partial figure | A small hand in a cream-white linen sleeve at the bottom left holds up the gold sun pendant on its cord, toward the brute. The pendant shines. |
| Action | The brute, at the right, fills most of the image and raises a huge dark club to strike. A thin ray goes from the pendant to the club. Gold cracks of light open in the club, and the light flows back along the arms into the brute's chest. The brute recoils. No thrown object and no shaft of light from the sky. |
| Setting | A neutral battlefield, in a low view that makes the brute look huge. |
| Palette | Holy gold-yellow light, with dark steel and dark wood on the brute. Uncommon: a small brass trim on the sun pendant and on the sleeve cuff. |

### 12.7 Prayer of Healing

`priest.prayerOfHealing` · Priest · Uncommon · Countdown 3 · A friendly Lane · Heal 11 HP to each friendly Unit in a Lane. Heal by Rank: Uncommon 11, Rare 13, Epic 15, Legendary 17.

> One prayer for the whole line.

| Field | Brief |
| --- | --- |
| Effect subject | A long line of soft gold light that rises from all the stone tiles of a Lane, and three friendly soldiers in a row in that light. |
| Partial figure | Two hands in cream-white linen sleeves, clasped in prayer at the bottom left. The cord of the gold sun pendant winds around the fingers, and the pendant hangs below the hands. |
| Action | A view from behind, down the Lane. The light starts at the clasped hands and runs to the right along the full Lane into the distance. Three soldiers stand in a row in the light, seen from behind in closed full helmets and cloaks. They stand up straight, and small soft green-white plus-shaped heal motes rise around each of them. |
| Setting | A neutral battlefield. The Lane is long and goes into the distance. |
| Palette | Holy gold-yellow light, with small green-white heal motes. Uncommon: a small brass trim on the sun pendant and on the sleeve cuffs. |

### 12.8 Cleanse

`priest.cleanse` · Priest · Rare · Countdown 3 · A friendly Unit · Remove all Debuffs from a friendly Unit. Then heal 8 HP to it. Heal by Rank: Rare 8, Epic 9, Legendary 10.

> Wash it away. Stand clean.

| Field | Brief |
| --- | --- |
| Effect subject | Gold light that pours down over a soldier like clear water from a spring, and washes dark Debuffs off the armor. The falling light is the largest shape in the image. |
| Partial figure | Only a hand and a forearm in a cream-white linen sleeve, from the upper-left edge of the image, held above the soldier's helmet with the palm down. The gold sun pendant on a cord hangs from the wrist. |
| Action | A three-quarter back view from behind and to the left of the soldier. The soldier, in a closed full helmet and a cloak, stands at the center-right of the image and faces to the right. The light falls from the palm onto the helmet and the shoulders, runs down the armor, and splashes in soft ripples of light on the stone tiles at the feet. The light washes off three Debuffs: a crust of pale blue ice on one shoulder cracks and falls away in pieces, a dark thorny vine around the legs snaps, and dark yellow-green drops run off the armor into the ground. Under the light, the armor is clean and bright. A few small soft green-white plus-shaped heal motes rise around the soldier. No wound and no skin. |
| Setting | A neutral battlefield. |
| Palette | Holy gold-yellow light, with small green-white heal motes. The pieces of ice, the vine and the dark drops are small and dull, so the gold light is the brightest shape. Rare: fine gold embroidery on the sleeve cuff, and fine gold rays around the sun pendant. |
| Proportion | Real human proportions and anatomy. The hand is at the same distance from the viewer as the soldier, so it is normal human size: about as wide as the soldier's helmet. No large arm or sleeve in the foreground. |

### 12.9 Unbroken Vow

`priest.unbrokenVow` · Priest · Rare · Countdown 2 · A friendly Unit · A friendly Unit gets Steadfast: when damage would bring it to 0 HP, it stays at 1 HP.

> Not today. Not like this.

| Field | Brief |
| --- | --- |
| Effect subject | A battered soldier who takes a huge hit and does not fall. A round seal of gold light with short sun rays lies on the stone tiles under the soldier's boots and holds the soldier in place. |
| Partial figure | Only a hand and a forearm in a cream-white linen sleeve, from the left edge of the image. The hand grips the back of the soldier's left shoulder firmly. The gold sun pendant on a cord hangs from the wrist. |
| Action | A three-quarter back view from behind and to the left of the soldier, in a low view. The soldier, in a closed full helmet and a torn cloak, stands at the center of the image and faces to the right. A huge dark axe of a large dark silhouette at the right hits the soldier's raised shield. The shield cracks, and the soldier is pushed back: the back knee bends and the boots skid, but the soldier stays standing. Gold light goes from the hand into the shoulder, runs down the body and into the seal under the boots. Broken spears lie on the tiles around the soldier. No blood. |
| Setting | A neutral battlefield, late in a hard fight, with dust in the air. |
| Palette | Holy gold-yellow light, with dented plain steel and a dark grey torn cloak on the soldier, and dark steel on the enemy. Rare: fine gold embroidery on the sleeve cuff, and fine gold rays around the sun pendant. |
| Proportion | Real human proportions and anatomy. The hand is at the same distance from the viewer as the soldier, so it is normal human size: about as wide as the soldier's helmet. No large arm or sleeve in the foreground. The soldier has two arms: one holds the shield and one holds a sword low. |

### 12.10 Aegis of Dawn

`priest.aegisOfDawn` · Priest · Epic · Countdown 6 · A friendly Lane · Each friendly Unit in a Lane gets Ward 8: it absorbs the next 8 damage. Ward by Rank: Epic 8, Legendary 10.

> The first light guards the whole line.

| Field | Brief |
| --- | --- |
| Effect subject | One long, low vault of clear gold light, like a dome stretched along a whole Lane, over four soldiers in a row. It stands on a long line of gold light on the stone tiles. The vault is light only: no steel, no shield shapes. It is the largest shape in the image and is much larger than the dome of one soldier. |
| Partial figure | A small figure at the bottom left, seen from behind: two arms in cream-white linen sleeves raised high to the sky, with open hands. The rope belt shows, and the gold sun pendant on its cord swings on the chest. No staff. |
| Action | A wide view from the side and a little above. The Lane goes from the middle left of the image to the right. Four soldiers stand in a row along the Lane, in three-quarter back views, in closed full helmets and cloaks, and face to the right. Low on the horizon at the upper left, the dawn sun breaks through the clouds. Its first rays go through the raised hands and flow on to the right as a ribbon of light that forms the vault over the full Lane. From the right, a dark volley of enemy arrows and a burst of dark fire hit the vault and break on it. The light ripples at each hit. No blood. |
| Setting | A neutral battlefield at dawn, in a wide, dramatic view. The sky at the left is warm and bright, and the sky at the right is still dark with storm clouds. |
| Palette | Holy gold-yellow light, with warm dawn colors, plain steel and grey cloaks on the soldiers, and dark arrows and dark fire from the enemy. Epic: a heroic scene, with gold embroidery on the sleeve cuffs and a gold sun pendant with fine rays. |

## 13. When cards change

- When you add a card or a Token to `cards.ts`, add its entry here before you make the art. For a Creature Card or a Token, also add its subject line to `scripts/creature-art/subjects.ts`. For a Skill Card, the brief must have the fields Effect subject, Partial figure, Action, Setting and Palette: `bun skill:prompts` fails without them.
- When you change a name or flavor text in the Message Catalog, look at the entry here again. The image must still agree with the text.
- When a Keyword or a Damage Type of a card changes, update the gameplay cues. For a Creature Card or a Token, look at its subject line in `scripts/creature-art/subjects.ts` again. For a Skill Card, look at its brief again.
