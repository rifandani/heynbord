# A higher Base Rank gives a Power Budget bonus

[ADR-0020](0020-the-power-budget-measures-a-card-at-its-base-rank.md) measures a Card at its Base Rank, but it gives every Base Rank the same Power Budget. A copy of a Base Rank Common card at Rare is stronger than a Rare copy of a Base Rank Rare card of the same Countdown, because the Common card gets the Rare scale on a printed line that was fitted to the flat budget. This ADR gives each higher Base Rank a written budget bonus, and it adds a pairwise check at the same copy Rank. It supersedes ADR-0020.

## The rule

The Power Budget is:

```text
budget = (19 + 3 × (Countdown − 3)) × baseRankBonus
```

The table is:

| Base Rank | Bonus |
| --- | --- |
| Common | ×1.0 |
| Uncommon | ×1.25 |
| Rare | ×1.4463 |
| Epic | ×1.6529 |
| Legendary | ×1.7 |

`powerBudget(countdown, baseRank)` returns the budget with the bonus. A Common Base Rank card keeps the old budget. `creaturePower` and `skillPower` still measure a Card at its Base Rank, and they take an optional Rank so that a copy can be measured at another Rank.

## The pairwise rule

For each card kind, Countdown and playable Rank, a copy of a higher Base Rank card must have at least the power of the strongest Base Rank Common copy of the same kind and Countdown at that Rank. A Countdown with no Base Rank Common card uses the Power Budget of that Rank as the reference.

The content test checks the rule and names the card ID, the Rank and the reference card. The rule covers Creature Cards and Skill Cards. The Skill Card check keeps the nearest-step rule and the ±25% cap, applied at the new budget.

## The fitted table

`packages/rules/scripts/fit-base-rank-budget.ts` fits the smallest table for the Creature Cards that passes the pairwise rule. With the current card lines it prints:

| Base Rank | Fitted bonus |
| --- | --- |
| Common | ×1.0 |
| Uncommon | ×1.25 |
| Rare | ×1.4463 |
| Epic | ×1.6529 |
| Legendary | ×1.5636 |

The Legendary cards have no Base Rank Common card of their Countdown, so the pairwise reference is the Power Budget of the copy Rank. The script fits ×1.5636 for Legendary. The fit is below Epic, so the table keeps the first-fit ×1.7 for Legendary and the bonus never falls as the Base Rank rises. A Legendary card still passes the pairwise rule at ×1.7. The first fit is lower than the fitted table for Uncommon, Rare and Epic. That is on purpose: the fitted table is the smallest table that lets every Creature Card meet the ±10% band and the pairwise rule with a legal Attack and HP line. The script fits the Creature Cards. The Skill Cards use the same table and the content test.

## The deferred rebalance

The full rebalance to the fitted table was tried. It changes the printed line of every Uncommon, Rare, Epic and Legendary card, and it changes the Stage, Dungeon and Floor enemies and the Main Matchups. The 15 Main pairs leave 45% to 55%, and hundreds of campaign rows leave their target: a single boss card such as Warchief Grukka in Stage 2-10 is enough to make the row unwinnable. The simulation gate wins over the content test (GDD 13), so the cards keep their old line and are written exceptions in `POWER_BUDGET_EXCEPTIONS` in `packages/rules/src/content/content.unit.test.ts`. A card leaves the list when a tuning pass brings it to the new budget, the pairwise rule and the simulation gate.

The Main Matchups, the Stages, the Dungeons, the Floors and the economy simulation pass with the old lines. The full rebalance needs a new set of Main Archetypes and campaign Decks, and it is a follow-up issue.

### The written exceptions

The content test fails if a listed card starts to pass, so the list cannot grow stale. The reasons use these words:

- `band N%` is the difference from the ±10% band of a Creature Card.
- `cap N%` is the difference from the ±25% cap of a Skill Card.
- `off step` is a Skill Card whose main amount is not the nearest step to its budget.
- `pairwise RANKS` is a copy that is weaker than the strongest Copy of a Common card of the same kind and Countdown at those Ranks.

The 100 written exceptions are:

**Common Skill Cards (10)**

- `warrior.spearThrow` — cap −28.1%; off step
- `warrior.shoulderCharge` — cap −56.9%; off step
- `warrior.shieldBash` — off step
- `ranger.quickShot` — off step
- `mage.fireball` — off step
- `mage.frostBolt` — off step
- `priest.mend` — off step
- `priest.smite` — off step
- `priest.blessingOfLight` — cap −44.6%; off step
- `priest.radiantStrike` — off step

**Uncommon (42)**

