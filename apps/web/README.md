# @workspace/web

## Maintenance

- /improve-codebase-architecture
- /improve-codebase-architecture to use /effect ecosystem in both FE and BE
- refactor whole codebase to follow best practices for react and composition patterns from /vercel-composition-patterns and /vercel-react-best-practices
- remove oxlint-disable, fallow-disable across codebase and actually fix it

## Todo

v1:

New Unit Ability:

- Devour N: When this Unit kills an enemy Unit, it gains +N Attack and +N HP, im thinking this Keyword is exclusive to Feral replacing Trample, but do u think its a good idea?
- Retreat N — After this Unit attacks, it moves up to N Squares backward
- Ambush: When regular attacking for the first time, Attack is doubled
- Arctic Barrier: Cannot be affected by buffs or debuffs
- Unrestrained: Cannot be affected by movement restrictions
- Monster Slayer: Deals double damage to Units whose Countdown is 5 or more
- Sunder: Deals double damage to Units with the Keyword Bulwark
- Sunder Magic: Deals double damage to Units with the Keyword Resistance
- Skybane: Deals double damage to Flying Units
- Faith N: When this Unit cures another Unit it gains +1 Life and +1 Attack (combo for Healing Unit)
- Accursed N: Damaged Unit will take extra +N damage from all units magical attacks (all except physical attack)
- Heavy Draw: Range +1. This Unit cannot attack after moving. Shooter only.
- Stationary: This Unit cannot attack after moving
- Inspired: Summoning hero has 50% chance of drawing extra card when summoned
- Inspiration: Reduces the Countdown of a card with the highest Countdown in its summoner's hand by 1 when summoned
- Stun: Damaged Unit have a 20% chance of skipping their next turn
- Iron Guardian: Takes all physical damage that would be dealt to adjacent ally Units
- Spell Guardian: Takes all magic damage that would be dealt to adjacent ally Units
- Disrupt: When this Unit deals damage to enemy hero, the Countdown of 1 lowest countdown card in this enemy’s hero hand is increased by 1
- Purge: Has a 20% chance to remove 1 buff from a random enemy Units every turn
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

