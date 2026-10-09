/**
 * The look of each Creature Card and Token: the subject, the face, the
 * clothes and the small jokes, in a few words. The prompt puts it before the
 * brief of the card in `docs/game/10-card-concepts.md`. Add a line here when
 * you add a Creature Card or a Token there: `bun creature:prompts` fails
 * without it.
 */
export const SUBJECT = new Map(
  Object.entries({
    "human.militiaRecruit":
      "young eager farm man with a big proud smile, padded jacket too large for him, cooking pot as a helmet, holding a pitchfork forward like a spear and pointing at it",
    "human.shieldbearer":
      "strong calm woman soldier, mail shirt and simple steel cap, large round shield covered in many dents with faded paint, short sword held low",
    "human.crossbowGuard":
      "sleepy woman town guard, blue tabard with gold trim, crooked kettle hat, quiver of bolts at the hip, aiming a crossbow steady and true with one eye half closed and a small yawn",
    "human.halberdier":
      "veteran man soldier with a grey mustache and stern face, breastplate over a padded coat, halberd with a small blue and gold banner tied below the blade",
    "human.dawnCleric":
      "cheerful round-faced woman priest singing loudly with her mouth wide open and one arm raised, white and blue robes with gold trim, staff topped with a glowing sun disc, small gold sparks around her, a small bird nearby covering its head with a wing",
    "human.riverKnight":
      "young nervous man knight in light plate armor with visor up, wide eyes, leaning back and gripping the reins, lance pointing forward, riding a big bold joyful warhorse with a blue and gold horse cloth",
    "human.gateWarden":
      "tall sharp-eyed woman gate guard, long blue coat over mail, gold gate badge, large iron ring of keys at her belt, chest and lead foot advancing to the right, glaive sweeping out to the side",
    "human.ironBulwark":
      "old stout-folk man, short and very broad, grey beard under a heavy helmet, very heavy full plate armor with ornate gold trim, tall spiked tower shield, heavy mace, frowning up at a small rain cloud that rains only on him",
    "human.townBarricade":
      "rough timber town barricade filling a narrow stone lane, crossed beams, sandbags, one dented round shield, blue cloth strips, cooking-pot helmet on top, permit papers behind it",
    "human.bridgePikeman":
      "focused woman bridge soldier in a mail coat with a blue sash and small brass shoulder guards, a forward thrust with a very long pike, neat queue markers behind her",
    "human.bannerChaplain":
      "stout enthusiastic man chaplain in white and blue robes with gold trim, raising a tall banner-staff topped with a glowing sun disc, long speech scroll unrolling across the ground, nearby guards standing taller",
    "human.kingsCourier":
      "lean woman royal courier in a blue riding coat with ornate gold clasps, sealed scroll case at her hip, sprinting at extreme speed with a short spear forward, loose papers and water spray behind her, tired horse watching",
    "human.paviseArbalist":
      "patient older man arbalist with mail sleeves, kneeling behind a tall ornate blue and gold pavise, aiming a heavy windlass crossbow loaded with barbed bolts, bolt case nearby, small stool and tea cup behind the shield",
    "human.dawnReliquary":
      "large armored roadside reliquary standing across a stone lane like a sealed gate, thick oak doors with ornate steel bands, round gold sun emblem, blue prayer cloths and candles, cracks releasing holy light, one candle perfectly upright",
    "human.marshalElianVoss":
      "Marshal Elian Voss, tall older human officer with a close grey beard, blue officer coat over fitted plate with ornate gold trim, raising a command sword that sends a holy arc forward, planting a forked sun-banner, six rolled speeches at his belt, soldiers reforming behind him",
    "orc.badlandRunt":
      "small young orc boy with big ears and small new tusks, adult iron helmet too big for him falling over one eye, orange war paint stripes, short bone knife, jumping forward with his mouth open in a war cry, no animals",
    "orc.scrapRaider":
      "thin fast orc man with a big grin, scrap-metal armor, many stolen rings and necklaces, a spoon as an earring, cleaver in one hand, large sack full of shiny spoons and pans over his shoulder",
    "orc.emberShaman":
      "big kind-faced orc woman, apron over fur robes, bone beads, flinging a ball of fire from a large wooden ladle, cooking pot over a fire beside her, orange-red embers",
    "orc.howlingCharger":
      "big heavy orc man with large iron-capped tusks, orc war banner tied to his back with leather straps, spiked round shield held in front like a ram, head low, mouth open in a loud howl, big dust cloud, no animals",
    "orc.skyreaver":
      "lean orc woman flying a glider of stretched hide on a bone frame like a big kite, orange and red tribal paint on the glider wings, flying goggles, wearing a fancy stolen feathered hat, holding another stolen hat on a long snatching hook, no animals",
    "orc.packStalker":
      "lean hunched orc tracker man, hide hood with orange paint stripes, leather harness with small bone charms, two hooked hand axes with one held behind him, sly grin, chest pointing right, head turned back over his shoulder, no animals",
    "orc.tuskBrute":
      "very big strong orc woman with large tusks, rough iron shoulder plates, fur belt, big wooden club, smashing through a wooden door with splinters flying around her",
    "orc.warchiefGrukka":
      "Warchief Grukka, huge old happy orc woman, round and heavy with a big belly, long grey-white braids with bone and gold beads, large tusks with gold rings, laugh lines and a scar across her nose, beast-skull helmet with two large curved horns, heavy armor that covers her belly, long dark red war cloak with a thick fur mantle opening behind her like a banner, necklace of gold-ringed trophy tusks, leaping down from a high rock ledge in mid-air, raising a gold-inlaid double axe in her right hand and biting a roast leg in her left hand, her cheering warband with banners and war drums on the cliff behind her at sunset",
    "orc.dusthideBrawler":
      "broad sturdy orc man with a pleased grin, worn hide vest and rough belt, holding a short wooden cudgel, feet planted wide in a camp entrance",
    "orc.cinderhornBreaker":
      "muscular orc woman charging through a wooden fence beside an open gate, short battering ram of black wood held low in front of her, iron ram cap of two curled horns with glowing ember-red tips, charred leather harness and iron rings, broken boards and embers flying, no animals",
    "orc.warhowlerDrummer":
      "compact fierce orc woman with a joyful howl, worn leather gear with red feather trim, hide drum at her hip, two bone drumsticks raised, blurred warriors rushing behind her and one covering his ears",
    "orc.ashspitHunter":
      "lean orc man with one singed eyebrow, decorated leather coat, bracing a long rough-iron fire tube connected to an ember basket, narrow jet of flame toward a distant target",
    "orc.mesaPitFighter":
      "tall heavily muscled orc woman with a broken-tusk grin, red pit sash, ornate rough-iron hooked gauntlets with tally marks, advancing to the right, absorbing a strike on one arm while the counter-punch goes to the right",
    "orc.pyreaxeRavager":
      "fierce orc woman with a high dark-red hair crest, ornate rough-iron gear and scorched cloak, raising a large two-handed axe with ember-filled grooves and a burning blade, one roasted mushroom on a small attached skewer",
    "orc.warbandStandardBearer":
      "huge confident orc man with braided black hair, ornate rough-iron armor and dark-red fur cloak, carrying a monumental hide war standard with horned crossbar and trophy shields, charging downhill to the right while the warband follows to the right, the banner cloth points back the other way",
    "elf.rootboundGuard":
      "broad old plant guardian rooted across a forest path, bark cuirass, large leaf shield and short branch spear, roots around a boot-shaped training post, snail on one shoulder",
    "elf.brambleDuelist":
      "young elegant elf woman making a quick fencing lunge, worn green coat and slender thorn rapier, loose leaves trailing, dueling a bramble hedge that holds a wooden spoon, calm deadpan expression",
    "elf.fernwingCourier":
      "small elegant leaf spirit courier diving between branches, broad fern wings spread in a V, tiny worn satchel and sealed parcel with a sandwich corner visible, serious official expression",
    "elf.mosspitcherLookout":
      "squat mossy pitcher-plant spirit lookout on a high root platform, no bow and no weapon, leaning forward and spitting a sticky moss ball in a high arc that bursts into grabbing vines, leaf lid tilted like a hat, root toes spread flat on the planks to feel for boot steps, small bird on the lid giving advice while he holds that side of the lid shut",
    "elf.acornTender":
      "elder elegant elf woman gardener raising one softly glowing acorn, plain green robe, crooked watering can and small pruning knife coated in green sap, a leaf wilting where the knife passed, stern look at another unopened acorn",
    "elf.gladeTurnblade":
      "elegant elf man guard, chest and lead foot advancing to the right, looking back in a precise cut, crescent glaive sweeping behind him, green coat with amber trim, alert eyes checking front and rear, two practice dummies on opposite sides",
    "elf.canopySkirmisher":
      "elegant elf woman skirmisher diving from the canopy, leaf-glider wings spread wide, short spear forward, green harness with amber trim, unused rope ladder behind her, calm practical expression",
    "elf.thornlineArcher":
      "elegant elf man archer making a composed standing shot, recurved thorn bow with amber trim, arrow leaving a green sap trail toward a distant training post, perfectly formal posture",
    "elf.dewkeeper":
      "elegant elf woman dewkeeper lifting a crystal bowl of luminous morning dew, reed staff and green robe with amber trim, holy droplets closing a small wound, ordered bottles with one ignored",
    "elf.brambleNest":
      "dense living bramble nest rooted across an old forest road, broad thorn arch with seed pods and amber ribbons, fresh green shoots closing a cut in the arch, blank direction sign pointing into the hedge",
    "elf.amberwingDart":
      "elegant dragonfly plant spirit in a steep attack dive, four ornate leaf wings with amber veins, thorn lance at its head, fine vines trailing toward a target, one wing with a window-shaped repair",
    "elf.elderreedDartmaster":
      "older elegant elf woman dartmaster crouched along a high branch, no bow, aiming a very long reed blowpipe with gold-metal bands to the right, calm cheeks and one eye closed, belt case of thorn darts with green sap drips, layered green cloak, untouched picnic inspected by squirrels",
    "elf.seedwindShepherd":
      "elegant elf man seedwind shepherd floating beneath a translucent seed sail, ornate seed staff and green cloak with gold trim, holy dew closing a cut on his arm, guiding other seeds with a tiny baton, broad sturdy frame",
    "elf.canopyVinewarden":
      "heroic elegant elf woman vinewarden standing on a colossal living canopy gate, no bow, one open hand thrust forward, a huge braid of thorned vines as thick as a tree trunk lashing down to the right in an S-curve and coiling around a startled attacker below before he can lift his axe, ornate layered leaf armor with silver trim, broken warning bell hanging in a knot of vine",
    "elf.lethielFirstGardener":
      "Lethiel the First Gardener, ancient elegant elf, luminous living staff, ceremonial leaf mantle, seed crown and silver pruning hook, holy light closing a split in the bark beside him, measuring a colossal tree with a tiny ruler and showing restrained approval",
    "undead.graveyardDrudge":
      "broad skeleton graveyard laborer in a patched burial coat, bracing behind a blunt shovel, smaller skeleton helper behind him, rusted shoulder plate and rope belt, friendly macabre humor",
    "undead.rattleknife":
      "thin skeleton cutpurse lunging with a chipped dinner knife, a smaller skeleton crowding his elbow, worn hood and empty purse with a painted coin symbol, eager bony grin, friendly macabre humor",
    "undead.coffinLidSkater":
      "small skeleton riding a loose wooden coffin lid to the right down a wet causeway, leaning into the slide, bent spoon used as a rudder, long torn scarf streaming behind him, stray cart wheel chasing, friendly macabre humor",
    "undead.hushbow":
      "skeleton archer wrapped in faded grave cloth, drawing a short bow, bells wrapped to keep them quiet, second skull peering from a bone-filled quiver, finger raised for silence, friendly macabre humor",
    "undead.graveBellTender":
      "stooped skeleton sexton ringing a large handbell, another small skeleton climbing from soft earth with a dinner bowl, patched cloak and iron key chain, friendly macabre humor",
    "undead.backwatchBailiff":
      "tall skeletal road bailiff, chest and feet advancing to the right, skull turned back, hooked polearm sweeping behind, iron key ring and rusted coat with pale teal trim, offering a blank permit to a confused crow",
    "undead.chatteringCohort":
      "three eager skeleton soldiers crowded around one oversized rusted sword, mismatched helmets and pale teal cloth knots, all advancing to the right and leaning forward, free hands pointing different ways, friendly macabre humor",
    "undead.paleGalloper":
      "nervous skeleton courier leaning backward on a joyful spectral marsh pony charging through shallow ice, frosted saddle, empty scroll tube and rusted cap, pale blue frost spray, friendly macabre humor",
    "undead.rimeEyeReaper":
      "skeletal woman reaper stepping forward into a low sweep with a frosted grave scythe, one eye glowing with frost and a frozen moth resting over it, rusted scale vest with a silver-teal clasp, friendly macabre humor",
    "undead.ossuaryPiper":
      "cheerful broad skeleton musician marching while playing crooked bone pipes, small drum at the hip, pale teal sash and rusted breastplate, nearby skeletons marching with confidence, frog trying to sing, friendly macabre humor",
    "undead.coffinLancer":
      "armored skeleton knight kneeling behind an upright coffin used as a shield, long ornate rusted lance held level, tarnished silver trim, faint pale double-image rising behind, pillow still tied inside the coffin, friendly macabre humor",
    "undead.winterMaw":
      "large spectral grave hound springing ahead with pale frost around its jaws, second hound behind carrying a frozen stick, ornate broken collar and short rusted chain, dynamic first leap, friendly macabre humor",
    "undead.lanternWidow":
      "elegant skeletal widow in a faded mourning dress opening an ornate lantern, pale teal Restless Wisp floating out through frost vapor, rusted silver veil pins, offering an empty teacup, friendly macabre humor",
    "undead.sirOdoLastTaxman":
      "Sir Odo the skeletal tax knight charging down ruined courthouse steps, severe false mustache fixed to his helmet, quill-shaped lance, square ledger shield with blank pages, ornate rusted plate and coin chain, spectral second form rising, offering a blank receipt, friendly macabre humor",
    "undead.boneRampart":
      "towering undead rampart made from interlocked rusted shields, coffin planks and chains, orderly skeleton workers repairing the top, pale teal pennants, spectral rebuilt outline behind it, blank arrow sign pointing around the wall, friendly macabre humor",
    "goblin.ankleSnatcher":
      "tiny eager goblin girl with ash-grey blue-tinted skin, huge shining amber eyes and long soft ears streaming back as she runs low, hooking forward at ankle height with a long bent-pipe hook, a single caught boot hanging from the hook, coil of rope, patched brass goggles on her forehead, bare feet, no tusks",
    "goblin.fuseRunner":
      "skinny tiny goblin man with ash-grey skin and long droopy ears flapping, running forward on his toes, hugging a round black bomb bigger than his whole head with a short lit fuse throwing acid-green sparks, soot on his long nose, long striped scarf streaming, huge amber eyes fixed on the fuse instead of the road, no tusks",
    "goblin.junkSlinger":
      "old tiny goblin woman with ash-grey wrinkled skin, wild white hair tufts and long ears that hang to her shoulders, swinging a sling above her head, bag of bent nails, bolts and small gears with a small trap spring on top, patched canvas apron with many pockets, a false tooth flying out with the junk, determined crooked grin, no tusks",
    "goblin.tunnelSaboteur":
      "round little goblin man with ash-grey skin and long ears folded under a miner's helmet much too big for him, helmet lamp with an acid-green glow, climbing up out of a fresh hole in a road, big pliers in one hand, turning an hourglass upside down with the other, cut rope over his shoulder, sly wink of one huge amber eye, no tusks",
    "goblin.scrapPlateGuard":
      "small round goblin woman with ash-grey skin and big amber eyes peeking out of iron stove-plate armor much too big for her, a stove door on her chest, stove pipe on her helmet, long ears hanging out under it, bracing behind a shield made from a wooden cart wheel, short pick, small kettle steaming on her shoulder plate, no tusks",
    "goblin.sidestepShiv":
      "thin tiny goblin man with ash-grey skin, very long pointed nose and long ears under a dark canvas hood, chest and lead foot pointing right, looking back over his shoulder with huge shining amber eyes, small knife ready behind him and another out to the side, belt with many pockets and one brass buckle, a pocket bursting with stolen keys, sly grin with crooked front teeth, no tusks",
    "goblin.junkBarricade":
      "tall goblin barricade made from barrels, a broken mine cart, pots, an old door and jars of acid-green lamp oil, a tiny ash-grey goblin with long ears on top pulling a long rope that runs off to the right, upside-down pointing-hand sign with no letters",
    "goblin.bombLobber":
      "plump little goblin woman with ash-grey skin, white hair in two tufts and long ears tied back with string, hitting a small lit bomb forward like a ball with a big round racket made from a barrel hoop and wire, basket of round bombs at her hip, smoked brass goggles, covering one ear with her free hand, bomb flying in a high arc with a spark trail, no tusks",
    "goblin.greaseTrapper":
      "short goblin man with ash-grey skin and long droopy ears, spreading black grease on the ground with a mop, bucket of grease, big round toothless spring trap on his back, small hourglass on his belt, slipping a little on his own grease with huge surprised amber eyes, no tusks",
    "goblin.rocketBarrelRider":
      "young goblin woman with ash-grey skin riding a powder barrel with a rocket flame out of the back, flying low and forward, holding on with both hands, leather cap with brass goggles, long ears and scarf streaming far behind her, eyes shut tight, no tusks",
    "goblin.mineSapper":
      "wiry goblin man with ash-grey skin, bushy white eyebrows and long ears, swinging a long pick with brass trim and a glowing hot head, back frame stacked with small powder kegs taller than he is, lighting his pipe with one of the fuses, ornate leather and brass gear with many pockets, no tusks",
    "goblin.spyglassSniper":
      "old tiny goblin woman with ash-grey skin, white hair tufts and long ears, aiming a long crossbow with a brass spyglass mounted on top, goggles with many brass lenses over one huge amber eye, notebook of drawings with no letters at her belt, small bird perched on the end of the crossbow, ornate brass fittings, no tusks",
    "goblin.junkWalker":
      "tiny goblin woman with ash-grey skin and long ears driving a walking machine made from riveted boiler plates, round boiler body on two pipe legs, big claw arm, open seat with levers, brass gauges, acid-green glow from its lamp-oil tank, a second tiny goblin running behind with an oil can",
    "goblin.grandGearjammer":
      "big goblin war cart rolling forward, gear cannon firing brass gears, springs and broken clocks, three tiny ash-grey goblin crew with long ears and brass goggles pulling levers, one loading the cannon with an alarm clock, large brass gear on top, acid-green lamp jars, heroic dramatic composition",
    "goblin.bossSnikkit":
      "Boss Snikkit the goblin mine king, small old goblin man with ash-grey wrinkled skin, a long white beard tucked into his belt, very long ears hanging past his shoulders and huge amber eyes, a large bucket crown set with glass gems slipping over one eye, riding a mine cart throne full of bombs down the rails, pointing forward with a lit torch scepter, stolen hourglass on a chain, cheering tiny goblins behind, heroic dramatic composition, no tusks",
    "feral.bristlebackBoar":
      "wild mountain boar with a ridge of stiff bristles charging forward head down, boards of a broken fence flying around it, an apple stuck on one tusk, dust behind it",
    "feral.cragLizard":
      "large stone-grey lizard with rock-like back plates walking forward low, mouth open in a hiss, snow on its plates, small bird sitting on its back unnoticed",
    "feral.frostfangLynx":
      "white mountain lynx with long ear tufts and ice-blue fangs leaping forward with claws out, frosty breath and frost on its claws, a lump of snow on its head",
    "feral.caveBear":
      "huge brown cave bear with sleepy half-open eyes walking forward on all fours out of a cave, half yawning around a honeycomb in its mouth, moss and old healed scars on its fur",
    "feral.webSpitter":
      "giant round furry cave spider with many shiny friendly eyes spitting a sticky web line forward, a caught helmet hanging in a web behind it, looking proud, friendly cartoon shapes, not scary",
    "feral.boulderTortoise":
      "giant mountain tortoise asleep across a narrow pass, boulder-like stone shell covered with moss and small trees, fresh moss growing over cracks, a mountain goat standing on top",
    "feral.tailsweepBasilisk":
      "long low basilisk lizard advancing to the right, heavy club tail swinging backward, rocks flying from the swing, bored half-lidded eyes, S-shaped body",
    "feral.caveTroll":
      "large grey wild cave troll with long arms and a small head walking forward on its knuckles, a broken stalactite used as a club, a cut on its arm closing up, chewing on a lost shield, no armor and no tribe marks",
    "feral.cragRhino":
      "woolly mountain rhino with a stone-grey horn charging forward head low, one broken shield stuck on its horn and a second shield flying behind it, empty helmet spinning in the air",
    "feral.frostElkMatriarch":
      "tall old elk cow with wide antlers of ice walking forward with her head high, calling with a cloud of breath mist, two young elk copying her pose behind her",
    "feral.avalancheYeti":
      "big white yeti with long fur charging forward through a wall of snow with arms wide, shields thrown to the sides, ice crystals glittering in its fur, a stolen scarf much too small for it",
    "feral.woollyMammoth":
      "woolly mammoth with long curved tusks walking forward with heavy steps, tusks low, a broken wooden fence draped over the tusks, thick matted fur with ice, a bird's nest in its fur",
    "feral.rimebreathDrake":
      "slim young ice drake with wide wings flying forward and breathing a cone of frost, an icicle frozen onto its own nose, long neck, frost crystals in the air",
    "feral.mountainColossus":
      "wild old giant of living rock and moss taking a huge step forward with one fist down, rubble flying, new stone growing over cracks, a small village of bird nests on its shoulder, heroic dramatic composition",
    "feral.oldFrostmaw":
      "Old Frostmaw, huge old white cave wyrm with no wings and a crown of icicles, coming out of a great ice cave with jaws open and icy breath, broken ice pillars around it, a very small hunting horn hanging from one tooth, heroic dramatic composition",
    "token.skeleton":
      "small eager skeleton soldier with a bucket helmet over one eye socket, chipped sword held too high, round wooden lid as a shield and a pale teal neck cloth, looking back toward an ally for courage, friendly macabre humor",
    "token.restlessWisp":
      "small teardrop-shaped pale teal Restless Wisp with a friendly skull-like face, floating above marsh water and dragging a tiny rusted helmet on a short chain, icy trail and frost motes, friendly macabre humor",
  })
);
