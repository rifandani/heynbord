# Hearthvale Storyboard

Status: version 2, a cinematic remake of the trial. The text, lore and shots below replace version 1. They need the owner's review, the human listening review and the Player checks at the end of this page. The trial design is in [Region Story Scenes](./region-story-scenes.md).

The opening, the Boss scene and the ending each have 5 Story Moments. Each moment is one 9-second fframes clip. The action finishes at 5 seconds. Seconds 5 to 9 are a seamless 4-second loop, so the picture stays alive while the Player reads. The Player controls reading time. Proper names keep their spelling in both Locales.

## Story spine

The Region tells one local adventure and opens one mystery.

- **Local adventure:** Baron Brassbelly closes the roads of Hearthvale. You open them again, from the Muddy Ford to Brassbelly Hall.
- **Mystery:** The Baron pays his sellswords with gold coins. The coins are red stone under gold paint, and the orders came under a seal that nobody knows: three lanes, cut through. Someone wants to break the Accord. The painted stone points to the Red Mesas.

The Red Mesas plot already has Boss Snikkit, who pays Orcs with rocks that he paints gold ([Campaign Stages](./14-campaign-stages.md)). The clue therefore points to a real place and a real habit in the next Region. It does not say that Snikkit is the patron. The seal owner stays unknown.

## Lore added in version 2 (draft)

These facts are story text only. They add no item, currency, reward or Battle rule.

