# 03 — Game Design Document (GDD)

This document gives the full rules of Heynbord v1. It uses the terms in [`packages/rules/CONTEXT.md`](../../packages/rules/CONTEXT.md). All numbers are start values for tests and tuning. The [Economy](./07-economy.md) document gives the currency numbers.

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
 │     Open Packs · Combine · Extract · Craft · upgrade Gear
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

The player is a new Hero. The player travels through three Regions, wins the respect of each people, and finds out who wants to break the Accord.

### 3.2 Races

| Race | Concept | Battle identity | Main Keywords |
| --- | --- | --- | --- |
| **Human** | Humans and stout folk of the river towns. Proud and stubborn. They love banners and long speeches. | Hold the line. Strong armor, Walls and support for allies. | **Knockback**, Armor, Rally, Retaliate, Wall |
| **Elf** | Elves of the old forests, and the plant spirits that fight with them. Patient and old. | Control from range. Ranged Units, healing, and poison. | **Entangle**, Regenerate, Poison, Flying |
| **Undead** | Old spirits that wear bones and armor. They do not like to stay dead. | Many cheap Units that grow stronger together, come back, and bring more. | **Rebirth**, Swarm, Summon, Frost damage |
| **Orc** | Orc tribes of the badlands, and the beasts that fight with them. Fast, loud and always hungry. | Rush the enemy Hero. High attack, low HP. They still hit the Unit that kills them. | **Heroic**, Charge, Fire damage, Last Breath |
| **Goblin** | Goblins of the hill mines. Tinkers, thieves and bomb makers. Small, clever and greedy. | Make the enemy plan slower. Cheap, fragile Units that delay enemy cards, set traps and explode. | **Sabotage**, Hobble, Last Breath, Fire damage |
| **Feral** | Wild creatures of the peaks and the deep caves. They serve no people. Under the Accord, a wild creature that comes onto a marked lane field fights for the Hero who called it, for that one Battle. | Few, huge and slow. High Countdown, high Attack and HP. They run through the enemy front, heal and bring the cold. | **Trample**, Regenerate, Flying, Frost damage |

The **Pivot** Keyword (see 5.4) is not part of the identity of one Race. In v1, each Race has 1 Creature Card with Pivot, with Base Rank Uncommon.

A Main Keyword is the signature of that Race. The Race that gives a signature up changes its cards. Other Races may still use the Keyword. The first Main Keyword in bold is the **Race Keyword**: only a Unit of that Race can have it, from a Card, a Token or any other effect. A Skill Card of any Class can still give its effect, for example Entangled ([ADR-0026](../adr/0026-each-race-has-one-race-keyword.md)). Poison is in v1 ([ADR-0015](../adr/0015-poison-is-elf-summon-is-undead-and-last-breath-is-orc.md)). Hobble is a Goblin Main Keyword, and one Human card borrows it. Sabotage is the Goblin signature, and Trample is the Feral signature ([ADR-0017](../adr/0017-sabotage-and-hobble-are-goblin-and-trample-is-feral.md)). Knockback is in v1 ([ADR-0016](../adr/0016-knockback-is-a-human-melee-keyword.md)). Shieldbearer has Knockback. Bleed is a Feral Keyword on the Frostfang Lynx and Old Frostmaw only. It is not a Main Keyword ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). Entangle is the Elf Race Keyword, but only a Ranged Unit with Base Rank Epic or higher has it ([ADR-0022](../adr/0022-no-range-above-3-and-entangle-only-on-epic-ranged-units.md)). Thus it is on 2 Elf cards only: Canopy Vinewarden and Lethiel, First Gardener.

### 3.3 Regions (draft names)

| No. | Region | Main enemies | Lanes | Boss (draft) |
| --- | --- | --- | --- | --- |
| 1 | **Hearthvale** | Human outlaws and the Orc sellswords that the Baron pays | 3 | **Baron Brassbelly**, a bandit lord with a very large hat |
| 2 | **The Thornwood** | Elves and the Feral creatures of the deep forest | 3 | **The Old Bramble**, a forest giant that wakes up angry |
| 3 | **The Hollow Marches** | Undead and the Goblins that dig under the marsh hills | 3 | **Queen Marrow**, ruler of the Undead |

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
   1. Start-of-turn effects resolve (for example Regenerate and Rally).
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
   1. Burn damage hits burning Units of the active side. Poison damage then hits Poisoned Units of the active side: 1 damage per stack, then the Unit loses 1 stack.
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
8. A Hobbled Unit has a maximum Speed of 1 during its action, after all bonuses. The count does not go down when the Unit acts. It goes down in the End Phase of its owner.
9. A Bleeding Unit gets half of each heal, rounded down. For example, Regenerate 1 heals 0 and Regenerate 2 heals 1. The count goes down in the End Phase of its owner, not when the Unit acts.

### 4.5 Movement

- Each Unit has a **Speed**. Speed is the maximum number of Squares that the Unit moves forward in one Turn.
- A ground Unit moves through friendly Units, also a friendly Wall. Each friendly Square uses 1 Square of Speed. It stops before an enemy Unit. It stops in the farthest empty Square that its Speed reaches. See [ADR-0018](../adr/0018-a-unit-moves-through-friendly-units.md).
- A **Flying** Unit moves over other Units. It stops in the farthest empty Square that its Speed reaches. It can fly past an enemy Unit directly in front of it, also when it then has no target.
- A Unit never moves past its last Column (Column 12 for the player).
- A Unit with **Wall** never moves, also when an effect gives it Speed or Charge (see 5.4).
- A **Ranged** Unit does not move if an enemy target is in its Range at the start of its action (see 4.6).
- A **Pivot** Unit does not move if an enemy Unit is directly behind it or next to it at the start of its action (see 4.6).
- A Unit with Speed 0 never moves.
- An Entangled Unit has Speed 0 during its next action.
- A Hobbled Unit moves at most 1 Square. The limit applies after all bonuses.
- A **Pushed** Unit changes Square toward its own Hero. A push is not Movement. It does not use Speed. Frozen, Entangled, Hobbled and Flying do not stop it. Knockback (4.7) and the Skill Card *Warning Shot* (5.5) push a Unit. They use the same push rules.

### 4.6 Attack