- `human.dawnCleric` — band −24.2%; pairwise uncommon/rare/epic/legendary
- `human.riverKnight` — band −27.3%; pairwise uncommon/rare/epic/legendary
- `human.gateWarden` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `human.bridgePikeman` — band −20.0%; pairwise uncommon/rare/epic
- `human.bannerChaplain` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `orc.howlingCharger` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `orc.skyreaver` — band −15.8%; pairwise uncommon/rare/epic/legendary
- `orc.packStalker` — band −25.0%; pairwise uncommon/rare/epic/legendary
- `orc.cinderhornBreaker` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `orc.warhowlerDrummer` — band −25.0%; pairwise uncommon/rare/epic/legendary
- `goblin.sidestepShiv` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `goblin.junkBarricade` — band −15.0%; pairwise uncommon/rare/epic/legendary
- `goblin.bombLobber` — band −24.2%; pairwise uncommon/rare/epic/legendary
- `goblin.greaseTrapper` — band −15.8%; pairwise uncommon/rare/epic/legendary
- `goblin.rocketBarrelRider` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `feral.boulderTortoise` — band −15.8%; pairwise uncommon/rare/epic/legendary
- `feral.tailsweepBasilisk` — band −24.2%; pairwise uncommon/rare/epic/legendary
- `feral.caveTroll` — band −24.2%; pairwise uncommon/rare/epic/legendary
- `feral.cragRhino` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `feral.frostElkMatriarch` — band −15.8%; pairwise uncommon/rare/epic/legendary
- `elf.gladeTurnblade` — band −24.2%; pairwise uncommon/rare/epic/legendary
- `elf.canopySkirmisher` — band −24.2%; pairwise uncommon/rare/epic/legendary
- `elf.thornlineArcher` — band −20.0%; pairwise uncommon/rare/epic/legendary
- `elf.dewkeeper` — band −24.2%; pairwise uncommon/rare/epic/legendary
- `elf.brambleNest` — band −15.8%; pairwise uncommon/rare/epic/legendary
- `undead.backwatchBailiff` — band −25.0%; pairwise uncommon/rare/epic/legendary
- `undead.chatteringCohort` — band −15.0%; pairwise uncommon/rare/epic/legendary
- `undead.paleGalloper` — band −25.0%; pairwise uncommon/rare/epic/legendary
- `undead.rimeEyeReaper` — band −15.0%; pairwise uncommon/rare/epic/legendary
- `undead.ossuaryPiper` — band −15.0%; pairwise uncommon/rare/epic/legendary
- `warrior.warDrums` — cap −36.0%; off step; pairwise uncommon/rare/epic
- `warrior.cleave` — cap −28.4%; off step; pairwise uncommon/rare/epic/legendary
- `warrior.groundSlam` — cap −37.7%; off step; pairwise uncommon/rare
- `ranger.longShot` — off step; pairwise uncommon/rare/epic
- `ranger.barbedArrow` — cap −29.3%; off step; pairwise uncommon/rare/epic/legendary
- `ranger.skybreaker` — cap −32.2%; off step; pairwise uncommon/rare/epic
- `mage.flameWave` — cap −37.5%; off step; pairwise uncommon/rare/epic/legendary
- `mage.frostWave` — off step; pairwise uncommon
- `mage.arcLightning` — cap −33.9%; off step; pairwise uncommon/rare/epic/legendary
- `priest.sanctuary` — cap −31.8%; off step; pairwise uncommon/rare/epic/legendary
- `priest.penance` — pairwise uncommon/rare/epic/legendary
- `priest.prayerOfHealing` — cap −44.4%; off step; pairwise uncommon/rare/epic/legendary

**Rare (26)**

