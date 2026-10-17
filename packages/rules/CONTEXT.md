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

**Field Effect**: An effect from a Skill Card that stays on a Square area for a number of Turns. In each End Phase of its owner, it hits the enemy Units in its area. The player selects the corner Square of the area that is nearest to their Hero, in the upper Lane of the area. _Avoid_: tile effect, battlefield skill, aura

### Battle

**Battle**: One match between two Sides, from the first Turn to a win or a loss. _Avoid_: match, game, fight, duel

**Solo Battle**: A Battle with 1 Player. The other Side is AI. Stages, Dungeons and Heynspire Floors are Solo Battles. _Avoid_: single-player battle, PvE

**Side**: One of the two teams in a Battle. A Side has 1 or more Heroes. It loses when all its Heroes are Defeated or when it is Routed. _Avoid_: team, party

**Defender**: The Side that does not start the Battle. It takes the second Turn in each Turn number, and it wins at the Turn limit. In a Solo Battle, the enemy is the Defender. _Avoid_: second player, defense side

**Hero**: A commander on a Side. A Hero stands behind its Front and has HP, a Class and a Deck. _Avoid_: commander, avatar, general, player

**Defeated**: The state of a Hero at 0 HP. A Defeated Hero is out of the Battle, but its Side continues while it has other Heroes. _Avoid_: dead, killed, knocked out

**Routed**: The state of a Side with no Units on the Board and no Cards in the Hands and Decks of its Heroes that are not Defeated. A Routed Side cannot act again, so it loses at the end of the Turn, after the End Phase. _Avoid_: exhausted, out of cards, surrender, forfeit

**Player**: The person who plays Heynbord. The Player controls a Hero. _Avoid_: user, account, Hero

**Turn**: One side's sequence of 4 Phases: Start Phase, Play Phase, Resolution Phase and End Phase. _Avoid_: round, move

**Phase**: One of the 4 parts of a Turn. Only a part of a Turn is a Phase. A part of the Tutorial is a Tutorial Step. _Avoid_: step

**Start Phase**: The first part of a Turn. Regenerate, Rally, Bolt, Hero's Bane, Sudden Death, Countdown and the draw occur in it. _Avoid_: Start Step, upkeep, beginning phase

**End Phase**: The last part of a Turn. Burn and Poison damage occur in it, and timed effects go down by 1. _Avoid_: End Step, cleanup, end of turn

**Turn number**: A count of rounds. Both sides take one Turn in each Turn number. _Avoid_: turn count, round number

**Play Phase**: The part of a Turn in which the active side plays Ready cards. _Avoid_: main phase, action phase

**Resolution Phase**: The part of a Turn in which the active side's Units move and attack automatically. _Avoid_: combat phase, battle phase, auto phase

**Action**: The Movement and then the attack of one Unit. Each Unit has one action in each Resolution Phase of its owner. An **extra action** from a Skill Card is one more action in the Play Phase: it uses up a Freeze and an Entangled, the same as a normal action, and no Phase effect occurs again. _Avoid_: activation, extra turn

**Speed**: The maximum number of Squares that a Unit goes forward in its Movement in one Turn. Each Unit has a Base Speed of 2. Keywords, Statuses and Skill Cards change it. _Avoid_: move, pace, Movement points

**Movement**: The part of a Unit's action in which it goes forward in its Lane, up to its Speed. A Unit moves through friendly Units, but it stops before an enemy Unit. A Flying Unit moves over all Units, but it stops before an enemy Flying Unit. A Grounded Unit moves as a ground Unit. A Ranged Unit stops in the first empty Square from which it has a target in its Range. A Unit always stops in an empty Square. _Avoid_: walk, advance, march

**Sudden Death**: Damage to each Hero of the active Side that is not Defeated, in each Start Phase from a set Turn number, so that every Battle ends. _Avoid_: fatigue, overtime

**Burn**: The effect of Fire damage on a Unit: 1 damage in each End Phase of the Unit's owner, for the next 2 End Phases. A new Burn replaces the old Burn. _Avoid_: damage over time

**Freeze**: The effect of Frost damage on a Unit: the Unit skips its next action. A Unit with a Freeze is Frozen. A Ranged Unit never has Frost damage, because it could Freeze the same enemy before each action of that enemy. _Avoid_: stun, chill, slow

**Status**: An effect that stays on a Unit: Burn, Freeze, Entangled, Paralyzed, Poisoned, Hobbled, Bleeding, Exposed, Grounded, Ward or Steadfast. A Damage Type, a Keyword or a Skill Card can put a Status on a Unit. It belongs to the target Unit. Each Status is a Buff or a Debuff. _Avoid_: condition, ailment, effect

**Buff**: A Status that helps its Unit: Ward or Steadfast. A bonus to a stat, such as the Rally bonus, the Swarm bonus, bonus Bulwark, Bonus Attack or Bonus Range, is not a Buff. _Avoid_: blessing, boon, positive status

**Bonus Attack**: Attack that a Skill Card gives to a Unit until the end of its owner's next Turn. A Unit with Base Attack 0 does not get it. A new Bonus Attack replaces the old one, and Rebirth ends it. It is not a Buff. _Avoid_: empower, bestow, attack buff

**Bonus Range**: Range that a Skill Card gives to a Unit for a short time. It ends together with the Bonus Attack from the same card, and Rebirth ends it. A Melee Unit with Bonus Range is a Ranged Unit until the bonus ends. It is not a Buff. _Avoid_: reach, bestow, range buff

**Debuff**: A Status that harms its Unit: Burn, Freeze, Entangled, Paralyzed, Poisoned, Hobbled, Bleeding, Exposed or Grounded. _Avoid_: ailment, curse, negative status

**Paralyzed**: The effect of Lightning damage on a Unit: the Unit does not attack in its next action, but it can still move. Then Paralyzed ends. Until then, it also does not Retaliate and does not use First Strike. If it is also Frozen, Paralyzed ends with the skipped action. Lightning damage gives Paralyzed also when the hit deals 0 damage. A new Paralyzed on a Paralyzed Unit has no effect. _Avoid_: stunned, shocked, dazed, disarmed

**Entangled**: A Status from the Entangle Keyword or from a Skill Card. An Entangled Unit has Speed 0 during its next action, but it can still attack. Entangled then ends. _Avoid_: rooted, snared, slowed

**Poison**: A Keyword. After a Unit with Poison deals attack damage above 0 to an enemy Unit, that Unit becomes Poisoned with 1 more stack. Retaliate does not apply Poison. _Avoid_: venom, toxin

**Poisoned**: A Status from the Poison Keyword or from a Skill Card. The Unit has a stack count. In each End Phase of its owner, it takes 1 damage per stack, then loses 1 stack. A new stack adds to the old stacks. This damage ignores Bulwark, Crit and Block, and it has no Damage Type. _Avoid_: venom, toxin, damage over time

**Hobble N**: A Keyword. After a Unit with Hobble deals attack damage above 0 to an enemy Unit, that Unit becomes Hobbled for N End Phases. Retaliate does not apply Hobble. _Avoid_: Fatigue, Cripple, Slow

**Hobbled**: A Status from the Hobble Keyword. A Hobbled Unit has a maximum Speed of 1, after all bonuses. It has a count that goes down by 1 in each End Phase of its owner, and it ends at 0. A new Hobble keeps the higher count. _Avoid_: fatigued, slowed, crippled

**Grounded**: A Status from a Skill Card. A Grounded Unit does not have Flying, for all rules: it stops before enemy Units, and enemy Flying Units move over it. It has a count of 2 that goes down by 1 in each End Phase of its owner, and it ends at 0. Only a Flying Unit can become Grounded. A new Grounded keeps the higher count. _Avoid_: downed, clipped, pinned, anti-air

