import type { BattleEvent } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { SoundName } from "@/core/audio/audio-sounds";
import type { BattleView } from "@/features/battle/battle-view";
import { hasManyHeroes } from "@/features/battle/battle-view";

/** The sound of a Battle Event, if it has one. */
const damageSound = (
  event: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>
): SoundName => {
  if (event.source === "burn") {
    return "fire";
  }
  if (event.crit) {
    return "crit";
  }
  // A Ward that absorbs the full hit sounds like a Block: no damage goes in.
  if (event.blocked || (event.amount === 0 && event.absorbed > 0)) {
    return "block";
  }
  return event.damageType === "physical" ? "hit" : event.damageType;
};

/**
 * The sound of a Defeated Hero, a Front move or a Boss Rule. In a Stage, the
 * Battle ends on the defeat, so only the victory or defeat sound plays.
 */
const heroSound = (
  event: BattleEvent,
  view: BattleView | undefined
): SoundName | null => {
  switch (event._tag) {
    case "HeroDefeated": {
      return view && hasManyHeroes(view, event.hero.side)
        ? "bossDefeated"
        : null;
    }
    case "FrontMoved": {
      return "frontMoved";
    }
    case "BossRuleActivated": {
      return "bossRule";
    }
    default: {
      return null;
    }
  }
};

export const eventSound = (
  event: BattleEvent,
  view?: BattleView
): SoundName | null => {
  switch (event._tag) {
    case "HeroDefeated":
    case "FrontMoved":
    case "BossRuleActivated": {
      return heroSound(event, view);
    }
    case "UnitSummoned": {
      return "summon";
    }
    case "CardPlayed": {
      return getCard(event.card.cardId).kind === "skill" ? "cast" : null;
    }
    case "UnitMoved": {
      return "step";
    }
    case "UnitAttacked": {
      return event.ranged ? "ranged" : "melee";
    }
    case "DamageDealt": {
      return damageSound(event);
    }
    case "UnitDied": {
      return "death";
    }
    // Steadfast stops a lethal hit, as a Block stops half of one.
    case "SteadfastHeld": {
      return "block";
    }
    case "UnitHealed": {
      return "heal";
    }
    case "TurnStarted": {
      return "turn";
    }
    case "BattleEnded": {
      return event.result.winner === "player" ? "victory" : "defeat";
    }
    default: {
      return null;
    }
  }
};
