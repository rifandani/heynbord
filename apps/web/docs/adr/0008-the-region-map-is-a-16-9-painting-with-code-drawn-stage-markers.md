# The Region Map is a 16:9 painting with code-drawn Stage Markers

The Campaign screen shows one Region Map at a time: a flat 2D painting in landscape 16:9 that fits the screen with no scrolling. The painting shows the land, the Trail and an empty clearing for each Stage. The game draws the Stage Markers, the progress line, the Region name and the Star chests on top of it. Each Stage Marker is a React Aria button. All 3 Region Maps use the same clearing positions.

We did this because the game is landscape, desktop first and also on phones in landscape, and the Town and the Battle Painting already use a 16:9 painting with a 1600 × 900 code box (web ADR-0005, ADR-0007). 10 Stage Markers fit on one screen. The state of a Stage (Done, Open, Locked, best Stars) changes with the progress of the Player, and the labels need text in each language, so the art cannot contain them.

## Considered Options

- **A tall portrait map with vertical scrolling, as in many mobile map games.** Rejected. It does not fit a landscape screen, and the Player must scroll to find the next Stage.
- **A map wider than the screen, with panning.** Rejected. 10 Stages do not need the space, and panning adds input code for mouse, touch and keyboard.
- **Paint the markers and the dashed line into the art.** Rejected. The art then cannot show which Stages are done or locked, and each change of a Region needs a new painting.
- **Each Region Map with its own clearing positions.** Rejected for now. One set of positions keeps the code and the layout checks simple.

## Consequences

- The artist must put the 10 clearings and the Boss landmark at fixed positions (12 — Region Concepts, 1.1). A generated image needs inpainting to match them.
- The progress line follows a path that is traced by hand from each painting.
- A change to the number of Stages in a Region, or to the screen layout, needs new positions and maybe new paintings.