**Bleed N**: A Keyword. After a Unit with Bleed deals attack damage above 0 to an enemy Unit, that Unit becomes Bleeding for N End Phases. Retaliate does not apply Bleed. N is 1 up to Rare, 2 at Epic and 3 at Legendary. _Avoid_: Wound, Rend, Maim, anti-heal

**Bleeding**: A Status from the Bleed Keyword. A Bleeding Unit gets half of each heal, rounded down. It has a count that goes down by 1 in each End Phase of its owner, and it ends at 0. A new Bleed keeps the higher count. Bleeding does no damage. _Avoid_: wounded, grievous wounds, healing reduction

**Exposed N**: A Status from a Skill Card. Each Physical hit on an Exposed Unit deals N more damage, after Bulwark. This includes attacks, Physical Skill damage, Retaliate, First Strike, Last Breath and Trample. Burn, Poison and True Damage do not get it. It has a count of 2 End Phases of its owner, and it ends at 0. A new Exposed keeps the higher value. _Avoid_: vulnerable, weakened, marked, armor break

**Ward N**: A Status from a Skill Card. A Ward absorbs damage to its Unit, after Bulwark, Crit and Block, up to N. Its value goes down by the damage that it absorbs, and it ends at 0. It absorbs all damage except True Damage, also Holy, Burn and Poison damage. Absorbed damage is not dealt: a hit that the Ward absorbs fully deals 0 damage. A Ward has no time limit. A new Ward keeps the higher value. _Avoid_: shield, barrier, absorb, aegis

**Steadfast**: A Status from a Skill Card. When damage from any source would bring a Steadfast Unit to 0 HP, the Unit stays at 1 HP and Steadfast ends. A Ward absorbs the damage first. The Unit is not killed: it stays on the Board, Last Breath does not occur, and Trample has no damage that is left. A Unit with Rebirth uses Steadfast first and keeps Rebirth. Steadfast has no time limit. A new Steadfast on a Steadfast Unit has no effect. _Avoid_: endure, undying, death ward, last stand, cheat death

**Damage Type**: The kind of damage: Physical, Fire, Frost, Holy or Lightning. _Avoid_: element, damage kind

**Block**: A chance that the Hero of a Unit gives to that Unit, from the Banner Gear. A Blocked hit deals half of its damage, rounded up. All hits on a Unit can be Blocked, except Holy damage, Burn, Poison and True Damage. A Hero never Blocks. _Avoid_: parry, dodge, evade

**Crit**: A chance that a hit deals 2 times its damage. The Weapon Gear gives the **Unit Crit** chance to the Units of its Hero, and the Trinket Gear gives the **Skill Crit** chance to the Skill Card damage of its Hero. Retaliate, First Strike, Trample, Burn, Poison, Sudden Death and True Damage have no Crit. _Avoid_: critical hit, crit strike, lucky hit

**True Damage**: A hit whose damage nothing decreases or absorbs. It ignores Bulwark, Block and Ward. Nothing increases it: it has no Crit, no Exposed and no Attack bonus such as Rally, Swarm or Bonus Attack. Its value is the value in the text of its effect: for an attack, the Base Attack. It keeps its Damage Type and the Status of that type, or it has no Damage Type. On-hit Keywords and Retaliate apply as usual. The later Burn damage from a True Fire hit is not True Damage. Card text says "N True Damage", or "N True Fire damage" with a Damage Type. Steadfast still keeps the Unit at 1 HP, because Steadfast does not decrease the damage. True Damage is not a Damage Type. _Avoid_: pure damage, piercing damage, unblockable damage, direct damage

**Battle seed**: The start value of the random numbers in one Battle. The same seed and the same Commands give the same Battle. _Avoid_: random seed, RNG

**Replay**: The Battle seed, the Stage, the Dungeon or the Floor, the Class, Deck, level and Gear of the Player, and the list of Commands of one Battle. The rules run it again and get the same Battle. A Replay is correct only for the rules version that made it: after a change to the rules or the content, the same Commands can give a different Battle. _Avoid_: Battle Log, recording, demo, battle export

**Abandon**: The end of a Battle when the Player leaves it before a win or a loss. An Abandoned Battle records no result. _Avoid_: quit, forfeit, surrender, retreat

**Loss share**: The part of the loss reward that a loss gives: the share of the total HP of the enemy Heroes that they lost in the Battle. A loss with no lost enemy Hero HP gives nothing. _Avoid_: consolation, participation reward, pity reward

### Cards and Units

**Card**: A collectible item that a side can play from the Hand. A Card is a Creature Card or a Skill Card. _Avoid_: item

**Creature Card**: A Card that summons a Unit. It has a Race. A Specialist also has a Class. _Avoid_: minion card, unit card, troop card

**Skill Card**: A Card with a one-time effect. It has a Class. _Avoid_: spell, ability card

**Unit**: A thing on the Board that a Creature Card or an effect puts there. _Avoid_: creature, minion, troop, character

**Token**: A Unit that an effect makes, with no Card. It uses the Rank of the Card or effect that made it, and it disappears when it dies. _Avoid_: summon, spawn

**Countdown**: The number of Turns that a Card must be in the Hand before it is Ready. The Countdown of each Card in the Hand goes down by 1 in each Start Phase of its owner. _Avoid_: mana, cost, cooldown, timer, wait

**Ready**: The state of a Card with a Countdown of 0. Only Ready Cards can be played. _Avoid_: active, available, playable

**Recall**: The chance that a Skill Card goes back to the Hand after its effect. The Rank of the Card sets the chance. A Card that goes back is Recalled. _Avoid_: Mastery, return chance, recycle, echo, rebound

**Hand**: The Cards that a Hero holds during a Battle. _Avoid_: queue

**Hand Limit**: The maximum number of Cards in a Hand: 8. A Hero does not draw when its Hand is full, and the Card stays in the Deck. _Avoid_: hand size, max hand

**Deck**: The Cards that a Hero brings into a Battle. During a Battle, the Deck holds only the Cards that the Hero has not drawn. _Avoid_: army, loadout, draw pile

**Countdown Limit**: The maximum sum of the printed Countdowns of the Cards in a Deck, for each player level. A Stage enemy Deck does not have it. _Avoid_: Deck Cost, Leadership, mana cap

**Starter Deck**: A fixed Deck that the game gives to the Player before the Player builds a Deck. The Hero Class comes from the Starter Deck. Each copy in it has the Rank Common or Uncommon. _Avoid_: preset deck, default deck, sample deck

**Deck Slot**: A place where the Player saves one Deck. A new Player has 3 Deck Slots. The Player buys more with Coin, up to 10. _Avoid_: deck (for the place), loadout, preset

**Active Deck**: The Deck that the Player's Hero takes into the next Battle. Its Class is the Hero Class. _Avoid_: current deck, selected deck, equipped deck

**Archetype**: A named reference Deck for one style of play, for example a Human Wall Warrior Deck. The team uses Archetypes to measure balance. A Player never sees an Archetype. _Avoid_: deck type, meta deck, benchmark deck

**Main Archetype**: An Archetype whose Matchups gate release: each pair with another Main Archetype must be in 45% to 55%. _Avoid_: core deck, gated deck

**Diagnostic Deck**: An Archetype whose Matchups are for review only and do not gate release. It becomes a Main Archetype when it passes the gate. _Avoid_: test deck, debug deck

**Specialist Deck**: A Diagnostic Deck that holds one Specialist. It tests that Specialist in a Matchup, and it never becomes a Main Archetype. A Starter Deck, a Stage, a Dungeon, a Floor and a Main Archetype hold no Specialist. _Avoid_: test deck, legendary deck, debug deck

**Matchup**: Many Battles between two Archetypes, with the AI on both Sides, to measure if one Archetype is stronger than the other. _Avoid_: versus, pairing, mirror test