- **Melee Unit:** It attacks the enemy Unit in the next Square in front of it. If the Unit is in its last Column and no enemy Unit is in front of it, it attacks the enemy Hero.
- "The enemy Hero" of a Unit is always the Hero of the enemy Front that holds the Unit's Lane.
- **Pivot Unit:** A melee Unit with Pivot can also attack the enemy Unit in the Square directly behind it, or in the same Column of a next Lane ("next to it"). It still attacks one time. It selects the first target in this order:
  1. The enemy Unit directly behind it.
  2. An enemy Unit next to it. The lower Lane number comes first.
  3. The enemy Unit directly in front of it.
  4. The enemy Hero, if the Unit is in its last Column.
- A Pivot attack is a melee attack. Retaliate and First Strike apply to it.
- **Ranged Unit:** It has a **Range** (number of Squares). It attacks the nearest enemy Unit in front of it, in the same Lane and in its Range. If no enemy Unit is in Range, and the enemy Hero is in Range, it attacks the enemy Hero. The enemy Hero is 1 Square past the last Column.
- A Unit with **Base Attack** 0 does not attack. Base Attack is the Attack of the Unit for its Rank, without bonuses. Bonuses such as Rally do not change this.
- A Unit with **Wall** does not attack, also when an effect gives it Attack (see 5.4).
- A Unit attacks one time in each Turn, unless a Keyword says something different.

### 4.7 Damage

Each attack and each damage effect has a **Damage Type**.

| Damage Type | Effect |
| --- | --- |
| **Physical** | Normal damage. Melee or Ranged. |
| **Fire** | Normal damage. The target also gets **Burn**: 1 damage in each End Phase of its owner, for the next 2 End Phases. A new Burn replaces the old Burn. |
| **Frost** | Normal damage. The target also gets **Freeze**: it skips its next action. No Ranged Unit has Frost damage, at any Rank ([ADR-0025](../adr/0025-no-ranged-unit-has-frost-damage.md)). |
| **Holy** | Armor does not reduce Holy damage. |

Burn, Freeze, Entangled, Poisoned, Hobbled and Bleeding are **Statuses**. Fire and Frost damage give Burn and Freeze. The Entangle Keyword gives Entangled after attack damage. The Poison Keyword gives Poisoned after attack damage above 0. The Hobble Keyword gives Hobbled after attack damage above 0. The Bleed Keyword gives Bleeding after attack damage above 0. Fire or Frost gives its Status also when the hit does 0 damage. Entangle, Poison, Hobble and Bleed need damage above 0. Bleeding does no damage. Burn damage and Poison damage ignore Armor, Crit and Block. Burn damage does not give a new Burn. Poison damage has no Damage Type, and it does not give Burn or Poison.

To calculate damage, do these steps in this order:

1. Start with the Attack value of the attacker (or the value of the effect).
2. Add bonuses (for example Heroic or Rally).
3. Subtract the Armor of the target, if the Damage Type is not Holy.
4. Roll **Crit** for the attacker's Hero. A Crit multiplies the damage by 2.
5. Roll **Block** for the target's Hero. A Block divides the damage by 2. Round up.
6. The minimum damage is 0.

- The Gear of each Hero gives the Crit and Block chances (see 7.3). A Unit uses the Gear of the Hero that summoned it.
- Heroes cannot Block.
- All rolls use the Battle seed, so a replay gives the same result.
- **Retaliate:** When a Unit with Retaliate survives a melee attack, it deals damage equal to its Attack to the attacker. Retaliate does not use Crit, and it does not start another Retaliate. A Unit with Base Attack 0 does not retaliate.
  - It uses the Damage Type of the Unit with Retaliate, so it can give a Status.
  - The Armor of the attacker reduces it, and the attacker's Hero can Block it.
  - It occurs also when the attack did 0 damage.
  - It does not occur against a Ranged attack, or when the Unit is Frozen (see 4.4).
- **First Strike:** When an enemy melee Unit attacks a Unit with First Strike, the Unit with First Strike deals its damage first. If the attacker dies, its attack does not occur.
  - It uses the Damage Type of the Unit with First Strike. It does not use Crit. The Armor of the attacker reduces it, and the attacker's Hero can Block it.
  - It does not occur against a Ranged attack, or when the Unit with First Strike is Frozen (see 4.4). A Unit with Base Attack 0 does not use it.
  - Damage above 0 applies Poison, Hobble, Bleed and Entangle, but not Knockback. An attacker that First Strike Entangles has Speed 0 in its next action, not in the action that it does now.
- **Entangle:** After a Unit with Entangle deals attack damage above 0 to an enemy Unit, that enemy becomes Entangled. A new Entangle does not stack or extend the Status. Retaliate does not apply Entangle.
- **Hobble N:** After a Unit with Hobble deals attack damage above 0 to an enemy Unit, that Unit becomes Hobbled with a count of N. A Hobbled Unit has a maximum Speed of 1, after all bonuses. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Hobble keeps the higher count. It does not add to the old count. Retaliate does not apply Hobble. An attack on a Hero does not apply Hobble.
- **Bleed N:** After a Unit with Bleed deals attack damage above 0 to an enemy Unit, that Unit becomes Bleeding with a count of N. A Bleeding Unit gets half of each heal, rounded down: Regenerate, a Skill Card heal and each other heal. Bleeding does no damage. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Bleed keeps the higher count. It does not add to the old count. Retaliate does not apply Bleed. First Strike damage above 0 applies Bleed. An attack on a Hero does not apply Bleed. N is 1 up to Rare, 2 at Epic and 3 at Legendary.
- **Knockback N:** After a melee Unit with Knockback deals attack damage above 0 to an enemy Unit, that Unit is Pushed N Squares toward its own Hero, in its own Lane. A push is not Movement and not a Status. The push stops before the first Square that holds any Unit, and at the pushed Unit's Column 1. A Unit with Wall is never Pushed. The push ignores Speed, Charge, Frozen, Entangled, Hobbled and Flying. The pushed Unit keeps its Statuses. Retaliate and First Strike do not apply Knockback. An attack on a Hero does not apply Knockback. A Unit that dies from the hit is not Pushed. If the Unit does not change Square, there is no push.
- **Trample:** When a melee Unit with Trample kills an enemy Unit with attack damage, the damage that is left goes to the enemy Unit in the next Square behind the killed Unit, in the same Lane. The damage that is left is the final damage of the hit (after Armor, Crit and Block) minus the HP that the killed Unit had. If that Square is empty, the damage is lost. It never hits a Hero. The second hit has the Damage Type of the Trample Unit, so Fire and Frost still give their Status. The Armor of the second Unit reduces it, and its Hero can Block it. It does not roll Crit. The second hit is not an attack: the second Unit does not Retaliate, and Poison, Hobble, Bleed and Knockback do not apply. It does not Trample again. The Last Breath of the killed Unit still occurs by the normal rules.