| Fact | Where it appears | Note |
| --- | --- | --- |
| The war before the Accord burned the world almost to ash. | Opening 1 | Expands [GDD 3.1](./03-game-design.md#31-premise). |
| The Lanekeepers drew three lanes of light. | Opening 2 | Explains why a Stage has 3 Lanes. The Accord Seal is a circle with three lanes. |
| The first lane battle under the Accord was in Hearthvale. | Opening 3 | Makes the Region the symbolic start of the journey. |
| Hearthvale's roads carry bread to every town in Heynbord. | Opening 3 | Gives the closed roads a cost for everybody. |
| The Baron pays his sellswords in gold, and nobody knows its source. | Opening 4 | Plants the mystery before the first Battle. |
| The coins are red stone with gold paint. | Ending 2, 3 | Connects to Snikkit's painted rocks in the Red Mesas. |
| The orders came at night under a seal of three lanes cut through. | Ending 4 | The mark of the unknown enemy of the Accord. Keep it unexplained until a later Region. |

## Shared direction

- Address the Hero as "you" and "kamu". The Hero stays outside the frame.
- Keep the narration and dialogue outside the video, so both Locales use the same clips. The only words in the video are the proper names HEARTHVALE and BARON BRASSBELLY.
- Use the existing paintings and card art: the Hearthvale and Red Mesas Region Maps, Orc card art, and the Baron's figure from the Dungeon 3 painting. Graded light, fog, fire, particles and drawn props are made in code.
- One focal movement at a time. Each moment has its own motion idea; no moment reuses the camera move of the moment before it.
- With reduced motion, show the final poster of each moment and the same text.

## Opening

### 1. The burning age

**English:** Long ago, the peoples of Heynbord went to war. The war burned for so long that the world almost turned to ash.

**Indonesian:** Dahulu kala, bangsa-bangsa Heynbord saling berperang. Perang itu berkobar begitu lama hingga dunia nyaris menjadi abu.

**Shot:** Black. Embers rise. The Hearthvale map burns into view under a red sky, with smoke and heat haze. Two walls of spear and banner silhouettes march in from the left and the right. They meet at 3.6 s in a white flash and a shock ring.

**Loop:** Rising embers, smoke, flickering firelight.

**Sound:** Fire bed and low drums. One deep impact on the flash.

### 2. The Accord

**English:** Then the Lanekeepers drew three lanes of light and wrote the Accord. Since that day, every war is fought in the lanes, by the same rules.

**Indonesian:** Lalu para Lanekeeper menggambar tiga jalur cahaya dan menulis Accord. Sejak hari itu, setiap perang terjadi di jalur, dengan aturan yang sama.

**Shot:** The ash goes dark. Three golden lines cut across the dark, each led by a spark. A seal of rings and runes draws itself around them. At 3.4 s the seal flashes and ash turns to golden light.

**Loop:** The rune rings turn; golden motes drift up.

**Sound:** Rising shimmer, then a bright impact on the flash.

### 3. Hearthvale

**English:** The first lane battle was fought in Hearthvale. Today, its roads carry bread to every town in Heynbord.

**Indonesian:** Pertempuran jalur pertama terjadi di Hearthvale. Kini, jalan-jalannya membawa roti ke setiap kota di Heynbord.

**Shot:** The camera dives through clouds into a golden morning over the Hearthvale map. Birds cross the valley, the river glitters and sun rays fall on the fields. The title HEARTHVALE settles in gold.

**Loop:** Sun rays, river glints, drifting clouds at the edges.

**Sound:** Wind whoosh through the clouds, then the main theme.

### 4. The Baron

**English:** Now Baron Brassbelly holds those roads. His outlaws and Orc sellswords stop every cart. He pays them in gold. Where does he get it?

**Indonesian:** Kini Baron Brassbelly menguasai jalan-jalan itu. Bandit dan tentara bayaran Orc miliknya menghadang setiap kereta. Ia membayar mereka dengan emas. Dari mana emas itu?

**Shot:** A storm rolls over the valley and the light turns cold. The Baron deals his cards from the hall: four Orc sellsword cards fly down to the road, flip and burn red. Lightning. The Baron rises in the foreground with a red rim light, and his name plate appears.

**Loop:** Rain, far lightning, red card glow.

**Sound:** Thunder, a card whoosh for each card, a war-drum hit when the Baron appears.

### 5. Your road

**English:** You are a new Hero. Start at the Muddy Ford, and take the road back one battle at a time.

**Indonesian:** Kamu adalah Hero baru. Mulailah dari Muddy Ford, dan rebut kembali jalan itu, satu pertempuran demi satu pertempuran.

**Shot:** The storm thins. A gold banner drops onto the Muddy Ford with a ring of dust. A line of gold fire runs up the Trail; the ten clearings light one by one while the camera follows it to Brassbelly Hall, which pulses red.

**Loop:** The banner waves; the clearings pulse; the hall glows.

**Sound:** Banner impact, rising run, a short heroic phrase.

## Boss

The Boss scene plays when the Player selects Fight on Stage 1-10 for the first time. It is a conversation: Baron Brassbelly talks, and you answer. Each Story Moment has one to three lines. Continue shows the next line; the clip changes only at the next moment. After the last line, Fight starts the Battle. Skip also starts the Battle.

The Baron talks too much, and he is proud of it. His motive is greed: Hearthvale's bread makes everyone rich except him, so he puts a toll on every cart. He also has a patron that he never met, who pays in "good, heavy gold" and wants the roads closed. The Player learns in the ending that the gold is painted stone, so his boast becomes the joke. The ending line "For once, the Baron has nothing to say" answers this scene.

In the lines below, `Baron:` and `You:` are speaker labels. The game shows them as name plates, with the Hero portrait for `You:`. A line with no label is narration.

### 1. The hall wakes

**English:** At the end of the road stands Brassbelly Hall. Its torches light one by one. Someone expects you. / Baron: Open the gates! Our famous guest has walked a long way to see me.

**Indonesian:** Di ujung jalan berdiri Brassbelly Hall. Obor-obornya menyala satu per satu. Seseorang sudah menunggumu. / Baron: Buka gerbangnya! Tamu terkenal kita sudah berjalan jauh untuk menemuiku.

**Shot:** Night storm. The camera climbs the last hill of the Trail to Brassbelly Hall. Torches catch fire in a chain along the palisade, from the left wall to the right. The windows glow, a red banner drops on each side of the steps, and the gate opens: a bar of warm light grows on the steps. Lightning shows the hat roof in silhouette.

**Loop:** Rain, torch flicker, embers, the gate light breathes.

**Sound:** Torch whoosh for the chain, thunder, a heavy wooden gate.

### 2. The Baron

**English:** Baron: So you are the Hero who broke my toll gates, burned my camp and scared off my Orcs. Do you know what that cost me? / You: Less than you took from Hearthvale.

**Indonesian:** Baron: Jadi kamu Hero yang merusak gerbang tolku, membakar kemahku, dan menakuti Orc-Orc-ku. Kamu tahu berapa kerugianku? / You: Masih lebih sedikit daripada yang kamu ambil dari Hearthvale.

**Shot:** Inside the hall. Two red curtains pull apart. A shaft of light falls, and the Baron steps forward into it, with a heavy settle and a puff of dust. His hat crest draws itself in gold behind him. He flicks a gold coin; it spins high, flashes in the light and falls back to him.

**Loop:** Dust in the light shaft, chandelier flicker, the crest shimmers, the Baron breathes.

**Sound:** Heavy cloth, a deep hit when he lands, one coin flick.

### 3. The toll

**English:** Baron: Hearthvale feeds all of Heynbord. Every loaf rolls out on my roads, and what rolls back to me? Crumbs! / Baron: So now every cart pays the Baron. Fair is fair. / You: The bread belongs to the people who bake it, Baron. The roads belong to everyone.

**Indonesian:** Baron: Hearthvale memberi makan seluruh Heynbord. Setiap roti melintas di jalanku, dan apa yang kembali padaku? Remah-remah! / Baron: Jadi sekarang setiap kereta membayar sang Baron. Adil, kan? / You: Roti itu milik orang yang memanggangnya, Baron. Jalan itu milik semua orang.

**Shot:** The Region Map at dusk. Bread carts roll out on the roads. Five red wax stamps with the Baron's hat slam down on the roads, one after another; each cart stops at its stamp. Coins jump from the stopped carts and fly up to the hall in gold arcs.

**Loop:** Coins keep flying to the hall, the stamps pulse red.

**Sound:** One heavy stamp for each seal, coins.

### 4. The friend

**English:** You: Orc sellswords cost a fortune. Where does a bandit get so much gold? / Baron: From a friend with deep pockets. No name, no face. Just good, heavy gold, delivered at night. / Baron: My friend wants the roads closed. I want to be rich. Everybody wins!

**Indonesian:** You: Tentara bayaran Orc itu mahal. Dari mana seorang bandit mendapat emas sebanyak itu? / Baron: Dari seorang teman yang kaya raya. Tanpa nama, tanpa wajah. Hanya emas yang bagus dan berat, dikirim pada malam hari. / Baron: Temanku ingin jalan-jalan ditutup. Aku ingin kaya. Semua senang!

**Shot:** A dark desk at night, under a window with a thin moon. Violet smoke gathers into a tall hooded figure with no face. A heavy sack slides out of the smoke onto the desk. It falls open, and gold coins spill toward the camera. The candle flame bends away from the figure, and the figure breaks back into smoke.

**Loop:** Violet smoke curls where the figure stood, the candle flickers, the coins glint.

**Sound:** A low magic swell, the heavy sack, coins.

### 5. The challenge

**English:** Baron: Enough talk! Shieldbearer, show our guest the way out! / You: Hearthvale's roads open today. Starting with your door.

**Indonesian:** Baron: Cukup bicaranya! Shieldbearer, tunjukkan jalan keluar kepada tamu kita! / You: Jalan-jalan Hearthvale terbuka hari ini. Dimulai dari pintumu.

**Shot:** Three lanes of light race across the dark battlefield, a gold banner at the left and the Baron's red banner at the right. The Shieldbearer card drops into the center Lane with a shock ring and dust, and flips to its art. The Baron rises at the right with a red rim light. The lanes burn brighter, ready for the Battle.

**Loop:** Energy flows along the lanes, both banners wave, sparks rise, the card glows.

**Sound:** War drums, a heavy slam on the card, a rising roar into the Battle.

## Ending

### 1. The banner falls

**English:** Brassbelly's banner falls. The roads are open, and the carts roll again. For once, the Baron has nothing to say.

**Indonesian:** Panji Brassbelly jatuh. Jalan-jalan kembali terbuka, dan kereta-kereta kembali melaju. Untuk sekali ini, sang Baron kehabisan kata-kata.

**Shot:** Brassbelly Hall under the red storm with the great red banner. A golden slash cuts it; it falls. A gold wave sweeps over the map, the storm clears, and the red cards on the road burn away one after another.

**Loop:** Sun rays and floating gold motes over a clear valley.

**Sound:** Cloth rip, a triumphant hit, then a calm bed.

### 2. The vault

**English:** In his vault, you find the sellswords' pay: chests of new gold coins. But one coin feels too light.

**Indonesian:** Di ruang hartanya, kamu menemukan upah para tentara bayaran: peti-peti berisi koin emas baru. Tetapi satu koin terasa terlalu ringan.

**Shot:** A dark vault in candlelight. Coins pour down and pile up. One coin rolls out of the pile, wobbles and falls flat in front of the camera.

**Loop:** Candle flicker and glints on the pile.

**Sound:** Coin cascade, then one coin spinning down.

### 3. Painted stone

**English:** Under the gold paint is red stone. Stone like this comes from only one place: the Red Mesas.

**Indonesian:** Di balik cat emas itu ada batu merah. Batu seperti ini hanya berasal dari satu tempat: Red Mesas.

**Shot:** Close on the light coin. A crack runs across it. Flakes of gold paint break off and fly, and red stone shows under them with a puff of red dust.

**Loop:** Red dust motes and slow candlelight on the broken coin.

**Sound:** Stone crack, small flake ticks.

### 4. The seal

**English:** The Baron never met the one who paid him. Each order came at night, under a seal of three lanes cut through.

**Indonesian:** Sang Baron tidak pernah bertemu orang yang membayarnya. Setiap perintah datang pada malam hari, dengan segel tiga jalur yang terpotong.

**Shot:** A letter slides onto a dark desk next to a candle. Unreadable lines of ink write themselves. A drop of wax falls and a seal stamps it: the three lanes of the Accord, cut by one slash. The seal glows violet; the candle flame bends.

**Loop:** Violet smoke from the seal, candle flicker, slow glow pulse.

**Sound:** Heavy stamp, low mysterious tone.

### 5. The trail

**English:** Someone wants to break the Accord. The trail of painted gold leads to the Red Mesas.

**Indonesian:** Seseorang ingin menghancurkan Accord. Jejak emas palsu itu mengarah ke Red Mesas.

**Shot:** Hearthvale at sunset. The camera lifts away; red dust blows in and the Red Mesas map appears. Gold glints mark a trail between the mesas, and the cut seal burns faintly in the sky, then fades.

**Loop:** Red dust drifts, glints blink, the faint seal breathes.

**Sound:** Desert wind, the unanswered phrase of the theme.

## Player checks

- Can the Player say why the Hero is in Hearthvale after the opening?
- Can the Player say what the victory changed, what the coin shows and why they would enter the Red Mesas?
- Does the seal make the Player curious, without a claim about who the enemy is?
- Do the moments feel worth watching, and is Skip easy to find?

The exact clue at the end of Region 5 and the scripts for Regions 2 to 5 belong to the later Campaign review.
