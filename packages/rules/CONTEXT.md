# rules

The game rules of Heynbord: Battles, cards, Decks, progression and rewards. This context defines what happens in the game. It does not define how the game looks or sounds.

## Language

### Board

**Board**: The battlefield of one Battle. It is made of 3 or 4 Lanes. _Avoid_: field, map, grid, arena

**Lane**: One row of 12 Squares between one Hero of each Side. Units move only along their Lane. _Avoid_: row, path, track

**Closed Lane**: A Lane where no Side can summon a Unit and no Skill Card can target a Square. It opens at a set Turn number, or it stays closed for the full Battle. It is still part of the Board and of a Front. _Avoid_: blocked lane, locked lane

**Square**: One position in a Lane. It holds 0 or 1 Unit. _Avoid_: tile, cell, slot

**Column**: The set of Squares at the same distance from a Hero, across all Lanes. Each side counts Columns from its own Hero. _Avoid_: rank, line

**Front**: The Lanes that one Hero stands behind. An enemy Unit that gets to the end of a Lane hits the Hero of that Front. _Avoid_: wing, flank, sector, zone

**Summon Zone**: A Side's Columns 1 to 3, in all Lanes. The Heroes of that Side summon Units only into it. The one exception is a Unit with Wall, which can also go into Columns 4 and 5. _Avoid_: Summon Column, spawn zone, deploy row

**Field Effect**: An effect from a Skill Card that stays on a Square area for a number of Turns. _Avoid_: tile effect, battlefield skill, aura

### Battle

**Battle**: One match between two Sides, from the first Turn to a win or a loss. _Avoid_: match, game, fight, duel

**Solo Battle**: A Battle with 1 Player. The other Side is AI. Stages, Dungeons and Heynspire Floors are Solo Battles. _Avoid_: single-player battle, PvE

**Side**: One of the two teams in a Battle. A Side has 1 or more Heroes. It loses when all its Heroes are Defeated or when it is Routed. _Avoid_: team, party

**Defender**: The Side that does not start the Battle. It takes the second Turn in each Turn number, and it wins at the Turn limit. In a Solo Battle, the enemy is the Defender. _Avoid_: second player, defense side

**Hero**: A commander on a Side. A Hero stands behind its Front and has HP, a Class and a Deck. _Avoid_: commander, avatar, general, player

**Defeated**: The state of a Hero at 0 HP. A Defeated Hero is out of the Battle, but its Side continues while it has other Heroes. _Avoid_: dead, killed, knocked out

**Routed**: The state of a Side with no Units on the Board and no Cards in the Hands and Decks of its Heroes that are not Defeated. A Routed Side cannot act again, so it loses. _Avoid_: exhausted, out of cards, surrender, forfeit

**Player**: The person who plays Heynbord. The Player controls a Hero. _Avoid_: user, account, Hero

**Turn**: One side's sequence of Start Step, Play Phase, Resolution Phase and End Step. _Avoid_: round, move

**Turn number**: A count of rounds. Both sides take one Turn in each Turn number. _Avoid_: turn count, round number

**Play Phase**: The part of a Turn in which the active side plays Ready cards. _Avoid_: main phase, action phase

**Resolution Phase**: The part of a Turn in which the active side's Units move and attack automatically. _Avoid_: combat phase, battle phase, auto phase

**Speed**: The maximum number of Squares that a Unit goes forward in its Movement in one Turn. _Avoid_: move, pace, Movement points

**Movement**: The part of a Unit's action in which it goes forward in its Lane, up to its Speed. A Unit moves through friendly Units, but it stops before an enemy Unit. A Flying Unit moves over all Units. A Unit always stops in an empty Square. _Avoid_: walk, advance, march

**Sudden Death**: Damage to each Hero of the active Side that is not Defeated, in each Start Step from a set Turn number, so that every Battle ends. _Avoid_: fatigue, overtime

