# Dungeons have a Dungeon Sweep with their own Tickets

Players repeat Dungeons for their repeat-win rewards (Economy 2.4), and watched Auto-play makes them watch each repeat. ADR-0035 rejected watched Auto-play on Stages for this reason. We decided that a **Dungeon Sweep** replaces watched Auto-play on Dungeons, and that it uses its own **Dungeon Sweep Ticket**. The old Sweep Ticket is now the **Campaign Sweep Ticket**. The Player can do a Dungeon Sweep of a Dungeon with 1 or more wins. Each Dungeon Sweep Ticket gives one repeat-win reward of the Dungeon at once, with no Battle, and a Dungeon Sweep always wins. A Dungeon win gives 1 Dungeon Sweep Ticket and no Campaign Sweep Tickets. A Stage win and a Floor win still give 2 Campaign Sweep Tickets.

A Dungeon repeat win gives much more than a Stage repeat win: Epic Forge Stones, and in Dungeon 3, Essence and Legendary Forge Stones (ADR-0039). With one shared Ticket, the Player can use Tickets from easy Stages to farm Dungeon 3, and the Stage economy then sets the endgame pacing. Separate Tickets let us tune each economy alone. 1 Ticket for each Dungeon win gives 2 Dungeon rewards for the time of 1 Battle, not 3, so the endgame supply of Forge Stones grows less.

## Considered Options

- **Keep watched Auto-play on Dungeons, with no Dungeon Sweep.** Rejected: the Player must still watch each repeat (ADR-0035).
- **Keep watched Auto-play and add the Dungeon Sweep.** Rejected: two repeat tools on one screen give the Player a choice with no value, and an Auto-play win needs its own Ticket rule.
- **One shared Sweep Ticket for Stages and Dungeons.** Rejected: Stage wins then pay for Dungeon 3 rewards, and we cannot tune the two economies separately.
- **2 Dungeon Sweep Tickets for each Dungeon win.** Rejected for now: it makes the endgame Forge Stone supply 3 times larger. The M3 re-tune can change the number.

## Consequences

- The Player cannot start Auto-play. The AI still uses it for tests, QA and the Battle simulations.
- The Profile keeps two counts: Campaign Sweep Tickets and Dungeon Sweep Tickets. A migration moves the old Sweep Tickets to Campaign Sweep Tickets. Dungeon Sweep Tickets start at 0, with no Tickets for old Dungeon wins.
- A Dungeon Sweep never adds to the wins of a Dungeon, and it gives no Tickets.
- The M3 re-tune checks the number of Dungeon Sweep Tickets for each win, with the Dungeon 3 rewards.