**Power Points**: The strength of one Card at its Base Rank. A Creature Card gets them from its Attack, HP, Speed, Range, Damage Type and Keywords. A Skill Card gets them from its effect, its Damage Type and its Recall. _Avoid_: power level, rating, score, value, Skill Points

**Power Budget**: The Power Points that a Card can have for its Countdown. A Creature Card and a Skill Card with the same Countdown have the same Power Budget. A Card must stay near its Power Budget. _Avoid_: cost, mana curve, stat budget, Skill Power Budget

**Countdown Band**: The Countdowns that the Creature Cards of one Race can have for each Base Rank. For example, a Feral Common has Countdown 2 or 3, and no Feral card has Countdown 1. _Avoid_: Countdown range, cost tier, mana band

**Graveyard**: The place for a Hero's Cards that are used or dead. _Avoid_: discard pile, cemetery, crypt

**Keyword**: A named rule on a Card, for example Flying or Bulwark. _Avoid_: trait, perk, tag, ability

**Race Keyword**: The one Keyword that only Units of one Race can have, from a Card, a Token or any other effect. Each Race has exactly one: Human Knockback, Elf Entangle, Undead Rebirth, Orc Heroic, Goblin Sabotage and Feral Trample. A Race Keyword is also a Main Keyword of its Race, but most Main Keywords are not Race Keywords: other Races can borrow them. Only the Keyword is locked, not its effect: a Skill Card of any Class can still make a Unit Entangled or Push it. _Avoid_: signature keyword, exclusive keyword, racial ability

**Main Keyword**: A Keyword that is part of the battle identity of a Race. Other Races can borrow it. _Avoid_: core keyword, theme keyword

**Bulwark N**: A Keyword. It reduces Physical damage to its Unit by N. It does not reduce Fire, Frost, Holy or Lightning damage. A Skill Card can give bonus Bulwark, with the same rule. The Armor Gear of a Hero is a different thing: it gives Hero HP. _Avoid_: armor, defense, toughness, damage reduction

**Iron Guard**: A Keyword. Each Physical hit on a Unit with Iron Guard deals at most 4 damage. The cap applies after Bulwark, Crit, Block and Exposed, and before Ward. It does not change True Damage or status damage. _Avoid_: Armor, damage cap, damage reduction

**Bolt N**: A Keyword. In each Start Phase of its owner, a Unit with Bolt deals N damage of its own Damage Type to one target at random: an enemy Unit, or the enemy Hero of its Front. The hit applies no Status and has no Crit, so Fire, Frost and Lightning damage do not Burn, Freeze or Paralyze. It can be Blocked, except Holy damage, and a Ward absorbs it. N is the same at each Rank. _Avoid_: Zap, Barrage, Volley

**Entangle**: A Keyword. After a Unit with Entangle deals attack damage above 0 to an enemy Unit, the enemy becomes Entangled. Only a Ranged Unit has Entangle, because a Melee Unit attacks an enemy that cannot move closer. Its Base Rank is Epic or higher, because it can Entangle the same enemy in each Turn. It is the Elf Race Keyword. _Avoid_: Root, Snare

**Charge N**: A Keyword. A Unit with Charge gets +N Speed in the Turn when it is summoned. N is 1 up to Rare, 2 at Epic and 3 at Legendary. N is never more than 3. _Avoid_: Haste, Rush, Dash, Sprint

**Swift**: A Keyword. A Unit with Swift gets +1 Speed. The value is the same at each Rank. _Avoid_: Sprint, Haste, Fast

**Fleet**: A Keyword. A Unit with Fleet gets +2 Speed. The value is the same at each Rank. _Avoid_: Cavalry, Mounted, Very Fast

**Heavy**: A Keyword. A Unit with Heavy gets −1 Speed. The value is the same at each Rank. It is not a Status, and it is not Hobbled. _Avoid_: Hindered, Slow, Encumbered

**Mid-range**: A Keyword. A Unit with Mid-range gets +1 Range, so it is a Ranged Unit with Range 2. The value is the same at each Rank. _Avoid_: Short-range, Ranged 1

**Long-range**: A Keyword. A Unit with Long-range gets +2 Range, so it is a Ranged Unit with Range 3. The value is the same at each Rank. _Avoid_: Sniper, Ranged 2

**Extreme-range**: A Keyword. A Unit with Extreme-range gets +3 Range, so it is a Ranged Unit with Range 4. The value is the same at each Rank. Only a Card with Base Rank Epic or higher has it. _Avoid_: Artillery, Ranged 3

**Base Attack**: The Attack of a Unit for its Rank, without bonuses such as Rally or Swarm. A Unit with Base Attack 0 never attacks and never deals Retaliate damage. _Avoid_: printed Attack, raw Attack

**Rally N**: A Keyword. In its owner's Start Phase, the other friendly Units in the same Lane get +N Attack until the end of the Turn. A Unit with Base Attack 0 gets no Rally bonus. The bonus is fixed in the Start Phase: it stays when the Unit or the Rally Unit leaves the Lane, and a Unit that comes into the Lane later does not get it. _Avoid_: Inspire, Rouse, Battle Cry

**Swarm N**: A Keyword. A Unit with Swarm gets +N Attack while another friendly Unit or Token is in the same Lane. More friendly Units do not increase the bonus. _Avoid_: Horde, Pack

**Heroic N**: A Keyword. After a Unit with Heroic attacks an enemy Unit, it gets +N Attack. This bonus is the Heroic bonus. The Rank sets N: 1 at Common and Uncommon, 2 at Rare, 3 at Epic and 4 at Legendary. Each attack on an enemy Unit adds more, with no limit. An attack also counts when it deals 0 damage. An attack on a Hero, Retaliate, First Strike, Trample and Last Breath do not count. It is the Orc Race Keyword. _Avoid_: Bloodlust, Frenzy, Enrage, Hero damage

**Heroic bonus**: The Attack that Heroic gives to its Unit. It stays until the Unit leaves the Board, and Rebirth ends it. It applies to all attacks of the Unit, on Units and on Heroes, and to Retaliate. It is not Base Attack, not Bonus Attack and not a Buff. _Avoid_: Heroic stacks, rage, growth

**Soul Harvest**: A Keyword. When an enemy Unit dies, a Unit with Soul Harvest gets +1 Attack and +1 HP, also above its maximum HP. A kill by any source counts, also a kill by a Skill Card, a Status or another Unit. A Rebirth is not a kill, and a Unit that the defeat of its Hero removes is not a kill. _Avoid_: Feed, Devour, Snowball

**Soul Harvest bonus**: The Attack and HP that Soul Harvest gives to its Unit. Each kill adds +1 Attack and +1 HP. It stays until the Unit leaves the Board, and Rebirth ends it. It is not Base Attack, not Bonus Attack and not a Buff. _Avoid_: harvest stacks, growth

**Hero's Bane**: A Keyword. In each Start Phase of its owner, a Unit with Hero's Bane deals 1 Physical damage to the enemy Hero of its Front. The hit has no Crit, and it is not an attack. _Avoid_: Hero killer, Siege, Backline

**Retaliate**: A Keyword. When a Unit with Retaliate survives a melee attack, it deals damage equal to its Attack to the attacker, with its own Damage Type. This damage is also called Retaliate. It has no Crit, it does not apply Keywords such as Poison, Entangle, Hobble, Bleed or Knockback, and it does not cause another Retaliate. A Frozen Unit does not retaliate. _Avoid_: Retaliation, thorns, counterattack

**Regenerate N**: A Keyword. In its owner's Start Phase, a Unit with Regenerate heals N HP, up to its maximum HP. _Avoid_: Regeneration, regen, heal over time

**Last Breath: X**: A Keyword. X occurs when the Unit leaves the Board. In v1, X deals damage to the nearest enemy Unit ahead in the same Lane, or summons a Token in the Square that the Unit left. _Avoid_: death effect, deathrattle

