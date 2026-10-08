# No Range above 3, and Entangle only on Epic Ranged Units

The diagnostic Archetype Thornwatch won 82% to 97% against each other Archetype (issue #23), with each Elf card in its Power Budget. Two causes made this. A Range 4 Shooter hits the enemy for many Turns before a melee Unit gets near it, and Range has only 1 Power Point for each Square. A Ranged Unit with Entangle hits the nearest enemy in each Turn, so that enemy has Speed 0 in each action and never gets near. On a Melee Unit, Entangle does almost nothing, because the enemy that it hits is already next to it.

We decided:

- **No Unit has a Range of more than 3.** A Shooter always has Range 3, and a Ranged Support always has Range 2. The cards with Range 4 or 5 go to Range 3, and the Power Points that they lose go back as HP, up to the Power Budget.
- **Only a Ranged Unit with Base Rank Epic or higher has Entangle.** The Common and Rare cards with Entangle get a different Keyword of their Race.
- **Entangle is not an Elf Main Keyword.** It stays an Elf Keyword on few cards, as Bleed is for Feral ([ADR-0019](0019-bleed-is-a-feral-keyword-on-two-cards.md)). The Elf Main Keywords are Regeneration, Poison and Flying.

## Considered Options

All results are the Thornwatch win rate, with 500 seeds (1000 Battles) for each Matchup. "Average" is the average against the 8 other Archetypes. Before the change: Vanguard 89.5%, Raiders 83.5%, average 87.4%.

- **An Entangle cooldown: a Unit that was Entangled in its last action cannot become Entangled again until its next action ends.** Rejected. Half of the lock is still strong against Speed 1 Units: average 86.5%, and 70.7% with Range 3. It also adds a hidden state that the Player must see.
- **Only a melee attack applies Entangle.** Rejected. It removes the lock (average 64.3% with Range 3), but the Keyword then does almost nothing on any card.
- **A higher price for Entangle in the Power Points.** Rejected. Mosspitcher Lookout at 2/4 with Entangle at 6 points still had an average of 75.5%. The value of a lock increases with each Turn that the Ranged Unit stays alive, so no fixed price is correct.
- **Range 4 only at Rare or higher.** Rejected. A Range cut from 4 to 3 changed Thornwatch by about 15 points, and Raiders Full against Vanguard by about 18 points, but the Power Points see only 1 point. One Range for each Role is easier to read and to balance.

The rules alone were not sufficient. With them and with Elf cards near the low end of their budget, Thornwatch wins 57.0% against Vanguard and 49.5% against Raiders, and 61.1% on average against the 8 other Archetypes (1000 seeds). We accept the average, because Vanguard Full, which loses to almost all Decks, causes most of it.

## Consequences

- The Power Points of Range no longer make a difference between Shooters, because each Shooter has Range 3.
- A Range cut is worth more than its 1 Power Point. The Rare Shooters thus go to about +8% of their budget, and Human Heavy is still 4 to 8 points weaker than before.
