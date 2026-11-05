import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

import type { BattleView } from "@/features/battle/battle-view";
import { defeatPanAt } from "@/features/battle/scene/defeat";
import {
  cameraFrame,
  HERO_FIGURE_Y,
  heroX,
  heroZ,
} from "@/features/battle/scene/layout";
import {
  defeatTime,
  playback,
  playerFallen,
  victoryTime,
} from "@/features/battle/scene/playback";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { panAt } from "@/features/battle/scene/victory";

/**
 * The victory shot (`scene/victory.ts`). The Battle Painting is a flat image
 * behind the scene (web ADR-0006), so the camera never moves in space: a move
 * would make the Units slide on the painted ground. It crops the picture
 * (a view offset), and the painting gets the same 2D transform, so the two
 * stay locked together.
 */
const SHOT = {
  /** The small push-in on the enemy Hero at the last hit. */
  impactZoom: 1.07,
  /** The Hero fills this part of the screen height in the Hero shot... */
  heroHeight: 0.46,
  /** ...between these zoom limits. */
  minZoom: 1.2,
  maxZoom: 2.1,
  /** The feet of the Hero stand this low on the screen: the Hero towers over the frame. */
  feetY: 0.86,
  /** The slow breath of the camera in the victory idle. */
  drift: 0.018,
  /** The result panel at the right: its width, and the screen padding. */
  panel: { wide: 460, short: 560, gutter: 24 },
} as const;

/**
 * The defeat shot (`scene/defeat.ts`). The same crop as the victory shot,
 * but quiet: a punch-in at the last hit, then a slow move to the kneeling
 * Hero. The Hero stays small, low in the frame, with empty space above it,
 * and the camera drifts slowly away from it while the loss sinks in.
 */
const LOSS_SHOT = {
  /** The punch-in on the Player Hero at the last hit. */
  impactZoom: 1.08,
  /** The Hero fills this part of the screen height: less than in a win. */
  heroHeight: 0.36,
  minZoom: 1.12,
  maxZoom: 1.7,
  /** The feet of the Hero stand here: higher than in a win, so space shows above. */
  feetY: 0.74,
  /** The slow drift away from the Hero, as a part of the screen width. */
  away: 0.025,
  /** The seconds that the drift takes. */
  awayTime: 7,
} as const;

/** Where the Hero stands on the screen: in the middle of the space at the left of the panel. */
const heroScreenX = (width: number, height: number): number => {
  const panel = Math.min(
    height <= 500 ? SHOT.panel.short : SHOT.panel.wide,
    width * 0.94
  );
  const free = (width - panel - SHOT.panel.gutter * 2) / 2;
  return MathUtils.clamp(free, width * 0.17, width * 0.34);
};

interface Crop {
  /** The zoom, 1 or more. */
  readonly zoom: number;
  /** The top-left corner of the crop, in pixels of the full picture. */
  readonly x: number;
  readonly y: number;
}

const NO_CROP: Crop = { zoom: 1, x: 0, y: 0 };

const point = new Vector3();

/** The pixel position of a world point in the picture of `camera`. */
const toPixels = (
  camera: PerspectiveCamera,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number
) => {
  point.set(x, y, z).project(camera);
  return {
    x: ((point.x + 1) / 2) * width,
    y: ((1 - point.y) / 2) * height,
  };
};

/**
 * The crop of the victory shot. It starts on the enemy Hero at the last hit,
 * then moves across the Board to the Player Hero (`panAt`). `weight` blends it
 * with the full picture, so the Battle Log goes back to the full Board softly.
 */