### 4.8 Skill Cards and Recall

- A Skill Card has a **Target**. The Target can be a Unit, a Lane, a Square area, a Hero, the Hand, or all Units. A Hero target is an enemy Hero that is not Defeated. A Hero has no Armor and cannot Block (4.7), so Skill damage to a Hero has no Block roll. It can Crit.
- A Skill Card damage hit that kills a Unit, also when the Unit comes back with Rebirth, applies no other part of the effect to that Unit: no Status and no push.
- After the effect, roll **Recall**. When the effect ends the Battle, no Recall roll occurs. If the roll succeeds, the card goes back to the Hand with its full Countdown. If the roll fails, the card goes to the **Graveyard**.
- A **Field Effect** is a Skill Card effect that stays on a Square area for a number of Turns. For example, *Wildfire* (draft) puts fire on 2 × 2 Squares for 2 Turns.

### 4.9 Death

- When a Unit from a Creature Card has 0 HP, it leaves the Board and goes to its owner's Graveyard. A Token disappears instead.
- Last Breath effects resolve when the Unit leaves the Board. A v1 Last Breath either deals N damage to the nearest enemy Unit ahead in the same Lane, or summons Token X in the Square that the Unit left.
- **Rebirth:** The first time a Unit with Rebirth dies, it comes back in the same Square with 1 HP and without Rebirth. Its Statuses, its bonus Armor and its Rally bonus end.
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
| ★★★ | Win with 50% or more of your Hero HP, before Turn number 15. |

The game shows the best Star result for each Stage. The word "star" is only for Stages. Ranks use gems (see 5.3).

### 4.12 Speed controls and Auto-play

- **Speed ×1 / ×2:** The player can change the animation speed at any time.
- **Skip:** The player can skip the animations of the current Resolution Phase. The result is the same.
- **Auto-play:** The AI plays the player's cards. Auto-play is available on Stages and Dungeons that the player has already won. The player can set a number of repeats (1 to 10). Repeats stop at the first loss.
- Speed, Skip and Auto-play never change the result, because the rules are deterministic.

## 5. Cards

### 5.1 Card types

| Type | Description |
| --- | --- |
| **Creature Card** | A card that summons a Unit onto the Board. It has a Race. |
| **Skill Card** | A card with a one-time effect. It has a Class. Only a Hero of the same Class can use it. |

A **Unit** is the thing on the Board. A Creature Card is the thing in the Hand or in the Deck. Do not mix the two words.

### 5.2 Card fields

**Creature Card**

| Field | Description | Typical values |
| --- | --- | --- |
| Name | Unique name of the card | — |
| Race | Human, Elf, Undead, Orc, Goblin or Feral | — |
| Rank | Common to Legendary | — |
| Countdown | Turns until Ready | 1 to 6 |
| Attack | Damage of one attack | 0 to 12 |
| HP | Health | 1 to 30 |
| Speed | Squares per Turn | 0 to 4 |
| Attack type | Melee, or Ranged with Range | Range 2 or 3. Range 2 only for a Support, and Range 3 for a Shooter (5.6, ADR-0022) |
| Damage Type | Physical, Fire, Frost or Holy | Frost only for a melee Unit ([ADR-0025](../adr/0025-no-ranged-unit-has-frost-damage.md)) |
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
| Recall | Chance to go back to the Hand | 10% to 50% |

### 5.3 Ranks

| Rank | Gem color | Symbol | Recall for Skill Cards | Stat scale (Attack and HP) |
| --- | --- | --- | --- | --- |
| **Common** | Grey | 1 pip | 10% | ×1.0 |
| **Uncommon** | Green | 2 pips | 20% | ×1.2 |
| **Rare** | Blue | 3 pips | 30% | ×1.45 |
| **Epic** | Purple | 4 pips | 40% | ×1.75 |
| **Legendary** | Orange | 5 pips | 50% | ×2.1 |

- The Countdown never changes with the Rank.
- Keyword values can also go up with the Rank. The card data defines this.
- Stat values are integers. Round to the nearest integer.
- Each card has a **Base Rank**. This is the lowest Rank in which the card exists. A card can go up to Legendary with Combine.
- The UI shows each Rank with a color **and** a number of pips, so that players with color blindness can see the Rank.

### 5.4 Keywords (v1)

