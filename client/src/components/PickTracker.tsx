interface Props {
  overallPick: number;
  round: number;
  pickInRound: number;
  numTeams: number;
  isMyTurn: boolean;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
}

export default function PickTracker({
  overallPick,
  round,
  pickInRound,
  numTeams,
  isMyTurn,
  onUndo,
  onReset,
  canUndo,
}: Props) {
  return (
    <header className="pick-tracker">
      <div className="pick-tracker-info">
        <div className="pick-tracker-title">
          Round {round}, Pick {pickInRound} of {numTeams}{" "}
          <span className="muted">(overall #{overallPick})</span>
        </div>
        {isMyTurn && <div className="your-turn-banner">YOUR PICK</div>}
      </div>
      <div className="pick-tracker-actions">
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          Undo last pick
        </button>
        <button type="button" onClick={onReset} className="danger-button">
          Reset draft
        </button>
      </div>
    </header>
  );
}
