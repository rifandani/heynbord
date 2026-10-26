import { FittedPainting } from "@/features/town/components/fitted-painting";
import {
  WORKSHOP_BACKDROP,
  WORKSHOP_EDGES,
  WORKSHOP_LAMP,
} from "@/features/workshop/tokens";

/** The painting of the Workshop inside (Town Concepts, section 10): 1536 × 1024. */
const WORKSHOP_IMAGE = "/town/workshop-inside.webp";

/**
 * The lights of the painting, in painting percent: the brass lantern under the
 * beams and the fire of the forge. Each one breathes a little, as a flame does.
 */
const LIGHTS: readonly {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly delay: number;
}[] = [
  { x: 61.8, y: 15, size: 16, delay: 0 },
  { x: 13, y: 45, size: 30, delay: -2.3 },
];

/**
 * The painted Workshop, in full above the Town Bar (`FittedPainting`), as
 * the Card shop of the Packs screen. The lantern and the forge
 * breathe; with reduced motion they are still. The painting has no station
 * light, because it is cropped on a narrow screen and the forge already
 * lights its left side. Darker edges keep the plates and the Town Bar easy
 * to read.
 */
export const WorkshopScene = () => (
  <div
    className="absolute inset-0 overflow-hidden"
    style={{ backgroundColor: WORKSHOP_BACKDROP }}
    aria-hidden
  >
    <FittedPainting src={WORKSHOP_IMAGE} width={1536} height={1024}>
      {LIGHTS.map((light) => (
        <span
          key={`${light.x}:${light.y}`}
          className="pointer-events-none absolute aspect-square -translate-1/2 rounded-full opacity-85 motion-safe:animate-[shop-lamp_5.5s_ease-in-out_infinite]"
          style={{
            left: `${light.x}%`,
            top: `${light.y}%`,
            width: `${light.size}%`,
            background: WORKSHOP_LAMP,
            animationDelay: `${light.delay}s`,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{ background: WORKSHOP_EDGES }}
      />
    </FittedPainting>
  </div>
);
