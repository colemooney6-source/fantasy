import { useMemo } from "react";
import type { DraftedPick, Player, Settings } from "../types";
import { EXACT_POSITIONS } from "../draft/roster";
import { buildTeamSummaries, gradeFor } from "../draft/teamStrength";

interface Props {
  settings: Settings;
  players: Player[];
  drafted: DraftedPick[];
}

export default function LeagueTeams({ settings, players, drafted }: Props) {
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const teams = useMemo(
    () => buildTeamSummaries(settings, drafted, playerById),
    [settings, drafted, playerById],
  );

  const maxValue = teams.reduce((max, t) => Math.max(max, t.totalValue), 0);
  const ranked = useMemo(() => [...teams].sort((a, b) => b.totalValue - a.totalValue), [teams]);

  return (
    <div className="league-teams">
      <div className="league-teams-header">
        <h2>League Strength</h2>
        <p className="muted">
          Teams ranked by total drafted value — sum of <code>max(0, 500 - rank)</code> across each
          team's picks. Grades are relative to the strongest team so far and update live.
        </p>
      </div>

      <ol className="league-team-list">
        {ranked.map((team, idx) => {
          const { score, letter } = gradeFor(team.totalValue, maxValue);
          return (
            <li
              key={team.slot}
              className={`league-team-card${team.isMe ? " league-team-card-me" : ""}`}
            >
              <div className="league-team-card-header">
                <span className="league-team-rank">#{idx + 1}</span>
                <span className="league-team-name">
                  Team {team.slot}
                  {team.isMe && <span className="me-badge">YOU</span>}
                </span>
                <span className="league-team-grade" data-tier={letter[0].toLowerCase()}>
                  {letter}
                </span>
                <span className="league-team-score muted">
                  {score}/100 &middot; {team.totalValue} pts
                </span>
              </div>

              <div className="league-team-slots">
                {EXACT_POSITIONS.map((pos) => (
                  <span key={pos} className="league-team-slot-chip">
                    {pos} {team.needs.filledCounts[pos]}/{settings.rosterSlots[pos]}
                  </span>
                ))}
                <span className="league-team-slot-chip">
                  FLEX {team.needs.flexUsed}/{settings.rosterSlots.FLEX}
                </span>
              </div>

              <ul className="league-team-roster">
                {team.roster.map((p) => (
                  <li key={p.id}>
                    <span className="rec-pos">{p.position}</span> {p.name}{" "}
                    <span className="muted">
                      ({p.team}, #{p.rank})
                    </span>
                  </li>
                ))}
                {team.roster.length === 0 && <li className="empty-row">No picks yet.</li>}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
