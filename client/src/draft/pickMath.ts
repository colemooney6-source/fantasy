/** Snake-draft math shared by the pick tracker and the recommendation engine. */

export function round(overallPick: number, numTeams: number): number {
  return Math.ceil(overallPick / numTeams);
}

export function pickInRound(overallPick: number, numTeams: number): number {
  const r = round(overallPick, numTeams);
  return overallPick - (r - 1) * numTeams;
}

/** Which team slot (1..numTeams) is on the clock for a given overall pick, snake order. */
export function teamOnClock(overallPick: number, numTeams: number): number {
  const r = round(overallPick, numTeams);
  const pos = pickInRound(overallPick, numTeams);
  return r % 2 === 1 ? pos : numTeams - pos + 1;
}

/** Overall pick numbers (in order) at which `mySlot` is on the clock, up to maxRounds. */
export function myOverallPicks(numTeams: number, mySlot: number, maxRounds: number): number[] {
  const picks: number[] = [];
  for (let r = 1; r <= maxRounds; r++) {
    const pos = r % 2 === 1 ? mySlot : numTeams - mySlot + 1;
    picks.push((r - 1) * numTeams + pos);
  }
  return picks;
}
