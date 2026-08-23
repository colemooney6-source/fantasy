import { useMemo } from "react";
import type { DraftedPick, Player, Settings } from "../types";
import { pickInRound, round, teamOnClock } from "../draft/pickMath";
import { recommend } from "../draft/recommend";
import PickTracker from "./PickTracker";
import PlayerList from "./PlayerList";
import RecommendationPanel from "./RecommendationPanel";
import RosterPanel from "./RosterPanel";

interface Props {
  settings: Settings;
  players: Player[];
  drafted: DraftedPick[];
  onDraftPlayer: (player: Player) => void;
  onUndo: () => void;
  onReset: () => void;
}

const RECENT_WINDOW = 5;

export default function DraftBoard({ settings, players, drafted, onDraftPlayer, onUndo, onReset }: Props) {
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const draftedIds = useMemo(() => new Set(drafted.map((d) => d.playerId)), [drafted]);
  const available = useMemo(() => players.filter((p) => !draftedIds.has(p.id)), [players, draftedIds]);

  const myRoster = useMemo(
    () => drafted.filter((d) => d.byMe).map((d) => playerById.get(d.playerId)).filter((p): p is Player => !!p),
    [drafted, playerById],
  );

  const recentlyDrafted = useMemo(
    () =>
      drafted
        .slice(-RECENT_WINDOW)
        .map((d) => playerById.get(d.playerId))
        .filter((p): p is Player => !!p),
    [drafted, playerById],
  );

  const overallPick = drafted.length + 1;
  const currentRound = round(overallPick, settings.numTeams);
  const currentPickInRound = pickInRound(overallPick, settings.numTeams);
  const isMyTurn = teamOnClock(overallPick, settings.numTeams) === settings.myPick;

  const recommendations = useMemo(
    () => recommend(available, myRoster, settings.rosterSlots, recentlyDrafted),
    [available, myRoster, settings.rosterSlots, recentlyDrafted],
  );

  function handleDraft(playerId: number) {
    const player = playerById.get(playerId);
    if (player) onDraftPlayer(player);
  }

  return (
    <div className="draft-board">
      <PickTracker
        overallPick={overallPick}
        round={currentRound}
        pickInRound={currentPickInRound}
        numTeams={settings.numTeams}
        isMyTurn={isMyTurn}
        onUndo={onUndo}
        onReset={onReset}
        canUndo={drafted.length > 0}
      />

      <div className="draft-board-grid">
        <PlayerList players={available} onDraft={(p) => onDraftPlayer(p)} draftButtonLabel="Mark drafted" />

        <div className="draft-board-sidebar">
          <RecommendationPanel recommendations={recommendations} onDraft={handleDraft} isMyTurn={isMyTurn} />
          <RosterPanel myRoster={myRoster} rosterSlots={settings.rosterSlots} />
        </div>
      </div>
    </div>
  );
}