**Burn**: The effect of Fire damage on a Unit: 1 damage in each End Step of the Unit's owner, for the next 2 End Steps. A new Burn replaces the old Burn. _Avoid_: damage over time

**Freeze**: The effect of Frost damage on a Unit: the Unit skips its next action. A Unit with a Freeze is Frozen. _Avoid_: stun, chill, slow

**Status**: An effect that stays on a Unit: Burn, Freeze, Entangled, Poisoned, Hobbled or Bleeding. A Damage Type or a Keyword can put a Status on a Unit. It belongs to the target Unit. _Avoid_: debuff, condition, ailment

**Entangled**: The Status from the Entangle Keyword. An Entangled Unit has Speed 0 during its next action, but it can still attack. Entangled then ends. _Avoid_: rooted, snared, slowed

**Poison**: A Keyword. After a Unit with Poison deals attack damage above 0 to an enemy Unit, that Unit becomes Poisoned with 1 more stack. Retaliation does not apply Poison. _Avoid_: venom, toxin

**Poisoned**: A Status from the Poison Keyword. The Unit has a stack count. In each End Step of its owner, it takes 1 damage per stack, then loses 1 stack. A new stack adds to the old stacks. This damage ignores Armor, Crit and Block, and it has no Damage Type. _Avoid_: venom, toxin, damage over time

**Hobble N**: A Keyword. After a Unit with Hobble deals attack damage above 0 to an enemy Unit, that Unit becomes Hobbled for N End Steps. Retaliation does not apply Hobble. _Avoid_: Fatigue, Cripple, Slow

**Hobbled**: A Status from the Hobble Keyword. A Hobbled Unit has a maximum Speed of 1, after all bonuses. It has a count that goes down by 1 in each End Step of its owner, and it ends at 0. A new Hobble keeps the higher count. _Avoid_: fatigued, slowed, crippled

**Bleed N**: A Keyword. After a Unit with Bleed deals attack damage above 0 to an enemy Unit, that Unit becomes Bleeding for N End Steps. Retaliation does not apply Bleed. N is 1 up to Rare, 2 at Epic and 3 at Legendary. _Avoid_: Wound, Rend, Maim, anti-heal

**Bleeding**: A Status from the Bleed Keyword. A Bleeding Unit gets half of each heal, rounded down. It has a count that goes down by 1 in each End Step of its owner, and it ends at 0. A new Bleed keeps the higher count. Bleeding does no damage. _Avoid_: wounded, grievous wounds, healing reduction

**Damage Type**: The kind of damage: Physical, Fire, Frost or Holy. _Avoid_: element, damage kind

**Battle seed**: The start value of the random numbers in one Battle. The same seed and the same Commands give the same Battle. _Avoid_: random seed, RNG

**Abandon**: The end of a Battle when the Player leaves it before a win or a loss. An Abandoned Battle records no result. _Avoid_: quit, forfeit, surrender, retreat

### Cards and Units

**Card**: A collectible item that a side can play from the Hand. A Card is a Creature Card or a Skill Card. _Avoid_: item

**Creature Card**: A Card that summons a Unit. It has a Race. _Avoid_: minion card, unit card, troop card

**Skill Card**: A Card with a one-time effect. It has a Class. _Avoid_: spell, ability card

**Unit**: A thing on the Board that a Creature Card or an effect puts there. _Avoid_: creature, minion, troop, character

**Token**: A Unit that an effect makes, with no Card. It uses the Rank of the Card or effect that made it, and it disappears when it dies. _Avoid_: summon, spawn

**Countdown**: The number of Turns that a Card must be a Ticking Card before it is Ready. It goes down by 1 in each Start Step of its owner while the Card is a Ticking Card. _Avoid_: mana, cost, cooldown, timer, wait

**Ticking Card**: One of the 3 oldest Cards in a Hand that are not Ready. Only Ticking Cards count down. The oldest Card is the Card that came into the Hand first. _Avoid_: queue, active card, slot

