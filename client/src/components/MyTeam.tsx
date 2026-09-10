import { useEffect, useMemo, useState } from "react";
import { fetchPlayers } from "../api";
import {
  addRosterPlayer,
  fetchAlerts,
  fetchRoster,
  removeRosterPlayer,
  updateRosterSlot,
} from "../rosterApi";
import type { RosterAlert, RosterPlayer, SlotGroup } from "../rosterTypes";
import { STARTER_SLOT_ORDER } from "../rosterTypes";
import type { Player } from "../types";
import AlertsPanel from "./AlertsPanel";

const MOVE_OPTIONS: Array<{ slotGroup: SlotGroup; slotLabel: string; label: string }> = [
  ...STARTER_SLOT_ORDER.map((label) => ({ slotGroup: "starter" as const, slotLabel: label, label: `Start (${label})` })),
  { slotGroup: "bench", slotLabel: "BE", label: "Bench" },
  { slotGroup: "ir", slotLabel: "IR", label: "IR" },
];

function sortRoster(roster: RosterPlayer[]) {
  const starters = [...roster]
    .filter((p) => p.slotGroup === "starter")
    .sort((a, b) => {
      const ai = STARTER_SLOT_ORDER.indexOf(a.slotLabel);
      const bi = STARTER_SLOT_ORDER.indexOf(b.slotLabel);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.slotOrder - b.slotOrder;
    });
  const bench = [...roster].filter((p) => p.slotGroup === "bench").sort((a, b) => a.slotOrder - b.slotOrder);
  const ir = [...roster].filter((p) => p.slotGroup === "ir").sort((a, b) => a.slotOrder - b.slotOrder);
  return { starters, bench, ir };
}

function nextOrder(roster: RosterPlayer[], slotGroup: SlotGroup, slotLabel: string): number {
  const existing = roster.filter((p) => p.slotGroup === slotGroup && p.slotLabel === slotLabel);
  return existing.length === 0 ? 0 : Math.max(...existing.map((p) => p.slotOrder)) + 1;
}

interface RowProps {
  player: RosterPlayer;
  roster: RosterPlayer[];
  onMoved: () => void;
}

