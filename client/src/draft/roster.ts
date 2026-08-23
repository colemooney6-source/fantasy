import type { Player, RosterSlots } from "../types";

const EXACT_POSITIONS = ["QB", "RB", "WR", "TE", "D/ST", "K"] as const;
type ExactPosition = (typeof EXACT_POSITIONS)[number];

export interface RosterNeeds {
  /** Open starter slots per exact position (0 if filled). */
  openStarters: Record<ExactPosition, number>;
  openFlex: number;
  openBench: number;
  filledCounts: Record<ExactPosition, number>;
  flexUsed: number;
  benchUsed: number;
}

/** Greedily assigns drafted players to roster slots (exact position first, then flex, then bench)
 *  to figure out what's still needed. Draft order is used as the assignment order, which is a
 *  reasonable approximation since exact in-app slot assignment isn't tracked separately. */
export function computeRosterNeeds(myRoster: Player[], slots: RosterSlots): RosterNeeds {
  const filledCounts = { QB: 0, RB: 0, WR: 0, TE: 0, "D/ST": 0, K: 0 } as Record<ExactPosition, number>;
  const leftover: Player[] = [];

  for (const player of myRoster) {
    const pos = player.position as ExactPosition;
    if (EXACT_POSITIONS.includes(pos) && filledCounts[pos] < slots[pos]) {
      filledCounts[pos] += 1;
    } else {
      leftover.push(player);
    }
  }

  let flexUsed = 0;
  let benchUsed = 0;
  for (const player of leftover) {
    if (player.flexEligible && flexUsed < slots.FLEX) {
      flexUsed += 1;
    } else {
      benchUsed += 1;
    }
  }

  const openStarters = {} as Record<ExactPosition, number>;
  for (const pos of EXACT_POSITIONS) {
    openStarters[pos] = Math.max(0, slots[pos] - filledCounts[pos]);
  }

  return {
    openStarters,
    openFlex: Math.max(0, slots.FLEX - flexUsed),
    openBench: Math.max(0, slots.BENCH - benchUsed),
    filledCounts,
    flexUsed,
    benchUsed,
  };
}

export { EXACT_POSITIONS };
export type { ExactPosition };