**Waiting Card**: A Card in a Hand that is not Ready and is not a Ticking Card. Its Countdown does not go down. It becomes a Ticking Card when an older Card becomes Ready or leaves the Hand. _Avoid_: paused card, frozen card, queued card

**Ready**: The state of a Card with a Countdown of 0. Only Ready Cards can be played. _Avoid_: active, available, playable

**Recall**: The chance that a Skill Card goes back to the Hand after its effect. The Rank of the Card sets the chance. A Card that goes back is Recalled. _Avoid_: Mastery, return chance, recycle, echo, rebound

**Hand**: The Cards that a Hero holds during a Battle. _Avoid_: queue

**Hand Limit**: The maximum number of Cards in a Hand: 8. A Hero does not draw when its Hand is full, and the Card stays in the Deck. _Avoid_: hand size, max hand

**Deck**: The Cards that a Hero brings into a Battle. During a Battle, the Deck holds only the Cards that the Hero has not drawn. _Avoid_: army, loadout, draw pile

**Countdown Limit**: The maximum sum of the printed Countdowns of the Cards in a Deck, for each player level. A Stage enemy Deck does not have it. _Avoid_: Deck Cost, Leadership, mana cap

**Starter Deck**: A fixed Deck that the game gives to the Player before the Player builds a Deck. The Hero Class comes from the Starter Deck. Each copy in it has the Rank Common or Uncommon. _Avoid_: preset deck, default deck, sample deck

**Deck Slot**: A place where the Player saves one Deck. A new Player has 3 Deck Slots. The Player buys more with Coin, up to 10. _Avoid_: deck (for the place), loadout, preset

**Archetype**: A named reference Deck for one style of play, for example a Human Wall Warrior Deck. The team uses Archetypes to measure balance. A Player never sees an Archetype. _Avoid_: deck type, meta deck, benchmark deck

**Matchup**: Many Battles between two Archetypes, with the AI on both Sides, to measure if one Archetype is stronger than the other. _Avoid_: versus, pairing, mirror test

**Power Points**: The strength of one Creature Card at its Base Rank, from its Attack, HP, Speed, Range, Damage Type and Keywords. _Avoid_: power level, rating, score, value

**Power Budget**: The Power Points that a Creature Card can have for its Countdown. A Card must stay near its Power Budget. _Avoid_: cost, mana curve, stat budget

**Graveyard**: The place for a Hero's Cards that are used or dead. _Avoid_: discard pile, cemetery, crypt

**Keyword**: A named rule on a Card, for example Flying or Armor. _Avoid_: trait, perk, tag, ability

**Entangle**: A Keyword. After a Unit with Entangle deals attack damage above 0 to an enemy Unit, the enemy becomes Entangled. Only a Ranged Unit has Entangle, because a Melee Unit attacks an enemy that cannot move closer. Its Base Rank is Epic or higher, because it can Entangle the same enemy in each Turn. _Avoid_: Root, Snare

**Charge N**: A Keyword. A Unit with Charge gets +N Speed in the Turn when it is summoned. N is 1 up to Rare, 2 at Epic and 3 at Legendary. N is never more than 3. _Avoid_: Haste, Rush, Dash, Sprint

**Base Attack**: The Attack of a Unit for its Rank, without bonuses such as Rally or Swarm. A Unit with Base Attack 0 never attacks and never deals Retaliation damage. _Avoid_: printed Attack, raw Attack

**Rally N**: A Keyword. In its owner's Start Step, the other friendly Units in the same Lane get +N Attack until the end of the Turn. A Unit with Base Attack 0 gets no Rally bonus. _Avoid_: Inspire, Rouse, Battle Cry

**Swarm N**: A Keyword. A Unit with Swarm gets +N Attack while another friendly Unit or Token is in the same Lane. More friendly Units do not increase the bonus. _Avoid_: Horde, Pack

