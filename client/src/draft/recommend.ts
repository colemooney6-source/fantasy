import type { Player } from "../types";
import { computeRosterNeeds, EXACT_POSITIONS, type ExactPosition } from "./roster";
import type { RosterSlots } from "../types";

export interface Recommendation {
  player: Player;
  score: number;
  reasons: string[];
}

const STARTER_BONUS = 25;
const FLEX_BONUS = 15;
const BENCH_BONUS = 5;
const RUN_BONUS = 10;
const MAX_SCARCITY_BONUS = 30;
const RUN_WINDOW = 5;
const RUN_THRESHOLD = 3;

function needBonusFor(
  position: string,
  flexEligible: boolean,
  needs: ReturnType<typeof computeRosterNeeds>,
): { bonus: number; reason: string | null } {
  if (EXACT_POSITIONS.includes(position as ExactPosition) && needs.openStarters[position as ExactPosition] > 0) {
    return { bonus: STARTER_BONUS, reason: `Fills your starting ${position} need` };
  }
  if (flexEligible && needs.openFlex > 0) {
    return { bonus: FLEX_BONUS, reason: "Fills your FLEX spot" };
  }
  if (needs.openBench > 0) {
    return { bonus: BENCH_BONUS, reason: null };
  }
  return { bonus: 0, reason: null };
}

/** For each player, how big is the rank gap to the next available player at the same position,
 *  relative to the typical gap for that position right now (a "cliff" signals a run coming). */
function scarcityBonuses(positionGroup: Player[]): Map<number, { bonus: number; gap: number }> {
  const result = new Map<number, { bonus: number; gap: number }>();
  const window = positionGroup.slice(0, 12);
  if (window.length < 2) return result;

  const gaps: number[] = [];
  for (let i = 0; i < window.length - 1; i++) {
    gaps.push(window[i + 1].rank - window[i].rank);
  }
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length || 1;

  for (let i = 0; i < window.length - 1; i++) {
    const gap = gaps[i];
    if (gap > avgGap * 1.6) {
      const bonus = Math.min(MAX_SCARCITY_BONUS, Math.round(gap / 2));
      result.set(window[i].id, { bonus, gap });
    }
  }
  return result;
}

export function recommend(
  available: Player[],
  myRoster: Player[],
  rosterSlots: RosterSlots,
  recentlyDrafted: Player[],
  topN = 8,
): Recommendation[] {
  const needs = computeRosterNeeds(myRoster, rosterSlots);

  const byPosition = new Map<string, Player[]>();
  for (const p of available) {
    const list = byPosition.get(p.position) ?? [];
    list.push(p);
    byPosition.set(p.position, list);
  }
  const scarcityByPosition = new Map<string, Map<number, { bonus: number; gap: number }>>();
  for (const [pos, group] of byPosition) {
    scarcityByPosition.set(pos, scarcityBonuses(group));
  }

  const runCounts = new Map<string, number>();
  for (const p of recentlyDrafted.slice(-RUN_WINDOW)) {
    runCounts.set(p.position, (runCounts.get(p.position) ?? 0) + 1);
  }

  const byeCounts = new Map<number, number>();
  for (const p of myRoster) {
    if (p.byeWeek != null) byeCounts.set(p.byeWeek, (byeCounts.get(p.byeWeek) ?? 0) + 1);
  }

  const recommendations: Recommendation[] = available.slice(0, 60).map((player) => {
    const reasons: string[] = [];
    let score = -player.rank;

    const { bonus: needBonus, reason: needReason } = needBonusFor(player.position, player.flexEligible, needs);
    score += needBonus;
    if (needReason) reasons.push(needReason);

    const scarcity = scarcityByPosition.get(player.position)?.get(player.id);
    if (scarcity) {
      score += scarcity.bonus;
      reasons.push(`Talent drop-off after this: next ${player.position} is ${scarcity.gap} ranks lower`);
    }

    const runCount = runCounts.get(player.position) ?? 0;
    const hasOpenNeed = needBonus >= FLEX_BONUS;
    if (runCount >= RUN_THRESHOLD && hasOpenNeed) {
      score += RUN_BONUS;
      reasons.push(`Run on ${player.position}: ${runCount} of the last ${RUN_WINDOW} picks were ${player.position}`);
    }

    if (player.byeWeek != null && (byeCounts.get(player.byeWeek) ?? 0) >= 2) {
      reasons.push(`Shares bye week ${player.byeWeek} with ${byeCounts.get(player.byeWeek)} other roster player(s)`);
    }

    if (player.injuryStatus && player.injuryStatus !== "ACTIVE") {
      reasons.push(`Injury designation: ${player.injuryStatus.replace(/_/g, " ").toLowerCase()}`);
    }

    if (reasons.length === 0) {
      reasons.push("Best player available");
    }

    return { player, score, reasons };
  });

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, topN);
}
