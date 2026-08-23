// ESPN's defaultPositionId -> fantasy position abbreviation.
// Stable, widely referenced mapping (used by e.g. the espn_api community package).
export const POSITION_MAP: Record<number, string> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "D/ST",
};

export const FLEX_ELIGIBLE = new Set(["RB", "WR", "TE"]);

export type ScoringType = "STANDARD" | "PPR" | "HALF_PPR";

export function isScoringType(value: string): value is ScoringType {
  return value === "STANDARD" || value === "PPR" || value === "HALF_PPR";
}