**Last Breath: X**: A Keyword. X occurs when the Unit leaves the Board. In v1, X deals damage to the nearest enemy Unit ahead in the same Lane, or summons a Token in the Square that the Unit left. _Avoid_: death effect, deathrattle

**Rebirth**: A Keyword. The first time a Unit with Rebirth dies, it comes back in the same Square with 1 HP and without Rebirth. _Avoid_: revive, resurrect

**Knockback N**: A Keyword for melee Units. After a Unit with Knockback deals attack damage above 0 to an enemy Unit, that Unit is Pushed N Squares back, toward its own Hero, in its own Lane. The push stops before another Unit and at the pushed Unit's Column 1. A Unit with Wall is never Pushed. Retaliation and First Strike do not apply Knockback. N is 1 up to Rare, 2 at Epic and 3 at Legendary. _Avoid_: Push, Shove, Repel, Displace

**Pushed**: Moved to another Square by an effect such as Knockback, not by the Unit's own Movement. Speed, Flying, Frozen, Entangled and Hobbled do not change a push. Pushed is not a Status. _Avoid_: knocked back, moved, displaced

**Sabotage N**: A Keyword. When a Unit with Sabotage comes onto the Board from its Creature Card, the Card with the lowest Countdown in the Hand of the enemy Hero of that Front gets +N Countdown. A Ready Card is the lowest. If two Cards have the same Countdown, the oldest Card in the Hand gets it. Rebirth and Tokens do not apply Sabotage. N is the same at each Rank. _Avoid_: Delay, Stall, Disrupt

**Trample**: A Keyword for melee Units. When a Unit with Trample kills an enemy Unit with attack damage, the damage above that Unit's HP hits the enemy Unit in the next Square behind it, in the same Lane. It never hits a Hero. This second hit is not an attack: it has no Crit and no Retaliation, and it does not apply Keywords such as Poison, Hobble, Bleed or Knockback. It does not Trample again. _Avoid_: Cleave, Overrun, Pierce

**Unique**: A Keyword. While a Unit from a Unique Card is on a Side of the Board, no Hero of that Side can play a copy of that Card, at any Rank. Each Unit from that Card counts, also a Unit that the Stage puts on the Board. Enemy Units do not count. A Deck can still hold more than 1 copy. _Avoid_: Singleton, One-of, Legend rule

**Wall**: A Keyword. A Unit with Wall has Speed 0 and Base Attack 0. It blocks enemy Units in its Lane, and it is never Pushed. Its Hero can summon it into the Summon Zone and also into Columns 4 and 5 of an open Lane, also past an enemy Unit. Each Card with the Wall Role has Wall, and each Card with Wall has the Wall Role. _Avoid_: Barricade, Blocker, Taunt

**Race**: The people that a Creature Card belongs to: Human, Elf, Undead, Orc or Goblin, or the Feral host. A Race also includes the beasts and spirits that fight with that people, so a grave hound that fights for the Undead is an Undead card. Orc cards show only orcs, so that no Orc card looks like a Feral card. The Race tells the side that a card fights for, not the species of the figure. _Avoid_: faction, tribe, kingdom, species

**Feral**: The one Race with no people. A Feral card is a wild creature that serves no people, for example a wyrm or a giant spider. A creature that fights for a people is a card of that people's Race, not a Feral card. _Avoid_: beast, creature, wild (as a Race name)

**Role**: The job of a Creature Card in a Battle: Frontliner, Striker, Runner, Shooter, Support or Wall. It helps Players read a Card. No Battle rule uses it, but it sets the Range of a Ranged Unit. _Avoid_: class, type, archetype

**Range**: The maximum number of Squares in front of a Ranged Unit at which it attacks the nearest enemy Unit. A Melee Unit has no Range. A Ranged Support always has Range 2. A Shooter always has Range 3. No Unit has a Range of more than 3. _Avoid_: reach, attack distance

