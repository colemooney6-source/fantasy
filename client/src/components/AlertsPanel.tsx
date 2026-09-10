import { useState } from "react";
import type { RosterAlert } from "../rosterTypes";
import { checkRosterNow, markAlertRead, markAllAlertsRead } from "../rosterApi";

interface Props {
  alerts: RosterAlert[];
  unreadCount: number;
  onChanged: () => void;
}

export default function AlertsPanel({ alerts, unreadCount, onChanged }: Props) {
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  async function handleCheckNow() {
    setChecking(true);
    setCheckMessage(null);
    try {
      const result = await checkRosterNow();
      setCheckMessage(
        result.alertsCreated > 0
          ? `Found ${result.alertsCreated} new update${result.alertsCreated === 1 ? "" : "s"}.`
          : "No changes since the last check.",
      );
      onChanged();
    } catch (err) {
      setCheckMessage(err instanceof Error ? err.message : "Check failed.");
    } finally {
      setChecking(false);
    }
  }

  async function handleMarkRead(id: number) {
    await markAlertRead(id);
    onChanged();
  }

  async function handleMarkAllRead() {
    await markAllAlertsRead();
    onChanged();
  }

  return (
    <div className="alerts-panel">
      <div className="alerts-panel-header">
        <h2>
          Alerts {unreadCount > 0 && <span className="alerts-unread-badge">{unreadCount}</span>}
        </h2>
        <div className="alerts-panel-actions">
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
          <button type="button" className="primary-button" onClick={handleCheckNow} disabled={checking}>
            {checking ? "Checking…" : "Check for news now"}
          </button>
        </div>
      </div>

      {checkMessage && <p className="muted alerts-check-message">{checkMessage}</p>}

      <ul className="alerts-list">
        {alerts.map((a) => (
          <li key={a.id} className={a.read ? "alert-item" : "alert-item alert-unread"}>
            <div className="alert-item-body">
              <span className="rec-pos">{a.playerPosition}</span>
              <span>{a.message}</span>
            </div>
            <div className="alert-item-meta">
              <span className="muted">{new Date(a.createdAt.replace(" ", "T") + "Z").toLocaleString()}</span>
              {!a.read && (
                <button type="button" onClick={() => handleMarkRead(a.id)}>
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
        {alerts.length === 0 && <li className="empty-row">No alerts yet — check back after the next scheduled check.</li>}
      </ul>
    </div>
  );
}
