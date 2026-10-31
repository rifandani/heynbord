# 03 — Game Design Document (GDD)

This document gives the full rules of Heynbord v1. It uses the terms in [`packages/rules/GLOSSARY.md`](../../packages/rules/GLOSSARY.md). All numbers are start values for tests and tuning. The [Economy](./07-economy.md) document gives the currency numbers.

## 1. Overview

The player is a new **Hero** in the world of Heynbord. The player collects cards, builds a **Deck** and fights **Battles** against computer opponents. In a Battle, the player plays cards from the **Hand** into **Lanes**. Then the **Units** move and attack automatically. The player wins when all enemy Heroes are Defeated.

## 2. Core loop

```text
 ┌─────────────► Fight a Battle (Stage, Dungeon or Heynspire Floor)
 │                         │
 │                         ▼
 │          Get rewards: Coin, XP, cards, Stars
 │                         │
 │                         ▼
 │     Open Packs · Combine · Extract · Craft · Fuse · upgrade Gear
 │                         │
 │                         ▼
 └──────────── Change the Deck for the next challenge
```

| Loop | Length | Content |
| --- | --- | --- |
| Battle loop | 3 to 6 minutes | Turns: countdowns tick, play cards, watch Units act. |
| Session loop | 10 to 30 minutes | 3 to 6 Battles, then Workshop and Deck changes. |
| Long loop | Weeks | Finish Regions, get all cards, reach Legendary rank, climb Heynspire, unlock Cosmetics. |

## 3. World and story

### 3.1 Premise

Long ago, the peoples of Heynbord almost destroyed the world in war. Then the **Lanekeepers** (draft) wrote the **Accord** (draft). Under the Accord, all wars happen on marked battlefields with lanes, and all armies obey the same rules. Today, kings and chiefs settle every argument with a battle in the lanes. Some battles are about land. Many are about very small things, for example a stolen cheese or a rude song.

The player is a new Hero. The player travels through five Regions, wins the respect of each people, and finds out who wants to break the Accord.

### 3.2 Races

| Race | Concept | Battle identity | Main Keywords |
| --- | --- | --- | --- |
| **Human** | Humans and stout folk of the river towns. Proud and stubborn. They love banners and long speeches. | Hold the line. Strong Bulwark, Walls and support for allies. | **Knockback**, Bulwark, Rally, Retaliate, Wall, Heavy, Iron Guard, Wallbreaker |
| **Elf** | Elves of the old forests, and the plant spirits that fight with them. Patient and old. | Control from range. Ranged Units, healing, and poison. | **Entangle**, Regenerate, Poison, Flying, Long-range, Spawnbane, Heal |
| **Undead** | Old spirits that wear bones and armor. They do not like to stay dead. | Many cheap Units that grow stronger together, come back, and bring more. | **Rebirth**, Swarm, Summon, Frost damage, Soul Harvest, Dispel |
| **Orc** | Orc tribes of the badlands, and the beasts that fight with them. Fast, loud and always hungry. | Rush in and grow stronger with each fight. High attack, low HP. They still hit the Unit that kills them. | **Heroic**, Charge, Swift, Fire damage, Last Breath, Bolt, Resistance |
| **Goblin** | Goblins of the hill mines. Tinkers, thieves and bomb makers. Small, clever and greedy. | Make the enemy plan slower. Cheap, fragile Units that delay enemy cards, set traps and explode. | **Sabotage**, Hobble, Last Breath, Fire damage, Hero's Bane, Quick Study |
| **Feral** | Wild creatures of the peaks and the deep caves. They serve no people. Under the Accord, a wild creature that comes onto a marked lane field fights for the Hero who called it, for that one Battle. | Few, huge and slow. High Countdown, high Attack and HP. They run through the enemy front, heal and bring the cold. | **Trample**, Regenerate, Flying, Frost damage, Vampirism, Piercing |

The **Pivot** Keyword (see 5.4) is not part of the identity of one Race. In v1, each Race has 1 Creature Card with Pivot, with Base Rank Uncommon.

A Main Keyword is the signature of that Race. The Race that gives a signature up changes its cards. Other Races may still use the Keyword. The first Main Keyword in bold is the **Race Keyword**: only a Unit of that Race can have it, from a Card, a Token or any other effect. A Skill Card of any Class can still give its effect, for example Entangled ([ADR-0025](../adr/0025-each-race-has-one-race-keyword.md)). Poison is in v1 ([ADR-0015](../adr/0015-poison-is-elf-summon-is-undead-and-last-breath-is-orc.md)). Hobble is a Goblin Main Keyword, and one Human card borrows it. Sabotage is the Goblin signature, and Trample is the Feral signature ([ADR-0017](../adr/0017-sabotage-and-hobble-are-goblin-and-trample-is-feral.md)). Knockback is in v1 ([ADR-0016](../adr/0016-knockback-is-a-human-melee-keyword.md)). Shieldbearer has Knockback. Bleed is a Feral Keyword on the Frostfang Lynx, Old Frostmaw and Gorehorn Red Maw only. It is not a Main Keyword ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). Entangle is the Elf Race Keyword, but only a Ranged Unit with Base Rank Epic or higher has it ([ADR-0022](../adr/0022-no-range-above-3-and-entangle-only-on-epic-ranged-units.md)). Thus it is on 2 Elf cards only: Canopy Vinewarden and Lethiel, First Gardener. Swift (Orc), Long-range (Elf) and Heavy (Human) are Main Keywords, and other Races borrow them. They replace the old profile of card types for each Race ([ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md)).

### 3.3 Regions (draft names)

| No. | Region | Main enemies | Debut Race | Lanes | Boss (draft) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Hearthvale** | Human outlaws and the Orc sellswords that the Baron pays | Human and Orc | 3 | **Baron Brassbelly**, a bandit lord with a very large hat |
| 2 | **The Red Mesas** | The Orc tribes of the mesas and the Goblin mines under them | Goblin | 3 | **Boss Snikkit**, the goblin mine king (Ranger) |
| 3 | **The Glowcap Hollows** | Goblin tunnels that break into an Elf grove of giant glowing mushrooms | Elf | 3 | **Lady Glimmerbough**, an Elf grove warden |
| 4 | **The Thornwood** | Elves and the Feral creatures of the deep forest | Feral | 3 | **The Old Bramble**, a forest giant that wakes up angry |
| 5 | **The Hollow Marches** | The Feral beasts of the frozen marsh and the Undead | Undead | 3 | **Queen Marrow**, ruler of the Undead |

Each Region keeps the newest Race of the Region before it and adds one new Race: its **Debut Race**. The Boss of a Region is of a Debut Race of that Region. A Debut Race is only about the enemies: the player can get cards of each Race from Packs at any time ([ADR-0034](../adr/0034-the-campaign-has-5-regions-and-each-region-adds-one-race.md)).

## 4. Battle

### 4.1 Board

- The Board has 3 or 4 **Lanes**. The type of Battle sets the number, not each Stage ([ADR-0010](../adr/0010-the-type-of-battle-sets-the-number-of-lanes.md)):
  - A **Stage** has 3 Lanes.
  - A **Dungeon**, a Heynspire **Floor** and a Battle with 2 or more players (co-op and PvP, after v1) have 4 Lanes.
- A Stage or a Dungeon can make the Board smaller only with a **Closed Lane**. In a Closed Lane, no Side can summon a Unit, and no Skill Card can target a Square. A Closed Lane opens at a set Turn number, or it stays closed for the full Battle. It is still part of the Board and of a Front.
- Each Lane has 12 **Squares**.
- **Columns** have numbers from 1 to 12. For the player, Column 1 is nearest to the player's Hero. For the enemy, the numbers go in the opposite direction.
- Each Hero stands at the end of the Lanes, outside the Board. The player's Hero is behind the player's Column 1. The enemy Heroes are behind the player's Column 12.
- A **Side** has 1 or more Heroes. In v1, the player's Side always has 1 Hero. The enemy Side has 1 Hero, but a Dungeon can have 2 or 3 (see 8.4). The rules permit up to 4 Heroes on a Side, 1 for each Lane. [ADR-0009](../adr/0009-a-side-has-one-or-more-heroes.md) gives the reasons.
- Each Hero stands behind its **Front**: 1 or more Lanes next to each other. The Fronts of a Side cover all the Lanes, and each Lane is in one Front. When a Side has 1 Hero, its Front is all the Lanes.
- A Square holds 0 or 1 Unit.
- Your **Summon Zone** is your Columns 1, 2 and 3, in all Lanes. You can summon Units only into empty Squares of your Summon Zone. Each Hero of a Side can summon into any Lane of that Side, not only into its own Front. The rule is the same for both Sides and all Heroes, and content data cannot change it ([ADR-0011](../adr/0011-the-summon-zone-is-3-columns-deep.md)).
- A Unit with **Wall** can also be summoned into an empty Square of your Columns 4 and 5. Those Squares are not part of your Summon Zone ([ADR-0023](../adr/0023-a-wall-can-be-summoned-up-to-column-5.md)).
- You can summon into a Square of your Summon Zone also when an enemy Unit is between that Square and your Hero. Your new Unit is then past the enemy Unit. A melee Unit attacks only forward, so the two Units do not fight, unless one of them has **Pivot** (see 4.5 and 4.6).

```text
           Column:  1   2   3   4   5   6   7   8   9  10  11  12
 Player   Lane 1: [ S ][ S ][ S ][   ][   ][   ][   ][   ][   ][ E ][ E ][ E ]   Enemy
 Hero     Lane 2: [ S ][ S ][ S ][   ][   ][   ][   ][   ][   ][ E ][ E ][ E ]   Hero
          Lane 3: [ S ][ S ][ S ][   ][   ][   ][   ][   ][   ][ E ][ E ][ E ]

 S = player Summon Zone    E = enemy Summon Zone
```

### 4.2 Battle setup

1. Each Hero shuffles its Deck with the Battle seed.
2. Each Hero draws 4 cards.
3. Each card in the Hand shows its printed Countdown.
4. In PvE, the player takes the first Turn.
5. Some Stages and Dungeons put Units on the Board at the start. The Stage or Dungeon data defines them.

### 4.3 Turn structure

A **Turn number** counts rounds. In each Turn number, the first player and then the second player take one Turn. The **Defender** is the Side that does not start the Battle, so it always takes the second Turn. In PvE, the enemy is the Defender.

Each Turn of the active side has these phases:

1. **Start Phase**
   1. Start-of-turn effects resolve (for example Regenerate, Heal, Dispel and Rally).
   2. If the Turn number is 20 or more, Sudden Death damage hits each Hero of the active Side that is not Defeated (see 4.10).
   3. The Countdown of each card in each Hand of the active Side goes down by 1. A Ready card stays at 0 ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md)). The Hand keeps the order in which the cards came into it: a drawn card and a Recalled Skill Card go to the end. A card keeps its place when its Countdown changes, for example by Sabotage. If two cards have the same Countdown, Sabotage uses this order (5.4).
   4. Each Hero of the active Side that is not Defeated draws 1 card, if its Hand has fewer than 8 cards and its Deck is not empty.
2. **Play Phase**
   - The active side can play **all** Ready cards (Countdown 0) of all its Heroes, in any order.
   - A Creature Card goes into an empty Square of the Summon Zone, in any Lane.
   - A Skill Card goes to its target (see 4.8).
   - The active side can also play no cards.
   - The phase ends when the player selects **End Turn**. In PvE there is no Turn timer.
3. **Resolution Phase**
   - The active side's Units act one at a time. Section 4.4 gives the order.
   - The other side's Units do not act. They can only use Retaliate and First Strike.
4. **End Phase**
   1. Each **Field Effect** of the active side hits the enemy Units in its area, in the order of play (see 4.8). Then Burn damage hits burning Units of the active side. Poison damage then hits Poisoned Units of the active side: 1 damage per stack, then the Unit loses 1 stack.
   2. Durations go down by 1 (Field Effects and other timed effects). Freeze has no duration: it ends when the Unit skips its action (see 4.4).
   3. Units with 0 HP leave the Board.
   4. The Turn goes to the other side.

The Battle ends at once when all the Heroes of a Side have 0 HP, also in the middle of a phase.

### 4.4 Action order in the Resolution Phase

1. The Units act Lane by Lane, from Lane 1 to the last Lane.
2. In each Lane, the front Unit acts first. The front Unit is the Unit nearest to the enemy Hero.
3. Each Unit does these steps:
   1. **Movement** (see 4.5)
   2. **Attack** (see 4.6). After a hit on an enemy Unit, the on-hit effects occur in this order: damage, then Poison, then Hobble, then Bleed, then Knockback.
   3. **Retaliate** by the target, if the target has the Retaliate Keyword (see 4.7). Retaliate occurs after Knockback.
4. A Unit that you summoned in this Turn also acts in this Turn.
5. A Unit that another effect creates during the Resolution Phase acts at the end of the Resolution Phase, in the same order.
6. A Frozen Unit does not move and does not attack. Its Freeze then ends. Until then, it also does not retaliate and does not use First Strike. An attack on a Frozen Unit does not end its Freeze.
7. An Entangled Unit has Speed 0 during its next action, but it can attack. Its Entangled Status then ends. If a Unit is Frozen and Entangled, the skipped action ends both Statuses.
8. A **Paralyzed** Unit does not attack in its next action, but it can still move. Its Paralyzed Status then ends. Until then, it also does not retaliate and does not use First Strike. An attack on a Paralyzed Unit does not end its Paralyzed Status. If a Unit is Frozen and Paralyzed, the skipped action ends both Statuses, so Freeze and then Paralysis is not a 2-action lock. A Paralysis from First Strike during an action stays for the next action: the attack of that action still occurs. A new Paralyzed on a Paralyzed Unit has no effect, and it has no count ([ADR-0028](../adr/0028-lightning-damage-gives-paralyzed.md)).
9. A Hobbled Unit has a maximum Speed of 1 during its action, after all bonuses. The count does not go down when the Unit acts. It goes down in the End Phase of its owner.
10. A Bleeding Unit gets half of each heal, rounded down. For example, Regenerate 1 heals 0 and Regenerate 2 heals 1. The count goes down in the End Phase of its owner, not when the Unit acts.
11. **Extra action.** A Skill Card (*Onslaught*, 5.5) can give each friendly Unit in a Lane one more action in the Play Phase. Each Unit does steps 3.1 to 3.3 now, from the front Unit to the back Unit of that Lane. The order is fixed first: a Unit that dies before its turn does not act. It is a normal action: it uses up a Freeze (the Unit skips it), a Paralysis (the Unit moves but does not attack) and an Entangled. No Phase effect occurs again: no Rally, no Regenerate, and no Start Phase or End Phase. A Unit that you summoned in this Turn also gets it, and Charge applies, because Charge applies in the Turn of the summon. In the Resolution Phase, each Unit then does its normal action.

### 4.5 Movement

- Each Unit has a **Speed**. Speed is the maximum number of Squares that the Unit moves forward in one Turn. Each Unit has a Base Speed of 2. The Keywords Swift, Fleet and Heavy change it (5.6).
- A ground Unit moves through friendly Units, also a friendly Wall. Each friendly Square uses 1 Square of Speed. It stops before an enemy Unit. It stops in the farthest empty Square that its Speed reaches. See [ADR-0018](../adr/0018-a-unit-moves-through-friendly-units.md).
- A **Flying** Unit moves over friendly Units and enemy ground Units. It stops before an enemy Flying Unit, also when that Unit is Frozen, Entangled or Ranged. It stops in the farthest empty Square that its Speed reaches. It can fly past an enemy ground Unit directly in front of it, also when it then has no target.
- A **Grounded** Flying Unit (4.7) does not have Flying. It moves as a ground Unit: it stops before an enemy Unit. An enemy Flying Unit moves over it.
- A Unit never moves past its last Column (Column 12 for the player).
- A Unit with **Wall** never moves, also when an effect gives it Speed or Charge (see 5.4).
- A **Ranged** Unit does not move if an enemy target is in its Range at the start of its action (see 4.6).
- A **Ranged** Unit that moves stops in the first empty Square from which it has a target in its Range (see 4.6), also when its Speed reaches farther. It moves through a friendly Unit in that Square, to the next empty Square. For example, a Unit with Speed 2 and Range 3 in Column 3, with an enemy Unit in Column 7, moves 1 Square to Column 4 and attacks.
- A **Pivot** Unit does not move if an enemy Unit is directly behind it or next to it at the start of its action (see 4.6).
- A Unit with Speed 0 never moves.
- An Entangled Unit has Speed 0 during its next action.
- A Hobbled Unit moves at most 1 Square. The limit applies after all bonuses.
- A **Pushed** Unit changes Square toward its own Hero. A push is not Movement. It does not use Speed. Frozen, Entangled, Hobbled and Flying do not stop it. Knockback (4.7) and the Skill Card *Warning Shot* (5.5) push a Unit. They use the same push rules.

