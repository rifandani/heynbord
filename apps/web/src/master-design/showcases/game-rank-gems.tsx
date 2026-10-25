import { RANKS } from "@workspace/rules";

import { RankGems } from "@/core/components/game/rank-gems";
import { CardFrame } from "@/features/battle/components/card-frame";

import { Variant } from "../variant";

/** The Rank name, as the game writes it. */
const RANK_NAME = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
} as const;

const RANK = "flex items-center gap-3";

/**
 * The Rank of a card as diamonds. The gems are in `em`, so one piece sits on a
 * 63px Hand Card, on a 6px reward card and on a landing page without a second
 * implementation. A Rank never shows by color alone: the count is the Rank.
 */
export const GameRankGemsShowcase = () => (
  <div className="flex flex-col gap-8">
    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">
        Every Rank on parchment
      </h4>
      <div className="bg-parchment border-frame-wood inline-flex flex-col gap-2 rounded-2xl border-4 p-5 text-[20px]">
        {RANKS.map((rank) => (
          <div className={RANK} key={rank}>
            <span className="text-ink w-24 font-mono text-xs">
              {RANK_NAME[rank]}
            </span>
            <RankGems rank={rank} />
          </div>
        ))}
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">
        Every Rank on a Night Plate
      </h4>
      <div className="bg-night-plate border-gold-trim/40 inline-flex flex-col gap-2 rounded-2xl border-2 p-5 text-[20px]">
        {RANKS.map((rank) => (
          <div className={RANK} key={rank}>
            <span className="text-cream-dim w-24 font-mono text-xs">
              {RANK_NAME[rank]}
            </span>
            <RankGems rank={rank} />
          </div>
        ))}
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">
        One piece at every size
      </h4>
      <div className="bg-night-plate border-gold-trim/40 flex flex-wrap items-end gap-8 rounded-2xl border-2 p-5">
        <Variant label="12px deck card">
          <span className="text-xs">
            <RankGems rank="legendary" />
          </span>
        </Variant>
        <Variant label="20px details card">
          <span className="text-[20px]">
            <RankGems rank="legendary" />
          </span>
        </Variant>
        <Variant label="40px landing page">
          <span className="text-[40px]">
            <RankGems rank="legendary" />
          </span>
        </Variant>
      </div>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">
        In a card and alone
      </h4>
      <div className="bg-parchment border-frame-wood flex flex-wrap items-start gap-10 rounded-2xl border-4 p-6">
        <Variant label="in a Rare card">
          <span className="block text-xs">
            <CardFrame cardId="human.riverKnight" rank="rare" countdown={2} />
          </span>
        </Variant>
        <Variant label="alone, at the same font size">
          <span className="text-xs">
            <RankGems rank="rare" />
          </span>
        </Variant>
        <Variant label="in a Legendary card">
          <span className="block text-xs">
            <CardFrame
              cardId="human.riverKnight"
              rank="legendary"
              countdown={2}
            />
          </span>
        </Variant>
        <Variant label="alone, at the same font size">
          <span className="text-xs">
            <RankGems rank="legendary" />
          </span>
        </Variant>
      </div>
      <p className="text-muted-fg mt-3 text-xs">
        The card and the standalone gems use the same piece, so a Rank looks
        identical in both places.
      </p>
    </section>
  </div>
);
