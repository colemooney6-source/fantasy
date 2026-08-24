import { FLEX_ELIGIBLE, POSITION_MAP, type ScoringType } from "./positions.js";
import { PRO_TEAM_MAP } from "./proTeams.js";

export interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  rank: number;
  flexEligible: boolean;
  injuryStatus: string | null;
  byeWeek: number | null;
}

interface EspnDraftRank {
  rank: number;
  auctionValue?: number;
}

interface EspnPlayerEntry {
  id: number;
  fullName: string;
  defaultPositionId: number;
  proTeamId: number;
  injuryStatus?: string;
  draftRanksByRankType?: Record<string, EspnDraftRank>;
}

const ESPN_BASE_URL = process.env.ESPN_BASE_URL ?? "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";

const PLAYERS_URL = (year: number) =>
  `${ESPN_BASE_URL}/seasons/${year}/players?scoringPeriodId=0&view=kona_player_info`;

const TEAM_SCHEDULE_URL = (year: number) =>
  `${ESPN_BASE_URL}/seasons/${year}?view=proTeamSchedules`;

const ESPN_HEADERS_BASE = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (fantasy-draft-helper)",
};

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const playerCache = new Map<string, CacheEntry<Player[]>>();
const byeWeekCache = new Map<number, CacheEntry<Record<number, number>>>();

async function fetchByeWeeks(year: number): Promise<Record<number, number>> {
  const cached = byeWeekCache.get(year);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const res = await fetch(TEAM_SCHEDULE_URL(year), { headers: ESPN_HEADERS_BASE });
    if (!res.ok) throw new Error(`ESPN schedule request failed: ${res.status}`);
    const data = await res.json();
    const teams: Array<{ id: number; byeWeek?: number }> = data?.settings?.proTeams ?? [];
    const map: Record<number, number> = {};
    for (const team of teams) {
      if (typeof team.byeWeek === "number" && team.byeWeek > 0) {
        map[team.id] = team.byeWeek;
      }
    }
    byeWeekCache.set(year, { value: map, expiresAt: Date.now() + CACHE_TTL_MS });
    return map;
  } catch (err) {
    console.warn("Could not fetch bye weeks, continuing without them:", err);
    return {};
  }
}

export async function fetchPlayers(year: number, scoring: ScoringType): Promise<Player[]> {
  const cacheKey = `${year}:${scoring}`;
  const cached = playerCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const filter = {
    players: {
      limit: 600,
      sortDraftRanks: {
        sortPriority: 1,
        sortAsc: true,
        value: scoring,
      },
    },
  };

  const res = await fetch(PLAYERS_URL(year), {
    headers: {
      ...ESPN_HEADERS_BASE,
      "x-fantasy-filter": JSON.stringify(filter),
    },
  });

  if (!res.ok) {
    throw new Error(`ESPN players request failed: ${res.status} ${res.statusText}`);
  }

  const raw: EspnPlayerEntry[] = await res.json();
  const byeWeeks = await fetchByeWeeks(year);

  const players: Player[] = raw
    .map((entry) => {
      const ranks = entry.draftRanksByRankType ?? {};
      const rankInfo = ranks[scoring] ?? ranks["PPR"] ?? ranks["STANDARD"] ?? Object.values(ranks)[0];
      if (!rankInfo) return null;

      const position = POSITION_MAP[entry.defaultPositionId] ?? "UNKNOWN";
      const team = PRO_TEAM_MAP[entry.proTeamId] ?? "FA";

      const player: Player = {
        id: entry.id,
        name: entry.fullName,
        position,
        team,
        rank: rankInfo.rank,
        flexEligible: FLEX_ELIGIBLE.has(position),
        injuryStatus: entry.injuryStatus ?? null,
        byeWeek: byeWeeks[entry.proTeamId] ?? null,
      };
      return player;
    })
    .filter((p): p is Player => p !== null)
    .sort((a, b) => a.rank - b.rank);

  if (raw.length > 0 && players.length === 0) {
    throw new Error(
      "ESPN returned player data but none had rank info for this scoring format — their response shape may have changed.",
    );
  }

  playerCache.set(cacheKey, { value: players, expiresAt: Date.now() + CACHE_TTL_MS });
  return players;
}