### 4.6 Attack

- Each Unit has a **Range**. Each Unit has a Base Range of 1. The Keywords Mid-range, Long-range and Extreme-range increase it (5.6). A Unit with Range 1 is a **Melee Unit**. A Unit with Range 2 or more is a **Ranged Unit**.
- **Melee Unit:** It attacks the enemy Unit in the next Square in front of it. If the Unit is in its last Column and no enemy Unit is in front of it, it attacks the enemy Hero.
- "The enemy Hero" of a Unit is always the Hero of the enemy Front that holds the Unit's Lane.
- **Pivot Unit:** A melee Unit with Pivot can also attack the enemy Unit in the Square directly behind it, or in the same Column of a next Lane ("next to it"). It still attacks one time. It selects the first target in this order:
  1. The enemy Unit directly behind it.
  2. An enemy Unit next to it. The lower Lane number comes first.
  3. The enemy Unit directly in front of it.
  4. The enemy Hero, if the Unit is in its last Column.
- A Pivot attack is a melee attack. Retaliate and First Strike apply to it.
- **Ranged Unit:** It attacks the nearest enemy Unit in front of it, in the same Lane and in its Range. If no enemy Unit is in Range, and the enemy Hero is in Range, it attacks the enemy Hero. The enemy Hero is 1 Square past the last Column.
- A Unit with **Base Attack** 0 does not attack. Base Attack is the Attack of the Unit for its Rank, without bonuses. Bonuses such as Rally do not change this.
- A Unit with **Wall** does not attack, also when an effect gives it Attack (see 5.4).
- A Unit attacks one time in each Turn, unless a Keyword says something different.

### 4.7 Damage

Each attack and each damage effect has a **Damage Type**.

| Damage Type | Effect |
| --- | --- |
| **Physical** | Normal damage. Melee or Ranged. Bulwark reduces only Physical damage ([ADR-0030](../adr/0030-armor-reduces-only-physical-damage.md)). |
| **Fire** | Normal damage. The target also gets **Burn**: 1 damage in each End Phase of its owner, for the next 2 End Phases. A new Burn replaces the old Burn. |
| **Frost** | Normal damage. The target also gets **Freeze**: it skips its next action. No Ranged Unit has Frost damage, at any Rank ([ADR-0024](../adr/0024-no-ranged-unit-has-frost-damage.md)). |
| **Holy** | Normal damage. The Hero of the target cannot **Block** Holy damage ([ADR-0030](../adr/0030-armor-reduces-only-physical-damage.md)). |
| **Lightning** | Normal damage. The target also gets **Paralyzed**: it does not attack in its next action, but it can still move (4.4). A Ranged Creature Card with Lightning needs a lock check in the simulation before it goes into the content, the same as for Frost ([ADR-0028](../adr/0028-lightning-damage-gives-paralyzed.md)). |

Burn, Freeze, Paralyzed, Entangled, Poisoned, Hobbled, Bleeding, Exposed, Grounded, Ward and Steadfast are **Statuses**. Each Status is a **Buff** (it helps its Unit) or a **Debuff** (it harms its Unit). Ward and Steadfast are the Buffs. The other Statuses are Debuffs. A bonus to a stat, such as the Rally bonus, the Swarm bonus, the Heroic bonus, bonus Bulwark or bonus Attack, is not a Buff. Fire, Frost and Lightning damage give Burn, Freeze and Paralyzed. Each damage source gives them: attacks, Retaliate, First Strike, Trample, Last Breath damage, Skill damage and Field Effects. The Entangle Keyword gives Entangled after attack damage. The Poison Keyword gives Poisoned after attack damage above 0. The Hobble Keyword gives Hobbled after attack damage above 0. The Bleed Keyword gives Bleeding after attack damage above 0. Fire, Frost or Lightning gives its Status also when the hit does 0 damage. Entangle, Poison, Hobble and Bleed need damage above 0. A Skill Card can give Poisoned stacks also at 0 damage (4.8). Bleeding does no damage. Burn damage and Poison damage ignore Bulwark, Crit and Block. Burn damage does not give a new Burn. Poison damage has no Damage Type, and it does not give Burn or Poison.

To calculate damage, do these steps in this order:

1. Start with the Attack value of the attacker (or the value of the effect). The **Wallbreaker** Keyword doubles this value against a Unit with Wall.
2. Add bonuses (for example the Rally bonus or the Heroic bonus).
3. Subtract the Bulwark of the target, if the Damage Type is Physical. Subtract the Resistance of the target, if the Damage Type is not Physical. The result is 0 or more.
4. If the target is **Exposed** and the hit is Physical, add the Exposed value.
5. Roll **Crit** for the attacker's Hero. A Crit multiplies the damage by 2.
6. Roll **Block** for the target's Hero, if the Damage Type is not Holy. A Block divides the damage by 2. Round up.
7. The minimum damage is 0.
8. If the target has a **Ward**, the Ward absorbs the damage, up to its value. The Ward value goes down by the absorbed damage, and the Ward ends at 0. The Unit loses HP only for the rest.
9. If the damage would bring a target with **Steadfast** to 0 HP, the target stays at 1 HP, and Steadfast ends.

- **Piercing:** The damage that a Unit with Piercing deals skips step 3, step 6 and step 8, and the Iron Guard cap. It keeps step 4 and step 5, so it keeps its Exposed bonus and its Crit. It is not True Damage: a True hit has no Crit and no Exposed ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)).

- **True Damage:** A hit that skips steps 2 to 6 and step 8. Its value is the value in the text of its effect. For an attack, this is the Base Attack, with no Rally, Swarm or Bonus Attack. Bulwark, Exposed, Crit, Block and Ward do not change it, also on a Hero. Step 9 still applies: Steadfast keeps the Unit at 1 HP. True Damage is not a Damage Type. A True hit keeps its Damage Type and gives the Status of that type, or it has no Damage Type. On-hit Keywords and Retaliate apply as usual. The later Burn damage from a True Fire hit is normal Burn damage. Card text says "N True Damage", or "N True Fire damage" with a Damage Type. No card has True Damage yet.

- **Ward N:** A Buff from a Skill Card (*Sanctuary*, 5.5). It absorbs all damage to its Unit except True Damage: attacks, Skill damage, Holy damage, Retaliate, First Strike, Last Breath damage, Trample damage, Burn damage and Poison damage. Burn and Poison damage skip steps 3 to 6, but not step 8. Absorbed damage is not dealt: a hit that the Ward absorbs fully deals 0 damage. Thus Poison, Hobble, Bleed, Entangle and Knockback do not occur, because they need damage above 0. Fire and Frost still give Burn and Freeze, and a Skill push and Grounded still occur. A Ward has no time limit: it stays until it absorbs all N. A new Ward keeps the higher value. The values do not add. A Hero never has a Ward.

- **Steadfast:** A Buff from a Skill Card (*Unbroken Vow*, 5.5). When damage from any source would bring its Unit to 0 HP (step 9), the Unit stays at 1 HP and Steadfast ends. Any source is attacks, Skill damage, Retaliate, First Strike, Last Breath damage, Trample damage, Burn damage and Poison damage. A Ward absorbs the damage first, so Steadfast acts only when the HP would still go to 0. The Unit is not killed: it stays on the Board, its Last Breath does not occur, and Trample has no damage that is left. The Unit survives the hit, so the rest of the hit still occurs, for example Retaliate, Poison, Knockback, or the Status or push of a Skill Card. The damage number of the hit does not change. A Unit with Rebirth uses Steadfast first and keeps its Rebirth. Steadfast has no time limit. A new Steadfast on a Steadfast Unit has no effect. A Hero never has Steadfast.

- **Exposed N:** A Debuff from a Skill Card (*Expose Weakness*, 5.5). Each Physical hit on its Unit deals N more damage (step 4): attacks, Physical Skill damage, Retaliate, First Strike, Last Breath damage and Trample damage of a Physical Unit. Fire, Frost, Holy, Burn, Poison and True Damage do not get it. The bonus comes after Bulwark, so it also hurts a Wall with high Bulwark, and a Crit doubles it and a Block halves it. It has a count of 2 End Phases of its owner. The count goes down in the End Phase, after Burn and Poison, and Exposed ends at 0. A new Exposed keeps the higher value. A new Exposed with the same value or higher sets the count to 2 again. A Hero is never Exposed.

- **Grounded:** A Debuff from a Skill Card (*Skybreaker*, 5.5). Only a Flying Unit becomes Grounded. A Grounded Unit does not have Flying, for all rules (4.5): it stops before an enemy Unit, and an enemy Flying Unit moves over it. It has a count of 2. The count goes down by 1 in the End Phase of its owner, after Burn and Poison, and Grounded ends at 0. Thus it stops 2 Movements of the Unit. A new Grounded keeps the higher count, so it sets the count to 2 again. A Grounded Unit that comes back with Rebirth loses it, as each other Status. A Hero is never Grounded.

- The Gear of each Hero gives the Crit and Block chances (see 7.3). A Unit uses the Gear of the Hero that summoned it.
- Heroes cannot Block.
- All rolls use the Battle seed, so a replay gives the same result.
- **Retaliate:** When a Unit with Retaliate survives a melee attack, it deals damage equal to its Attack to the attacker. Retaliate does not use Crit, and it does not start another Retaliate. A Unit with Base Attack 0 does not retaliate.
  - It uses the Damage Type of the Unit with Retaliate, so it can give a Status.
  - The Bulwark of the attacker reduces it if it is Physical, and the attacker's Hero can Block it if it is not Holy.
  - It occurs also when the attack did 0 damage.
  - It does not occur against a Ranged attack, or when the Unit is Frozen (see 4.4).
- **First Strike:** When an enemy melee Unit attacks a Unit with First Strike, the Unit with First Strike deals its damage first. If the attacker dies, its attack does not occur.
  - It uses the Damage Type of the Unit with First Strike. It does not use Crit. The Bulwark of the attacker reduces it if it is Physical, and the attacker's Hero can Block it if it is not Holy.
  - It does not occur against a Ranged attack, or when the Unit with First Strike is Frozen (see 4.4). A Unit with Base Attack 0 does not use it.
  - Damage above 0 applies Poison, Hobble, Bleed and Entangle, but not Knockback. An attacker that First Strike Entangles has Speed 0 in its next action, not in the action that it does now.
- **Entangle:** After a Unit with Entangle deals attack damage above 0 to an enemy Unit, that enemy becomes Entangled. A new Entangle does not stack or extend the Status. Retaliate does not apply Entangle.
- **Hobble N:** After a Unit with Hobble deals attack damage above 0 to an enemy Unit, that Unit becomes Hobbled with a count of N. A Hobbled Unit has a maximum Speed of 1, after all bonuses. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Hobble keeps the higher count. It does not add to the old count. Retaliate does not apply Hobble. An attack on a Hero does not apply Hobble.
- **Bleed N:** After a Unit with Bleed deals attack damage above 0 to an enemy Unit, that Unit becomes Bleeding with a count of N. A Bleeding Unit gets half of each heal, rounded down: Regenerate, a Skill Card heal and each other heal. Bleeding does no damage. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Bleed keeps the higher count. It does not add to the old count. Retaliate does not apply Bleed. First Strike damage above 0 applies Bleed. An attack on a Hero does not apply Bleed. N is 1 up to Rare, 2 at Epic and 3 at Legendary. Gorehorn Red Maw has a fixed Bleed 2 ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)).
- **Knockback N:** After a melee Unit with Knockback deals attack damage above 0 to an enemy Unit, that Unit is Pushed N Squares toward its own Hero, in its own Lane. A push is not Movement and not a Status. The push stops before the first Square that holds any Unit, and at the pushed Unit's Column 1. A Unit with Wall is never Pushed. The push ignores Speed, Charge, Frozen, Entangled, Hobbled and Flying. The pushed Unit keeps its Statuses. Retaliate and First Strike do not apply Knockback. An attack on a Hero does not apply Knockback. A Unit that dies from the hit is not Pushed. If the Unit does not change Square, there is no push.
- **Trample:** When a melee Unit with Trample kills an enemy Unit with attack damage, the damage that is left goes to the enemy Unit in the next Square behind the killed Unit, in the same Lane. The damage that is left is the final damage of the hit (after Bulwark, Crit and Block) minus the damage that the Ward of the killed Unit absorbed, minus the HP that the killed Unit had. For example, 10 damage against Ward 2 and 3 HP leaves 5. A Ward on the second Unit absorbs the second hit by the normal rule. If that Square is empty, the damage is lost. It never hits a Hero. The second hit has the Damage Type of the Trample Unit, so Fire and Frost still give their Status. The Bulwark of the second Unit reduces it if it is Physical, and its Hero can Block it if it is not Holy. It does not roll Crit. The second hit is not an attack: the second Unit does not Retaliate, and Poison, Hobble, Bleed and Knockback do not apply. It does not Trample again. The Last Breath of the killed Unit still occurs by the normal rules.

### 4.8 Skill Cards and Recall

