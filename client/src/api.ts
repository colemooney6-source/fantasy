import type { Player, ScoringType } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function fetchPlayers(year: number, scoring: ScoringType): Promise<Player[]> {
  const res = await fetch(`${API_BASE}/api/players?year=${year}&scoring=${scoring}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.players as Player[];
}
