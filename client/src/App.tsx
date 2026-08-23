import { useEffect, useState } from "react";
import { fetchPlayers } from "./api";
import { pickInRound, round, teamOnClock } from "./draft/pickMath";
import DraftBoard from "./components/DraftBoard";
import SetupForm from "./components/SetupForm";
import { clearDraft, loadDraft, saveDraft } from "./storage";
import type { DraftedPick, Player, Settings } from "./types";
import "./App.css";

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [drafted, setDrafted] = useState<DraftedPick[]>([]);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadDraft();
    if (persisted) {
      setSettings(persisted.settings);
      setDrafted(persisted.drafted);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!settings || players) return;
    setLoading(true);
    setLoadError(null);
    fetchPlayers(settings.year, settings.scoring)
      .then(setPlayers)
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [settings, players]);

  useEffect(() => {
    if (settings && hydrated) saveDraft({ settings, drafted });
  }, [settings, drafted, hydrated]);

  function handleStart(newSettings: Settings) {
    setPlayers(null);
    setDrafted([]);
    setSettings(newSettings);
  }

  function handleDraftPlayer(player: Player) {
    if (!settings) return;
    setDrafted((prev) => {
      const overallPick = prev.length + 1;
      const pick: DraftedPick = {
        playerId: player.id,
        overallPick,
        round: round(overallPick, settings.numTeams),
        pickInRound: pickInRound(overallPick, settings.numTeams),
        byMe: teamOnClock(overallPick, settings.numTeams) === settings.myPick,
      };
      return [...prev, pick];
    });
  }

  function handleUndo() {
    setDrafted((prev) => prev.slice(0, -1));
  }

  function handleReset() {
    clearDraft();
    setSettings(null);
    setDrafted([]);
    setPlayers(null);
    setLoadError(null);
  }

  if (!hydrated) return null;

  if (!settings) {
    return <SetupForm onSubmit={handleStart} />;
  }

  if (loading || !players) {
    return (
      <div className="status-screen">
        {loadError ? (
          <>
            <p className="error-text">{loadError}</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setLoadError(null);
                setPlayers(null);
              }}
            >
              Retry
            </button>
            <button type="button" onClick={handleReset}>
              Back to setup
            </button>
          </>
        ) : (
          <p>Loading player rankings…</p>
        )}
      </div>
    );
  }

  return (
    <DraftBoard
      settings={settings}
      players={players}
      drafted={drafted}
      onDraftPlayer={handleDraftPlayer}
      onUndo={handleUndo}
      onReset={handleReset}
    />
  );
}