| Keyword | Rule |
| --- | --- |
| **Armor N** | Reduces damage to this Unit by N. It does not reduce Holy damage. |
| **Bleed N** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Bleeding with a count of N. A Bleeding Unit gets half of each heal, rounded down. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Bleed keeps the higher count. Retaliate does not apply Bleed. N is 1 up to Rare, 2 at Epic and 3 at Legendary. See 4.7. |
| **Charge N** | +N Speed in the Turn when you summon this Unit. N is 1 up to Rare, 2 at Epic and 3 at Legendary. N is never more than 3. |
| **Entangle** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Entangled. An Entangled Unit has Speed 0 during its next action, but it can attack. Entangled then ends. A new Entangle does not stack or extend it. Only a Ranged Unit with Base Rank Epic or higher has Entangle (ADR-0022). |
| **First Strike** | See 4.7. |
| **Flying** | Moves over other Units. See 4.5. |
| **Heroic N** | +N damage when this Unit attacks a Hero. |
| **Hobble N** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Hobbled with a count of N. A Hobbled Unit has a maximum Speed of 1, after all bonuses. The count goes down by 1 in each End Phase of its owner, and the Status ends at 0. A new Hobble keeps the higher count. Retaliate does not apply Hobble. |
| **Knockback N** | Melee only. After this Unit deals attack damage above 0 to an enemy Unit, that Unit is Pushed N Squares toward its own Hero, in its own Lane. The push is not Movement. It stops before another Unit and at the pushed Unit's Column 1. A Unit with Wall is never Pushed. Retaliate does not apply Knockback. See 4.5 and 4.7. |
| **Last Breath: X** | X occurs when this Unit leaves the Board. In v1, X deals N damage to the nearest enemy Unit ahead in the same Lane, or summons Token X in the Square that this Unit left. |
| **Pivot** | Melee only. This Unit can attack an enemy Unit directly behind it or next to it, and it attacks them before the Unit in front. See 4.5 and 4.6. |
| **Poison** | After this Unit deals attack damage above 0 to an enemy Unit, that Unit becomes Poisoned with 1 more stack. Retaliate does not apply Poison. In each End Phase of the Poisoned Unit's owner, it takes 1 damage per stack, then loses 1 stack. A new stack adds to the old stacks. This damage ignores Armor, Crit and Block, and it has no Damage Type. |
| **Rally N** | In your Start Phase, other friendly Units in the same Lane get +N Attack until the end of the Turn. A Unit with Base Attack 0 gets no bonus. The bonus is fixed in the Start Phase: it stays when the Unit or the Rally Unit leaves the Lane, and a Unit that comes into the Lane later does not get it. The bonus does not apply to Retaliate or First Strike, because they occur in the enemy's Turn. |
| **Rebirth** | See 4.9. |
| **Regenerate N** | In your Start Phase, this Unit heals N HP. It cannot go above its maximum HP. |
| **Retaliate** | See 4.7. |
| **Sabotage N** | When this Unit comes onto the Board from its Creature Card, the card with the lowest Countdown in the Hand of the enemy Hero of that Front gets +N Countdown. A Ready card (Countdown 0) is the lowest. If two cards have the same Countdown, the oldest card in the Hand gets it. Rebirth and Tokens do not apply Sabotage. If the Hand is empty, nothing occurs. N is the same at each Rank, and it is at most 2. |
| **Summon X** | When you summon this Unit, a Token X of the same Rank also appears in an empty Square next to it (behind it, or the same Column in a next Lane). If no Square is empty, no Token appears. |
| **Swarm N** | While another friendly Unit or Token is in the same Lane, this Unit has +N Attack. More friendly Units do not increase the bonus. The bonus applies to attacks and Retaliate. |
| **Trample** | Melee only. When this Unit kills an enemy Unit with attack damage, the damage above that Unit's HP hits the enemy Unit in the next Square behind it. See 4.7. |
| **Unique** | Only one copy of this card can be on your side of the Board. While a Unit from this card is on your Side of the Board, no Hero of your Side can play a copy of this card, at any Rank. The card stays in the Hand. A Unit that the Stage puts on the Board also counts, and enemy Units do not count. A Deck can still hold more than 1 copy. |
| **Wall** | It can't move and can't attack, also when an effect gives it Speed or Attack. It never deals Retaliate or First Strike damage. A Wall card has Speed 0 and Attack 0. It blocks its Lane for enemy Units. Friendly Units move through it. It can be summoned into Columns 1 to 5, not only into the Summon Zone (see 4.1). |

New Keywords must go through the balance process in section 13.

### 5.5 Classes

The Hero has one Class. The Class decides which Skill Cards the Deck can hold.

| Class | Role | Example Skill Cards |
| --- | --- | --- |
| **Warrior** | Buffs and tempo | *War Drums*: the Countdown of 2 random cards in your Hand goes down by 1. *Shield Wall*: friendly Units in one Lane get Armor 1 for the next 2 enemy Turns. A new Shield Wall resets it. Units that come into the Lane later do not get it. |
| **Ranger** | Control and Hero damage | *Pinning Shot*: 3 Physical damage to an enemy Unit. If the damage is above 0 and the Unit survives, it becomes Entangled. *Warning Shot*: 2 Physical damage to an enemy Unit. If the Unit survives, it is Pushed 2 Squares toward its own Hero, also at 0 damage. *Long Shot*: 4 Physical damage to the enemy Hero. No Ranger card delays the enemy Hand: that is the Goblin Keyword Sabotage. |
| **Mage** | Area damage and Field Effects | *Fireball*: 3 Fire damage to an enemy Unit and to the Square behind it in the same Lane. It does not damage friendly Units. *Wildfire* (draft): Field Effect, 2 Fire damage per Turn on 2 × 2 Squares for 2 Turns. |
| **Priest** | Healing, protection and return | *Mend* (draft): heal 6 HP to one Unit. *Return from Rest* (draft): summon the last friendly Creature from your Graveyard into an empty Square of your Summon Zone. |

*War Drums*, *Shield Wall*, *Pinning Shot*, *Warning Shot*, *Long Shot* and *Fireball* are real cards. Their source of truth is `packages/rules/src/content/cards.ts`. The other examples are drafts.

The player can change the Class at any time outside a Battle, at no cost. A Deck that has Skill Cards of another Class is not valid until the player removes them.

### 5.6 Unit roles

Each Creature Card has a role. Use the role to balance the card and to explain it in the UI.

| Role | Description | Speed |
| --- | --- | --- |
| Frontliner | High HP, low Speed. Protects the Lane. A Frontliner with Pivot also stops enemy Units that go past it. | 1 |
| Striker | High Attack, low HP. Kills Units. | 1. An Orc melee Striker can have 2 |
| Runner | High Speed, and sometimes Flying. Damages the Hero. | 2 to 4 |
| Shooter | Ranged with Range 3. Stays back and attacks. | 1 |
| Support | Rally, Regenerate or Summon. Makes other Units better. Melee, or Ranged with Range 2. | 1 |
| Wall | Blocks a Lane for enemy Units. | 0 |

The Role sets the Speed ([ADR-0024](../adr/0024-speed-1-is-the-default.md)):

- The default Speed is 1. Each Square of Speed above 1 costs 2 Power Points (section 13).
- Only a Runner has Speed 2 or more. A Flying Runner also has Speed 2 or more.
- An Orc melee Striker can have Speed 2, because Orc is the fast Race (3.2). For speed in one Turn only, use Charge N.
- Only a ground Runner can have Speed 3 or 4, and each Race has at most 1 such card. No Unit has Speed above 4.
- A Ranged Unit never has Speed above 1.
- A card that breaks this rule needs a written reason in [10 — Card Concepts](./10-card-concepts.md).

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
- The Deck builder shows the Countdown curve (how many cards have each Countdown).
- The Deck builder shows all cards of the game. An owned card has one tile for each Rank that the player owns. A card that the player does not own has one tile in its Base Rank: grey, with a "Not owned" plate. The player cannot add it, but can see its card details. The owned cards come first, then the cards that are not owned. Each group is in Countdown order. The header shows the number of different cards that the player owns, for example "14 / 66 owned".
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
| Vanguard | Warrior | 2× Militia Recruit (C), 3× Crossbow Guard (C), 2× Halberdier (C), 2× River Knight (U), 1× Spear Throw (U). Countdown 25. |
| Raiders | Mage | 3× Scrap Raider (C), 3× Ember Shaman (C), 2× Badland Runt (C), 1× Howling Charger (U), 1× Fireball (C). Countdown 23. |

