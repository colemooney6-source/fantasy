export type SlotGroup = "starter" | "bench" | "ir";

export interface RosterPlayer {
  id: number;
  name: string;
  position: string;
  team: string | null;
  slotGroup: SlotGroup;
  slotLabel: string;
  slotOrder: number;
  matched: boolean;
  espnPlayerId: number | null;
  rank: number | null;
  byeWeek: number | null;
  injuryStatus: string | null;
  lastYearAvgPoints: number | null;
  projectedAvgPoints: number | null;
}

export interface RosterAlert {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
  playerName: string;
  playerPosition: string;
}

export interface CheckResult {
  checkedAt: string;
  playersChecked: number;
  newlyMatched: number;
  alertsCreated: number;
}

export const STARTER_SLOT_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "D/ST"];