**Rebirth**: A Keyword. The first time a Unit with Rebirth dies, it comes back in the same Square with 1 HP and without Rebirth. Its Statuses, its bonus Bulwark, its bonus Attack, its bonus Range, its Rally bonus, its Heroic bonus and its Soul Harvest bonus end. A Unit that _Smite_ kills does not come back. _Avoid_: revive, resurrect

**Summon X**: A Keyword. When a Unit with Summon comes onto the Board from its Creature Card, a Token X with the Rank of that Card copy appears next to it. The Token goes to the first empty Square of an open Lane in this order: the Square behind the Unit, then the same Column in the Lane with the lower number, then the same Column in the Lane with the higher number. The Square does not need to be in the Summon Zone. If no Square is empty, no Token appears. A Rebirth return and a Start Unit give no Token. _Avoid_: Spawn, Call, Raise

**Knockback N**: A Keyword for melee Units. After a Unit with Knockback deals attack damage above 0 to an enemy Unit, that Unit is Pushed N Squares back, toward its own Hero, in its own Lane. The push stops before another Unit and at the pushed Unit's Column 1. A Unit with Wall is never Pushed. Retaliate and First Strike do not apply Knockback. N is 1 up to Rare, 2 at Epic and 3 at Legendary. _Avoid_: Push, Shove, Repel, Displace

**Pushed**: Moved to another Square by an effect such as Knockback or a Skill Card, not by the Unit's own Movement. Speed, Flying, Frozen, Entangled and Hobbled do not change a push. Pushed is not a Status. _Avoid_: knocked back, moved, displaced

**Sabotage N**: A Keyword. When a Unit with Sabotage comes onto the Board from its Creature Card, the Card with the lowest Countdown in the Hand of the enemy Hero of that Front gets +N Countdown. A Ready Card is the lowest. If two Cards have the same Countdown, the oldest Card in the Hand gets it. Rebirth and Tokens do not apply Sabotage. N is the same at each Rank. _Avoid_: Delay, Stall, Disrupt

**Spawnbane N**: A Keyword. When an enemy Hero summons a Unit from a Creature Card, a Unit with Spawnbane deals N damage to that Unit. The damage has the Damage Type of the Spawnbane Unit and applies no Status. It comes before the Sabotage and the Summon of the new Unit, so a Unit that dies does neither. A Token does not come from a Creature Card, so Spawnbane does not hit a Token. N is the same at each Rank. _Avoid_: anti-summon, Intercept, Ambush

**Trample**: A Keyword for melee Units. When a Unit with Trample kills an enemy Unit with attack damage, the damage above that Unit's HP hits the enemy Unit in the next Square behind it, in the same Lane. It never hits a Hero. This second hit is not an attack: it has no Crit and no Retaliate, and it does not apply Keywords such as Poison, Hobble, Bleed or Knockback. It does not Trample again. _Avoid_: Cleave, Overrun, Pierce

**Vampirism**: A Keyword. When a Unit with Vampirism deals Physical damage, it heals HP equal to the damage that the hit dealt after Block and Ward. The heal stops at its maximum HP. It counts for an attack on a Unit or a Hero, Retaliate, First Strike, Trample and Last Breath. It does not apply to status damage. _Avoid_: Lifesteal, Drain, Leech

**Unique**: A Keyword. While a Unit from a Unique Card is on a Side of the Board, no Hero of that Side can play a copy of that Card, at any Rank. Each Unit from that Card counts, also a Unit that the Stage puts on the Board. Enemy Units do not count. A Deck can still hold more than 1 copy. _Avoid_: Singleton, One-of, Legend rule

**Wall**: A Keyword. A Unit with Wall has no Movement and does not attack, also when an effect gives it Speed or Attack. It never deals Retaliate or First Strike damage. It blocks enemy Units in its Lane, and it is never Pushed. Its Hero can summon it into the Summon Zone and also into Columns 4 and 5 of an open Lane, also past an enemy Unit. Each Card with Wall has Attack 0. _Avoid_: Barricade, Blocker, Taunt

**Race**: The people that a Creature Card belongs to: Human, Elf, Undead, Orc or Goblin, or the Feral host. A Race also includes the beasts and spirits that fight with that people, so a grave hound that fights for the Undead is an Undead card. Orc cards show only orcs, so that no Orc card looks like a Feral card. The Race tells the side that a card fights for, not the species of the figure. _Avoid_: faction, tribe, kingdom, species

**Feral**: The one Race with no people. A Feral card is a wild creature that serves no people, for example a wyrm or a giant spider. A creature that fights for a people is a card of that people's Race, not a Feral card. _Avoid_: beast, creature, wild (as a Race name)

**Range**: The maximum number of Squares in front of a Unit at which it attacks the nearest enemy Unit. Each Unit has a Base Range of 1. Keywords and Bonus Range increase it. There is no maximum Range. _Avoid_: reach, attack distance

**Melee Unit**: A Unit with Range 1. It attacks only the Square in front of it. _Avoid_: close-range Unit, fighter

**Ranged Unit**: A Unit with Range 2 or more. A Melee Unit with Bonus Range is a Ranged Unit until the bonus ends. _Avoid_: shooter, archer, caster

**Class**: The type of a Hero, of the Skill Cards that the Hero can use, and of a Specialist: Warrior, Ranger, Mage or Priest. _Avoid_: job, profession, role

**Rank**: The power grade of one copy of a Card: Common, Uncommon, Rare, Epic or Legendary. The Rank names use usual rarity words, so that players know the order immediately. But the concept is a Rank, not a rarity: Combine can make the Rank of a copy higher. _Avoid_: rarity, tier, star, level, quality

**Base Rank**: The lowest Rank in which a Card exists. A Creature Card with Base Rank Legendary is a Specialist. _Avoid_: rarity, starting tier

**Specialist**: A Creature Card with Base Rank Legendary. It has one Class, and a Hero can put it in a Deck only when the Hero has that Class. Every Specialist has Unique. Only a Specialist has a Class. _Avoid_: class creature, restricted card, legendary unit

### Progression

**Collection**: All the Card copies that the Player owns. _Avoid_: inventory, library

**Discovered**: The state of a Card that the Player has owned at least one time. _Avoid_: unlocked, known, seen

**Combine**: The action that changes two copies of the same Card in the same Rank into one copy in the next Rank. _Avoid_: fuse, merge, upgrade, evolve

**Extract**: The action that changes one Card copy into Essence. _Avoid_: dismantle, disenchant, salvage, sell

**Craft**: The action that changes Essence into one copy of a Discovered Card in its Base Rank. _Avoid_: forge, make, fuse

**Essence**: The resource from Extract that pays for Craft. _Avoid_: dust, material, shards

**Coin**: The currency that the Player earns in Battles and other play. It pays for Packs, Combine, Gear upgrades (with a Forge Stone) and Deck Slots. _Avoid_: Marks, money, gold (as a name for all of the currency)

**Copper**, **Silver**, **Gold**: The three denominations of Coin. 100 Copper is 1 Silver, and 100 Silver is 1 Gold. They are one currency with one balance, not three currencies. _Avoid_: bronze

**Heynstones**: The rare currency. The Player earns it slowly through play, or buys it with real money. It buys only Cosmetics and Conveniences, never power. _Avoid_: gems, diamonds, crystals, premium currency (in player-facing text)

**Convenience**: An item that changes comfort or organization, for example a Deck Slot. It never changes the result of a Battle, the speed of progress or the content of the Collection. _Avoid_: boost, perk, premium feature

**Bazaar**: The offers that the Player can buy with Heynstones: only Cosmetics and Conveniences. _Avoid_: shop, store, market

**Pack**: A set of random Cards that the Player buys with Coin or gets as a reward. There are three Packs: Peddler, Merchant and Royal. Each one has its own Drop Rates and price. _Avoid_: booster, loot box, chest, gacha, pull

