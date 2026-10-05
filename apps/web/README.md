# @workspace/web

Answers all ur questions automatically with ur best recommendations, except critical questions.

## Todo

v1:

- /grill-with-docs we already have Fire, Frost, and Holy Damage Type, i want to add another one called Lightning. the effect is Paralysis, which i think the afflicted unit can't move and i dont know more, tell me what u think
- /grill-with-docs i want to add another Keyword called "Retreat N" — After this Unit attacks, it moves up to N Squares backward (could be fit for Human and Elf).
- /grill-with-docs i want to add another Keyword called "Knockback N" — After this Unit deals attack damage above 0 to an enemy Unit, that Unit moves N Squares backward (fit for Orc or Human)
- /grill-with-docs current Heroic is too hard to triggered because the unit needs to attack the enemy Hero first, can we adjust it so it only need to attack enemy Unit?
- /grill-with-docs add bleed status, unit that got bleed gets healing reduced by 50%
- /grill-with-docs re-balance speed for all units (normal move should be 2)
- /grill-with-docs lets create more cards collection, lets create Elf and Undead race, and i want for each race to have 5 common + 5 uncommon + 3 rare + 2 epic, lets draft it, and make sure the game balance is still good
- /grill-with-docs a smart auto-play button for Stages that the player has already won (whats the reward for completing already completed stage?)
- /grill-with-docs a focus trap in the result dialog
- /grill-with-docs card packs gacha with premium currency (develop shop first)
- /grill-with-docs make sure player's progress are saved (locally, no server in v1)
- blender mcp
- check if we already finish all "v1" related features from docs, and if yes remove it

v2:

- standardize UI components at design system level
- dynamic og image generation
- add better auth + skills
- add server side feature flag
- add production ready error monitoring, logs with evlog + skills
- add alchemy + cloudflare binding
- Asynchronous online: an account, a server, PvP against other players' _saved defense decks_ (the AI controls them), leaderboards and guilds
- Real-time PvP (for PvP the options should be 1v1, 2v2, 4v4, there's no 3v3 because of the lanes) and a persistent shared world
- Enemy AI: a search-based AI (for example Monte Carlo) that uses the deterministic engine, can come later for PvP defense decks

## Re-check / improve later

- Battle rules: Turn structure, Countdown, summon, movement, attack, damage, death, win and loss (GDD section 4)
- 6 Keywords: Armor, Flying, Charge, Retaliation, Regeneration, Heroic
- More animations in Battle Events

## Original Gameplay Ideas

- The original had 4 classes, 11 races, 7 ranks, hybrids, awakening, hero gear and more than 900 cards.
- The original's card progression was a long chase. Combine (2 or more copies give 1 card of the next rank, and the combine can fail), Extract, Fuse with rotating recipes, Enhance, city buildings, Energy, VIP.
- Target fight length is 3 to 6 minutes at speed ×1
- The original had 7 damage types and an action order of 11 steps
- The original deck had 15 to 30 cards (new players started at 5 to 10, and the limits went up by 1 each level). A deck could hold at most 3 copies of a card. Skill cards had to match your class.
- The original had 10 slots (with mounts and runes) and 4 stats: Hero HP, Hero Crit, Unit Crit, Unit Block.
