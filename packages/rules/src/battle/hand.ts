import { getCard } from "../content/cards";
import type { StepContext } from "./context";
import { heroState } from "./context";
import type { HeroRef } from "./types";
import { BattleEvent, HAND_LIMIT } from "./types";

/** The Hero `ref` draws 1 card when its Hand is not full and its Deck is not empty. */
export const drawCard = (ctx: StepContext, ref: HeroRef): void => {
  const hero = heroState(ctx.state, ref);
  const [next] = hero.deck;
  if (!next || hero.hand.length >= HAND_LIMIT) {
    return;
  }
  hero.deck = hero.deck.slice(1);
  const card = { ...next, countdown: getCard(next.cardId).countdown };
  hero.hand.push(card);
  ctx.events.push(
    BattleEvent.CardDrawn({
      side: ref.side,
      hero: ref.hero,
      // A copy: the Hand card changes later, and the event must keep the drawn Countdown.
      card: { ...card },
    })
  );
};