- A Skill Card has a **Target**. The Target can be an enemy Unit, a friendly Unit, a Lane, a Square area, a Hero, the Hand, or all Units. A friendly Unit is each Unit of the caster's Side, also a Token, a Wall and a Unit at full HP. A play with no effect, for example a heal on a Unit at full HP, is legal. A Hero target is an enemy Hero that is not Defeated. No Skill Card heals a Hero ([ADR-0027](../adr/0027-nothing-heals-a-hero.md)). A Hero has no Bulwark and cannot Block (4.7), so Skill damage to a Hero has no Block roll. It can Crit.
- When an enemy Hero plays a Skill Card, the **Quick Study** Keyword of each friendly Unit takes 1 Countdown from the card with the highest Countdown in the Hand of the Hero of that Unit (5.4).
- A Skill Card damage hit that kills a Unit, also when the Unit comes back with Rebirth, applies no other part of the effect to that Unit: no Status and no push.
- A Skill Card that gives Poisoned stacks (*Venom Arrow*) gives them to a Unit that survives the hit, also at 0 damage, and also when a Ward absorbs the full hit. The new stacks add to the old stacks.
- *Skybreaker* makes a Flying Unit that survives the hit Grounded, also at 0 damage, and also when a Ward absorbs the full hit. On a ground Unit, it only deals damage.
- *Cleanse* removes all Debuffs of a friendly Unit first: Burn, Freeze, Paralyzed, Entangled, Poisoned, Hobbled, Bleeding, Exposed and Grounded. Then it heals the Unit, so Bleeding does not halve that heal. It does not remove a Buff. A Frozen Unit that gets Cleanse in the Play Phase acts in the Resolution Phase of the same Turn.
- Some Skill Cards that hit one enemy Unit have a second part: bonus Bulwark or a heal for the caster's Units in the Lane of the target, or damage to the enemy Hero of that Lane (the Hero whose Front holds that Lane). The second part occurs after the hit, also when the hit kills.
- Bonus Bulwark from Skill Cards does not add. A Unit keeps the higher bonus. For the same bonus, it keeps the longer duration. Units that come into the Lane later do not get it.
- **Bonus Attack** from a Skill Card (*Call to Arms*) lasts until the end of the caster's next Turn: it counts 2 End Phases of its owner. It adds to the Attack (4.7, step 2), so it also adds to Retaliate and First Strike. A Unit with Base Attack 0 gets no bonus, the same as for Rally. A new bonus Attack replaces the old one and its duration. Units that come into the Lane later do not get it. Rebirth ends it.
- **Bonus Range** from a Skill Card (*Hunter's Focus*) lasts until the end of the caster's next Turn, as bonus Attack does. It has its own count: a new bonus Attack from another card (for example *Call to Arms*) replaces the bonus Attack, but the bonus Range keeps its count. A new bonus Range replaces the old one and its duration. A Unit with Base Attack 0 gets no bonus, and Rebirth ends it. There is no maximum Range: a Unit with Long-range can have Range 4 for this time. A Melee Unit (Range 1) with bonus Range 1 is a Ranged Unit with Range 2 until the bonus ends. All the Ranged rules apply: an enemy Unit does not Retaliate against it and does not use First Strike against it, and it does not use Trample, Knockback or Pivot.
- After the effect, roll **Recall**. When the effect ends the Battle, no Recall roll occurs. If the roll succeeds, the card goes back to the Hand with its full Countdown. If the roll fails, the card goes to the **Graveyard**.
- A **Field Effect** is a Skill Card effect that stays on a Square area for a number of Turns (*Wildfire*, *Blizzard*, 5.5).
  - **Area target.** The player selects the corner Square of the area that is nearest to their Hero, in the upper Lane of the area. The area goes down from that Lane and toward the enemy Hero. The preview shows the full area. The area stays inside the Board, and no Square of it can be in a Closed Lane. It can include each Summon Zone and empty Squares.
  - It hits in each **End Phase of its owner**, first of all End Phase effects (4.3). The first hit is in the End Phase of the Turn when it is played, so "2 Turns" is 2 hits. Then its duration goes down by 1, and at 0 it leaves the Board.
  - It hits only the enemy Units in its area at the moment of the hit, the same as *Fireball*. A Unit that comes into the area later is hit. A Hero is never hit.
  - Each hit is normal Skill damage: Bulwark reduces Physical damage, the Crit of the caster's Trinket and the Block of the target's Hero apply, and a Ward absorbs it. Fire gives Burn and Frost gives Freeze by the normal rules, also at 0 damage.
  - Two Field Effects on the same Square both hit.
  - It ends at once when its Hero is Defeated (4.10). In v1 each Side has 1 Hero, so the Battle then ends.
- *Arc Lightning* hits its target Unit, then the enemy Unit in the same Column of the Lane above, then of the Lane below. With only 1 open Lane (Closed Lanes), it hits only its target.
- *Thunderstorm* hits 3 different random enemy Units. With fewer than 3 enemy Units, it hits each one time. With 0, the play is legal and has no effect. It never hits a Hero. The Battle seed sets the random choice.

### 4.9 Death

- When a Unit from a Creature Card has 0 HP, it leaves the Board and goes to its owner's Graveyard. A Token disappears instead.
- Last Breath effects resolve when the Unit leaves the Board. A v1 Last Breath either deals N damage to the nearest enemy Unit ahead in the same Lane, or summons Token X in the Square that the Unit left.
- **Rebirth:** The first time a Unit with Rebirth dies, it comes back in the same Square with 1 HP and without Rebirth. Its Statuses (also a Ward), its bonus Bulwark, its bonus Attack, its bonus Range, its Rally bonus, its Heroic bonus and its Soul Harvest bonus end. A Unit with Steadfast does not die from the hit (4.7), so it keeps its Rebirth. A Unit that *Smite* kills does not come back: it dies as a Unit without Rebirth.
- **Tokens** (Units that effects create) use the Rank of the Card or effect that made them. They do not go to the Graveyard. They disappear.

### 4.10 Win, loss and Sudden Death

- A Hero with 0 HP is **Defeated**. It is out of the Battle:
  - Its Units leave the Board at once. They do not go to the Graveyard, and Last Breath and Rebirth do not occur.
  - Its Field Effects end at once. Freeze and Burn that are already on enemy Units stay, because they belong to the target Unit.
  - Its Front goes to the nearest Hero of the same Side that is not Defeated. If two Heroes are at the same distance, the Hero with the lower Lane number gets the Front.
  - Its cards stay in its Hand, Deck and Graveyard. It plays no more cards.
- You win when all the enemy Heroes are Defeated.
- You lose when all the Heroes of your Side are Defeated.
- **Sudden Death:** From Turn number 20, each Hero of the active Side that is not Defeated takes 1 damage in each Start Phase. From Turn number 40, the damage is 2. Sudden Death does not use Crit.
- **Turn limit:** If no Side has lost at the end of Turn number 60, the Defender wins (see 4.3).
- **Hero HP:** The player's Hero has 30 + player level HP, plus the Gear bonus. The Stage or Dungeon data defines the HP of each enemy Hero.

### 4.11 Stars

Each Stage win gives 1 to 3 **Stars**:

| Stars | Condition |
| --- | --- |
| ★ | Win the Battle. |
| ★★ | Win with 50% or more of your Hero HP. |
| ★★★ | Win with 50% or more of your Hero HP, before the **Star Turn** of the Stage. |

Each Stage has its own Star Turn in its data, because the Battles get longer from Region to Region and the Stages of one Region are different too. `bun run sim stage` tunes it to the 3-Star target (see 13). The Stage Panel shows the 3 conditions with the Star Turn of the Stage. The Star Turn is not the Turn limit (Turn number 60, see 4.10) ([ADR-0045](../adr/0045-each-stage-has-its-own-star-turn.md)).

The game shows the best Star result for each Stage. The word "star" is only for Stages. Ranks use gems (see 5.3).

### 4.12 Speed controls and Sweeps

- **Speed ×1 / ×2:** The player can change the animation speed at any time.
- **Skip:** The player can skip the animations of the current Resolution Phase. The result is the same.
- **Sweep:** A Sweep uses Tickets of one type on a Stage or a Dungeon. The player selects a number of Tickets (1 to 10, and not more than the player has). Each Ticket gives one repeat-win reward at once, with no Battle, and the Sweep Result shows. A Sweep always wins. The Class of the Active Deck sets the card pool. A Sweep gives no Tickets and does not count for an Achievement. The Handbook Sweep Entry tells about the 2 kinds of Sweep ([ADR-0039](../adr/0039-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)):
  - **Campaign Sweep:** On a Stage with 3 best Stars, the Stage Panel has a Sweep button next to Fight, and it shows the Campaign Sweep Tickets of the player. Each Campaign Sweep Ticket gives one repeat-win reward of the Stage (see 8.1). The card pool is the Stage card pool. A Campaign Sweep never changes the Stars. A Hint tells the player about it (see 8.3).
  - **Dungeon Sweep:** On a Dungeon with 1 or more wins, the Dungeon Panel of the Dungeons screen has a Sweep row and a Sweep button next to Fight. The Sweep row shows the Dungeon Sweep Tickets of the player and the Ticket control. Each Dungeon Sweep Ticket gives one repeat-win reward of the Dungeon (see 8.4 and Economy 2.4): Coin, XP (Essence in Dungeon 3), the chance of a card from the Dungeon card pool, and the Forge Stone rolls, with the Legendary roll of Dungeon 3. A Dungeon Sweep never adds to the wins of the Dungeon. A Hint tells the player about it (see 8.3).
- **Sweep Tickets:** There are 2 types of Ticket. A Stage win and a Floor win give 2 **Campaign Sweep Tickets**. A Dungeon win gives 1 **Dungeon Sweep Ticket** and no Campaign Sweep Tickets. A loss and an Abandon give none. The Battle result shows the Tickets of the correct type. The Stage Panel shows the Campaign Sweep Tickets, and the Dungeons screen shows the Dungeon Sweep Tickets. Both types are earn-only: the Bazaar never sells them, they never change into each other, and they never change into Coin, Essence or Heynstones. There is no maximum.
- **Auto-play:** The AI plays the player's cards with the logic of section 9. The player cannot start Auto-play. Only the tests, QA and the simulations use it. The Dungeon Sweep replaced watched Auto-play on Dungeons ([ADR-0039](../adr/0039-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)).
- **Battle Log:** In a Solo Battle, the player can look back at the past moments of the current Battle (see 11.2). The Battle Log is view only. It never changes the Battle and has no undo. It shows only what the player saw at that moment: played cards and roll results, but not the enemy Hand, the enemy draws or the roll values. It goes away when the player leaves the Battle. It is not available in the Tutorial. A Replay (the seed, the Decks and the Commands, BAT-14) is a different thing.
- Speed and Skip never change the result, because the rules are deterministic.

## 5. Cards

### 5.1 Card types

| Type | Description |
| --- | --- |
| **Creature Card** | A card that summons a Unit onto the Board. It has a Race. A **Specialist** (Base Rank Legendary) also has one Class. |
| **Skill Card** | A card with a one-time effect. It has a Class. Only a Hero of the same Class can use it. |

A **Unit** is the thing on the Board. A Creature Card is the thing in the Hand or in the Deck. Do not mix the two words.

### 5.2 Card fields

**Creature Card**

| Field | Description | Typical values |
| --- | --- | --- |
| Name | Unique name of the card | — |
| Race | Human, Elf, Undead, Orc, Goblin or Feral | — |
| Class | Warrior, Ranger, Mage or Priest. Only a Specialist has it. | — |
| Rank | Common to Legendary | — |
| Countdown | Turns until Ready | 1 to 6 |
| Attack | Damage of one attack | 0 to 12 |
| HP | Health | 1 to 30 |
| Speed | Squares per Turn. Base Speed 2, changed only by a Speed Keyword (5.6) | 1 to 4 |
| Range | Squares of attack. Base Range 1 (Melee), changed only by a Range Keyword (5.6) | 1 to 4 |
| Damage Type | Physical, Fire, Frost, Holy or Lightning | Frost only for a melee Unit ([ADR-0024](../adr/0024-no-ranged-unit-has-frost-damage.md)). Lightning on a Ranged Unit only after a lock check ([ADR-0028](../adr/0028-lightning-damage-gives-paralyzed.md)) |
| Keywords | 0 to 3 Keywords | — |
| Flavor text | A short line of lore or a joke | — |

**Skill Card**

| Field | Description | Typical values |
| --- | --- | --- |
| Name | Unique name of the card | — |
| Class | Warrior, Ranger, Mage or Priest | — |
| Rank | Common to Legendary | — |
| Countdown | Turns until Ready | 1 to 6 |
| Target | What the effect hits | — |
| Effect | Effect text, from templates | — |
| Recall | Chance to go back to the Hand | 7% to 35% |

### 5.3 Ranks

| Rank | Gem color | Symbol | Recall for Skill Cards | Stat scale (Attack and HP) |
| --- | --- | --- | --- | --- |
| **Common** | Grey | 1 pip | 7% | ×1.0 |
| **Uncommon** | Green | 2 pips | 14% | ×1.2 |
| **Rare** | Blue | 3 pips | 21% | ×1.45 |
| **Epic** | Purple | 4 pips | 28% | ×1.75 |
| **Legendary** | Orange | 5 pips | 35% | ×2.1 |

- The Countdown never changes with the Rank.
- Keyword values can also go up with the Rank. The card data defines this.
- Stat values are integers. Round to the nearest integer.
- Each card has a **Base Rank**. This is the lowest Rank in which the card exists. A card can go up to Legendary with Combine.
- A Creature Card with Base Rank Legendary is a **Specialist**. It has one Class, and it has Unique. There is no Combine above Legendary, so a Specialist has no higher Rank ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)).
- The UI shows each Rank with a color **and** a number of pips, so that players with color blindness can see the Rank.

### 5.4 Keywords (v1)

| Keyword | Rule |
| --- | --- |
| **Bleed N** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Bleeding with a count of N. A Bleeding Unit gets half of each heal, rounded down. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Bleed keeps the higher count. Retaliate does not apply Bleed. N is 1 up to Rare, 2 at Epic and 3 at Legendary. Gorehorn Red Maw has a fixed Bleed 2 ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). See 4.7. |
| **Bolt N** | In each Start Phase of its owner, this Unit deals N damage of its own Damage Type to one random enemy Unit, or to a random enemy Hero. The Hero can be any Hero of the other Side that is not Defeated, not only the Hero of its Front. The hit applies no Status and has no Crit, so Fire, Frost and Lightning damage do not Burn, Freeze or Paralyze. A hit on a Unit can be Blocked, except Holy damage, and a Ward absorbs it. N is the same at each Rank ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md), [ADR-0053](../adr/0053-bolt-hits-a-random-enemy-hero.md)). |
| **Bulwark N** | Reduces Physical damage to this Unit by N. |
| **Charge N** | +N Speed in the Turn when you summon this Unit. N is 1 up to Rare, 2 at Epic and 3 at Legendary. N is never more than 3. |
| **Dispel** | In each Start Phase of its owner, this Unit has a 20% chance to remove 1 Debuff from a random friendly Unit. The Battle seed sets the chance and the Unit. The other Debuffs of that Unit stay ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). |
| **Entangle** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Entangled. An Entangled Unit has Speed 0 during its next action, but it can attack. Entangled then ends. A new Entangle does not stack or extend it. Only a Ranged Unit with Base Rank Epic or higher has Entangle (ADR-0022). |
| **Extreme-range** | +3 Range: this Unit is a Ranged Unit with Range 4. The value is the same at each Rank. Only a card with Base Rank Epic or higher has it. See 5.6. |
| **First Strike** | See 4.7. |
| **Fleet** | +2 Speed. The value is the same at each Rank. See 5.6. |
| **Flying** | Moves over other Units, but stops before an enemy Flying Unit. See 4.5. |
| **Heavy** | −1 Speed. The value is the same at each Rank. See 5.6. |
| **Heal N** | In each Start Phase of its owner, this Unit heals N HP to the friendly Unit with the lowest HP that is not at its maximum HP. A Bleeding Unit gets half of the heal, rounded down. A friendly Unit at its maximum HP gets no heal, so the Keyword does not occur ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). |
| **Heroic N** | After this Unit attacks an enemy Unit, it gets +N Attack: the Heroic bonus. Each attack on an enemy Unit adds more, with no limit. An attack also counts when it deals 0 damage. An attack on a Hero, Retaliate, First Strike, Trample and Last Breath do not count. The Heroic bonus stays until the Unit leaves the Board, and Rebirth ends it. It applies to all attacks of the Unit, also on a Hero, and to Retaliate. N is 1 at Common and Uncommon, 2 at Rare, 3 at Epic and 4 at Legendary ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)). |
| **Hero's Bane** | In each Start Phase of its owner, this Unit deals 1 Physical damage to the enemy Hero of its Front. The hit has no Crit, and it is not an attack ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)). |
| **Hobble N** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Hobbled with a count of N. A Hobbled Unit has a maximum Speed of 1, after all bonuses. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Hobble keeps the higher count. Retaliate does not apply Hobble. |
| **Iron Guard** | Each Physical hit on this Unit deals at most 3 damage. The cap applies after Bulwark, Crit, Block and Exposed, and before Ward. It does not change True Damage or status damage. The value is the same at each Rank ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)). |
| **Knockback N** | Melee only. After this Unit deals attack damage above 0 to an enemy Unit, that Unit is Pushed N Squares toward its own Hero, in its own Lane. The push is not Movement. It stops before another Unit and at the pushed Unit's Column 1. A Unit with Wall is never Pushed. Retaliate does not apply Knockback. See 4.5 and 4.7. |
| **Long-range** | +2 Range: this Unit is a Ranged Unit with Range 3. The value is the same at each Rank. See 5.6. |
| **Last Breath: X** | X occurs when this Unit leaves the Board. In v1, X deals N damage to the nearest enemy Unit ahead in the same Lane, or summons Token X in the Square that this Unit left. |
| **Mid-range** | +1 Range: this Unit is a Ranged Unit with Range 2. The value is the same at each Rank. See 5.6. |
| **Piercing** | The damage that this Unit deals cannot be reduced: it ignores Bulwark, Resistance, Ward, Block and the Iron Guard cap (4.7). It keeps its Crit and its Exposed bonus. It is not True Damage: a True hit has no Crit and no Exposed ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). |
| **Pivot** | Melee only. This Unit can attack an enemy Unit directly behind it or next to it, and it attacks them before the Unit in front. See 4.5 and 4.6. |
| **Poison** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Poisoned with 1 more stack. Retaliate does not apply Poison. In each End Phase of the Poisoned Unit's owner, it takes 1 damage per stack, then loses 1 stack. A new stack adds to the old stacks. This damage ignores Bulwark, Crit and Block, and it has no Damage Type. |
| **Quick Study** | When an enemy Hero plays a Skill Card, the card with the highest Countdown in the Hand of the Hero of this Unit goes down by 1. On a tie, the oldest card in the Hand goes first. A card that is Ready has a Countdown of 0: nothing changes, so the Keyword does not occur ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). |
| **Rally N** | In your Start Phase, other friendly Units in the same Lane get +N Attack until the end of the Turn. A Unit with Base Attack 0 gets no bonus. The bonus is fixed in the Start Phase: it stays when the Unit or the Rally Unit leaves the Lane, and a Unit that comes into the Lane later does not get it. The bonus does not apply to Retaliate or First Strike, because they occur in the enemy's Turn. |
| **Rebirth** | See 4.9. |
| **Regenerate N** | In your Start Phase, this Unit heals N HP. It cannot go above its maximum HP. |
| **Resistance N** | Reduces Fire, Frost, Holy and Lightning damage to this Unit by N. It does not reduce Physical damage: Bulwark does that ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). |
| **Retaliate** | See 4.7. |
| **Sabotage N** | When this Unit comes onto the Board from its Creature Card, the card with the lowest Countdown in the Hand of the enemy Hero of that Front gets +N Countdown. A Ready card (Countdown 0) is the lowest. If two cards have the same Countdown, the oldest card in the Hand gets it. Rebirth and Tokens do not apply Sabotage. If the Hand is empty, nothing occurs. N is the same at each Rank, and it is at most 2. |
| **Soul Harvest** | When an enemy Unit dies, this Unit gets +1 Attack and +1 HP, also above its maximum HP: the Soul Harvest bonus. A kill by any source counts. A Rebirth is not a kill, and Rebirth ends the bonus. It stays until the Unit leaves the Board ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)). |
| **Spawnbane N** | When an enemy Hero summons a Unit from a Creature Card, this Unit deals N damage to that Unit. The damage has the Damage Type of this Unit and applies no Status. It comes before the Sabotage and the Summon of the new Unit, so a Unit that dies does neither. A Token does not trigger it. N is the same at each Rank ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)). |
| **Summon X** | When you summon this Unit, a Token X of the same Rank also appears in an empty Square next to it (behind it, or the same Column in a next Lane). If no Square is empty, no Token appears. |
| **Swift** | +1 Speed. The value is the same at each Rank. See 5.6. |
| **Swarm N** | While another friendly Unit or Token is in the same Lane, this Unit has +N Attack. More friendly Units do not increase the bonus. The bonus applies to attacks and Retaliate. |
| **Trample** | Melee only. When this Unit kills an enemy Unit with attack damage, the damage above that Unit's HP hits the enemy Unit in the next Square behind it. See 4.7. |
| **Unique** | Only one copy of this card can be on your side of the Board. While a Unit from this card is on your Side of the Board, no Hero of your Side can play a copy of this card, at any Rank. The card stays in the Hand. A Unit that the Stage puts on the Board also counts, and enemy Units do not count. A Deck can still hold more than 1 copy. |
| **Vampirism** | When this Unit deals Physical damage, it heals HP equal to the damage that the hit dealt after Block and Ward, up to its maximum HP. It counts for an attack on a Unit or a Hero, Retaliate, First Strike, Trample and Last Breath. It does not apply to status damage ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)). |
| **Wall** | It can't move and can't attack, also when an effect gives it Speed or Attack. It never deals Retaliate or First Strike damage. A Wall card has Attack 0. It shows no Speed and no Range. It blocks its Lane for enemy Units. Friendly Units move through it. It can be summoned into Columns 1 to 5, not only into the Summon Zone (see 4.1). |
| **Wallbreaker** | The damage that this Unit deals to a Unit with Wall is doubled. The doubling comes before Bulwark, Exposed, Crit, Block and Ward, so those rules apply to the doubled damage. The damage to a Unit without Wall does not change ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). |

