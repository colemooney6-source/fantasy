import cors from "cors";
import express from "express";
import { isScoringType } from "./positions.js";
import { fetchPlayers } from "./espn.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());

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

app.listen(PORT, () => {
  console.log(`Draft helper server listening on http://localhost:${PORT}`);
});
