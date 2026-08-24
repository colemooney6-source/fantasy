import type { Player, RosterSlots } from "../types";
import { computeRosterNeeds, EXACT_POSITIONS } from "../draft/roster";

interface Props {
  myRoster: Player[];
  rosterSlots: RosterSlots;
}

export default function RosterPanel({ myRoster, rosterSlots }: Props) {
  const needs = computeRosterNeeds(myRoster, rosterSlots);

  const byeWeekCounts = new Map<number, number>();
  for (const p of myRoster) {
    if (p.byeWeek) {
      byeWeekCounts.set(p.byeWeek, (byeWeekCounts.get(p.byeWeek) ?? 0) + 1);
    }
  }

  return (
    <div className="roster-panel">
      <h2>My Roster ({myRoster.length})</h2>
      <ul className="slot-summary">
        {EXACT_POSITIONS.map((pos) => (
          <li key={pos}>
            <span>{pos}</span>
            <span>
              {needs.filledCounts[pos]} / {rosterSlots[pos]}
            </span>
          </li>
        ))}
        <li>
          <span>FLEX</span>
          <span>
            {needs.flexUsed} / {rosterSlots.FLEX}
          </span>
        </li>
        <li>
          <span>Bench</span>
          <span>
            {needs.benchUsed} / {rosterSlots.BENCH}
          </span>
        </li>
      </ul>

      <ol className="my-roster-list">
        {myRoster.map((p) => (
          <li key={p.id}>
            <span className="rec-pos">{p.position}</span> {p.name}{" "}
            <span className="muted">({p.team})</span>
            {p.byeWeek && (
              <span
                className={
                  (byeWeekCounts.get(p.byeWeek) ?? 0) >= 2 ? "bye-badge bye-badge-warn" : "bye-badge"
                }
              >
                Bye {p.byeWeek}
              </span>
            )}
          </li>
        ))}
        {myRoster.length === 0 && <li className="empty-row">No players drafted yet.</li>}
      </ol>
    </div>
  );
}
