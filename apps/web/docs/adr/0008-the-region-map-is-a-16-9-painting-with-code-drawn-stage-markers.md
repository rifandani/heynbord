# The Region Map is a 16:9 painting with code-drawn Stage Markers

The Campaign screen shows one Region Map at a time: a flat 2D painting in landscape 16:9 that fits the screen with no scrolling. The painting shows the land, the Trail and an empty clearing for each Stage. The game draws the Stage Markers, the progress line, the Region name and the Star chests on top of it. Each Stage Marker is a React Aria button. Each Region Map has its own clearing positions and road path, measured on its painting (`apps/web/src/features/campaign/region-map.ts`).

We did this because the game is landscape, desktop first and also on phones in landscape, and the Town and the Battle Painting already use a 16:9 painting with a 1600 × 900 code box (web ADR-0005, ADR-0007). 10 Stage Markers fit on one screen. The state of a Stage (Done, Open, Locked, best Stars) changes with the progress of the Player, and the labels need text in each language, so the art cannot contain them.

## Considered Options

- **A tall portrait map with vertical scrolling, as in many mobile map games.** Rejected. It does not fit a landscape screen, and the Player must scroll to find the next Stage.
- **A map wider than the screen, with panning.** Rejected. 10 Stages do not need the space, and panning adds input code for mouse, touch and keyboard.
- **Paint the markers and the dashed line into the art.** Rejected. The art then cannot show which Stages are done or locked, and each change of a Region needs a new painting.
- **One set of clearing positions for all Region Maps.** First chosen, then changed. The generated Hearthvale painting put its clearings higher than the planned positions, with the Boss clearing in the top band. Inpainting each map to fixed positions costs more than one list of positions for each map, and the frame code below checks each list on each screen shape.

## Consequences

- The positions in 12 — Region Concepts 1.1 are a target for the artist, not a fixed rule. After a painting is final, its clearing centers and the center line of its road are measured by hand and kept as its Region Map data.
- The screen does not crop the painting at fixed lines. `mapFrame` makes the painting as large as it can, keeps every Stage Marker on the screen above the Town Bar, and keeps the markers clear of the Region banner and the Star chest plate. When the painting cannot cover the screen (a very wide or a short screen), a soft copy of the same painting fills the sides. Unit tests check this for 4:3 to 21:9 and for phones in landscape.
- The progress line follows a path that is traced by hand from each painting.
- A change to the number of Stages in a Region, or to the screen layout, needs new positions and maybe new paintings.
