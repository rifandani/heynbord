# Nothing heals a Hero

The Priest Class has a heal Skill Card, *Mend*, and in most card games a priest also heals its own hero. We decided that nothing heals a **Hero**: no Skill Card, no Keyword and no other effect. In a Battle, Hero HP only goes down. A heal can target a **Unit** only.

We did this because Hero HP is the clock of a Battle. Each Stage is tuned on the Hero HP of the player level and on how fast each Archetype takes it down ([14 — Campaign Stages](../game/14-campaign-stages.md)). A Hero heal makes Battles longer, it makes Hero damage weaker (Long Shot, Runners and Sudden Death), and it gives Priest a stall plan that no other Class can answer. Bleeding, the counter to heals ([ADR-0019](./0019-bleed-is-a-feral-keyword-on-two-cards.md)), is a Status on a Unit, so it cannot counter a Hero heal.

## Considered Options

- **A Priest Skill Card that heals the caster's Hero.** Rejected, for the reasons above.
- **A Hero heal with a limit (for example, never above the Hero HP at the start of the Battle, or one time in each Battle).** Rejected. A limit keeps the stall plan smaller, but each Stage still needs a new tuning, and the rule is harder to read.

## Consequences

- Priest protects its Hero only through its Units: it heals them (*Mend*) and gives them a **Ward** (*Sanctuary*), so that they stop the enemy before it reaches the Hero.
- A later card, Keyword, Gear or Dungeon rule that heals a Hero must replace this ADR, and the Stage simulation must run again.
