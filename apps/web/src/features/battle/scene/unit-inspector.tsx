import { RegistryContext } from "@effect/atom-react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Side } from "@workspace/rules";
import { Predicate } from "effect";
import { useContext, useEffect, useRef } from "react";
import type { Camera } from "three";
import { Raycaster, Vector2, Vector3 } from "three";

import type { InspectedUnit } from "@/features/battle/battle.atoms";
import { inspectedUnitAtom } from "@/features/battle/battle.atoms";
import { toDevice, toScreen } from "@/features/battle/scene/markers";
import { unitPicker } from "@/features/battle/scene/unit-picker";
import type { Hover } from "@/features/battle/unit-inspect";
import {
  hoverStep,
  LONG_PRESS_MS,
  NO_HOVER,
} from "@/features/battle/unit-inspect";

/** A touch that moves this far is not a long press. */
const PRESS_SLOP = 10;

/** The height on a Unit of its QA screen point: the middle of the figure. */
const POINT_HEIGHT = 0.6;

interface PointerSpot {
  x: number;
  y: number;
  mouse: boolean;
  buttons: number;
  inside: boolean;
}

interface Press {
  timer: number;
  x: number;
  y: number;
  /** True while a long press holds the Card Details open. */
  open: boolean;
  /** The tap that ends a long press must not play a card on a target marker. */
  swallowClick: boolean;
}

const raycaster = new Raycaster();
const device = new Vector2();
const world = new Vector3();

/** The Unit under a screen point: the nearest hit box that a ray from the camera hits. */
const unitUnder = (
  canvas: HTMLCanvasElement,
  camera: Camera,
  clientX: number,
  clientY: number
): number | null => {
  const { x, y } = toDevice(clientX, clientY, canvas.getBoundingClientRect());
  raycaster.setFromCamera(device.set(x, y), camera);
  const [hit] = raycaster.intersectObjects(
    [...unitPicker.hitAreas.values()],
    false
  );
  const unitId: unknown = hit?.object.userData.unitId;
  return Predicate.isNumber(unitId) ? unitId : null;
};

/** A pointer input ends: the Card Details close, but not those of the keyboard Inspect mode. */
const releasePointer = (current: InspectedUnit | null) =>
  current?.by === "pointer" ? null : current;

/**
 * Hover and long press on the Units of both Sides (UI-05). The mouse hovers a
 * Unit for `HOVER_INTENT_MS` to inspect it. A touch holds a Unit for
 * `LONG_PRESS_MS` to inspect it until the finger goes up. A ray hits the
 * hidden hit boxes of the Units in each frame, so the Card Details close when
 * a Unit walks away from a still pointer. The hit boxes have no R3F handlers,
 * so a click still goes to the target marker under a Unit.
 */
export const UnitInspector = () => {
  const registry = useContext(RegistryContext);
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  const pointer = useRef<PointerSpot>({
    x: 0,
    y: 0,
    mouse: false,
    buttons: 0,
    inside: false,
  });
  const hover = useRef<Hover>(NO_HOVER);

  useEffect(() => {
    const release = () =>
      registry.set(
        inspectedUnitAtom,
        releasePointer(registry.get(inspectedUnitAtom))
      );
    const press: Press = {
      timer: 0,
      x: 0,
      y: 0,
      open: false,
      swallowClick: false,
    };
    const container =
      canvas.closest<HTMLElement>("[data-battle-canvas]") ?? canvas;

    const onMove = (event: PointerEvent) => {
      pointer.current = {
        x: event.clientX,
        y: event.clientY,
        mouse: event.pointerType === "mouse",
        buttons: event.buttons,
        inside: true,
      };
      if (
        press.timer &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) >
          PRESS_SLOP
      ) {
        window.clearTimeout(press.timer);
        press.timer = 0;
      }
    };
    const onLeave = () => {
      pointer.current.inside = false;
    };
    const onDown = (event: PointerEvent) => {
      onMove(event);
      press.swallowClick = false;
      if (event.pointerType === "mouse") {
        return;
      }
      press.x = event.clientX;
      press.y = event.clientY;
      press.timer = window.setTimeout(() => {
        press.timer = 0;
        const unitId = unitUnder(canvas, camera, press.x, press.y);
        if (unitId !== null) {
          registry.set(inspectedUnitAtom, { unitId, by: "pointer" });
          press.open = true;
          press.swallowClick = true;
        }
      }, LONG_PRESS_MS);
    };
    const onUp = () => {
      window.clearTimeout(press.timer);
      press.timer = 0;
      if (press.open) {
        press.open = false;
        release();
      }
    };
    // Capture: this runs before the R3F click on a target marker under the Unit.
    const onClick = (event: MouseEvent) => {
      if (press.swallowClick) {
        press.swallowClick = false;
        event.stopPropagation();
        event.preventDefault();
      }
    };
    const onContextMenu = (event: Event) => {
      if (!pointer.current.mouse) {
        event.preventDefault();
      }
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", onUp);
    container.addEventListener("click", onClick, true);
    container.addEventListener("contextmenu", onContextMenu);
    unitPicker.points = () => {
      const rect = canvas.getBoundingClientRect();
      return [...unitPicker.hitAreas].map(([id, area]) => {
        area.getWorldPosition(world).setY(POINT_HEIGHT);
        const owner: Side =
          area.userData.owner === "enemy" ? "enemy" : "player";
        return { id, owner, ...toScreen(world.project(camera), rect) };
      });
    };
    return () => {
      window.clearTimeout(press.timer);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onUp);
      container.removeEventListener("click", onClick, true);
      container.removeEventListener("contextmenu", onContextMenu);
      unitPicker.points = () => [];
      release();
    };
  }, [camera, canvas, registry]);

  // The mouse hover, in each frame: Units move under a still pointer.
  useFrame(() => {
    const spot = pointer.current;
    // A pressed button is a card drag from the Hand, not a hover.
    const hovering = spot.inside && spot.mouse && spot.buttons === 0;
    const hit = hovering ? unitUnder(canvas, camera, spot.x, spot.y) : null;
    const next = hoverStep(hover.current, hit, performance.now());
    if (next.shown !== hover.current.shown) {
      registry.set(
        inspectedUnitAtom,
        next.shown === null
          ? releasePointer(registry.get(inspectedUnitAtom))
          : { unitId: next.shown, by: "pointer" }
      );
    }
    hover.current = next;
  });

  return null;
};