const victoryCrop = (
  base: PerspectiveCamera,
  view: BattleView,
  t: number | null,
  weight: number,
  width: number,
  height: number
): Crop => {
  if (weight <= 0.0005) {
    return NO_CROP;
  }
  const playerZ = heroZ(view, "player", 0);
  const enemy = toPixels(
    base,
    heroX("enemy"),
    HERO_FIGURE_Y,
    heroZ(view, "enemy", 0),
    width,
    height
  );
  const feet = toPixels(base, heroX("player"), 0, playerZ, width, height);
  const head = toPixels(base, heroX("player"), 2.1, playerZ, width, height);
  const heroZoom = MathUtils.clamp(
    (SHOT.heroHeight * height) / Math.max(1, feet.y - head.y),
    SHOT.minZoom,
    SHOT.maxZoom
  );
  const pan = t === null ? 0 : panAt(t);
  const breath = t === null ? 0 : Math.sin(t * 0.33) * SHOT.drift * pan;
  const shotZoom = MathUtils.lerp(SHOT.impactZoom, heroZoom, pan) + breath;
  // The point that the camera holds, and where it shows it on the screen.
  const anchor = {
    x: MathUtils.lerp(enemy.x, feet.x, pan),
    y: MathUtils.lerp(enemy.y, feet.y, pan),
  };
  const screen = {
    x: MathUtils.lerp(enemy.x, heroScreenX(width, height), pan),
    y: MathUtils.lerp(enemy.y, height * SHOT.feetY, pan),
  };
  const zoom = 1 + (shotZoom - 1) * weight;
  const shownX = anchor.x + (screen.x - anchor.x) * weight;
  const shownY = anchor.y + (screen.y - anchor.y) * weight;
  // The crop stays inside the picture, so the painting always covers the screen.
  return {
    zoom,
    x: MathUtils.clamp(anchor.x - shownX / zoom, 0, width - width / zoom),
    y: MathUtils.clamp(anchor.y - shownY / zoom, 0, height - height / zoom),
  };
};

/**
 * The crop of the defeat shot. At the last hit (`t` is `null`), it punches
 * in on the Player Hero where it stands. Then it moves to the Hero shot
 * (`defeatPanAt`), and drifts slowly away. `weight` blends it with the full
 * picture, as in `victoryCrop`.
 */
const defeatCrop = (
  base: PerspectiveCamera,
  view: BattleView,
  t: number | null,
  weight: number,
  width: number,
  height: number
): Crop => {
  if (weight <= 0.0005) {
    return NO_CROP;
  }
  const playerZ = heroZ(view, "player", 0);
  const body = toPixels(
    base,
    heroX("player"),
    HERO_FIGURE_Y,
    playerZ,
    width,
    height
  );
  const feet = toPixels(base, heroX("player"), 0, playerZ, width, height);
  const head = toPixels(base, heroX("player"), 2.1, playerZ, width, height);
  const heroZoom = MathUtils.clamp(
    (LOSS_SHOT.heroHeight * height) / Math.max(1, feet.y - head.y),
    LOSS_SHOT.minZoom,
    LOSS_SHOT.maxZoom
  );
  const pan = t === null ? 0 : defeatPanAt(t);
  const shotZoom = MathUtils.lerp(LOSS_SHOT.impactZoom, heroZoom, pan);
  const drift =
    t === null
      ? 0
      : width * LOSS_SHOT.away * MathUtils.smoothstep(t, 0, LOSS_SHOT.awayTime);
  const anchor = {
    x: MathUtils.lerp(body.x, feet.x, pan),
    y: MathUtils.lerp(body.y, feet.y, pan),
  };
  const screen = {
    x: MathUtils.lerp(body.x, heroScreenX(width, height) - drift, pan),
    y: MathUtils.lerp(body.y, height * LOSS_SHOT.feetY, pan),
  };
  const zoom = 1 + (shotZoom - 1) * weight;
  const shownX = anchor.x + (screen.x - anchor.x) * weight;
  const shownY = anchor.y + (screen.y - anchor.y) * weight;
  return {
    zoom,
    x: MathUtils.clamp(anchor.x - shownX / zoom, 0, width - width / zoom),
    y: MathUtils.clamp(anchor.y - shownY / zoom, 0, height - height / zoom),
  };
};