**Unopened Pack**: A Pack that the Player got as a reward and has not opened yet. A bought Pack opens at once, so it is never an Unopened Pack. _Avoid_: free Pack, owned Pack, Reward Pack

**Peddler Pack**: The cheapest Pack. It gives mostly Common Cards, the most Cards for each Coin, and no Epic or Legendary Cards. _Avoid_: basic pack, Common Pack

**Merchant Pack**: The middle Pack. It can give each Rank except Legendary. _Avoid_: Standard Pack, normal pack

**Royal Pack**: The most expensive Pack. It gives no Common Cards, and it is the only Pack that can give a Legendary Card. _Avoid_: premium pack, Legendary Pack

**Race Pack**: A Peddler, Merchant or Royal Pack that has only the Creature Cards of one Race. The Player selects the Race, and it costs more than the same Pack with all Cards. _Avoid_: faction pack

**Class Pack**: A Peddler, Merchant or Royal Pack that has only the Skill Cards of one Class. The Player selects the Class, and it costs the same as the Race Pack of the same Pack. _Avoid_: skill pack, spell pack

**Pack Guarantee**: The promise that a Pack gives a Card of a stated Rank or higher after a stated number of Packs of the same kind without one. The Packs screen shows how many Packs are left. _Avoid_: pity, mercy, bad-luck protection

**New Card First**: The rule of the Merchant Pack and the Royal Pack: after the Rank roll, the Pack gives a Card that the Player has not Discovered, when the roll permits one. _Avoid_: duplicate protection, Discovery bias

**Drop Rate**: The chance of each Rank for each Card in a Pack. Each of the three Packs has its own Drop Rates. _Avoid_: odds, luck

**Gear**: The items in the Hero's 4 slots that give the Hero and its Units stats. Each slot holds one fixed item: the Weapon, the Armor, the Trinket or the Banner. An item has a level from 0 to 25. _Avoid_: equipment, items, gear set

**Gear upgrade**: The action that adds 1 level to one Gear item for Coin and 1 Forge Stone of the tier of the new level. It never fails, and a Gear level never goes down. _Avoid_: enchant, refine, level up, forge

**Forge Stone**: An earn-only item that a Gear upgrade uses. Each Forge Stone has a Forge Stone tier, and each tier upgrades Gear to the levels of one band: Common to levels 1 to 5, Uncommon to 6 to 10, Rare to 11 to 15, Epic to 16 to 20 and Legendary to 21 to 25. _Avoid_: Enchanting Gem, Legendary Gem, gem, enchant stone, material, shard

**Forge Stone tier**: The grade of a Forge Stone: Common, Uncommon, Rare, Epic or Legendary. It uses the names of the Ranks, but it is not a Rank: a Rank is the grade of a Card copy. _Avoid_: Forge Stone Rank, rarity

**Profile**: All the saved progress of one Player: XP, balances, Collection, Decks, Gear levels, Forge Stones, Stage results and the other records that must stay after the game closes. _Avoid_: save file, account, player data

**Player level**: The level of the Player from XP. It sets the Hero HP and the Deck size limits. _Avoid_: account level, Hero level

**Workshop**: The set of actions that change Card copies and Essence: Combine, Extract and Craft. _Avoid_: alchemy lab, forge

**Cosmetic**: An item that changes how something looks and never changes gameplay. _Avoid_: skin (as a general word), vanity item

**Cosmetic family**: One of the 4 kinds of Cosmetic of v1: Card back, Hero portrait, Gear look and Board skin. All Bazaar items of a family share one price. _Avoid_: category, type, class of cosmetic

**Earn-only Cosmetic**: A Cosmetic that play gives for free and never changes into Heynstones. The Bazaar never sells it. The first win of each Boss Floor gives one, and 3 hard Achievements give one (ADR-0008). _Avoid_: free cosmetic, reward cosmetic

**Owned**: A Cosmetic in the Player's owned list. The Player buys one in the Bazaar or earns it, and owns it forever: the Player never sells or loses it, as a Deck Slot. _Avoid_: unlocked, equipped

**Bazaar item**: A Bazaar Cosmetic with a Heynstone price. _Avoid_: product, offer item

**Achievement**: A one-time goal with a reward. It is In progress, then Completed when the Player meets the goal, then Claimed when the Player takes the reward. _Avoid_: quest, mission, trophy, badge

**Feat**: An Achievement that one won Battle completes, with a goal about the Deck, the Turns or the events of that Battle. _Avoid_: challenge, trial, battle achievement

**Tally**: A lifetime count in the Profile that an Achievement uses, for example the number of Packs opened. It only goes up. _Avoid_: stat, statistic, counter

**Play Style**: A fixed priority list that tells the economy simulation how a simulated Player spends Coin and Essence, for example Collector, Upgrader or Balanced. _Avoid_: profile, persona, spending plan

**Pacing target**: A value that a Player must have at a point in the game, for example the Packs opened at the end of Region 2. It is for the median Player of a Play Style who plays each Stage again until the Stage has 3 Stars. A Pacing target can apply to only some Play Styles. _Avoid_: milestone, KPI, benchmark, goal

### Modes

**Stage**: One Battle in the Campaign, with a fixed enemy and rewards. _Avoid_: level, mission

**Recommended level**: The Player level that the First-try Path gives before a Stage or a Floor. A new Player with no Gear is expected to win the Stage or the Floor on the first try at this level. The Player can see it. _Avoid_: expected level, suggested level, required level

**First-try Path**: The first win of each earlier Stage, in Stage order, with no losses and no repeats. After the last Stage, it continues with the first win of each Floor and then with Dungeon wins, until Player level 30. It gives the smallest XP that a Player can have at a Stage or at a Dungeon unlock level. _Avoid_: golden path, ideal run, expected path

**Expected Gear**: The highest Gear levels that a Player on the First-try Path has before a Stage or a Floor, or when it gets to the unlock level of a Dungeon, over all Play Styles. It is level 0 for each Stage before Gear unlocks. _Avoid_: typical Gear, recommended Gear

**Boss Stage**: The last Stage of a Region, with special rules. Its enemy Hero is a Boss. _Avoid_: boss level, raid

**Start Unit**: A Unit that a Stage puts on the enemy Side of the Board before the first Turn, for example the Boss's bodyguard. It is a copy of a Card, so its Rank is at least the Card's Base Rank. _Avoid_: pre-placed Unit, spawn, Unique boss Unit

**Boss**: An enemy Hero with a name and special rules. One Boss is one Hero. _Avoid_: Dungeon Boss, boss Unit, elite, champion

**Boss Rule**: A rule of a Boss that activates automatically, one time, when the HP of the Boss goes to or below a set percentage of its maximum HP. It is part of the Boss data, not a Card. _Avoid_: Phase, enrage, ability, passive, special rule

**Dungeon**: A named place outside the Campaign where the Player fights one Battle against all its Bosses, with no Battles before them. The Player can play a Dungeon again. _Avoid_: raid, boss rush, instance, level

**Region**: A group of 10 Stages. _Avoid_: chapter, world, area

**Campaign**: All Regions and their Stages. _Avoid_: story mode, adventure

**Debut Race**: A Race that the Player fights for the first time in a Region. Region 1 has two (Human and Orc). Each later Region has one, and it also has the Debut Race of the Region before it. The Boss of a Region is of a Debut Race of that Region. A Debut Race is only about the enemies: the Player can get cards of each Race from Packs at any time. _Avoid_: new Race, featured Race, unlocked Race

**Stars**: The 1 to 3 result grade of a Stage win. _Avoid_: score, rating; never use for Rank

**Star Turn**: The Turn number of a Stage. A win must come before it to give 3 Stars. Each Stage has its own Star Turn. _Avoid_: Turn limit, par, time limit, fast-win Turn

