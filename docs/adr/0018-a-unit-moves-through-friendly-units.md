# A Unit moves through friendly Units

In its **Movement**, a ground Unit moves through the Units of its own Side, also a friendly Wall. Each friendly Square uses 1 Square of Speed, and the Unit stops in the farthest empty Square that its Speed reaches, the same as Flying. An enemy Unit still stops it. Before, a ground Unit stopped before any Unit (GDD 4.5). We did this because a slow or stopped friendly Unit blocked a fast Unit for many Turns, and a friendly Wall closed the Lane to its own Side for the full Battle.

## Considered Options

- **Pass all Units.** Rejected. Enemy Units must block a Lane, or Frontliners and Walls have no job. Flying stays the only way past an enemy Unit.
- **Swap with the friendly Unit in front.** Rejected. It moves a Unit that did not act.
- **Friendly Squares use no Speed.** Rejected. A Unit can then jump through a full Lane.
- **The faster Unit acts first in a Lane, or all Units move before all Units attack.** Rejected. The front Unit still acts first (GDD 4.4). These options change a central rule, the attack order, the tests, the bot playtests and the Battle animation.

## Consequences

- Because the front Unit acts first, a Speed 2 Unit directly behind a friendly Speed 1 Unit does not pass it when both can move. The friendly Unit moves first, and the gap closes. A Unit passes a friendly Unit that does not move (a Wall, a Frozen or Entangled Unit, a Ranged Unit with a target, or a Pivot Unit that holds), or a friendly Unit that is much slower. A friendly melee Unit that fights has the enemy Unit directly in front of it, so no Unit can pass it.
- A push is not Movement, so Knockback still stops before any Unit.
- "Friendly" is the Side, so a Unit also moves through the Units of an ally Hero.
- Ground Runners become stronger and Flying becomes less special. The Keyword points do not change now.
- In the Battle, a ground Unit that walks through a friendly Unit steps a little toward the camera, so that it shows in front.