New Keywords must go through the balance process in section 13.

### 5.5 Classes

The Hero has one Class. The Class decides which Skill Cards the Deck can hold. A Deck can hold a Specialist only when the Deck has its Class ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)).

| Class | Focus | Example Skill Cards |
| --- | --- | --- |
| **Warrior** | Buffs and tempo | *War Drums* (U, Countdown 2): at Uncommon, the Countdown of 1 random card in your Hand goes down by 2; at Rare, 2 random cards go down by 2; at Epic, 3 random cards go down by 2; at Legendary, 3 random cards go down by 3. *Shield Wall* (C, 2): friendly Units in one Lane get Bulwark 1 at Common, 2 at Uncommon, 3 at Rare, 4 at Epic and 5 at Legendary for the next 2 enemy Turns. *Shoulder Charge* (C, 2): 3 Physical damage at Common, 4 at Uncommon, 5 at Rare, 6 at Epic and 7 at Legendary to an enemy Unit. If the damage is above 0 and the Unit survives, it is Pushed 1 Square, or 2 Squares at Legendary, as with Knockback. *Shield Bash* (C, 2): 2 Physical damage at Common, 3 at Uncommon, 4 at Rare, 5 at Epic and 6 at Legendary to an enemy Unit. Then your Units in its Lane get Bulwark 1 at Common, Uncommon and Rare, 2 at Epic and 3 at Legendary for the next enemy Turn (4.8). *Spear Throw* (C, 2): 5 Physical damage at Common, 6 at Uncommon, 7 at Rare, 8 at Epic and 9 at Legendary to an enemy Unit. *Ground Slam* (U, 3): 2 Physical damage to each enemy Unit in a Lane at Uncommon, 3 at Rare and 4 at Epic. *Cleave* (U, 3): 4 Physical damage to an enemy Unit and to the Square behind it; 5 at Rare, 6 at Epic and 7 at Legendary. *Expose Weakness* (R, 2): an enemy Unit becomes Exposed 2 at Rare, 3 at Epic and 4 at Legendary (4.7). *Call to Arms* (R, 3): friendly Units in a Lane get +4 Attack at Rare, +5 at Epic and +6 at Legendary until the end of your next Turn (4.8). *Onslaught* (E, 2): each friendly Unit in a Lane takes one more action now, from the front Unit to the back Unit; at Legendary, each also gets +1 Attack until the end of your next Turn (4.4, 4.8). War Drums is the only card that lowers a Countdown. |
| **Ranger** | Control and Hero damage | *Quick Shot* (C, Countdown 1): 5 Physical damage at Common, 6 at Uncommon, 7 at Rare, 8 at Epic and 9 at Legendary to an enemy Unit. *Pinning Shot* (C, 2): 6 Physical damage to an enemy Unit. If the damage is above 0 and the Unit survives, it becomes Entangled. *Harrying Shot* (C, 2): Physical damage to an enemy Unit and damage to the enemy Hero in its Lane. It deals 4 and 4 at Common, 5 and 4 at Uncommon, 6 and 4 at Rare, 7 and 5 at Epic, and 8 and 6 at Legendary. *Warning Shot* (C, 3): 8 Physical damage at Common, 9 at Uncommon, 10 at Rare, 12 at Epic and 14 at Legendary to an enemy Unit. If the Unit survives, it is Pushed 2 Squares toward its own Hero, also at 0 damage. *Barbed Arrow* (U, 3): 5 Physical damage to an enemy Unit. If the damage is above 0 and the Unit survives, it is Bleeding 3. *Long Shot* (U, 4): 12 damage to the enemy Hero. *Skybreaker* (U, 3): 7 Physical damage at Uncommon, 9 at Rare, 11 at Epic and 14 at Legendary to an enemy Unit. If the Unit is Flying and survives, it becomes Grounded (4.7), also at 0 damage. *Venom Arrow* (R, 4): 4 Physical damage at Rare, 5 at Epic and 6 at Legendary to an enemy Unit. If the Unit survives, it becomes Poisoned with 5 more stacks at Rare, 6 at Epic and 7 at Legendary, also at 0 damage (4.8). *Hunter's Focus* (R, 4): a friendly Unit gets +4 Attack at Rare, +5 at Epic and +6 at Legendary, and +1 Range at each Rank, until the end of the caster's next Turn (4.8). A Melee Unit attacks as a Ranged Unit while it has the bonus Range. *Rain of Arrows* (E, 6): 3 Physical damage to each enemy Unit in a Lane at Epic, and 5 at Legendary. Each Unit that survives with damage above 0 becomes Entangled. A new Entangled does not stack. No Ranger card delays the enemy Hand: that is the Goblin Keyword Sabotage. |
| **Mage** | Area damage and Field Effects | *Frost Bolt* (C, Countdown 2): 3 Frost damage to an enemy Unit. *Frost Shards* (C, 2): 2 Frost damage to an enemy Unit and to the Square behind it. *Fireball* (C, 3): 3 Fire damage to an enemy Unit and to the Square behind it in the same Lane. It does not damage friendly Units. *Flame Wave* (U, 4): 2 Fire damage to each enemy Unit in a Lane. *Frost Wave* (U, 3): 2 Frost damage to each enemy Unit in a Lane. *Spark* (C, 1): 2 Lightning damage to an enemy Unit. *Arc Lightning* (U, 3): 3 Lightning damage at Uncommon, 4 at Rare and 5 at Epic and Legendary to an enemy Unit and to the enemy Units in the same Column in the Lanes next to it. *Wildfire* (R, 4): Field Effect on 2 Lanes × 2 Columns for 2 Turns: 2 Fire damage to each enemy Unit in the area in each of your End Phases; 3 at Epic and Legendary. *Thunderstorm* (R, 5): 3 Lightning damage to 3 random different enemy Units; 4 at Epic and Legendary. *Blizzard* (E, 6): Field Effect on 3 Lanes × 2 Columns for 2 Turns: 2 Frost damage to each enemy Unit in the area in each of your End Phases; 3 at Legendary (4.8). The damage values of Arc Lightning, Wildfire, Thunderstorm and Blizzard come from a table. |
| **Priest** | Healing, protection and Holy damage | *Blessing of Light* (C, Countdown 1): a friendly Unit gets Ward 4 at Common, 5 at Uncommon, 6 at Rare, 7 at Epic and 8 at Legendary. *Mend* (C, 2): heal 8 HP to a friendly Unit at Common, 10 at Uncommon, 12 at Rare, 14 at Epic and 16 at Legendary. *Smite* (C, 2): 3 Holy damage to an enemy Unit. A Unit that it kills does not come back with Rebirth (4.9). *Radiant Strike* (C, 2): 2 Holy damage to an enemy Unit, then heal 2 HP to each friendly Unit in its Lane. *Penance* (U, 2): Holy damage to an enemy Unit equal to its Attack at the moment of the hit, with its Rally and Swarm bonuses. A Unit with Attack 0, and a Wall, take 0 damage. The Rank does not change the damage. *Sanctuary* (U, 3): a friendly Unit gets Ward 9 at Uncommon, 11 at Rare, 13 at Epic and 15 at Legendary (4.7). *Prayer of Healing* (U, 3): heal 11 HP to each friendly Unit in a Lane at Uncommon, 13 at Rare, 15 at Epic and 17 at Legendary. *Unbroken Vow* (R, 2): a friendly Unit gets Steadfast (4.7). *Cleanse* (R, 3): remove all Debuffs from a friendly Unit, then heal 8 HP to it at Rare, 9 at Epic and 10 at Legendary (4.8). *Aegis of Dawn* (E, 6): each friendly Unit in a Lane gets Ward 8 at Epic and 10 at Legendary. The Hero of the target cannot Block Holy damage, and a Ward absorbs it. Bleeding halves each heal. The Ward and heal values of Blessing of Light, Mend, Sanctuary, Prayer of Healing, Cleanse and Aegis of Dawn come from a table, not from the Rank scale. No Priest card heals a Hero ([ADR-0027](../adr/0027-nothing-heals-a-hero.md)). |

The values are the Common values, and they scale with the Rank (GDD 5.3), unless a table gives them. A card plays at the value of its Base Rank or a higher Rank: for example, Long Shot deals 14 at Uncommon, and Rain of Arrows deals 3 at Epic and 5 at Legendary. Push and Bleed counts usually do not scale. Shoulder Charge pushes 2 Squares at Legendary. Bonus Attack does not scale. The damage values of Quick Shot, Venom Arrow and Rain of Arrows, bonus Attack of Hunter's Focus, Poisoned stacks of Venom Arrow, bonus Bulwark of Shield Wall, and Exposed value of Expose Weakness come from tables. All cards in this table are real cards. Their source of truth is `packages/rules/src/content/cards.ts`.