function RosterRow({ player, roster, onMoved }: RowProps) {
  async function handleMove(e: React.ChangeEvent<HTMLSelectElement>) {
    const [slotGroup, slotLabel] = e.target.value.split("|") as [SlotGroup, string];
    await updateRosterSlot(player.id, {
      slotGroup,
      slotLabel,
      slotOrder: nextOrder(roster, slotGroup, slotLabel),
    });
    onMoved();
  }

  async function handleRemove() {
    await removeRosterPlayer(player.id);
    onMoved();
  }

  return (
    <tr className={player.injuryStatus && player.injuryStatus !== "ACTIVE" ? "row-flag" : undefined}>
      <td>{player.slotLabel}</td>
      <td>
        {player.name}
        {!player.matched && (
          <span className="injury-badge" title="Couldn't match this player to live ESPN data yet">
            UNMATCHED
          </span>
        )}
        {player.injuryStatus && player.injuryStatus !== "ACTIVE" && (
          <span className="injury-badge" title={player.injuryStatus}>
            {player.injuryStatus}
          </span>
        )}
      </td>
      <td>{player.position}</td>
      <td>{player.team ?? "—"}</td>
      <td>{player.byeWeek != null ? <span className="bye-badge">Bye {player.byeWeek}</span> : "—"}</td>
      <td className="col-stat">{player.lastYearAvgPoints != null ? player.lastYearAvgPoints.toFixed(1) : "—"}</td>
      <td className="col-stat">{player.projectedAvgPoints != null ? player.projectedAvgPoints.toFixed(1) : "—"}</td>
      <td>
        <select value={`${player.slotGroup}|${player.slotLabel}`} onChange={handleMove}>
          {MOVE_OPTIONS.map((opt) => (
            <option key={`${opt.slotGroup}|${opt.slotLabel}`} value={`${opt.slotGroup}|${opt.slotLabel}`}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <button type="button" className="danger-button" onClick={handleRemove}>
          Remove
        </button>
      </td>
    </tr>
  );
}

function RosterTable({ title, players, roster, onMoved }: { title: string; players: RosterPlayer[]; roster: RosterPlayer[]; onMoved: () => void }) {
  return (
    <div className="player-list">
      <h2 className="my-team-section-title">{title}</h2>
      <div className="player-table-wrap">
        <table className="player-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th>Bye</th>
              <th className="col-stat">LY Avg</th>
              <th className="col-stat">Proj</th>
              <th>Move to</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <RosterRow key={p.id} player={p} roster={roster} onMoved={onMoved} />
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-row">
                  Nobody here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddPlayer({ pool, roster, onAdded }: { pool: Player[]; roster: RosterPlayer[]; onAdded: () => void }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const rosteredIds = new Set(roster.filter((p) => p.matched).map((p) => p.espnPlayerId));
    return pool.filter((p) => p.name.toLowerCase().includes(q) && !rosteredIds.has(p.id)).slice(0, 8);
  }, [query, pool, roster]);

  async function handleAdd(p: Player) {
    await addRosterPlayer({
      name: p.name,
      position: p.position,
      team: p.team,
      slotGroup: "bench",
      slotLabel: "BE",
      slotOrder: nextOrder(roster, "bench", "BE"),
      espnPlayerId: p.id,
      injuryStatus: p.injuryStatus,
    });
    setQuery("");
    onAdded();
  }

  return (
    <div className="add-player-box">
      <input
        type="search"
        placeholder="Add a player to your roster (adds to Bench)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className="add-player-results">
          {matches.map((p) => (
            <li key={p.id}>
              <span>
                {p.name} <span className="muted">({p.position} · {p.team})</span>
              </span>
              <button type="button" onClick={() => handleAdd(p)}>
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyTeam() {
  const [roster, setRoster] = useState<RosterPlayer[] | null>(null);
  const [alerts, setAlerts] = useState<RosterAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pool, setPool] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reloadRoster() {
    try {
      const [r, a] = await Promise.all([fetchRoster(), fetchAlerts()]);
      setRoster(r);
      setAlerts(a.alerts);
      setUnreadCount(a.unreadCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your team.");
    }
  }

  useEffect(() => {
    reloadRoster();
    const year = new Date().getFullYear();
    fetchPlayers(year, "PPR")
      .then(setPool)
      .catch(() => setPool([]));
  }, []);

  if (error) {
    return (
      <div className="status-screen">
        <p className="error-text">{error}</p>
        <p className="muted">
          This tab needs the local server running (<code>cd server && npm run dev</code>) — it's not part of the
          deployed draft helper, since it uses a local database and a scheduled background check.
        </p>
        <button type="button" className="primary-button" onClick={reloadRoster}>
          Retry
        </button>
      </div>
    );
  }

  if (!roster) {
    return (
      <div className="status-screen">
        <p>Loading your team…</p>
      </div>
    );
  }

  const { starters, bench, ir } = sortRoster(roster);

  return (
    <div className="my-team">
      <AddPlayer pool={pool} roster={roster} onAdded={reloadRoster} />

      <div className="my-team-grid">
        <div className="my-team-roster">
          <RosterTable title="Starters" players={starters} roster={roster} onMoved={reloadRoster} />
          <RosterTable title="Bench" players={bench} roster={roster} onMoved={reloadRoster} />
          <RosterTable title="IR" players={ir} roster={roster} onMoved={reloadRoster} />
        </div>
        <div className="my-team-sidebar">
          <AlertsPanel
            alerts={alerts}
            unreadCount={unreadCount}
            onChanged={reloadRoster}
          />
        </div>
      </div>
    </div>
  );
}
