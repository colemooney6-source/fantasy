import type { Player } from "./espn.js";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.'']/g, "")
    .replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, "")
    .trim();
}

/**
 * Matches a roster player's stored name (which may be abbreviated, e.g.
 * "L. Jackson") against the live ESPN player pool. Tries an exact
 * normalized-name match first, then falls back to last-name + first-initial,
 * only returning a match when exactly one live player qualifies — an
 * ambiguous or absent match is left for manual linking rather than guessed.
 */
export function matchPlayerName(rosterName: string, livePlayers: Player[]): Player | null {
  const target = normalize(rosterName);
  const exact = livePlayers.filter((p) => normalize(p.name) === target);
  if (exact.length === 1) return exact[0];

  const parts = target.split(/\s+/);
  if (parts.length < 2) return exact.length === 1 ? exact[0] : null;

  const firstInitial = parts[0][0];
  const lastName = parts[parts.length - 1];

  const byLastNameAndInitial = livePlayers.filter((p) => {
    const liveParts = normalize(p.name).split(/\s+/);
    if (liveParts.length < 2) return false;
    return liveParts[liveParts.length - 1] === lastName && liveParts[0][0] === firstInitial;
  });

  return byLastNameAndInitial.length === 1 ? byLastNameAndInitial[0] : null;
}
