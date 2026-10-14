# @workspace/web

Answers all ur questions automatically with ur best recommendations, except critical questions.

## Todo

v1:

New Unit Ability:

- update the Keyword "Heroic N" into "+N Attack after this Unit attacks enemy Unit", only Rare can have N=2, only Epic can have N=3, only Legendary can have N=4
- Devour N: When this Unit kills an enemy Unit, it gains +N Attack and +N HP, im thinking this Keyword is exclusive to Feral replacing Trample, but do u think its a good idea?
- Resistance N: Reduce magic damage by N (similar to Armor)
- Heal N: +N HP for the lowest HP Unit on player's friendly units for each turn
- Retreat N — After this Unit attacks, it moves up to N Squares backward
- Ambush: When regular attacking for the first time, Attack is doubled
- Arctic Barrier: Cannot be affected by buffs or debuffs
- Unrestrained: Cannot be affected by movement restrictions
- Wallbreaker: Deals double damage to Wall Unit
- Dragon Slayer: Deals double damage to Units whose Countdown is 5 or more
- Sunder: Deals double damage to Units with the Keyword Armor
- Piercing: Damage dealt cannot be reduced
- Skybane: Deals double damage to Flying Units
- Piercing: Damage dealt by this Unit cannot be reduced
- Faith N: When this Unit cures another Unit it gains +1 Life and +1 Attack (combo for Healing Unit)
- Accursed N: Damaged Unit will take extra +N damage from all units magical attacks (all except physical attack)
- Heavy Draw: Range +1. This Unit cannot attack after moving. Shooter only.
- Stationary: This Unit cannot attack after moving
- Inspired: Summoning hero has 50% chance of drawing extra card when summoned
- Inspiration: Reduces the Countdown of a card with the highest Countdown in its summoner's hand by 1.
- Stun: Damaged Unit have a 20% chance of skipping their next turn
- Quick Study: When enemy hero uses a Skill, a card with highest countdown in summoner’s hand will reduce by 1
- Iron Guardian: Takes all physical damage that would be dealt to adjacent ally Units
- Spell Guardian: Takes all magic damage that would be dealt to adjacent ally Units
- Disrupt: When this Unit deals damage to enemy hero, the Countdown of 1 lowest countdown card in this enemy’s hero hand is increased by 1
- Purge: Has a 20% chance to remove 1 buff from a random enemy Unit
- Dispel: Has a 20% chance to remove 1 buff from a random player's Unit
- Vengeance N: Upon dying, deals N damage to enemy hero
- Bloodfeed N: Whenever this Unit takes Physical damage, it gains +N Attack and +N HP
- Spellfeed N: Whenever this Unit takes Magic damage, it gains +N Attack and +N HP
- Rage N: Whenever this Unit takes damage, it gains +N Attack
- Static Shield N: Whenever this Unit takes damage, it deals N Lightning damage to the attacker (except Hero)
- Frost Shield N: Whenever this Unit takes damage, it deals N Frost damage to the attacker (except Hero)
- Flame Shield N: Whenever this Unit takes damage, it deals N Fire damage to the attacker (except Hero)
- Holy Shield N: Whenever this Unit takes damage, it deals N Holy damage to the attacker (except Hero)
- Sniper: Attacks the enemy unit or hero with lowest HP within range (Ranged Units only)

For Unique Unit:

