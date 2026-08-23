import { useMemo, useState } from "react";
import type { Player } from "../types";

interface Props {
  players: Player[];
  onDraft: (player: Player) => void;
  draftButtonLabel: string;
}

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "D/ST", "K"];

export default function PlayerList({ players, onDraft, draftButtonLabel }: Props) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (position !== "ALL" && p.position !== position) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [players, query, position]);

  return (
    <div className="player-list">
      <div className="player-list-controls">
        <input
          type="search"
          placeholder="Search players…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="position-filters">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              className={pos === position ? "chip chip-active" : "chip"}
              onClick={() => setPosition(pos)}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div className="player-table-wrap">
        <table className="player-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th>Bye</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 150).map((p) => (
              <tr key={p.id} className={p.injuryStatus && p.injuryStatus !== "ACTIVE" ? "row-flag" : undefined}>
                <td>{p.rank}</td>
                <td>
                  {p.name}
                  {p.injuryStatus && p.injuryStatus !== "ACTIVE" && (
                    <span className="injury-badge" title={p.injuryStatus}>
                      {p.injuryStatus}
                    </span>
                  )}
                </td>
                <td>{p.position}</td>
                <td>{p.team}</td>
                <td>{p.byeWeek ?? "—"}</td>
                <td>
                  <button type="button" className="draft-button" onClick={() => onDraft(p)}>
                    {draftButtonLabel}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No players match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