The Campaign is tuned for these Decks ([14 — Campaign Stages](./14-campaign-stages.md)). When a Starter Deck changes, run the Stage simulation again.

## 7. Hero and progression

### 7.1 Player level

- The player gets XP from each Battle. A loss gives 25% of the XP of a win.
- The XP that each level needs is in the XP table ([Economy 1.2](./07-economy.md#12-player-levels)).
- The maximum player level in v1 is 30.
- Each level gives +1 Hero HP and changes the Deck size limits.

| Level | Unlock |
| --- | --- |
| 1 | Campaign, Deck builder |
| 2 | Packs |
| 3 | Workshop: Combine and Extract |
| 5 | Gear |
| 6 | Workshop: Craft |
| 10 | Dungeon 1 |
| 20 | Dungeon 2 |
| 30 | Dungeon 3 |
| Finish Region 3 | Heynspire |

Each unlock shows a Hint (see 8.3).

### 7.2 Collection

- The Collection shows all cards in full, also the cards that the player does not own. A card that the player does not own is grey, with a "Not owned" plate.
- A card is **Discovered** after the player owns it one time. The player can Craft only Discovered cards.
- The Collection shows the number of copies of each card in each Rank.
- Filters: Race, Class, Rank, Countdown, Keyword, owned or not owned.

### 7.3 Gear

The Hero has 4 Gear slots. Each slot has one item. Each item has a level from 0 to 10. The player upgrades items with Coin. An upgrade never fails, and the level never goes down.

| Slot | Stat | Level 0 | Level 10 |
| --- | --- | --- | --- |
| Weapon | Unit Crit chance | 0% | 10% |
| Armor | Hero HP bonus | +0 | +20 |
| Trinket | Hero Crit chance (Skill Card damage) | 0% | 15% |
| Banner | Unit Block chance | 0% | 10% |

Cosmetics can change the look of each item. Cosmetics never change the stats.

### 7.4 Workshop

| Action | Input | Output | Notes |
| --- | --- | --- | --- |
| **Combine** | 2 copies of the same card in the same Rank, and Coin | 1 copy of that card in the next Rank | It never fails. The maximum Rank is Legendary. |
| **Extract** | 1 copy of a card | Essence | The game asks for confirmation if the copy is in a saved Deck. |
| **Craft** | Essence | 1 copy of a Discovered card in its Base Rank | The player selects the card. |

The [Economy](./07-economy.md) document gives the costs.

## 8. Game modes

### 8.1 Campaign

- 3 Regions. Each Region has 10 Stages. Stage 10 of each Region is a **Boss Stage**.
- The Stages in a Region unlock in order. A Region unlocks when the player wins the Boss Stage of the previous Region.
- Each Stage defines: enemy Hero, enemy Deck, enemy Hero HP, Closed Lanes, Units at the start, special rules, and rewards.
- The design of each Stage is in [14 — Campaign Stages](./14-campaign-stages.md).
- **First win reward:** a fixed card, Coin and XP.
- **Repeat win reward:** Coin, XP, and a chance of a card from the Stage card pool.
- **Star chests:** Each Region gives a chest at 10, 20 and 30 Stars.

The enemy Hero of a **Boss Stage** is a **Boss**: an enemy Hero with a name and special rules. Boss Stages have special rules. For example:

- A large Hero HP and a large Deck.
- A Start Unit, for example the Boss's bodyguard. This Unit is not a Boss.
- A rule that changes the Board, for example "Lane 2 is closed until Turn 5".

### 8.2 Heynspire (draft name)

- Heynspire unlocks after the player wins the Region 3 Boss Stage.
- It has 50 **Floors**. The player climbs one Floor at a time.
- The enemies come from the Campaign card pool with higher Ranks and higher Hero HP on each Floor.
- All Floors use 4 Lanes. Each v1 Floor has 1 enemy Hero, with a Front of all 4 Lanes.
- Each Floor gives a reward for the first win. Each 10th Floor gives an earn-only Cosmetic, Essence and Heynstones.
- v1 has no weekly reset, because a local clock is not reliable. Online versions can add a weekly reset.

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

A **Hint** is a one-line tip. It shows one time, when the player first meets something that the Tutorial does not teach. A Hint is a small banner near its subject. It has no arrow and does not stop the game. It closes on a tap, or by itself after some seconds. There is no setting to turn Hints off. The Profile keeps the list of Hints that the player has seen. Each Hint has a "Read more" link that opens the Handbook at the Entry of its subject.

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
| Heynspire | The win of the Region 3 Boss Stage |

### 8.4 Dungeons

A **Dungeon** is a named place outside the Campaign. In a Dungeon, the player fights one Battle against all the Bosses of the Dungeon at the same time. There are no Battles before the Bosses.

- Each Dungeon unlocks at a player level (see 7.1). It does not need Campaign progress.
- The enemy Side has 1 Hero for each Boss. Each Boss has its own Front, Deck, Hand, Class and Gear (see 4.1 and 4.10).
- Each Boss needs at least 1 Lane. Dungeons always use 4 Lanes, so a Dungeon can have 1 to 4 Bosses. v1 Dungeons have 2 or 3 Bosses.
- Each Dungeon defines: the Bosses, the Front of each Boss, the Deck, Hero HP, Class and Gear of each Boss, Closed Lanes, Units at the start, special rules, and rewards.
- The player can play a Dungeon again after a win.
- **First win reward** and **repeat win reward:** the same structure as Stages (see 8.1). The [Economy](./07-economy.md) document gives the values.
- A Dungeon win gives no Stars.

| No. | Unlock | Bosses | Lanes | Fronts |
| --- | --- | --- | --- | --- |
| 1 | Player level 10 | 2 new Bosses | 4 | 2 + 2 |
| 2 | Player level 20 | 2 new Bosses | 4 | 3 + 1 |
| 3 | Player level 30 | Baron Brassbelly, the Old Bramble and Queen Marrow, with higher power than in the Campaign | 4 | 1 + 2 + 1 (the Old Bramble holds the 2 center Lanes) |

- Dungeon 1 teaches the multi-Boss rules in the simplest form: 2 Bosses with 2 Lanes each.
- Dungeon 2 teaches Fronts of different sizes.
- Dungeon 3 is the final challenge. It uses the 3 Campaign Bosses again, so it needs no new Boss characters.
- The names of the Dungeons and the 4 new Bosses are drafts.

## 9. Enemy AI

- The AI uses the same rules and the same information as a player. It does not see the player's Hand.
- In each Play Phase, the AI gives a score to each legal play (each Ready card in each legal place). It plays the best play, and then scores again. It stops when no play has a score above 0. A play that has no effect scores 0.
- The score uses: threat in each Lane, damage that the AI's Hero will take, Units that the play can kill, and the value of the card.
- For a Creature Card, the AI selects a Lane and a Column of its Summon Zone, or Columns 1 to 5 for a Wall. It prefers the deepest empty Square that is nearer its Hero than the nearest enemy Unit in that Lane, so that its Unit blocks the enemy. It summons past an enemy Unit only with a Pivot Unit, or when the Lane has no enemy threat.
- Some Skill Card effects have a Hold Rule: the AI keeps a Ready card until a condition is true, for example Shield Wall until an enemy Unit is in the Lane. A Hold Rule never stops a play that prevents lethal Hero damage, or a play that empties a full Hand while the Deck has cards. The Ranger Hold Rules:
  - *Pinning Shot*: the AI plays it when the hit kills, or when the target would move in its next action: the hit deals damage above 0, and the target is not a Wall, not Frozen, not already Entangled, has Speed 1 or more, and the Square in front of it is empty.
  - *Warning Shot* and *Long Shot*: no Hold Rule. For *Warning Shot*, the AI selects the enemy Unit nearest to its Hero that the push moves at least 1 Square. If the push moves no Unit, it selects the enemy Unit that takes the most damage.
- When heal cards come, the AI keeps a heal card until a Unit has lost 50% of its HP.
- Difficulty comes from the enemy Deck, card Ranks and Hero HP. The AI logic is the same in all Stages.
- When a Side has more than one Hero, the AI plays the Ready cards of each Hero in the same Play Phase. It scores the plays of all the Heroes together.
- Auto-play uses the same AI for the player's side.

## 10. Achievements, Cosmetics and the Bazaar

- Achievements are goals, for example "Win a Battle with only Undead Units" or "Combine a card to Legendary".
- Most Achievements give Heynstones. Achievements can also give Coin, Essence or an earn-only Cosmetic.
- Cosmetic types in v1:
  - **Card backs**
  - **Board skins** (Lane and Square look)
  - **Hero portraits**
  - **Gear looks**
- Cosmetics never change gameplay.
- **Earn-only Cosmetics** come only from play: one for each 10th Heynspire Floor, and one for each of 3 hard Achievements. They are never in the Bazaar.
- The **Bazaar** sells all other Cosmetics and the Conveniences for Heynstones. A Convenience changes comfort or organization. It never changes the result of a Battle, the speed of progress or the content of the Collection. In v1 the Bazaar has no Convenience. A Deck slot is a Convenience, but it costs Coin, not Heynstones (section 6).
- In v1, the player can only earn Heynstones, and only from one-time rewards. The total is less than the cost of the full Bazaar, so the player must choose. [ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md) gives the reasons.

## 11. User interface

### 11.1 Screens

| Screen | Content |
| --- | --- |
| Title | Start, Continue, Settings, Language |
| **Town** | The first screen of the game. A layered 2D painting of a town. The Player selects a Building to open a screen. In v1, only the Town Gate can be selected ([web ADR-0005](../../apps/web/docs/adr/0005-the-town-is-a-layered-2d-painting.md)). |
| **Campaign** | The Region Map of one Region, with its Stage Markers, Stars and Star chests (see 11.5) |
| Heynspire | Floor list, current Floor, rewards |
| Dungeons | Dungeon list, unlock levels, Bosses, rewards |
| Battle | Board, Hand, Heroes, controls (see 11.2) |
| Deck builder | A modal dialog in the center of the screen, not a separate screen (see 11.4): a book with the Deck slots as ribbons and a locked ribbon that buys the next Deck slot, all cards with filters (see 6), the Countdown curve, validation, Auto-fill |
| Collection | All cards, filters, card details |
| Workshop | Combine, Extract, Craft |
| Hero | Class, Gear, portrait |
| Packs | The Peddler, Merchant and Royal Packs, each with a Race Pack version. The Drop Rates, the Pack Guarantees, Open ×10 and the open animation (Economy 3.1) |
| Achievements | List, progress, rewards |
| Bazaar | Cosmetics and Conveniences, prices in Heynstones, the Heynstone balance |
| Settings | A modal dialog in the center of the screen, not a separate screen (see 11.4). Audio, language, speed, reduced motion, text size, save export and import |
| **Handbook** | A modal dialog over the current screen, not a separate screen (see 11.4). It tells how the game works: 8 Chapters of Entries for the rules, the terms and the icons that the Player meets, with a search that also knows the words of other games ("mana" finds Countdown). An Entry exists only for a feature that is in the game, and all Entries can be read from the start. It does not list cards: the Collection does. It opens from the Town Bar, from the Top Bar of the Battle and the H key, from a rules term in a Details Panel that has focus, and from "Read more" on a Hint (see 8.3). |

### 11.2 Battle screen layout (landscape)

```text
┌──────────────────────────────────────────────────────────────┐
│ [Turn 7]                                 [×1/×2] [Skip] [⚙]  │
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
- The Top Bar has a Handbook button next to the Key Guide button, and the H key does the same. In the Battle, the Handbook is one page at one side of the Board, so that most of the Board stays in view. The Battle does not pause. The Key Guide lists H.
- In the keyboard Inspect mode (the I key), Tab goes into the Card Details of the Unit. There, the names of the Keywords, Statuses and Damage Types are links to their Handbook Entries. Card Details that show only on hover or long press have no links.
- When the enemy Side has more than one Hero, each enemy Hero shows at the end of its Front, with its own HP and Hand. A Defeated Hero shows as Defeated, and the Board shows its Front go to the next Hero.

### 11.3 Accessibility

- Rank uses color and pips.
- Damage Types use color and an icon.
- Options: text size, reduced motion, speed, and high-contrast Board.
- The player can play a full Battle with the keyboard only.
- UI text follows WCAG 2.2 AA contrast.

### 11.4 Town

The Town is the first screen of the game. It is a layered 2D painting ([web ADR-0005](../../apps/web/docs/adr/0005-the-town-is-a-layered-2d-painting.md)). The art brief and the image prompts are in [11 — Town Concepts](./11-town-concepts.md). Each screen of 11.1 except Title, Settings and the Handbook has a Building:

| Screen | Building |
| --- | --- |
| Campaign | **Town Gate**: a large gate with a road that goes out of the Town to the Regions |
| Heynspire | A tall tower on a hill at the back |
| Dungeons | A cave or ruin at the edge of the Town |
| Workshop | A workshop with a chimney and smoke |
| Bazaar | A market with colored tents |
| Packs | A small card shop |
| Collection and Deck builder | One library building |
| Hero | A barracks with a training yard |
| Achievements | A hall of banners |

- All Buildings are in the painting from v1. A Building with no screen yet is only decoration: no label, no hover, and the Player cannot select it. In v1, only the Town Gate can be selected.
- The painting fills the screen and crops its edges. All selectable Buildings stay in a center safe area that every landscape aspect shows. Decoration Buildings can be near the edges.
- Small ambient motion: clouds, chimney smoke, flags and water. The Town Gate has a soft pulse of light until the end of the Tutorial (the first win of Stage 1-1). Before the Profile exists, the pulse always shows. A selection zooms a little toward the Building and fades to its screen. With reduced motion, all motion stops and the change is a plain fade.
- The **Town Bar** is at the bottom of the Town and of each screen except the Battle. It has one shortcut for each screen of the table above, and a Town shortcut at its left end. The Deck shortcut opens the Deck builder dialog in the center of the screen, over the current screen. The current screen stays behind it, dim. A change applies at once, so the dialog has no Save button. Esc, the close button and a click outside the dialog close it. The Collection screen of the library Building comes later. A shortcut to a screen that does not exist yet is disabled, with a lock and the tooltip "Opens later". A disabled shortcut can get keyboard focus, a screen reader reads its name and "opens later", and focus, hover and long press show the tooltip. On desktop, each shortcut has an icon and a label. On a phone, it has an icon only, and long press shows its name. The Handbook shortcut is the last shortcut, between the Bazaar shortcut and the Settings button. The Town, the Handbook and Settings have no Building. Like the Deck shortcut, the Handbook shortcut opens a dialog over the current screen, so it has no current state and no lock, and its icon stays lifted while the dialog is open. The Settings button is at its right end, apart from the shortcuts. It opens the Settings dialog in the center of the screen, over the current screen. The current screen stays behind it, dim. The Settings dialog has the language and the sound, and later the other options of 11.1. A change applies at once. Esc, the close button and a click outside the dialog close it, and the Player stays on the same screen. The Town Bar has no separate language and sound buttons.
- The game is one route ([web ADR-0006](../../apps/web/docs/adr/0006-the-game-is-one-route.md)). The Town shortcut goes back to the Town, and Esc does the same. The Battle result has "Play Again" and "Back to Campaign". To leave a Battle is an Abandon, with a confirm dialog. The browser Back button leaves the game. A reload opens the Town.

### 11.5 Campaign

The Campaign screen shows one **Region Map** at a time: a flat 2D painting of one Region, with a **Trail** from the first Stage to the Boss Stage ([web ADR-0008](../../apps/web/docs/adr/0008-the-region-map-is-a-16-9-painting-with-code-drawn-stage-markers.md)). The art brief and the positions are in [12 — Region Concepts](./12-region-concepts.md).

- **Which Region opens.** From the Town Gate, the newest unlocked Region. From "Back to Campaign" after a Battle, the Region of that Battle.
- **Top band.** The Region name, with a back arrow and a next arrow at its two sides. The arrows go to the other Regions. The Player can also open a locked Region. All its Stage Markers are then Locked, and a line under the name says which Boss Stage unlocks it. There is no arrow before Region 1 or after Region 3.
- **Stage Markers.** The game draws one Stage Marker on each stop of the Trail. Each Stage Marker is a shield, with a small plate under it that shows the Stage ID (for example "1-3").

  | State | Look | Select |
  | --- | --- | --- |
  | Done | A shield with a check mark. The plate also shows the best Stars (1 to 3). | Opens the Stage Panel. The Player can play the Stage again. |
  | Open | A gold shield with a soft pulse of light. This is the next Stage to win. | Opens the Stage Panel. |
  | Locked | A grey shield with a lock. | Does not open the Stage Panel. The Stage Marker can get keyboard focus. Focus, hover and a tap or long press show a tooltip with the Stage that the Player must win first. A screen reader reads the Stage ID and "locked". |

  The Stage Marker of a Boss Stage is larger and has a crown. It also has one of the 3 states.
- **Progress line.** The game draws a dashed line on the painted road: solid from the start to the last Done Stage, faint after it.
- **Star chests.** A panel in the top-right corner shows the Stars of the Region (for example "14 / 30") on a track, and the 3 chests at 10, 20 and 30 Stars on it (see 8.1). A chest opens when the Player has its Stars. Its tooltip says how many Stars it still needs. Chest rewards are not in the game yet.
- **Stage Panel.** A modal dialog in the center of the screen. The map is dim behind it. It shows the Stage ID, the enemy Hero, the first-win reward or the repeat-win reward, the best Stars, the Deck and a **Fight** button. The Deck is a choice of the Deck slots that have cards, with the active Deck selected: the last Deck that the Player used. "Edit Decks" opens the Deck builder. A Deck that is not valid cannot start a Battle, and the panel shows the first reason. Fight takes the focus when the panel opens. Esc, a close button and a click outside close the panel.
- **Keyboard.** Focus moves through the Stage Markers in the order of the Trail. Esc closes the Stage Panel. When no panel is open, Esc goes back to the Town (see 11.4).
- **Motion.** The Stage Markers rise onto their clearings in Trail order, and the solid part of the progress line draws in from the Trail entry. The Open Stage Marker pulses. After a win opens a Stage, its marker wakes up once. With reduced motion, all of this stops.
- **Progress now.** The Stage results are in memory until the Profile keeps them (M2): a page load starts the Campaign again at Stage 1-1.
- Story scenes (MOD-07) and Stage names are not part of this screen now.

## 12. Content for v1

| Content | Count |
| --- | --- |
| Creature Cards | 90 (15 for each of the 6 Races) |
| Skill Cards | 28 (7 for each Class) |
| Total collectible cards | 118 |
| Tokens | About 8; the Creature Card draft defines 2 |
| Campaign Stages | 30 (with 3 Boss Stages) |
| Heynspire Floors | 50 |
| Dungeons | 3 (with 4 new Bosses, and the 3 Campaign Bosses again in Dungeon 3) |
| Achievements | About 40 |
| Cosmetics | About 30 (8 earn-only, the rest in the Bazaar) |

Each Race has this exact Creature Card Base Rank mix:

| Base Rank | Cards in each Race | Creature Cards |
| --- | ---: | ---: |
| Common | 5 | 30 |
| Uncommon | 5 | 30 |
| Rare | 3 | 18 |
| Epic | 2 | 12 |
| Legendary | 0 | 0 |

Skill Cards use a separate Base Rank mix. In v1, no card has Base Rank Legendary. A Legendary copy comes from Combine or from a Pack. Later cards can have Base Rank Legendary.

Each Race has a different Role profile:

| Race | Frontliner | Striker | Runner | Shooter | Support | Wall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Human | 4 | 2 | 2 | 2 | 3 | 2 |
| Elf | 1 | 2 | 3 | 5 | 3 | 1 |
| Undead | 3 | 5 | 2 | 1 | 3 | 1 |
| Orc | 2 | 5 | 4 | 2 | 2 | 0 |
| Goblin | 2 | 3 | 3 | 3 | 3 | 1 |
| Feral | 5 | 6 | 1 | 1 | 1 | 1 |

Each Race has 11 Physical Creature Cards and 4 Creature Cards with its secondary Damage Type: Holy for Human and Elf, Frost for Undead and Feral, and Fire for Orc and Goblin. Feral has no card with Countdown 1. Each Race has one Uncommon melee Pivot Card. Its two Epic Cards are one named champion with Unique and one archetypal powerhouse ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)).

## 13. Balance process

1. Each Creature Card gets **power points** from its stats and Keywords.
   - Start formula: `power = Attack × 2 + HP + Speed × 2 + Keyword points`.
   - Attack, HP and the Keyword values count at the Base Rank of the Card. The card data gives the Common Attack and HP. Use them with the Rank scale of the Base Rank (5.3). For example, an Epic card with Common Attack 4 counts Attack 7 ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)).
   - Add Range and Damage Type points: Range = its value, Fire = 3, Frost = 3 and Holy = 2.
   - Start Keyword points: Armor N = N × 3, Bleed N = N × 1, Charge N = N × 1, Entangle = 2, First Strike = 4, Flying = 4, Heroic N = N × 2, Hobble N = N × 1, Knockback N = N × 3, Pivot = 3, Poison = 3, Rally N = N × 3, Rebirth = 5, Regenerate N = N × 2, Retaliate = 4, Sabotage N = N × 4, Swarm N = N × 1 and Trample = 3.
   - Summon and a Last Breath that summons use 50% of the Token's power at the Base Rank of the Card. A Last Breath that deals N damage uses N points. Unique and Wall use 0 points.
   - These points are provisional until the simulation has enough Cards that use each Keyword.
   - A Unit summoned into Column 3 of the Summon Zone gets a 2-Square start. Check the Keyword points of **Charge** against this start.
   - **Charge N** uses N × 1 points, not N × 2 as Speed does. Speed applies in each Turn, but Charge applies only in the Turn of the summon, and the Column 3 start makes it less valuable. Thus each additional Square costs 1 point.
   - Charge N increases with the Rank, but Speed does not. The budget counts only N at the Base Rank, so a Charge card at a higher Rank has more power than its budget shows. We accept this: the additional Speed applies only in 1 Turn, and N is never more than 3. A Legendary Unit with Speed 4 and Charge 3, summoned into Column 3, goes to Column 10 in that Turn.
2. Each Countdown has a power budget for the Base Rank: `budget = 21 + s × (Countdown − 3)`, with the slope `s = 3` ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md)). Thus a Countdown 2 card has 18 points and a Countdown 6 card 30 (1.67 ×). The slope is the steepest one that passes the Matchup criteria of the ADR, and it must stay at 1.47 or more (`budget(6) ≥ 1.3 × budget(2)`). This budget is correct only with the Countdown Limit of the same ADR. Without it, a Deck of long-Countdown cards wins against a Deck of short-Countdown cards of the same Race ([08 — Archetypes, section 3.2](./08-archetypes.md#32-countdown-slope-search)).
3. A card must be within ±10% of its budget. A card outside this range needs a written reason (for example "weak stats, strong combo").
4. Run headless simulations with the rules package: thousands of AI-against-AI Battles for each **Archetype** (a reference Deck for one style of play). Use `bun run sim matchup` in `packages/rules`. The Archetypes and the results are in [08 — Archetypes](./08-archetypes.md).
5. Check each Archetype's win rate in each **Matchup**. The target is 45% to 55% against the other Archetypes.
6. Check Stage difficulty with `bun run sim stage`. The results are in [14 — Campaign Stages](./14-campaign-stages.md). The target win rate for a new player Deck on the first try is 60% to 80% for normal Stages and 30% to 50% for Boss Stages and Dungeons. The first Stages of Region 1 make a ramp: Stage 1-1 (the Tutorial) ≥ 95%, Stage 1-2 ≥ 85%, Stage 1-3 ≥ 75%. For a Dungeon, use a Deck that is typical at its unlock level.

## 14. Items for later versions

These items are not in v1. The [Roadmap](./09-roadmap.md) shows when they can come.

- Asynchronous PvP against defense Decks, leaderboards, seasons
- Guilds, guild bosses, co-op Battles with 4 Lanes
- More Races, Hybrid Units, a sixth Rank
- More Keywords and Damage Types. Poison is already in v1.
- Weekly Heynspire reset and events
- Heynstones for real money in the Bazaar
- Trading between players (needs a separate design review for fairness and fraud)
