/**
 * The 7 Hero portraits of v1 (Economy 3.5) and their faces (Hero Portrait
 * Concepts 1 and 3). The order is the order of the Bazaar and of the prompts.
 */
export interface HeroPortraitConcept {
  /** The item key: `heroPortrait.<key>` is the Cosmetic ID. */
  readonly key: string;
  readonly name: string;
  /** The export file in `apps/web/public/hero-portraits/`. */
  readonly file: string;
  /** The sentences of the brief that the prompt uses. */
  readonly brief: readonly string[];
}

export const HERO_PORTRAITS: readonly HeroPortraitConcept[] = [
  {
    key: "dawnGaze",
    name: "Dawn Gaze",
    file: "dawn-gaze",
    brief: [
      "A young scout who watched the sunrise from a ridge: a narrow face, amber eyes, a small scar on one brow and a thin braid at the temple.",
      "A sun-bleached cream hood (#f3e2c0) pushed back on the shoulders, over a warm orange tunic (#d97a3a), with a thin leather cord at the neck.",
      "Palette: peach, gold (#e9c46a) and cream, with a dark warm brown in the hood shadow. The first sun, low from the upper left, on the cheek and the brow.",
    ],
  },
  {
    key: "verdantCrest",
    name: "Verdant Crest",
    file: "verdant-crest",
    brief: [
      "A ranger of the deep woods, weathered and quiet: a long face, green-grey eyes, wind-burnt skin and a short beard with a few pale strands.",
      "A moss-green scarf (#4c6b3c), a leather jerkin and a shoulder crest of 3 leaves and 2 long feathers in bronze (#a87c3e) and cream. The crest is a shape, not a device.",
      "Palette: moss green, bronze and cream, with a dark forest green. A soft light through leaves, from the upper left.",
    ],
  },
  {
    key: "mesaShade",
    name: "Mesa Shade",
    file: "mesa-shade",
    brief: [
      "A desert traveler who knows the heat: only the eyes and the brow show, dark eyes, strong brows, sun-dark skin, and a sand veil over the lower face.",
      "A wide-brim hat of pale straw with a red band, a cream sand veil and a dark red shawl (#b5533a).",
      "Palette: red rock, sand (#d9b483) and cream, with a deep violet in the shade (#3a2a4a). Harsh sun from the upper left, half of the face in deep shade.",
    ],
  },
  {
    key: "saltWind",
    name: "Salt Wind",
    file: "salt-wind",
    brief: [
      "An old sailor who came back from one more voyage: a broad face, sea-grey eyes, deep lines, a small smile, cropped grey hair and a short grey beard.",
      "A dark blue coat (#2f5d73) with a salt-crusted collar (#f2ede0), a rope necklace (#c8a06a) with a shell, and a wool cap pushed back.",
      "Palette: sea blue, white and rope tan, with a dark navy. A clear cold light from the upper left, with a little spray in the air.",
    ],
  },
  {
    key: "lanternKeeper",
    name: "Lantern Keeper",
    file: "lantern-keeper",
    brief: [
      "The keeper of a lighthouse or a shrine, kind and a little tired: an older face, warm brown eyes, soot on one cheek and a small burn scar on the chin.",
      "A dark leather hood (#4a3220) over a wool cowl, and a brass lantern out of frame at the lower left that lights the face from below.",
      "Palette: amber (#ffc94a), dark leather, black and a little cream in the cowl. The lantern from below left is the only strong light, with a faint cool light from the upper left.",
    ],
  },
  {
    key: "tentRings",
    name: "Tent Rings",
    file: "tent-rings",
    brief: [
      "A market trader who enjoys the deal: a round face, dark eyes, a confident grin, a gold hoop in each ear and 3 rings on the fingers that rest at the chin.",
      "A bright headscarf, a striped shawl of orange (#d97a3a) and magenta (#a83a6a), and a brass chain.",
      "Palette: orange, magenta, brass (#e9c46a) and a dark plum in the folds. Warm market light from the upper left, with a little gold bounce from below.",
    ],
  },
  {
    key: "goldCrest",
    name: "Gold Crest",
    file: "gold-crest",
    brief: [
      "A noble veteran who earned the circlet: a square face, pale grey eyes, a short silver beard and a scar through one eyebrow.",
      "A deep blue high collar (#1d2b4a) with a fur edge, a gold circlet (#e9c46a) with one dark stone, and a heavy gold chain.",
      "Palette: gold, deep blue, ivory (#f3e6c4) and a dark blue in the fur. A formal, even light from the upper left, with a gold rim on the circlet.",
    ],
  },
];
