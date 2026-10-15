# The Region Map is a 16:9 painting with code-drawn Stage Markers

The Campaign screen shows one Region Map at a time: a flat 2D painting in landscape 16:9 that fits the screen with no scrolling. The painting shows the land, the Trail and an empty clearing for each Stage. The game draws the Stage Markers, the progress line, the Region name and the Star chests on top of it. Each Stage Marker is a React Aria button. Each Region Map has its own clearing positions and road path, measured on its painting (`apps/web/src/features/campaign/region-map.ts`).

A Region with no painting yet shows a placeholder Region Map, so that the Player can play its Stages before the art exists (ADR-0036). The placeholder is a calm sage ground with a soft road under the Trail, and no landmarks. It uses the clearing positions and the road path of Hearthvale (`shownRegionMap`). A Region with no Stages in the data shows only the ground, with no Trail and no Stage Markers, and its Region banner says that it comes later (`regionStatus`). The placeholder of a Region goes away when that Region gets its entry in `REGION_MAPS`.

We did this because the game is landscape, desktop first and also on phones in landscape, and the Town and the Battle Painting already use a 16:9 painting with a 1600 × 900 code box (web ADR-0005, ADR-0007). 10 Stage Markers fit on one screen. The state of a Stage (Done, Open, Locked, best Stars) changes with the progress of the Player, and the labels need text in each language, so the art cannot contain them.

## Considered Options

- **A tall portrait map with vertical scrolling, as in many mobile map games.** Rejected. It does not fit a landscape screen, and the Player must scroll to find the next Stage.
- **A map wider than the screen, with panning.** Rejected. 10 Stages do not need the space, and panning adds input code for mouse, touch and keyboard.
- **Paint the markers and the dashed line into the art.** Rejected. The art then cannot show which Stages are done or locked, and each change of a Region needs a new painting.
- **Hide a Region with no painting, or show a "coming soon" card.** Rejected. The Stages of Region 2 exist before its painting, and the Player must be able to play them. The placeholder lets the Stages, the Region rules and the art move at different speeds.
- **Show the Hearthvale painting for a Region with no painting.** Rejected. Its landmarks (Brassbelly Hall and the Stage landmarks) are wrong for the other Regions, and the Player would think that they are back in Hearthvale.
- **One set of clearing positions for all Region Maps.** First chosen, then changed. The generated Hearthvale painting put its clearings higher than the planned positions, with the Boss clearing in the top band. Inpainting each map to fixed positions costs more than one list of positions for each map, and the frame code below checks each list on each screen shape.

## Consequences

- The positions in 12 — Region Concepts 1.1 are a target for the artist, not a fixed rule. After a painting is final, its clearing centers and the center line of its road are measured by hand and kept as its Region Map data.
- The screen does not crop the painting at fixed lines. `mapFrame` makes the painting as large as it can, keeps every Stage Marker on the screen above the Town Bar, and keeps the markers clear of the Region banner and the Star chest plate. When the painting cannot cover the screen (a very wide or a short screen), a soft copy of the same painting fills the sides. Unit tests check this for 4:3 to 21:9 and for phones in landscape.
- The progress line follows a path that is traced by hand from each painting.
- A change to the number of Stages in a Region, or to the screen layout, needs new positions and maybe new paintings.
- On the placeholder, the plain ground fills the sides of the screen, not a soft copy of a painting. The placeholder road is a wide, faint line on the Hearthvale legs, so the progress line does not float on the plain ground.
- The Hearthvale positions are only for the placeholder. When a Region gets its painting, its clearing centers and road path are measured on that painting (12 — Region Concepts, step 6), and the Stage Markers move to them. The Stage data does not change.