**Class**: The type of a Hero, and of the Skill Cards that the Hero can use: Warrior, Ranger, Mage or Priest. _Avoid_: job, profession, role

**Rank**: The power grade of one copy of a Card: Common, Uncommon, Rare, Epic or Legendary. The Rank names use usual rarity words, so that players know the order immediately. But the concept is a Rank, not a rarity: Combine can make the Rank of a copy higher. _Avoid_: rarity, tier, star, level, quality

**Base Rank**: The lowest Rank in which a Card exists. _Avoid_: rarity, starting tier

### Progression

**Collection**: All the Card copies that the Player owns. _Avoid_: inventory, library

**Discovered**: The state of a Card that the Player has owned at least one time. _Avoid_: unlocked, known, seen

**Combine**: The action that changes two copies of the same Card in the same Rank into one copy in the next Rank. _Avoid_: fuse, merge, upgrade, evolve

**Extract**: The action that changes one Card copy into Essence. _Avoid_: dismantle, disenchant, salvage, sell

**Craft**: The action that changes Essence into one copy of a Discovered Card in its Base Rank. _Avoid_: forge, make, fuse

**Essence**: The resource from Extract that pays for Craft. _Avoid_: dust, material, shards

**Coin**: The currency that the Player earns in Battles and other play. It pays for Packs, Combine, Gear upgrades and Deck Slots. _Avoid_: Marks, money, gold (as a name for all of the currency)

**Copper**, **Silver**, **Gold**: The three denominations of Coin. 100 Copper is 1 Silver, and 100 Silver is 1 Gold. They are one currency with one balance, not three currencies. _Avoid_: bronze

**Heynstones**: The rare currency. The Player earns it slowly through play, or buys it with real money. It buys only Cosmetics and Conveniences, never power. _Avoid_: gems, diamonds, crystals, premium currency (in player-facing text)

**Convenience**: An item that changes comfort or organization, for example a Deck Slot. It never changes the result of a Battle, the speed of progress or the content of the Collection. _Avoid_: boost, perk, premium feature

**Bazaar**: The offers that the Player can buy with Heynstones: only Cosmetics and Conveniences. _Avoid_: shop, store, market

**Pack**: A set of random Cards that the Player buys with Coin. _Avoid_: booster, loot box, chest

**Drop Rate**: The chance of each Rank for each Card in a Pack. _Avoid_: odds, luck

**Gear**: The items in the Hero's 4 slots that give the Hero and its Units stats. _Avoid_: equipment, items

**Player level**: The level of the Player from XP. It sets the Hero HP and the Deck size limits. _Avoid_: account level, Hero level

**Workshop**: The set of actions that change Card copies and Essence: Combine, Extract and Craft. _Avoid_: alchemy lab, forge

**Cosmetic**: An item that changes how something looks and never changes gameplay. _Avoid_: skin (as a general word), vanity item

**Achievement**: A goal that gives a reward when the Player completes it. _Avoid_: quest, mission, trophy

### Modes

**Stage**: One Battle in the Campaign, with a fixed enemy and rewards. _Avoid_: level, mission

**Recommended level**: The Player level that the First-try Path gives before a Stage. A new Player with no Gear is expected to win the Stage on the first try at this level. The Player can see it. _Avoid_: expected level, suggested level, required level

**First-try Path**: The first win of each earlier Stage, in Stage order, with no losses and no repeats. It gives the smallest XP that a Player can have at a Stage. _Avoid_: golden path, ideal run, expected path

**Boss Stage**: The last Stage of a Region, with special rules. Its enemy Hero is a Boss. _Avoid_: boss level, raid

**Start Unit**: A Unit that a Stage puts on the enemy Side of the Board before the first Turn, for example the Boss's bodyguard. It is a copy of a Card, so its Rank is at least the Card's Base Rank. _Avoid_: pre-placed Unit, spawn, Unique boss Unit

**Boss**: An enemy Hero with a name and special rules. One Boss is one Hero. _Avoid_: Dungeon Boss, boss Unit, elite, champion

