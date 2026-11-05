import type { CosmeticFamily } from "@workspace/rules";
import { COSMETIC_FAMILIES } from "@workspace/rules";
import { cn } from "cn";
import { SelectionIndicator, Tab, TabList } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { BAZAAR_CSS } from "@/features/bazaar/tokens";

/** The glyph of each Cosmetic family on its tab. */
const FAMILY_GLYPH: Readonly<Record<CosmeticFamily, Glyph>> = {
  cardBack: "cards",
  heroPortrait: "helmet",
  gearLook: "breastplate",
  boardSkin: "banner",
};

/**
 * The tab bar of the Bazaar: one tab for each Cosmetic family, with its glyph
 * and its name. The gold plate of the selected tab is one piece, as the
 * station tabs of the Workshop: it slides to the new tab. The left and right
 * arrow keys move between the tabs. On a short screen the glyph goes to the
 * left of the name.
 */
export const FamilyTabs = () => {
  const { tr } = useGameText();
  return (
    <TabList
      aria-label={tr("bazaar.familiesLabel")}
      className="grid shrink-0 grid-cols-4 gap-1 px-3 pt-3 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-2"
      data-testid="bazaar-families"
    >
      {COSMETIC_FAMILIES.map((family) => (
        <Tab
          key={family}
          id={family}
          className={({ isSelected }) =>
            cn(
              "relative isolate flex min-h-16 cursor-pointer flex-col items-center justify-start gap-1 rounded-lg px-1 py-1.5 text-center transition-colors duration-200 outline-none select-none",
              "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
              "[@media(max-height:500px)]:min-h-10 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:justify-center [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:py-1",
              isSelected
                ? "text-ink-on-gold"
                : "text-cream data-[hovered]:bg-cream/10"
            )
          }
          data-testid={`bazaar-family-${family}`}
        >
          {({ isSelected }) => (
            <>
              <GlyphIcon
                glyph={FAMILY_GLYPH[family]}
                className={cn(
                  "size-6 shrink-0 [@media(max-height:500px)]:size-5",
                  !isSelected && "text-gold-trim"
                )}
              />
              <span className="font-display text-[13px] leading-[1.15] font-bold text-balance [@media(max-height:500px)]:font-sans [@media(max-height:500px)]:text-[11px]">
                {tr(`bazaar.families.${family}`)}
              </span>
              <SelectionIndicator
                isSelected={isSelected}
                className="border-gold-deep from-gold-light to-gold absolute inset-0 -z-10 rounded-lg border-2 bg-gradient-to-b motion-safe:transition-[translate,width,height] motion-safe:duration-[240ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                style={{ boxShadow: BAZAAR_CSS.tile }}
              />
            </>
          )}
        </Tab>
      ))}
    </TabList>
  );
};
