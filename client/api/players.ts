import type { VercelRequest, VercelResponse } from "./_lib/types.js";
import { isScoringType } from "./_lib/positions.js";
import { fetchPlayers } from "./_lib/espn.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    res.status(200).json({ year, scoring, players });
  } catch (err) {
    console.error("Failed to fetch players from ESPN:", err);
    res.status(502).json({
      error: "Could not fetch player data from ESPN. Their API may be temporarily unavailable or its shape may have changed.",
    });
  }
}