- Unravel: Unit has 25% chance of removing a buff from a random enemy unit each turn
- Soulbound: Upon dying, has a 25% chance of returning to its summoner's hand
- Elusive: Cannot be targeted by single-target Skills
- Shrouded: Cannot be targeted by multi-target or area damage Skills
- Blood Price N: Deals N damage to the player's summoning this Unit when summoned
- Double Strike: Attack 2 times in a single strike
- Dishearten: Any Unit attacking this Unit gain -1 Attack stackable permanently
- Backstab: When possible, will attack enemy Unit directly behind with a double Attack (combined with Flying would be crazy)
- Undead King: When an enemy Units is killed, it will be rebirth by this Keyword as a Skeleton (treated as player's Unit)
- Frighten: Has a 25% chance of returning a random enemy Unit within range to its summoner's hand
- Spell Guard: Reduces magic damage taken to 4
- Brotherhood N: All other friendly Human Units gain +N Attack and +N HP
- Bloodlust N: All other friendly Orc Units gain +N Attack and +N HP
- Wildsong N: All other friendly Elf Units gain +N Attack and +N HP
- Gravebound N: All other friendly Undead Units gain +N Attack and +N HP
- Mob Mentality N: All other friendly Goblin Units gain +N Attack and +N HP
- Primal Instinct N: All other friendly Feral Units gain +N Attack and +N HP
- Summon Familiar: When this Unit deals damage to hero, summon 1 Elfin (1/1) in an adjacent square
- Whirlwind: Attacks all enemy Units or heroes in adjacent squares
- Vampirism: Absorb all Physical damage dealt to HP
- Spell Vampirism: Absorb all Magic damage dealt to HP

New Skills:

Warrior:

- Reflect Physical: Reflect physical damage for 1 turns (the art should be drinking potion)
- Absorb Physical: Absorb physical damage for 1 turns
- Nullify Physical: Nullify physical damage for 2 turns
- Cavalry Slayer: +1 Range. Deals double damage to Units with the Keyword. Cavalry
- Bestow Pivot: Target friendly Unit gains Keyword "Pivot" for 2 turns
- Bestow Retaliate: Target friendly Unit gains Keyword "Retaliate" for 2 turns
- Sacrificial Guard: Your hero will take all damage that would be dealt to target friendly Units for 2 turns
- Immovable Object: friendly Unit cannot move but gains +8 Life and Keywords: Pivot and Retaliate. Last 2 turns.

Ranger:

- Fortify: Reduces non-melee damage by half to friendly units for 2 turns
- Silence: Enemy Unit lose 1 random Keyword for 2 turns
- Slow: Enemy Unit -1 Movement for 2 turns
- Swift Death: Places a card with the highest Countdown from target enemy hero's hand into his graveyard
- Premediation: Your hero takes 5 damage. Draw two cards.
- Disinformation: Returns target Unit to its Summoner's hand. Resets its Countdown to half of its highest number (rounded up).
- Sow Disorder: Increases Countdown of 3 random cards in target enemy hero's hand by 1
- Deadly Blow: Your hero takes 3 damage. Kill target enemy Unit whose Countdown is 3 or less.
- Fatal Opening: Doubles all damage target enemy Unit takes for 1 turn.

Mage:

- Reflect Magic: Reflect magic damage for 1 turns
- Absorb Magic: Absorb magic damage for 1 turns
- Nullify Magic: Nullify magic damage for 2 turns
- Mind Control: apply Charm to enemy for 1 turn (Charm is a new Keyword: The targeted enemy unit is forced to fight on your side against its own allies for the duration of the effect)

Priest:

- Cleanse: Remove all debuffs to friendly Unit
- Purify: Remove 1 debuff with the longest duration from target friendly Unit and restore 4 Life to it
- Retribution: Inflict debuff to enemy Unit, any damage it deals, it will also receive the same
- Haste: Decreases Countdown of a card with the highest Countdown in target friendly hero's hand by 4
- Zeal: Decreases Countdown of each card in target friendly hero's hand by 1.

New features:

1. /grill-with-docs work on new feature called "XXX" (recommend me better name, similar to what we already have). Split it into 3 Stage pattern: shape, engine, then UI. Orchestrate it with gh issues
2. cleanup all redundant game docs, etc
3. check if we already finish all "v1" related features from docs, check whats not done in game design and PRD, check all still (draft) things, check roadmap

you are a orchestrator of subagents implement issue A, B, C parallel with subagents (use deepseek v4.1 flash MAX only) coordinate it so that theres no conflicts

Answers all ur questions automatically with ur best recommendations, except critical questions. Optimize your work to be faster, maybe use subagents or dynamic workflows or parallelize tasks.

actually remove our prd/roadmap/docs that says about it (we mark it as completed by removing it)

v2:

- brainstorm with me what should be the story/content for region 6 and the next because we already introduce all races in region 1 to 5, and also can we have a deterministic script to automatically generate new Campaign Map with all the stages and rewards, of course the battle and economy itself should be balanced as well
- dynamic og image generation
- add better auth + skills
- add error monitoring, logs with evlog + skills
- add alchemy + cloudflare binding
- save player's progress in DB
- Enemy AI: a search-based AI (for example Monte Carlo) that uses the deterministic engine
- add server side feature flag
- Asynchronous online: an account, a server
- Login rewards, Daily Activity + Rewards, add limit to how many challenge can be taken daily for dungeons and heynspire then introduce entry ticket for both for extra challenge,
- Story scenes at the start and end of each Region (need to install some claude motion skills first)
- https://kingsandlegends-archive.fandom.com/wiki/Auction_House
- https://kingsandlegends-archive.fandom.com/wiki/Guild
- https://kingsandlegends-archive.fandom.com/wiki/Buildings Ranking Board + Arena Real-time PvP or PvP against other players' _saved defense decks_ (the AI controls them)
- https://kingsandlegends-archive.fandom.com/wiki/Blacksmith
