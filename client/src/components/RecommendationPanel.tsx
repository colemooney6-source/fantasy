import type { Recommendation } from "../draft/recommend";

interface Props {
  recommendations: Recommendation[];
  onDraft: (playerId: number) => void;
  isMyTurn: boolean;
}

export default function RecommendationPanel({ recommendations, onDraft, isMyTurn }: Props) {
  return (
    <div className={isMyTurn ? "recommendation-panel panel-active" : "recommendation-panel"}>
      <h2>{isMyTurn ? "Your pick — top recommendations" : "Best available (if it were your pick)"}</h2>
      <ol className="recommendation-list">
        {recommendations.map((rec, i) => (
          <li key={rec.player.id} className={i === 0 ? "rec-item rec-top" : "rec-item"}>
            <div className="rec-header">
              <span className="rec-rank">#{rec.player.rank}</span>
              <span className="rec-name">{rec.player.name}</span>
              {rec.player.byeWeek && <span className="bye-badge">Bye {rec.player.byeWeek}</span>}
              <span className="rec-pos">
                {rec.player.position} · {rec.player.team}
              </span>
              <button type="button" className="draft-button" onClick={() => onDraft(rec.player.id)}>
                Draft
              </button>
            </div>
            <ul className="rec-reasons">
              {rec.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </li>
        ))}
        {recommendations.length === 0 && <li className="empty-row">No players available.</li>}
      </ol>
    </div>
  );
}
