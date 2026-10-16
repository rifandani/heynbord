# Heynspire Floors come from templates and a strength curve

Heynspire has 50 Floors (GDD 8.2). A Stage is written by hand: its Deck, Hero HP, Gear and Start Units, and the sim tunes each Stage alone. For 50 Floors, that is the work of 5 Regions. We decided that a pure function makes each Floor from a **Floor template** and a **strength curve**. A template is written by hand: an enemy name, a Class and a Deck of Base Rank copies from the Campaign card pool. The curve gives the Rank steps, the Hero HP, the Gear and the Deck size for the Floor number. Floor *n* is always the same Floor. The sim tunes the few curve values, not 50 Decks.

The difficulty does not go up from Floor 1 to Floor 50, as in the Regions. Each Floor has the target of a normal Stage (60% to 80%), and each 10th Floor (a **Boss Floor**) has the target of a Boss Stage (30% to 50%). Each Floor must hit its target at its Recommended level, with no Gear and with the Expected Gear (ADR-0034). Thus the climb stays open to a Player on the First-try Path, and the Legendary Forge Stones of the Boss Floors (ADR-0039) stay reachable.

## Considered Options

- **50 Floors written by hand, as in `stages.ts`.** Rejected: it is the work of 5 Regions, and each Floor needs its own tuning.
- **Random Floors at run time.** Rejected: the Battle must be the same for the same seed (ADR-0006), and the sim cannot check a Floor that changes.
- **The difficulty goes up faster than the Player.** Rejected for v1: the last Floors become a wall that needs Dungeon 3 and Gear 20 or more. The economy sim models the climb at the normal target.
- **A slope only on Floors 41 to 50.** Rejected for now: we can add it later with a change to the curve only.

## Consequences

- A template has its own cards. A change to a Stage Deck does not change a Floor.
- A content test checks each generated Floor: each copy is at its Base Rank or higher, each card is in the Campaign card pool, and the Deck size is legal at the Recommended level.
- `sim floor` plays all 50 Floors, and `rules:sim:check` in CI fails when a Floor is not on its target.
- The economy sim models each Boss Floor at the Boss target, not at the normal target.
