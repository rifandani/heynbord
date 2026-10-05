# 10 — Card Concepts

This document gives the art brief for each card in the Battle slice (`packages/rules/src/content/cards.ts`). Use it for step 1 of the AI art workflow ([05 — Art and Audio Direction, 5.3](./05-art-direction.md#53-steps-for-each-card)). The card names and the flavor text come from the `en-US` Message Catalog. The art must agree with them.

## 1. Rules for all cards

- **One image for each card.** Rank belongs to one card copy, and the card frame shows it. The image does not change with Rank.
- **Base Rank sets the detail.** Common: plain, worn gear and a simple scene. Uncommon: some trim and one extra detail. Rare: ornate gear with gold or metal trim. Epic: a heroic scene with dramatic composition and more detail. The style and the light do not change.
- **Light.** From the upper left in all images.
- **Size.** Portrait 3:4 (card art is 768 × 1024).
- **Gender.** The flavor text sets the gender of some figures. For the other figures, this document selects a gender, so that the set has a balanced mix.
- **Creature Cards** use the template in 5.2. They make 2 exports: card art and a Unit cut-out. The silhouette must be clear at 128 px tall.
- **Skill Cards** use the template in 5.2.1. They show the effect with a partial figure that has no Race. They have no Unit cut-out.

### 1.1 Settings

| Group | Setting | Palette |
| --- | --- | --- |
| Human | A river town: stone bridges, timber houses, blue and gold banners, a calm river | Royal blue and gold. Steel, cloth banners, wood |
| Orc | Red badlands: dusty mesas, dry ground, bone and hide totems | Burnt orange and dark red. Leather, fur, rough iron |
| Skill Cards | A neutral battlefield: green grass and a Lane of grey stone tiles, with no banners | The Damage Type color (Fire: orange-red, Frost: light blue). Physical: neutral steel and leather |

## 2. Human Creature Cards

Identity: proud and stubborn humans and stout folk of the river towns. They love banners and long speeches. They hold the line.

### 2.1 Militia Recruit

`human.militiaRecruit` · Frontliner · Common · Countdown 1 · Attack 2 · HP 4 · Melee · Physical

> "I brought my own pitchfork!"

| Field | Brief |
| --- | --- |
| Subject | A young farm man, thin, with a big eager smile. Not a soldier yet. |
| Pose | He stands tall and proud, and holds a pitchfork forward like a spear. His free hand points at the pitchfork. |
| Props | A pitchfork, a padded jacket that is too large, a cooking pot as a helmet, a small blue arm band. |
| Gameplay cues | The cheapest card: very plain gear, nothing ornate. |
| Silhouette hook | The pot helmet and the tall pitchfork. |
| Humor note | He is very proud of a farm tool. |
| Setting | A muddy village road at the edge of the river town. |

```text
young eager farm man with a big proud smile, padded jacket too large for him, cooking pot as a helmet, holding a pitchfork forward like a spear and pointing at it,
Human of Heynbord, standing tall and proud, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, muddy village road at the edge of a river town, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.2 Shieldbearer

`human.shieldbearer` · Frontliner · Common · Countdown 2 · Attack 1 · HP 8 · Melee · Physical · Armor 1

> Her shield has more dents than a tin pot.

| Field | Brief |
| --- | --- |
| Subject | A strong, calm woman soldier with a wide stance. |
| Pose | She crouches a little behind a large round shield, with a short sword low at her side. |
| Props | A large round shield with many dents and a faded blue and gold paint, a short sword, a simple steel cap, a mail shirt. |
| Gameplay cues | Armor 1: the shield is the main shape. Low Attack: the sword is small and low. |
| Silhouette hook | The large round shield that covers most of her body. |
| Humor note | The shield has many visible dents, but she is not worried. |
| Setting | A stone bridge over the river. |

```text
strong calm woman soldier, mail shirt and simple steel cap, large round shield covered in many dents with faded paint, short sword held low,
Human of Heynbord, slight crouch behind the shield, wide stance, full body, centered,
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
Human of Heynbord, aiming pose, full body, centered,
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
Human of Heynbord, ready guard pose about to strike back, full body, centered,
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
Human of Heynbord, singing pose, full body, centered,
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
Human of Heynbord, galloping charge through splashing water, full body, centered,
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
| Pose | She looks back over her shoulder while her glaive sweeps out to the side. |
| Props | A glaive, a large iron ring of keys at her belt, a long blue coat over mail, a gold gate badge. |
| Gameplay cues | Pivot: she watches behind and to the side, and the weapon sweeps sideways. |
| Silhouette hook | The sideways glaive and the ring of keys. |
| Humor note | She sees everything, also behind her. |
| Setting | A large town gate with a portcullis. |

```text
tall sharp-eyed woman gate guard, long blue coat over mail, gold gate badge, large iron ring of keys at her belt, glaive sweeping out to the side,
Human of Heynbord, looking back over her shoulder while sweeping the glaive sideways, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, large river town gate with a portcullis, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 2.8 Iron Bulwark

`human.ironBulwark` · Frontliner · Epic · Countdown 6 · Attack 5 · HP 17 · Melee · Physical · Armor 2 · Retaliation

> A wall that complains about the weather.

| Field | Brief |
| --- | --- |
| Subject | An old stout-folk man: short, very broad and strong. A grey beard comes out under his helmet. |
| Pose | He stands firm behind a tower shield and frowns up at a small rain cloud. |
| Props | Very heavy full plate with gold trim, a tall tower shield with short spikes, a heavy mace. A small rain cloud rains only on him. |
| Gameplay cues | Armor 2: the heaviest armor in the set. Retaliation: spikes on the shield. Epic: a heroic scene with dramatic composition, and the most ornate human armor in the set. |
| Silhouette hook | A wide block shape: the tower shield and the very broad body. |
| Humor note | He is like a wall, but he complains about a small rain cloud. |
| Setting | A stone town wall in light rain. |

> **Art to-do:** The card changed from Rare to Epic. The current illustration uses the Rare style (ornate gear with gold trim). Make a new illustration with an Epic scene in the next art pass.

```text
old stout-folk man, short and very broad, grey beard under a heavy helmet, very heavy full plate armor with ornate gold trim, tall spiked tower shield, heavy mace, frowning up at a small rain cloud that rains only on him,
Human of Heynbord, standing firm behind the shield, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, royal blue and gold palette,
light from the upper left, stone river town wall in light rain, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

## 3. Orc Creature Cards

Identity: orc tribes of the badlands, and the beasts that fight with them. Fast, loud and always hungry. They rush the enemy Hero.

### 3.1 Badland Pup

`orc.badlandPup` · Runner · Common · Countdown 1 · Attack 3 · HP 2 · Speed 2 · Melee · Physical

> Small, loud and already biting.

| Field | Brief |
| --- | --- |
| Subject | A young badland wolf pup with very big ears and big paws. |
| Pose | It jumps forward with its mouth open, ready to bite. |
| Props | A spiked leather collar that is too big for it, orange war paint stripes. |
| Gameplay cues | High Attack and low HP: small body, big teeth. Speed 2: a jump with dust behind it. |
| Silhouette hook | The big ears and the open mouth. |
| Humor note | It is very small, but it acts very fierce. |
| Setting | Dusty red ground in the badlands. |

```text
young badland wolf pup with very big ears and big paws, spiked leather collar too big for it, orange war paint stripes, mouth open ready to bite,
Orc of Heynbord, leaping forward with dust behind it, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, dusty red badlands ground, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.2 Scrap Raider

`orc.scrapRaider` · Runner · Common · Countdown 2 · Attack 3 · HP 3 · Speed 2 · Melee · Physical · Heroic 1

> Everything shiny is his now.

| Field | Brief |
| --- | --- |
| Subject | A thin, fast orc man with a big grin. |
| Pose | He runs forward with a cleaver and carries a full sack over his shoulder. |
| Props | A cleaver, a sack full of shiny things (spoons, pans, a small bell), many stolen rings and necklaces, scrap-metal armor. |
| Gameplay cues | Speed 2: a running pose. Heroic 1: he looks past the viewer, at a bigger prize. |
| Silhouette hook | The large sack on his back. |
| Humor note | He wears many stolen shiny things, also a spoon as an earring. |
| Setting | A badland trail. |

```text
thin fast orc man with a big grin, scrap-metal armor, many stolen rings and necklaces, a spoon as an earring, cleaver in one hand, large sack full of shiny spoons and pans over his shoulder,
Orc of Heynbord, running forward, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, red badlands trail, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.3 Ember Shaman

`orc.emberShaman` · Shooter · Common · Countdown 3 · Attack 3 · HP 5 · Range 3 · Fire

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
Orc of Heynbord, throwing pose, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, badland camp at dusk with a campfire, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.4 Howling Charger

`orc.howlingCharger` · Striker · Uncommon · Countdown 3 · Attack 4 · HP 5 · Speed 2 · Melee · Physical · Charge

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
Orc of Heynbord, charging forward at full speed, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, open red badlands, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.5 Skyreaver

`orc.skyreaver` · Runner · Uncommon · Countdown 3 · Attack 3 · HP 4 · Speed 2 · Melee · Physical · Flying · Heroic 1

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
Orc of Heynbord, flying with wings fully spread, diving forward, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, badland sky above red mesas, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.6 Pack Stalker

`orc.packStalker` · Striker · Uncommon · Countdown 2 · Attack 3 · HP 4 · Speed 2 · Melee · Physical · Pivot

> It always knows where you are. Mostly behind you.

| Field | Brief |
| --- | --- |
| Subject | A lean striped hyena with a sloped back. |
| Pose | It crouches low and turns its head to look back over its shoulder, with a sly grin. |
| Props | A leather harness with small bone charms, orange paint marks. |
| Gameplay cues | Pivot: it turns to the side and back, ready to attack there. |
| Silhouette hook | The sloped back and the head turned back. |
| Humor note | It grins as if it knows a secret about you. |
| Setting | Tall dry grass in the badlands. |

```text
lean striped hyena with a sloped back, leather harness with small bone charms, orange paint marks, sly grin, head turned to look back over its shoulder,
Orc of Heynbord, low stalking crouch, full body, centered,
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
Orc of Heynbord, stepping forward through the broken door, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, broken fort door in the badlands, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

### 3.8 Warchief Grukka

`orc.warchiefGrukka` · Striker · Epic · Countdown 6 · Attack 8 · HP 12 · Speed 2 · Melee · Physical · Charge · Heroic 2

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
Orc of Heynbord, leaping down from a rock into a heroic charge, full body, centered,
painterly fantasy card illustration, bright warm light, clean silhouette,
soft brush texture, burnt orange and dark red palette,
light from the upper left, badland cliff with tribe banners and war drums behind him, simple low-contrast background,
portrait 3:4 composition, no text, no frame
```

## 4. Warrior Skill Cards

Identity: buffs and tempo. Physical, so the palette is neutral steel and leather.

### 4.1 War Drums

`warrior.warDrums` · Warrior · Common · Countdown 2 · No target · The Countdown of 2 random cards in your Hand goes down by 1.

> Boom. Boom. Move faster.

| Field | Brief |
| --- | --- |
| Effect subject | A large war drum. Rings of sound go out from it. |
| Partial figure | Two strong arms in leather bracers hit the drum with sticks. |
| Action | The sticks hit the drum. Two sound rings go out. Two cards in the air near the drum glow and move faster. |
| Setting | A neutral battlefield. Small blurred soldier shapes march quickly in the background. |
| Palette | Neutral steel and leather, warm wood. |

```text
large wooden war drum with sound rings rippling out, two glowing playing cards nearby,
two strong arms in leather bracers striking the drum with sticks, mid-strike,
Heynbord Warrior skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, neutral steel and leather accents,
neutral battlefield with green grass and a lane of grey stone tiles, blurred marching shapes in the background, portrait 3:4 composition, no text, no frame
```

### 4.2 Shield Wall

`warrior.shieldWall` · Warrior · Common · Countdown 2 · A friendly Lane · Friendly Units in a Lane get Armor 1 for 2 Turns.

> Lock shields and hold.

| Field | Brief |
| --- | --- |
| Effect subject | A line of plain round shields that lock together along a Lane. |
| Partial figure | A back view of arms and shoulders behind the shields. Plain shields with no emblem. |
| Action | The shields lock together. A soft steel shine runs along the line. |
| Setting | A neutral battlefield. The line goes along a Lane of grey stone tiles. |
| Palette | Neutral steel and leather. |

```text
a long line of plain round steel shields locking together edge to edge along a lane, a soft steel shine running along the line,
back view of arms and shoulders holding the shields, no emblems,
Heynbord Warrior skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, neutral steel and leather accents,
neutral battlefield with green grass and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

### 4.3 Spear Throw

`warrior.spearThrow` · Warrior · Uncommon · Countdown 3 · An enemy Unit · Deal 4 Physical damage to an enemy Unit.

> Aim for the loud one.

| Field | Brief |
| --- | --- |
| Effect subject | A spear in flight, with a motion trail. |
| Partial figure | A back view of a thrower. The arm is at the end of the throw. |
| Action | The spear flies to a far, dark silhouette that shouts with its mouth wide open. |
| Setting | A neutral battlefield. |
| Palette | Neutral steel and leather. Uncommon: a small brass trim on the spear. |

```text
a spear with a brass trim flying straight with a motion trail toward a distant dark silhouette shouting with its mouth wide open,
back view of a thrower with the arm fully extended at the end of the throw,
Heynbord Warrior skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, neutral steel and leather accents,
neutral battlefield with green grass and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

## 5. Mage Skill Cards

Identity: area damage. The palette is the Damage Type color.

### 5.1 Fireball

`mage.fireball` · Mage · Common · Countdown 3 · An enemy Unit · Deal 3 Fire damage to an enemy Unit and the next Square behind it.

> A warm welcome.

| Field | Brief |
| --- | --- |
| Effect subject | A large fireball, with a long tail of flame. |
| Partial figure | Two open hands in robe sleeves push the fireball forward. |
| Action | The fireball flies forward. Its tail covers two stone tiles of the Lane. |
| Setting | A neutral battlefield. |
| Palette | Orange-red fire, with warm light on the hands. |

```text
large fireball with a long tail of flame flying forward over two grey stone tiles,
two open hands in robe sleeves pushing the fireball forward, warm light on the hands,
Heynbord Mage skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, orange-red fire accents,
neutral battlefield with green grass and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

### 5.2 Frost Bolt

`mage.frostBolt` · Mage · Common · Countdown 2 · An enemy Unit · Deal 2 Frost damage to an enemy Unit.

> Stay a while.

| Field | Brief |
| --- | --- |
| Effect subject | A sharp bolt of ice with frost crystals around it. |
| Partial figure | One hand points two fingers forward. The bolt comes from the fingers. |
| Action | The bolt hits the feet of a far, dark silhouette. Ice holds the feet to the ground. |
| Setting | A neutral battlefield with frost on the grass. |
| Palette | Light blue frost. |

```text
sharp bolt of ice with frost crystals flying forward, a distant dark silhouette with its feet frozen to the ground,
one hand pointing two fingers forward with the bolt leaving the fingertips,
Heynbord Mage skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, light blue frost accents,
neutral battlefield with green grass touched by frost and a lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

### 5.3 Flame Wave

`mage.flameWave` · Mage · Uncommon · Countdown 4 · An enemy Lane · Deal 2 Fire damage to all enemy Units in a Lane.

> The whole lane gets a turn.

| Field | Brief |
| --- | --- |
| Effect subject | A long, low wave of fire that rolls down a full Lane. |
| Partial figure | A back view of a robed silhouette that sweeps a staff from side to side. |
| Action | The wave starts at the staff and goes along all the stone tiles of the Lane to the far end. |
| Setting | A neutral battlefield. The Lane is long and goes into the distance. |
| Palette | Orange-red fire. Uncommon: a small gold trim on the staff. |

```text
a long low wave of fire rolling down a full lane of grey stone tiles into the distance,
back view of a robed silhouette sweeping a staff with a small gold trim from side to side,
Heynbord Mage skill, painterly fantasy card illustration, bright warm light,
light from the upper left, soft brush texture, orange-red fire accents,
neutral battlefield with green grass and a long lane of grey stone tiles, portrait 3:4 composition, no text, no frame
```

## 6. When cards change

- When you add a card to `cards.ts`, add its entry here before you make the art.
- When you change a name or flavor text in the Message Catalog, look at the entry here again. The image must still agree with the text.
- When a Keyword or a Damage Type of a card changes, update the gameplay cues and the prompt.
