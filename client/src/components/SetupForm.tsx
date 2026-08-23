import { useState } from "react";
import type { RosterSlots, ScoringType, Settings } from "../types";
import { DEFAULT_ROSTER_SLOTS } from "../types";

interface Props {
  onSubmit: (settings: Settings) => void;
}

const SLOT_LABELS: Array<[keyof RosterSlots, string]> = [
  ["QB", "QB"],
  ["RB", "RB"],
  ["WR", "WR"],
  ["TE", "TE"],
  ["FLEX", "FLEX (RB/WR/TE)"],
  ["D/ST", "D/ST"],
  ["K", "K"],
  ["BENCH", "Bench"],
];

export default function SetupForm({ onSubmit }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [scoring, setScoring] = useState<ScoringType>("PPR");
  const [numTeams, setNumTeams] = useState(12);
  const [myPick, setMyPick] = useState(1);
  const [rosterSlots, setRosterSlots] = useState<RosterSlots>(DEFAULT_ROSTER_SLOTS);

  function updateSlot(key: keyof RosterSlots, value: number) {
    setRosterSlots((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      year,
      scoring,
      numTeams,
      myPick: Math.min(Math.max(1, myPick), numTeams),
      rosterSlots,
    });
  }

  return (
    <div className="setup-screen">
      <form className="setup-form" onSubmit={handleSubmit}>
        <h1>Fantasy Draft Helper</h1>
        <p className="subtitle">Set up your league, then track picks live to get pick-by-pick recommendations.</p>

        <div className="field-row">
          <label>
            Season
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </label>
          <label>
            Scoring
            <select value={scoring} onChange={(e) => setScoring(e.target.value as ScoringType)}>
              <option value="PPR">PPR</option>
              <option value="HALF_PPR">Half-PPR</option>
              <option value="STANDARD">Standard</option>
            </select>
          </label>
        </div>

        <div className="field-row">
          <label>
            Number of teams
            <input
              type="number"
              min={2}
              max={20}
              value={numTeams}
              onChange={(e) => setNumTeams(Number(e.target.value))}
            />
          </label>
          <label>
            My draft slot
            <input
              type="number"
              min={1}
              max={numTeams}
              value={myPick}
              onChange={(e) => setMyPick(Number(e.target.value))}
            />
          </label>
        </div>

        <fieldset>
          <legend>Roster spots</legend>
          <div className="roster-grid">
            {SLOT_LABELS.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min={0}
                  value={rosterSlots[key]}
                  onChange={(e) => updateSlot(key, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="primary-button">
          Start Draft
        </button>
      </form>
    </div>
  );
}
