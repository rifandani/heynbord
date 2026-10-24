# Dungeons have a Dungeon Sweep with their own Tickets

Players repeat Dungeons for their repeat-win rewards (Economy 2.4), and watched Auto-play makes them watch each repeat. The Campaign Sweep below rejects watched Auto-play on Stages for this reason. We decided that a **Dungeon Sweep** replaces watched Auto-play on Dungeons, and that it uses its own **Dungeon Sweep Ticket**. The old Sweep Ticket is now the **Campaign Sweep Ticket**. The Player can do a Dungeon Sweep of a Dungeon with 1 or more wins. Each Dungeon Sweep Ticket gives one repeat-win reward of the Dungeon at once, with no Battle, and a Dungeon Sweep always wins. A Dungeon win gives 1 Dungeon Sweep Ticket and no Campaign Sweep Tickets. A Stage win and a Floor win still give 2 Campaign Sweep Tickets.

A Dungeon repeat win gives much more than a Stage repeat win: Epic Forge Stones, and in Dungeon 3, Essence and Legendary Forge Stones (ADR-0037). With one shared Ticket, the Player can use Tickets from easy Stages to farm Dungeon 3, and the Stage economy then sets the endgame pacing. Separate Tickets let us tune each economy alone. 1 Ticket for each Dungeon win gives 2 Dungeon rewards for the time of 1 Battle, not 3, so the endgame supply of Forge Stones grows less.

## The Campaign Sweep

Players want to farm the repeat-win rewards of a Stage (Economy 2.1) and not play or watch the same Battle again. The Player can **Sweep** a Stage when its best Stars are 3. Each **Campaign Sweep Ticket** gives one repeat-win reward at once, with no Battle, and a Campaign Sweep always wins. A Stage win and a Floor win give 2 Campaign Sweep Tickets. A Campaign Sweep never changes the Stars and gives no Tickets.

The 3 Stars show that the Player can win the Stage easily, so a guaranteed win is fair, and a Campaign Sweep that sometimes loses feels wrong. The 3-Star gate also keeps the Stars as a record of the Player's own play: with the old gate ("a won Stage", GDD 4.12), an Auto-play win could give more Stars, and then the AI opened Star chests (and their Heynstones) for the Player. The Tickets keep a time cost on repeat wins, so the pacing of Economy section 4 stays near its targets. Tickets limit only the Campaign Sweep: the Player can always play a Battle, so they are not Energy (Pillar 1). Campaign Sweep Tickets are earn-only. The Bazaar never sells them, because a Battle skip is not a Convenience ([ADR-0008](./0008-heynstones-buy-only-cosmetics-and-conveniences.md)).

## Considered Options

The Campaign Sweep:

- **Watched Auto-play (GDD 4.12).** Rejected: the Player must still watch each repeat, and that is the problem.
- **A free, instant Campaign Sweep with no limit.** Rejected: a Player can get the rewards of 100 repeat wins in one minute, and the grind to Player level 30 becomes minutes.
- **A Campaign Sweep that plays real Auto-play Battles and can lose.** Rejected: a loss in a Campaign Sweep is weird to the Player, and the AI loss is luck.
- **Rewards after a real-time wait.** Rejected: the Player wants the result at once, and the wait needs a timer that runs only while the game is open.
- **A smaller reward for a Campaign Sweep.** Rejected: it makes manual repeats the "correct" way to play, and that is the grind that the Campaign Sweep removes.

The Dungeon Sweep:

- **Keep watched Auto-play on Dungeons, with no Dungeon Sweep.** Rejected: the Player must still watch each repeat.
- **Keep watched Auto-play and add the Dungeon Sweep.** Rejected: two repeat tools on one screen give the Player a choice with no value, and an Auto-play win needs its own Ticket rule.
- **One shared Sweep Ticket for Stages and Dungeons.** Rejected: Stage wins then pay for Dungeon 3 rewards, and we cannot tune the two economies separately.
- **2 Dungeon Sweep Tickets for each Dungeon win.** Rejected for now: it makes the endgame Forge Stone supply 3 times larger. The M3 re-tune can change the number.

## Consequences

- With 2 Campaign Sweep Tickets for each Stage or Floor win, the Player gets 3 Stage repeat-win rewards for the time of 1 Battle. The M3 re-tune checks this value and the repeat-win rewards. The First-try Path and the Recommended levels do not change, because they have no repeats.
- The Profile keeps two counts: Campaign Sweep Tickets and Dungeon Sweep Tickets. A migration moves the old Sweep Tickets to Campaign Sweep Tickets. Dungeon Sweep Tickets start at 0, with no Tickets for old Dungeon wins.
- The Player cannot start Auto-play. The AI still uses it for tests, QA and the Battle simulations.
- A Campaign Sweep is only for Stages. The Player cannot start watched Auto-play, so the AI cannot make Tickets for the Player.
- A Dungeon Sweep never adds to the wins of a Dungeon, and it gives no Tickets.
- The M3 re-tune checks the number of Dungeon Sweep Tickets for each win, with the Dungeon 3 rewards.