**Star chest**: A reward of a Region that the Player claims when the best Stars of its Stages add up to 10, 20 or 30. Each Region has 3. _Avoid_: milestone, Star reward

**Repeat win**: A win of a Stage or a Dungeon that the Player won before. It gets no first-win bonus. _Avoid_: replay, farm win, re-clear

**Stage card pool**: The Cards that a repeat win of a Stage can give: the different Cards of its enemy Deck, but not a Skill Card of another Class than the Player's Deck. _Avoid_: drop table, loot pool

**Dungeon card pool**: The Cards that a repeat win of a Dungeon can give: the different Cards of the enemy Decks of all its Bosses, but not a Skill Card of another Class than the Player's Deck. _Avoid_: drop table, loot pool, Boss pool

**Heynspire**: The tower mode with 50 Floors. _Avoid_: tower, ascension tower

**Floor**: One Battle in Heynspire. _Avoid_: level, stage

**Boss Floor**: Each 10th Floor. Its enemy Hero is a Boss. _Avoid_: milestone Floor, guardian Floor, 10th-Floor boss

**Current Floor**: The lowest Floor that the Player has not won. It is the only Floor that the Player can fight. After the win of Floor 50, Heynspire has no Current Floor. _Avoid_: next Floor, top Floor, active Floor

**Campaign card pool**: The Cards in the enemy Decks of all Stages. A Floor template uses only these Cards. _Avoid_: Campaign pool, Stage pool

**Floor template**: The enemy of one group of Floors, written by hand: an enemy name, a Race theme, a Class and a Deck of Base Rank copies from the Campaign card pool. 9 Floor templates make the normal Floors, and each Boss Floor has its own. _Avoid_: Floor preset, Floor blueprint

**Strength curve**: The rule that gives, for a Floor number, the Rank steps, the Hero HP, the Gear and the Deck size of the enemy of a Floor. With a Floor template, it makes the Floor. _Avoid_: difficulty curve, scaling, level curve

**Auto-play**: A mode in which the enemy AI logic plays the Player's Cards. The Player cannot start it. _Avoid_: bot, auto battle

**Sweep**: The use of 1 to 10 Tickets of one type on a Stage or a Dungeon. Each Ticket gives one repeat-win reward at once, with no Battle. A Sweep is a Campaign Sweep or a Dungeon Sweep. _Avoid_: auto battle, quick battle, auto-resolve, raid, skip

**Campaign Sweep**: A Sweep of a 3-Star Stage. It uses Campaign Sweep Tickets. _Avoid_: Stage Sweep

**Dungeon Sweep**: A Sweep of a Dungeon that the Player won. It uses Dungeon Sweep Tickets. _Avoid_: Boss Sweep, raid

**Campaign Sweep Ticket**: An earn-only item that the Player uses for a Campaign Sweep. A Stage win and a Floor win give Campaign Sweep Tickets. _Avoid_: Sweep Ticket, Stage Ticket, Skip Ticket, raid ticket, energy, stamina

**Dungeon Sweep Ticket**: An earn-only item that the Player uses for a Dungeon Sweep. A Dungeon win gives Dungeon Sweep Tickets. _Avoid_: Sweep Ticket, Boss Ticket, key, raid ticket, energy, stamina

**Hold Rule**: A condition of the AI for one type of Skill Card effect. While the condition is false, the AI keeps a Ready Card with that effect in the Hand and does not play it. It is not a game rule: a Player can play the same Card at any time. _Avoid_: reserve, save, hold threshold

**Tutorial**: The one guided session that teaches a new Player the core of a Battle. It is each play of Stage 1-1 until the first win of Stage 1-1, and it never shows after that win. _Avoid_: onboarding, tutorial Stages, training

**Tutorial Step**: One of the 4 guided parts of the Tutorial: a short text with an arrow or a highlight. It shows when its subject first appears in the Battle, at most one time in each play of the Tutorial. _Avoid_: lesson, coachmark, tooltip, Hint

**Hint**: A one-line tip that shows one time, when the Player first meets something that the Tutorial does not teach. It is not part of the Tutorial. _Avoid_: tutorial step, tooltip, popup

## Relationships

- A **Player** controls one **Hero**. The Hero has one **Class**: the Class of the **Active Deck**. The Player changes the Hero Class when the Player selects a Deck of another Class.
- A **Battle** has two **Sides**. Each Side has 1 or more **Heroes**. In v1, the Player's Side has exactly 1 Hero.
- Each **Hero** has its own **Deck**, **Hand**, **Graveyard**, **Class** and **Gear**. All the Heroes of a Side play in the same **Turn**.
- Each **Hero** has one **Front**. A Hero can summon into the **Summon Zone** of any Front of its Side. Its **Skill Cards** can target any **Square**, and an enemy **Hero** that is not **Defeated**.
- A **Stage** has 3 **Lanes**. A **Dungeon**, a **Floor** and a Battle with 2 or more **Players** have 4 Lanes. The type of Battle sets the number of Lanes. A Stage or a Dungeon can make the Board smaller only with **Closed Lanes**.
- A **Unit** belongs to the Hero that summoned it, and uses that Hero's **Gear**.
- A **Creature Card** has at most 1 of the Speed Keywords **Swift**, **Fleet** and **Heavy**, and at most 1 of the Range Keywords **Mid-range**, **Long-range** and **Extreme-range**. It can have one of each.
- A **Skill Card** or a **Keyword** can heal a **Unit**. Nothing heals a **Hero**: in a Battle, Hero HP only goes down ([ADR-0028](../../docs/adr/0028-nothing-heals-a-hero.md)).
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
- A **Deck** holds a **Card** and a **Rank**, not one specific **Card copy**. After a **Combine**, a Deck that used the old-Rank copies uses the new-Rank copy. After an **Extract**, the copy goes out of each Deck that used it. A Card stays **Discovered** after its last copy is Extracted.
- Each **Stage** has one **Recommended level**. It is a guide, not a lock: a Player below it can still play the Stage. A loss (its **Loss share**) gives XP too, so a real Player is at or above the level of the **First-try Path**.
- A **Stage** **Repeat win** and a **Campaign Sweep** give no XP. A **Dungeon** Repeat win and a **Dungeon Sweep** give XP ([ADR-0049](../../docs/adr/0049-a-stage-repeat-win-gives-no-xp.md)).
- Each **Stage** hits its win-rate target two times: with no **Gear** and with the **Expected Gear**, both at the **Recommended level**. A Player who loses gets **Gear** sooner. That is a catch-up, not a miss.
- A **Region** has 10 **Stages**, and the last one is a **Boss Stage**.
- The **Tutorial** ends with the first win of Stage 1-1. A loss or an **Abandon** does not end it. A later play of Stage 1-1 is a normal **Stage**. The Tutorial has 4 **Tutorial Steps**. A **Hint** shows one time for each subject, at any time after the Tutorial.
- The Player can do a **Campaign Sweep** of a **Stage** only when its best **Stars** are 3, and a **Dungeon Sweep** of a **Dungeon** only when it has 1 or more wins. A Sweep always wins: each Ticket gives one repeat-win reward. A Sweep never changes the **Stars** or the wins of a Dungeon, and it gives no Tickets.
- A **Stage** win and a **Floor** win give 2 **Campaign Sweep Tickets**. A **Dungeon** win gives 1 **Dungeon Sweep Ticket**. A loss and an **Abandon** give none. The two types of Ticket never change into each other. The Bazaar never sells them, and they never change into **Coin**, **Essence** or **Heynstones** ([ADR-0035](../../docs/adr/0035-a-sweep-uses-sweep-tickets-and-always-wins.md), [ADR-0041](../../docs/adr/0041-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)).
- A **Gear upgrade** to level _n_ uses 1 **Forge Stone** of the tier of level _n_. A Forge Stone of a different tier cannot replace it, and Forge Stones never combine or change into a different tier. The Bazaar never sells Forge Stones, and they never change into **Coin**, **Essence** or **Heynstones** ([ADR-0038](../../docs/adr/0038-gear-upgrades-need-earn-only-forge-stones.md)).
- A **Stage** first win, a 10-Star **Star chest**, a repeat win, a **Sweep**, a **Dungeon** win and some **Floor** first wins give **Forge Stones** (Economy 2). Only Dungeon 3 wins and the first wins of the 10th Floors give Legendary Forge Stones. The Player keeps them before **Gear** unlocks.
- A **Boss** has 0 or more **Boss Rules** ([ADR-0040](../../docs/adr/0040-a-boss-rule-is-a-one-time-hp-threshold-with-a-fixed-effect-list.md)). A Boss Rule activates at most one time in a Battle, and never for a **Defeated** Boss. A Boss Rule never heals a Hero ([ADR-0028](../../docs/adr/0028-nothing-heals-a-hero.md)). A Boss Rule that can still put a Unit on the Board stops its Side from being **Routed** until it activates.
- A **Dungeon** has 1 or more **Bosses**. All of them are on the enemy Side of one **Battle**. Each Dungeon unlocks at a **Player level**. A Dungeon win gives no **Stars**. The **Recommended level** of a Dungeon is its unlock level.
- **Heynspire** opens with the first win of the last **Boss Stage**. The Player fights only the **Current Floor**, and a won **Floor** cannot be played again: it has no repeat-win reward and no **Sweep**. A Floor win gives no **Stars**. Each Floor hits the win-rate target of a **Stage**, and each **Boss Floor** the target of a **Boss Stage**, with no **Gear** and with the **Expected Gear** ([ADR-0042](../../docs/adr/0042-heynspire-floors-come-from-templates-and-a-strength-curve.md)).
- An **Achievement** that is Completed stays Completed, also when the Profile changes later. Its reward goes into the Profile only when the Player claims it.
- Only a **Battle** that the Player plays can complete a **Feat**. A **Sweep**, a **Replay**, **Auto-play** and the **Tutorial** never complete a Feat, and a Sweep never adds to a **Tally**.
- The Player has one balance of **Coin**, shown in **Gold**, **Silver** and **Copper**, and a separate balance of **Heynstones**.
- **Coin** and **Heynstones** never change into each other or into **Essence**.

