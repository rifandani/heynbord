# A higher Base Rank gives a Power Budget bonus

[ADR-0020](0020-the-power-budget-measures-a-card-at-its-base-rank.md) measures a Card at its Base Rank, but it gives every Base Rank the same Power Budget. A copy of a Base Rank Common card at Rare is stronger than a Rare copy of a Base Rank Rare card of the same Countdown, because the Common card gets the Rare scale on a printed line that was fitted to the flat budget. This ADR gives each higher Base Rank a written budget bonus, and it adds a pairwise check at the same copy Rank. It supersedes ADR-0020.

## The rule

The Power Budget is:

```text
budget = (19 + 3 × (Countdown − 3)) × baseRankBonus
```

The first fit is:

| Base Rank | Bonus |
| --- | --- |
| Common | ×1.0 |
| Uncommon | ×1.1 |
| Rare | ×1.4 |
| Epic | ×1.5 |
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

The Legendary cards have no Base Rank Common card of their Countdown, so the pairwise reference is the Power Budget of the copy Rank. The script fits ×1.5636 for Legendary. The first fit ×1.7 is above it, so a Legendary card can pass the pairwise rule; the current lines are still written exceptions. The first fit is lower than the fitted table for Uncommon, Rare and Epic. That is on purpose: the full rebalance to the fitted table is a separate, large change. The script fits the Creature Cards. The Skill Cards use the same table and the content test, and a Skill Card with no main amount cannot move to a higher amount: it stays a written exception.

## The deferred rebalance

The full rebalance to the first-fit table changes the printed line of every Uncommon, Rare, Epic and Legendary card. It also changes the Stage, Dungeon and Floor enemies and the Main Matchups. It is not in this change. The simulation gate wins over the content test (GDD 13), so the cards that keep their old line are written exceptions in `POWER_BUDGET_EXCEPTIONS` in `packages/rules/src/content/content.unit.test.ts`. A card leaves the list when a tuning pass brings it to the new budget and the pairwise rule.

The Main Matchups, the Stages, the Dungeons, the Floors and the economy simulation pass with the old lines. The full rebalance is a follow-up issue.

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

- `human.dawnCleric` — band −13.9%; pairwise uncommon/rare/epic/legendary
- `human.riverKnight` — band −17.4%; pairwise uncommon/rare/epic/legendary
- `human.gateWarden` — pairwise uncommon/rare/epic/legendary
- `human.bridgePikeman` — pairwise uncommon/rare/epic
- `human.bannerChaplain` — pairwise uncommon/rare/epic/legendary
- `orc.howlingCharger` — pairwise uncommon/rare/epic/legendary
- `orc.skyreaver` — pairwise uncommon/rare/epic/legendary
- `orc.packStalker` — band −14.8%; pairwise uncommon/rare/epic/legendary
- `orc.cinderhornBreaker` — pairwise uncommon/rare/epic/legendary
- `orc.warhowlerDrummer` — band −14.8%; pairwise uncommon/rare/epic/legendary
- `goblin.sidestepShiv` — pairwise uncommon/rare/epic/legendary
- `goblin.junkBarricade` — pairwise uncommon/rare/epic/legendary
- `goblin.bombLobber` — band −13.9%; pairwise uncommon/rare/epic/legendary
- `goblin.greaseTrapper` — pairwise uncommon/rare/epic/legendary
- `goblin.rocketBarrelRider` — pairwise uncommon/rare/epic/legendary
- `feral.boulderTortoise` — pairwise uncommon/rare/epic/legendary
- `feral.tailsweepBasilisk` — band −13.9%; pairwise uncommon/rare/epic/legendary
- `feral.caveTroll` — band −13.9%; pairwise uncommon/rare/epic/legendary
- `feral.cragRhino` — pairwise uncommon/rare/epic/legendary
- `feral.frostElkMatriarch` — pairwise uncommon/rare/epic/legendary
- `elf.gladeTurnblade` — band −13.9%; pairwise uncommon/rare/epic/legendary
- `elf.canopySkirmisher` — band −13.9%; pairwise uncommon/rare/epic/legendary
- `elf.thornlineArcher` — pairwise uncommon/rare/epic/legendary
- `elf.dewkeeper` — band −13.9%; pairwise uncommon/rare/epic/legendary
- `elf.brambleNest` — pairwise uncommon/rare/epic/legendary
- `undead.backwatchBailiff` — band −14.8%; pairwise uncommon/rare/epic/legendary
- `undead.chatteringCohort` — pairwise uncommon/rare/epic/legendary
- `undead.paleGalloper` — band −14.8%; pairwise uncommon/rare/epic/legendary
- `undead.rimeEyeReaper` — pairwise uncommon/rare/epic/legendary
- `undead.ossuaryPiper` — pairwise uncommon/rare/epic/legendary
- `warrior.warDrums` — cap −27.3%; off step; pairwise uncommon/rare/epic
- `warrior.cleave` — off step; pairwise uncommon/rare/epic/legendary
- `warrior.groundSlam` — cap −29.2%; off step; pairwise uncommon/rare
- `ranger.longShot` — off step; pairwise uncommon/rare/epic
- `ranger.barbedArrow` — off step; pairwise uncommon/rare/epic/legendary
- `ranger.skybreaker` — off step; pairwise uncommon/rare/epic
- `mage.flameWave` — cap −28.9%; off step; pairwise uncommon/rare/epic/legendary
- `mage.frostWave` — pairwise uncommon
- `mage.arcLightning` — off step; pairwise uncommon/rare/epic/legendary
- `priest.sanctuary` — off step; pairwise uncommon/rare/epic/legendary
- `priest.penance` — pairwise uncommon/rare/epic/legendary
- `priest.prayerOfHealing` — cap −36.8%; off step; pairwise uncommon/rare/epic/legendary

