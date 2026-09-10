import cors from "cors";
import express from "express";
import { isScoringType } from "./positions.js";
import { fetchPlayers } from "./espn.js";
import { db, type AlertRow, type RosterPlayerRow } from "./db.js";
import { runRosterCheck } from "./rosterCheck.js";
import { startScheduler } from "./scheduler.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CURRENT_YEAR = new Date().getFullYear();
const CHECK_INTERVAL_MINUTES = process.env.NEWS_CHECK_INTERVAL_MINUTES
  ? Number(process.env.NEWS_CHECK_INTERVAL_MINUTES)
  : 30;

app.use(cors());
app.use(express.json());

app.get("/api/players", async (req, res) => {
  const yearParam = req.query.year;
  const scoringParam = req.query.scoring;

  const year = typeof yearParam === "string" && /^\d{4}$/.test(yearParam)
    ? Number(yearParam)
    : new Date().getFullYear();

  const scoring = typeof scoringParam === "string" && isScoringType(scoringParam)
    ? scoringParam
    : "PPR";

  try {
    const players = await fetchPlayers(year, scoring);
    res.json({ year, scoring, players });
  } catch (err) {
    console.error("Failed to fetch players from ESPN:", err);
    res.status(502).json({
      error: "Could not fetch player data from ESPN. Their API may be temporarily unavailable or its shape may have changed.",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Roster (local SQLite) -------------------------------------------------

app.get("/api/roster", async (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM roster_players").all() as unknown as RosterPlayerRow[];
    const livePlayers = await fetchPlayers(CURRENT_YEAR, "PPR").catch(() => []);
    const liveById = new Map(livePlayers.map((p) => [p.id, p]));

    const roster = rows
      .map((row) => {
        const live = row.espn_player_id != null ? liveById.get(row.espn_player_id) : undefined;
        return {
          id: row.id,
          name: row.name,
          position: row.position,
          team: row.team,
          slotGroup: row.slot_group,
          slotLabel: row.slot_label,
          slotOrder: row.slot_order,
          matched: !!live,
          espnPlayerId: row.espn_player_id,
          rank: live?.rank ?? null,
          byeWeek: live?.byeWeek ?? null,
          injuryStatus: live?.injuryStatus ?? row.last_known_injury_status,
          lastYearAvgPoints: live?.lastYearAvgPoints ?? null,
          projectedAvgPoints: live?.projectedAvgPoints ?? null,
        };
      })
      .sort((a, b) => a.slotOrder - b.slotOrder);

    res.json({ roster });
  } catch (err) {
    console.error("Failed to load roster:", err);
    res.status(500).json({ error: "Could not load roster." });
  }
});

app.post("/api/roster", (req, res) => {
  const { name, position, team, slotGroup, slotLabel, slotOrder, espnPlayerId, injuryStatus } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!["starter", "bench", "ir"].includes(slotGroup)) {
    return res.status(400).json({ error: "slotGroup must be starter, bench, or ir" });
  }
  if (typeof slotLabel !== "string" || !slotLabel.trim()) {
    return res.status(400).json({ error: "slotLabel is required" });
  }

  const order = typeof slotOrder === "number" ? slotOrder : 0;

  const result = db
    .prepare(
      `INSERT INTO roster_players (name, position, team, slot_group, slot_label, slot_order, espn_player_id, last_known_injury_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .get(
      name,
      position ?? "UNKNOWN",
      team ?? null,
      slotGroup,
      slotLabel,
      order,
      typeof espnPlayerId === "number" ? espnPlayerId : null,
      typeof injuryStatus === "string" ? injuryStatus : null,
    ) as { id: number };

  res.status(201).json({ id: result.id });
});

app.patch("/api/roster/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });

  const { slotGroup, slotLabel, slotOrder, espnPlayerId } = req.body ?? {};

  const existing = db.prepare("SELECT * FROM roster_players WHERE id = ?").get(id) as
    | RosterPlayerRow
    | undefined;
  if (!existing) return res.status(404).json({ error: "not found" });

  const nextSlotGroup = typeof slotGroup === "string" ? slotGroup : existing.slot_group;
  if (!["starter", "bench", "ir"].includes(nextSlotGroup)) {
    return res.status(400).json({ error: "slotGroup must be starter, bench, or ir" });
  }
  const nextSlotLabel = typeof slotLabel === "string" ? slotLabel : existing.slot_label;
  const nextSlotOrder = typeof slotOrder === "number" ? slotOrder : existing.slot_order;
  const nextEspnPlayerId = typeof espnPlayerId === "number" ? espnPlayerId : existing.espn_player_id;

  db.prepare(
    "UPDATE roster_players SET slot_group = ?, slot_label = ?, slot_order = ?, espn_player_id = ? WHERE id = ?",
  ).run(nextSlotGroup, nextSlotLabel, nextSlotOrder, nextEspnPlayerId, id);

  res.json({ ok: true });
});

app.delete("/api/roster/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });
  db.prepare("DELETE FROM roster_players WHERE id = ?").run(id);
  res.json({ ok: true });
});

app.post("/api/roster/check-now", async (_req, res) => {
  try {
    const result = await runRosterCheck(CURRENT_YEAR);
    res.json(result);
  } catch (err) {
    console.error("Manual roster check failed:", err);
    res.status(502).json({ error: "Roster check failed — see server logs." });
  }
});

// --- Alerts ------------------------------------------------------------

app.get("/api/alerts", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT alerts.id, alerts.message, alerts.created_at, alerts.read,
              roster_players.name as player_name, roster_players.position as player_position
       FROM alerts
       JOIN roster_players ON roster_players.id = alerts.roster_player_id
       ORDER BY alerts.created_at DESC, alerts.id DESC`,
    )
    .all() as unknown as Array<
    AlertRow & { player_name: string; player_position: string }
  >;

  const alerts = rows.map((r) => ({
    id: r.id,
    message: r.message,
    createdAt: r.created_at,
    read: !!r.read,
    playerName: r.player_name,
    playerPosition: r.player_position,
  }));

  res.json({ alerts, unreadCount: alerts.filter((a) => !a.read).length });
});

app.post("/api/alerts/:id/read", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });
  db.prepare("UPDATE alerts SET read = 1 WHERE id = ?").run(id);
  res.json({ ok: true });
});

app.post("/api/alerts/read-all", (_req, res) => {
  db.prepare("UPDATE alerts SET read = 1 WHERE read = 0").run();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Draft helper server listening on http://localhost:${PORT}`);
  startScheduler(CURRENT_YEAR, CHECK_INTERVAL_MINUTES);
  console.log(`Roster news checks running every ${CHECK_INTERVAL_MINUTES} minute(s).`);
});
