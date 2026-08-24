export type ScoringType = "STANDARD" | "PPR" | "HALF_PPR";

export interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  rank: number;
  flexEligible: boolean;
  injuryStatus: string | null;
  byeWeek: number | null;
}

export interface RosterSlots {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  "D/ST": number;
  K: number;
  BENCH: number;
}

export interface Settings {
  year: number;
  scoring: ScoringType;
  numTeams: number;
  myPick: number;
  rosterSlots: RosterSlots;
}

export interface DraftedPick {
  playerId: number;
  overallPick: number;
  round: number;
  pickInRound: number;
  /** 1..numTeams — which team's slot was on the clock for this pick, snake order. */
  teamSlot: number;
  byMe: boolean;
}

export const DEFAULT_ROSTER_SLOTS: RosterSlots = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 1,
  FLEX: 1,
  "D/ST": 1,
  K: 0,
  BENCH: 6,
};
