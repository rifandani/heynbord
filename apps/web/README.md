# @workspace/web

Answers all ur questions automatically with ur best recommendations, except critical questions.

## Notes

2. What are "GDD ambiguities"?

The GDD (docs/game/03-game-design.md) gives the rules in normal sentences. When I wrote the rules as code, some sentences allowed two readings. The code must choose one, so I chose. Each item below shows:

- what the GDD says
- the question it leaves open
- what the code does now
- the other option

These are your decisions as game designer. Each one is a small change in packages/rules.

A. Burn ignores Armor

- GDD says: "Fire: … the target gets Burn: 1 damage in each End Step of its owner, for the next 2 End Steps." It also says: "Armor N: reduces damage to this Unit by N. It does not reduce Holy damage."
- Question: Burn is damage. Does Armor reduce it?
- Code now: No. Burn always does 1 damage, also to a Unit with Armor.
- Example: an Ember Shaman hits a Shieldbearer (Armor 1) with Fire. The hit does 3 − 1 = 2 damage. Then Burn does 1 + 1 more over 2 Turns.
- Other option: Armor also stops Burn. Then Armor 1 makes a Unit fully immune to Burn, and Fire becomes weak against Human (an Armor Race).
- My recommendation: keep "Burn ignores Armor", and add one sentence to the GDD so the rule is clear.

B. Retaliation details

- GDD says: "When a Unit with Retaliation survives a melee attack, it deals damage equal to its Attack to the attacker. Retaliation does not use Crit."
- Questions and code now:
  - Which Damage Type does it use? The defender's own type. A Fire Unit with Retaliation would also give Burn. No slice card has this now.
  - Does the attacker's Armor reduce it? Yes.
  - Can the attacker's side Block it? Yes, with the Banner Gear chance.
  - Does a Frozen Unit still retaliate? Yes, because Freeze only stops its own action.
  - Does it trigger when the attack did 0 damage? Yes, because "survives a melee attack" is still true.
- Example: a Militia Recruit (Attack 2) hits a Halberdier (Retaliation, Attack 4). The Halberdier survives and hits back for 4.
- Other options: Retaliation is always Physical, cannot be Blocked, or needs damage > 0 to trigger.

- GDD says: "Frost: the target gets Freeze: it skips its next action." It also says, in the End Step: "Durations go down by 1 (Freeze, …)."
- Question: if Freeze lasts 1 Turn and ends in the next End Step, it can end before the Unit ever acts. Then Freeze does nothing.
- Code now: Freeze stays until the Unit skips 1 action, then it ends.
- Example: in your Turn, Frost Bolt hits an enemy Unit. In the enemy's next Turn, that Unit does not move or attack. After that it is normal.
- My recommendation: keep this, and remove "Freeze" from the End Step sentence in the GDD.

D. Direction of the Fireball area (2×1)

- GDD says: "Fireball: 3 Fire damage to a 2 × 1 area." It does not say which 2 Squares.
- Code now:
  - You pick an enemy Unit.
  - The fire hits that Square and the next Square behind it, toward the enemy Hero.
  - You can only aim at a Square with an enemy Unit, not at an empty Square.
- Other options: the 2 Squares go across 2 Lanes (same Column), or you may aim at any Square.

E. How Flying moves

- GDD says: "A Flying Unit moves over other Units. It must stop in an empty Square."
- Code now: the Unit flies to the farthest empty Square that its Speed reaches. It can jump past an enemy Unit that is right in front of it, and then it may have nothing to attack in that Turn.
- Example: a Skyreaver (Speed 2) flies over a blocking enemy and keeps going toward the Hero. This fits its role: a "Runner" that damages the Hero.
- Other option: a Flying Unit stops and attacks when an enemy is right in front of it, and flies over Units only when the way is clear.

F. Shield Wall (bonus Armor) duration

- GDD says: "Shield Wall: friendly Units in one Lane get Armor 1 for 2 Turns."
- Questions: whose "Turn" counts? What happens if you cast it two times?
- Code now:
  - The 2 Turns count only your own End Steps. The bonus stays during the enemy's attacks in between.
  - A second Shield Wall resets the bonus to Armor 1 for 2 Turns. It does not add up to Armor 2.

G. Sudden Death never Crits

- GDD says: "From Turn number 20, the active Hero takes 1 damage in each Start Step."
- Code now: this is fixed damage. There is no Crit roll and no Armor.
- My recommendation: keep it.

H. The Turn limit assumes the player goes first

- GDD says: "If no Hero has 0 HP at the end of Turn number 60, the defender wins. In PvE, the enemy is the defender."
- Code now: the check runs after the enemy's Turn 60. This is correct for PvE, where the player always starts.
- Why it matters: for PvP later (v2), the code must check after the second side's Turn. It is not wrong now. It is a note for later.

I. One open gap: the AI and its own Hero

- GDD 9 says: the AI score uses "damage that the AI's Hero will take".
- Code now: the AI looks at threat in each Lane, kills and card value, but it does not estimate how much damage its own Hero will take next Turn.
- Effect: the AI defends a little less smartly than the GDD intends.
- Status: this is a missing feature, not a choice. I can add it.

What I suggest next

Tell me your choice for each item, for example: "A keep, B make Physical only, E stop at enemies". I will then do 3 things:

1. Change the rules and their tests.
2. Update the GDD text, so the document and the code agree.
3. Run the balance simulation again, because some changes move the win rates.

If you agree with all the current choices, I can write them into the GDD as they are.

## Todo

v1:

- update bulwark illust card-concepts
- /grill-with-docs the rules package has an AI (choose-command.ts), but it has no headless simulation harness (GDD 13 step 4), so we cannot measure win rates. fix it
- /grill-with-docs a smart auto-play button for Stages that the player has already won (whats the reward for completing already completed stage?)
- /grill-with-docs a focus trap in the result dialog
- /grill-with-docs card packs gacha with premium currency (develop shop first)
- /grill-with-docs make sure player's progress are saved (locally, no server in v1)

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