**Planned Skill Cards.** v1 has 10 Skill Cards for each Class: 4 Common, 3 Uncommon, 2 Rare and 1 Epic ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)). The work order is: a re-tune of the current cards with a swap rule (#56), 14 Common and Uncommon cards that use only current rules (#57, done: each Class has 4 Common and 3 Uncommon, except the Mage), and then the Rare and Epic cards of each Class: Ranger (#59, done: the Ranger has all 10 cards), Priest with the Steadfast Buff (#61, done: the Priest has all 10 cards), Warrior with bonus Attack, the Exposed Debuff and the extra action (#63, done: the Warrior has all 10 cards), and Mage with Lightning, Paralyzed and Field Effects (#65, done: the Mage has all 10 cards, [ADR-0028](../adr/0028-lightning-damage-gives-paralyzed.md)). The Mage cards *Spark* (C) and *Arc Lightning* (U) came with #65. No Skill Card returns a Unit from the Graveyard. Each issue gives the provisional cards. This section changes when each card is implemented.

The player can change the Class at any time outside a Battle, at no cost. The Class is on each Deck Slot, and the Hero has the Class of the Active Deck: the player selects a Deck of another Class ([ADR-0032](../adr/0032-the-class-stays-on-the-deck-slot.md)). The Deck builder sets the Class of a Deck. A Deck that has Skill Cards of another Class is not valid until the player removes them.

### 5.6 Speed and Range Keywords

Each Unit has a Base Speed of 2 and a Base Range of 1. This includes each Token, each Wall and each Flying Unit. A card has no Speed or Range number of its own. Only Keywords, Statuses and Skill Cards change the numbers ([ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md)).

| Keyword | Change | Result | Power Points |
| --- | --- | --- | --- |
| Swift | +1 Speed | Speed 3 | 2 |
| Fleet | +2 Speed | Speed 4 | 4 |
| Heavy | −1 Speed | Speed 1 | −2 |
| Mid-range | +1 Range | Range 2 | 1 |
| Long-range | +2 Range | Range 3 | 2 |
| Extreme-range | +3 Range | Range 4 | 3 |

- A Unit with Range 1 is a Melee Unit. A Unit with Range 2 or more is a Ranged Unit (4.6).
- The values are the same at each Rank.
- A card has at most 1 Speed Keyword (Swift, Fleet or Heavy) and at most 1 Range Keyword (Mid-range, Long-range or Extreme-range). It can have one of each, for example Heavy and Long-range.
- Only a card with Base Rank Epic or higher has Extreme-range.
- There is no maximum Range. A Skill Card can add Bonus Range, also to a card with Extreme-range.
- A Ranged card and a Flying card can have Swift or Fleet. The simulation and the Power Budget control them.
- A Wall never moves, so a Wall card shows no Speed and no Range.
- The card face shows a sword for a Melee Unit, an arrow for a Ranged Unit, a wall for a Wall and wings for a Flying Unit.

## 6. Deck building

| Rule | Value |
| --- | --- |
| Maximum Deck size | 10 at player level 1. +1 per level. 30 at level 21 and higher. |
| Minimum Deck size | 5 at player level 1. +1 per level. 15 at level 11 and higher. |
| Countdown Limit | The sum of the printed Countdowns of the cards in the Deck is at most 2.5 × the maximum Deck size, rounded down: 25 at player level 1, 35 at level 5 and 75 at level 21 and higher. Each card counts, also a Skill Card. The Rank does not change the Countdown. A Stage enemy Deck does not have the limit ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md)). |
| Copies of one card | Maximum 3, of any Rank. |
| Skill Cards | Only Skill Cards of the Hero's Class. |
| Races | The Deck can mix all Races. |
| Saved Decks | 3 Deck slots for a new player: one for each Starter Deck and one empty. The player buys more with Coin in the Deck builder, up to 10 ([Economy 3.6](./07-economy.md#36-deck-slots)). A slot that the player buys is permanent. |

- The Deck builder has an **Auto-fill** button. It fills the Deck with the strongest valid cards. It does not add a card that puts the Deck over the Countdown Limit.
- The Deck builder shows all cards of the game. An owned card has one tile for each Rank that the player owns. A card that the player does not own has one tile in its Base Rank: grey, with a "Not owned" plate. The player cannot add it, but can see its card details. The owned cards come first, then the cards that are not owned. Each group is in Countdown order. When the player can add an owned tile, its plate shows the copies that the player owns in that Rank and the copies that are still free for the Deck, for example "3 owned · 1 left". Otherwise the plate tells why the player cannot add it. The header shows the number of different cards that the player owns, for example "14 / 66 owned".
- Deck builder filters: All, owned or not owned; All, Creature Cards or Skill Cards; then the Race for Creature Cards, or the Class for Skill Cards. The filters apply together. The Class filter starts on the Class of the Deck. The filters reset when the dialog closes.
- The game does not let the player start a Battle with a Deck that is not valid. It shows the reason.

### 6.1 Starter Decks

A new player gets the Starter Decks and picks one. The Hero Class comes from the Starter Deck. The cards of the Starter Decks are the Collection of a new player.

- **Rule:** each copy in a Starter Deck has the Rank Common or Uncommon. A Common card at Rare Rank is also not permitted. The first Epic of a player comes from play: the first win of the Boss Stage 1-10 gives Iron Bulwark (Epic). A content test checks this rule for each Starter Deck.
- **Guides** (not tested):
  - A Starter Deck has 10 cards, the maximum Deck size at player level 1. Its Countdowns are within the Countdown Limit of level 1 (25). A content test checks the limit.
  - Each copy is at its Base Rank, so a card that the player wins from a Stage is as strong as a card of the Starter Deck.
  - Common Creature Cards come in pairs or triples. This makes the Hand consistent, and it gives a first Combine target at player level 3. An Uncommon card or a Skill Card can have 1 copy.
  - Each Starter Deck has at least 1 Skill Card of its Class.

| Starter Deck | Class | Deck |
| --- | --- | --- |
| Vanguard | Warrior | 2× Militia Recruit (C), 3× Crossbow Guard (C), 2× Halberdier (C), 2× River Knight (U), 1× Spear Throw (C). Countdown 24. |
| Raiders | Mage | 3× Scrap Raider (C), 3× Ember Shaman (C), 2× Badland Runt (C), 1× Howling Charger (U), 1× Fireball (C). Countdown 23. |

The Campaign is tuned for these Decks ([14 — Campaign Stages](./14-campaign-stages.md)). When a Starter Deck changes, run the Stage simulation again.

## 7. Hero and progression

### 7.1 Player level

- The player gets XP from each Battle. A loss gives up to 25% of the XP of a win: only the share of the total enemy Hero HP that the enemy Heroes lost (Economy 2.1, [ADR-0041](../adr/0041-a-loss-gives-only-the-share-of-the-lost-enemy-hero-hp.md)).
- A Stage Repeat win and a Campaign Sweep give no XP. A Dungeon Repeat win and a Dungeon Sweep give XP (Economy 2.1, [ADR-0047](../adr/0047-a-stage-repeat-win-gives-no-xp.md)).
- The XP that each level needs is in the XP table ([Economy 1.2](./07-economy.md#12-player-levels)).
- The maximum player level in v1 is 30.
- Each level gives +1 Hero HP and changes the Deck size limits.

| Level | Unlock |
| --- | --- |
| 1 | Campaign, Deck builder |
| 2 | Packs |
| 3 | Workshop: Combine and Extract |
| 5 | Gear |
| 6 | Workshop: Craft and Fuse |
| 8 | Seaport (Economy 2.8), with the Coin Cargo for 6 hours. The XP Cargo and 12 hours open at level 12, Essence and 24 hours at level 18, and Forge Stones and 48 hours at level 24. |
| 10 | Dungeon 1 |
| 20 | Dungeon 2 |
| 30 | Dungeon 3 |
| Finish Region 5 | Heynspire |

Each unlock shows a Hint (see 8.3).

### 7.2 Collection

- The Collection is all the card copies that the player owns. It has no screen of its own: the Deck builder shows it (see 6), with the copies of each card in each Rank.
- A card is **Discovered** after the player owns it one time. The player can Craft only Discovered cards, and only a card with Base Rank Common, Uncommon or Rare ([ADR-0050](../adr/0050-craft-gives-no-epic-or-legendary-card.md)). A Fuse gives only a card that is not Discovered (see 7.4).
- There is no Inventory screen. Each thing that the player owns shows on the screen where the player uses it: the cards in the Deck builder and the Workshop, the balances on the Balance Plate, the Unopened Packs on the Packs screen, the Gear and the Forge Stones on the Hero screen, the Campaign Sweep Tickets on the Stage Panel and the Dungeon Sweep Tickets on the Dungeons screen.

### 7.3 Gear

The Hero has 4 Gear slots. Each slot has one item. Each item has a level from 0 to 25 ([ADR-0037](../adr/0037-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)). The player upgrades items with Coin and Forge Stones. Each level needs 1 Forge Stone of its tier: Common for levels 1 to 5, Uncommon for 6 to 10, Rare for 11 to 15, Epic for 16 to 20 and Legendary for 21 to 25. Forge Stones are earn-only ([ADR-0036](../adr/0036-gear-upgrades-need-earn-only-forge-stones.md), Economy 2.7). An upgrade never fails, and the level never goes down. Each level adds the same part of the stat: 0.5% Unit Crit, +1 Hero HP, 0.75% Hero Crit or 0.5% Unit Block ([ADR-0035](../adr/0035-gear-levels-are-rescaled-to-half-steps.md)).

| Slot | Stat | Level 0 | Level 20 | Level 25 |
| --- | --- | --- | --- | --- |
| Weapon | Unit Crit chance | 0% | 10% | 12.5% |
| Armor | Hero HP bonus | +0 | +20 | +25 |
| Trinket | Hero Crit chance (Skill Card damage) | 0% | 15% | 18.75% |
| Banner | Unit Block chance | 0% | 10% | 12.5% |

Cosmetics can change the look of each item. Cosmetics never change the stats.

### 7.4 Workshop

| Action | Input | Output | Notes |
| --- | --- | --- | --- |
| **Combine** | 2 copies of the same card in the same Rank, and Coin | 1 copy of that card in the next Rank | It never fails. The maximum Rank is Legendary. |
| **Extract** | 1 copy of a card | Essence | The game asks for confirmation if the copy is in a saved Deck. |
| **Craft** | Essence | 1 copy of a Discovered card with Base Rank Common, Uncommon or Rare, in its Base Rank | The player selects the card. An Epic or a Legendary card has no Craft ([ADR-0050](../adr/0050-craft-gives-no-epic-or-legendary-card.md)). |
| **Fuse** | 2 to 4 copies of one Rank (Common or Uncommon 2, Rare 3, Epic 4), and Essence | 1 copy of a card that the player has not Discovered, in its Base Rank | The card comes at random from the **Fuse pool**. A Legendary copy is never an input ([ADR-0049](../adr/0049-fuse-gives-a-card-that-is-not-discovered.md)). |

The [Economy](./07-economy.md) document gives the costs.

- A Deck holds a card and a Rank, not one specific copy. A copy is **in a saved Deck** when, after the action, the player owns fewer copies of that card in that Rank than a saved Deck uses.
- **Combine and Decks.** After a Combine, each saved Deck that uses more copies of the old Rank than the player owns gets the new-Rank copy in place of those entries. The Deck follows the better copy.
- **Extract and Decks.** The confirmation names each saved Deck that uses the copy. After the Extract, the copy goes out of those Decks. A Deck can then have too few cards, and the Deck builder and the Stage Panel show the problem.
- **Fuse.** All input copies have the same Rank (the Rank of the copy, not its Base Rank), and they are all Creature Cards or all Skill Cards. Two or more copies of the same card can be inputs. The **Fuse pool** is the cards that the player has not Discovered, with a Base Rank that is the Rank of the inputs, and with the Race (Creature Cards) or the Class (Skill Cards) of an input copy. Each input copy gives its Race or Class one equal share of the chance. A Race or Class with no card in the Fuse pool has no share, and the other shares grow. Then the Fuse selects one card of that Race or Class at random. For example, Human + Human + Elf (Rare) gives Human 2 in 3 and Elf 1 in 3. When the Fuse pool is empty, the player cannot Fuse. The new card is then Discovered. The Fuse uses the random state of the reward rolls, so the same Profile always gives the same card.
- **Fuse and Decks.** The same rules as Extract: the confirmation names each saved Deck that uses an input copy, and after the Fuse the copy goes out of those Decks. The last copy of a card can be an input, and the card stays Discovered.
- The player can Extract any copy, also the last copy of a card. The card stays Discovered. The Workshop does not stop an Extract that leaves too few cards for a valid Deck (Pillar 4: "The player can Extract any card").
- **Screen.** The Workshop has four **stations**, one for each action, in this order: Combine, Craft, Fuse and Extract. In Combine, Craft and Extract, the player selects a station, then a card. Each station tab shows its name, its recipe ("2 copies → next Rank", "Essence → 1 copy", "2–4 copies + Essence → new card", "1 copy → Essence") and a number: the cards with a pair, the cards that the player can Craft now, the Discovered cards that can go into a Fuse now, or the **spare copies** (the copies that no saved Deck uses). A card can go into a Fuse now when it has a copy below Legendary, and its Race or Class at that Rank has at least one card in the Fuse pool. The Workshop opens on Combine, or on Craft while the Craft Hint shows. Below player level 6, the Craft and Fuse tabs and panels show "Opens at level 6". The Craft station grid shows only the cards with Base Rank Common, Uncommon or Rare: an Epic or a Legendary card has no Craft, so it is not in the Craft grid ([ADR-0050](../adr/0050-craft-gives-no-epic-or-legendary-card.md)). When the filters keep only Epic and Legendary cards, the empty Craft grid gives this reason.
- **Grid.** The Workshop shows a card grid with the filters of the Deck builder. The grid shows only Discovered cards, because each action needs a Discovered card. The grid has the same order in all stations. The station marks the cards that it can act on and makes the other cards darker. Each station also has a filter that keeps only the cards that it can act on ("Pairs only", "Can Craft", "Can Fuse", "Spare only"). The selected card stays selected when the player changes the station.
- **Fuse inputs.** In the Fuse station, a press on a card puts one of its copies in a slot. It does not select the card. When the card has copies in two or more Ranks that can go in, a small Rank chooser opens on the card first. The first copy sets the Rank, the card type and the number of slots (2, 3 or 4). Then each press puts in a copy of that Rank, and the grid makes darker the cards that do not fit. Spare copies go in first. A copy that a saved Deck uses goes in only when no spare copy of that Rank stays. A press on a slot takes the copy out. When the last copy goes out, the Rank and the card type are free again. The slots stay when the player changes the station, and they clear after a Fuse or when the player leaves the Workshop.
- **Panels.** The Combine panel shows each Rank of the card with its copies, a Combine between two Ranks, and the path to Legendary. The Craft panel shows the Essence cost, the Base Rank copy that the Craft makes, and the Essence before and after the Craft. The Extract panel shows each Rank with a copy, the copies that saved Decks use, and the Essence that each Extract gives. The Fuse panel shows the slots, the chance of each Race or Class of the inputs with the cards of the Fuse pool (name and art; on a short screen, art only, and the card details give the name), and the Essence before and after the Fuse. A Race or Class with no share stays in the list, with "All Discovered". When the Fuse pool is empty, the Fuse button is disabled with the reason, for example "You have Discovered all Rare Human cards".
- Extract also asks for confirmation for an Epic or a Legendary copy, because these copies cost much to get again.
- After a Combine, the new copy shows with the Rank burst of the Pack reveal, and an anvil sound plays. A Craft is the opposite of an Extract: Essence drops fly from the Essence balance into the card, the new copy forms, and then the Rank burst and the anvil sound come. After an Extract, Essence drops fly from the card to the Essence balance, and the balance counts up. A Fuse of a copy that a saved Deck uses asks for confirmation first, as an Extract. Then the input copies go into one face-down Card Back, the Essence drops fly in from the Essence balance, and the card turns over with the Rank burst and the "New" ribbon.
- The first version has only single actions. Bulk actions (for example "Combine all pairs" or a bulk Fuse) can come in a later version.

## 8. Game modes

### 8.1 Campaign

- 5 Regions. Each Region has 10 Stages, thus the Campaign has 50 Stages. Stage 10 of each Region is a **Boss Stage**.
- Each Region adds one Debut Race to the enemies, and the Boss is of a Debut Race of its Region (see 3.3).
- The Stages in a Region unlock in order. A Region unlocks when the player wins the Boss Stage of the previous Region.
- Each Stage defines: enemy Hero, enemy Deck, enemy Hero HP, Closed Lanes, Units at the start, special rules, and rewards.
- The design of each Stage is in [14 — Campaign Stages](./14-campaign-stages.md).
- **First win reward:** a fixed card, Coin and XP.
- **Repeat win reward:** ⅓ of the Coin of a win, no XP ([ADR-0047](../adr/0047-a-stage-repeat-win-gives-no-xp.md)), a chance of a Forge Stone, and a chance of a card from the Stage card pool (Economy 2.1). Each Campaign Sweep Ticket (see 4.12) gives this reward.
- **Star chests:** Each Region gives a chest at 10, 20 and 30 Stars. The player claims a chest with a tap when the Region has its Stars. Its Coin and Essence go to the balances at once. Its Pack becomes an Unopened Pack, which the player opens on the Packs screen. For a Race Pack, the player selects the Race there.

The enemy Hero of a **Boss Stage** is a **Boss**: an enemy Hero with a name and special rules. Boss Stages have special rules. For example:

- A large Hero HP and a large Deck.
- A Start Unit, for example the Boss's bodyguard. This Unit is not a Boss.
- A rule that changes the Board, for example "Lane 2 is closed until Turn 5".

### 8.2 Heynspire (draft name)

- Heynspire unlocks with the first win of the Region 5 Boss Stage (Stage 5-10). It does not unlock at a player level.
- It has 50 **Floors**. The player climbs one Floor at a time: the player fights only the **Current Floor**, the lowest Floor that the player has not won. After the win of Floor 50, Heynspire has no Current Floor.
- **No replay.** A won Floor cannot be played again. It has no repeat-win reward and no Sweep, so a Floor win is always a first win (Economy 2.3).
- All Floors use 4 Lanes and have no Closed Lanes. Each v1 Floor has 1 enemy Hero, with a Front of all 4 Lanes.
- A pure function makes each Floor from a **Floor template** and a **strength curve** ([ADR-0040](../adr/0040-heynspire-floors-come-from-templates-and-a-strength-curve.md)). Floor *n* is always the same Floor. There is no random content at run time.
- **Floor templates.** 9 templates make the normal Floors. Floors 1 to 9 use templates 1 to 9, Floors 11 to 19 use them again, and so on, each time with more Hero HP. Each template has an enemy name, a Race theme, a Class and a Deck of 30 Base Rank copies. The cards come from the Campaign card pool (the cards in the enemy Decks of all Stages), with no Epic Skill Card.

| Template | Floors | Enemy (draft name) | Class | Race theme |
| --- | --- | --- | --- | --- |
| 1 | 1, 11, 21, 31, 41 | Spire Warden Holt | Warrior | Human |
| 2 | 2, 12, 22, 32, 42 | Emberchief Razka | Mage | Orc |
| 3 | 3, 13, 23, 33, 43 | Trapmaster Krink | Ranger | Goblin |
| 4 | 4, 14, 24, 34, 44 | Grove Sister Myrra | Priest | Elf |
| 5 | 5, 15, 25, 35, 45 | Beastmaster Brokk | Ranger | Feral |
| 6 | 6, 16, 26, 36, 46 | Bonecaptain Rusk | Warrior | Undead |
| 7 | 7, 17, 27, 37, 47 | Lightbearer Anselm | Priest | Human and Elf |
| 8 | 8, 18, 28, 38, 48 | Warboss Gnash | Warrior | Orc and Goblin |
| 9 | 9, 19, 29, 39, 49 | Rimecaller Isolde | Mage | Undead and Feral |

- **Boss Floors.** Each 10th Floor is a **Boss Floor**. The 5 Campaign Bosses come back in Region order: Floor 10 is Baron Brassbelly, Floor 20 is Boss Snikkit, Floor 30 is Lady Glimmerbough, Floor 40 is the Old Bramble and Floor 50 is Queen Marrow. Each Boss has a new Floor Deck, and it keeps the Class and the Start Units of its Boss Stage. A Boss Floor has no Boss Rules.
- **Strength curve.** For the Floor number, the curve gives the Rank steps, the Hero HP, the Gear and the Deck size (the largest at the Recommended level). One Rank step on all copies changes a win rate by too much, so the curve gives 1 Rank step to the first copies of a template Deck only. Each later group of 10 Floors adds Hero HP. No copy goes above Legendary.
- **Targets.** The difficulty does not go up. A normal Floor has the target of a normal Stage (60% to 80%), and a Boss Floor has the target of a Boss Stage (30% to 50%), at its Recommended level, with no Gear and with the Expected Gear (see 13, step 6). The Recommended level and the Expected Gear come from the First-try Path: all Stages, then the earlier Floors.
- Each Floor gives a reward for the first win. Each 10th Floor gives an earn-only Cosmetic, Essence and Heynstones.
- v1 has no weekly reset, because a local clock is not reliable. Online versions can add a weekly reset.
- The design of each Floor and the simulation results are in [14 — Campaign Stages, section 8](./14-campaign-stages.md#8-heynspire).

### 8.3 Tutorial and Hints

The **Tutorial** is one guided session in Stage 1-1. It teaches only the core of a Battle. Each step shows when its subject first appears on the screen:

| Step | When | Lesson |
| --- | --- | --- |
| 1 | Turn 1, Play Phase | Countdown and Ready cards. A highlight on the Hand. |
| 2 | The first summon | An arrow and a highlight point to the Summon Zone of Lane 2. They do not force the player to use Lane 2, and the enemy plays in all 3 Lanes. |
| 3 | The first Resolution Phase | Units move and attack by themselves. |
| 4 | The first enemy Unit in a Lane with no player Unit | Lane choice: a highlight on that Lane tells the player to block the enemy Unit. |

- The Tutorial uses short text, arrows and highlights. The player can skip the text, but the player cannot skip Stage 1-1. The player cannot start the Tutorial again.
- The Tutorial is each play of Stage 1-1 until its first win. After a loss or an Abandon, the next play of Stage 1-1 is the Tutorial again. After the first win, Stage 1-1 is a normal Stage with no guidance.
- No Hint shows during the Tutorial.
- Stages 1-1 to 1-3 have 3 open Lanes, like all Stages, and no Closed Lanes (see 4.1). If the first Stages show a Board with 1 or 2 usable Lanes, the player learns that the Board shape changes from Stage to Stage. A dead Lane can also look like a bug or a locked feature.

We keep the Tutorial short. The old plan had 6 steps across Stages 1-1 to 1-3 and player levels 2 and 3. A new player forgets most of a long tutorial, and a tutorial that shows again on a replay is annoying.

A **Hint** is a one-line tip. It shows one time, when the player first meets something that the Tutorial does not teach. A Hint is a small banner near its subject. It has no arrow and does not stop the game. It closes on a tap, or by itself after some seconds. There is no setting to turn Hints off. The Profile keeps the list of Hints that the player has seen. Each Hint has a "Read more" link that opens the Handbook at the Entry of its subject. When the subject is a screen control and not a game concept (for example the Battle Log), "Read more" opens the Controls Guide at the line of its input.

| Hint | When it shows |
| --- | --- |
| Skill Card | The first Ready Skill Card in the Hand |
| Recall | The first time that Recall returns a Skill Card to the Hand |
| Deck builder | The first owned card that is not in a Deck |
| Packs | Player level 2 |
| Workshop | Player level 3 |
| Gear | Player level 5 |
| Craft | Player level 6 |
| Dungeons | Player level 10 |
| Heynspire | The first time that the Town shows after the first win of the Region 5 Boss Stage, near the tower: "Heynspire is open. Climb its 50 Floors one at a time. Each Floor gives its reward one time." |
| Battle Log | The first loss of a Stage after the Tutorial, on the result screen: "Open the Battle Log to see what happened." |
| Campaign Sweep | The first time that the Stage Panel shows a Stage with 3 best Stars, near the Sweep button: "Use Campaign Sweep Tickets to get the rewards of this Stage at once." |
| Dungeon Sweep | The first time that the Dungeons screen shows a Dungeon with 1 or more wins, near the Sweep button: "Use Dungeon Sweep Tickets to get the rewards of this Dungeon at once." |

### 8.4 Dungeons

A **Dungeon** is a named place outside the Campaign. In a Dungeon, the player fights one Battle against all the Bosses of the Dungeon at the same time. There are no Battles before the Bosses.

- Each Dungeon unlocks at a player level (see 7.1). It does not need Campaign progress.
- The enemy Side has 1 Hero for each Boss. Each Boss has its own Front, Deck, Hand, Class and Gear (see 4.1 and 4.10).
- Each Boss needs at least 1 Lane. Dungeons always use 4 Lanes, so a Dungeon can have 1 to 4 Bosses. v1 Dungeons have 2 or 3 Bosses.
- Each Dungeon defines: the Bosses, the Front of each Boss, the Deck, Hero HP, Class and Gear of each Boss, Closed Lanes, Units at the start, the Boss Rules of each Boss, and rewards.
- A **Boss Rule** activates automatically, one time, when the HP of its Boss goes to or below a set percentage. Its effect is Countdown −X on the Cards with the highest Countdown in that Boss's Hand, a Summon into that Boss's Front, or a Draw. The Dungeons screen shows the Boss Rules, and the HP plate has a marker at each threshold ([ADR-0038](../adr/0038-a-boss-rule-is-a-one-time-hp-threshold-with-a-fixed-effect-list.md)).
- The player can play a Dungeon again after a win, or do a Dungeon Sweep of it (see 4.12).
- **First win reward** and **repeat win reward:** the same structure as Stages (see 8.1). The [Economy](./07-economy.md) document gives the values. Each Dungeon Sweep Ticket gives the repeat win reward.
- A Dungeon win gives no Stars. It gives 1 Dungeon Sweep Ticket and no Campaign Sweep Tickets (see 4.12).

| No. | Unlock | Bosses | Lanes | Fronts |
| --- | --- | --- | --- | --- |
| 1 | Player level 10 | 2 new Bosses | 4 | 2 + 2 |
| 2 | Player level 20 | 2 new Bosses | 4 | 3 + 1 |
| 3 | Player level 30 | Baron Brassbelly, the Old Bramble and Queen Marrow, with higher power than in the Campaign | 4 | 1 + 2 + 1 (the Old Bramble holds the 2 center Lanes) |

- Dungeon 1 teaches the multi-Boss rules in the simplest form: 2 Bosses with 2 Lanes each.
- Dungeon 2 teaches Fronts of different sizes.
- Dungeon 3 is the final challenge. It uses 3 of the 5 Campaign Bosses again, so it needs no new Boss characters.
- The names of the Dungeons and the 4 new Bosses are drafts.

**Dungeon 1: The Rootdeep Mine** (draft names). The Goblin diggers of the Red Mesas dug into the roots of the Glowcap Hollows. The first win gives Grand Gearjammer (Epic). [14 — Campaign Stages, section 7](./14-campaign-stages.md#7-dungeons) gives the Decks and the simulation results.

| Boss | Front | Class | Hero HP | Start Units | Boss Rule |
| --- | --- | --- | --- | --- | --- |
| Foreman Gritjaw, the Orc foreman of the mine, with his Goblin crew | Lanes 1 and 2 | Warrior | 24 | Bonestake Palisade (Common), Lane 1, Column 11 | At 50% HP: Summon a Mesa Pit Fighter (Rare) in Lane 2, Column 11. |
| Rootwarden Sylla, the Elf warden of the roots, with the Goblins that she hired | Lanes 3 and 4 | Ranger | 24 | — | At 50% HP: Countdown −2 on the 2 cards with the highest Countdown in her Hand. |

**Dungeon 2: The Rimebarrow** (draft names). A frozen grave mound where the Hollow Marches meet the cold hills. It teaches Fronts of different sizes: the Player can hit the wide Boss in 3 Lanes, but the narrow Boss only in Lane 4. The first win gives Old Frostmaw (Epic). [14 — Campaign Stages, section 7.4](./14-campaign-stages.md#74-dungeon-2-the-rimebarrow) gives the Decks and the simulation results.

| Boss | Front | Class | Hero HP | Start Units | Boss Rule |
| --- | --- | --- | --- | --- | --- |
| Abbot Knell, the Undead abbot of the barrow, with his choir of cheap Undead | Lanes 1, 2 and 3 | Priest | 18 | Bone Rampart (Epic), Lane 3, Column 11 | At 50% HP: Summon a Chattering Cohort (Uncommon) in Lane 2, Column 11. |
| Seer Vell, the Elf frost seer who keeps the cold beasts | Lane 4 | Mage | 12 | Boulder Tortoise (Uncommon), Lane 4, Column 10 | At 50% HP: Summon an Avalanche Yeti (Rare) in Lane 4, Column 11. |

**Dungeon 3: The Broken Vault** (draft names). An old Lanekeeper vault under the hills, where 3 Bosses of the Campaign join to take revenge on the Player. Each Boss keeps its Campaign bodyguard. The 3 Bosses have 3 different Classes: Baron Brassbelly is a Warrior in the Campaign, but a Ranger here. They have higher power than in the Campaign from Gear (25 on Weapon, Trinket and Banner) and Boss Rules. With 3 Hands, each Boss Deck has only 4 cards: the start Hand. The first win gives Sir Odo, the Last Taxman (Epic). [14 — Campaign Stages, section 7.5](./14-campaign-stages.md#75-dungeon-3-the-broken-vault) gives the Decks and the simulation results.

| Boss | Front | Class | Hero HP | Start Units | Boss Rule |
| --- | --- | --- | --- | --- | --- |
| Baron Brassbelly, the bandit lord of Hearthvale | Lane 1 | Ranger | 20 | Shieldbearer (Epic), Lane 1, Column 10 | At 50% HP: Summon a Gate Warden (Epic) in Lane 1, Column 11. |
| The Old Bramble, the forest giant of the Thornwood | Lanes 2 and 3 | Warrior | 34 | Bramble Nest (Uncommon), Lane 2, Column 9 | At 50% HP: Summon a Mountain Colossus (Epic) in Lane 3, Column 11. |
| Queen Marrow, the ruler of the Undead | Lane 4 | Mage | 20 | Bone Rampart (Epic), Lane 4, Column 9 | At 50% HP: Summon a Winter Maw (Epic) in Lane 4, Column 11. |

## 9. Enemy AI

- The AI uses the same rules and the same information as a player. It does not see the player's Hand.
- In each Play Phase, the AI gives a score to each legal play (each Ready card in each legal place). It plays the best play, and then scores again. It stops when no play has a score above 0. A play that has no effect scores 0.
- The score uses: threat in each Lane, damage that the AI's Hero will take, Units that the play can kill, and the value of the card.
- The value of a Unit, the threat in a Lane and the defense in a Lane use the Attack with the Heroic bonus, because the bonus stays until the Unit leaves the Board ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md), issue [#109](https://github.com/rifandani/heynbord/issues/109)). Thus the AI prefers to kill or block a Unit that has a Heroic bonus. They do not use the Rally bonus, the Swarm bonus or the bonus Attack of a Skill Card, because these bonuses are short, and the AI gives no value to a Heroic bonus that a Unit can get later.
- For a Creature Card, the AI selects a Lane and a Column of its Summon Zone, or Columns 1 to 5 for a Wall. It prefers the deepest empty Square that is nearer its Hero than the nearest enemy Unit in that Lane, so that its Unit blocks the enemy. It summons past an enemy Unit only with a Pivot Unit, or when the Lane has no enemy threat.
- Some Creature Keywords add to the value of the card (issue #84). **Sabotage N** adds N × 4, and N × 8 when the card with the lowest Countdown in the enemy Hand is Ready or has Countdown 1. It adds 0 when the enemy Hand is empty. **Hobble N** adds N × 2 for each Speed point above 1 of the fastest enemy Unit in the Lane. An enemy Unit that is already Hobbled for N or more does not count. Thus the AI sends a Hobble Unit to a Lane with a fast enemy Unit. **Last Breath N** adds N, a small value, because the damage occurs only when the Unit dies. The Specialist Keywords add a value too: **Wallbreaker** 3, **Quick Study** 2, **Piercing** 3, **Heal N** N × 2 and **Dispel** 2 ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)). The **Resistance N** of a Unit on the Board counts in the value of that Unit, like its Bulwark.
- Some Skill Card effects have a Hold Rule: the AI keeps a Ready card until a condition is true, for example Shield Wall until an enemy Unit is in the Lane. A Hold Rule never stops a play that prevents lethal Hero damage, or a play that empties a full Hand while the Deck has cards.
- **Damage to one enemy Unit.** *Spear Throw*, *Shoulder Charge*, *Quick Shot*, *Barbed Arrow*, *Smite* and *Penance*: the AI plays the card only when the hit kills the target (or when the hit is Frost, because a Freeze has value at each target, as for *Frost Bolt*). Between the kills, a Unit of more value scores more, and a kill that removes damage to the AI's Hero scores more. For *Penance*, the damage is the Attack of the target, so the AI prefers the target with the highest Attack. A *Shoulder Charge* push that moves a Unit back adds a small score.
- **Area and Lane damage.** *Fireball*, *Cleave* and *Frost Shards* (the target and the Square behind it), and *Flame Wave*, *Ground Slam* and *Frost Wave* (a Lane): the AI plays the card when the hit kills a Unit or hits 2 Units. A hit counts when it deals damage above 0, or when it is Frost, because Frost Freezes also at 0 damage.
- *Shield Bash*: the AI plays it when the hit kills, or when at least 1 friendly Unit is in the Lane of the target. The Bulwark scores more for each friendly Unit in the Lane when the Lane has an enemy threat.
- The Ranger Hold Rules:
  - *Pinning Shot*: the AI plays it when the hit kills, or when the target would move in its next action: the hit deals damage above 0, and the target is not a Wall, not Frozen, not already Entangled, has Speed 1 or more, and the Square in front of it is empty.
  - *Venom Arrow*: the AI plays it only on an enemy Unit that survives the hit, because a Unit that dies gets no stacks. The score is the new Poison damage, up to the HP that is left after the hit, plus 1.5 times the Attack of the target, so a Unit with a high Attack is the best target. More HP left wins a tie. The AI does not prefer a Wall or a Unit with Bulwark: the swap rule found that they are worse targets ([Archetypes 3.3](./08-archetypes.md#33-skill-card-swap)).
  - *Rain of Arrows*: the AI plays it when the Lane has 2 or more enemy Units, or when the hit kills. A hit that Entangles a Unit that would move adds to the score, as for *Pinning Shot*.
  - *Skybreaker*: the AI plays it on the enemy Flying Unit that is not Grounded and is nearest to its Hero. If there is no such Unit, it plays the card only when the hit kills an enemy Unit. Else it keeps the card, so that it has the card when an enemy Flying Unit comes.
  - *Hunter's Focus*: the AI plays it on a friendly Unit with Base Attack above 0 that attacks in this Turn with the bonus: an enemy Unit or the enemy Hero is in reach of its Speed and its new Range. The score is the bonus Attack, plus the Attack of the Unit, so the Unit with the most Attack wins. When the bonus Range gives the Unit a target that it did not reach, the score is much higher. If no Unit attacks with the bonus, the AI keeps the card.
  - *Warning Shot*, *Harrying Shot* and *Long Shot*: no Hold Rule. For *Warning Shot*, the AI first selects an enemy Unit that the hit kills, the Unit of the most value first. Else it selects the enemy Unit nearest to its Hero that the push moves at least 1 Square. If the push moves no Unit, it selects the enemy Unit that takes the most damage. A push only delays a Unit: the swap rule found that a push in place of a kill wastes the damage (issue #50). For *Harrying Shot*, the Hero damage adds to the score of the Unit hit, and Hero damage that defeats the enemy Hero always wins.
- The Priest Hold Rules:
  - *Mend*: the AI keeps the card until a friendly Unit has lost at least 50% of its maximum HP. The target is the friendly Unit that gets back the most HP, after Bleeding. If two Units get back the same HP, it selects the Unit with the higher maximum HP. A heal that gives back no HP scores 0.
  - *Sanctuary* and *Blessing of Light*: the AI keeps the card until a friendly Unit has an enemy Unit in its Lane and a Ward lower than the new value. The target is that friendly Unit nearest to the enemy (the Unit that the enemy attacks first). If two Lanes have one, it selects the Lane where the enemy is nearest to the AI's Hero.
  - *Radiant Strike*: the AI plays it when the hit kills, or when the heal gives back 2 HP or more in total, after Bleeding.
  - *Prayer of Healing*: the AI keeps the card until the friendly Units of a Lane have lost at least 6 HP in total. The target is the Lane where the heal gives back the most HP, after Bleeding.
  - *Smite* and *Penance*: the rule of damage to one enemy Unit, above.
  - *Cleanse*: the AI plays it on a friendly Unit with a Debuff of value: Frozen (not a Wall, because a Wall does not act), Paralyzed (a Unit with Attack that is not a Wall), Poisoned, Burn, Hobbled, Grounded, Entangled (not a Wall), or Bleeding on a damaged Unit. It prefers a Frozen Unit, then a Paralyzed Unit, then the Unit with the most Poisoned stacks. The HP that the heal gives back adds to the score, after the Debuffs end. When no Unit has a Debuff of value, it uses the *Mend* rule on the target: the Unit has lost at least 50% of its maximum HP. The swap rule found that a Cleanse that waits for a Debuff stays in the Hand against Decks that give no Debuffs ([Archetypes 3.3](./08-archetypes.md#33-skill-card-swap)).
  - *Unbroken Vow*: the AI plays it on a friendly Unit that is not Steadfast and has an enemy Unit in its Lane. It selects the Unit of the most value (Attack, HP, Speed and Bulwark, as for a card).
  - *Aegis of Dawn*: the AI plays it when a Lane has 2 or more friendly Units and an enemy Unit. The score is the Ward that the Units get above their own Ward, so the AI selects the Lane where the Ward adds the most.
  - *Expose Weakness*: the AI plays it on an enemy Unit that a friendly Physical Unit hits in this Turn. The estimate takes the first enemy Unit ahead of each friendly Unit, when the Speed of this Turn and the Range reach it. Each hit scores the Exposed value, and each point of Bulwark of the target adds more, so a Unit with Bulwark or a Wall wins. A target that the Exposed damage lets the hits kill wins first.
  - *Call to Arms*: the AI plays it when the Lane has 2 or more friendly Units with Base Attack above 0, and an enemy Unit, or one of those Units gets the enemy Hero in its Range in this Turn. The score is the bonus of all the Units, below the score of a Creature Card, so the AI first summons its Units.
  - *Onslaught*: the AI plays it when the Lane has 2 or more friendly Units that can act: not a Wall, not Frozen, and with Attack or Speed above 0. Each Unit that acts adds to the score, and its Attack adds more. The score is below the score of a Creature Card, so a Unit that the AI summons in this Turn also gets the extra action.
- The Mage Hold Rules:
  - *Spark*: the AI plays it on an enemy Unit that would attack in its next action, or when the hit kills. A Unit would attack when it is not a Wall, not Frozen and not Paralyzed, it has Attack, and a Unit of the AI's Side or the AI's Hero is in reach of its Speed and Range.
  - *Arc Lightning*: the AI plays it when it hits 2 or more Units, or when the hit kills.
  - *Thunderstorm*: the AI plays it when 2 or more enemy Units are on the Board. The score is the damage score of each enemy Unit times the chance that the random choice hits it.
  - *Wildfire* and *Blizzard*: the AI plays the card on the area with 2 or more enemy Units. The score is the damage of the first hit, plus the later hits on the Units that survive, at their Squares now. Thus the area with the most enemy Units wins.
  - A Paralyzed enemy Unit does not count in the Hero damage estimate, the same as a Frozen Unit. A Lightning hit adds a small Status score, also at 0 damage.
- Each damage estimate of the AI, for example its kill estimate, includes the Ward and the Exposed value of the target. A hit on a Unit with Steadfast never counts as a kill, because Steadfast holds the Unit at 1 HP.
- Difficulty comes from the enemy Deck, card Ranks and Hero HP. The AI logic is the same in all Stages.
- When a Side has more than one Hero, one AI controls all the Heroes of that Side that are not Defeated. It plays the Ready cards of each Hero in the same Play Phase. It scores the plays of all the Heroes together, and each play names its Hero. If two plays have the same score, the Hero with the lower index plays. A Defeated Hero does not play.
  - The Hero damage estimate and the lethal check use the Hero whose Front holds each Lane. Thus a play that saves one Hero from lethal damage gets the bonus, also when the card comes from another Hero of the Side.
  - Sabotage uses the Hand of the enemy Hero whose Front holds the Lane of the summon. Skill Card damage to an enemy Hero uses the HP of the Hero that it hits, and damage that makes that Hero Defeated always wins.
  - The AI does not see the Hand of any Hero of the other Side. It does not plan around Boss Rule HP thresholds ([ADR-0038](../adr/0038-a-boss-rule-is-a-one-time-hp-threshold-with-a-fixed-effect-list.md)).
- Auto-play uses the same AI for the player's side. Only the tests, QA and the simulations use Auto-play (see 4.12).

## 10. Achievements, Cosmetics and the Bazaar

- Achievements are goals, for example "Win a Battle with only Undead Units" or "Combine a card to Legendary".
- Most Achievements give Heynstones. Achievements can also give Coin, Essence or an earn-only Cosmetic.
- Cosmetic types in v1:
  - **Card backs**
  - **Board skins** (Lane and Square look: a painted Lane runner under each Lane, [web ADR-0012](../../apps/web/docs/adr/0012-a-board-skin-draws-lane-runners.md))
  - **Hero portraits**
  - **Gear looks** (one painted icon for each of the 4 Gear items, on the Gear plates of the Hero screen, [web ADR-0013](../../apps/web/docs/adr/0013-a-gear-look-is-a-set-of-4-gear-icons.md))
- The player uses one Cosmetic of each family at a time: the **Active Cosmetic** ([ADR-0052](../adr/0052-a-player-uses-one-cosmetic-for-each-family.md)). The player selects it from the Cosmetics that they own, in the Bazaar. Each family also has a free **Standard look**, so the player can always go back: the Standard look of the card backs is the Standard Back, the Standard look of the Hero portraits is the Standard portrait, the Standard look of the Gear looks is the Standard kit (the 4 Gear icons in royal blue, gold and steel), and the Standard look of the Board skins is the Standard ground (no Lane runner).
- The Bazaar shows a Card Back on a shelf at the size of a card and a Hero portrait on a shelf at the size of the portrait, so the player sees the look before the purchase. All face-down cards of the player show the Active Card Back. The whole Board of every Battle shows the Active Board skin, also the enemy half. The player's Hero shows the Active Hero portrait in the Top Bar and on the Board. The Gear plates of the Hero screen show the icons of the Active Gear look. The Hero is the player, not its Class: one face serves all 4 Classes.
- Cosmetics never change gameplay.
- **Earn-only Cosmetics** come only from play: one for each 10th Heynspire Floor, and one for each of 3 hard Achievements. They are never in the Bazaar.
- The **Bazaar** sells all other Cosmetics and the Conveniences for Heynstones. A Convenience changes comfort or organization. It never changes the result of a Battle, the speed of progress or the content of the Collection. In v1 the Bazaar has no Convenience. A Deck slot is a Convenience, but it costs Coin, not Heynstones (section 6).
- In v1, the player can only earn Heynstones, and only from one-time rewards. The total is less than the cost of the full Bazaar, so the player must choose. [ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md) gives the reasons.

## 11. User interface

### 11.1 Screens

| Screen | Content |
| --- | --- |
| **Town** | The first screen of the game. A 2D painting of a town. The Player selects a Building to open a screen. The Town Gate, the Card shop and the Workshop can be selected ([web ADR-0004](../../apps/web/docs/adr/0004-the-town-is-a-layered-2d-painting.md)). |
| **Campaign** | The Region Map of one Region, with its Stage Markers, Stars and Star chests (see 11.5) |
| Heynspire | Tower column (50 storeys, Floor 1 at the bottom), Current Floor, docked Floor Panel with rewards |
| Dungeons | Dungeon list, unlock levels, Bosses, rewards, the Dungeon Sweep Tickets and the Dungeon Sweep (see 4.12) |
| Seaport | The harbour, seen from the water. The Cargo plaques and the duration row, each with its unlock level, the Manifest with the full reward and the return time, Dispatch, and the berth plate: the ship at the berth, or the Expedition of the ship, its return time, the reward of a Collect now and Collect (Economy 2.8) |
| Battle | Board, Hand, Heroes, controls (see 11.2) |
| Deck builder | A modal dialog in the center of the screen, not a separate screen (see 11.4): a book with the Deck slots as ribbons and a locked ribbon that buys the next Deck slot, all cards with filters (see 6), validation, Auto-fill |
| Workshop | Four stations, Combine, Craft, Fuse and Extract: the Discovered cards with the filters of the Deck builder, and the panel of the selected station for the selected card (see 7.4) |
| Hero | The Hero HP and its parts; the 4 Gear items with their level, their stat now and at the next level, the Gear upgrade with its Coin and Forge Stone cost, and the 5 Forge Stone counts (see 7.3). The Gear plates show the icons of the Active Gear look, a Cosmetic (see 10). |
| Packs | The Peddler, Merchant and Royal Packs, each with a Race Pack and a Class Pack version. The Drop Rates, the Pack Guarantees, Open ×10 and the open animation (Economy 3.1) |
| Achievements | List, progress, rewards |
| Bazaar | Cosmetics and Conveniences, prices in Heynstones, the Heynstone balance |
| Settings | A modal dialog in the center of the screen, not a separate screen (see 11.4). Audio, language, speed, reduced motion, save export and import |
| **Handbook** | A modal dialog over the current screen, not a separate screen (see 11.4). It tells how the game works: 8 Chapters of Entries for the rules, the terms and the icons that the Player meets, with a search that also knows the words of other games ("mana" finds Countdown). An Entry exists only for a feature that is in the game, and all Entries can be read from the start. It does not list cards: the Deck builder does. It opens from the Town Bar, from the Top Bar of the Battle and the H key, from a rules term in a Details Panel that has focus, and from "Read more" on a Hint (see 8.3). |

### 11.2 Battle screen layout (landscape)

```text
┌──────────────────────────────────────────────────────────────┐
│ [Turn 7]                         [Leave] [×1/×2] [Skip] [⚙]  │
│                                                              │
│ [Player Hero]   ======== Lanes on a 3D Board ========  [Enemy │
│  HP 34/40       ===================================     Hero] │
│                 ===================================   HP 22/45│
│                                                              │
│ [Deck 12]  [Card 0] [Card 0] [Card 2] [Card 3] [Card 5] [End  │
│ [Grave 3]                                                Turn]│
└──────────────────────────────────────────────────────────────┘
```

- The Hand is at the bottom. Each card shows its Countdown in a large number. Ready cards glow.
- The player can drag a Ready card to a Square, or tap the card and then tap the Square.
- Hover (desktop) or long press (touch) shows the full card details.
- The Board shows Unit Attack and HP above each Unit at all times.
- The enemy Hand shows the number of cards and the Countdown of each card, but not the card faces.
- The Top Bar has a Handbook button next to the Controls Guide button, and the H key does the same. In the Battle, the Handbook is one page at one side of the Board, so that most of the Board stays in view. The Battle does not pause. The Controls Guide lists H.
- **Leave** is the first Battle control, at the left of the Speed toggle and apart from it by one gap: a small ghost button with a door and an exit arrow. Before a result, it opens the Abandon confirm (11.4). After a result, it leaves at once. Esc does the same, and the Controls Guide lists Esc.
- A Settings button is at the left of End Turn, above the Hand. It opens the same Settings dialog as the Town Bar (11.4), with the same options, but with no progress export and import. The Battle does not pause. The Top Bar has no separate sound button.
- In the keyboard Inspect mode (the I key), Tab goes into the Card Details of the Unit. There, the names of the Keywords, Statuses and Damage Types are links to their Handbook Entries. Card Details that show only on hover or long press have no links.
- When the enemy Side has more than one Hero, each enemy Hero shows at the end of its Front, with its own HP and Hand. A Defeated Hero shows as Defeated, and the Board shows its Front go to the next Hero.
  - The Top Bar shows one plate for each Boss, in Lane order. Each plate has a Lane strip with one cell for each Lane, full for the Lanes of its Front, the HP bar with a notch at each Boss Rule threshold, and the Countdowns of the Hand of that Boss. A Defeated Boss keeps its plate, with a Defeated seal.
  - On the Board, each Boss stands at the middle of its Front, on a Front Bracket on the ground across its Lanes ([web ADR-0010](../../apps/web/docs/adr/0010-a-boss-front-is-a-code-drawn-bracket-on-the-ground.md)).
  - A Skill Card that targets an enemy Hero targets one Boss that is not Defeated: its marker goes across the Lanes of that Boss's Front, and a press on its plate also plays the card.
  - A Defeat, a Front move and a Boss Rule each have a short animation, and Skip jumps over it. The Battle Log lists them.
- **Battle Log** (4.12): The Top Bar has a Battle Log button, and the L key does the same. The Controls Guide lists L. It opens at any time in a Solo Battle, also in the enemy Turn, and from the result screen after the Battle ends. While it is open, the Live playback pauses. "Back to Live" (Esc) continues from the same point.
  - A panel at the right side lists the **Log Entries** under one header for each Turn of a Side. The header shows the Turn number, the Side and the HP of each Hero at the end of that Turn. On a narrow screen, the panel is a sheet over the bottom of the Board, with a "Show Board" toggle.
  - A Log Entry is one card play, one Unit Action or one Phase effect, with all its results. Its text names the Hero, the card, the Units, the Squares, the damage (Damage Type, Crit, Block, Ward) and each Keyword and Status that occurred. A card name opens the Card Details. A Keyword or Status name opens its Handbook Entry.
  - When the player selects a Log Entry, the Board, the Hand Bar and the Heroes show the Battle at the end of that entry at once. "Play" animates the next entries at the current Speed. ←/→ go back or forward one Log Entry, and Shift+←/→ go back or forward one Turn.
  - The Board is desaturated and a banner shows the Turn and the Side, so that the player does not mistake it for Live. All Live input is off. Skip is off. Leave and the Speed toggle still work. Card Details show the values of the Unit at that moment.
  - The Battle Log never shows a moment after Live.

### 11.3 Accessibility

- Rank uses color and pips.
- Damage Types use color and an icon.
- Options: reduced motion and speed.
- The player can play a full Battle with the keyboard only.

### 11.4 Town

The Town is the first screen of the game. It is a 2D painting ([web ADR-0004](../../apps/web/docs/adr/0004-the-town-is-a-layered-2d-painting.md)). The art brief and the image prompts are in [11 — Town Concepts](./11-town-concepts.md). Each screen of 11.1 except the Town, Settings and the Handbook has a Building:

| Screen | Building |
| --- | --- |
| Campaign | **Town Gate**: a large gate with a road that goes out of the Town to the Regions |
| Heynspire | **Heynspire tower**: a white castle with a tall tower on the hill at the back |
| Dungeons | A cave or ruin at the edge of the Town |
| Workshop | A workshop with a chimney and smoke |
| Bazaar | The **Market**: an open market square with colored tents around a fountain |
| Packs | A small card shop |
| No screen | **Library**: a stone library building. It is only decoration. |
| Hero | A barracks with a training yard |
| Achievements | A hall of banners |
| Seaport | The **Seaport quay**: the harbour by the sea at the right edge, with the long piers, the moored ships and the towers with blue roofs |

- All Buildings are in the painting from v1. A Building with no screen yet is only decoration: no label, no hover, and the Player cannot select it. The Town Gate (Campaign), the Card shop (Packs), the Workshop, the Market (Bazaar), the Barracks (Hero), the Dungeons cave, the Heynspire tower, the Hall of banners (Achievements) and the Seaport quay can be selected. The Market and the Hall of banners have no lock: the Bazaar and the Achievements screen open at any Player level. The Card shop opens at Player level 2, the Workshop at level 3, the Barracks at level 5 and the Dungeons cave at level 10 (see 7.1). The Seaport quay opens the Seaport screen at Player level 8. The Heynspire tower opens with the first win of Stage 5-10, not at a level (8.2): until then, its Lock Plate shows "5-10" and a crown, and its tooltip says "Win Marrow Castle (5-10) to open".
- The painting fills the screen and crops its edges. The label of each selectable Building, and the part of the Building under its label, stay in a center safe area that every landscape aspect shows. The Workshop is wider than its label: a 4:3 screen crops its right part. Decoration Buildings can be near the edges. The Barracks, the Dungeons cave and the Seaport quay are the three exceptions. The Barracks label is over its left wing, so a 4:3 screen crops it, and the Hero shortcut opens the Hero screen on all screens. The Dungeons cave is at the right edge, so a narrow screen crops it and its label. The Dungeons shortcut opens the Dungeons screen on all screens, and the Dungeons Hint points at the shortcut when the screen crops the cave. The Seaport quay is at the right edge, under the Balance Plate corner, so a narrow screen crops it, and the Seaport shortcut opens the Seaport screen on all screens.
- Small ambient motion: clouds, chimney smoke, flags and water. The Town Gate has a soft pulse of light until the end of the Tutorial (the first win of Stage 1-1). Before the Profile exists, the pulse always shows. A selection zooms a little toward the Building and fades to its screen. With reduced motion, all motion stops and the change is a plain fade.
- The **Town Bar** is at the bottom of the Town and of each screen except the Battle. It has one shortcut for each screen of the table above, and a Town shortcut at its left end. The Deck shortcut opens the Deck builder dialog in the center of the screen, over the current screen. The current screen stays behind it, dim. A change applies at once, so the dialog has no Save button. Esc, the close button and a click outside the dialog close it. The Deck builder is a dialog and has no Building. A shortcut to a screen that does not exist yet is disabled, with a lock and the tooltip "Opens later". A disabled shortcut can get keyboard focus, a screen reader reads its name and "opens later", and focus, hover and long press show the tooltip. A shortcut to a screen that the Player level has not unlocked yet (see 7.1) has the same lock, with the tooltip "Opens at level N", and a screen reader reads its name and "opens at level N". On the Town painting, the Building of that screen cannot be selected, and a small lock plate with the same tooltip replaces its name label. When the Player gets the level, the level Hint shows (see 8.3) and the lock goes away. On desktop, each shortcut has an icon and a label. On a phone, it has an icon only, and long press shows its name. The Handbook shortcut is the last shortcut, between the Bazaar shortcut and the Settings button. The Town, the Handbook and Settings have no Building. Like the Deck shortcut, the Handbook shortcut opens a dialog over the current screen, so it has no current state and no lock, and its icon stays lifted while the dialog is open. The Settings button is at its right end, apart from the shortcuts. It opens the Settings dialog in the center of the screen, over the current screen. The current screen stays behind it, dim. The Settings dialog has the options of 11.1. A change applies at once. Esc, the close button and a click outside the dialog close it, and the Player stays on the same screen. The Town Bar has no separate language and sound buttons.
- The game is one route ([web ADR-0005](../../apps/web/docs/adr/0005-the-game-is-one-route.md)). The Town shortcut goes back to the Town, and Esc does the same, but not while a dialog is open: then Esc is for the dialog. The Battle result shows the Coin of the result (Economy 2.1) and has "Play Again" and "Back to Campaign". The result of a Dungeon Battle has no Stars, shows the rewards of Economy 2.4, and has "Back to Dungeons" in place of "Back to Campaign". It also shows the XP of the result on a bar, "Level up! Level N" when the Player gets a level, and the card that the Player won, with a "New" ribbon if it is not Discovered. It does not tell the unlocks of the new level: the level Hint tells them in the Town (see 8.3). The rewards go into the Profile when the result shows, so that a page load on the result does not lose them. A Battle that is not finished when the page loads again gives no result: no loss, no rewards, and it is not an Abandon. To leave a Battle is an Abandon, with a confirm dialog. Esc opens the confirm when there is nothing else to cancel: it first cancels a card selection, stops the keyboard Inspect mode or goes Back to Live in the Battle Log. The browser Back button leaves the game. A reload opens the Town.

### 11.5 Campaign

The Campaign screen shows one **Region Map** at a time: a flat 2D painting of one Region, with a **Trail** from the first Stage to the Boss Stage ([web ADR-0007](../../apps/web/docs/adr/0007-the-region-map-is-a-16-9-painting-with-code-drawn-stage-markers.md)). The art brief and the positions are in [12 — Region Concepts](./12-region-concepts.md).

- **Which Region opens.** From the Town Gate, the newest unlocked Region. From "Back to Campaign" after a Battle, the Region of that Battle.
- **Top band.** The Region name, with a back arrow and a next arrow at its two sides. The arrows go to the other Regions. The Player can also open a locked Region. All its Stage Markers are then Locked, and a line under the name says which Boss Stage unlocks it. There is no arrow before Region 1 or after Region 5.
- **Stage Markers.** The game draws one Stage Marker on each stop of the Trail. Each Stage Marker is a shield, with a small plate under it that shows the Stage ID (for example "1-3").

  | State | Look | Select |
  | --- | --- | --- |
  | Done | A shield with a check mark. The plate also shows the best Stars (1 to 3). | Opens the Stage Panel. The Player can play the Stage again. |
  | Open | A gold shield with a soft pulse of light. This is the next Stage to win. | Opens the Stage Panel. |
  | Locked | A grey shield with a lock. | Does not open the Stage Panel. The Stage Marker can get keyboard focus. Focus, hover and a tap or long press show a tooltip with the Stage that the Player must win first. A screen reader reads the Stage ID and "locked". |

  The Stage Marker of a Boss Stage is larger and has a crown. It also has one of the 3 states.
- **Progress line.** The game draws a dashed line on the painted road: solid from the start to the last Done Stage, faint after it.
- **Star chests.** A panel in the top-right corner shows the Stars of the Region (for example "14 / 30") on a track, and the 3 chests at 10, 20 and 30 Stars on it (see 8.1). A chest that the Player has the Stars for glows, and a tap claims it: a small panel shows its rewards. A claimed chest stays open. The tooltip of a closed chest says how many Stars it still needs.
- **Stage Panel.** A modal dialog in the center of the screen. The map is dim behind it. It shows the Stage ID, the enemy Hero, the first-win reward or the repeat-win reward, the best Stars, the 3 Star conditions with the Star Turn of the Stage (see 4.11), the Deck and a **Fight** button. The Deck is a choice of the Deck slots that have cards, with the active Deck selected: the last Deck that the Player used. "Edit Decks" opens the Deck builder. A Deck that is not valid cannot start a Battle, and the panel shows the first reason. Fight takes the focus when the panel opens. Esc, a close button and a click outside close the panel.
- **Keyboard.** Focus moves through the Stage Markers in the order of the Trail. Esc closes the Stage Panel. When no panel is open, Esc goes back to the Town (see 11.4).
- **Motion.** The Stage Markers rise onto their clearings in Trail order, and the solid part of the progress line draws in from the Trail entry. The Open Stage Marker pulses. After a win opens a Stage, its marker wakes up once. With reduced motion, all of this stops.
- Story Scenes (MOD-07) are a v2 feature. A [trial is designed](./region-story-scenes.md) for Hearthvale, the Red Mesas, the Glowcap Hollows and the Thornwood, with fframes motion clips and Player-controlled text. Stage names are not part of this screen now.

## 12. Content for v1

| Content | Count |
| --- | --- |
| Creature Cards | 96 (16 for each of the 6 Races, including 1 Specialist) |
| Skill Cards | 40 (10 for each Class: 4 Common, 3 Uncommon, 2 Rare and 1 Epic) |
| Total collectible cards | 136 |
| Tokens | About 8; the Creature Card draft defines 2 |
| Campaign Stages | 50 (5 Regions, with 5 Boss Stages) |
| Heynspire Floors | 50 |
| Dungeons | 3 (with 4 new Bosses, and 3 of the 5 Campaign Bosses again in Dungeon 3) |
| Achievements | About 40 |
| Cosmetics | About 30 (8 earn-only, the rest in the Bazaar) |

Each Race has this exact Creature Card Base Rank mix:

| Base Rank | Cards in each Race | Creature Cards |
| --- | ---: | ---: |
| Common | 5 | 30 |
| Uncommon | 5 | 30 |
| Rare | 3 | 18 |
| Epic | 2 | 12 |
| Legendary | 1 | 6 |

Skill Cards use a separate Base Rank mix. In v1, only a Specialist has Base Rank Legendary, and no Skill Card has it. A Legendary copy comes from Combine or from a Pack.

A Race shows its identity through its Main Keywords and its Race Keyword (3.2), not through a profile of card types ([ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md)).

Each Race has 12 Physical Creature Cards and 4 Creature Cards with its secondary Damage Type: Holy for Human and Elf, Frost for Undead and Feral, and Fire for Orc and Goblin. Feral has no card with Countdown 1. Each Race has one Uncommon melee Pivot Card. Its two Epic Cards are one named champion with Unique and one archetypal powerhouse. Its 1 Legendary Card is a Specialist: a named champion with Unique, one Class and 2 or 3 Main Keywords of the set ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md), [ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md), [ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)).

## 13. Balance process

1. Each Creature Card gets **power points** from its stats and Keywords. Each Skill Card gets them from its effect (step 3).
   - Start formula: `power = Attack × 2 + HP + Keyword points`. The Base Speed 2 and the Base Range 1 are free. Only the Speed and Range Keywords cost points (5.6, [ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md)).
   - Attack, HP and the Keyword values count at the Base Rank of the Card. The card data gives the Common Attack and HP. Use them with the Rank scale of the Base Rank (5.3). For example, an Epic card with Common Attack 4 counts Attack 7 ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)).
   - Add Damage Type points: Fire = 3, Frost = 3, Lightning = 3 and Holy = 1 ([ADR-0030](../adr/0030-armor-reduces-only-physical-damage.md)). The Lightning value is provisional ([ADR-0028](../adr/0028-lightning-damage-gives-paralyzed.md)): Paralyzed stops the attack, Retaliate and First Strike, the same as Freeze, and Movement alone has little value.
   - Start Keyword points: Bleed N = N × 1, Bolt N = N × 3, Bulwark N = N × 3, Charge N = N × 1, Dispel = 3, Entangle = 2, Extreme-range = 3, First Strike = 4, Fleet = 4, Flying = 4, Heal N = N × 2, Heavy = −2, Heroic N = N × 2, Hero's Bane = 4, Hobble N = N × 1, Iron Guard = 6, Knockback N = N × 3, Long-range = 2, Mid-range = 1, Piercing = 3, Pivot = 3, Poison = 3, Quick Study = 3, Rally N = N × 3, Rebirth = 5, Regenerate N = N × 2, Resistance N = N × 2, Retaliate = 4, Sabotage N = N × 4, Soul Harvest = 5, Spawnbane N = N × 2, Swarm N = N × 1, Swift = 2, Trample = 3, Vampirism = 6 and Wallbreaker = 2.
   - Summon and a Last Breath that summons use 50% of the Token's power at the Base Rank of the Card. A Last Breath that deals N damage uses N points. Unique, the Specialist Class lock and Wall use 0 points.
   - These points are provisional until the simulation has enough Cards that use each Keyword.
   - A Unit summoned into Column 3 of the Summon Zone gets a 2-Square start. Check the Keyword points of **Charge** against this start.
   - **Charge N** uses N × 1 points, not 2 points for each Square as Swift and Fleet do. Swift and Fleet apply in each Turn, but Charge applies only in the Turn of the summon, and the Column 3 start makes it less valuable. Thus each additional Square costs 1 point.
   - Charge N increases with the Rank, but the Speed Keywords do not. The budget counts only N at the Base Rank, so a Charge card at a higher Rank has more power than its budget shows. We accept this: the additional Speed applies only in 1 Turn, and N is never more than 3. A Legendary Unit with Fleet (Speed 4) and Charge 3, summoned into Column 3, goes to Column 10 in that Turn.
2. Each Countdown has a power budget for the Base Rank: `budget = 19 + s × (Countdown − 3)`, with the slope `s = 3` ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md)). The base is 2 lower than before, because the Base Speed is free ([ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md)). Thus a Countdown 2 card has 16 points and a Countdown 6 card 28 (1.75 ×). The slope is the steepest one that passes the Matchup criteria of the ADR, and it must stay at 1.33 or more (`budget(6) ≥ 1.3 × budget(2)`). With the old base 21, this floor was 1.47. This budget is correct only with the Countdown Limit of the same ADR. Without it, a Deck of long-Countdown cards wins against a Deck of short-Countdown cards of the same Race ([08 — Archetypes, section 3.2](./08-archetypes.md#32-countdown-slope-search)).
3. A card must be within ±10% of its budget. A card outside this range needs a written reason (for example "weak stats, strong combo").
   - A **Specialist** has more Power Points than the 2 Epic cards of its Race. The Power Points of a card count at its Base Rank (5.3), so a Specialist at Legendary is compared with an Epic card at Epic. A Player must prefer the Specialist to a maxed Epic card of the same Race ([ADR-0054](../adr/0054-each-specialist-has-a-second-keyword.md)).
   - **Skill Cards use the same Power Points and the same Power Budget** ([ADR-0031](../adr/0031-a-skill-card-uses-the-power-budget-of-a-creature-card.md)). Each effect kind has a rate: the Power Points for each point of its main amount at the Base Rank. Each extra part (push, Entangle, Bleed, area length, Field Effect size and turns, bonus Range) adds flat points. The Damage Type has its own Skill values, not the Creature values. A card with more than one effect adds the points of each effect. The points are multiplied by the Recall multiplier `1 + w × Recall` at the Base Rank. Crit does not count. `skillPower` in `packages/rules/src/content/balance.ts` has the rates.
   - The rates come from a fit of the swap rule on all 40 Skill Cards (`packages/rules/scripts/fit-skill-budget.ts`, [08 — Archetypes, 3.4](./08-archetypes.md#34-power-budget-of-skill-cards)).
   - A Skill Card does not use the ±10% band. It passes when no other whole-number value of its main amount comes nearer to its budget (the nearest step), and it must stay within ±25%. A card outside this rule needs a written reason, the same as a Creature Card.
   - The swap rule (±5 points, 1000 seeds) stays the true check. If the content test and the sim do not agree, the sim wins. When a card fails the sim: first check the Hold Rule, and fix the AI if it wastes the card. Then change the rate of an effect kind if many cards of that kind fail in the same direction. Change the values of one card only if it is the only one.
4. Run headless simulations with the rules package: thousands of AI-against-AI Battles for each **Archetype** (a reference Deck for one style of play). Use `bun run sim matchup` in `packages/rules`. The Archetypes and the results are in [08 — Archetypes](./08-archetypes.md).
5. Check each Archetype's win rate in each **Matchup**. The target is 45% to 55% against the other Archetypes.
6. Check Stage difficulty with `bun run sim stage`, Dungeon difficulty with `bun run sim dungeon`, and Heynspire Floor difficulty with `bun run sim floor`. The results are in [14 — Campaign Stages](./14-campaign-stages.md). The target win rate for a new player Deck on the first try is 60% to 80% for normal Stages and normal Floors, and 30% to 50% for Boss Stages, Boss Floors and Dungeons. The first Stages of Region 1 make a ramp: Stage 1-1 (the Tutorial) ≥ 95%, Stage 1-2 ≥ 85%, Stage 1-3 ≥ 75%. Each Stage and each Floor must hit its target with no Gear and with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md), [ADR-0040](../adr/0040-heynspire-floors-come-from-templates-and-a-strength-curve.md)). A Boss Stage, a Boss Floor and a Dungeon have a window for each Gear row: 25% to 50% with no Gear, and 30% to 55% with the Expected Gear (ADR-0033). The economy simulation still uses the middle of 30% to 50% as the base win chance of a Boss. For a Dungeon, use a Deck that is typical at its unlock level.
7. Check the 3-Star share of each Stage with `bun run sim stage`: the share of the AI pilot's wins that give 3 Stars (4.11), with the setup of step 6. The target is 30% to 50% of the wins for normal Stages, and 20% to 40% for Boss Stages. The ramp Stages 1-1 to 1-3 have only a lower limit: 30% or more. Each Stage must hit its target with no Gear and with the Expected Gear, with one Star Turn. The 3-Star share of a row counts the wins of both starter Decks. `sim stage` shows a suggested Star Turn for each Stage: the whole Turn number that puts the share nearest to the middle of the target (40% for normal Stages, 30% for Boss Stages). When a change makes the Battles of a Stage longer or shorter, change its Star Turn too. A human can win faster than the AI pilot, so the target is a lower limit for a human ([ADR-0045](../adr/0045-each-stage-has-its-own-star-turn.md)).

## 14. Items for later versions

These items are not in v1. The [Roadmap](./09-roadmap.md) shows when they can come.

- Asynchronous PvP against defense Decks, leaderboards, seasons
- Guilds, guild bosses, co-op Battles with 4 Lanes
- More Races, a sixth Rank
- More Keywords and Damage Types. Poison is already in v1.
- Weekly Heynspire reset and events
- Heynstones for real money in the Bazaar
- Trading between players (needs a separate design review for fairness and fraud)
