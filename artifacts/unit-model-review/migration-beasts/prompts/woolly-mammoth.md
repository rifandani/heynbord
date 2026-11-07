# Woolly Mammoth Turnaround prompts

1. Open a new image conversation. Attach `apps/web/public/creature/feral/woolly-mammoth.webp` and send the setup message.
2. Send each view prompt in its own message. Save each image in this folder, with the name in its heading.
3. Run `bun unit-model:turnaround:export woolly-mammoth`.

## Setup message

```text
In this conversation, you will paint the Turnaround of Woolly Mammoth, a figure of a fantasy card battle game: four views and one detail sheet, one image in each message. A 3D model will use these images as its target, so every image must show the same subject.

The attached card painting is the subject reference and the style reference. Keep its hand-painted fantasy look, and use the same subject, palette, costume and proportions. Do not copy its background, its scene, its other figures or its pose.

Race: Feral.
A Feral figure wears no armor and carries no tools of a people.
The art can show the lure that called it: bait, a horn or a torch.
Palette: Slate violet and ice white. Fur, horn, stone and ice.

Subject: A woolly mammoth with long curved tusks.
Props: A fence that broke over its tusks.
Silhouette hook: The high dome head and the long tusks.

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