**Dungeon**: A named place outside the Campaign where the Player fights one Battle against all its Bosses, with no Battles before them. The Player can play a Dungeon again. _Avoid_: raid, boss rush, instance, level

**Region**: A group of 10 Stages. _Avoid_: chapter, world, area

**Campaign**: All Regions and their Stages. _Avoid_: story mode, adventure

**Stars**: The 1 to 3 result grade of a Stage win. _Avoid_: score, rating; never use for Rank

**Heynspire**: The tower mode with 50 Floors. _Avoid_: tower, ascension tower

**Floor**: One Battle in Heynspire. _Avoid_: level, stage

**Auto-play**: A mode in which the enemy AI logic plays the Player's Cards. _Avoid_: bot, auto battle

**Hold Rule**: A condition of the AI for one type of Skill Card effect. While the condition is false, the AI keeps a Ready Card with that effect in the Hand and does not play it. It is not a game rule: a Player can play the same Card at any time. _Avoid_: reserve, save, hold threshold

**Tutorial**: The one guided session that teaches a new Player the core of a Battle. It is each play of Stage 1-1 until the first win of Stage 1-1, and it never shows after that win. _Avoid_: onboarding, tutorial Stages, training

**Tutorial Step**: One of the 4 guided parts of the Tutorial: a short text with an arrow or a highlight. It shows when its subject first appears in the Battle, at most one time in each play of the Tutorial. _Avoid_: lesson, coachmark, tooltip, Hint

**Hint**: A one-line tip that shows one time, when the Player first meets something that the Tutorial does not teach. It is not part of the Tutorial. _Avoid_: tutorial step, tooltip, popup

## Relationships

- A **Player** controls one **Hero**. The Hero has one **Class**.
- A **Battle** has two **Sides**. Each Side has 1 or more **Heroes**. In v1, the Player's Side has exactly 1 Hero.
- Each **Hero** has its own **Deck**, **Hand**, **Graveyard**, **Class** and **Gear**. All the Heroes of a Side play in the same **Turn**.
- Each **Hero** has one **Front**. A Hero can summon into the **Summon Zone** of any Front of its Side. Its **Skill Cards** can target any **Square**.
- A **Stage** has 3 **Lanes**. A **Dungeon**, a **Floor** and a Battle with 2 or more **Players** have 4 Lanes. The type of Battle sets the number of Lanes. A Stage or a Dungeon can make the Board smaller only with **Closed Lanes**.
- A **Unit** belongs to the Hero that summoned it, and uses that Hero's **Gear**.
- When a Hero is **Defeated**, its Units and **Field Effects** are removed, and its **Front** goes to the nearest Hero of its Side that is not Defeated.
- A **Side** that is **Routed** loses, also when its Heroes still have HP. The rule is the same for the Player's Side and the enemy Side. A Side is not Routed while one of its Heroes has a rule that can still put a Unit on the Board.
- A **Deck Slot** belongs to the **Player**, not to a **Hero**. Each Deck Slot keeps one **Deck** and its Hero **Class**. The **Starter Decks** are in the first Deck Slots of a new Player.
- A **Deck** holds **Creature Cards** of any **Race** and **Skill Cards** of the Hero's Class only.
- A **Deck** of the Player, a **Starter Deck** and an **Archetype** stay within the Deck size limits and the **Countdown Limit** of the player level. The **Rank** of a copy does not change its count in the Countdown Limit.
- A **Creature Card** becomes a **Unit** when the side summons it.
- A **Starter Deck** holds only copies in the **Rank** Common or Uncommon. The Player gets a Rare, Epic or Legendary copy only from play, for example from the first win of a **Boss Stage**.
- A **Starter Deck** can also be an **Archetype**. An Archetype does not have to be a Starter Deck. A **Matchup** of an Archetype against itself is a mirror.
- A **Card copy** has one **Rank**. **Combine** raises the Rank. The **Countdown** does not change with the Rank.
- A **Card copy** is never below its **Base Rank**: in a **Deck**, in a **Collection** and as a **Start Unit**.
- Each **Stage** has one **Recommended level**. It is a guide, not a lock: a Player below it can still play the Stage. A loss or a repeat win gives XP too, so a real Player is at or above the level of the **First-try Path**.
- A **Region** has 10 **Stages**, and the last one is a **Boss Stage**.
- The **Tutorial** ends with the first win of Stage 1-1. A loss or an **Abandon** does not end it. A later play of Stage 1-1 is a normal **Stage**. The Tutorial has 4 **Tutorial Steps**. Auto-play is not available in the Tutorial. A **Hint** shows one time for each subject, at any time after the Tutorial.
- A **Dungeon** has 1 or more **Bosses**. All of them are on the enemy Side of one **Battle**. Each Dungeon unlocks at a **Player level**. A Dungeon win gives no **Stars**.
- The Player has one balance of **Coin**, shown in **Gold**, **Silver** and **Copper**, and a separate balance of **Heynstones**.
- **Coin** and **Heynstones** never change into each other or into **Essence**.