## Example dialogue

> **Dev:** "When the Countdown of a Creature Card reaches 0, the card is Ready. In the Play Phase I put it into an empty Square of the Summon Zone, and it becomes a Unit." **Designer:** "Yes. That Unit also acts in the Resolution Phase of the same Turn. If it dies, the Card goes to the Graveyard, but a Token just disappears."

## Flagged ambiguities

- The original games used "stars" for card grades. Heynbord uses **Rank** for card grades and **Stars** only for Stage results.
- 3 **Stars** needed a win before Turn number 15 on all **Stages**. Now each Stage has its own **Star Turn**. Do not call it a "Turn limit": the Turn limit is Turn number 60, when the **Defender** wins.
- "Fuse" in the original games was a random recipe system. Heynbord does not have it. **Combine** and **Craft** replace it.
- **Recall** was named "Mastery" before. "Mastery" told the Rank, not the effect, so Players did not know what it did.
- **Hero** and **Player** are different. A Player is a person. A Hero is the commander on the Board.
- GDD 5.5 and an early code note put the **Class** on the **Hero**, and moved it there when the Hero screen came. The Class stays on the **Deck Slot**, and the Hero has the Class of the **Active Deck**. Thus a change of Class never makes a Deck invalid.
- The GDD used "a Unique boss Unit" for a Unit that starts on the Board in a Boss Stage. The term is **Start Unit**, and that Unit is not a **Boss**. A Boss is always a Hero, in a Boss Stage and in a Dungeon.
- A **Hero** used to lose the Battle at 0 HP. Now a Hero is **Defeated** at 0 HP, and only a **Side** with no Heroes left loses ([ADR-0009](../../docs/adr/0009-a-side-has-one-or-more-heroes.md)). A Side that is **Routed** also loses ([ADR-0012](../../docs/adr/0012-a-routed-side-loses.md)).
- The **Board** used to have 1 to 3 Lanes in v1, and each Stage set its number of Lanes. Now the type of Battle sets it: 3 Lanes in a **Stage**, 4 Lanes in a **Dungeon**, in **Heynspire** and in a Battle with 2 or more **Players**.
- The tutorial was 6 steps before: Stages 1-1 to 1-3, the Deck builder, the first Pack and Combine. Now the **Tutorial** is one session in Stage 1-1, and the other lessons are **Hints**.
- GDD 8.3 says "a quit". The term is **Abandon**: it records no result, and it is not a loss.
- A **Deck Slot** cost Heynstones in the **Bazaar** before, and a new Player had 5. Now a new Player has 3, and the Player buys more with **Coin**. A Deck Slot is still a **Convenience**, because it gives no power.
- **Coin** was named "Marks" before. Gold, Silver and Copper are its denominations, not separate currencies.
- The **Summon Column** was a Side's Column 1 only. Now the **Summon Zone** is Columns 1 to 3, so a Unit can be summoned past an enemy Unit in the zone ([ADR-0011](../../docs/adr/0011-the-summon-zone-is-3-columns-deep.md)). A Unit with **Wall** can also be summoned into Columns 4 and 5. Those Squares are not part of the Summon Zone ([ADR-0023](../../docs/adr/0023-a-wall-can-be-summoned-up-to-column-5.md)).
- The **Races** were named Hearthkin, Thornwild, Hollowborn and Wildmaw before. Those names did not tell Players what the people are. Now they are **Human**, **Elf**, **Undead** and **Orc**, with the same battle identities. Region names such as Hearthvale stay, because they are place names, not Race names.
- A **Race** was always a people before. **Feral** is the one Race with no people ([ADR-0013](../../docs/adr/0013-v1-has-90-creature-cards.md)). "Feral" is not a word for every wild creature: a troll that fights for the orcs is an Orc card.
- The GDD says "Deck archetype". The term is **Archetype**, and it is always a Deck.
- The **Workshop** and the **Bazaar** were "places" before. Now they are the actions and the offers. The Town Building that opens each one is a web term.
- The first name for **Hobble** was "Fatigue". "Fatigue" usually means damage from an empty Deck in card games, and it is on the _Avoid_ list of **Sudden Death**.
- The first text for **Knockback** said that the attacked Unit "moves" back. A Unit moves only in its own Movement, with its Speed. The term is **Pushed**, so Speed 0, Entangled and Hobbled do not stop Knockback.
- **Charge** gave +2 Speed at each Rank before. Now it is **Charge N**, and N increases with the Rank from 1 to a maximum of 3. Speed does not increase with the Rank, but Charge does. Thus a higher Rank makes a Charge Unit faster only in the Turn when it is summoned.
- GDD 4.5 said "Units never move through other Units", and a friendly Unit blocked a Lane. Now a Unit moves through friendly Units, also a friendly Wall, and only an enemy Unit stops its **Movement** ([ADR-0018](../../docs/adr/0018-a-unit-moves-through-friendly-units.md)). A push still stops before any Unit, because a push is not Movement.
- A Flying Unit moved over all Units before, also enemy Flying Units. Now an enemy Flying Unit stops a Flying Unit, the same as an enemy Unit stops a ground Unit ([ADR-0018](../../docs/adr/0018-a-unit-moves-through-friendly-units.md)).
- A **Ranged Unit** that had no target in its Range at the start of its action moved up to its full Speed before, also when a target came into its Range after 1 Square. Then it stood nearer to the enemy than its Range made necessary. Now its **Movement** stops in the first empty Square from which it has a target in its Range.
- In many games, "bleed" is damage over time. In Heynbord, **Bleeding** does no damage: it only makes heals smaller. Damage over time is **Burn** or **Poisoned** ([ADR-0019](../../docs/adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)).
- GDD 4.6 says "a Unit with Attack 0 does not attack", but a bonus could make the Attack 1. The rule uses **Base Attack**, so Rally and Swarm never make a Wall attack.
- A **Wall** did not move or attack only because it had Speed 0 and Base Attack 0. Then a Speed or Attack buff, also Charge, could make a Wall move or attack. Now the Wall Keyword itself stops Movement, attacks, Retaliate and First Strike. The Attack 0 of a Wall Card is only a rule for the Card, so that the Power Budget does not count a stat that has no effect. A Wall Card had Speed 0 before. Now it has the Base Speed 2, the same as each Unit, and the Wall Keyword stops its Movement.
- An early plan said that the **Rally N** bonus "applies to attacks and to Retaliate", as for **Swarm N**. But the Rally bonus ends at the end of its owner's **Turn**, and Retaliate and First Strike occur only in the enemy's Turn. Thus Rally never adds to Retaliate or First Strike. Swarm does, because the Swarm bonus has no duration.
- Each **Starter Deck** had one Epic card before (Iron Bulwark and Warchief Grukka). Now a Starter Deck has only Common and Uncommon copies. "Epic card" is not exact: the limit is on the **Rank** of each copy, so a Common card at Rare Rank is also not permitted.
- The Collection hid the cards that are not **Discovered** before. Now the Player sees all cards, also the cards that the Player does not own. Discovered controls only **Craft**.
- The GDD had a Collection screen before, next to the Deck builder. The two screens showed almost the same cards, so the Collection screen was removed. The **Collection** is the data that the Player owns, not a screen: the Deck builder shows it. "Inventory" is not a term: each thing that the Player owns shows on the screen where the Player uses it.
- All Cards in a Hand counted down at the same time before. Then the Deck size, not the Countdown, limited the cards that a Hero played. For a short time (issue #21), only 3 "Ticking Cards" counted down, and the other Cards were "Waiting Cards". Players found this slow and hard to track, so it was removed: all Cards in the Hand count down again. Now only the **Countdown Limit** of a Deck makes a long Countdown a real cost ([ADR-0021](../../docs/adr/0021-countdown-is-a-real-cost.md)). The Countdown Limit is not a cost: "cost" stays on the _Avoid_ list of **Countdown**, because a Card is never paid for in a Battle.
- Melee and Common Units had **Entangle** before. On a Melee Unit it did almost nothing, and on a Ranged Unit it kept one enemy at Speed 0 in each Turn (issue #23). Now only a Ranged Unit with Base Rank Epic or higher has Entangle.
- A **Main Keyword** was the only Race signature before, and other Races could borrow each one. Thus "signature Keyword" in ADR-0017 did not mean "only this Race". Now each Race also has one **Race Keyword** that no other Race can have ([ADR-0026](../../docs/adr/0026-each-race-has-one-race-keyword.md)). Entangle was "not an Elf Main Keyword" in ADR-0022. Now it is the Elf Race Keyword.
- Rimebreath Drake was a Ranged Unit with Frost damage before. It Froze the nearest enemy before each action of that enemy, so that enemy almost never acted (issue #24). Unlike Entangle, a higher Base Rank does not fix this: an Epic Frost Shooter locked its target longer. Now no Ranged Unit has Frost damage, at any Rank ([ADR-0025](../../docs/adr/0025-no-ranged-unit-has-frost-damage.md)). A melee Frost Unit can also Freeze the Unit in front of it again, but only in a few Battles.
- A Shooter had Range 3 to 5 before. The Range 4 Elf Shooters made Thornwatch win about 87% of its Matchups (issue #23). Then no Creature Card had a Range above 3. Now there is no maximum **Range**, and Keywords set the Range of a Card.
- A Melee Unit had no Range before, and a Ranged Unit had Range 1 or more. Now each Unit has a Base Range of 1: a **Melee Unit** has Range 1, and a **Ranged Unit** has Range 2 or more.
- No rule gave a Unit Speed 2 before, and 19 Creature Cards had it, also a Frontliner (Militia Recruit) and 3 Goblin Strikers. Then the Role set the Speed: 1 by default, 2 or more for a Runner. Now each Unit has a Base **Speed** of 2, and Keywords change it.
- A Creature Card had a **Role** before: Frontliner, Striker, Runner, Shooter, Support or Wall. No Battle rule used it, and Players could not read a stat from it. Now there are no Roles. Keywords tell the Speed and the Range of a Card. "Shooter", "Runner" and the other Role names are not terms.
- "debuff" was on the _Avoid_ list of **Status** before, because every Status harmed its Unit. **Ward** is the first Status that helps its Unit, so each Status is now a **Buff** or a **Debuff**. **Steadfast** is the second Buff. It is not Rebirth: a Steadfast Unit does not die, and a Rebirth Unit dies and comes back. Players also say "buff" for a Rally bonus or for bonus Bulwark. Those are bonuses to a stat, not Buffs.
- "Elf Skill Cards" is not a term. A **Skill Card** has a **Class**, not a **Race**. The Skill Cards of the Elf Archetype Thornwatch are **Ranger** Skill Cards, and each other Ranger Deck, for example the Goblin Deck Tunnel Rats, can use them too.
- The **First Pack** was a free Peddler Pack the first time that the Player opened the Packs screen. Now it is an **Unopened Pack** that the Player gets when Packs unlock at **Player level** 2, the same as a Pack from a **Star chest**.
- The campaign-stages doc said "expected player level". The term is **Recommended level**, because the Player also sees it.
- There were two Packs before: the Standard Pack (all Cards) and the Race Pack, with one Drop Rate table. Now there are three Packs with their own Drop Rates: **Peddler**, **Merchant** and **Royal**. The **Merchant Pack** replaces the Standard Pack. **Race Pack** is not a fourth Pack: it is a version of each of the three. **Class Pack** is also a version of each of the three, not a fourth Pack. Players say "gacha" and "pity". The terms are **Pack** and **Pack Guarantee**.
- The Player feature that shows the past moments of the current Battle is the **Battle Log** (web), not a **Replay**. A Replay is the data that runs a full Battle again, for bug reports and for result checks in PvP.
- **Bulwark** reduced all damage except Holy before. Then Holy was the only Damage Type that went through Bulwark. Now **Bulwark N** reduces only Physical damage, so Fire, Frost, Lightning and Holy all go through it. The new special rule of Holy is that it cannot be **Blocked**.
- The Keyword **Bulwark N** had the name "Armor N" before. "Armor" is also the name of a Gear slot, but Armor Gear gives Hero HP and does not reduce damage. Now "Armor" is only the Gear slot. ADR-0031 and the old rows of the balance log still say "Armor".
- GDD 4.12 had watched **Auto-play** on each won Stage. Then an Auto-play win could give more **Stars**, and the AI could open **Star chests** for the Player. Now a Stage has the **Sweep**, only at 3 Stars. A Sweep is not Auto-play: it plays no Battle. Watched Auto-play stayed only on won **Dungeons**. Then the **Dungeon Sweep** replaced it, and now the Player cannot start Auto-play ([ADR-0041](../../docs/adr/0041-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)). "Skip Ticket" is not a term, because **Skip** already means to skip the animations of a Resolution Phase. "Sweep Ticket" was the name of the **Campaign Sweep Ticket** before the **Dungeon Sweep Ticket** was added. It is not a term now: say which type.
- The first name of **Forge Stone** was "Enchanting Gem". It is not a term: "gems" is a word to avoid for **Heynstones**, and a Player can think that money buys them. "Enchant" is a word to avoid for **Gear upgrade**. For the same reasons, the item for Gear levels 21 to 25 is not a "Legendary Gem". It is the Legendary **Forge Stone tier**.
