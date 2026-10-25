import type { DamageType } from "@workspace/rules";

import { AttackPlate } from "@/features/battle/components/attack-plate";
import { CardFrame } from "@/features/battle/components/card-frame";

import { Variant, VariantGrid } from "../variant";

const DAMAGE_TYPES: readonly DamageType[] = [
  "physical",
  "fire",
  "frost",
  "holy",
  "lightning",
];

/** One sword in a box that the font size of the parent scales. */
const Sword = ({
  damageType,
  value,
}: {
  readonly damageType: DamageType;
  readonly value: number;
}) => (
  <span className="relative block size-24 text-[28px]">
    <AttackPlate
      damageType={damageType}
      value={value}
      className="top-1/2 left-1/2 -translate-1/2"
    />
  </span>
);

const PLATE =
  "inline-flex flex-wrap items-start gap-6 rounded-2xl border-2 p-5";

/**
 * The stat plates of a card: Attack on the iron sword in its Damage Type
 * color, and HP on the heart. They are bespoke pieces of the Card Frame, not a
 * generic `StatPlate`: the sword is 80 × 80 and has one use, so it stays in
 * `features/battle`. A landing page can still show the same Attack number
 * alone, as this entry does.
 */
export const GameStatPlatesShowcase = () => (
  <div className="flex flex-col gap-8">
    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">
        Attack on a Night Plate
      </h4>
      <div className={`${PLATE} bg-night-plate border-gold-trim/40`}>
        <VariantGrid>
          {[0, 9, 900].map((value) => (
            <Variant key={value} label={value === 900 ? "wide value" : "value"}>
              <Sword damageType="physical" value={value} />
            </Variant>
          ))}
        </VariantGrid>
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">
        Every Damage Type on parchment
      </h4>
      <div className={`${PLATE} bg-parchment border-frame-wood`}>
        <VariantGrid>
          {DAMAGE_TYPES.map((damageType) => (
            <Variant key={damageType} label={damageType}>
              <Sword damageType={damageType} value={4} />
            </Variant>
          ))}
        </VariantGrid>
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">
        Attack and HP on the Card Frame
      </h4>
      <div className={`${PLATE} bg-parchment border-frame-wood`}>
        <VariantGrid>
          <Variant label="12px deck card">
            <span className="block text-xs">
              <CardFrame cardId="human.riverKnight" rank="rare" countdown={2} />
            </span>
          </Variant>
          <Variant label="20px details card">
            <span className="text-[20px]">
              <CardFrame cardId="human.riverKnight" rank="rare" countdown={2} />
            </span>
          </Variant>
        </VariantGrid>
      </div>
      <p className="text-muted-fg mt-3 text-xs">
        Attack sits at the lower left on the sword of its Damage Type. HP sits
        at the lower right on the heart. Both numbers are Inter 900 with tabular
        figures and a dark edge, so two digits run over the art.
      </p>
    </section>
  </div>
);
