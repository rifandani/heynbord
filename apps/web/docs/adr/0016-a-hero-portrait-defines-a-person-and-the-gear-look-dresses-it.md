---
status: accepted
---

# A Hero portrait defines a person and the Gear look dresses it

Each Hero portrait, including Standard portrait, has a full-body Hero Model
shared by the Battle and the Hero screen. The portrait sets the person;
the Active Gear look sets its sword, breastplate, amulet and small back
banner, while the face and key features such as a headscarf remain clear.
The same person and Gear serve all four Classes, with Class-specific cast
gestures, so changing the Active Deck does not require a different person
or weapon.

This extends the existing portrait and Gear look families instead of
adding a separate body selection. It replaces the icon-only boundary and
the rejection of a Hero figure in [web ADR-0013](./0013-a-gear-look-is-a-set-of-4-gear-icons.md),
and the removal of Hero presentation from the Hero screen in
[ADR-0052](../../../../docs/adr/0052-a-player-uses-one-cosmetic-for-each-family.md).
One Active Cosmetic per family and the Class on the Active Deck still
apply.

Each selected appearance has a limit of 10,000,000 bytes for its published
body, textures, animations and selected Gear assets, before HTTP
compression. Shared files count in each appearance that needs them. This
limits the complete appearance rather than only its model file.

The whole-Battle budgets in [ADR-0018](./0018-battle-budgets-allow-larger-unit-models.md) apply: less than 50,000,000 asset bytes before HTTP compression and fewer than 150 draw calls. There is no limit on the number of rigged model types: every Unit has a Unit Model, and the Hero Model is separate. The Hero ceiling is not an extra asset allowance. A Hero must be small enough to fit the total Battle budget and the existing reference-device frame-rate requirements.

The first release covers Player Heroes: seven paid portraits and one new
Human Standard character. Enemy Heroes and Dungeon Bosses keep their
current presentation. Models use the painted fantasy style, with more
face and clothing detail than current Unit Models. Small Top Bar and
catalog portraits remain painted 2D faces, with a new matching face for
Standard character. The Bazaar has one shared 3D preview that combines a
candidate portrait with active Gear, or candidate Gear with the active
person. Preview and Buy do not change the selection; Use does.

The Blender pipeline will use a shared Hero skeleton and reusable Gear
parts, with modest differences in body height and build. Every Gear look
must fit every person. Gear stays visible from level 0, and its appearance
comes from the Gear look rather than the upgrade level. Standard
character and Tent Rings, each in Standard kit and Gold
Inlay, are the first quality references. Their faces, clothing, Gear fit
and animations must be reviewed before production of the other models.

3D Heroes are enabled in the game. The art, fit, animation, loading,
input, Replay and reference-device performance checks remain required
release evidence.

The full design and current status are in
[Hero Models](../../../../docs/game/hero-models.md).
