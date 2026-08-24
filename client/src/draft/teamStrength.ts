import type { DraftedPick, Player, Settings } from "../types";
import { computeRosterNeeds, type RosterNeeds } from "./roster";

/**
 * Rough rank-based value for a single drafted player: a top-ranked player is worth close to
 * 500, tapering to 0 around rank 500. Mirrors the rank-based scoring style used in
 * draft/recommend.ts (score starts at `-player.rank`) — there's no reliable points projection
 * available from ESPN's API, only overall rank, so value has to be derived from that.
 */
export function playerValue(player: Player): number {
  return Math.max(0, 500 - player.rank);
}

export interface TeamSummary {
  /** 1..numTeams */
  slot: number;
  isMe: boolean;
  roster: Player[];
  totalValue: number;
  needs: RosterNeeds;
}

/** Groups drafted picks by team slot (1..numTeams) and resolves each into a per-team summary,
 *  including every team even if it has no picks yet. */
export function buildTeamSummaries(
  settings: Settings,
  drafted: DraftedPick[],
  playerById: Map<number, Player>,
): TeamSummary[] {
  const rosters = new Map<number, Player[]>();
  for (let slot = 1; slot <= settings.numTeams; slot++) rosters.set(slot, []);

  for (const pick of drafted) {
    const player = playerById.get(pick.playerId);
    if (!player) continue;
    rosters.get(pick.teamSlot)?.push(player);
  }

  return Array.from(rosters.entries()).map(([slot, roster]) => ({
    slot,
    isMe: slot === settings.myPick,
    roster,
    totalValue: roster.reduce((sum, p) => sum + playerValue(p), 0),
    needs: computeRosterNeeds(roster, settings.rosterSlots),
  }));
}

const GRADE_THRESHOLDS: [number, string][] = [
  [97, "A+"],
  [93, "A"],
  [90, "A-"],
  [87, "B+"],
  [83, "B"],
  [80, "B-"],
  [77, "C+"],
  [73, "C"],
  [70, "C-"],
  [60, "D"],
  [0, "F"],
];

/**
 * Normalizes a team's total value against the strongest team drafted so far (0-100), then maps
 * that onto a familiar letter grade. This is deliberately relative and live: grades shift as
 * the draft progresses and other teams catch up, rather than being tied to a fixed scale.
 */
export function gradeFor(totalValue: number, maxValue: number): { score: number; letter: string } {
  const score = maxValue > 0 ? Math.round((totalValue / maxValue) * 100) : 0;
  const letter = GRADE_THRESHOLDS.find(([min]) => score >= min)?.[1] ?? "F";
  return { score, letter };
}
