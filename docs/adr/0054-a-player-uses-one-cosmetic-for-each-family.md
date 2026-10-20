# A Player uses one Cosmetic for each family

The Bazaar sells 25 Cosmetics in 4 families, and play gives 8 more (Economy 3.5, ADR-0008). A purchase only added the ID to the Player's owned list. Nothing recorded which look the Player uses, and the game drew one Card Back for all cards. Thus a Player could buy a Card Back and never see it. The Player also needs a way back to the look without a Cosmetic.

## Decision

- **One Active Cosmetic for each family.** The Player has at most one Active Cosmetic of each family, and the game shows it wherever that family appears. The unit is the Player, not the Deck: a Card Back is not part of a Deck, and the Player's Deck Slots share one look.
- **Only an owned Cosmetic can be Active.** `selectCosmetic` refuses an ID that the Player does not own, and an ID that is not a Bazaar item. An active look never comes from a purchase that the Player did not make.
- **The Standard look is free and is not a Cosmetic.** Each family has a Standard look that costs nothing and that every Player has. It is not in the catalog, so the Bazaar keeps 25 items and 2,760 Heynstones, and the "own every Cosmetic" goals never wait for it. The Standard look of the Card Back family is the **Standard Back**.
- **The selection is in the Profile.** `activeCosmetics` holds the ID of each family, and Profile version 14 adds it. A family with no ID shows its Standard look. The Game Dev Panel overlay and the export keep the field.
- **Every face-down card of the Player shows the Active Card Back.** That is the Deck Pile, the Pack reveal and the Fuse panel. The enemy Side keeps the Standard Back: it is not the Player's Deck.
- **The Player changes the look in the Bazaar.** The Card Backs section shows a shelf with the look at the size of a card, a thumbnail on each plate, and **Use** on each owned look. The Hero portraits section does the same with a portrait at the size of the Hero plate. There is no new screen and no new Town Bar shortcut.
- **The Hero portrait shows on the Hero screen, in the Top Bar and on the Player banner on the Board.** The Player's Hero is the Player: one painted face serves all 4 Classes, and the Class stays on its name, its glyph and the Standard portrait. The enemy Side keeps its Class glyph. The 7 portraits are hidden from the Bazaar until their face is painted, so the Bazaar never offers a look that the Player cannot see.

## Considered Options

- **One Card Back for each Deck Slot.** Rejected for v1. A Card Back changes no rule, and a Deck Slot is a rules object. It adds a field to each slot, a choice in the Deck builder, and a different back in each Deck Pile. It can come later, on top of the Active Cosmetic: a Deck Slot with no Card Back would show the Active one.
- **The Standard look as a free Cosmetic.** Rejected. It enters the catalog, the owned list and the "all Cosmetics" goals, and it changes the 25 items and the 2,760 Heynstones of Economy 3.5.
- **A Looks screen for the 4 families.** Rejected for now. The Bazaar already holds the shelf and the Use, and the Town Bar already has 12 shortcuts. The screen would be half empty, because the Gear looks and the Board skins cannot show yet. The Bazaar takes the same parts when those 2 families can show.
- **Equipping from the item plate only, with no preview.** Rejected. A 36px glyph does not tell the Player what they buy. The shelf shows the look before the purchase and before the Use.
- **Auto-use after a purchase.** Rejected. A purchase changes what the Player owns, not what they use. The Player chooses the look.

## Consequences

- The rules add `selectCosmetic`, `selectStandardLook` and `activeCosmetic`, and the `activeCosmetics` field. Profile version 14 adds the field with no selection, so an old save shows the Standard look of each family.
- The rules and web glossaries define **Active Cosmetic**, **Standard look** and **Standard Back**. The web **Card Back** entry names the Active Cosmetic.
- The 8 Card Back faces are paintings ([Cosmetic Concepts](../game/16-cosmetic-concepts.md)). A Card Back with no file shows the Standard Back and the Bazaar does not offer it, so the game never sells a look that the Player cannot see.
- The 7 Hero portrait faces are paintings ([Hero Portrait Concepts](../game/17-hero-portrait-concepts.md)). A Hero portrait with no file shows the Standard portrait, and the Bazaar does not offer it: the section shows only the Standard portrait until the first face lands. The rules do not change, because `activeCosmetics.heroPortrait` was already in Profile version 14.
- The 8 earn-only Cosmetics have no family in the catalog. They cannot be Active until the catalog gives each one a family, which the Earn-only list must do before those looks show in the game.
- A new family adds its preview to the same section. The selection model does not change.