**Rare (26)**

- `human.kingsCourier` — band −35.1%; pairwise rare/epic/legendary
- `human.paviseArbalist` — band −25.3%; pairwise rare/epic/legendary
- `human.dawnReliquary` — band −28.6%; pairwise rare/epic/legendary
- `orc.ashspitHunter` — band −25.3%; pairwise rare/epic/legendary
- `orc.mesaPitFighter` — band −35.1%; pairwise rare/epic/legendary
- `orc.pyreaxeRavager` — band −25.7%; pairwise rare/epic/legendary
- `goblin.mineSapper` — band −31.8%; pairwise rare/epic/legendary
- `goblin.spyglassSniper` — band −25.3%; pairwise rare/epic/legendary
- `goblin.junkWalker` — band −31.8%; pairwise rare/epic/legendary
- `feral.avalancheYeti` — band −28.6%; pairwise rare/epic/legendary
- `feral.woollyMammoth` — band −31.4%; pairwise rare/epic/legendary
- `feral.rimebreathDrake` — band −31.4%; pairwise rare/epic/legendary
- `elf.amberwingDart` — band −28.6%; pairwise rare/epic/legendary
- `elf.elderreedDartmaster` — band −25.3%; pairwise rare/epic/legendary
- `elf.seedwindShepherd` — band −35.1%; pairwise rare/epic/legendary
- `undead.coffinLancer` — band −33.0%; pairwise rare/epic/legendary
- `undead.winterMaw` — band −24.8%; pairwise rare/epic/legendary
- `undead.lanternWidow` — band −34.2%; pairwise rare/epic/legendary
- `warrior.callToArms` — cap −38.3%; off step; pairwise rare/epic/legendary
- `warrior.exposeWeakness` — cap −40.2%; off step; pairwise rare/epic/legendary
- `ranger.venomArrow` — cap −39.3%; off step; pairwise rare/epic/legendary
- `ranger.huntersFocus` — cap −46.1%; off step; pairwise rare/epic/legendary
- `mage.wildfire` — cap −34.4%; off step; pairwise rare/epic/legendary
- `mage.thunderstorm` — cap −30.9%; off step; pairwise rare/epic/legendary
- `priest.cleanse` — cap −45.9%; off step; pairwise rare/epic/legendary
- `priest.unbrokenVow` — cap −46.4%; pairwise rare/epic/legendary

**Epic (16)**

- `human.ironBulwark` — band −35.7%; pairwise epic/legendary
- `human.marshalElianVoss` — band −30.9%; pairwise epic/legendary
- `orc.warchiefGrukka` — band −30.9%; pairwise epic/legendary
- `orc.warbandStandardBearer` — band −30.9%; pairwise epic/legendary
- `goblin.grandGearjammer` — band −33.3%; pairwise epic/legendary
- `goblin.bossSnikkit` — band −33.3%; pairwise epic/legendary
- `feral.mountainColossus` — band −35.7%; pairwise epic/legendary
- `feral.oldFrostmaw` — band −30.9%; pairwise epic/legendary
- `elf.canopyVinewarden` — band −38.7%; pairwise epic/legendary
- `elf.lethielFirstGardener` — band −38.7%; pairwise epic/legendary
- `undead.sirOdoLastTaxman` — band −33.3%; pairwise epic/legendary
- `undead.boneRampart` — band −29.8%; pairwise epic/legendary
- `warrior.onslaught` — cap −31.7%; pairwise epic/legendary
- `ranger.rainOfArrows` — cap −42.4%; off step; pairwise epic/legendary
- `mage.blizzard` — cap −40.7%; off step; pairwise epic/legendary
- `priest.aegisOfDawn` — cap −54.3%; off step; pairwise epic/legendary

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