- Thunderbolt N: Deals N Lightning damage to a random enemy Unit or hero
- Frostbolt N: Deals N Frost damage to a random enemy Unit or hero
- Firebolt N: Deals N Fire damage to a random enemy Unit or hero
- Holy Bolt N: Deals N Holy damage to a random enemy Unit or hero
- Unravel: Unit has 25% chance of removing a buff from a random enemy unit each turn
- Soul Harvest: Whenever an enemy Units is killed, it gains +1 Attack, +1 Life
- Soulbound: Upon dying, has a 25% chance of returning to its summoner's hand
- Elusive: Cannot be targeted by single-target Skills
- Shrouded: Cannot be targeted by multi-target or area damage Skills
- Blood Price N: Deals N damage to the player's summoning this Unit when summoned
- Hero's Bane: Deals 1 damage to an enemy hero each turn
- Double Strike: Attack 2 times in a single strike
- Dishearten: Any Unit attacking this Unit gain -1 Attack stackable permanently
- Backstab: When possible, will attack enemy Unit directly behind with a double Attack (combined with Flying would be crazy)
- Undead King: When an enemy Units is killed, it will be rebirth by this Keyword as a Skeleton (treated as player's Unit)
- Frighten: Has a 25% chance of returning a random enemy Unit within range to its summoner's hand
- Spawnbane N: Deals N damage to Units summoned by enemy heroes
- Hardened: Reduces physical damage taken to 4
- Spell Guard: Reduces magic damage taken to 4
- Brotherhood N: All other friendly Human Units gain +N Attack and +N HP
- Bloodlust N: All other friendly Orc Units gain +N Attack and +N HP
- Wildsong N: All other friendly Elf Units gain +N Attack and +N HP
- Gravebound N: All other friendly Undead Units gain +N Attack and +N HP
- Mob Mentality N: All other friendly Goblin Units gain +N Attack and +N HP
- Primal Instinct N: All other friendly Goblin Units gain +N Attack and +N HP
- Summon Familiar: When this Unit deals damage to hero, summon 1 Elfin (1/1) in an adjacent square
- Whirlwind: Attacks all enemy Units or heroes in adjacent squares
- Vampirism: Absorb all Physical damage dealt to HP
- Spell Vampirism: Absorb all Magic damage dealt to HP

New Skills:

Priest:

- Cleanse: Remove all debuffs to friendly Unit
- Purify: Remove 1 debuff with the longest duration from target friendly Unit and restore 4 Life to it
- Holy Light N: Deals N damage to enemy units. Killed enemy can't be resurrected/rebirth

Mage:

- Reflect Magic: Reflect magic damage for 1 turns
- Absorb Magic: Absorb magic damage for 1 turns
- Nullify Magic: Nullify magic damage for 2 turns

Undead:

- Mind Control: apply Charm to enemy for 1 turn (Charm is a new Keyword: The targeted enemy unit is forced to fight on your side against its own allies for the duration of the effect)

Warrior:

- Reflect Physical: Reflect physical damage for 1 turns (the art should be drinking potion)
- Absorb Physical: Absorb physical damage for 1 turns
- Nullify Physical: Nullify physical damage for 2 turns
- Cavalry Slayer: +1 Range. Deals double damage to Units with the Keyword. Cavalry
- Bestow Pivot: Target friendly Unit gains Keyword "Pivot" for 2 turns
- Bestow Retaliate: Target friendly Unit gains Keyword "Retaliate" for 2 turns
- Sacrificial Guard: Your hero will take all damage that would be dealt to target friendly Units for 2 turns

Elf:

- Fortify N: Reduces non-melee damage by half to friendly units for N turns

Feral:

- Primal Retribution: Inflict debuff to enemy Unit, any damage it deals, it will also receive the same

Orc:

- Immovable Object: friendly Unit cannot move but gains +8 Life and Keywords: Pivot and Retaliate. Last 2 turns.

Goblin:

- Silence: Enemy Unit lose 1 random Keyword for 2 turns
- Slow: Enemy Unit -1 Movement for 2 turns

Sequence:

1. #50
1. #67 "Re-fit Vanguard and Raiders": blocked by #50.
1. #68 "Promote Diagnostic Decks": blocked by #67.
1. Workshop feature: Combine and Extract, and Craft.
1. Hero feature: Gear upgrades. Then check the Region 1 margins again with real Gear. Vitality is your hero‘s life = armour, Fortitude influences your Units‘ block rate = headgear, Valour influences your Units‘ critical hit rate = weapon
1. First external playtest: this is the M2 exit.
1. Regions 2 and 3 (M3): their tuning needs Combine and Gear.
1. Heynspire, then Achievements, Cosmetics and the Bazaar (M4): plan their goals and the Heynstone total one time.

New features:

continue hunters focus

- /grill-with-docs when we're battling PvE, i want a feature where me as a Player can see the past turns, so that i can observe what happens in last turns, reconsider my strategy against the enemy, what cards have been played, what Keywords activated, etc, it's like a battle/turn history where i can travel back and go through turns interactively
- /grill-with-docs new Hero's Class for goblin and feral, maybe Shaman?
- /grill-with-docs rewards for winning campaigns, for winning stage 1-10 i think we can give them elf, we also should have a prediction record / simulation like if the user complete stage 1-1 how many coins and cards they have. Also victory result modal in campaign battle still not showing what the rewards
- /grill-with-docs a smart auto-play button for Stages that the player has already won (whats the reward for completing already completed stage?)
- /grill-with-docs introduce new items called "Skip Ticket", it will auto-skip Stages that the player has already won
- /grill-with-docs how do we save player's progress so far? for now i want to save it locally, but later i want it to be saved in DB of course
- /grill-with-docs add campaign region 2 which is about mixed Orc & Goblin territory (the first time we introduce Goblin)
- /grill-with-docs add campaign region 3 which is all about Goblin & Elf territory (the first time we introduce Elf)
- /grill-with-docs add campaign region 4 which is all about Elf & Feral territory (the first time we introduce Feral)
- /grill-with-docs add campaign region 5 which is all about Feral & Undead territory (the first time we introduce Undead)
- brainstorm with me what should be the story/content for region 6 and the next because we already introduce all races in region 1 to 5, and also can we have a deterministic script to automatically generate new Campaign Map with all the stages and rewards, of course the battle and economy itself should be balanced as well
- differentiate between https://kingsandlegends-archive.fandom.com/wiki/Alchemy_Lab and https://kingsandlegends-archive.fandom.com/wiki/Blacksmith
- cleanup CONTEXT.md, all game docs, redundant ADRs, etc
- check if we already finish all "v1" related features from docs, check whats not done in game design and PRD, check all still (draft) things, check roadmap

v2:

- blender mcp + all 3D unit
- hybrids, awakening
- standardize UI components at design system level
- dynamic og image generation
- add better auth + skills
- add server side feature flag
- add production ready error monitoring, logs with evlog + skills
- add alchemy + cloudflare binding
- Enemy AI: a search-based AI (for example Monte Carlo) that uses the deterministic engine
- Asynchronous online: an account, a server
- https://kingsandlegends-archive.fandom.com/wiki/Seaport
- https://kingsandlegends-archive.fandom.com/wiki/Auction_House
- https://kingsandlegends-archive.fandom.com/wiki/Guild
- https://kingsandlegends-archive.fandom.com/wiki/Buildings Ranking Board + Arena Real-time PvP or PvP against other players' _saved defense decks_ (the AI controls them)

## Original Gameplay Ideas

- The original had 4 classes, 11 races, 7 ranks, hybrids, awakening, hero gear and more than 900 cards.
- The original's card progression was a long chase. Combine (2 or more copies give 1 card of the next rank, and the combine can fail), Extract, Fuse with rotating recipes, Enhance, city buildings, Energy, VIP.
- Target fight length is 3 to 6 minutes at speed ×1
- The original had 7 damage types and an action order of 11 steps
- The original deck had 15 to 30 cards (new players started at 5 to 10, and the limits went up by 1 each level). A deck could hold at most 3 copies of a card. Skill cards had to match your class.
- The original had 10 slots (with mounts and runes) and 4 stats: Hero HP, Hero Crit, Unit Crit, Unit Block.