/** Puts the same crop on the Battle Painting as on the camera. */
const cropPainting = (painting: HTMLElement | null, crop: Crop) => {
  if (!painting) {
    return;
  }
  const transform =
    crop.zoom > 1.0005
      ? `translate3d(${-crop.x * crop.zoom}px, ${-crop.y * crop.zoom}px, 0) scale(${crop.zoom})`
      : "";
  if (painting.style.transform !== transform) {
    painting.style.transformOrigin = "0 0";
    painting.style.transform = transform;
  }
};

const cropCamera = (
  camera: PerspectiveCamera,
  crop: Crop,
  width: number,
  height: number
) => {
  if (crop.zoom > 1.0005) {
    camera.setViewOffset(
      width,
      height,
      crop.x,
      crop.y,
      width / crop.zoom,
      height / crop.zoom
    );
  } else if (camera.view?.enabled) {
    camera.clearViewOffset();
  }
};

/**
 * The 3/4 camera from the player's side (art direction 3). It fits the Board
 * to the viewport. A Crit gives a short shake, but not with reduced motion. A
 * win gives the victory shot and a loss gives the defeat shot, but not with
 * reduced motion: then the camera does not move.
 */
export const CameraRig = ({ lanes }: { readonly lanes: number }) => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);
  const reduced = useReducedMotion();
  const frame = useMemo(
    () => cameraFrame(size.width / Math.max(1, size.height), lanes),
    [size.width, size.height, lanes]
  );
  const base = useMemo(() => new Vector3(...frame.position), [frame]);
  const target = useMemo(() => new Vector3(...frame.target), [frame]);
  // The camera with no crop, to find where a Hero is in the full picture.
  const full = useMemo(() => new PerspectiveCamera(), []);
  const weight = useRef(0);
  const painting = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    // The Canvas makes the default camera, which is a PerspectiveCamera.
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    // oxlint-disable-next-line react/immutability -- the R3F camera is a Three.js object; R3F expects direct mutation, and React never renders from it
    camera.fov = frame.fov;
    camera.position.copy(base);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    // oxlint-disable-next-line react/immutability -- the full camera is a Three.js object for projection only; React never renders from it
    full.fov = frame.fov;
    full.aspect = size.width / Math.max(1, size.height);
    full.position.copy(base);
    full.lookAt(target);
    full.updateMatrixWorld();
    full.updateProjectionMatrix();
  }, [camera, frame, base, target, full, size.width, size.height]);

  useLayoutEffect(() => {
    const found = gl.domElement
      .closest("[data-testid='battle-board-layer']")
      ?.querySelector("[data-battle-painting]");
    painting.current = found instanceof HTMLElement ? found : null;
    return () => {
      cropPainting(painting.current, NO_CROP);
      painting.current = null;
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (camera instanceof PerspectiveCamera) {
      const t = victoryTime();
      const lost = defeatTime();
      const losing = lost !== null || playerFallen();
      const won =
        t !== null ||
        (playback.finalBlow !== null && playback.finalBlowTo === "enemy");
      const shot = !reduced && (won || losing);
      // A loss moves slower than a win, except the punch-in of its last hit.
      const rate = losing ? (lost === null ? 9 : 2.4) : t === null ? 7 : 4.5;
      weight.current = MathUtils.damp(
        weight.current,
        shot ? 1 : 0,
        rate,
        Math.min(delta, 0.1)
      );
      const view = playback.session?.view;
      const crop = view
        ? (losing ? defeatCrop : victoryCrop)(
            full,
            view,
            losing ? lost : t,
            weight.current,
            size.width,
            size.height
          )
        : NO_CROP;
      cropCamera(camera, crop, size.width, size.height);
      cropPainting(painting.current, crop);
    }
    if (reduced || playback.shake <= 0) {
      if (!camera.position.equals(base)) {
        camera.position.copy(base);
      }
      return;
    }
    const strength = playback.shake * 0.06;
    camera.position.set(
      base.x + Math.sin(playback.time * 70) * strength,
      base.y + Math.cos(playback.time * 55) * strength,
      base.z
    );
  });

  return null;
};
