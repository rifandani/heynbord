# @workspace/web

Answers all ur questions automatically with ur best recommendations, except critical questions.

## Todo

v1:

- look at human race cards 1 by 1, see they're role & speed (should normal units have 2 Speed? if the normal units have 1 Speed, then what criteria does the unit have to have 2 Speed?), ability and skills, check if there's any imbalance
- /grill-with-docs we already have Fire, Frost, and Holy Damage Type, i want to add another one called Lightning. the effect is Paralysis, which i think the afflicted unit can't move and i dont know more, tell me what u think
- /grill-with-docs i want to add another Keyword called "Devour": +1 Attack and +1 HP for each kill, suitable for Feral
- /grill-with-docs i want to add another Keyword called "Retreat N" — After this Unit attacks, it moves up to N Squares backward.
- if a 0 Base Attack unit have poison, or burn, etc skills, can they inflict those posion or burn, etc to the enemy unit?
- /grill-with-docs dont u think we need to also have economy simulation script before adding "Bazaar" or "Packs" features, not only battle simulation
- /grill-with-docs new Hero's Class for goblin and feral, maybe Shaman?
- /grill-with-docs rewards for winning campaigns, for winning stage 1-10 i think we can give them elf, we also should have a prediction record / simulation like if the user complete stage 1-1 how many coins and cards they have. Also victory result modal in campaign battle still not showing what the rewards
- /grill-with-docs a smart auto-play button for Stages that the player has already won (whats the reward for completing already completed stage?)
- /grill-with-docs brainstorm what to include in "Packs" feature when user click it in town bottom bar, im thinking about adding gacha-like experience, cheapest pack = very high probability for common and low probability for uncommon, middle pack, and so on, u recommend me
- /grill-with-docs how do we save player's progress so far? for now i want to save it locally, but later i want it to be saved in DB of course
- /grill-with-docs add campaign region 2 which is all about Goblin territory
- /grill-with-docs add campaign region 3 which is all about Elf territory
- /grill-with-docs add campaign region 4 which is all about Undead territory
- /grill-with-docs add campaign region 5 which is all about Feral territory
- cleanup CONTEXT.md, all game docs, redundant ADRs, etc
- check if we already finish all "v1" related features from docs, and if yes remove it

v2:

- blender mcp + all 3D unit, hero, hero equipments
- standardize UI components at design system level
- dynamic og image generation
- add better auth + skills
- add server side feature flag
- add production ready error monitoring, logs with evlog + skills
- add alchemy + cloudflare binding
- Asynchronous online: an account, a server, PvP against other players' _saved defense decks_ (the AI controls them), leaderboards and guilds
- Real-time PvP (for PvP the options should be 1v1, 2v2, 4v4, there's no 3v3 because of the lanes) and a persistent shared world
- Enemy AI: a search-based AI (for example Monte Carlo) that uses the deterministic engine, can come later for PvP defense decks

## Original Gameplay Ideas

- The original had 4 classes, 11 races, 7 ranks, hybrids, awakening, hero gear and more than 900 cards.
- The original's card progression was a long chase. Combine (2 or more copies give 1 card of the next rank, and the combine can fail), Extract, Fuse with rotating recipes, Enhance, city buildings, Energy, VIP.
- Target fight length is 3 to 6 minutes at speed ×1
- The original had 7 damage types and an action order of 11 steps
- The original deck had 15 to 30 cards (new players started at 5 to 10, and the limits went up by 1 each level). A deck could hold at most 3 copies of a card. Skill cards had to match your class.
- The original had 10 slots (with mounts and runes) and 4 stats: Hero HP, Hero Crit, Unit Crit, Unit Block.
