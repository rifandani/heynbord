# @workspace/web

Answers all ur questions automatically with ur best recommendations, except critical questions.

## Todo

Design decisions for you:

- Rally and Retaliation conflict. The bonus ends at the end of the owner's Turn, and Retaliation happens only in the enemy's Turn. So the issue's "bonus applies to Retaliation" can never happen.
- Unique is card data only. No Battle rule reads it yet. Tokens do not exist, so the "Token does not apply Sabotage" test uses a Stage Start Unit.
- Catalog test. The web catalog test skips Goblin and Feral cards until they get Message Catalog text.

v1:

- if a 0 Base Attack unit have poison, or burn, etc skills, can they inflict those posion or burn, etc to the enemy unit?
- /grill-with-docs Wild Hunt is too strong and Tunnel Rats is too weak, balance it
- /grill-with-docs new Hero's Class for goblin and feral, maybe Shaman?
- /grill-with-docs we already have Fire, Frost, and Holy Damage Type, i want to add another one called Lightning. the effect is Paralysis, which i think the afflicted unit can't move and i dont know more, tell me what u think
- we need to also have economy simulation script, not only battle simulation
- /grill-with-docs i want to add another Keyword called "Devour": +1 Attack and +1 HP for each kill, suitable for Feral
- /grill-with-docs add Bleed status, unit that got bleed gets healing reduced by 50%, suitable for Feral
- /grill-with-docs i want to add another Keyword called "Retreat N" — After this Unit attacks, it moves up to N Squares backward.
- /grill-with-docs re-balance speed for all units (normal move should be 2)
- /grill-with-docs a smart auto-play button for Stages that the player has already won (whats the reward for completing already completed stage?)
- /grill-with-docs a focus trap in the result dialog
- /grill-with-docs card packs gacha with premium currency (develop shop first)
- /grill-with-docs make sure player's progress are saved (locally, no server in v1)
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

## Re-check / improve later

- Battle rules: Turn structure, Countdown, summon, movement, attack, damage, death, win and loss (GDD section 4)
- 6 Keywords: Armor, Flying, Charge, Retaliation, Regeneration, Heroic
- More animations in Battle Events
- The JS is now most of the precache. catalog-page-_.js is 1.4 MiB, which is large for a catalog page. It possibly includes three.js. battle-canvas-_.js is 1.0 MiB. You can find the cause in html/visualizer-stats.html.

## Original Gameplay Ideas

- The original had 4 classes, 11 races, 7 ranks, hybrids, awakening, hero gear and more than 900 cards.
- The original's card progression was a long chase. Combine (2 or more copies give 1 card of the next rank, and the combine can fail), Extract, Fuse with rotating recipes, Enhance, city buildings, Energy, VIP.
- Target fight length is 3 to 6 minutes at speed ×1
- The original had 7 damage types and an action order of 11 steps
- The original deck had 15 to 30 cards (new players started at 5 to 10, and the limits went up by 1 each level). A deck could hold at most 3 copies of a card. Skill cards had to match your class.
- The original had 10 slots (with mounts and runes) and 4 stats: Hero HP, Hero Crit, Unit Crit, Unit Block.
