# The Battle shows a 2D painting, not a 3D Board

The ground and the background of a Battle are one Battle Painting for each Region: a flat 2D image behind a transparent Three.js canvas. The scene has no 3D Board model, no tiles, no rim and no 3D scenery. The Squares are not drawn. The Units, the Heroes, the effects and the target markers stay 3D, on an invisible ground plane that has the same position as the old Board.

We did this because the target look is the painted battlefield of the original Flash games, where the figures stand directly on the grass. One painting from the AI image tool gets that look for one developer, with the same process as the Town (web ADR-0005). A 3D Board and low-poly scenery look like a toy beside the painted card art.

This changes art direction 2 ("Board: a real 3D model: a table-land with Lanes of stone or wood tiles") and the diorama in DESIGN.md.

## Considered Options

- **Keep a thin 3D Board on top of the painting.** Rejected. Tiles and a rim on a painted meadow mix two styles, and the Board then hides the painting.
- **Keep the 3D scenery and add only a painted sky.** Rejected. The ground and the trees stay low-poly, so the look does not change.
- **Map the painting onto the 3D ground plane as a texture.** Rejected. The artist must then paint a flat top view, and the painting loses its 3/4 look.

## Consequences

- The painting is a DOM image with a "cover" fit, so it does not move with the camera. The artist paints it for the Battle camera (45° down, 16:9). The open ground must be larger than a 4-Lane Board, so that the Board fits on it at other screen sizes and with 3 or 4 Lanes.
- The Player sees no Square at rest. The legal Squares show only when a card is selected. A Closed Lane shows as a dark band. The high-contrast Board setting will draw outlines on all Squares.
- A camera shake does not move the painting.