- `human.kingsCourier` — band −37.1%; pairwise rare/epic/legendary
- `human.paviseArbalist` — band −27.7%; pairwise rare/epic/legendary
- `human.dawnReliquary` — band −30.9%; pairwise rare/epic/legendary
- `orc.ashspitHunter` — band −27.7%; pairwise rare/epic/legendary
- `orc.mesaPitFighter` — band −37.1%; pairwise rare/epic/legendary
- `orc.pyreaxeRavager` — band −28.1%; pairwise rare/epic/legendary
- `goblin.mineSapper` — band −34.0%; pairwise rare/epic/legendary
- `goblin.spyglassSniper` — band −27.7%; pairwise rare/epic/legendary
- `goblin.junkWalker` — band −34.0%; pairwise rare/epic/legendary
- `feral.avalancheYeti` — band −30.9%; pairwise rare/epic/legendary
- `feral.woollyMammoth` — band −33.6%; pairwise rare/epic/legendary
- `feral.rimebreathDrake` — band −33.6%; pairwise rare/epic/legendary
- `elf.amberwingDart` — band −30.9%; pairwise rare/epic/legendary
- `elf.elderreedDartmaster` — band −27.7%; pairwise rare/epic/legendary
- `elf.seedwindShepherd` — band −37.1%; pairwise rare/epic/legendary
- `undead.coffinLancer` — band −35.2%; pairwise rare/epic/legendary
- `undead.winterMaw` — band −27.2%; pairwise rare/epic/legendary
- `undead.lanternWidow` — band −36.3%; pairwise rare/epic/legendary
- `warrior.callToArms` — cap −40.3%; off step; pairwise rare/epic/legendary
- `warrior.exposeWeakness` — cap −42.1%; off step; pairwise rare/epic/legendary
- `ranger.venomArrow` — cap −41.2%; off step; pairwise rare/epic/legendary
- `ranger.huntersFocus` — cap −47.8%; off step; pairwise rare/epic/legendary
- `mage.wildfire` — cap −36.5%; off step; pairwise rare/epic/legendary
- `mage.thunderstorm` — cap −33.1%; off step; pairwise rare/epic/legendary
- `priest.cleanse` — cap −47.6%; off step; pairwise rare/epic/legendary
- `priest.unbrokenVow` — cap −48.1%; pairwise rare/epic/legendary

**Epic (16)**

- `human.ironBulwark` — band −41.7%; pairwise epic/legendary
- `human.marshalElianVoss` — band −37.3%; pairwise epic/legendary
- `orc.warchiefGrukka` — band −37.3%; pairwise epic/legendary
- `orc.warbandStandardBearer` — band −37.3%; pairwise epic/legendary
- `goblin.grandGearjammer` — band −39.5%; pairwise epic/legendary
- `goblin.bossSnikkit` — band −39.5%; pairwise epic/legendary
- `feral.mountainColossus` — band −41.7%; pairwise epic/legendary
- `feral.oldFrostmaw` — band −37.3%; pairwise epic/legendary
- `elf.canopyVinewarden` — band −44.3%; pairwise epic/legendary
- `elf.lethielFirstGardener` — band −44.3%; pairwise epic/legendary
- `undead.sirOdoLastTaxman` — band −39.5%; pairwise epic/legendary
- `undead.boneRampart` — band −36.3%; pairwise epic/legendary
- `warrior.onslaught` — cap −38.0%; pairwise epic/legendary
- `ranger.rainOfArrows` — cap −47.7%; off step; pairwise epic/legendary
- `mage.blizzard` — cap −46.2%; off step; pairwise epic/legendary
- `priest.aegisOfDawn` — cap −58.5%; off step; pairwise epic/legendary

**Legendary (6)**

- `human.serAldricStonewall` — band −37.0%; pairwise legendary
- `orc.ashcallerGrosh` — band −37.0%; pairwise legendary
- `goblin.grixRatwhistle` — band −41.2%; pairwise legendary
- `feral.gorehornRedMaw` — band −37.0%; pairwise legendary
- `elf.wardenSaelith` — band −38.8%; pairwise legendary
- `undead.paleCantorYsolde` — band −39.1%; pairwise legendary

## Considered Options

- **Check every Rank that a copy can have, and change the cards.** Rejected for now. Many cards fail at higher Ranks because the Rank scale gives power on purpose, and the full rebalance moves the Stage, Dungeon and Floor enemies and the Main Matchups. It is the follow-up issue.
- **Give each Base Rank a budget bonus, and keep the old lines as exceptions.** Chosen. The rule is in the content test, the simulation stays the gate, and the exception list shows the work that remains.
- **Change the comparison rule to the Base Rank line.** Rejected. The deck builder shows each copy at its own Rank, so the comparison must use that Rank.

## Consequences

- `powerBudget` takes a Countdown and a Base Rank. Every caller passes the Base Rank.
- `creaturePower` and `skillPower` take an optional Rank. The content test and the fit script use it to measure a copy at another Rank.
- The Specialist stays stronger than the 2 Epic cards of its Race (ADR-0054).
- The UI does not change. The deck builder already shows the copy at its Rank.
- The `Power Budget` glossary entry uses the new rule and links to this ADR.
- The written exceptions are in this ADR and in `POWER_BUDGET_EXCEPTIONS`. The content test fails if the 2 lists differ, or if a listed card starts to pass.
- The tuning log in [08 — Archetypes](../game/08-archetypes.md) records the change and the simulation result.
