# A Sweep uses Sweep Tickets and always wins

Players want to farm the repeat-win rewards of a Stage (Economy 2.1) and not play or watch the same Battle again. We decided that the Player can **Sweep** a Stage when its best Stars are 3. Each **Sweep Ticket** gives one repeat-win reward at once, with no Battle, and a Sweep always wins. Each win that the Player plays (Stage, Dungeon or Floor) gives 2 Sweep Tickets. A Sweep never changes the Stars and gives no Tickets.

The 3 Stars show that the Player can win the Stage easily, so a guaranteed win is fair, and a Sweep that sometimes loses feels wrong. The 3-Star gate also keeps the Stars as a record of the Player's own play: with the old gate ("a won Stage", GDD 4.12), an Auto-play win could give more Stars, and then the AI opened Star chests (and their Heynstones) for the Player. The Tickets keep a time cost on repeat wins, so the pacing of Economy section 4 stays near its targets. Tickets limit only the Sweep: the Player can always play a Battle, so they are not Energy (Pillar 1). Sweep Tickets are earn-only. The Bazaar never sells them, because a Battle skip is not a Convenience (ADR-0008).

## Considered Options

- **Watched Auto-play (GDD 4.12).** Rejected: the Player must still watch each repeat, and that is the problem.
- **A free, instant Sweep with no limit.** Rejected: a Player can get the rewards of 100 repeat wins in one minute, and the grind to Player level 30 becomes minutes.
- **A Sweep that plays real Auto-play Battles and can lose.** Rejected: a loss in a Sweep is weird to the Player, and the AI loss is luck.
- **Rewards after a real-time wait.** Rejected: the Player wants the result at once, and the wait needs a timer that runs only while the game is open.
- **A smaller reward for a Sweep.** Rejected: it makes manual repeats the "correct" way to play, and that is the grind that the Sweep removes.

## Consequences

- With 2 Tickets for each played win, the Player gets 3 repeat-win rewards for the time of 1 Battle. The M3 re-tune checks this value and the repeat-win rewards. The First-try Path and the Recommended levels do not change, because they have no repeats.
- The Profile keeps a count of Sweep Tickets.
- The Sweep is only for Stages. Dungeons keep watched Auto-play, and an Auto-play win gives no Tickets, so the AI cannot make Tickets for the Player.