## Example dialogue

> **Dev:** "When the Countdown of a Creature Card reaches 0, the card is Ready. In the Play Phase I put it into an empty Square of the Summon Zone, and it becomes a Unit." **Designer:** "Yes. That Unit also acts in the Resolution Phase of the same Turn. If it dies, the Card goes to the Graveyard, but a Token just disappears."

## Flagged ambiguities

- The original games used "stars" for card grades. Heynbord uses **Rank** for card grades and **Stars** only for Stage results.
- "Fuse" in the original games was a random recipe system. Heynbord does not have it. **Combine** and **Craft** replace it.
- **Recall** was named "Mastery" before. "Mastery" told the Rank, not the effect, so Players did not know what it did.
- **Hero** and **Player** are different. A Player is a person. A Hero is the commander on the Board.
- The GDD used "a Unique boss Unit" for a Unit that starts on the Board in a Boss Stage. The term is **Start Unit**, and that Unit is not a **Boss**. A Boss is always a Hero, in a Boss Stage and in a Dungeon.
- A **Hero** used to lose the Battle at 0 HP. Now a Hero is **Defeated** at 0 HP, and only a **Side** with no Heroes left loses ([ADR-0009](../../docs/adr/0009-a-side-has-one-or-more-heroes.md)). A Side that is **Routed** also loses ([ADR-0012](../../docs/adr/0012-a-routed-side-loses.md)).
- The **Board** used to have 1 to 3 Lanes in v1, and each Stage set its number of Lanes. Now the type of Battle sets it: 3 Lanes in a **Stage**, 4 Lanes in a **Dungeon**, in **Heynspire** and in a Battle with 2 or more **Players**.
- The tutorial was 6 steps before: Stages 1-1 to 1-3, the Deck builder, the first Pack and Combine. Now the **Tutorial** is one session in Stage 1-1, and the other lessons are **Hints**.
- GDD 8.3 says "a quit". The term is **Abandon**: it records no result, and it is not a loss.
- A **Deck Slot** cost Heynstones in the **Bazaar** before, and a new Player had 5. Now a new Player has 3, and the Player buys more with **Coin**. A Deck Slot is still a **Convenience**, because it gives no power.
- **Coin** was named "Marks" before. Gold, Silver and Copper are its denominations, not separate currencies.
- The **Summon Column** was a Side's Column 1 only. Now the **Summon Zone** is Columns 1 to 3, so a Unit can be summoned past an enemy Unit in the zone ([ADR-0011](../../docs/adr/0011-the-summon-zone-is-3-columns-deep.md)). A Unit with **Wall** can also be summoned into Columns 4 and 5. Those Squares are not part of the Summon Zone ([ADR-0022](../../docs/adr/0022-a-wall-can-be-summoned-up-to-column-5.md)).
- The **Races** were named Hearthkin, Thornwild, Hollowborn and Wildmaw before. Those names did not tell Players what the people are. Now they are **Human**, **Elf**, **Undead** and **Orc**, with the same battle identities. Region names such as Hearthvale stay, because they are place names, not Race names.
- A **Race** was always a people before. **Feral** is the one Race with no people ([ADR-0013](../../docs/adr/0013-v1-has-90-creature-cards.md)). "Feral" is not a word for every wild creature: a troll that fights for the orcs is an Orc card.
- The GDD says "Deck archetype". The term is **Archetype**, and it is always a Deck. It is not a **Role**: a Role is the job of one Creature Card.
- The **Workshop** and the **Bazaar** were "places" before. Now they are the actions and the offers. The Town Building that opens each one is a web term.
- The first name for **Hobble** was "Fatigue". "Fatigue" usually means damage from an empty Deck in card games, and it is on the _Avoid_ list of **Sudden Death**.
- The first text for **Knockback** said that the attacked Unit "moves" back. A Unit moves only in its own Movement, with its Speed. The term is **Pushed**, so Speed 0, Entangled and Hobbled do not stop Knockback.
- **Charge** gave +2 Speed at each Rank before. Now it is **Charge N**, and N increases with the Rank from 1 to a maximum of 3. Speed does not increase with the Rank, but Charge does. Thus a higher Rank makes a Charge Unit faster only in the Turn when it is summoned.
- GDD 4.5 said "Units never move through other Units", and a friendly Unit blocked a Lane. Now a Unit moves through friendly Units, also a friendly Wall, and only an enemy Unit stops its **Movement** ([ADR-0018](../../docs/adr/0018-a-unit-moves-through-friendly-units.md)). A push still stops before any Unit, because a push is not Movement.
- In many games, "bleed" is damage over time. In Heynbord, **Bleeding** does no damage: it only makes heals smaller. Damage over time is **Burn** or **Poisoned** ([ADR-0019](../../docs/adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)).
- GDD 4.6 says "a Unit with Attack 0 does not attack", but a bonus could make the Attack 1. The rule uses **Base Attack**, so Rally and Swarm never make a Wall attack.
- An early plan said that the **Rally N** bonus "applies to attacks and to Retaliation", as for **Swarm N**. But the Rally bonus ends at the end of its owner's **Turn**, and Retaliation and First Strike occur only in the enemy's Turn. Thus Rally never adds to Retaliation or First Strike. Swarm does, because the Swarm bonus has no duration.
- Each **Starter Deck** had one Epic card before (Iron Bulwark and Warchief Grukka). Now a Starter Deck has only Common and Uncommon copies. "Epic card" is not exact: the limit is on the **Rank** of each copy, so a Common card at Rare Rank is also not permitted.
- The Collection hid the cards that are not **Discovered** before. Now the Player sees all cards, also the cards that the Player does not own. Discovered controls only **Craft**.
- All Cards in a Hand counted down at the same time before. Then the Deck size, not the Countdown, limited the cards that a Hero played. Now only the **Ticking Cards** count down, and a Deck has a **Countdown Limit** ([ADR-0021](../../docs/adr/0021-countdown-is-a-real-cost.md)). The Countdown Limit is not a cost: "cost" stays on the _Avoid_ list of **Countdown**, because a Card is never paid for in a Battle.
- Melee and Common Units had **Entangle** before. On a Melee Unit it did almost nothing, and on a Ranged Unit it kept one enemy at Speed 0 in each Turn (issue #23). Now only a Ranged Unit with Base Rank Epic or higher has Entangle.
- A Shooter had Range 3 to 5 before. The Range 4 Elf Shooters made Thornwatch win about 87% of its Matchups (issue #23). Now each Shooter has **Range** 3.
- The campaign-stages doc said "expected player level". The term is **Recommended level**, because the Player also sees it.
