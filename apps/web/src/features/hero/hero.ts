import type {
  ClassId,
  DeckSlot,
  GearLevels,
  GearSlot,
  GearStat,
} from "@workspace/rules";
import {
  GEAR_SLOTS,
  GEAR_STATS,
  gearStatValue,
  gearUpgradeCoin,
  MAX_GEAR_LEVEL,
  PLAYER_BASE_HP,
  playerHeroHp,
} from "@workspace/rules";

import type { TextRef } from "@/features/battle/card-text";
import { defaultSlotName } from "@/features/deck/deck";

/**
 * The parts of the Hero HP (GDD 4.10, 7.3): the base, 1 for each Player
 * level, and the Armor bonus (1 for each Armor level). The Hero screen shows
 * "46 = 30 base + 6 level + 10 × 1 Armor".
 */
export interface HeroHpParts {
  readonly total: number;
  readonly base: number;
  readonly level: number;
  readonly armorLevel: number;
  readonly armorPerLevel: number;
  readonly armor: number;
}

export const heroHpParts = (
  playerLevel: number,
  gear: Pick<GearLevels, "armor">
): HeroHpParts => {
  const armor = gearStatValue("armor", gear.armor);
  return {
    total: playerHeroHp(playerLevel) + armor,
    base: PLAYER_BASE_HP,
    level: playerLevel,
    armorLevel: gear.armor,
    armorPerLevel: GEAR_STATS.armor.perLevel,
    armor,
  };
};

/**
 * What the upgrade button of a Gear item does: upgrade for `coin`, wait for
 * `missing` more Coin, or nothing, because the item is at level 20.
 */
export type GearUpgrade =
  | { readonly kind: "ready"; readonly coin: number }
  | { readonly kind: "coin"; readonly coin: number; readonly missing: number }
  | { readonly kind: "max" };

/**
 * One Gear item on the Gear Rack: its level, its stat now and at the next
 * level (`null` at level 20), and its upgrade. A stat value is basis points
 * (100 = 1%) for a chance, and HP for the Armor.
 */
export interface GearItem {
  readonly slot: GearSlot;
  readonly level: number;
  readonly stat: GearStat;
  readonly now: number;
  readonly next: number | null;
  readonly upgrade: GearUpgrade;
}

const upgradeOf = (level: number, coin: number): GearUpgrade => {
  if (level >= MAX_GEAR_LEVEL) {
    return { kind: "max" };
  }
  const cost = gearUpgradeCoin(level + 1);
  return coin >= cost
    ? { kind: "ready", coin: cost }
    : { kind: "coin", coin: cost, missing: cost - coin };
};

export const gearItem = (
  slot: GearSlot,
  level: number,
  coin: number
): GearItem => ({
  slot,
  level,
  stat: GEAR_STATS[slot].stat,
  now: gearStatValue(slot, level),
  next: level >= MAX_GEAR_LEVEL ? null : gearStatValue(slot, level + 1),
  upgrade: upgradeOf(level, coin),
});

/** The 4 Gear items of the Gear Rack, in the GDD 7.3 order. */
export const gearItems = (
  gear: GearLevels,
  coin: number
): readonly GearItem[] =>
  GEAR_SLOTS.map((slot) => gearItem(slot, gear[slot], coin));

/** True for a stat that is a chance: it shows as a percent. */
export const isChance = (stat: GearStat): boolean => stat !== "heroHp";

/**
 * Where the focus goes after an upgrade: the same button while it is on,
 * else the next item that the Player can upgrade, to the right and then from
 * the left end, else nowhere (`null`). So the Player can upgrade again and
 * again with the keyboard, as after a Combine in the Workshop.
 */
export const upgradeFocusAfter = (
  items: readonly Pick<GearItem, "slot" | "upgrade">[],
  from: GearSlot
): GearSlot | null => {
  const index = items.findIndex((item) => item.slot === from);
  const order = [...items.slice(index), ...items.slice(0, index)];
  return order.find((item) => item.upgrade.kind === "ready")?.slot ?? null;
};

/** The name of a Deck: the name that the Player gave, or the default name. */
export type DeckName =
  | { readonly _tag: "Given"; readonly name: string }
  | { readonly _tag: "Default"; readonly name: TextRef };

/** The Hero part of the screen: the Class of the Active Deck, and its name (ADR-0033). */
export interface HeroDeck {
  readonly classId: ClassId;
  readonly deckName: DeckName;
}

/**
 * The Active Deck and its Class. The Player's Hero has the Class of the
 * Active Deck (ADR-0033). A slot with no name shows its default name. When
 * the ID is not a slot, the first slot is the Active Deck, as in the Stage
 * Panel.
 */
export const heroDeck = (
  slots: readonly DeckSlot[],
  activeDeckId: string
): HeroDeck | null => {
  const index = Math.max(
    0,
    slots.findIndex((slot) => slot.id === activeDeckId)
  );
  const slot = slots[index];
  if (!slot) {
    return null;
  }
  return {
    classId: slot.classId,
    deckName:
      slot.name === ""
        ? { _tag: "Default", name: defaultSlotName(slot, index) }
        : { _tag: "Given", name: slot.name },
  };
};
