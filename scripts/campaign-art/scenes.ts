/**
 * The look of each Region Map, in a few words: the land, the road, the ground
 * of the clearings and the Boss landmark. The base painting prompt puts it
 * with the palette and the time of the Region in
 * `docs/game/12-region-concepts.md`. Add an entry here when you add a Region
 * there: `bun campaign:prompts` fails without it.
 */
export interface Scene {
  readonly land: string;
  /** The road that follows the path of the layout sketch. */
  readonly road: string;
  /** The ground of the 10 empty patches on the road. */
  readonly clearing: string;
  /** The Boss landmark, in the place of the brown house of the sketch. */
  readonly boss: string;
  /** The mood, if the Region is not only bright, warm and a little funny. */
  readonly mood?: string;
}

export const SCENE = new Map<string, Scene>(
  Object.entries({
    hearthvale: {
      land: "a green farm valley with yellow fields, small woods, a blue stream and soft hills",
      road: "one sandy dirt road",
      clearing: "short grass",
      boss: "on the hill, a big fortified wooden hall with a palisade, with a roof in the shape of a giant hat with a feather",
    },
    thornwood: {
      land: "a deep old forest of giant trees, moss and thorn hedges, seen from above, with small open glades",
      road: "one mossy forest road of roots",
      clearing: "moss",
      boss: "on the hill, a huge old tree giant asleep on a mound of brambles, with a sleepy face in the bark and one eye half open",
    },
    "hollow-marches": {
      land: "wide misty marshes with reeds, pools, old dead trees and a few dry hills",
      road: "one road of old stones at the bottom left, then wooden boardwalks over the water, then a stone causeway to the island",
      clearing: "dry grass",
      boss: "on an island, a castle of pale bone-white stone with thin towers, violet banners and soft green light in the windows",
      mood: "strange but not scary",
    },
  })
);
