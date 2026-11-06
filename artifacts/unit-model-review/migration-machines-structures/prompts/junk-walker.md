# Junk Walker Turnaround prompts

1. Open a new image conversation. Attach `apps/web/public/creature/goblin/junk-walker.webp` and send the setup message.
2. Send each view prompt in its own message. Save each image in this folder, with the name in its heading.
3. Run `bun unit-model:turnaround:export junk-walker`.

## Setup message

```text
In this conversation, you will paint the Turnaround of Junk Walker, a figure of a fantasy card battle game: four views and one detail sheet, one image in each message. A 3D model will use these images as its target, so every image must show the same subject.

The attached card painting is the subject reference and the style reference. Keep its hand-painted fantasy look, and use the same subject, palette, costume and proportions. Do not copy its background, its scene, its other figures or its pose.

Race: Goblin.
Goblin art must not look like Orc art.
Each Goblin figure is very small: about half the height of a human, with a large round head, thin arms and legs, long fingers and big feet that are often bare.
Each Goblin figure has ash-grey skin with a cool blue tint, never green or olive skin.
Each Goblin figure has very large round amber eyes that shine a little, like the eyes of a cat in a dark tunnel, a long pointed nose, small crooked front teeth and no tusks.
Each Goblin figure has long soft ears that hang down to the shoulders, and white tufts of hair.
The art shows no war paint, no fur, no bones, no tribal charms and no big muscles, because these are the look of the Orc cards.
A Goblin figure wears canvas work clothes with many pockets, brass goggles and tool belts, with armor and tools made from found objects that are too big for it.
In the art, acid green comes from lamp oil, glass jars and fuse sparks, never from skin.
A Goblin figure looks clever, nervous and proud of its inventions, not fierce.
Palette: Soot grey and slate blue, brass and acid green. Patched iron, canvas, brass, junk.

Subject: A goblin woman who drives a walking machine made from boiler plates.
Props: A round boiler body, pipe legs, a claw arm, an open seat with levers, brass gauges and rivets.
Silhouette hook: The round boiler and the two pipe legs.

The brief can name items of the scene. Show only what the subject wears, carries or is built from.

Rules for each image:
- A portrait image with a 3:4 aspect.
- Light from the upper left.
- A flat, plain, pale grey background of one color. No floor, no scene, no shadow on the background and no gradient.
- One subject with a clean silhouette. It fills at least three quarters of the height or the width of the image.
- No text, no letters, no arrows, no logo, no signature, no frame, no border and no gore.
- The same palette, the same costume and the same proportions in every image. Do not add a prop.
- A tabletop miniature with a large head. A humanoid is about 4 to 6 heads tall.

Reply to this message with "Ready" only. Do not make an image yet.
```

## front → save as `front.png`

```text
View: front. An orthographic view: no perspective. The subject faces the viewer in a neutral pose, with its feet on the ground. A fortification shows its blocking face to the viewer, and its base is on the ground.

Keep the rules of this conversation: the same subject as the card painting, no new prop, a flat pale grey background, a portrait 3:4 image, no text.
```

## three-quarter → save as `three-quarter.png`

```text
View: three-quarter. The same camera angle as the card painting. The subject advances to the right of the image: the chest and the lead foot point right. A fortification shows its blocking face to the right.

Keep the rules of this conversation: the same subject as the card painting, no new prop, a flat pale grey background, a portrait 3:4 image, no text.
```

## side → save as `side.png`

```text
View: side. An orthographic view: no perspective. The subject faces the right of the image, in the same neutral pose as the front view.

Keep the rules of this conversation: the same subject as the card painting, no new prop, a flat pale grey background, a portrait 3:4 image, no text.
```

## back → save as `back.png`

```text
View: back. An orthographic view: no perspective. The viewer sees the back of the subject, in the same neutral pose as the front view.

Keep the rules of this conversation: the same subject as the card painting, no new prop, a flat pale grey background, a portrait 3:4 image, no text.
```

## details → save as `details.png`

```text
View: detail sheet. One close-up for each identity feature of the card painting, in a clean grid. Show the close-ups on the same flat background, with space between them. Show one feature in each close-up. Do not use words or arrows.

Keep the rules of this conversation: the same subject as the card painting, no new prop, a flat pale grey background, a portrait 3:4 image, no text.
```
