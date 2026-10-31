---
status: accepted
---

# A Replay keeps the original Hero appearance

Current Replay rendering uses the viewer's Active Hero portrait, so a
shared Battle can show a different person from the original Battle.
New Replays will save the Player's portrait and Gear look IDs at Battle
start, and the Battle Log will use that same appearance. Older Replays
without those IDs will use Standard portrait and Standard kit.

The viewer's own active selections stay separate. This makes a shared
Replay show the original Hero identity instead of changing with each
viewer. The appearance changes presentation only: Battle outcomes still
come from the existing rules, seed and Commands.

The Replay uses the current art for its saved IDs; it does not keep old
model files. Each ID must be a known Cosmetic of the correct family.
An unknown or wrong-family ID uses that family's Standard look. Viewing
another Player's Cosmetic grants no ownership and does not make it active.
Existing Replay links remain readable.

See the accepted choices and implementation status in
[Hero Models](../../../../docs/game/21-hero-models.md).
