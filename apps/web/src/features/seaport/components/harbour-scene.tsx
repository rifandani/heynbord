import { SEAPORT_COLORS, SEAPORT_CSS } from "@/features/seaport/tokens";
import { FittedPainting } from "@/features/town/components/fitted-painting";

/** The painting of the Seaport (11 — Town Concepts 17): 1536 × 1024. */
const SEAPORT_IMAGE = "/town/seaport-inside.webp";

/**
 * The shade over the scene. The calm water of the left third is a little
 * darker, so that the Destination plaques and the berth plate stay easy to
 * read; the ships and the quay at the right stay bright. The top and the
 * bottom edges are darker under the Balance Plate and over the Town Bar.
 */
const SHADE = SEAPORT_CSS.shade;

/**
 * The harbour of the Seaport quay, seen from the water, in full above the
 * Town Bar (`FittedPainting`), as the Bazaar inside. It has no motion of its
 * own, so reduced motion changes nothing here.
 */
export const HarbourScene = () => (
  <div
    className="absolute inset-0 overflow-hidden"
    style={{ backgroundColor: SEAPORT_COLORS.harbourDeep }}
    aria-hidden
    data-testid="harbour-scene"
  >
    <FittedPainting src={SEAPORT_IMAGE} width={1536} height={1024}>
      <div className="absolute inset-0" style={{ background: SHADE }} />
    </FittedPainting>
  </div>
);
