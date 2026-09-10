import { db, type RosterPlayerRow } from "./db.js";
import { fetchPlayers, type Player } from "./espn.js";
import { matchPlayerName } from "./rosterMatch.js";

export interface CheckResult {
  checkedAt: string;
  playersChecked: number;
  newlyMatched: number;
  alertsCreated: number;
}

function describeStatusChange(name: string, previous: string, current: string | null): string {
  if (current === null || current === "ACTIVE") {
    return `${name} is now ACTIVE (was ${previous}) — probably fine to start again.`;
  }
  if (current === "OUT" || current === "INJURY_RESERVE") {
    return `${name} is now ${current} (was ${previous}) — consider benching or replacing.`;
  }
  return `${name}'s status changed from ${previous} to ${current} — worth a look before your next lineup lock.`;
}

/**
 * Re-fetches the live ESPN player pool, links any not-yet-matched roster
 * players by name, and diffs injury status for matched ones. A player's
 * very first observed status is just recorded as a baseline — only a status
 * that *changes* from a previously known value produces an alert, so
 * seeding or first-ever linking never floods the alerts list.
 */
export async function runRosterCheck(year: number): Promise<CheckResult> {
  const livePlayers = await fetchPlayers(year, "PPR");
  const liveById = new Map(livePlayers.map((p) => [p.id, p]));

  const rosterPlayers = db.prepare("SELECT * FROM roster_players").all() as unknown as RosterPlayerRow[];

  const updateMatch = db.prepare(
    "UPDATE roster_players SET espn_player_id = ?, name = ?, team = ? WHERE id = ?",
  );
  const updateStatus = db.prepare(
    "UPDATE roster_players SET last_known_injury_status = ?, last_checked_at = datetime('now') WHERE id = ?",
  );
  const insertAlert = db.prepare("INSERT INTO alerts (roster_player_id, message) VALUES (?, ?)");

  let newlyMatched = 0;
  let alertsCreated = 0;

  for (const rp of rosterPlayers) {
    let live: Player | undefined = rp.espn_player_id != null ? liveById.get(rp.espn_player_id) : undefined;

    if (!live) {
      const matched = matchPlayerName(rp.name, livePlayers);
      if (matched) {
        live = matched;
        updateMatch.run(matched.id, matched.name, matched.team, rp.id);
        newlyMatched++;
      }
    }

    if (!live) continue;

    const previousStatus = rp.last_known_injury_status;
    const currentStatus = live.injuryStatus;

    if (previousStatus !== null && previousStatus !== currentStatus) {
      insertAlert.run(rp.id, describeStatusChange(live.name, previousStatus, currentStatus));
      alertsCreated++;
    }

    updateStatus.run(currentStatus, rp.id);
  }

  return {
    checkedAt: new Date().toISOString(),
    playersChecked: rosterPlayers.length,
    newlyMatched,
    alertsCreated,
  };
}
